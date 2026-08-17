import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, SLIDES_THEMES } from "../src/types";

describe("SLIDES_THEMES registry", () => {
  it("has unique, non-empty ids", () => {
    const ids = SLIDES_THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of SLIDES_THEMES) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.label.length).toBeGreaterThan(0);
    }
  });

  it("default slidesTheme is a registered theme", () => {
    expect(SLIDES_THEMES.some((t) => t.id === DEFAULT_SETTINGS.slidesTheme)).toBe(true);
  });
});
