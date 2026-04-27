import {
  App,
  Component,
  Editor,
  MarkdownPostProcessorContext,
  MarkdownRenderer,
  Notice,
  Plugin,
  TFile,
  WorkspaceLeaf,
} from "obsidian";
import {
  parseYamlAny,
  normalizeToModel,
  NormalizedCell,
  Row,
  Align,
  YamtYamlError,
  YamtValidationError,
} from "./lib";
import { parseTableData } from "./clipboard";
import { convertToYamt, ImportOptions } from "./converters";
import { ImportModal, DEFAULT_IMPORT_OPTIONS } from "./ImportModal";

interface YamtSettings {
  withHeader: boolean;
  importAlignment: boolean;
  promoteStylesToHeader: boolean;
}

const DEFAULT_SETTINGS: YamtSettings = {
  withHeader: DEFAULT_IMPORT_OPTIONS.withHeader,
  importAlignment: DEFAULT_IMPORT_OPTIONS.importAlignment,
  promoteStylesToHeader: DEFAULT_IMPORT_OPTIONS.promoteStylesToHeader,
};

export default class YamtPlugin extends Plugin {
  settings: YamtSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerMarkdownCodeBlockProcessor("yamt", async (source, el, ctx) => {
      await renderYamtFromSource(this.app, source, el, ctx, this);
    });

    this.registerMarkdownCodeBlockProcessor("yaml", async (source, el, ctx) => {
      if (el.parentElement?.hasClass('frontmatter') ||
          el.parentElement?.hasClass('mod-frontmatter')) {
        return;
      }

      const lines = source.split('\n');
      const firstLine = lines[0]?.trim() || '';

      const isYamtMarker = firstLine === '# -yamt-' || firstLine === '#-yamt-';

      if (isYamtMarker) {
        await renderYamtFromSource(this.app, source, el, ctx, this);
      } else {
        const pre = el.createEl('pre');
        const code = pre.createEl('code', { cls: 'language-yaml' });
        code.textContent = source;
      }
    });

    this.addCommand({
      id: 'paste-table-from-clipboard',
      name: 'Paste table from clipboard',
      editorCallback: (editor: Editor) => {
        this.openImportModal(editor);
      },
    });

