# YAMT Build Instructions

This document provides comprehensive instructions for building the YAMT plugin from source code.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Understanding the Build Process](#understanding-the-build-process)
- [Development Setup](#development-setup)
- [Building the Plugin](#building-the-plugin)
- [Testing](#testing)
- [Installation in Obsidian](#installation-in-obsidian)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify installation:
     ```bash
     node --version  # Should output v18.x.x or higher
     ```

2. **npm** (v9 or higher)
   - Comes with Node.js
   - Verify installation:
     ```bash
     npm --version  # Should output v9.x.x or higher
     ```

3. **Git** (for version control)
   - Download: https://git-scm.com/
   - Verify installation:
     ```bash
     git --version
     ```

### Recommended Software

- **Visual Studio Code** (or any TypeScript-capable IDE)
  - Download: https://code.visualstudio.com/
  - Recommended extensions:
    - TypeScript and JavaScript Language Features (built-in)
    - ESLint (optional, for linting)

---

## Understanding the Build Process

### Why Build is Needed

Obsidian cannot directly execute TypeScript files. The build process:

1. **Transpiles** TypeScript (`.ts`) to JavaScript (`.js`)
2. **Bundles** all source files into a single `main.js`
3. **Minifies** code for production (removes whitespace, shortens names)
4. **Resolves** dependencies (except Obsidian API, which is external)

### Build Tools Used

- **esbuild**: Ultra-fast JavaScript/TypeScript bundler
  - 10-100x faster than webpack/rollup
  - Used by Obsidian's official sample plugin
  - Configuration in `package.json` scripts

- **TypeScript Compiler** (`tsc`): Type checking only
  - Ensures code has no type errors
  - Does NOT produce output (handled by esbuild)

### Build Outputs

```
main.js          # Bundled and minified plugin code (for Obsidian)
main.js.map      # Source map (for debugging, optional)
```

These files should NOT be committed to git (they're in `.gitignore`).

---

## Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd obsidian-yamt
```

If you already have the source:
```bash
cd /path/to/obsidian-yamt
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- **Production**: `js-yaml` (YAML parser)
- **Development**: `esbuild`, `typescript`, `obsidian`, `vitest`, `@types/node`

Expected output:
```
added 87 packages, and audited 88 packages in 3s
```

### 3. Verify Installation

```bash
# Check TypeScript types
npm run check

# Run tests
npm run test
```

Expected: No errors, all tests passing.

---

## Building the Plugin

### Production Build

For release or installation in Obsidian:

```bash
npm run build
```

**What happens:**
1. TypeScript is transpiled to JavaScript
2. All source files (`src/main.ts`, `src/lib.ts`) are bundled
3. External dependency (`obsidian`) is excluded (provided at runtime)
4. Code is minified
5. Output written to `main.js`

**Output:**
```
main.js         # Minified bundle (~50KB)
```

**Verify build:**
```bash
ls -lh main.js
# Should show file ~50-60KB
```

### Development Build (with Watch Mode)

For active development with auto-rebuild:

```bash
npm run dev
```

**What happens:**
1. Same as production build, but:
   - Code is NOT minified (easier debugging)
   - Rebuilds automatically on file changes
   - Runs continuously until you press Ctrl+C

**Output:**
```
[watch] build started (change: src/main.ts)
[watch] build finished
```

**Use case:** Keep this running in a terminal while editing code. Obsidian will auto-reload the plugin when `main.js` changes.

### Type Checking Only

Check for TypeScript errors without building:

```bash
npm run check
```

Faster than full build, useful for quick validation.

---

## Testing

### Run All Tests

```bash
npm run test
```

Runs unit tests with Vitest.

**Output:**
```
✓ test/lib.test.ts (3) 
  ✓ normalizeToModel (3)
    ✓ handles header/body object
    ✓ handles flat matrix via rows + assumeFirstRowHeader
    ✓ handles top-level matrix

Test Files  1 passed (1)
     Tests  3 passed (3)
```

### Watch Mode (for TDD)

```bash
npm run test:watch
```

Reruns tests automatically on code changes.

### Run Specific Test File

```bash
npx vitest run test/lib.test.ts
```

---

## Installation in Obsidian

### Method 1: Manual Installation (Recommended for Development)

1. **Build the plugin:**
   ```bash
   npm run build
   ```

2. **Locate your Obsidian vault:**
   - Example: `/home/user/Documents/MyVault`

3. **Create plugin directory:**
   ```bash
   mkdir -p /path/to/vault/.obsidian/plugins/yamt
   ```

4. **Copy required files:**
   ```bash
   cp manifest.json /path/to/vault/.obsidian/plugins/yamt/
   cp main.js /path/to/vault/.obsidian/plugins/yamt/
   cp styles.css /path/to/vault/.obsidian/plugins/yamt/
   ```

5. **Enable plugin in Obsidian:**
   - Open Obsidian
   - Settings → Community plugins
   - Refresh plugin list (if needed)
   - Enable "YAMT (Yet Another Markdown Table)"

### Method 2: Symlink (Best for Active Development)

Create a symbolic link from your development directory:

```bash
# Linux/macOS
ln -s /path/to/obsidian-yamt /path/to/vault/.obsidian/plugins/yamt

# Windows (Command Prompt, run as Administrator)
mklink /D "C:\path\to\vault\.obsidian\plugins\yamt" "C:\path\to\obsidian-yamt"
```

**Benefits:**
- Edit code in your dev directory
- Run `npm run dev` for auto-rebuild
- Obsidian auto-reloads on changes
- No need to copy files manually

**Note:** Make sure to build first (`npm run build`) before enabling.

### Verify Installation

Create a test note in Obsidian:

````markdown
# Test YAMT Table

```yamt
header:
  - [ { data: "Name" }, { data: "Age" } ]
body:
  - [ "Alice", "30" ]
  - [ "Bob", "25" ]
```
````

Expected: A formatted table should render.

---

## Development Workflow

### Typical Development Cycle

1. **Start watch mode:**
   ```bash
   npm run dev
   ```

2. **Edit code** in `src/main.ts` or `src/lib.ts`

3. **Save file** → esbuild auto-rebuilds `main.js`

4. **Reload plugin in Obsidian:**
   - Press `Ctrl+P` (Command Palette)
   - Type "reload app" or "reload plugin"
   - Or use hotkey (default: `Ctrl+R`)

5. **Test changes** in your test note

6. **Write tests** in `test/lib.test.ts`

7. **Run tests:**
   ```bash
   npm run test
   ```

8. **Commit changes:**
   ```bash
   git add .
   git commit -m "Add feature: ..."
   ```

### Code → Test → Build → Test Loop

```bash
# Terminal 1: Watch mode (auto-rebuild)
npm run dev

# Terminal 2: Test watch mode (auto-retest)
npm run test:watch

# Terminal 3: Your editor (VSCode, vim, etc.)
code .
```

---

## Troubleshooting

### Build Errors

#### "Cannot find module 'obsidian'"

**Cause:** Dependencies not installed.

**Solution:**
```bash
npm install
```

#### "esbuild: command not found"

**Cause:** Node modules not in PATH or incomplete install.

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript errors during build

**Cause:** Type errors in code.

**Solution:**
```bash
npm run check  # See detailed errors
```
Fix type errors, then rebuild.

### Runtime Errors in Obsidian

#### Plugin doesn't appear in list

**Cause:** 
- Manifest missing or invalid
- Plugin directory name doesn't match ID

**Solution:**
- Ensure directory is named exactly `yamt` (matches `manifest.json` id)
- Verify `manifest.json`, `main.js`, and `styles.css` are present
- Restart Obsidian

#### "Cannot read properties of undefined"

**Cause:** Build used development version instead of production.

**Solution:**
```bash
rm main.js
npm run build  # Rebuild production version
```

#### Plugin loads but tables don't render

**Cause:** YAML syntax error or plugin not registered.

**Solution:**
- Check browser console (Ctrl+Shift+I → Console)
- Look for "YAMT" errors
- Verify code block uses ```yamt (not yaml or yml)

### Test Errors

#### "Cannot find module '../src/lib'"

**Cause:** Incorrect import path in tests.

**Solution:**
Ensure test imports match:
```typescript
import { normalizeToModel } from "../src/lib";
```

#### "ReferenceError: document is not defined"

**Cause:** Test trying to use browser/Obsidian APIs.

**Solution:**
- Mock the APIs in tests
- Or use `environment: 'node'` in `vitest.config.ts` (already set)

---

## Advanced Build Options

### Custom Build Configuration

Edit `package.json` scripts to customize:

```json
{
  "scripts": {
    "build": "esbuild src/main.ts --bundle --outfile=main.js --external:obsidian --format=cjs --target=es2018 --platform=browser --minify"
  }
}
```

**Options:**
- `--minify`: Enable minification (remove for debugging)
- `--target=es2018`: JavaScript version target
- `--sourcemap`: Generate source map (add `--sourcemap=inline`)
- `--watch`: Enable watch mode (already in `dev` script)

### Source Maps (for Debugging)

Generate source maps:

```bash
esbuild src/main.ts --bundle --outfile=main.js --external:obsidian --format=cjs --target=es2018 --platform=browser --sourcemap=inline
```

Now errors in Obsidian console will show original TypeScript line numbers.

### Bundle Analysis

Check what's in your bundle:

```bash
esbuild src/main.ts --bundle --external:obsidian --format=cjs --metafile=meta.json --analyze
```

Shows dependency tree and sizes.

---

## CI/CD (Automated Builds)

### GitHub Actions

The plugin includes automated build/release workflow:

**File:** `.github/workflows/release.yml`

**Triggers:** Push a version tag (e.g., `v0.2.0`)

**Actions:**
1. Checkout code
2. Install dependencies
3. Build plugin
4. Create zip archive
5. Publish GitHub release with assets

**Usage:**
```bash
# Create and push version tag
git tag v0.2.1
git push origin v0.2.1
```

GitHub Actions will automatically build and create a release.

---

## Build Checklist for Release

Before publishing a new version:

- [ ] Update version in `manifest.json`
- [ ] Update version in `versions.json`
- [ ] Update version in `package.json`
- [ ] Run `npm run check` (no type errors)
- [ ] Run `npm run test` (all tests pass)
- [ ] Run `npm run build` (successful build)
- [ ] Test plugin in Obsidian (fresh install)
- [ ] Update `CHANGELOG.md` (if present)
- [ ] Commit changes: `git commit -am "Release v0.x.x"`
- [ ] Create tag: `git tag v0.x.x`
- [ ] Push: `git push && git push --tags`

---

## Additional Resources

### Official Obsidian Documentation
- Plugin Development: https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin
- API Reference: https://docs.obsidian.md/Reference/TypeScript+API

### Sample Plugin Repository
- GitHub: https://github.com/obsidianmd/obsidian-sample-plugin
- Contains similar build setup

### esbuild Documentation
- Website: https://esbuild.github.io/
- API: https://esbuild.github.io/api/

### TypeScript Documentation
- Handbook: https://www.typescriptlang.org/docs/handbook/intro.html

---

## Questions or Issues?

If you encounter build problems:

1. Check this document's [Troubleshooting](#troubleshooting) section
2. Ensure dependencies are up to date: `npm install`
3. Try a clean build:
   ```bash
   rm -rf node_modules main.js
   npm install
   npm run build
   ```
4. Open an issue on GitHub (if applicable)

---

**Last Updated:** 2025-11-09  
**Build System Version:** esbuild 0.24.0  
**Plugin Version:** 0.2.0

