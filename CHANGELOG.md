# Changelog

All notable user-visible changes to Native Slides are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Categories: Added, Changed, Deprecated, Removed, Fixed, Security. Omit any category with no entries. On release, rename [Unreleased] to the version with its date and start a fresh empty [Unreleased] above it.

## [Unreleased]

### Added

- **Create Next Slide** command: creates a new slide right after the current one — the file is named `<current>-next` (collision-aware: `-2`, `-3`, …), both `deck` properties are rewired automatically, and the new note opens in edit mode. If the current note's second `deck` link points to a missing note, that exact note is created instead (fixing the ⚠ warning); on the overview page it inserts a new first page. The command is greyed out for notes that cannot take a next slide.
- **WYSIWYG mode** (deck notes only): explicit immersive mode — command `Toggle WYSIWYG Mode` (default hotkey `Mod+Shift+E`), bottom-bar button, or settings toggle (default off). When on, the **tab bar and sidebars hide** in both edit and reading views, the bottom bar also shows in edit view and matches the tab bar's measured height (runtime CSS variable; no content-area height change when switching modes), and **in-note properties hide while editing** (same look as reading view). Toggling from reading view jumps into the WYSIWYG edit view.

### Changed

- Bottom bar: the "No properties" placeholder is removed — deck pages (frontmatter with only the reserved `deck` key) show just the nav buttons and page number, and the bar hides entirely when there is nothing to display.
- Navigation: the ◀ ▶ arrows are always both shown inside a deck; the one that cannot move (first page's ◀, last page's ▶) is disabled and light gray.
- Settings: the bar-hidden and auto-fullscreen toggles are now persisted (previously reset on reload); auto-fullscreen is also exposed in the settings tab.
- The plugin is now **desktop-only** (`isDesktopOnly: true`); mobile is not supported.
- Broken `deck` links are flagged with a ⚠ warning chip in the bar.
- WYSIWYG properties behavior reworked: the old always-hide-in-edit + auto-open-right-sidebar behavior is replaced by the WYSIWYG mode (above) — outside the mode, edit view shows in-note properties natively. `minAppVersion` remains 1.7.0.

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
