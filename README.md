# Native Slides — Reading-View Properties Bar

**English** | [简体中文](README-zh.md)

> An Obsidian plugin that hides the status bar and shows the current note's
> properties in a bottom bar during reading view — with PPT-style deck
> navigation driven by a single frontmatter property.

**Design principles** — zero intrusion into note content, minimal properties footprint (a single `deck` key), no persistence beyond configuration, and efficient, idiomatic code. See [docs/design.md](docs/design.md).

## Features

- Hides Obsidian's native status bar and renders a **properties bar** at the bottom of the window.
- In **reading view**, shows the current note's properties (YAML frontmatter) as chips in the bar; the in-note properties panel is hidden (kept in edit view). The bar hides when there is nothing to show — a note with no properties gets no bar, and a deck page (frontmatter with only the reserved `deck` key) shows just the ◀ ▶ navigation and page number.
- Reading view **auto-enters a fullscreen-like mode**: the ribbon, sidebars, tab bar and the pane header bar are hidden, and the OS-level fullscreen is requested (falls back gracefully). Everything restores when you leave reading view — and **pressing `Esc` exits both fullscreen and reading view**.
- **PPT-style deck navigation** with **one reserved frontmatter property, `deck`** (up to two markdown links):

  ```yaml
  # Overview page — one link = the first page of the deck
  deck: ["[[welcome]]"]

  # Slide page — first link = the overview page, second link = the next slide
  deck: ["[[overview]]", "[[slide-2]]"]
  # Last slide — only the overview link
  deck: ["[[overview]]"]
  ```

  - **Page numbers are auto-computed** by walking the link chain (overview → slide 1 → slide 2 → …), so no `page-number` property is needed. The overview page shows "Overview", slides show "Page N".
  - Flip pages with the ◀ ▶ buttons on the left of the bar, or with the **Previous Page / Next Page** commands (default hotkeys `Cmd/Ctrl+Shift+←/→`, rebindable under **Settings → Hotkeys**). Both arrows are always shown; the one that cannot move (first page's ◀, last page's ▶) is disabled and light gray.
  - **Create Next Slide** command: creates a new slide right after the current one — the file is named `<current>-next` (collision-aware: `-2`, `-3`, …), both `deck` properties are rewired automatically, and the new note opens in edit mode ready for content. If the current note's second `deck` link points to a missing note, that exact note is created instead (fixing the ⚠ warning); on the overview page it inserts a new first page. Greyed out for notes that cannot take a next slide.
  - Navigation keeps you in reading view, so the immersive fullscreen experience is uninterrupted.

- A **settings tab** toggles the ◀ ▶ buttons, the page number, and auto-fullscreen.
- **Broken deck-link warnings**: if a `deck` link points to a note that doesn't exist, the bar shows a ⚠ warning chip so authors can spot typos (the chain simply ends or excludes the link).
- **WYSIWYG mode** (_deck notes only_): an explicit immersive mode (command **Toggle WYSIWYG Mode**, default hotkey `Mod+Shift+E`, a bottom-bar button, or the settings toggle, default off). When on: the **tab bar and sidebars hide** in both edit and reading views, the bottom bar also shows in edit view and matches the tab bar's measured height (no content-area height change when switching modes), and the **in-note properties panel hides while editing** — the same look as reading view. Outside the mode, edit view behaves natively (properties show normally). Typography alignment follows in a later phase.
- **Commands**: _Toggle Properties Bar_ and _Pause/Resume Auto Fullscreen_ (both persist), plus _Previous Page / Next Page_ for deck navigation, _Create Next Slide_ for deck authoring, and _Toggle WYSIWYG Mode_ — all rebindable under _Settings → Hotkeys_.

## Overview page with an embedded Base view

The example vault ships an `overview.md` that embeds an Obsidian **Base** view (core **Bases** plugin, introduced in Obsidian 1.10) filtering every note that **links to the overview page** — i.e. all slides:

````markdown
```base
filters:
  and:
    - file.hasLink("overview")
views:
  - type: table
    name: Deck
```
````

Enable the core plugin if the view does not render: _Settings → Core plugins → Bases_.

> The Base view needs Obsidian **1.10+** (the Bases core plugin); the plugin itself supports **1.7.0+** (its `minAppVersion`) — on older versions the overview table simply won't render.

## Example vault

The demo notes live in [`example-vault/`](example-vault/), which is the Obsidian vault you open to try the plugin. It contains `overview.md`, `welcome.md`, `slide-2.md`, `slide-3.md`, `broken-link-demo.md` (broken-link warning), `folded-properties-demo.md` (WYSIWYG properties demo), a minimal `.obsidian/` configuration, and a plugin folder `example-vault/.obsidian/plugins/native-slides/` whose files (`manifest.json`, `main.js`, `styles.css`) are **symlinks to the repository root** — so the example vault always runs the current build.

