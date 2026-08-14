/**
 * deck.ts — Pure deck-resolution core for read-props-bar.
 *
 * Everything in this module is free of Obsidian runtime dependencies so it can
 * be unit tested directly (see test/deck.test.ts). main.ts adapts the vault
 * (metadataCache) to this pure interface: it resolves `deck` properties to
 * note paths, then hands the path graph to computeDeck().
 */

/** A deck link list never holds more than two entries */
export const MAX_DECK_LINKS = 2;

/** Result of resolving a note's position inside a deck */
export interface DeckInfo {
  /** Chain of note paths: [0] is the overview note, then slides in order */
  chain: string[];
  /** Index of the current note inside chain */
  index: number;
}

/**
 * Resolve a note's position inside its deck by walking the link chain.
 *
 * Convention for the single `deck` property (up to two links):
 *   - overview note: one link → that link IS the first page;
 *   - slide note:    first link → the overview page, second link → next slide
 *                    (no second link on the last slide).
 *
 * `getLinks(path)` must return the resolved note paths of the `deck` property
 * of the note at `path` (empty when the note has none, or its links are
 * broken — a broken link simply ends or excludes the chain, never crashes).
 *
 * Returns the full chain ([overview, slide 1, slide 2, …]) and the current
 * note's index, or null when the note is not part of any deck.
 */
export function computeDeck(
  currentPath: string,
  getLinks: (path: string) => string[],
): DeckInfo | null {
  const currentLinks = getLinks(currentPath);
  if (currentLinks.length === 0) return null;

  let overview: string | undefined;
  let firstPage: string | undefined;

  if (currentLinks.length >= 2) {
    // A slide: first link is the overview page
    overview = currentLinks[0];
    firstPage = getLinks(overview)[0];
  } else {
    // A single link: either we ARE the overview (link = first page),
    // or we are the last slide (link = overview page)
    const only = currentLinks[0];
    const onlyLinks = getLinks(only);
    if (onlyLinks[0] === currentPath) {
      overview = currentPath;
      firstPage = only;
    } else {
      overview = only;
      firstPage = onlyLinks[0];
    }
  }
  if (!overview || !firstPage) return null;

  // Walk the chain: overview → first page → next → next → …
  const chain: string[] = [];
  const visited = new Set<string>();
  const push = (p: string | undefined): void => {
    if (p && !visited.has(p)) {
      visited.add(p);
      chain.push(p);
    }
  };
  push(overview);
  push(firstPage);
  let cur = firstPage;
  while (cur) {
    const next = getLinks(cur)[1];
    if (!next || visited.has(next)) break; // end of deck or cycle guard
    push(next);
    cur = next;
  }

  const index = chain.indexOf(currentPath);
  if (index === -1) return null;
  return { chain, index };
}

/**
 * Extract up to `max` note names from a `deck` property value.
 * Accepts a single string or a YAML list of strings; unquoted [[x]] values are
 * parsed by YAML as nested arrays and flattened here.
 */
export function extractLinks(value: unknown, max: number = MAX_DECK_LINKS): string[] {
  const flat: unknown[] = [];
  const collect = (v: unknown): void => {
    if (Array.isArray(v)) {
      for (const item of v) collect(item);
    } else {
      flat.push(v);
    }
  };
  collect(value);

  const out: string[] = [];
  for (const item of flat) {
    const name = extractLinkText(item);
    if (name) out.push(name);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Extract the target note name from a markdown link string.
 * Handles several shapes:
 *   "[[slide-2]]"        → slide-2
 *   "[[slide-2|alias]]"  → slide-2
 *   "[[slide-2#section]]"→ slide-2
 *   slide-2              → slide-2 (bare filename)
 */
export function extractLinkText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^\[\[/, "").replace(/\]\]$/, "").split("|")[0].split("#")[0].trim();
}

/** Render a property value as readable text: arrays/objects → JSON, else String */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
