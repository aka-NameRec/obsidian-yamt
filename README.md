# YAMT (Yet Another Markdown Table)

Render tables from YAML in Obsidian.

## Manual Installation
1. Copy the `yamt` folder to `<your-vault>/.obsidian/plugins/yamt`
2. Run the following commands inside it:
   ```bash
   npm i
   npm run build
   ```
3. Enable the plugin in Obsidian: *Settings → Community plugins*

## Usage

### Two Ways to Write YAMT Tables

YAMT supports two syntaxes for defining tables:

#### Option 1: `yamt` code blocks (original syntax)
```yamt
header:
  - [ "Name", "Age" ]
body:
  - [ "Alice", "30" ]
```

**Limitation:** No YAML syntax highlighting in editor.

#### Option 2: YAML comment marker (recommended)
```yaml
# -yamt-
header:
  - [ "Name", "Age" ]
body:
  - [ "Alice", "30" ]
```

**Benefits:**
- ✅ Full YAML syntax highlighting in editor
- ✅ Valid YAML syntax (comment doesn't affect parsing)
- ✅ Marker is part of the code block (no separate line needed)
- ✅ Standard YAML formatting and validation

Place the comment `# -yamt-` as the first line in your `yaml` code block.

### Paste from Clipboard

YAMT provides commands to quickly convert tables from Excel, LibreOffice Writer, or CSV format directly from your clipboard:

1. **Paste table from clipboard (with header)** — Converts clipboard table data to YAMT format, treating the first row as a header
2. **Paste table from clipboard (body only)** — Converts all rows as body data (no header section)

**How to use:**
1. Copy a table in Excel/Writer (or CSV text)
2. Open Obsidian command palette (`Ctrl/Cmd + P`)
3. Type "YAMT paste" and select the desired command
4. The YAMT table will be inserted at your cursor position

**Supported formats:**
- Tab-separated values (Excel, LibreOffice Calc)
- Comma-separated values (CSV)
- Semicolon-separated values (European CSV)

**Features:**
- Numbers are automatically right-aligned
- Multiline cells (from Excel) are converted to YAML literal style (`|`)
- Special characters are properly escaped
- Empty cells are preserved

### 1) Classic `header/body` structure
```yamt
options:
  caption: "Price List"
  ariaLabel: "Price Table"
  assumeFirstRowHeader: false
  noThead: false

header:
  - [ { data: "📦 Product", colspan: 2 }, { data: "Price" } ]
  - [ { data: "Category" }, { data: "Name" }, { data: "€", align: right } ]
body:
  - [ "**Electronics**", "`Dell XPS Laptop`", { data: "1299", align: right } ]
```

### 2) Flat matrix (auto-detect)
If you provide a simple array of arrays, it will be treated as `body`.
You can control the header via `options`:
```yamt
options:
  caption: "Summary"
  assumeFirstRowHeader: true   # first row becomes <thead>
# noThead: true                # everything goes into <tbody> without <thead>

rows:
  - [ "A", "B", "C" ]
  - [ "1", "2", "3" ]
  - [ "4", "5", "6" ]
```

or even without the `rows` key, just a plain matrix:
```yamt
- [ "A", "B", "C" ]
- [ "1", "2", "3" ]
- [ "4", "5", "6" ]
```

### 3) Cells and Styles
- `align: left|center|right`
- `bg`, `color` — any CSS values (use carefully)
- `colspan`, `rowspan` (+ synonyms `hts_colspan`, `hts_rowspan`)
- `width` — column width (CSS value: px, %, em, etc.)
- markdown inside `data`

Cell example:
```yaml
{ data: "**Bold** and `code`", align: center, bg: "#1112", color: "var(--text-normal)" }
```

Width example (typically used in header cells):
```yaml
header:
  - [ { data: "ID", width: "50px" }, { data: "Description", width: "60%" }, { data: "Status" } ]
body:
  - [ "1", "Lorem ipsum dolor sit amet", "✓" ]
```

## Diagnostics
- YAML errors are displayed with precise location (line/column) when possible.
- Validation errors explain the expected schema.

## Tests
The plugin includes basic normalization tests (Vitest):
```bash
npm run test
```

## License

This project is released into the **public domain** under [The Unlicense](LICENSE).

You are free to use, modify, and distribute this software for any purpose, commercial or non-commercial, without any restrictions.

## Author

**aka.NameRec@gmail.com**

- GitHub: https://github.com/shtirliz/obsidian-yamt
- Issues: https://github.com/shtirliz/obsidian-yamt/issues