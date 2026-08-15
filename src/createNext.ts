/**
 * createNext.ts — Pure "Create Next Slide" planning core for native-slides.
 *
 * Everything in this module is free of Obsidian runtime dependencies so it can
 * be unit tested directly (see test/createNext.test.ts). main.ts adapts the
 * vault (metadataCache, computeDeck) to this pure interface and applies the
 * resulting plan with vault.create() + fileManager.processFrontMatter().
 *
 * The plan decides, for the current note:
 *   - the name of the new slide file (collision-aware),
 *   - the raw `deck` link texts of the new note,
 *   - the rewrites needed on existing notes (in practice always the current
 *     note itself).
 */

import { extractLinkText } from "./deck";

/** Inputs for planning — resolved by the adapter in main.ts */
export interface CreateNextInput {
  /** Basename (without extension) of the current note */
  currentName: string;
  /** Raw `deck` link texts of the current note (extracted, up to two) */
  currentLinks: string[];
  /** True when the current note IS the deck's overview page (chain index 0) */
  isOverview: boolean;
  /**
   * Raw link text the old first page uses to link back to the overview.
   * Only meaningful for overview insertion (the overview itself only links
   * forward, so its own frontmatter contains no self-reference).
   */
  overviewBackLink?: string;
  /** Basenames of every markdown note in the vault (collision-free naming) */
  existingNames: Set<string>;
}

/** One note whose `deck` property must be rewritten */
export interface DeckRewrite {
  /** Basename of the note to rewrite */
  name: string;
  /** The new raw `deck` link texts (serialized as a YAML list) */
  deck: string[];
}

/** The full plan for creating one new slide */
export interface CreateNextResult {
  /** Basename (without extension) of the new slide file */
  newName: string;
  /** Raw `deck` link texts for the new note's frontmatter */
  newDeckLinks: string[];
  /** Rewrites to apply to existing notes (in practice always the current note) */
  rewrites: DeckRewrite[];
}

/**
 * Plan the creation of a new slide after the current note.
 *
 * Behaviors:
 *   - Last slide (no second link): append `<current>-next` as the new last
 *     slide; the current note gains the second link.
 *   - Slide with a valid next: insert `<current>-next` between them; the new
 *     note takes over the old next link.
 *   - Slide whose second link is broken (plain, non-existing name): create
 *     exactly the declared missing note as the new last slide — the ⚠ warning
 *     disappears and the author's intent is honoured. A broken link that is
 *     not a plain basename (path-qualified, self-referencing) is treated as
 *     invalid and dropped (append a `<current>-next` last slide instead).
 *   - Overview page (single link = first page): insert a new first page; the
 *     overview's link points to it and the old first page is pushed back.
 *
 * Returns null when the note has no usable `deck` links.
 */
export function planCreateNext(input: CreateNextInput): CreateNextResult | null {
  const { currentName, currentLinks, isOverview } = input;
  if (currentLinks.length === 0) return null;

  // ── Overview page: insert a new first page after it ────────────────────
  if (isOverview) {
    const oldFirst = currentLinks[0];
    if (!oldFirst) return null;
    const newName = uniqueName(`${currentName}-next`, input.existingNames);
    const back = input.overviewBackLink ?? `[[${currentName}]]`;
    return {
      newName,
      newDeckLinks: [back, oldFirst],
      rewrites: [{ name: currentName, deck: [`[[${newName}]]`] }],
    };
  }

  // ── Slide: first link is the overview page ─────────────────────────────
  const overviewLink = currentLinks[0];
  if (!overviewLink) return null;
  const nextLink = currentLinks[1];

  if (nextLink) {
    const nextName = extractLinkText(nextLink);
    if (nextName && isPlainName(nextName) && nextName !== currentName) {
      if (!input.existingNames.has(nextName)) {
        // The declared next note does not exist yet → create exactly that
        // note (fixes the broken-link warning, honours the author's intent).
        return {
          newName: nextName,
          newDeckLinks: [overviewLink],
          rewrites: [],
        };
      }
      // A valid next note exists → insert between it and the current note.
      const newName = uniqueName(`${currentName}-next`, input.existingNames);
      return {
        newName,
        newDeckLinks: [overviewLink, nextLink],
        rewrites: [{ name: currentName, deck: [overviewLink, `[[${newName}]]`] }],
      };
    }
    // Invalid (path-qualified / self-referencing) next link → drop it and
    // append a new last slide (fall through to the no-next branch).
  }

  // ── Last slide → append a new last slide after it ──────────────────────
  const newName = uniqueName(`${currentName}-next`, input.existingNames);
  return {
    newName,
    newDeckLinks: [overviewLink],
    rewrites: [{ name: currentName, deck: [overviewLink, `[[${newName}]]`] }],
  };
}

/** A name usable as a vault note name: no path separators, non-empty */
function isPlainName(name: string): boolean {
  return name.length > 0 && !name.includes("/") && !name.includes("\\");
}

/** First free name in the family `base`, `base-2`, `base-3`, … */
function uniqueName(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  for (let i = 2; ; i++) {
    const candidate = `${base}-${i}`;
    if (!existing.has(candidate)) return candidate;
  }
}
