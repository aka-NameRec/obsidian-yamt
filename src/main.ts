import {
  MarkdownPostProcessorContext,
  MarkdownRenderer,
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

export default class YamtPlugin extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor("yamt", async (source, el, ctx) => {
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
            await renderRow(thead, row, true, ctx);
          }
        }

        if (model.body?.length) {
          const tbody = table.createEl("tbody");
          for (const row of model.body) {
            await renderRow(tbody, row, false, ctx);
          }
        }
      } catch (e: unknown) {
        renderYamlError(el, e);
      }
    });
  }
}

/**
 * Renders a single table row with all its cells.
 * Applies cell attributes (colspan, rowspan, alignment, colors) and renders markdown content.
 * 
 * @param parent - Parent HTML element (thead or tbody)
 * @param row - Array of normalized cells to render
 * @param isHeader - True if rendering header cells (th), false for body cells (td)
 * @param ctx - Obsidian markdown processor context
 */
async function renderRow(
  parent: HTMLElement,
  row: Row,
  isHeader: boolean,
  ctx: MarkdownPostProcessorContext
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

    // Render markdown content
    const inner = el.createDiv();
    await MarkdownRenderer.renderMarkdown(cell.data, inner, ctx.sourcePath, ctx);
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