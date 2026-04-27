# Unified clipboard import with modal dialog

**Date:** 2026-04-28
**Status:** Accepted

## Context

YAMT had two separate commands for pasting tables from clipboard:
- "Paste table from clipboard (with header)"
- "Paste table from clipboard (body only)"

This was inflexible — users could not control alignment import or style promotion without editing the generated YAML manually.

## Decision

Replace both commands with a single "Paste table from clipboard" command that opens a modal dialog (`ImportModal`) with four toggle settings:

1. **First row is header** — whether the first row becomes `header:`
2. **Import alignment** — whether numbers are automatically right-aligned
3. **Promote repeated styles to header** — whether uniform column alignments are moved to header cells as `colalign` (disabled when header is off)
4. **Wrap in YAMT block** — whether output includes `\`\`\`yamt` code fences (can be turned off to append rows to existing blocks)

Settings persist between sessions via plugin `loadData`/`saveData`.

### Key UX decisions

- **Promote toggle** is disabled and auto-reset when "First row is header" is off (no header cell to promote to)
- **Body-only import** outputs flat YAML rows without `body:` key for pasting into existing blocks
- **Enter key** submits the dialog via `this.scope.register`
- **Selected text** is replaced by import output instead of inserting alongside it
- **colalign** (not `align`) is used in header cells for promoted styles so that column-wide alignment takes effect in the renderer

## Consequences

- Users get fine-grained control per invocation
- Last-used settings are remembered
- `convertToYamt` accepts `ImportOptions` object (backward-compatible with `boolean`)
- `ImportModal.ts` is the only new file importing `obsidian` — pure logic modules stay clean
