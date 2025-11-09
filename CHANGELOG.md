# Changelog

All notable changes to the YAMT (Yet Another Markdown Table) plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-11-09

### Added
- Auto-detection of flat YAML matrices (arrays of arrays treated as table body)
- `assumeFirstRowHeader` option: treat first row as header when no explicit header provided
- `noThead` option: render all rows in `<tbody>` without `<thead>` section
- `caption` option: add table caption element
- `ariaLabel` option: accessibility support with aria-label attribute
- Comprehensive test suite with Vitest
- GitHub Actions workflow for automated releases
- Detailed documentation:
  - Build instructions with troubleshooting guide
  - Code inspection report with best practices analysis
  - Plugin structure verification report

### Improved
- More flexible YAML structure parsing with multiple format support
- Better error messages with precise YAML location information
- Separated core logic (lib.ts) from UI code (main.ts) for better testability

## [0.1.0] - 2025-11-09

### Added
- Initial release of YAMT plugin
- YAML to HTML table rendering in Obsidian
- Support for `colspan` and `rowspan` attributes
- Cell alignment options (`left`, `center`, `right`)
- Custom cell colors (`bg`, `color` CSS properties)
- Markdown rendering inside table cells
- Classic `header`/`body` structure support
- Multiple cell format synonyms (`hts_colspan`, `hts_rowspan`)
- Comprehensive error handling with user-friendly messages
- CSS styling compatible with Obsidian themes
- TypeScript strict mode implementation
- Basic project structure:
  - `manifest.json` - Plugin metadata
  - `versions.json` - Version compatibility mapping
  - `src/main.ts` - Main plugin file
  - `src/lib.ts` - Core parsing and normalization logic
  - `styles.css` - Plugin-specific styles
  - `tsconfig.json` - TypeScript configuration
  - `package.json` - Dependencies and build scripts

### Technical Details
- Uses `js-yaml` for YAML parsing
- Uses Obsidian's native `MarkdownRenderer` for cell content
- Built with esbuild for fast compilation
- Targets ES2018 for broad compatibility

---

## Release Notes

### Version 0.2.0
This version significantly expands the flexibility of table definitions. You can now use simpler YAML structures for basic tables, control header rendering, and add captions for better accessibility.

### Version 0.1.0
First working version with all core table rendering features. Provides a clean alternative to standard Markdown tables with support for advanced features like cell spanning and custom styling.

---

## Upgrade Guide

### From 0.1.0 to 0.2.0

No breaking changes. All existing YAMT tables continue to work as before. New features are opt-in via the `options` block:

```yaml
options:
  caption: "My Table Title"
  assumeFirstRowHeader: true
  noThead: false
  ariaLabel: "Descriptive table label"

# ... rest of your table definition
```

---

## Planned Features

See GitHub Issues for planned features and enhancements:
- [ ] Table of contents generation from captions
- [ ] Cell merge conflict detection
- [ ] Row/column styling presets
- [ ] Export to Markdown table format
- [ ] Interactive table editor in Obsidian UI
- [ ] Performance optimizations for large tables (100+ rows)
- [ ] Internationalization (i18n) support

---

## Links

- GitHub Repository: https://github.com/shtirliz/obsidian-yamt
- Report Issues: https://github.com/shtirliz/obsidian-yamt/issues
- Documentation: https://github.com/shtirliz/obsidian-yamt#readme
- Author: aka.NameRec@gmail.com

