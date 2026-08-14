# Design Principles

**English** | [简体中文](design-zh.md)

Four core principles guide every change to this project. If a change conflicts
with one of them, the change needs a strong justification.

## 1. Zero intrusion into note content

Notes stay perfectly readable in **source mode** and **live preview**. The plugin
never rewrites, reorders, or injects markers into note content — it only *reads*
(via `metadataCache`) and *renders UI* (the bottom bar, CSS overrides). The only
in-note footprint is the `deck` frontmatter property, which is plain, readable YAML.

## 2. Minimal intrusion into properties

The plugin adds exactly **one** reserved frontmatter key — `deck` — and nothing
else. All other keys are left untouched and merely *displayed* if the user already
has them. Demo notes keep this footprint to the bare minimum (no decorative
`tags`), so adopting the plugin costs exactly one property per note.

## 3. No unnecessary persistence beyond configuration

- Everything derived from the notes (deck chains, page numbers) is computed
  **on the fly** from `metadataCache`; nothing derived is ever cached to disk.
- The only persisted data is **configuration**: two UI booleans (show ◀ ▶
  buttons, show page number), via `loadData/saveData`.
- Required data belongs to the **note structure itself** — the deck *is* the
  overview note plus each slide's `deck` links. There is no separate "deck
  index" file or database to create, keep in sync, or corrupt.
- No background scans, no indexes, no writes to the vault.

## 4. Efficient implementation, no premature optimization

- Efficiency is a goal, not an obsession: on-the-fly in-memory computation,
  event-driven refreshes, and a guarded 500 ms fallback timer are enough for
  real use — no more.
- No premature optimization: no memoization, caching layers, or indexes until
  profiling shows they are actually needed.
- Code follows open-source conventions and best practices: strongly typed,
  documented, readable, elegant; conventional commits; CI-friendly.

## Trade-offs

- Reading view hides the in-note properties panel (CSS only) to avoid duplicating
  what the bottom bar shows — the note file itself is never touched.
- The `deck` chain walk reads the frontmatter of every note in the chain on each
  refresh; acceptable because `metadataCache` is in-memory and decks are small.
  Per principle 4, a memoized chain cache is deliberately deferred until profiling
  shows a real need.
