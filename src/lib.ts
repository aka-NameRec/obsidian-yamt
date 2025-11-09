import yaml from "js-yaml";

/** Public types used in tests and main */
export type Align = "left" | "center" | "right";

export type RawCell =
  | string
  | {
      cell?:
        | string
        | {
            data?: string;
            align?: Align;
            color?: string;
            bg?: string;
            colspan?: number | string;
            rowspan?: number | string;
            /** synonyms */
            hts_colspan?: number | string;
            hts_rowspan?: number | string;
          };
      data?: string;
      align?: Align;
      color?: string;
      bg?: string;
      colspan?: number | string;
      rowspan?: number | string;
      hts_colspan?: number | string;
      hts_rowspan?: number | string;
    };

export type Row = RawCell[];

export interface YamtOptions {
  /** If true, render all rows in <tbody> (no <thead>). */
  noThead?: boolean;
  /** If true and no explicit header is provided, treat the first row as header. Ignored when noThead=true. */
  assumeFirstRowHeader?: boolean;
  /** Optional table caption text. */
  caption?: string;
  /** Optional aria-label for <table>. */
  ariaLabel?: string;
}

export interface YamtDoc {
  header?: Row[];
  body?: Row[];
  options?: YamtOptions;
}

/** Errors */
export class YamtYamlError extends Error { name = "YAMT/YamlError"; constructor(msg: string, public inner?: any){super(msg);} }
export class YamtValidationError extends Error { name = "YAMT/ValidationError"; }

export function parseYamlAny(source: string): unknown {
  try {
    return yaml.load(source);
  } catch (e: any) {
    const loc = e?.mark ? `строка ${e.mark.line + 1}, столбец ${e.mark.column + 1}` : null;
    const msg = e?.message ?? "Неизвестная ошибка разбора YAML.";
    const hint = loc ? `${msg} (${loc})` : msg;
    throw new YamtYamlError(hint, e);
  }
}

export function normalizeToModel(doc: unknown): YamtDoc {
  if (isRecord(doc)) {
    const options = maybeOptions((doc as any).options);
    const header = maybeNormalizeRows((doc as any).header);
    const body = maybeNormalizeRows((doc as any).body);

    // If neither header nor body is provided, but user supplied "rows",
    // allow { rows: [...] } as flat matrix.
    const rows = maybeNormalizeRows((doc as any).rows);

    if (header?.length || body?.length) {
      return { header: header ?? [], body: body ?? [], options };
    }

    if (rows?.length) {
      return flatToDoc(rows, options);
    }
  }

  if (Array.isArray(doc)) {
    // Accept array of sections or flat matrix
    // Heuristics: if every item is an array or cell-like => treat as flat matrix
    if (doc.every((x) => Array.isArray(x))) {
      const rows = (doc as any[]).map((r) => normalizeRow(r as any[]));
      return flatToDoc(rows, {});
    }

    // Sections like [{header:[...]}, {body:[...]}] or {type, rows}
    let header: Row[] = [];
    let body: Row[] = [];
    let options: YamtOptions = {};

    for (const section of doc as any[]) {
      if (!isRecord(section)) continue;
      if (section.options && isRecord(section.options)) {
        options = { ...options, ...maybeOptions(section.options) };
      }
      if (section.header) header = maybeNormalizeRows(section.header) ?? header;
      if (section.body) body = maybeNormalizeRows(section.body) ?? body;
      if (section.type && section.rows) {
        const r = maybeNormalizeRows(section.rows) ?? [];
        if (section.type === "header") header = r;
        if (section.type === "body") body = r;
      }
    }
    if (header.length || body.length) return { header, body, options };
  }

  // Fallback: body as single row
  if (Array.isArray(doc)) {
    const asRow = normalizeRow(doc as any[]);
    return { body: [asRow], options: {} };
  }

  throw new YamtValidationError([
    "Неверная структура YAML для YAMT.",
    "Ожидается объект с ключами `header`/`body` или массив секций, либо плоская матрица (массив массивов).",
    "Пример:",
    "",
    "header:",
    "  - [ { data: \"📦 Продукт\", colspan: 2 }, { data: \"Цена\" } ]",
    "  - [ { data: \"Категория\" }, { data: \"Название\" }, { data: \"€\", align: right } ]",
    "body:",
    "  - [ \"**Техника**\", \"`Ноутбук Dell XPS`\", { data: \"1299\", align: right } ]",
  ].join("\n"));
}

function flatToDoc(rows: Row[], options?: YamtOptions): YamtDoc {
  const opts = options ?? {};
  if (opts.noThead) {
    return { body: rows, options: opts };
  }
  if (opts.assumeFirstRowHeader) {
    return { header: [rows[0]], body: rows.slice(1), options: opts };
  }
  return { body: rows, options: opts };
}

function maybeOptions(v: unknown): YamtOptions {
  const out: YamtOptions = {};
  if (!isRecord(v)) return out;
  if ("noThead" in v) out.noThead = !!(v as any).noThead;
  if ("assumeFirstRowHeader" in v) out.assumeFirstRowHeader = !!(v as any).assumeFirstRowHeader;
  if ("caption" in v && (v as any).caption != null) out.caption = String((v as any).caption);
  if ("ariaLabel" in v && (v as any).ariaLabel != null) out.ariaLabel = String((v as any).ariaLabel);
  return out;
}

export function maybeNormalizeRows(rows: unknown): Row[] | undefined {
  if (!rows) return undefined;
  if (!Array.isArray(rows)) return undefined;
  const result: Row[] = [];
  for (const r of rows) {
    if (Array.isArray(r)) { result.push(normalizeRow(r)); continue; }
    if (isRecord(r) && Array.isArray((r as any).row)) { result.push(normalizeRow((r as any).row)); continue; }
    result.push(normalizeRow([r as any]));
  }
  return result;
}

export function normalizeRow(cells: RawCell[]): Row {
  return cells.map(normalizeCell);
}

export function normalizeCell(cell: RawCell): RawCell {
  if (typeof cell === "string") return { data: cell };
  if (isRecord(cell)) {
    if ("cell" in cell) {
      const inner = (cell as any).cell;
      if (typeof inner === "string") return { data: inner };
      if (isRecord(inner)) return normalizeCellObject(inner);
    }
    return normalizeCellObject(cell as Record<string, any>);
  }
  return { data: String(cell ?? "") };
}

export function normalizeCellObject(obj: Record<string, any>): any {
  const out: Record<string, any> = {};
  if (obj.data != null) out.data = String(obj.data);
  const colspan = obj.colspan ?? obj.hts_colspan ?? obj.span;
  const rowspan = obj.rowspan ?? obj.hts_rowspan;
  if (colspan != null) out.colspan = toInt(colspan);
  if (rowspan != null) out.rowspan = toInt(rowspan);
  if (obj.align && ["left","center","right"].includes(obj.align)) out.align = obj.align;
  if (obj.color) out.color = String(obj.color);
  if (obj.bg) out.bg = String(obj.bg);
  if (out.data == null) out.data = "";
  return out;
}

export function toInt(v: unknown): number | undefined {
  const n = Number(v);
  if (Number.isFinite(n) && n >= 1) return Math.floor(n);
  return undefined;
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}