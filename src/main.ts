import {
  App,
  Component,
  Editor,
  MarkdownPostProcessorContext,
  MarkdownRenderer,
  Notice,
  Plugin,
} from "obsidian";
import {
  parseYamlAny,
  normalizeToModel,
  NormalizedCell,
  Row,
  YamtYamlError,
  YamtValidationError,
} from "./lib";
import { parseTableData } from "./clipboard";
import { convertToYamt } from "./converters";

export default class YamtPlugin extends Plugin {
  async onload() {
    // Register processor for ```yamt code blocks (original syntax)
    this.registerMarkdownCodeBlockProcessor("yamt", async (source, el, ctx) => {
      await renderYamtFromSource(this.app, source, el, ctx, this);
    });

    // Register processor for ```yaml blocks with # -yamt- comment marker
    this.registerMarkdownCodeBlockProcessor("yaml", async (source, el, ctx) => {
      // Skip frontmatter - check if parent has frontmatter class
      // Frontmatter should not be rendered in reading view
      if (el.parentElement?.hasClass('frontmatter') || 
          el.parentElement?.hasClass('mod-frontmatter')) {
        // This is frontmatter - don't render anything (Obsidian hides it by default)
        return;
      }
      
      // Check if first line is a YAML comment with -yamt- marker
      const lines = source.split('\n');
      const firstLine = lines[0]?.trim() || '';
      
      // Check for YAML comment: # -yamt- or #-yamt-
      const isYamtMarker = firstLine === '# -yamt-' || firstLine === '#-yamt-';
      
      if (isYamtMarker) {
        // This is a YAMT table! Render it as table
        await renderYamtFromSource(this.app, source, el, ctx, this);
      } else {
        // Regular YAML block - render as code block with syntax highlighting
        const pre = el.createEl('pre');
        const code = pre.createEl('code', { cls: 'language-yaml' });
        code.textContent = source;
      }
    });

    // Command: Paste table with header
    this.addCommand({
      id: 'paste-table-with-header',
      name: 'Paste table from clipboard (with header)',
      editorCallback: (editor: Editor) => {
        pasteTableAsYamt(editor, true);
      }
    });

    // Command: Paste table body only
    this.addCommand({
      id: 'paste-table-body-only',
      name: 'Paste table from clipboard (body only)',
      editorCallback: (editor: Editor) => {
        pasteTableAsYamt(editor, false);
      }
    });
  }
}

/** === Clipboard Table Paste === */

/**
 * Pastes table data from clipboard as YAMT format.
 * Reads clipboard text, parses table structure, converts to YAMT, and inserts at cursor.
 * 
 * @param editor - Obsidian editor instance
 * @param withHeader - If true, first row becomes header section
 */
async function pasteTableAsYamt(editor: Editor, withHeader: boolean): Promise<void> {
  try {
    // Read text from clipboard
    const clipboardText = await navigator.clipboard.readText();
    
    if (!clipboardText.trim()) {
      new Notice('Clipboard is empty');
      return;
    }

    // Parse table data
    const rows = parseTableData(clipboardText);
    
    if (rows.length === 0) {
      new Notice('No table data found in clipboard');
      return;
    }

    // Convert to YAMT format
    const yamtText = convertToYamt(rows, withHeader);

    // Insert at current cursor position
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

/**
 * Renders YAMT table from YAML source code.
 * Used by both ```yamt blocks and ```yaml blocks with # -yamt- marker.
 * 
 * @param app - Obsidian app instance
 * @param source - YAML source code
 * @param el - Container element to render into
 * @param ctx - Markdown processor context
 * @param component - Component for lifecycle management
 */
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

    // caption (optional)
    if (model.options?.caption) {
      const cap = table.createEl("caption");
      cap.textContent = model.options.caption;
    }

    const noThead = !!model.options?.noThead;

    if (!noThead && model.header?.length) {
      const thead = table.createEl("thead");
      for (const row of model.header) {
        await renderRow(app, thead, row, true, ctx, component);
      }
    }

    if (model.body?.length) {
      const tbody = table.createEl("tbody");
      for (const row of model.body) {
        await renderRow(app, tbody, row, false, ctx, component);
      }
    }
  } catch (e: unknown) {
    renderYamlError(el, e);
  }
}

/** === Table Rendering === */

/**
 * Renders a single table row with all its cells.
 * Applies cell attributes (colspan, rowspan, alignment, colors) and renders markdown content.
 * 
 * @param app - Obsidian app instance
 * @param parent - Parent HTML element (thead or tbody)
 * @param row - Array of normalized cells to render
 * @param isHeader - True if rendering header cells (th), false for body cells (td)
 * @param ctx - Obsidian markdown processor context
 * @param component - Component for lifecycle management
 */
async function renderRow(
  app: App,
  parent: HTMLElement,
  row: Row,
  isHeader: boolean,
  ctx: MarkdownPostProcessorContext,
  component: Component
) {
  const tr = parent.createEl("tr");
  for (const cell of row) {
    const el = tr.createEl(isHeader ? "th" : "td");

    // Apply colspan and rowspan attributes
    if (cell.colspan && cell.colspan > 1) {
      el.setAttr("colspan", String(cell.colspan));
    }
    if (cell.rowspan && cell.rowspan > 1) {
      el.setAttr("rowspan", String(cell.rowspan));
    }

    // Apply alignment
    if (cell.align) {
      el.style.textAlign = cell.align;
    }

    // Apply colors
    if (cell.color) {
      el.style.color = cell.color;
    }
    if (cell.bg) {
      el.style.backgroundColor = cell.bg;
    }

    // Apply width (typically for header cells to control column width)
    if (cell.width) {
      el.style.width = cell.width;
    }

    // Render markdown content
    const inner = el.createDiv();
    await MarkdownRenderer.render(app, cell.data, inner, ctx.sourcePath, component);
  }
}

/** === Error Display === */

/**
 * Helper class for rendering error messages in the UI.
 */
class YamtErrorBox {
  /**
   * Renders an error message box with a title and multiple lines of detail.
   * 
   * @param container - Parent HTML element for the error box
   * @param title - Error title (displayed in bold)
   * @param lines - Array of error detail lines
   */
  static render(container: HTMLElement, title: string, lines: string[]) {
    const wrap = container.createDiv({ cls: "yamt-error" });
    const tt = document.createElement("div");
    tt.innerHTML = `<strong>${title}</strong>`;
    wrap.appendChild(tt);
    wrap.appendChild(document.createElement("pre")).textContent = lines.join("\n");
  }
}

/**
 * Renders YAML parsing or validation errors in a user-friendly format.
 * Extracts location information from YAML errors when available.
 * 
 * @param container - HTML element to render the error into
 * @param e - Error object (can be YamtYamlError, YamtValidationError, or generic Error)
 */
function renderYamlError(container: HTMLElement, e: unknown) {
  const lines: string[] = [];
  let title = "YAMT: Error";

  if (e instanceof YamtYamlError) {
    title = "YAMT: YAML Parsing Error";
    lines.push(e.message ?? "Unknown error.");
    // Extract location from inner js-yaml error if available
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