/**
 * native-slides — reading-view properties bar with PPT-style deck navigation
 *
 * Features:
 *   1. Hides Obsidian's native status bar and renders a "properties bar" at the
 *      bottom of the window.
 *   2. In reading view, shows the current note's properties (YAML frontmatter)
 *      as chips in that bar.
 *   3. Reading view auto-enters a fullscreen-like mode: the ribbon, sidebars,
 *      tab bar and the pane header bar are hidden; leaving reading view
 *      restores them automatically. Pressing Esc to leave the OS fullscreen
 *      also exits reading view.
 *   4. Hides the in-note properties panel in reading view (kept in edit view).
 *   5. PPT-style deck navigation driven by ONE reserved frontmatter key, `deck`,
 *      holding up to two markdown links:
 *        - overview note : deck: ["[[first-slide]]"]            (one link = the
 *                          first page of the deck; the note is the overview)
 *        - slide note    : deck: ["[[overview]]", "[[next-slide]]"]
 *                          (first link = the overview page, second link = the
 *                          next slide; omit the second link on the last slide)
 *      The page number is computed automatically by scanning the vault and
 *      walking the chain of links, so no `page-number` property is needed.
 *      ◀ ▶ buttons appear on the left of the bar, and "Previous Page" / "Next
 *      Page" commands are registered (default hotkeys Mod+Shift+← / Mod+Shift+→,
 *      rebindable under Settings → Hotkeys).
 *   6. A settings tab toggles the ◀ ▶ buttons and the page number.
 *   7. "Create Next Slide" command: creates a new slide right after the
 *      current one (name-collision aware), rewires the `deck` properties of
 *      both notes, and opens the new note in edit mode.
 *   8. "Toggle WYSIWYG Mode" (command + hotkey + bottom-bar button, deck
 *      notes only): WYSIWYG = the Live Preview styled to match the
 *      reading view (the reading view is the untouched reference).
 *      Overrides apply ONLY inside WYSIWYG's Live Preview (top margin,
 *      list indent, code-block metrics) plus layout work: tab bar and
 *      sidebars hide (Live Preview + reading), the bottom bar shows in
 *      Live Preview too and matches the tab bar's measured height (no
 *      content-area height change when switching modes), in-note
 *      properties hide while editing, standalone image lines are
 *      centered. Source mode and the default (non-WYSIWYG) Live
 *      Preview are completely untouched. All rules are scoped under
 *      body.native-slides-wysiwyg.
 *   9. "Debug: Dump Typography Styles" (ns-debug-styles): prints the
 *      key computed styles + CSS variables of the current view to the
 *      console — run once per view and compare (measurement tooling,
 *      no screenshots needed).
 *
 * The deck usually starts from an overview note that embeds an Obsidian Base
 * view (core "Bases" plugin) filtering notes that link to the overview page:
 *
 *   ```base
 *   filters:
 *     and:
 *       - file.hasLink("overview")
 *   views:
 *     - type: table
 *       name: Deck
 *   ```
 *
 * Why read properties via metadataCache instead of parsing YAML manually?
 *   Obsidian maintains a cache per note; metadataCache.getFileCache(file)
 *   .frontmatter returns the parsed properties, updated automatically on save.
 */

import { MarkdownView, Notice, Plugin, PluginSettingTab, Setting, TFile } from "obsidian";
import { planCreateNext, type CreateNextResult } from "./src/createNext";
import { computeDeck, extractLinks, extractRawLinks, formatValue, type DeckInfo } from "./src/deck";

/** Plugin settings */
interface NativeSlidesSettings {
  /** Show ◀ ▶ previous/next buttons on the left of the bar */
  showNavButtons: boolean;
  /** Show the auto-computed page number at the bottom-right of the bar */
  showPageNumber: boolean;
  /** Whether the user manually hid the bar (toggle command) */
  barHidden: boolean;
  /** Whether auto-fullscreen in reading view is enabled */
  autoFullscreen: boolean;
  /** WYSIWYG mode (unified edit/reading typography) — deck notes only */
  wysiwygMode: boolean;
}

const DEFAULT_SETTINGS: NativeSlidesSettings = {
  showNavButtons: true,
  showPageNumber: true,
  barHidden: false,
  autoFullscreen: true,
  wysiwygMode: false,
};

/** Reserved frontmatter key driving deck navigation (never rendered as a chip) */
const DECK_KEY = "deck";

/**
 * Fixed one-page sample notes used by the ns-debug-styles command
 * (edit side). Do not rename or remove them: each covers a group of
 * typography elements so everything is visible without scrolling.
 */
