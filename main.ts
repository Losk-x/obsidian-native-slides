/**
 * native-slides — a "Slides mode" for Obsidian deck notes
 *
 * One reserved frontmatter key, `deck` (up to two markdown links), drives
 * prev/next navigation and auto-computed page numbers. A deck note can be
 * entered into **Slides mode** — an immersive, editable (Live Preview) view
 * with a bottom bar showing properties, navigation and the page number.
 *
 * Native Obsidian modes (Source / default Live Preview / Reading view) are
 * left completely untouched: no status-bar hiding, no bottom bar, no
 * fullscreen, no styling. Slides mode is the plugin's only surface.
 *
 * This file is the entry point and a thin orchestration layer; the logic
 * lives in `src/`:
 *   - src/types.ts        settings shape + defaults + reserved `deck` key
 *   - src/mode.ts         view mode / frontmatter helpers (pure, `App`-based)
 *   - src/deck-service.ts deck chain resolution + "create next slide" glue
 *   - src/bar.ts          bar DOM helpers (create / buttons / tab-bar measure)
 *   - src/commands.ts     command registration (dev-gated debug command)
 *   - src/settings.ts     settings tab
 *   - src/debug.ts        typography measurement tooling (dev builds only)
 *   - src/deck.ts         pure deck core (with src/createNext.ts)
 */

import { MarkdownView, Plugin, TFile } from "obsidian";
import { createBar, navButton, syncTabBarHeight } from "./src/bar";
import { registerCommands } from "./src/commands";
import { DeckService } from "./src/deck-service";
import { formatValue } from "./src/deck";
import { activeFrontmatter, currentMode, frontmatterOf, isLivePreview } from "./src/mode";
import { NativeSlidesSettingTab } from "./src/settings";
import { DECK_KEY, DEFAULT_SETTINGS, type NativeSlidesSettings } from "./src/types";
import { clearChildren, lockScroller, unlockScroller } from "./src/utils";

export default class NativeSlidesPlugin extends Plugin {
  /** The properties bar DOM element */
  bar: HTMLElement | null = null;
  /** Deck chain resolution + "create next slide" glue */
  deckService!: DeckService;
  /** Plugin settings */
  settings: NativeSlidesSettings = { ...DEFAULT_SETTINGS };

  /** Whether Slides mode is currently active (session state, not persisted) */
  private slidesMode = false;
  /** View mode to restore when leaving Slides mode ("preview" | "source") */
  private exitMode: "preview" | "source" = "source";
  /** Whether the exit view was Source mode (true) vs Live Preview (false) */
  private exitSource = false;
  /** Last note auto-entered into Slides mode (prevents re-entering after manual exit) */
  private autoEnteredPath = "";
  /** Last refresh key ("path|mode") to avoid pointless re-renders */
  private lastKey = "";
  /** Last measured tab-bar height (px) — cached while the bar is hidden */
  private tabBarHeight = 0;
  /** Editor scroller currently pinned to one screen (null when unpinned) */
  private pinnedScroller: HTMLElement | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.deckService = new DeckService(this.app);
    this.addSettingTab(new NativeSlidesSettingTab(this));

