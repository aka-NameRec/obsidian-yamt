# Project-Specific AI Rules — obsidian-yamt

## Obsidian Plugin Conventions

- The plugin entry point is `src/main.ts`, exporting a default class extending `Plugin` from `obsidian`.
- All Obsidian API imports must come from the `obsidian` module (marked `--external` in esbuild). Never bundle Obsidian internals.
- Use `MarkdownRenderer.render()` for markdown-in-cell rendering — never use deprecated `MarkdownRenderer.renderMarkdown()`.
- Register code block processors via `this.registerMarkdownCodeBlockProcessor()` in `onload()`. Register commands via `this.addCommand()`.
- Use `Notice` for user-facing notifications; use `console.error` for developer-facing diagnostics.
- DOM construction must use the Obsidian DOM helpers (`el.createEl`, `el.createDiv`, `el.setAttr`, `el.hasClass`). Avoid `document.createElement` when Obsidian helpers are available.

## Build & Bundling

- Build tool: esbuild (direct CLI, no wrapper). Build command: `npm run build`. Dev watch: `npm run dev`.
- esbuild flags: `--bundle --external:obsidian --format=cjs --target=es2018 --platform=browser --minify` (production) / `--watch` (dev).
- The output artifact is `main.js` in the project root (gitignored in production, committed only for releases).
- CSS lives in `styles.css` (Obsidian auto-loads it). Keep it minimal — only plugin-specific styles.
- Do not add bundler plugins, loaders, or build pipelines without explicit approval.

## Versioning & Manifest

- Version is defined in both `package.json` and `manifest.json`. Keep them in sync.
- `manifest.json` fields: `id`, `name`, `version`, `minAppVersion`, `description`, `author`, `authorUrl`, `isDesktopOnly`.
- `versions.json` maps versions to minimum Obsidian app versions for the Obsidian release workflow.
- Version format: `<major>.<minor>.<YYYYMMDD>` (e.g., `1.2.20251111`).

## Testing

- Test runner: Vitest. Config in `vitest.config.ts`. Environment: node.
- Tests live in `test/`. File naming: `<module>.test.ts`.
- Run tests: `npm run test`. Watch: `npm run test:watch`.
- Type check: `npm run check` (`tsc --noEmit`).
- Tests import from `src/` directly — no build step required for tests.
- Prefer unit tests for pure logic (`lib.ts`, `clipboard.ts`, `converters.ts`). DOM rendering is tested manually in Obsidian.

## Architecture

- `src/main.ts` — Plugin class, code block processors, command registration, DOM rendering.
- `src/lib.ts` — Pure logic: YAML parsing, model normalization, type definitions, custom errors.
- `src/clipboard.ts` — Clipboard parsing: delimiter detection, CSV/TSV parsing.
- `src/converters.ts` — Conversion to YAMT YAML format for clipboard paste commands.
- Pure logic (lib, clipboard, converters) must have zero Obsidian imports. Only `main.ts` imports from `obsidian`.
- YAML parsing uses `js-yaml` (the only runtime dependency). All other dependencies are dev-only.

## Error Handling

- `YamtYamlError` wraps YAML parse failures with location info.
- `YamtValidationError` wraps schema/structure validation failures.
- Both extend `Error` with a `name` prefix `"YAMT/"`.
- Render errors via `YamtErrorBox.render()` — never silently swallow them.
- Always show the user a meaningful error in reading view when table rendering fails.
