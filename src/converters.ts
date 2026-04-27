/**
 * Converts parsed table data to YAMT format.
 * Supports multiline cells using YAML literal style (|).
 */

import { isNumber } from './clipboard';

export interface ImportOptions {
  withHeader: boolean;
  importAlignment: boolean;
  promoteStylesToHeader: boolean;
}

interface ParsedCell {
  data: string;
  align?: 'left' | 'center' | 'right';
  colalign?: 'left' | 'center' | 'right';
  isMultiline: boolean;
}

/**
 * Converts 2D array of cells to YAMT code block.
 *
 * @param rows - Parsed table rows
 * @param optionsOrHeader - ImportOptions object, or a boolean for backward compatibility
 * @returns YAMT formatted string ready to insert
 */
export function convertToYamt(
  rows: string[][],
  optionsOrHeader: boolean | ImportOptions
): string {
  const opts: ImportOptions = typeof optionsOrHeader === 'boolean'
    ? { withHeader: optionsOrHeader, importAlignment: true, promoteStylesToHeader: false }
    : optionsOrHeader;

  const parsedRows = rows.map(row => row.map(cell => parseCell(cell, opts.importAlignment)));

  if (opts.withHeader && parsedRows.length > 0) {
    const headerCells = parsedRows[0];
    const bodyRows = parsedRows.slice(1);

    if (opts.promoteStylesToHeader && bodyRows.length > 0) {
      promoteColumnAlignments(headerCells, bodyRows);
    }

    return buildYamtBlock(headerCells, bodyRows);
  }

  return buildYamtBlock(null, parsedRows);
}

function parseCell(raw: string, importAlignment: boolean): ParsedCell {
  const trimmed = raw.trim();
  const isMultiline = trimmed.includes('\n');

  if (!importAlignment) {
    return { data: trimmed, isMultiline };
  }

  if (isMultiline) {
    const lines = trimmed.split('\n').filter(line => line.trim());
    if (lines.length > 0 && lines.every(line => isNumber(line))) {
      return { data: trimmed, align: 'right', isMultiline: true };
    }
    return { data: trimmed, isMultiline: true };
  }

  if (isNumber(trimmed)) {
    return { data: trimmed, align: 'right', isMultiline: false };
  }

  return { data: trimmed, isMultiline: false };
}

/**
 * For each column: if all body cells share the same alignment,
 * move it to the header cell as colalign and strip from body cells.
 */
function promoteColumnAlignments(
  headerCells: ParsedCell[],
  bodyRows: ParsedCell[][]
): void {
  const colCount = Math.max(headerCells.length, ...bodyRows.map(r => r.length));

  for (let col = 0; col < colCount; col++) {
    const bodyAligns = bodyRows
      .map(row => row[col]?.align)
      .filter((a): a is 'left' | 'center' | 'right' => a !== undefined);

    if (bodyAligns.length === 0) continue;

    const allSame = bodyAligns.length >= 1
      && bodyRows.every(row => {
        const cell = row[col];
        if (!cell) return true;
        return cell.align === bodyAligns[0];
      });

    if (!allSame) continue;

    const commonAlign = bodyAligns[0];

    if (col < headerCells.length && !headerCells[col].isMultiline) {
      headerCells[col] = {
        ...headerCells[col],
        colalign: commonAlign,
      };
    }

    for (const row of bodyRows) {
      if (col < row.length && row[col]) {
        const { align: _, ...rest } = row[col];
        row[col] = rest;
      }
    }
  }
}

function buildYamtBlock(
  headerCells: ParsedCell[] | null,
  bodyRows: ParsedCell[][]
): string {
  const lines: string[] = [];

  lines.push('```yamt');

  if (headerCells) {
    lines.push('header:');
    lines.push(...formatRow(headerCells, '  '));
  }

  if (bodyRows.length > 0) {
    lines.push('body:');
    for (const row of bodyRows) {
      lines.push(...formatRow(row, '  '));
    }
  }

  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

function formatRow(cells: ParsedCell[], baseIndent: string): string[] {
  const hasMultiline = cells.some(c => c.isMultiline);

  if (!hasMultiline) {
    const formatted = cells.map(c => formatInlineCell(c));
    return [`${baseIndent}- [ ${formatted.join(', ')} ]`];
  }

  const lines: string[] = [];
  lines.push(`${baseIndent}- [`);

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const comma = i === cells.length - 1 ? '' : ',';

    if (cell.isMultiline) {
      lines.push(`${baseIndent}    {`);
      lines.push(`${baseIndent}      data: |`);
      for (const cellLine of cell.data.split('\n')) {
        lines.push(`${baseIndent}        ${cellLine}`);
      }
      if (cell.align) {
        lines.push(`${baseIndent}      , align: ${cell.align}`);
      }
      if (cell.colalign) {
        lines.push(`${baseIndent}      , colalign: ${cell.colalign}`);
      }
      lines.push(`${baseIndent}    }${comma}`);
    } else {
      lines.push(`${baseIndent}    ${formatInlineCell(cell)}${comma}`);
    }
  }

  lines.push(`${baseIndent}  ]`);
  return lines;
}

function formatInlineCell(cell: ParsedCell): string {
  const trimmed = cell.data.trim();

  if (!trimmed) {
    return '""';
  }

  const attrs: string[] = [];
  if (cell.align) attrs.push(`align: ${cell.align}`);
  if (cell.colalign) attrs.push(`colalign: ${cell.colalign}`);

  if (attrs.length > 0) {
    return `{ data: "${escapeYamlString(trimmed)}", ${attrs.join(', ')} }`;
  }

  return `"${escapeYamlString(trimmed)}"`;
}

/**
 * Escapes special characters in YAML string.
 * Only escapes characters needed for quoted strings (not for literal style).
 */
function escapeYamlString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

/**
 * Checks if a string needs to be quoted in YAML.
 * Returns true for strings with special YAML characters.
 */
export function needsQuoting(str: string): boolean {
  return /[,:\[\]{}#&*!|>'"%@`]|^\s|^\-/.test(str) || str.includes('\\');
}