    // ── 1. Refresh on "current note / view changed" events ──────────────
    this.registerEvent(
      this.app.workspace.on("file-open", () => {
        this.maybeAutoEnterSlides();
        this.refresh();
      }),
    );
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
        const key = file ? `${file.path}|${currentMode(this.app)}` : "";
        if (key !== this.lastKey) {
          this.lastKey = key;
          this.refresh();
        }
      }, 500),
    );

    // ── 3. Commands ─────────────────────────────────────────────────────
    registerCommands(this);

    // ── 4. Create the bar and do the first render ───────────────────────
    this.bar = createBar();
    document.body.appendChild(this.bar);
    this.refresh();
  }

  onunload(): void {
    this.bar?.remove();
    this.bar = null;
    if (this.pinnedScroller) {
      unlockScroller(this.pinnedScroller);
      this.pinnedScroller = null;
    }
    document.body.classList.remove("native-slides-mode");
  }

  // ── Settings ──────────────────────────────────────────────────────────

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  // ── Slides mode ───────────────────────────────────────────────────────

  /** Whether the active note is a deck note (has a `deck` property) */
  private isDeckNote(file: TFile | null): boolean {
    if (!file) return false;
    const fm = frontmatterOf(this.app, file);
    return fm !== null && DECK_KEY in fm;
  }

  /** Enter Slides mode: record the exit state and force the Live Preview */
  private async enterSlides(): Promise<void> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      const state = view.getState() as { mode?: string; source?: boolean };
      this.exitMode = state.mode === "preview" ? "preview" : "source";
      this.exitSource = state.source === true;
      // Slides mode is always the editable Live Preview
      const next = view.leaf.getViewState();
      next.state = { ...next.state, mode: "source", source: false };
      await view.leaf.setViewState(next, { focus: false });
    }
    this.slidesMode = true;
    this.refresh();
  }

  /** Exit Slides mode: restore the view mode recorded at entry */
  private exitSlides(): void {
    this.slidesMode = false;
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      const state = view.leaf.getViewState();
      if (this.exitMode === "preview") {
        state.state = { ...state.state, mode: "preview" };
      } else {
        state.state = { ...state.state, mode: "source", source: this.exitSource };
      }
      void view.leaf.setViewState(state, { focus: false });
    }
    this.refresh();
  }

  /** Toggle Slides mode (deck notes only — enforced by the command) */
  toggleSlides(): void {
    if (this.slidesMode) this.exitSlides();
    else void this.enterSlides();
  }

  /** Auto-enter Slides mode once per opened deck note when the setting is on */
  private maybeAutoEnterSlides(): void {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.path === this.autoEnteredPath) return;
    this.autoEnteredPath = file.path;
    if (this.settings.autoEnterSlides && this.isDeckNote(file) && !this.slidesMode) {
      void this.enterSlides();
    }
  }

  /**
   * Pin (or unpin) the active editor's scroller so Slides mode is exactly one
   * screen: no manual scroll and no CodeMirror programmatic scrollIntoView
   * (edit / drag-select). Unpinned when leaving Slides mode so native modes
   * scroll normally.
   */
  private syncScrollerPin(slides: boolean): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const scroller = slides
      ? (view?.contentEl.querySelector<HTMLElement>(".cm-scroller") ?? null)
      : null;
    if (scroller === this.pinnedScroller) return;

    if (this.pinnedScroller) unlockScroller(this.pinnedScroller);
    if (scroller) lockScroller(scroller);
    this.pinnedScroller = scroller;
  }

  // ── PPT navigation ────────────────────────────────────────────────────

  /** Move one step back/forward along the deck chain (entering Slides mode as needed) */
  async navigate(direction: "prev" | "next"): Promise<void> {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    const deck = this.deckService.compute(file);
    if (!deck) return;
    const target = deck.chain[direction === "prev" ? deck.index - 1 : deck.index + 1];
    if (!target) return;
    if (!this.slidesMode) await this.enterSlides();
    void this.app.workspace.openLinkText(target, file.path);
  }

  // ── Bar rendering ─────────────────────────────────────────────────────

  /** Decide what the bar shows, then re-render it */
  refresh(): void {
    if (!this.bar) return;

    const file = this.app.workspace.getActiveFile();
    const mode = currentMode(this.app);
    const isCard = this.isDeckNote(file);
    const livePreviewNow = mode === "source" && isLivePreview(this.app);

    // Leaving a deck note, or leaving the Live Preview (e.g. Cmd/Ctrl+E to
    // reading view), ends Slides mode — only the toggle command re-enters it.
    if (this.slidesMode && (!isCard || !livePreviewNow)) {
      this.slidesMode = false;
    }

    // Measure the tab bar while it is still visible (Slides mode hides it
    // below; the last measured value is reused once hidden).
    this.tabBarHeight = syncTabBarHeight(this.tabBarHeight);

    // Slides mode is active only while actually in the editable Live Preview
    const slides = this.slidesMode && isCard && livePreviewNow;
    document.body.classList.toggle("native-slides-mode", slides);
    this.syncScrollerPin(slides);

    const barVisible = slides && !this.settings.barHidden;
    if (!barVisible) {
      this.bar.style.display = "none";
      return;
    }
    if (!file) return; // barVisible implies a file, but narrow for TypeScript

    const fm = activeFrontmatter(this.app);
    const deck = this.deckService.compute(file);
    clearChildren(this.bar);

    // ── Left: previous / next buttons (both always shown inside a deck;
    //        the one that cannot move is disabled / light gray) ──
    if (this.settings.showNavButtons && deck) {
      const hasPrev = deck.index > 0;
      const hasNext = deck.index < deck.chain.length - 1;
      const nav = document.createElement("div");
      nav.className = "native-slides-nav";
      nav.appendChild(navButton("◀", "Previous page", () => this.navigate("prev"), !hasPrev));
      nav.appendChild(navButton("▶", "Next page", () => this.navigate("next"), !hasNext));
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
    const broken = file ? this.deckService.broken(file) : [];
    if (broken.length > 0) {
      const warn = document.createElement("span");
      warn.className = "native-slides-warn";
      warn.textContent = "⚠ " + broken.join(", ");
      warn.title = "Broken deck link(s) — the target note does not exist";
      this.bar.appendChild(warn);
    }

    // ── Bottom-right: exit Slides mode (deck notes only) ──
    const btn = document.createElement("button");
    btn.className = "native-slides-mode-btn is-active";
    btn.textContent = "Slides: On";
    btn.title = "Exit Slides mode (back to your previous view)";
    btn.addEventListener("click", () => this.toggleSlides());
    this.bar.appendChild(btn);

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
}
