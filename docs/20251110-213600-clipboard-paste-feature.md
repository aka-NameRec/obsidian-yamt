# Feature Implementation: Clipboard Table Paste

**Date:** 2025-11-10  
**Feature:** Added commands to paste table data from clipboard in YAMT format

## Summary

Implemented two Obsidian commands that convert table data from clipboard (Excel, LibreOffice Writer, CSV) into YAMT format and insert at cursor position. Supports multiline cells using YAML literal style (`|`).

## Commands

1. **"Paste table from clipboard (with header)"** (`paste-table-with-header`)
   - Treats first row as `header:`
   - Remaining rows go to `body:`

2. **"Paste table from clipboard (body only)"** (`paste-table-body-only`)
   - All rows go to `body:`
   - No `header:` section

## Implementation Details

### Architecture

Created three new modules following the project's separation of concerns:

```
src/
  clipboard.ts   - Table data parsing (CSV, TSV)
  converters.ts  - YAMT format conversion
  main.ts        - Command registration and integration
```

### Files Created

#### 1. `src/clipboard.ts`

Utilities for parsing table data from clipboard text.

**Key functions:**
- `parseTableData(text)` — Main entry point, returns 2D array of cells
- `detectDelimiter(line)` — Auto-detects delimiter (tab > semicolon > comma)
- `parseCSVLine(line, delimiter)` — Handles CSV with proper quote escaping
- `isNumber(str)` — Checks if string is a number (for auto-alignment)

**Supported formats:**
- Tab-separated values (Excel, LibreOffice Calc)
- Comma-separated values (CSV)
- Semicolon-separated values (European CSV)

**Features:**
- Handles quoted fields with embedded delimiters
- Supports escaped quotes (`""` → `"`)
- Trims whitespace from cells
- Skips empty lines
- Supports Windows/Unix line endings

#### 2. `src/converters.ts`

Converts parsed table data to YAMT format.

**Key function:**
- `convertToYamt(rows, withHeader)` — Main conversion function

**Format logic:**
- Simple cells → inline array format: `[ "A", "B", "C" ]`
- Multiline cells → YAML literal style with proper indentation
- Numbers → automatic right alignment: `{ data: "123", align: right }`
- Empty cells → `""`
- Special characters → properly escaped in quoted strings

**Multiline cell handling:**
```yaml
# Row with multiline cell becomes:
- [
    "Simple",
    {
      data: |
        Line 1
        Line 2
        Line 3
    },
    { data: "123", align: right }
  ]
```

### Files Modified

#### 3. `src/main.ts`

Added clipboard paste functionality.

**Changes:**
- Import `Editor` and `Notice` from Obsidian
- Import `parseTableData` and `convertToYamt` from new modules
- Register two commands in `onload()`
- Add `pasteTableAsYamt()` function

**Function `pasteTableAsYamt(editor, withHeader)`:**
1. Reads text from clipboard via `navigator.clipboard.readText()`
2. Parses table data using `parseTableData()`
3. Converts to YAMT using `convertToYamt()`
4. Inserts at cursor position via `editor.replaceRange()`
5. Shows notification with table dimensions

**Error handling:**
- Empty clipboard → notice to user
- No table data found → notice to user
- Parsing errors → console.error + notice with error message

#### 4. `test/lib.test.ts`

Added comprehensive test suites.

**Test coverage:**
- `clipboard parsing` (25 tests)
  - Delimiter detection (4 tests)
  - CSV line parsing (5 tests)
  - Table data parsing (7 tests)
  - Number detection (9 tests)
  
- `YAMT conversion` (12 tests)
  - Simple tables (4 tests)
  - Multiline cells (5 tests)
  - Special characters (3 tests)

**Total:** 37 tests passing ✅

#### 5. `README.md`

Added documentation section "Paste from Clipboard" with:
- Command descriptions
- Usage instructions
- Supported formats
- Feature highlights

## Technical Implementation

### Multiline Cell Format

Key design decision: Use YAML literal style (`|`) instead of escaping `\n`.

**Example Excel table:**

| ID | Description | Price |
|----|-------------|-------|
| 1  | Simple text | 100   |
| 2  | Line 1<br>Line 2<br>Line 3 | 200 |

**Generated YAMT:**

```yaml
```yamt
header:
  - [ "ID", "Description", "Price" ]
body:
  - [ "1", "Simple text", { data: "100", align: right } ]
  - [
      "2",
      {
        data: |
          Line 1
          Line 2
          Line 3
      },
      { data: "200", align: right }
    ]
```
```

### Number Detection & Alignment

