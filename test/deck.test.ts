import { describe, expect, it } from "vitest";
import {
  MAX_DECK_LINKS,
  computeDeck,
  extractLinkText,
  extractLinks,
  extractRawLinks,
  formatValue,
} from "../src/deck";

// ── extractLinks ──────────────────────────────────────────────────────────

describe("extractLinks", () => {
  it("accepts a single string", () => {
    expect(extractLinks("[[slide-2]]")).toEqual(["slide-2"]);
  });

  it("accepts a YAML list of strings", () => {
    expect(extractLinks(["[[overview]]", "[[slide-2]]"])).toEqual(["overview", "slide-2"]);
  });

  it("flattens nested arrays from unquoted [[x]] values", () => {
    expect(extractLinks([["overview"], ["slide-2"]])).toEqual(["overview", "slide-2"]);
  });

  it("caps at MAX_DECK_LINKS", () => {
    expect(extractLinks(["[[a]]", "[[b]]", "[[c]]"])).toHaveLength(MAX_DECK_LINKS);
    expect(extractLinks(["[[a]]", "[[b]]", "[[c]]"])).toEqual(["a", "b"]);
  });

  it("returns [] for null/undefined/empty", () => {
    expect(extractLinks(null)).toEqual([]);
    expect(extractLinks(undefined)).toEqual([]);
    expect(extractLinks("")).toEqual([]);
  });

  it("skips non-string entries", () => {
    expect(extractLinks([42, "[[a]]", { x: 1 }])).toEqual(["a"]);
  });

  it("honors a custom max", () => {
    expect(extractLinks(["[[a]]", "[[b]]"], 1)).toEqual(["a"]);
  });
});

// ── extractRawLinks ───────────────────────────────────────────────────────

describe("extractRawLinks", () => {
  it("returns the raw link strings exactly as written", () => {
    expect(extractRawLinks(["[[overview]]", "[[slide-2|alias]]"])).toEqual([
      "[[overview]]",
      "[[slide-2|alias]]",
    ]);
  });

  it("accepts a single string", () => {
    expect(extractRawLinks("[[slide-2]]")).toEqual(["[[slide-2]]"]);
  });

  it("flattens nested arrays from unquoted [[x]] values", () => {
    expect(extractRawLinks([["overview"], ["slide-2"]])).toEqual(["overview", "slide-2"]);
  });

  it("trims whitespace and drops empty strings", () => {
    expect(extractRawLinks(["  [[slide-2]]  ", "", "  "])).toEqual(["[[slide-2]]"]);
  });

  it("skips non-string entries", () => {
    expect(extractRawLinks([42, "[[a]]", { x: 1 }])).toEqual(["[[a]]"]);
  });

  it("caps at MAX_DECK_LINKS", () => {
    expect(extractRawLinks(["[[a]]", "[[b]]", "[[c]]"])).toEqual(["[[a]]", "[[b]]"]);
  });

  it("returns [] for null/undefined/empty", () => {
    expect(extractRawLinks(null)).toEqual([]);
    expect(extractRawLinks(undefined)).toEqual([]);
    expect(extractRawLinks("")).toEqual([]);
  });
});

// ── extractLinkText ───────────────────────────────────────────────────────

describe("extractLinkText", () => {
  it("strips [[ ]]", () => {
    expect(extractLinkText("[[slide-2]]")).toBe("slide-2");
  });

  it("drops the alias part", () => {
    expect(extractLinkText("[[slide-2|alias]]")).toBe("slide-2");
  });

  it("drops the section part", () => {
    expect(extractLinkText("[[slide-2#section]]")).toBe("slide-2");
  });

  it("keeps bare filenames", () => {
    expect(extractLinkText("slide-2")).toBe("slide-2");
  });

  it("trims whitespace", () => {
    expect(extractLinkText("  [[slide-2]]  ")).toBe("slide-2");
  });

  it("returns null for non-strings and empties", () => {
    expect(extractLinkText(42)).toBeNull();
    expect(extractLinkText("")).toBeNull();
    expect(extractLinkText("   ")).toBeNull();
  });
});

// ── formatValue ───────────────────────────────────────────────────────────

describe("formatValue", () => {
  it("renders null/undefined as em dash", () => {
    expect(formatValue(null)).toBe("—");
    expect(formatValue(undefined)).toBe("—");
  });

  it("renders strings/numbers/booleans as-is", () => {
    expect(formatValue("hi")).toBe("hi");
    expect(formatValue(42)).toBe("42");
    expect(formatValue(true)).toBe("true");
  });

  it("renders objects as JSON", () => {
    expect(formatValue({ a: 1 })).toBe('{"a":1}');
    expect(formatValue(["x", "y"])).toBe('["x","y"]');
  });
});

// ── computeDeck ───────────────────────────────────────────────────────────

/** Build a link graph: path → its resolved deck-link target paths */
function graphOf(defs: Record<string, string[]>): (path: string) => string[] {
  return (path) => defs[path] ?? [];
}

/** The demo deck: overview → welcome → slide-2 → slide-3 */
const demo = {
  overview: ["welcome"],
  welcome: ["overview", "slide-2"],
  "slide-2": ["overview", "slide-3"],
  "slide-3": ["overview"],
};

describe("computeDeck", () => {
  it("builds the full chain and index for a slide", () => {
    const deck = computeDeck("slide-2", graphOf(demo))!;
    expect(deck.chain).toEqual(["overview", "welcome", "slide-2", "slide-3"]);
    expect(deck.index).toBe(2);
  });

  it("returns index 0 for the overview page", () => {
    const deck = computeDeck("overview", graphOf(demo))!;
    expect(deck.chain[0]).toBe("overview");
    expect(deck.index).toBe(0);
  });

  it("detects the last slide via its single overview link", () => {
    const deck = computeDeck("slide-3", graphOf(demo))!;
    expect(deck.index).toBe(3);
    expect(deck.chain).toHaveLength(4);
  });

  it("disambiguates a note whose single link points back to it (overview)", () => {
    const g = { o: ["w"], w: ["o"] };
    const deck = computeDeck("o", graphOf(g))!;
    expect(deck.chain).toEqual(["o", "w"]);
    expect(deck.index).toBe(0);
  });

  it("returns null for a note with no deck property", () => {
    expect(computeDeck("untracked", graphOf(demo))).toBeNull();
  });

  it("ends the chain when a slide has no next link", () => {
    const g = { o: ["a"], a: ["o", "b"], b: ["o"] };
    expect(computeDeck("b", graphOf(g))!.chain).toEqual(["o", "a", "b"]);
  });

  it("guards against cycles (second link points back to the overview)", () => {
    const g = { o: ["a"], a: ["o", "o"] };
    const deck = computeDeck("a", graphOf(g))!;
    expect(deck.chain).toEqual(["o", "a"]);
  });

  it("returns null when the note is not in its own chain", () => {
    // "orphan" links into the deck but the chain never reaches it
    const g = {
      o: ["welcome"],
      welcome: ["o", "slide-2"],
      "slide-2": ["o"],
      orphan: ["o", "slide-2"],
    };
    expect(computeDeck("orphan", graphOf(g))).toBeNull();
  });

  it("handles a broken overview link as end-of-chain, not a crash", () => {
    const g = { o: ["missing"], missing: [] };
    expect(computeDeck("o", graphOf(g))).toBeNull();
  });
});
