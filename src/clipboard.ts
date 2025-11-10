/**
 * Utilities for parsing table data from clipboard.
 * Supports CSV (comma, semicolon) and TSV (tab-separated) formats.
 */

/**
 * Parses table data from text string.
 * Automatically detects delimiter (tab, semicolon, or comma).
 * 
 * @param text - Raw text from clipboard
 * @returns 2D array of cell values
 */
export function parseTableData(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  
  if (lines.length === 0) {
    return [];
  }
  
  // Detect delimiter from first line
  const delimiter = detectDelimiter(lines[0]);
  
  const rows: string[][] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue; // Skip empty lines
    
    let cells: string[];
    
    if (delimiter === '\t') {
      // Simple split for tab-separated values (Excel/LibreOffice)
      cells = line.split('\t');
    } else {
      // CSV parsing with quote handling
      cells = parseCSVLine(line, delimiter);
    }
    
    // Trim cells
    cells = cells.map(cell => cell.trim());
    
    rows.push(cells);
  }
  
  return rows;
}

/**
 * Detects the delimiter used in a line of text.
 * Priority: tab (Excel) > semicolon > comma.
 * 
 * @param line - First line of table data
 * @returns Detected delimiter character
 */
export function detectDelimiter(line: string): string {
  if (line.includes('\t')) return '\t';
  if (line.includes(';')) return ';';
  return ',';
}

/**
 * Parses a single CSV line with proper quote handling.
 * Supports escaped quotes ("") inside quoted fields.
 * 
 * @param line - CSV line to parse
 * @param delimiter - Delimiter character (comma or semicolon)
 * @returns Array of cell values
 */
export function parseCSVLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote: "" -> "
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of cell
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last cell
  cells.push(current);
  
  return cells;
}

/**
 * Checks if a string represents a number.
 * Supports integers, decimals with comma or period, and negative numbers.
 * 
 * @param str - String to check
 * @returns True if string is a number
 */
export function isNumber(str: string): boolean {
  if (!str || !str.trim()) return false;
  
  // Remove spaces and check for number pattern
  const cleaned = str.replace(/\s/g, '');
  
  // Pattern: optional minus, digits, optional decimal separator and more digits
  return /^-?\d+([.,]\d+)?$/.test(cleaned);
}

