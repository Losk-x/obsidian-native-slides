# Native Slides — Slides Mode for Deck Notes

**English** | [简体中文](README-zh.md)

> An Obsidian plugin that turns deck notes into **Slides**: an immersive,
> editable (Live Preview) "one screen = one card" view with a bottom bar for
> properties and PPT-style navigation — driven by a single frontmatter property.

**Design principles** — zero intrusion into note content, minimal properties footprint (a single `deck` key), no persistence beyond configuration, and efficient, idiomatic code. See [docs/design.md](docs/design.md).

## Features

- **Slides mode** (_deck notes only_): an immersive, editable card view — "one screen = one card". Enter with the **Toggle Slides Mode** command (default hotkey `Mod+Shift+E`); the ribbon, sidebars and tab bar hide, and a bottom bar shows the note's properties, ◀ ▶ navigation and the auto-computed page number. Exiting restores the view you came from (Source / Live Preview / Reading).
- **Native modes stay untouched**: Source mode, the default Live Preview and Reading view keep Obsidian's default behaviour — no status-bar hiding, no bottom bar, no fullscreen, no styling. Slides mode is the plugin's only surface, so it coexists cleanly with other plugins that also modify the reading view.
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
  - Flip pages with the ◀ ▶ buttons in the bar, or with the **Previous Page / Next Page** commands (default hotkeys `Cmd/Ctrl+Shift+←/→`, rebindable under **Settings → Hotkeys**). Pressing them from a native mode enters Slides mode and flips. Both arrows are always shown; the one that cannot move (first page's ◀, last page's ▶) is disabled and light gray.
  - **Create Next Slide** command: creates a new slide right after the current one — the file is named `<current>-next` (collision-aware: `-2`, `-3`, …), both `deck` properties are rewired automatically, and the new note opens ready for content. If the current note's second `deck` link points to a missing note, that exact note is created instead (fixing the ⚠ warning); on the overview page it inserts a new first page. Greyed out for notes that cannot take a next slide.

- **Auto-enter Slides mode** (settings, default off): open deck notes straight into Slides mode; leave off to enter manually.
- A **settings tab** toggles the ◀ ▶ buttons, the page number, and auto-enter.
- **Broken deck-link warnings**: if a `deck` link points to a note that doesn't exist, the bar shows a ⚠ warning chip so authors can spot typos (the chain simply ends or excludes the link).
- **Commands**: _Toggle Slides Mode_ (`Mod+Shift+E`), _Previous Page / Next Page_, _Create Next Slide_, and _Toggle Properties Bar_ — all rebindable under _Settings → Hotkeys_.

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

The demo notes live in [`example-vault/`](example-vault/), which is the Obsidian vault you open to try the plugin. It contains `overview.md`, `welcome.md`, `slide-2.md`, `slide-3.md`, `broken-link-demo.md` (broken-link warning), `folded-properties-demo.md` (Slides properties demo), `typography-demo.md` (a Markdown kitchen sink — headings, lists, tasks, quotes, code blocks, tables, images — used to test Slides typography), five `typography-sample-*.md` notes (fixed one-page samples consumed by the **dev-only** `Debug: Dump Typography Styles` command — do not rename or remove them), a minimal `.obsidian/` configuration, and a plugin folder `example-vault/.obsidian/plugins/native-slides/` whose files (`manifest.json`, `main.js`, `styles.css`) are **symlinks to the repository root** — so the example vault always runs the current build.

> Symlinks require filesystem support (macOS/Linux work out of the box; on Windows enable Developer Mode). If symlinks are unavailable, copy `main.js`, `manifest.json`, `styles.css` into `example-vault/.obsidian/plugins/native-slides/`.

## Getting started

1. Open the example vault: Obsidian → _Open another vault_ → select the `example-vault/` directory inside this repo.
2. Allow community plugins: _Settings → Community plugins → Turn off Safe mode_ (one-time, manual).
3. Enable **Native Slides** under _Settings → Community plugins_.
4. (For the overview page) Enable the core **Bases** plugin: _Settings → Core plugins → Bases_.

