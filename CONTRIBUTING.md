# Contributing to Native Slides

Thanks for your interest in contributing! This guide explains how to set up, build, test, and submit changes.

## Development setup

1. **Clone and install**:

   ```bash
   git clone https://github.com/l05k/obsidian-native-slides.git
   cd obsidian-native-slides
   npm install
   ```

2. **Link to your vault** (so Obsidian picks up changes):

   ```bash
   # Replace <vault-path> with your vault's plugins directory
   ln -s "$(pwd)/main.js" <vault-path>/.obsidian/plugins/native-slides/main.js
   ln -s "$(pwd)/styles.css" <vault-path>/.obsidian/plugins/native-slides/styles.css
   ln -s "$(pwd)/manifest.json" <vault-path>/.obsidian/plugins/native-slides/manifest.json
   ```

3. **Build and watch** (auto-rebuild on save):

   ```bash
   npm run dev
   ```

   After each rebuild, restart Obsidian (or use the Hot-Reload plugin) to pick up `main.js` / `styles.css` changes.

4. **Run checks before committing**:
   ```bash
   npm run build      # bundle main.js (must be committed with source changes)
   npm run check      # TypeScript type-check
   npm test           # unit tests (vitest)
   npm run lint       # ESLint
   npm run format     # Prettier (fix formatting)
   ```

## Commit conventions

- **One logical change per commit.** If you add a feature, include its docs and tests in the same commit.
- **`main.js` must be committed with source changes.** CI verifies that `main.js` matches the bundled output of `main.ts` + `src/`.
- **Commit message format**: short imperative subject (`feat: add X`, `fix: correct Y`, `docs: update Z`). No strict scope prefix requirement, but keep it descriptive.
- **Never commit vault-specific state.** `example-vault/.obsidian/data.json`, `community-plugins.json`, `core-plugins.json` are gitignored or should be reverted before commit.

## Pull request workflow

1. **Branch from `main`**: `git checkout -b feat/your-feature`.
2. **Open a PR** against `main` early — even if it's a draft — so we can discuss the approach.
3. **CI must pass**: the `build` workflow runs `npm run check`, `npm test`, `npm run lint`, `npm run format:check`. Fix any failures before requesting review.
4. **Review and merge**: a maintainer will review and merge. Please don't merge your own PRs or rebase `main` into your branch unless asked.

## Reporting issues

Use the issue templates:

- **Bug report**: for crashes, unexpected behavior, or visual glitches.
- **Feature request**: for new functionality or enhancements.

Include your Obsidian version, plugin version, and (for visual bugs) a screenshot or screen recording.

## Code style

- **TypeScript** for all source code (`main.ts`, `src/`).
- **ESLint + Prettier** enforce style. Run `npm run lint:fix` and `npm run format` before committing.
- **CSS**: `styles.css` is hand-written (no preprocessor). Use the existing `--ns-*` variable layer for theme-scoped values; keep selectors scoped under `body.native-slides-mode` to avoid leaking into native modes.
- **Tests**: `test/` uses Vitest. Add tests for pure logic (deck navigation, page-number computation, theme registry). Visual/CSS behavior is verified manually in Obsidian.

## Project structure

```
main.ts              # Plugin entry point (lifecycle, Slides mode toggle)
src/
  bar.ts             # Slides bar (bottom bar UI)
  commands.ts        # Command registry (Toggle Slides Mode, navigation, etc.)
  deck.ts            # Deck-link parsing and page-number computation
  settings.ts        # Settings tab UI
  types.ts           # TypeScript types + theme registry
styles.css           # All CSS (scoped under body.native-slides-mode)
test/                # Vitest unit tests
example-vault/       # Sample vault for manual testing (gitignored plugin state)
```

## Questions?

Open a discussion or issue — we're happy to help.
