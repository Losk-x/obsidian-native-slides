import { App, Notice, TFile } from "obsidian";
import { planCreateNext as plan, type CreateNextResult } from "./createNext";
import { computeDeck, extractLinks, extractRawLinks, type DeckInfo } from "./deck";
import { frontmatterOf } from "./mode";
import { DECK_KEY } from "./types";

/** Deck chain resolution + "Create Next Slide" glue (wraps the pure core). */
export class DeckService {
  constructor(private app: App) {}

  /** Resolve the current note's position inside its deck (path-based wrapper) */
  compute(file: TFile): DeckInfo | null {
    return computeDeck(file.path, (path) => this.linkPaths(path));
  }

  /** Resolve the `deck` property of a note into real note paths (max two) */
  private linkPaths(path: string): string[] {
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof TFile)) return [];
    const fm = frontmatterOf(this.app, f);
    const names = fm ? extractLinks(fm[DECK_KEY]) : [];
    return names
      .map((name) => this.app.metadataCache.getFirstLinkpathDest(name, path))
      .filter((x): x is TFile => !!x)
      .map((x) => x.path);
  }

  /** Names in the `deck` property that resolve to no note (broken links) */
  broken(file: TFile): string[] {
    const fm = frontmatterOf(this.app, file);
    const names = fm ? extractLinks(fm[DECK_KEY]) : [];
    return names.filter((name) => !this.app.metadataCache.getFirstLinkpathDest(name, file.path));
  }

  /**
   * Plan a "Create Next Slide" run for the active note, or null when the
   * note cannot take a next slide (no usable `deck` property).
   *
   * Slides on the chain insert/append after the current note; the overview
   * page inserts a new first page; an off-chain note with a resolvable
   * overview link still gets its declared missing next note created.
   */
  planCreateNext(file: TFile): CreateNextResult | null {
    const fm = frontmatterOf(this.app, file);
    const raw = fm ? extractRawLinks(fm[DECK_KEY]) : [];
    if (raw.length === 0) return null;

    const deck = this.compute(file);
    const existingNames = new Set(this.app.vault.getMarkdownFiles().map((f) => f.basename));

    if (deck) {
      // Overview insertion needs the old first page's back link to the
      // overview (its own frontmatter only links forward).
      let overviewBackLink: string | undefined;
      if (deck.index === 0) {
        const oldFirst = deck.chain[1] ? this.app.vault.getAbstractFileByPath(deck.chain[1]) : null;
        if (oldFirst instanceof TFile) {
          const f2 = frontmatterOf(this.app, oldFirst);
          overviewBackLink = f2 ? extractRawLinks(f2[DECK_KEY])[0] : undefined;
        }
      }
      return plan({
        currentName: file.basename,
        currentLinks: raw,
        isOverview: deck.index === 0,
        overviewBackLink,
        existingNames,
      });
    }

    // Off-chain note: check if this could be an overview with a broken link
    // to the first slide (e.g., from "New Slides Deck" command).
    if (raw.length === 1) {
      const firstSlideName = extractLinks(raw[0])[0];
      if (firstSlideName && !this.app.metadataCache.getFirstLinkpathDest(firstSlideName, file.path)) {
        // This is an overview with a broken link to the first slide — create it
        return plan({
          currentName: file.basename,
          currentLinks: raw,
          isOverview: true,
          overviewBackLink: `[[${file.basename}]]`,
          existingNames,
        });
      }
    }

    // Off-chain slide: still create its declared missing next note when the
    // overview link resolves (the  broken-link warning disappears).
    const overviewName = raw.length >= 2 ? extractLinks(raw[0])[0] : null;
    if (overviewName && this.app.metadataCache.getFirstLinkpathDest(overviewName, file.path)) {
      return plan({
        currentName: file.basename,
        currentLinks: raw,
        isOverview: false,
        existingNames,
      });
    }
    return null;
  }

  /** Apply a plan: create the note, rewire `deck` properties, open it */
  async executeCreateNext(file: TFile, plan: CreateNextResult): Promise<void> {
    const dir = file.parent?.path ? file.parent.path + "/" : "";
    const newPath = `${dir}${plan.newName}.md`;
    const frontmatter = plan.newDeckLinks.map((link) => JSON.stringify(link)).join(", ");
    const content = `---\ndeck: [${frontmatter}]\n---\n`;

    let newFile: TFile;
    try {
      newFile = await this.app.vault.create(newPath, content);
    } catch (error) {
      new Notice(`Native Slides: could not create "${plan.newName}.md" (${String(error)})`);
      return;
    }

    // Rewire the current note's `deck` (keeps all other properties intact)
    for (const rewrite of plan.rewrites) {
      if (rewrite.name !== file.basename) continue; // in practice always the current note
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        fm[DECK_KEY] = rewrite.deck;
      });
    }

    // Open the new note in the current pane, edit mode (Live Preview)
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(newFile, { state: { mode: "source" } });
  }
}
