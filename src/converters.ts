/**
 * Converts parsed table data to YAMT format.
 * Supports multiline cells using YAML literal style (|).
 */

import { isNumber } from './clipboard';

/**
 * Converts 2D array of cells to YAMT code block.
 * 
 * @param rows - Parsed table rows
 * @param withHeader - If true, first row becomes header section
 * @returns YAMT formatted string ready to insert
 */
export function convertToYamt(rows: string[][], withHeader: boolean): string {
  const lines: string[] = [];
  
  lines.push('```yamt');
  
  if (withHeader && rows.length > 0) {
    // First row as header
    lines.push('header:');
    lines.push(...formatYamtRowWithIndent(rows[0], '  '));
    
    if (rows.length > 1) {
      lines.push('body:');
      for (let i = 1; i < rows.length; i++) {
        lines.push(...formatYamtRowWithIndent(rows[i], '  '));
      }
    }
  } else {
    // All rows as body
    lines.push('body:');
    for (const row of rows) {
      lines.push(...formatYamtRowWithIndent(row, '  '));
    }
  }
  
  lines.push('```');
  lines.push(''); // Empty line after block
  
  return lines.join('\n');
}

/**
 * Formats a table row for YAMT with proper indentation.
 * Handles multiline cells using YAML literal style.
 * 
 * @param cells - Array of cell values
 * @param baseIndent - Base indentation for this row (e.g., '  ')
 * @returns Array of lines (may be multiple for multiline cells)
 */
function formatYamtRowWithIndent(cells: string[], baseIndent: string): string[] {
  const hasMultiline = cells.some(cell => cell.includes('\n'));
  
  if (!hasMultiline) {
    // Simple inline format: - [ "A", "B", "C" ]
    const formattedCells = cells.map(cell => formatSimpleCell(cell));
    return [`${baseIndent}- [ ${formattedCells.join(', ')} ]`];
  }
  
  // Multiline format: each cell on separate line
  const lines: string[] = [];
  lines.push(`${baseIndent}- [`);
  
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const isLast = i === cells.length - 1;
    const comma = isLast ? '' : ',';
    
    if (cell.includes('\n')) {
      // Multiline cell with YAML literal style
      lines.push(`${baseIndent}    {`);
      lines.push(`${baseIndent}      data: |`);
      
      const cellLines = cell.split('\n');
      for (const line of cellLines) {
        lines.push(`${baseIndent}        ${line}`);
      }
      
      // Add attributes for multiline cells if applicable
      const attrs = getCellAttributes(cell);
      if (attrs.align) {
        lines.push(`${baseIndent}      , align: ${attrs.align}`);
      }
      
      lines.push(`${baseIndent}    }${comma}`);
    } else {
      // Simple cell
      const formatted = formatSimpleCell(cell);
      lines.push(`${baseIndent}    ${formatted}${comma}`);
    }
  }
  
  lines.push(`${baseIndent}  ]`);
  return lines;
}

/**
 * Formats a simple (single-line) cell value.
 * Numbers are formatted with right alignment.
 * 
 * @param cell - Cell value
 * @returns Formatted cell string
 */
function formatSimpleCell(cell: string): string {
  const trimmed = cell.trim();
  
  // Empty cell
  if (!trimmed) {
    return '""';
  }
  
  // Number: add right alignment
  if (isNumber(trimmed)) {
    return `{ data: "${escapeYamlString(trimmed)}", align: right }`;
  }
  
  // Regular text: always quote for safety
  const escaped = escapeYamlString(trimmed);
  return `"${escaped}"`;
}

/**
 * Interface for cell attributes determined from content.
 */
interface CellAttributes {
  align?: 'left' | 'center' | 'right';
}

/**
 * Determines cell attributes based on content.
 * For example, if all non-empty lines are numbers, align right.
 * 
 * @param cell - Cell content (may be multiline)
 * @returns Cell attributes
 */
function getCellAttributes(cell: string): CellAttributes {
  const attrs: CellAttributes = {};
  
  // Check if all non-empty lines are numbers
  const lines = cell.split('\n').filter(line => line.trim());
  if (lines.length > 0 && lines.every(line => isNumber(line))) {
    attrs.align = 'right';
  }
  
  return attrs;
}

/**
 * Escapes special characters in YAML string.
 * Only escapes characters needed for quoted strings (not for literal style).
 * 
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeYamlString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')  // Backslash
    .replace(/"/g, '\\"');    // Double quote
  // Note: \n, \r, \t are NOT escaped - they're handled by literal style |
}

/**
 * Checks if a string needs to be quoted in YAML.
 * Returns true for strings with special YAML characters.
 * 
 * @param str - String to check
 * @returns True if quoting is needed
 */
export function needsQuoting(str: string): boolean {
  // Check for YAML special characters
  return /[,:\[\]{}#&*!|>'"%@`]|^\s|^\-/.test(str) || str.includes('\\');
}

