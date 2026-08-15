import { describe, expect, it } from "vitest";
import { planCreateNext } from "../src/createNext";

const noNames = new Set<string>();

describe("planCreateNext", () => {
  // ── last slide → append ────────────────────────────────────────────────

  it("appends a new last slide after a last slide", () => {
    const plan = planCreateNext({
      currentName: "slide-3",
      currentLinks: ["[[overview]]"],
      isOverview: false,
      existingNames: noNames,
    })!;
    expect(plan.newName).toBe("slide-3-next");
    expect(plan.newDeckLinks).toEqual(["[[overview]]"]);
    expect(plan.rewrites).toEqual([
      { name: "slide-3", deck: ["[[overview]]", "[[slide-3-next]]"] },
    ]);
  });

  // ── valid next → insert between ────────────────────────────────────────

  it("inserts between the current slide and its valid next", () => {
    const plan = planCreateNext({
      currentName: "slide-2",
      currentLinks: ["[[overview]]", "[[slide-3]]"],
      isOverview: false,
      existingNames: new Set(["slide-3"]),
    })!;
    expect(plan.newName).toBe("slide-2-next");
    expect(plan.newDeckLinks).toEqual(["[[overview]]", "[[slide-3]]"]);
    expect(plan.rewrites).toEqual([
      { name: "slide-2", deck: ["[[overview]]", "[[slide-2-next]]"] },
    ]);
  });

  it("preserves the original link texts (alias forms) in the new note", () => {
    const plan = planCreateNext({
      currentName: "slide-2",
      currentLinks: ["[[overview|Home]]", "[[slide-3]]"],
      isOverview: false,
      existingNames: new Set(["slide-3"]),
    })!;
    expect(plan.newDeckLinks).toEqual(["[[overview|Home]]", "[[slide-3]]"]);
    expect(plan.rewrites[0].deck).toEqual(["[[overview|Home]]", "[[slide-2-next]]"]);
  });

  // ── broken next → create the missing note ──────────────────────────────

  it("creates the missing declared next note (fixes the broken link)", () => {
    const plan = planCreateNext({
      currentName: "welcome",
      currentLinks: ["[[overview]]", "[[missing-slide]]"],
      isOverview: false,
      existingNames: noNames,
    })!;
    expect(plan.newName).toBe("missing-slide");
    expect(plan.newDeckLinks).toEqual(["[[overview]]"]);
    expect(plan.rewrites).toEqual([]);
  });

  it("creates the missing note even when the link carries an alias", () => {
    const plan = planCreateNext({
      currentName: "welcome",
      currentLinks: ["[[overview]]", "[[missing-slide|Draft]]"],
      isOverview: false,
      existingNames: noNames,
    })!;
    expect(plan.newName).toBe("missing-slide");
    expect(plan.newDeckLinks).toEqual(["[[overview]]"]);
  });

  it("treats a path-qualified broken link as invalid → appends a new last slide", () => {
    const plan = planCreateNext({
      currentName: "welcome",
      currentLinks: ["[[overview]]", "[[sub/missing]]"],
      isOverview: false,
      existingNames: noNames,
    })!;
    expect(plan.newName).toBe("welcome-next");
    expect(plan.newDeckLinks).toEqual(["[[overview]]"]);
    expect(plan.rewrites[0].deck).toEqual(["[[overview]]", "[[welcome-next]]"]);
  });

  it("treats a self-referencing broken link as invalid → appends a new last slide", () => {
    const plan = planCreateNext({
      currentName: "welcome",
      currentLinks: ["[[overview]]", "[[welcome]]"],
      isOverview: false,
      existingNames: noNames,
    })!;
    expect(plan.newName).toBe("welcome-next");
    expect(plan.newDeckLinks).toEqual(["[[overview]]"]);
  });

  it("inserts normally when the declared next note already exists", () => {
    const plan = planCreateNext({
      currentName: "welcome",
      currentLinks: ["[[overview]]", "[[slide-2]]"],
      isOverview: false,
      existingNames: new Set(["slide-2"]),
    })!;
    expect(plan.newName).toBe("welcome-next");
    expect(plan.newDeckLinks).toEqual(["[[overview]]", "[[slide-2]]"]);
  });

  // ── overview → insert a new first page ─────────────────────────────────

  it("inserts a new first page after the overview", () => {
    const plan = planCreateNext({
      currentName: "overview",
      currentLinks: ["[[welcome]]"],
      isOverview: true,
      overviewBackLink: "[[overview]]",
      existingNames: noNames,
    })!;
    expect(plan.newName).toBe("overview-next");
    expect(plan.newDeckLinks).toEqual(["[[overview]]", "[[welcome]]"]);
    expect(plan.rewrites).toEqual([{ name: "overview", deck: ["[[overview-next]]"] }]);
  });

  it("falls back to a [[name]] back link when the old first page provides none", () => {
    const plan = planCreateNext({
      currentName: "overview",
      currentLinks: ["[[welcome]]"],
      isOverview: true,
      existingNames: noNames,
    })!;
    expect(plan.newDeckLinks).toEqual(["[[overview]]", "[[welcome]]"]);
  });

  // ── naming collisions ──────────────────────────────────────────────────

  it("dedups the new name against existing note basenames", () => {
    const plan = planCreateNext({
      currentName: "welcome",
      currentLinks: ["[[overview]]"],
      isOverview: false,
      existingNames: new Set(["welcome-next", "welcome-next-2"]),
    })!;
    expect(plan.newName).toBe("welcome-next-3");
  });

  // ── invalid inputs ─────────────────────────────────────────────────────

  it("returns null when the note has no deck links", () => {
    expect(
      planCreateNext({
        currentName: "x",
        currentLinks: [],
        isOverview: false,
        existingNames: noNames,
      }),
    ).toBeNull();
  });

  it("returns null for an overview with no first-page link", () => {
    expect(
      planCreateNext({
        currentName: "o",
        currentLinks: [],
        isOverview: true,
        existingNames: noNames,
      }),
    ).toBeNull();
  });
});
