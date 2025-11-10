import yaml from "js-yaml";

/** Public types used in tests and main */
export type Align = "left" | "center" | "right";

/**
 * Normalized cell structure after processing.
 * All properties are properly typed and validated.
 */
export interface NormalizedCell {
  /** Cell content (supports markdown) */
  data: string;
  /** Text alignment */
  align?: Align;
  /** Text color (CSS value) */
  color?: string;
  /** Background color (CSS value) */
  bg?: string;
  /** Number of columns to span */
  colspan?: number;
  /** Number of rows to span */
  rowspan?: number;
  /** Column width (CSS value: px, %, em, etc.) */
  width?: string;
}

/**
 * Raw cell input from YAML (before normalization).
 * Can be a simple string or an object with various properties.
 */
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
            width?: string;
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
      width?: string;
      hts_colspan?: number | string;
      hts_rowspan?: number | string;
    };

/** A table row (after normalization) is an array of normalized cells */
export type Row = NormalizedCell[];

/**
 * Configuration options for table rendering.
 */
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

/**
 * Normalized table document structure.
 * This is the result of parsing and normalizing the raw YAML input.
 */
export interface YamtDoc {
  /** Table header rows (rendered in <thead>) */
  header?: Row[];
  /** Table body rows (rendered in <tbody>) */
  body?: Row[];
  /** Rendering options */
  options?: YamtOptions;
}

/** Custom error for YAML parsing failures */
export class YamtYamlError extends Error { 
  name = "YAMT/YamlError"; 
  constructor(msg: string, public inner?: unknown) {
    super(msg);
  }
}

/** Custom error for validation failures */
export class YamtValidationError extends Error { 
  name = "YAMT/ValidationError"; 
}

/**
 * Parses YAML source string and returns the parsed document.
 * Enhances js-yaml errors with precise location information.
 * 
 * @param source - YAML source string to parse
 * @returns Parsed YAML document (type unknown, requires normalization)
 * @throws {YamtYamlError} If YAML parsing fails
 */
export function parseYamlAny(source: string): unknown {
  try {
    return yaml.load(source);
  } catch (e: unknown) {
    const error = e as any;
    const loc = error?.mark 
      ? `line ${error.mark.line + 1}, column ${error.mark.column + 1}` 
      : null;
    const msg = error?.message ?? "Unknown YAML parsing error.";
    const hint = loc ? `${msg} (${loc})` : msg;
    throw new YamtYamlError(hint, e);
  }
}

/**
 * Normalizes raw YAML document into a structured table model.
 * Supports multiple YAML formats: header/body objects, flat matrices, section arrays.
 * 
 * @param doc - Raw YAML document (unknown type from parser)
 * @returns Normalized table document with header, body, and options
 * @throws {YamtValidationError} If document structure is invalid
 */
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
    "Invalid YAML structure for YAMT.",
    "Expected: object with `header`/`body` keys, section array, or flat matrix (array of arrays).",
    "Example:",
    "",
    "header:",
    "  - [ { data: \"📦 Product\", colspan: 2 }, { data: \"Price\" } ]",
    "  - [ { data: \"Category\" }, { data: \"Name\" }, { data: \"€\", align: right } ]",
    "body:",
    "  - [ \"**Electronics**\", \"`Dell XPS Laptop`\", { data: \"1299\", align: right } ]",
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

/**
 * Attempts to normalize an unknown value into an array of table rows.
 * Returns undefined if the value cannot be interpreted as rows.
 * 
 * @param rows - Potential row data from YAML
 * @returns Normalized rows or undefined if invalid
 */
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

/**
 * Normalizes an array of raw cells into a table row.
 * 
 * @param cells - Array of raw cell data
 * @returns Array of normalized cells
 */
export function normalizeRow(cells: RawCell[]): NormalizedCell[] {
  return cells.map(normalizeCell);
}

/**
 * Normalizes a single raw cell into a structured NormalizedCell object.
 * Handles various input formats: strings, objects, nested cell objects.
 * 
 * @param cell - Raw cell data (string or object)
 * @returns Normalized cell with validated properties
 */
export function normalizeCell(cell: RawCell): NormalizedCell {
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

/**
 * Normalizes a cell object, extracting and validating all properties.
 * Handles synonyms (e.g., hts_colspan for colspan).
 * 
 * @param obj - Raw cell object from YAML
 * @returns Normalized cell with typed properties
 */
export function normalizeCellObject(obj: Record<string, any>): NormalizedCell {
  const out: Partial<NormalizedCell> = {};
  if (obj.data != null) out.data = String(obj.data);
  const colspan = obj.colspan ?? obj.hts_colspan ?? obj.span;
  const rowspan = obj.rowspan ?? obj.hts_rowspan;
  if (colspan != null) out.colspan = toInt(colspan);
  if (rowspan != null) out.rowspan = toInt(rowspan);
  if (obj.align && ["left","center","right"].includes(obj.align)) out.align = obj.align as Align;
  if (obj.color) out.color = String(obj.color);
  if (obj.bg) out.bg = String(obj.bg);
  if (obj.width) out.width = String(obj.width);
  if (out.data == null) out.data = "";
  return out as NormalizedCell;
}

/**
 * Converts an unknown value to a positive integer.
 * Returns undefined if the value is not a valid positive number.
 * 
 * @param v - Value to convert to integer
 * @returns Positive integer or undefined
 */
export function toInt(v: unknown): number | undefined {
  const n = Number(v);
  if (Number.isFinite(n) && n >= 1) return Math.floor(n);
  return undefined;
}

/**
 * Type guard to check if a value is a non-null object (record).
 * 
 * @param v - Value to check
 * @returns True if value is an object (not null, not array)
 */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}