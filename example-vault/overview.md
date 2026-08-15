---
deck: ["[[welcome]]"]
---

# Overview · Deck index

This is the **overview page** of the deck. Its `deck` property has **one link** — that link _is_ the first page (`welcome`).

Below is an embedded Obsidian **Base** view (core plugin) that filters every note **linking to this page** — i.e. all the slides:

```base
filters:
  and:
    - file.hasLink("overview")
views:
  - type: table
    name: Deck
```

> If the Base view does not render: enable the core **Bases** plugin
> (_Settings → Core plugins → Bases_), then reload this note.

**Convention for the `deck` property** (one property, up to two links):

- **Overview page:** `deck: ["[[first-slide]]"]` — one link = the first page.
- **Slide page:** `deck: ["[[overview]]", "[[next-slide]]"]` — first link = the overview page, second link = the next slide (omit it on the last slide).
- **Create Next Slide command:** run "Create Next Slide" on a slide to append/insert a new page after it (named `<current>-next`, collision-aware) — both `deck` properties are rewired automatically. On this overview page it inserts a new **first page**. If a slide's second link points to a missing note, that exact note is created instead (fixing the ⚠ warning).

Page numbers are computed automatically by walking these links, so no `page-number` property is needed. Open `welcome.md` in reading view to flip through the deck.
