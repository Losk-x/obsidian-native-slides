# Changelog

All notable user-visible changes to Native Slides are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Categories: Added, Changed, Deprecated, Removed, Fixed, Security. Omit any category with no entries. On release, rename [Unreleased] to the version with its date and start a fresh empty [Unreleased] above it.

## [Unreleased]

### Added

- **Create Next Slide** command: creates a new slide right after the current one — the file is named `<current>-next` (collision-aware: `-2`, `-3`, …), both `deck` properties are rewired automatically, and the new note opens in edit mode. If the current note's second `deck` link points to a missing note, that exact note is created instead (fixing the ⚠ warning); on the overview page it inserts a new first page. The command is greyed out for notes that cannot take a next slide.
- **WYSIWYG mode** (deck notes only): explicit immersive mode — command `Toggle WYSIWYG Mode` (default hotkey `Mod+Shift+E`), bottom-bar button, or settings toggle (default off). **WYSIWYG = Live Preview styled to match the reading view** (reading is the untouched reference): Live Preview's top margin, list indentation and code-block metrics align to reading; the **tab bar and sidebars hide** (Live Preview + reading view; Source mode stays completely native), the bottom bar shows in Live Preview too and matches the tab bar's measured height (runtime CSS variable; no content-area height change when switching modes), **in-note properties hide while editing** in Live Preview, and **standalone image lines are centered**. Toggling from reading view jumps into the WYSIWYG edit view.
- **WYSIWYG typography alignment (Live Preview → reading)**: reading view stays fully default; WYSIWYG's Live Preview aligns to it (top margin 32px, list indent `calc(var(--list-indent) - 0.375em)`, code blocks 16px/1.5). Known non-overridable delta: paragraph spacing (Live Preview blank line = 24px line-height vs reading's 16px `--p-spacing`). A **dev-only** `Debug: Dump Typography Styles` command (see below) samples both views and writes an edit-vs-reading diff to `.native-slides-debug.json` in the vault root.
- **Slides card appearance**: the slide content now sits in a centered, theme-adaptive card (rounded corners, border, soft shadow) over a dimmed backdrop — geometry only; typography is unchanged.

### Changed

- Slides title: the file name is now hidden by default in Slides mode; a new **Slides title** setting (`None` / `File name` / `Title property`) shows the file name or the `title` frontmatter property as the card title. Card width increased to **80vw**.
- Slides bar polish: removed the redundant "Slides: On" chip (the bar's presence already implies Slides mode) and renamed the bar to **slides bar** (the `Toggle Properties Bar` command is now `Toggle Slides Bar`).
- Bottom bar: the "No properties" placeholder is removed — deck pages (frontmatter with only the reserved `deck` key) show just the nav buttons and page number, and the bar hides entirely when there is nothing to display.
- Navigation: the ◀ ▶ arrows are always both shown inside a deck; the one that cannot move (first page's ◀, last page's ▶) is disabled and light gray.
- Settings: the bar-hidden and auto-fullscreen toggles are now persisted (previously reset on reload); auto-fullscreen is also exposed in the settings tab.
- The plugin is now **desktop-only** (`isDesktopOnly: true`); mobile is not supported.
- Broken `deck` links are flagged with a ⚠ warning chip in the bar.
- WYSIWYG properties behavior reworked: the old always-hide-in-edit + auto-open-right-sidebar behavior is replaced by the WYSIWYG mode (above) — outside the mode, edit view shows in-note properties natively. `minAppVersion` remains 1.7.0.
- Development tooling: `main.ts` was split into `src/` modules (`types`, `mode`, `deck-service`, `bar`, `commands`, `settings`, `debug`) with `main.ts` as the orchestration entry point. The `Debug: Dump Typography Styles` command is now registered only in **dev builds** (`npm run build`/`npm run dev`); **release builds** (`npm run build:release`) are minified and exclude it entirely (`--define:DEV_MODE=false` + tree-shaking). No user-visible change beyond removing the debug command from release builds.
- **Slides mode replaces WYSIWYG mode**: the plugin now provides a single immersive, editable card view for deck notes — **Slides mode** — instead of modifying the reading view. Native modes (Source / default Live Preview / Reading) are now **completely untouched** (no status-bar hiding, no bottom bar, no auto-fullscreen, no styling), so the plugin coexists with other reading-view plugins. Enter Slides mode with the `Toggle Slides Mode` command (`Mod+Shift+E`), which records and restores your previous view; the `Previous Page` / `Next Page` hotkeys now auto-enter Slides mode and flip; a new `autoEnterSlides` setting (default off) opens deck notes straight into Slides mode. Slides mode's styling is unchanged from the WYSIWYG look for now.
- Slides mode now **clips to a single screen**: the editor no longer scrolls — content beyond the fold is clipped (no scrollbar), re-clipping automatically on window resize and theme changes.

### Removed

- Reading-view properties bar, reading-view auto-fullscreen, and the global status-bar hide — native modes are now fully untouched.
- `Pause/Resume Auto Fullscreen` command and the `autoFullscreen` setting (obsolete with reading-view fullscreen).
- `Toggle WYSIWYG Mode` command (renamed to `Toggle Slides Mode`).

## [0.1.0] - 2026-08-14

### Added

- Reading-view properties bar: hides the native status bar and renders the current note's frontmatter properties as chips in a bottom bar.
- Immersive fullscreen reading mode: ribbon, sidebars, tab bar and pane header are hidden and OS fullscreen is requested; `Esc` exits fullscreen and reading view together.
- PPT-style deck navigation driven by one reserved frontmatter property `deck` (overview + next links), with auto-computed page numbers — no stored `page-number` property.
- Previous Page / Next Page commands (default `Mod+Shift+←/→`, rebindable under Settings → Hotkeys).
- Settings tab toggling the ◀ ▶ buttons and the page number.
- Example vault (`example-vault/`) with a demo deck and an overview page embedding an Obsidian Base view.

[Unreleased]: https://github.com/Losk-x/obsidian-native-slides/compare/0.1.0...HEAD
[0.1.0]: https://github.com/Losk-x/obsidian-native-slides/releases/tag/0.1.0
