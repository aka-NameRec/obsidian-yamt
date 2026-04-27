# DR-002: Promote repeated column alignments to header cells

**Date:** 2026-04-28
**Status:** Accepted

## Context

When importing tables where all body cells in a column are numbers, `convertToYamt` adds `align: right` to every cell. This produces verbose YAML even though YAMT already supports `colalign` for column-wide alignment from header cells.

## Decision

When `promoteStylesToHeader` is enabled and `withHeader` is true, analyze body cells per column after parsing. If all body cells with an `align` property share the same value, move it to the corresponding header cell and strip it from body cells.

### Algorithm

1. For each column index, collect `align` values from all body rows
2. If every body cell in the column has the same `align` value → set that `align` on the header cell, remove from body cells
3. If any body cell differs or is missing `align` → leave column unchanged

### Note on align vs colalign

The importer writes `align` (not `colalign`) to the header cell because the output is generic YAML cell objects. The user can manually change it to `colalign` if they want column-wide propagation in the renderer.

## Consequences

- Cleaner generated YAML for tables with uniform column alignments
- No change to rendering behavior — `align` on a header cell works correctly
- Mixed-alignment columns remain explicit
