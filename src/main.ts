import {
  MarkdownPostProcessorContext,
  MarkdownRenderer,
  Plugin,
} from "obsidian";
import {
  parseYamlAny,
  normalizeToModel,
  normalizeCell,
  Row,
  YamtYamlError,
  YamtValidationError,
  isRecord,
} from "./lib";

export default class YamtPlugin extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor("yamt", async (source, el, ctx) => {
      try {
        const doc = parseYamlAny(source);
        const model = normalizeToModel(doc);

        if (!model.header?.length && !model.body?.length) {
          throw new YamtValidationError(
            "Не обнаружено ни одной строки таблицы (header/body пусты)."
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
      } catch (e: any) {
        renderYamlError(el, e);
      }
    });
  }
}

async function renderRow(
  parent: HTMLElement,
  row: Row,
  isHeader: boolean,
  ctx: MarkdownPostProcessorContext
) {
  const tr = parent.createEl("tr");
  for (const rawCell of row) {
    const cell = normalizeCell(rawCell);
    const el = tr.createEl(isHeader ? "th" : "td");

    const colSpan = (cell as any).colspan as number | undefined;
    const rowSpan = (cell as any).rowspan as number | undefined;
    if (colSpan && colSpan > 1) el.setAttr("colspan", String(colSpan));
    if (rowSpan && rowSpan > 1) el.setAttr("rowspan", String(rowSpan));

    const align = (cell as any).align as "left" | "center" | "right" | undefined;
    if (align) el.style.textAlign = align;

    const color = (cell as any).color as string | undefined;
    const bg = (cell as any).bg as string | undefined;
    if (color) el.style.color = color;
    if (bg) el.style.backgroundColor = bg;

    const data = (cell as any).data ?? "";
    const inner = el.createDiv();
    await MarkdownRenderer.renderMarkdown(String(data), inner, ctx.sourcePath, ctx);
  }
}

/** === Ошибки и вывод === */
class YamtErrorBox {
  static render(container: HTMLElement, title: string, lines: string[]) {
    const wrap = container.createDiv({ cls: "yamt-error" });
    const tt = document.createElement("div");
    tt.innerHTML = `<strong>${title}</strong>`;
    wrap.appendChild(tt);
    wrap.appendChild(document.createElement("pre")).textContent = lines.join("\n");
  }
}

function renderYamlError(container: HTMLElement, e: any) {
  const lines: string[] = [];
  let title = "YAMT: ошибка";

  if (e instanceof YamtYamlError) {
    title = "YAMT: ошибка разбора YAML";
    lines.push(e.message ?? "Неизвестная ошибка.");
    const mark = (e as any).inner?.mark || e?.mark;
    if (mark && Number.isFinite(mark.line) && Number.isFinite(mark.column)) {
      lines.push(`Место: строка ${mark.line + 1}, столбец ${mark.column + 1}`);
    }
  } else if (e instanceof YamtValidationError) {
    title = "YAMT: ошибка валидации";
    lines.push(e.message ?? "Неверная структура данных.");
    lines.push("");
    lines.push("См. README и примеры использования.");
  } else if (e && e.message) {
    lines.push(String(e.message));
  } else {
    lines.push("Неизвестная ошибка.");
  }
  YamtErrorBox.render(container, title, lines);
}