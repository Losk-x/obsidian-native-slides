# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-08-14

### Added

- Reading-view properties bar: hides the native status bar and renders the current note's frontmatter properties as chips in a bottom bar.
- Immersive fullscreen reading mode: ribbon, sidebars, tab bar and pane header are hidden and OS fullscreen is requested; `Esc` exits fullscreen and reading view together.
- PPT-style deck navigation driven by one reserved frontmatter property `deck` (overview + next links), with auto-computed page numbers — no stored `page-number` property.
- Previous Page / Next Page commands (default `Mod+Shift+←/→`, rebindable under Settings → Hotkeys).
- Settings tab toggling the ◀ ▶ buttons and the page number.
- Example vault (`example-vault/`) with a demo deck and an overview page embedding an Obsidian Base view.

[Unreleased]: https://github.com/Losk-x/obsidian-native-slides/compare/1.0.0...HEAD
[1.0.0]: https://github.com/Losk-x/obsidian-native-slides/releases/tag/1.0.0