Numbers are automatically right-aligned:
- Integers: `123`, `-456`
- Decimals: `123.45`, `123,45` (European format)
- With spaces: `1 234`, ` 123 `

Format: `{ data: "123", align: right }`

### Character Escaping

**Simple cells:**
- Backslash: `\` → `\\`
- Double quote: `"` → `\"`
- All values wrapped in quotes for safety

**Multiline cells (literal style):**
- No escaping needed
- Preserves all characters as-is
- Preserves empty lines

## Testing

### Unit Tests

```bash
npm run test
```

**Result:** 37 tests passing (16ms)

Test categories:
- Delimiter detection
- CSV parsing with quotes
- Tab-separated values
- Multiline cell conversion
- Number alignment
- Special character handling

### Type Checking

```bash
npm run check
```

**Note:** Pre-existing TypeScript errors unrelated to this feature:
- `js-yaml` missing type definitions (existed before)
- `MarkdownPostProcessorContext` type issue in existing code (existed before)

New code has no TypeScript errors.

### Build

```bash
npm run build
```

**Result:** ✅ Success
- Output: `main.js` (46.6kb)
- Build time: 9ms

## User Experience

### Typical Workflow

1. User copies table in Excel/Writer:
   ```
   Product    Price
   Laptop     1299
   Mouse      79
   ```

2. Opens Obsidian, positions cursor

3. Opens command palette (`Ctrl/Cmd+P`)

4. Types "YAMT paste" → selects "with header"

5. Table inserted:
   ```yaml
   ```yamt
   header:
     - [ "Product", "Price" ]
   body:
     - [ "Laptop", { data: "1299", align: right } ]
     - [ "Mouse", { data: "79", align: right } ]
   ```
   ```

6. Notification shows: "Table inserted: 3 rows, 2 columns"

### Edge Cases Handled

✅ Empty clipboard → User notification  
✅ No table data → User notification  
✅ Single column → Works  
✅ Single row → Works  
✅ Empty cells → Preserved as `""`  
✅ Multiline cells → YAML literal style  
✅ Special characters → Properly escaped  
✅ Mixed simple/multiline in same row → Works  
✅ European number format (comma) → Detected  

## Compatibility

- **Obsidian API:** Uses standard `Editor` and `Notice` APIs
- **Browser API:** Uses `navigator.clipboard.readText()` (requires user permission, already granted in Obsidian)
- **No breaking changes:** Existing functionality unaffected

## Performance

- Parsing: O(n) where n = number of cells
- Conversion: O(n) where n = number of cells
- No recursion, no heavy computation
- Minimal memory allocation
- Instant feedback for typical tables (< 100ms)

## Future Enhancements (Optional)

Possible improvements not in current scope:

1. **HTML table parsing** — Read `text/html` from clipboard (Excel copies as HTML)
2. **Auto-detect headers** — Smart detection of header rows
3. **Column width detection** — Preserve column widths from Excel
4. **Style preservation** — Colors, bold, etc. from Excel
5. **Modal dialog** — Options UI for power users
6. **Paste with options** — Custom delimiter, trim behavior, etc.

## Documentation

Updated files:
- `README.md` — User-facing documentation
- `docs/20251110-213600-clipboard-paste-feature.md` — This file (technical documentation)

## Files Summary

**Created:**
- `src/clipboard.ts` (111 lines)
- `src/converters.ts` (151 lines)
- `docs/20251110-213600-clipboard-paste-feature.md` (this file)

**Modified:**
- `src/main.ts` (+42 lines)
- `test/lib.test.ts` (+253 lines)
- `README.md` (+24 lines)

**Total:** ~580 new lines of code + documentation

## Verification Steps

To verify this implementation:

1. **Run tests:**
   ```bash
   npm run test
   ```
   Expected: 37 tests passing

2. **Build project:**
   ```bash
   npm run build
   ```
   Expected: Success, `main.js` created

3. **Manual testing in Obsidian:**
   - Copy table from Excel
   - Run command "Paste table from clipboard (with header)"
   - Verify YAMT format is correct
   - Verify table renders properly

4. **Test multiline cells:**
   - In Excel, create cell with Alt+Enter line breaks
   - Copy and paste
   - Verify YAML literal style (`|`) is used

5. **Test CSV:**
   - Copy CSV text from file or editor
   - Paste via command
   - Verify correct parsing

## Status

✅ **Implementation complete**  
✅ **All tests passing**  
✅ **Build successful**  
✅ **Documentation updated**  
⏳ **Ready for user verification**  
⏸️  **Commit pending user approval**