const SAMPLE_NOTE_NAMES = [
  "typography-sample-headings",
  "typography-sample-list",
  "typography-sample-code",
  "typography-sample-quote",
  "typography-sample-media",
];

/** Style sections sampled by sampleStyles() and compared by diffDumps() */
const STYLE_SECTIONS = [
  "container",
  "paragraph",
  "h1",
  "listItem",
  "codeBlock",
  "blockquote",
  "inlineCode",
  "table",
  "image",
  "horizontalRule",
];

export default class NativeSlidesPlugin extends Plugin {
  /** The properties bar DOM element */
  private bar: HTMLElement | null = null;
  /** Whether fullscreen reading mode is currently active */
  private fullscreen = false;
  /** Last refresh key ("path|mode") to avoid pointless re-renders */
  private lastKey = "";
  /** Last measured tab-bar height (px) — cached while the bar is hidden */
  private tabBarHeight = 0;
  /** Plugin settings */
  settings: NativeSlidesSettings = { ...DEFAULT_SETTINGS };

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new NativeSlidesSettingTab(this));

    // ── 1. Refresh on "current note / view changed" events ──────────────
    this.registerEvent(this.app.workspace.on("file-open", () => this.refresh()));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.refresh()));
    this.registerEvent(this.app.workspace.on("layout-change", () => this.refresh()));
    // Refresh when the note content (including frontmatter) changes / saves
    this.registerEvent(
      this.app.metadataCache.on("changed", (file: TFile) => {
        if (file === this.app.workspace.getActiveFile()) this.refresh();
      }),
    );

    // ── 2. Fallback timer: edit↔reading toggles may fire no standard event ──
    this.registerInterval(
      window.setInterval(() => {
        const file = this.app.workspace.getActiveFile();
        const key = file ? `${file.path}|${this.currentMode()}` : "";
        if (key !== this.lastKey) {
          this.lastKey = key;
          this.refresh();
        }
      }, 500),
    );

    // ── 3. Commands ─────────────────────────────────────────────────────
    // 3a. Manually show / hide the properties bar
    this.addCommand({
      id: "ns-toggle-bar",
      name: "Toggle Properties Bar",
      callback: async () => {
        this.settings.barHidden = !this.settings.barHidden;
        await this.saveSettings();
        this.refresh();
      },
    });
    // 3b. Pause / resume auto-fullscreen in reading view
    this.addCommand({
      id: "ns-toggle-fullscreen",
      name: "Pause/Resume Auto Fullscreen",
      callback: async () => {
        this.settings.autoFullscreen = !this.settings.autoFullscreen;
        await this.saveSettings();
        // When paused, restore the layout immediately; when resumed, re-sync
        if (!this.settings.autoFullscreen) this.syncFullscreen(false);
        else this.refresh();
      },
    });
    // 3c. Previous / next page (deck navigation, rebindable in Settings → Hotkeys)
    this.addCommand({
      id: "ns-prev",
      name: "Previous Page",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "ArrowLeft" }],
      callback: () => this.navigate("prev"),
    });
    this.addCommand({
      id: "ns-next",
      name: "Next Page",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "ArrowRight" }],
      callback: () => this.navigate("next"),
    });
    // 3d. Create Next Slide — new slide after the current one (deck notes only)
    this.addCommand({
      id: "ns-create-next",
      name: "Create Next Slide",
      // Greyed out in the palette unless the active note can take a next slide
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;
        const plan = this.planCreateNext(file);
        if (!plan) return false;
        if (!checking) void this.executeCreateNext(file, plan);
        return true;
      },
    });
    // 3e. Toggle WYSIWYG mode — unified edit/reading typography (deck notes only)
    this.addCommand({
      id: "ns-toggle-wysiwyg",
      name: "Toggle WYSIWYG Mode",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "E" }],
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;
        const fm = this.frontmatterOf(file);
        if (fm === null || !(DECK_KEY in fm)) return false;
        if (!checking) this.toggleWysiwyg();
        return true;
      },
    });
    // 3f. Debug: dump typography computed styles for edit/reading comparison
    this.addCommand({
      id: "ns-debug-styles",
      name: "Debug: Dump Typography Styles",
      callback: () => void this.debugStyles(),
    });

    // ── 4. Esc exits OS fullscreen → leave reading view as well ─────────
    // Keeps internal state in sync when the user presses Esc; also switches
    // the active Markdown view back to edit mode. Our own exitFullscreen()
    // calls set this.fullscreen = false first, so they never trigger this.
    this.registerDomEvent(document, "fullscreenchange", () => {
      if (!document.fullscreenElement && this.fullscreen) {
        this.fullscreen = false;
        document.body.classList.remove("native-slides-fullscreen");
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view && view.getMode() === "preview") {
          // Leave reading view via the public view-state API
          const state = view.leaf.getViewState();
          state.state = { ...state.state, mode: "source" };
          void view.leaf.setViewState(state, { focus: false });
        }
      }
    });

    // ── 5. Create the bar and do the first render ───────────────────────
    this.bar = document.createElement("div");
    this.bar.className = "native-slides-bar";
    this.bar.style.display = "none"; // hidden until refresh() decides otherwise
    document.body.appendChild(this.bar);
    this.refresh();
  }

  onunload(): void {
    this.bar?.remove();
    this.bar = null;
    // Leave OS fullscreen and drop the fullscreen class so no UI residue remains
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    document.body.classList.remove("native-slides-fullscreen");
    document.body.classList.remove("native-slides-wysiwyg");
  }

  // ── Settings ──────────────────────────────────────────────────────────

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  // ── Deck resolution (walk the link chain) ─────────────────────────────

  /** Resolve the current note's position inside its deck (path-based wrapper) */
  private computeDeck(file: TFile): DeckInfo | null {
    return computeDeck(file.path, (path) => this.deckLinkPaths(path));
  }

  /** Resolve the `deck` property of a note into real note paths (max two) */
  private deckLinkPaths(path: string): string[] {
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof TFile)) return [];
    const fm = this.frontmatterOf(f);
    const names = fm ? extractLinks(fm[DECK_KEY]) : [];
    return names
      .map((name) => this.app.metadataCache.getFirstLinkpathDest(name, path))
      .filter((x): x is TFile => !!x)
      .map((x) => x.path);
  }

  /** Names in the `deck` property that resolve to no note (broken links) */
  private brokenDeckLinks(file: TFile): string[] {
    const fm = this.frontmatterOf(file);
    const names = fm ? extractLinks(fm[DECK_KEY]) : [];
    return names.filter((name) => !this.app.metadataCache.getFirstLinkpathDest(name, file.path));
  }

  // ── Create Next Slide ────────────────────────────────────────────────

  /**
   * Plan a "Create Next Slide" run for the active note, or null when the
   * note cannot take a next slide (no usable `deck` property).
   *
   * Slides on the chain insert/append after the current note; the overview
   * page inserts a new first page; an off-chain note with a resolvable
   * overview link still gets its declared missing next note created.
   */
  private planCreateNext(file: TFile): CreateNextResult | null {
    const fm = this.frontmatterOf(file);
    const raw = fm ? extractRawLinks(fm[DECK_KEY]) : [];
    if (raw.length === 0) return null;

    const deck = this.computeDeck(file);
    const existingNames = new Set(this.app.vault.getMarkdownFiles().map((f) => f.basename));

    if (deck) {
      // Overview insertion needs the old first page's back link to the
      // overview (its own frontmatter only links forward).
      let overviewBackLink: string | undefined;
      if (deck.index === 0) {
        const oldFirst = deck.chain[1] ? this.app.vault.getAbstractFileByPath(deck.chain[1]) : null;
        if (oldFirst instanceof TFile) {
          const f2 = this.frontmatterOf(oldFirst);
          overviewBackLink = f2 ? extractRawLinks(f2[DECK_KEY])[0] : undefined;
        }
      }
      return planCreateNext({
        currentName: file.basename,
        currentLinks: raw,
        isOverview: deck.index === 0,
        overviewBackLink,
        existingNames,
      });
    }

    // Off-chain note: still create its declared missing next note when the
    // overview link resolves (the ⚠ broken-link warning disappears).
    const overviewName = raw.length >= 2 ? extractLinks(raw[0])[0] : null;
    if (overviewName && this.app.metadataCache.getFirstLinkpathDest(overviewName, file.path)) {
      return planCreateNext({
        currentName: file.basename,
        currentLinks: raw,
        isOverview: false,
        existingNames,
      });
    }
    return null;
  }

  /** Apply a plan: create the note, rewire `deck` properties, open it */
  private async executeCreateNext(file: TFile, plan: CreateNextResult): Promise<void> {
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

  /** Frontmatter of any note as an object, or null when absent */
  private frontmatterOf(file: TFile): Record<string, unknown> | null {
    const cache = this.app.metadataCache.getFileCache(file);
    return cache?.frontmatter ?? null;
  }

  // ── PPT navigation ────────────────────────────────────────────────────

  /** Move one step back/forward along the deck chain */
  private navigate(direction: "prev" | "next"): void {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    const deck = this.computeDeck(file);
    if (!deck) return;
    const target = deck.chain[direction === "prev" ? deck.index - 1 : deck.index + 1];
    if (!target) return;
    void this.app.workspace.openLinkText(target, file.path);
  }

  // ── Mode / data access ────────────────────────────────────────────────

  /** Mode of the active Markdown view: 'preview'=reading 'source'=editing ''=none */
  private currentMode(): "preview" | "source" | "" {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    return view ? (view.getMode() as "preview" | "source") : "";
  }

  /**
   * True when the active edit view is Live Preview (WYSIWYG) — as
   * opposed to Source mode. Obsidian reports both as mode "source";
   * the view state carries a `source` flag (Source mode = true), with
   * a DOM class fallback (.is-live-preview) for safety.
   */
  private isLivePreview(): boolean {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view || view.getMode() !== "source") return false;
    const state = view.getState() as { source?: boolean };
    if (state.source === true) return false;
    if (state.source === false) return true;
    return !!view.contentEl.querySelector(".markdown-source-view.mod-cm6.is-live-preview");
  }

  /** Current note's frontmatter as an object, or null when absent */
  private frontmatter(): Record<string, unknown> | null {
    const file = this.app.workspace.getActiveFile();
    return file ? this.frontmatterOf(file) : null;
  }

  // ── Bar rendering ─────────────────────────────────────────────────────

  /** Decide what the bar shows, then re-render it */
  refresh(): void {
    if (!this.bar) return;

    const file = this.app.workspace.getActiveFile();
    const mode = this.currentMode();

    // Card note = has a `deck` property (the WYSIWYG mode's scope marker)
    const cardFm = file ? this.frontmatterOf(file) : null;
    const isCard = cardFm !== null && DECK_KEY in cardFm;
    // Measure the tab bar while it is still visible (WYSIWYG hides it
    // below; the last measured value is reused once hidden).
    this.syncTabBarHeight();
    // WYSIWYG mode body class — immersive mode (deck notes only),
    // active in Live Preview and reading view only: hides the tab bar
    // and sidebars, matches the bottom bar's height to the tab bar,
    // hides in-note properties while editing, centers standalone
    // images. Source mode and everything else stay completely native.
    const isSourceMode = mode === "source" && !this.isLivePreview();
    const wysiwyg = isCard && this.settings.wysiwygMode && !isSourceMode;
    document.body.classList.toggle("native-slides-wysiwyg", wysiwyg);

    // Auto-fullscreen: enter on reading view, restore on leaving it
    this.syncFullscreen(mode === "preview" && this.settings.autoFullscreen);

    // Bar visibility: reading view always; edit view only in WYSIWYG mode
    // (so the mode has visible feedback while editing). Hidden when the
    // user hid it manually.
    const barVisible =
      !!file && (mode === "preview" || (mode === "source" && wysiwyg)) && !this.settings.barHidden;
    if (!barVisible) {
      this.bar.style.display = "none";
      return;
    }

    const fm = this.frontmatter();
    const deck = this.computeDeck(file);
    clearChildren(this.bar);

    // ── Left: previous / next buttons (both always shown inside a deck;
    //        the one that cannot move is disabled / light gray) ──
    if (this.settings.showNavButtons && deck) {
      const hasPrev = deck.index > 0;
      const hasNext = deck.index < deck.chain.length - 1;
      const nav = document.createElement("div");
      nav.className = "native-slides-nav";
      nav.appendChild(this.navButton("◀", "Previous page", () => this.navigate("prev"), !hasPrev));
      nav.appendChild(this.navButton("▶", "Next page", () => this.navigate("next"), !hasNext));
      this.bar.appendChild(nav);
    }

    // ── Middle: chips for the remaining properties (no placeholder) ──
    const visible = fm
      ? Object.entries(fm).filter(([key]) => key !== DECK_KEY && key !== "position")
      : [];

    for (const [key, value] of visible) {
      const span = document.createElement("span");
      span.className = "native-slides-item";
      const k = document.createElement("strong");
      k.textContent = key;
      span.appendChild(k);
      span.appendChild(document.createTextNode(": " + formatValue(value)));
      this.bar.appendChild(span);
    }

    // Broken deck links → warning chip so deck authors spot typos
    const broken = file ? this.brokenDeckLinks(file) : [];
    if (broken.length > 0) {
      const warn = document.createElement("span");
      warn.className = "native-slides-warn";
      warn.textContent = "⚠ " + broken.join(", ");
      warn.title = "Broken deck link(s) — the target note does not exist";
      this.bar.appendChild(warn);
    }

    // ── Bottom-right: WYSIWYG mode toggle (deck notes only) ──
    if (isCard) {
      const btn = document.createElement("button");
      btn.className = "native-slides-wysiwyg-btn" + (this.settings.wysiwygMode ? " is-active" : "");
      btn.textContent = this.settings.wysiwygMode ? "WYSIWYG: On" : "WYSIWYG: Off";
      btn.title = "Toggle WYSIWYG mode — unified typography between edit and reading";
      btn.addEventListener("click", () => this.toggleWysiwyg());
      this.bar.appendChild(btn);
    }

    // ── Bottom-right: auto-computed page number ──
    if (this.settings.showPageNumber && deck) {
      const page = document.createElement("span");
      page.className = "native-slides-page";
      // chain[0] is the overview note; slides start at index 1 → "Page 1"
      page.textContent = deck.index === 0 ? "Overview" : `Page ${deck.index}`;
      this.bar.appendChild(page);
    }

    // Hide the bar entirely when it has nothing to display (no properties,
    // and not part of a deck)
    this.bar.style.display = this.bar.childElementCount === 0 ? "none" : "";
  }

  /** Build a ◀ / ▶ navigation button; `disabled` renders it light gray/inactive */
  private navButton(
    label: string,
    tip: string,
    onClick: () => void,
    disabled = false,
  ): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.className = "native-slides-nav-btn";
    btn.textContent = label;
    btn.title = tip;
    btn.disabled = disabled;
    if (!disabled) btn.addEventListener("click", onClick);
    return btn;
  }

  /**
   * Measure the top tab bar and expose its height as the CSS variable
   * --native-slides-tabbar-height. The bar is hidden in WYSIWYG reading
   * view, so the last measured value is cached and reused there.
   */
  private syncTabBarHeight(): void {
    const tabBar = document.querySelector<HTMLElement>(
      ".workspace-tabs.mod-top .workspace-tab-header-container",
    );
    if (tabBar && tabBar.offsetHeight > 0) this.tabBarHeight = tabBar.offsetHeight;
    if (this.tabBarHeight > 0) {
      document.documentElement.style.setProperty(
        "--native-slides-tabbar-height",
        `${this.tabBarHeight}px`,
      );
    } else {
      // No measurement yet (tab bar hidden since load) — let the CSS
      // fallback value apply.
      document.documentElement.style.removeProperty("--native-slides-tabbar-height");
    }
  }

  /** Sync the fullscreen state: add the class + request OS fullscreen, or restore */
  private syncFullscreen(active: boolean): void {
    if (this.fullscreen === active) return; // nothing to do
    this.fullscreen = active;
    document.body.classList.toggle("native-slides-fullscreen", active);

    // Request OS-level fullscreen when entering (Obsidian runs on Electron and
    // supports the Fullscreen API); failures (e.g. in a plain browser) are
    // ignored silently — the "hide sidebars" effect still applies.
    if (active) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  /**
   * Toggle the WYSIWYG mode (persisted; only reachable on deck notes).
   * Toggling from reading view jumps into the WYSIWYG edit view, so the
   * unified typography is immediately visible where the user works.
   */
  private toggleWysiwyg(): void {
    this.settings.wysiwygMode = !this.settings.wysiwygMode;
    void this.saveSettings();
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view && view.getMode() === "preview") {
      // Leave reading view via the public view-state API (same as Esc)
      const state = view.leaf.getViewState();
      state.state = { ...state.state, mode: "source" };
      void view.leaf.setViewState(state, { focus: false });
    }
    this.refresh();
  }

  /** Sample the current view's typography computed styles + CSS variables */
  private sampleStyles(): Record<string, unknown> | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return null;
    const isEdit = view.getMode() === "source";
    const contentEl = view.contentEl;
    // First matching candidate wins — edit (cm6) and reading use
    // different element structures (e.g. no pre/blockquote in cm6).
    const pick = (sels: string[]): HTMLElement | null => {
      for (const sel of sels) {
        const el = contentEl.querySelector<HTMLElement>(sel);
        if (el) return el;
      }
      return null;
    };
    const style = (el: HTMLElement | null, props: string[]): Record<string, string> => {
      if (!el) return { "(missing)": "element not in this note" };
      const cs = getComputedStyle(el);
      const out: Record<string, string> = {};
      for (const p of props) {
        const v = cs.getPropertyValue(p).trim();
        if (v) out[p] = v;
      }
      return out;
    };
    const vars = getComputedStyle(document.body);
    const cssVar = (name: string): string => vars.getPropertyValue(name).trim();

    const container = pick([
      isEdit
        ? ".markdown-source-view.mod-cm6 .cm-content"
        : ".markdown-reading-view .markdown-preview-view",
    ]);
    const para = pick([
      isEdit
        ? ".markdown-source-view.mod-cm6 .cm-line:not(.HyperMD-header)"
        : ".markdown-reading-view .markdown-preview-view p",
    ]);
    const h1 = pick([
      isEdit ? ".markdown-source-view.mod-cm6 .cm-header-1" : ".markdown-reading-view h1",
      isEdit
        ? ".markdown-source-view.mod-cm6 h1"
        : ".markdown-reading-view .markdown-preview-view h1",
    ]);
    const listItem = pick([
      isEdit
        ? ".markdown-source-view.mod-cm6 .HyperMD-list-line"
        : ".markdown-preview-view ul > li",
      isEdit ? ".HyperMD-list-line" : ".markdown-reading-view .markdown-preview-view ul > li",
    ]);
    const pre = pick([
      isEdit
        ? ".markdown-source-view.mod-cm6 pre"
        : ".markdown-reading-view .markdown-preview-view pre",
      isEdit ? ".markdown-source-view.mod-cm6 .cm-editing pre" : ".markdown-preview-view pre",
      isEdit ? ".markdown-source-view.mod-cm6 .HyperMD-codeblock" : ".markdown-preview-view pre",
    ]);
    const quote = pick([
      isEdit ? ".markdown-source-view.mod-cm6 blockquote" : ".markdown-reading-view blockquote",
      isEdit
        ? ".markdown-source-view.mod-cm6 .HyperMD-quote"
        : ".markdown-reading-view .markdown-preview-view blockquote",
    ]);
    const inlineCode = pick([
      isEdit ? ".markdown-source-view.mod-cm6 code" : ".markdown-reading-view code",
      isEdit
        ? ".markdown-source-view.mod-cm6 .cm-inline-code"
        : ".markdown-reading-view .markdown-preview-view code",
    ]);
    const table = pick([
      isEdit ? ".markdown-source-view.mod-cm6 table" : ".markdown-reading-view table",
      isEdit ? ".cm-line table" : ".markdown-reading-view .markdown-preview-view table",
    ]);
    const img = pick([
      isEdit ? ".markdown-source-view.mod-cm6 img" : ".markdown-reading-view img",
      isEdit ? ".cm-line img" : ".markdown-reading-view .markdown-preview-view img",
    ]);
    const hr = pick([
      isEdit ? ".markdown-source-view.mod-cm6 hr" : ".markdown-reading-view hr",
      isEdit ? ".cm-line hr" : ".markdown-reading-view .markdown-preview-view hr",
      isEdit ? ".cm-hr" : ".markdown-preview-view hr",
    ]);

    // Structure probes (edit view only): the source-view class list
    // (confirms the Live Preview marker class) and unique element tags
    // inside the editor (reveals how cm6 renders code blocks etc. when
    // the usual selectors do not match).
    const sourceViewClass =
      contentEl.querySelector(".markdown-source-view.mod-cm6")?.className ?? "";
    const domTags: string[] = [];
    if (isEdit) {
      const tags = new Set<string>();
      contentEl
        .querySelectorAll(".markdown-source-view.mod-cm6 *")
        .forEach((el) => tags.add(el.tagName.toLowerCase()));
      domTags.push(...tags);
    }
    // List-line probe (edit view only): class names + computed padding
    // of the first list lines — nested levels often use distinct
    // classes or inline paddings, which decides whether a level-aware
    // indent override is even possible.
    const listLines: { className: string; paddingLeft: string }[] = [];
    if (isEdit) {
      contentEl.querySelectorAll(".HyperMD-list-line").forEach((el, i) => {
        if (i >= 4) return;
        const cs = getComputedStyle(el);
        listLines.push({
          className: el.className,
          paddingLeft: cs.getPropertyValue("padding-left").trim(),
        });
      });
    }

    const dump = {
      mode: isEdit ? "edit (Live Preview)" : "reading",
      // Alignment CSS (rules 7/7b) only applies when WYSIWYG is on
      wysiwygActive: document.body.classList.contains("native-slides-wysiwyg"),
      domTags: isEdit ? domTags : undefined,
      sourceViewClass: isEdit ? sourceViewClass : undefined,
      livePreview: isEdit ? this.isLivePreview() : undefined,
      listLines: isEdit ? listLines : undefined,
      container: style(container, [
        "font-family",
        "font-size",
        "line-height",
        "max-width",
        "width",
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left",
        "color",
        "text-align",
      ]),
      paragraph: style(para, [
        "font-size",
        "line-height",
        "margin-top",
        "margin-bottom",
        "margin-left",
        "margin-right",
        "text-indent",
        "text-align",
      ]),
      h1: style(h1, [
        "font-size",
        "line-height",
        "font-weight",
        "margin-top",
        "margin-bottom",
        "text-align",
      ]),
      listItem: style(listItem, [
        "padding-left",
        "margin-left",
        "margin-right",
        "text-indent",
        "line-height",
        "text-align",
      ]),
      codeBlock: style(pre, [
        "font-size",
        "line-height",
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left",
        "background-color",
        "border-radius",
      ]),
      blockquote: style(quote, [
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left",
        "margin-top",
        "margin-bottom",
        "border-left-width",
        "background-color",
      ]),
      inlineCode: style(inlineCode, [
        "font-size",
        "padding-top",
        "padding-bottom",
        "padding-left",
        "padding-right",
        "background-color",
        "border-radius",
      ]),
      table: style(table, ["font-size", "line-height", "width", "border-collapse"]),
      image: style(img, ["display", "margin-left", "margin-right", "max-width", "width"]),
      horizontalRule: style(hr, ["margin-top", "margin-bottom", "border-top-width", "height"]),
      cssVariables: {
        "--font-text": cssVar("--font-text"),
        "--line-height-normal": cssVar("--line-height-normal"),
        "--h1-size": cssVar("--h1-size"),
        "--h1-line-height": cssVar("--h1-line-height"),
        "--h1-margin-top": cssVar("--h1-margin-top"),
        "--h1-margin-bottom": cssVar("--h1-margin-bottom"),
        "--p-spacing": cssVar("--p-spacing"),
        "--list-spacing": cssVar("--list-spacing"),
        "--list-indent": cssVar("--list-indent"),
        "--code-size": cssVar("--code-size"),
        "--code-padding": cssVar("--code-padding"),
        "--code-radius": cssVar("--code-radius"),
        "--blockquote-padding": cssVar("--blockquote-padding"),
        "--blockquote-border-thickness": cssVar("--blockquote-border-thickness"),
        "--file-margins": cssVar("--file-margins"),
        "--file-line-width": cssVar("--file-line-width"),
        "--normal-font-size": cssVar("--normal-font-size"),
        "--font-text-size": cssVar("--font-text-size"),
      },
    };
    return dump;
  }

  /**
   * Debug typography: samples the fixed one-page sample notes (each
   * covering a group of elements — all visible without scrolling),
   * then the kitchen-sink note in reading view (no virtualization
   * there), merges everything, computes the edit-vs-reading diff and
   * writes it to .native-slides-debug.json in the vault root.
   * The user's own note is restored at the end.
   */
  private async debugStyles(): Promise<void> {
    if (!this.settings.wysiwygMode) {
      new Notice("Native Slides: turn WYSIWYG mode on first (Mod+Shift+E on a deck note)");
      return;
    }
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      new Notice("Native Slides: no active Markdown note");
      return;
    }
    const startMode = view.getMode();
    const activeFile = this.app.workspace.getActiveFile();
    const leaf = this.app.workspace.getLeaf(false);

    // Edit side: each short note keeps every target element on screen
    const edit: Record<string, unknown> = {};
    for (const name of SAMPLE_NOTE_NAMES) {
      const f = this.app.vault.getAbstractFileByPath(`${name}.md`);
      if (!(f instanceof TFile)) continue;
      await leaf.openFile(f, { state: { mode: "source" } });
      await sleep(500);
      const s = this.sampleStyles();
      if (s) mergeSample(edit, s);
    }

    // Reading side: the kitchen-sink note renders everything at once
    let reading: Record<string, unknown> | null = null;
    const demo = this.app.vault.getAbstractFileByPath("typography-demo.md");
    if (demo instanceof TFile) {
      await leaf.openFile(demo, { state: { mode: "preview" } });
      await sleep(800);
      reading = this.sampleStyles();
    }

    // Restore the user's note
    if (activeFile) {
      await leaf.openFile(activeFile, { state: { mode: startMode } });
      this.refresh();
    }
    if (!reading) {
      new Notice("Native Slides: reading sample failed");
      return;
    }

    const payload = { edit, reading, diff: diffDumps(edit, reading) };
    try {
      await this.app.vault.adapter.write(
        ".native-slides-debug.json",
        JSON.stringify(payload, null, 2),
      );
      new Notice("Typography dump → .native-slides-debug.json (vault root)");
    } catch (error) {
      new Notice(`Native Slides: could not write debug file (${String(error)})`);
    }
    console.log("[native-slides debug-styles]", JSON.stringify(payload, null, 2));
  }
}

