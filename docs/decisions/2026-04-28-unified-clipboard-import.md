# DR-001: Unified clipboard import with modal dialog

**Date:** 2026-04-28
**Status:** Accepted

## Context

YAMT had two separate commands for pasting tables from clipboard:
- "Paste table from clipboard (with header)"
- "Paste table from clipboard (body only)"

This was inflexible — users could not control alignment import or style promotion without editing the generated YAML manually.

## Decision

Replace both commands with a single "Paste table from clipboard" command that opens a modal dialog (`ImportModal`) with three toggle settings:

1. **First row is header** — whether the first row becomes `header:`
2. **Import alignment** — whether numbers are automatically right-aligned
3. **Promote repeated styles to header** — whether uniform column alignments are moved to header cells

Settings persist between sessions via plugin `loadData`/`saveData`.

## Consequences

- Users get fine-grained control per invocation
- Last-used settings are remembered
- `convertToYamt` accepts `ImportOptions` object (backward-compatible with `boolean`)
- `ImportModal.ts` is the only new file importing `obsidian` — pure logic modules stay clean
