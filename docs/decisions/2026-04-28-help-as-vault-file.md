# DR-003: Help documentation as vault file

**Date:** 2026-04-28
**Status:** Accepted

## Context

Users need accessible documentation inside Obsidian. The Obsidian API requires a `TFile` to open content in a leaf — there is no way to open arbitrary Markdown content without a file backing it.

## Decision

The "YAMT: Open help" command creates or updates a file `.yamt-help.md` in the vault root with the current help content, then opens it in a new tab.

The help content is embedded as a `HELP_MARKDOWN` constant in `main.ts` to avoid runtime file reads from the plugin directory (which may not be accessible via the Vault API).

### Alternative considered

- **Custom view class** — more complex, requires registering a view type and managing lifecycle. Overkill for read-only documentation.
- **`vault.createResourcePath`** — not suitable for creating editable content in a leaf.

## Consequences

- `.yamt-help.md` appears in the vault file list (prefixed with dot, typically hidden by file explorers)
- Content is refreshed on each command invocation (always up-to-date with plugin version)
- Users can bookmark or pin the help tab