// ── Settings tab ────────────────────────────────────────────────────────

class NativeSlidesSettingTab extends PluginSettingTab {
  constructor(private plugin: NativeSlidesPlugin) {
    super(plugin.app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Properties Bar · Settings" });

    new Setting(containerEl)
      .setName("Show Previous/Next buttons")
      .setDesc(
        "Show ◀ ▶ buttons on the left of the bar when the note belongs to a deck (has a `deck` property)",
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showNavButtons).onChange(async (value) => {
          this.plugin.settings.showNavButtons = value;
          await this.plugin.saveSettings();
          this.plugin.refresh();
        }),
      );

    new Setting(containerEl)
      .setName("Show page number")
      .setDesc(
        "Auto-computed from the deck chain (overview page shows “Overview”); shown at the bottom-right",
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showPageNumber).onChange(async (value) => {
          this.plugin.settings.showPageNumber = value;
          await this.plugin.saveSettings();
          this.plugin.refresh();
        }),
      );

    new Setting(containerEl)
      .setName("Auto fullscreen in reading view")
      .setDesc(
        "Enter the immersive fullscreen reading mode automatically when switching to reading view (also toggleable via the Pause/Resume Auto Fullscreen command)",
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoFullscreen).onChange(async (value) => {
          this.plugin.settings.autoFullscreen = value;
          await this.plugin.saveSettings();
          this.plugin.refresh();
        }),
      );

    new Setting(containerEl)
      .setName("WYSIWYG mode (deck notes)")
      .setDesc(
        "Immersive deck mode: hides the tab bar and sidebars, shows the bottom bar at tab-bar height in both views, and hides in-note properties while editing. Toggle from the command palette, the Mod+Shift+E hotkey, or the bottom-bar button.",
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.wysiwygMode).onChange(async (value) => {
          this.plugin.settings.wysiwygMode = value;
          await this.plugin.saveSettings();
          this.plugin.refresh();
        }),
      );

    new Setting(containerEl)
      .setName("Navigation hotkeys")
      .setDesc(
        "Default: Previous Page Mod+Shift+←, Next Page Mod+Shift+→. Rebind under Settings → Hotkeys.",
      )
      .addButton((button) =>
        button.setButtonText("Open Hotkeys Settings").onClick(() => {
          // Open Obsidian's hotkeys settings page (internal API; ignore failures)
          (
            this.app as unknown as { setting?: { openTabById?: (id: string) => void } }
          ).setting?.openTabById?.("hotkeys");
        }),
      );
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

