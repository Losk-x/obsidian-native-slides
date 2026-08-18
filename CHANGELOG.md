# Changelog

All notable user-visible changes to Native Slides are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Categories: Added, Changed, Deprecated, Removed, Fixed, Security. Omit any category with no entries. On release, rename [Unreleased] to the version with its date and start a fresh empty [Unreleased] above it.

## [Unreleased]

### Added

- **Deck progress indicator**: discrete clickable segments at the top of the slides bar — one segment per slide in the deck chain. Past segments use semi-transparent accent, current uses full accent, future uses track colour. Each segment is an independent hover/click target to jump to that slide. Toggle under Settings → Show progress bar (default on).

### Changed

- **Page number format**: now shows `N / Total` instead of "Overview" / "Page N". Overview is page 0; content pages start from 1; total excludes the overview page.
- **Settings defaults**: `showPageNumber` now defaults to off (progress segments alone give enough context); new `showSlidesBar` master toggle (default on) can hide the entire bar.

## [0.1.0] - 2026-08-18

### Added

- **Style templates**: six built-in looks for the Slides card **and** slides bar — _Lecture (jyy)_ (default, after the slideshow cards of [jyywiki.cn](https://jyywiki.cn) lecture notes: a bordered card with soft shadow that fills the screen, a compact bold title over a thin bottom rule, tight headings, and disc bullets with a constant marker-to-text gap), _Dashed outline_ (the previous default look), _Paper card_ (solid slide with soft shadow), _Minimal_ (no card boundary, flat canvas), _Accent edge_ (accent line on card top and bar) and _Frosted glass_ (translucent, blurred surfaces over a tinted backdrop). Pick one under Settings → Style template; every template adapts to light and dark themes. The example vault ships a small deck (`jyy-overview`) that reproduces two jyywiki slides for side-by-side comparison.
- **Presentation parking**: click the slides bar to move focus out of the editor — the blinking caret disappears while you present (the nav buttons keep working), and the bar shows the plain arrow cursor with a gentle hover glow. Click any slide content to resume editing.
- **Toggle Mouse Pointer** command (default hotkey `Mod+Shift+M`, rebindable): hides the mouse pointer window-wide for presenting and parks focus at the same time (no caret either); run it again to bring the pointer back, and leaving Slides mode always restores it.
- **Create Next Slide** command: creates a new slide right after the current one — the file is named `<current>-next` (collision-aware: `-2`, `-3`, …), both `deck` properties are rewired automatically, and the new note opens in edit mode. If the current note's second `deck` link points to a missing note, that exact note is created instead (fixing the ⚠ warning); on the overview page it inserts a new first page. The command is greyed out for notes that cannot take a next slide.
- **WYSIWYG mode** (deck notes only): explicit immersive mode — command `Toggle WYSIWYG Mode` (default hotkey `Mod+Shift+E`), bottom-bar button, or settings toggle (default off). **WYSIWYG = Live Preview styled to match the reading view** (reading is the untouched reference): Live Preview's top margin, list indentation and code-block metrics align to reading; the **tab bar and sidebars hide** (Live Preview + reading view; Source mode stays completely native), the bottom bar shows in Live Preview too and matches the tab bar's measured height (runtime CSS variable; no content-area height change when switching modes), **in-note properties hide while editing** in Live Preview, and **standalone image lines are centered**. Toggling from reading view jumps into the WYSIWYG edit view.
- **WYSIWYG typography alignment (Live Preview → reading)**: reading view stays fully default; WYSIWYG's Live Preview aligns to it (top margin 32px, list indent `calc(var(--list-indent) - 0.375em)`, code blocks 16px/1.5). Known non-overridable delta: paragraph spacing (Live Preview blank line = 24px line-height vs reading's 16px `--p-spacing`). A **dev-only** `Debug: Dump Typography Styles` command (see below) samples both views and writes an edit-vs-reading diff to `.native-slides-debug.json` in the vault root.
- **Slides card appearance**: the slide content now sits in a centered, theme-adaptive card (rounded corners, border, soft shadow) over a dimmed backdrop — geometry only; typography is unchanged.

### Changed

- The default style template is now **Lecture (jyy)** (formerly _Lecture (wiki)_); the previous default, _Dashed outline_, stays selectable in Settings → Style template.
- Lecture (jyy) template: the card no longer locks the editor to 16px — it now follows Obsidian's font size setting (Settings → Appearance → Font size), with every metric em-based so the card, headings, list pitch and spacing all scale as one piece; this is the size control that goes beyond Obsidian's built-in zoom cap (at a 16px font the typography is unchanged). For large-screen reading the card now runs **80vw wide and stretches to fill the window height** (slim outer margins, content top-aligned) instead of a small 600px card, and list items carry the wiki's measured 4px item gaps (8px where a nested list resumes the parent level).
- Slides title: the file name is now hidden by default in Slides mode; a new **Slides title** setting takes any frontmatter property (or `filename` for the file name) and shows it as the card title. Card width increased to **80vw**.
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
