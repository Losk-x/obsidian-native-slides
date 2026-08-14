---
deck: ["[[welcome]]"]
---

# Overview · Deck index

This is the **overview page** of the deck. Its `deck` property has **one link** — that link *is* the first page (`welcome`).

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
> (*Settings → Core plugins → Bases*), then reload this note.

**Convention for the `deck` property** (one property, up to two links):

- **Overview page:** `deck: ["[[first-slide]]"]` — one link = the first page.
- **Slide page:** `deck: ["[[overview]]", "[[next-slide]]"]` — first link = the overview page, second link = the next slide (omit it on the last slide).

Page numbers are computed automatically by walking these links, so no `page-number` property is needed. Open `welcome.md` in reading view to flip through the deck.