/** Promise-based sleep */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Merge non-missing style sections of a fresh sample into the target
 * (first non-missing value wins).
 */
function mergeSample(target: Record<string, unknown>, sample: Record<string, unknown>): void {
  for (const key of STYLE_SECTIONS) {
    const section = sample[key] as Record<string, string> | undefined;
    if (!section || "(missing)" in section) continue;
    const existing = target[key] as Record<string, string> | undefined;
    if (existing && !("(missing)" in existing)) continue;
    target[key] = section;
  }
}

/** Remove all children of an element */
function clearChildren(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/**
 * Compare the style sections of an edit dump and a reading dump; only
 * keys whose values differ are kept, as { key: { edit, reading } }.
 */
function diffDumps(
  edit: Record<string, unknown>,
  reading: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const section of STYLE_SECTIONS) {
    const e = (edit[section] ?? {}) as Record<string, string>;
    const r = (reading[section] ?? {}) as Record<string, string>;
    const keys = new Set([...Object.keys(e), ...Object.keys(r)]);
    const diffs: Record<string, { edit: string; reading: string }> = {};
    for (const key of keys) {
      if (e[key] !== r[key]) {
        diffs[key] = { edit: e[key] ?? "(missing)", reading: r[key] ?? "(missing)" };
      }
    }
    if (Object.keys(diffs).length > 0) out[section] = diffs;
  }
  return out;
}
