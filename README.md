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
- markdown inside `data`

Cell example:
```yaml
{ data: "**Bold** and `code`", align: center, bg: "#1112", color: "var(--text-normal)" }
```

## Diagnostics
- YAML errors are displayed with precise location (line/column) when possible.
- Validation errors explain the expected schema.

## Tests
The plugin includes basic normalization tests (Vitest):
```bash
npm run test
```