> Symlinks require filesystem support (macOS/Linux work out of the box; on Windows enable Developer Mode). If symlinks are unavailable, copy `main.js`, `manifest.json`, `styles.css` into `example-vault/.obsidian/plugins/native-slides/`.

## Getting started

1. Open the example vault: Obsidian → _Open another vault_ → select the `example-vault/` directory inside this repo.
2. Allow community plugins: _Settings → Community plugins → Turn off Safe mode_ (one-time, manual).
3. Enable **Native Slides** under _Settings → Community plugins_.
4. (For the overview page) Enable the core **Bases** plugin: _Settings → Core plugins → Bases_.

Open `welcome.md` and press `Cmd/Ctrl+E` to switch to reading view — the bottom bar shows the properties, ◀ ▶ buttons and "Page 1". Press `Cmd/Ctrl+Shift+→` to go to slide 2.

Demo deck: `overview.md` → `welcome.md` → `slide-2.md` → `slide-3.md`.

## How it works

| Piece                                            | Mechanism                                                                                                                                                                                                                   |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hide the status bar                              | `styles.css`: `.status-bar { display: none !important; }`                                                                                                                                                                   |
| Hide the in-note properties panel (reading view) | `.markdown-reading-view .metadata-container { display: none; }`                                                                                                                                                             |
| Hide the bar when empty                          | `refresh()` renders nothing when there are no displayable properties (frontmatter beyond `deck`/`position`); deck pages still show navigation + page number                                                                 |     |
| Fullscreen reading mode                          | `refresh()` adds `native-slides-fullscreen` to `body` when in reading view; CSS hides ribbon / sidebars / tab bar / `.view-header`; `requestFullscreen()` tries OS fullscreen                                               |
| Esc exits fullscreen + reading view              | `fullscreenchange` handler: when the OS leaves fullscreen while we were fullscreen, call `view.setMode("source")` (guarded so our own `exitFullscreen()` never re-triggers it)                                              |
| Deck resolution                                  | `computeDeck()` reads `deck` (≤ 2 links) → resolves the overview and the first page → walks the chain via each slide's second link (cycle-guarded) → returns the chain + current index                                      |
| Page number                                      | position in the chain: index 0 = "Overview", slides = "Page N"; no stored `page-number` property                                                                                                                            |
| PPT navigation                                   | `navigate()` steps along the chain and opens via `workspace.openLinkText`, preserving reading view                                                                                                                          |
| Create Next Slide                                | `planCreateNext()` (pure core) computes the new file name, the new note's `deck` links and the rewrites; the command applies them via `vault.create` + `fileManager.processFrontMatter` and opens the new note in edit mode |
| Settings                                         | `PluginSettingTab` + `loadData/saveData` persist the toggles; hotkeys use Obsidian's native command system                                                                                                                  |

## Development

The plugin is written in TypeScript. You don't need to know TS to ask for changes — describe what you want in natural language and the code will be updated and rebuilt. To build manually:

Run the commands from the repository root:

```sh
npm ci             # first time only (downloads esbuild etc.)
npm run build      # compiles main.ts → main.js
npm run check      # optional: TypeScript type-check (tsc --noEmit)
npm run test       # optional: vitest unit tests
npm run lint       # optional: ESLint
npm run format:check  # optional: Prettier
```

### Dev loop (rebuild + reload)

Rebuild on change, then reload manually:

```sh
npm run dev        # watch main.ts, rebuild main.js on change
```

After editing `main.ts`, reload the plugin in Obsidian: open the command palette with `Cmd/Ctrl+P`, search for **Reload app without saving**, and run it (it has no default hotkey). Alternatively, disable/re-enable **Native Slides** under _Settings → Community plugins_.

## Known limitations

- **Desktop only** — the plugin targets the Obsidian desktop app (it hides the status bar and requests OS fullscreen); mobile is not supported.
- Properties come from **frontmatter** (the `---` YAML block at the top); inline `key:: value` properties are not read.
- Hiding the status bar is **global** (all notes, all modes); remove the `.status-bar` rule in `styles.css` to disable.
- `deck` is a **reserved key name**; the `position` key is also reserved and hidden from the bar (it can be used by other tools without cluttering the bar).
- The default hotkeys shadow the editor's "select to line start/end" shortcuts in edit view; remove them in **Settings → Hotkeys** if you don't need page navigation.
- OS-level fullscreen relies on Electron's Fullscreen API; where unsupported it degrades to "hide sidebars and tab bar only".
- Quote link values in YAML (`deck: ["[[slide-2]]"]`) — unquoted `[[...]]` becomes a nested YAML array (the plugin tolerates it, but quoting is the correct form).
- The deck chain must not contain cycles; a broken link simply ends (or excludes) the chain.

## License

Released under the [MIT License](LICENSE). Copyright (c) 2026 Yuanhui Luo.