Open `welcome.md` and press `Cmd/Ctrl+Shift+E` to enter Slides mode — the bottom bar shows the properties, ◀ ▶ buttons and "Page 1". Press `Cmd/Ctrl+Shift+→` to go to slide 2.

Demo deck: `overview.md` → `welcome.md` → `slide-2.md` → `slide-3.md`.

## How it works

| Piece                             | Mechanism                                                                                                                                                                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hide the status bar (Slides mode) | `body.native-slides-mode .status-bar { display: none }` — native modes keep Obsidian's default status bar                                                                                                                   |
| Immersive layout (Slides mode)    | `body.native-slides-mode` hides the ribbon / sidebars / tab bar; the bottom bar takes the tab bar's measured height (`--native-slides-tabbar-height`)                                                                       |
| Hide in-note properties           | `.markdown-source-view.mod-cm6.is-live-preview .metadata-container { display: none }` — properties live in the bottom bar instead                                                                                           |
| Deck resolution                   | `computeDeck()` reads `deck` (≤ 2 links) → resolves the overview and the first page → walks the chain via each slide's second link (cycle-guarded) → returns the chain + current index                                      |
| Page number                       | position in the chain: index 0 = "Overview", slides = "Page N"; no stored `page-number` property                                                                                                                            |
| PPT navigation                    | `navigate()` steps along the chain and opens via `workspace.openLinkText`; it enters Slides mode first when invoked from a native mode                                                                                      |
| Slides enter / exit               | `enterSlides()` records the current view state and forces the Live Preview; `exitSlides()` restores that exact view state (Source / Live Preview / Reading)                                                                 |
| Create Next Slide                 | `planCreateNext()` (pure core) computes the new file name, the new note's `deck` links and the rewrites; the command applies them via `vault.create` + `fileManager.processFrontMatter` and opens the new note in edit mode |
| Settings                          | `PluginSettingTab` + `loadData/saveData` persist the toggles; hotkeys use Obsidian's native command system                                                                                                                  |

## Development

The plugin is written in TypeScript. You don't need to know TS to ask for changes — describe what you want in natural language and the code will be updated and rebuilt. To build manually:

Run the commands from the repository root:

```sh
npm ci             # first time only (downloads esbuild etc.)
npm run build      # compiles main.ts → main.js (dev build: debug command included)
npm run build:release  # publish build: minified, debug command excluded
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

## For developers

The typography-measurement tooling ships as a **dev-only** command and is excluded from release builds.

- **Dev build** (`npm run build` / `npm run dev`) registers the `Debug: Dump Typography Styles` command: it samples the current note in **both** edit and reading views, computes an edit-vs-reading diff, and writes `.native-slides-debug.json` to the vault root (no manual console copy/paste). Run it on a deck note with Slides mode on; the five `typography-sample-*.md` notes in `example-vault/` are its fixed one-page fixtures — do not rename or remove them.
- **Release build** (`npm run build:release`) minifies `main.js` and drops the debug command (and its supporting code) entirely via `--define:DEV_MODE=false` + tree-shaking. Run `npm run build` afterwards to restore the dev artifact.

The source is split into `src/` modules (`types`, `mode`, `deck-service`, `bar`, `commands`, `settings`, `debug`, `deck`, `createNext`) with `main.ts` as the orchestration entry point.

## Known limitations

- **Desktop only** — the plugin targets the Obsidian desktop app; mobile is not supported.
- Slides mode applies only to **deck notes** (notes with a `deck` property); all other notes are left fully native.
- Properties come from **frontmatter** (the `---` YAML block at the top); inline `key:: value` properties are not read.
- `deck` is a **reserved key name**; the `position` key is also reserved and hidden from the bar (it can be used by other tools without cluttering the bar).
- The default hotkeys shadow the editor's "select to line start/end" shortcuts in edit view; remove them in **Settings → Hotkeys** if you don't need page navigation.
- Quote link values in YAML (`deck: ["[[slide-2]]"]`) — unquoted `[[...]]` becomes a nested YAML array (the plugin tolerates it, but quoting is the correct form).
- The deck chain must not contain cycles; a broken link simply ends (or excludes) the chain.

## License

Released under the [MIT License](LICENSE). Copyright (c) 2026 Yuanhui Luo.
