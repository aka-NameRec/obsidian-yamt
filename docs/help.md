# YAMT — Help

YAMT (Yet Another Markdown Table) renders tables from YAML in Obsidian.

---

## Two Ways to Write YAMT Tables

### `yamt` code blocks (original syntax)

```yamt
header:
  - [ "Name", "Age" ]
body:
  - [ "Alice", "30" ]
```

**Limitation:** No YAML syntax highlighting in editor.

### YAML comment marker (recommended)

```yaml
# -yamt-
header:
  - [ "Name", "Age" ]
body:
  - [ "Alice", "30" ]
```

**Benefits:**
- Full YAML syntax highlighting in editor
- Valid YAML syntax (comment does not affect parsing)
- Marker is part of the code block

Place the comment `# -yamt-` as the first line in your `yaml` code block.

---

## Paste from Clipboard

1. Copy a table in Excel / LibreOffice Calc / CSV text
2. Open command palette (`Ctrl/Cmd + P`)
3. Run **"YAMT: Paste table from clipboard"**
4. Adjust import settings in the dialog:
   - **First row is header** — treat the first row as the `header:` section
   - **Import alignment** — automatically right-align numbers
   - **Promote repeated styles to header** — if all body cells in a column share the same alignment, set it once in the header cell instead of repeating it in every body cell
5. Click **Import**

**Supported formats:** Tab-separated (Excel), comma-separated (CSV), semicolon-separated (European CSV).

---

## Table Formats

### Classic header/body

```yaml
# -yamt-
header:
  - [ { data: "Product", colspan: 2 }, { data: "Price" } ]
  - [ { data: "Category" }, { data: "Name" }, { data: "€", align: right } ]
body:
  - [ "**Electronics**", "Dell XPS", { data: "1299", align: right } ]
```

### Flat matrix (auto-detect)

```yamt
options:
  caption: "Summary"
  assumeFirstRowHeader: true

- [ "A", "B", "C" ]
- [ "1", "2", "3" ]
```

---

## Cell Properties

| Property    | Description                                      |
|-------------|--------------------------------------------------|
| `data`      | Cell content (supports Markdown)                 |
| `align`     | Alignment for this cell only: `left` / `center` / `right` |
| `colalign`  | Alignment for the entire column (set in header)  |
| `bg`        | Background color (CSS value)                     |
| `color`     | Text color (CSS value)                           |
| `colspan`   | Number of columns to span                        |
| `rowspan`   | Number of rows to span                           |
| `width`     | Column width (CSS value: px, %, em, etc.)        |

**Priority:** `align` (cell-specific) > `colalign` (column-wide) > browser default.

---

## Options

```yaml
# -yamt-
options:
  caption: "Price List"
  ariaLabel: "Price Table"
  assumeFirstRowHeader: false
  noThead: false
```

| Option                    | Description                                        |
|---------------------------|----------------------------------------------------|
| `caption`                 | Table caption text                                 |
| `ariaLabel`               | Accessibility label                                |
| `assumeFirstRowHeader`    | Treat first row as header when no explicit header  |
| `noThead`                 | Render all rows in `<tbody>` (no `<thead>`)        |

---

## Diagnostics

- YAML errors show precise line/column location.
- Validation errors explain the expected schema.

---

*YAMT is released into the public domain under The Unlicense.*