    this.addCommand({
      id: 'open-help',
      name: 'Open help',
      callback: () => {
        this.openHelp();
      },
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private openImportModal(editor: Editor): void {
    const modal = new ImportModal(this.app, this, async (opts: ImportOptions) => {
      this.settings.withHeader = opts.withHeader;
      this.settings.importAlignment = opts.importAlignment;
      this.settings.promoteStylesToHeader = opts.promoteStylesToHeader;
      await this.saveSettings();
      await pasteTableAsYamt(editor, opts);
    });
    modal.open();
  }

  private async openHelp(): Promise<void> {
    const helpVaultPath = 'yamt-help.md';
    const adapter = this.app.vault.adapter as any;
    const basePath: string = adapter.getBasePath?.() ?? '';
    const helpFsPath = basePath + '/.obsidian/plugins/yamt/docs/help.md';

    let helpContent: string;
    try {
      const fs = require('fs');
      helpContent = fs.readFileSync(helpFsPath, 'utf-8');
    } catch {
      helpContent = FALLBACK_HELP;
    }

    let file = this.app.vault.getAbstractFileByPath(helpVaultPath);
    if (file instanceof TFile) {
      await this.app.vault.modify(file, helpContent);
    } else {
      file = await this.app.vault.create(helpVaultPath, helpContent);
    }

    const existing = this.app.workspace.getLeavesOfType('markdown')
      .find((leaf: WorkspaceLeaf) => {
        const vf = (leaf.view as any).file;
        return vf?.path === helpVaultPath;
      });

    if (existing) {
      this.app.workspace.setActiveLeaf(existing, { focus: true });
      return;
    }

    const leaf = this.app.workspace.getLeaf('tab');
    await leaf.openFile(file as TFile, { state: { mode: 'preview' } });
  }

  // Kept for backward-compatible type reference
  _convertOptions: ImportOptions | undefined;
}

async function pasteTableAsYamt(editor: Editor, opts: ImportOptions): Promise<void> {
  try {
    const clipboardText = await navigator.clipboard.readText();

    if (!clipboardText.trim()) {
      new Notice('Clipboard is empty');
      return;
    }

    const rows = parseTableData(clipboardText);

    if (rows.length === 0) {
      new Notice('No table data found in clipboard');
      return;
    }

    const yamtText = convertToYamt(rows, opts);

    const cursor = editor.getCursor();
    editor.replaceRange(yamtText, cursor);

    new Notice(`Table inserted: ${rows.length} rows, ${rows[0]?.length ?? 0} columns`);

  } catch (error) {
    console.error('YAMT paste error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    new Notice(`Error pasting table: ${message}`);
  }
}

/** === YAMT Rendering === */

async function renderYamtFromSource(
  app: App,
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  component: Component
): Promise<void> {
  try {
    const doc = parseYamlAny(source);
    const model = normalizeToModel(doc);

    if (!model.header?.length && !model.body?.length) {
      throw new YamtValidationError(
        "No table rows detected (header/body are empty)."
      );
    }

    const table = el.createEl("table", { cls: "yamt-table" });
    if (model.options?.ariaLabel) table.setAttr("aria-label", model.options.ariaLabel);

    if (model.options?.caption) {
      const cap = table.createEl("caption");
      cap.textContent = model.options.caption;
    }

    const noThead = !!model.options?.noThead;

    let columnAlignments: (Align | undefined)[] = [];
    if (!noThead && model.header?.length) {
      const thead = table.createEl("thead");
      columnAlignments = await renderHeaderRows(app, thead, model.header, ctx, component);
    }

    if (model.body?.length) {
      const tbody = table.createEl("tbody");
      for (const row of model.body) {
        await renderRow(app, tbody, row, false, ctx, component, columnAlignments);
      }
    }
  } catch (e: unknown) {
    renderYamlError(el, e);
  }
}

/** === Table Rendering === */

async function renderHeaderRows(
  app: App,
  thead: HTMLElement,
  headerRows: Row[],
  ctx: MarkdownPostProcessorContext,
  component: Component
): Promise<(Align | undefined)[]> {
  const columnAlignments: (Align | undefined)[] = [];

  const occupiedColumns: Map<number, number>[] = [];

  for (let rowIndex = 0; rowIndex < headerRows.length; rowIndex++) {
    const row = headerRows[rowIndex];
    occupiedColumns[rowIndex] = new Map();

    if (rowIndex > 0) {
      const prevOccupied = occupiedColumns[rowIndex - 1];
      for (const [colIndex, remainingRows] of prevOccupied.entries()) {
        if (remainingRows > 1) {
          occupiedColumns[rowIndex].set(colIndex, remainingRows - 1);
        }
      }
    }

    await renderRow(app, thead, row, true, ctx, component, columnAlignments, occupiedColumns[rowIndex]);

    let currentColumnIndex = 0;
    for (const cell of row) {
      while (occupiedColumns[rowIndex].has(currentColumnIndex)) {
        currentColumnIndex++;
      }

      const colspan = cell.colspan || 1;
      const rowspan = cell.rowspan || 1;
      const colalign = cell.colalign;

      if (colalign) {
        for (let i = 0; i < colspan; i++) {
          columnAlignments[currentColumnIndex + i] = colalign;
        }
      }

      if (rowspan > 1) {
        for (let i = 0; i < colspan; i++) {
          occupiedColumns[rowIndex].set(currentColumnIndex + i, rowspan);
        }
      }

      currentColumnIndex += colspan;
    }
  }

  return columnAlignments;
}

async function renderRow(
  app: App,
  parent: HTMLElement,
  row: Row,
  isHeader: boolean,
  ctx: MarkdownPostProcessorContext,
  component: Component,
  columnAlignments?: (Align | undefined)[] | null,
  occupiedColumns?: Map<number, number>
) {
  const tr = parent.createEl("tr");
  let currentColumnIndex = 0;

  for (const cell of row) {
    if (occupiedColumns) {
      while (occupiedColumns.has(currentColumnIndex)) {
        currentColumnIndex++;
      }
    }

    const el = tr.createEl(isHeader ? "th" : "td");

    if (cell.colspan && cell.colspan > 1) {
      el.setAttr("colspan", String(cell.colspan));
    }
    if (cell.rowspan && cell.rowspan > 1) {
      el.setAttr("rowspan", String(cell.rowspan));
    }

    let effectiveAlign = cell.align;
    if (!effectiveAlign) {
      if (cell.colalign) {
        effectiveAlign = cell.colalign;
      } else if (columnAlignments && columnAlignments.length > currentColumnIndex) {
        effectiveAlign = columnAlignments[currentColumnIndex];
      }
    }

    if (effectiveAlign) {
      el.style.textAlign = effectiveAlign;
    }

    if (cell.color) {
      el.style.color = cell.color;
    }
    if (cell.bg) {
      el.style.backgroundColor = cell.bg;
    }

    if (cell.width) {
      el.style.width = cell.width;
    }

    const inner = el.createDiv();
    await MarkdownRenderer.render(app, cell.data, inner, ctx.sourcePath, component);

    currentColumnIndex += (cell.colspan || 1);
  }
}

/** === Error Display === */

class YamtErrorBox {
  static render(container: HTMLElement, title: string, lines: string[]) {
    const wrap = container.createDiv({ cls: "yamt-error" });
    const tt = document.createElement("div");
    tt.innerHTML = `<strong>${title}</strong>`;
    wrap.appendChild(tt);
    wrap.appendChild(document.createElement("pre")).textContent = lines.join("\n");
  }
}

function renderYamlError(container: HTMLElement, e: unknown) {
  const lines: string[] = [];
  let title = "YAMT: Error";

  if (e instanceof YamtYamlError) {
    title = "YAMT: YAML Parsing Error";
    lines.push(e.message ?? "Unknown error.");
    const inner = e.inner as any;
    const mark = inner?.mark;
    if (mark && Number.isFinite(mark.line) && Number.isFinite(mark.column)) {
      lines.push(`Location: line ${mark.line + 1}, column ${mark.column + 1}`);
    }
  } else if (e instanceof YamtValidationError) {
    title = "YAMT: Validation Error";
    lines.push(e.message ?? "Invalid data structure.");
    lines.push("");
    lines.push("See README for valid YAML structure and usage examples.");
  } else if (e instanceof Error) {
    lines.push(e.message);
  } else {
    lines.push("Unknown error.");
  }

  YamtErrorBox.render(container, title, lines);
}

/** === Help Fallback === */

const FALLBACK_HELP = [
  '# YAMT — Help',
  '',
  'See documentation at: https://github.com/shtirliz/obsidian-yamt',
].join('\n');
