/**
 * native-slides — reading-view properties bar with PPT-style deck navigation
 *
 * One reserved frontmatter key, `deck` (up to two markdown links), drives
 * prev/next navigation and auto-computed page numbers. Reading view shows the
 * note's properties in a bottom bar and auto-enters a fullscreen-like mode.
 * WYSIWYG mode (deck notes only) styles the Live Preview to match the reading
 * view — the reading view is the untouched reference.
 *
 * This file is the plugin entry point and a thin orchestration layer; the
 * logic lives in `src/`:
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
import { clearChildren } from "./src/utils";

export default class NativeSlidesPlugin extends Plugin {
  /** The properties bar DOM element */
  bar: HTMLElement | null = null;
  /** Deck chain resolution + "create next slide" glue */
  deckService!: DeckService;
  /** Plugin settings */
  settings: NativeSlidesSettings = { ...DEFAULT_SETTINGS };
  /** Whether fullscreen reading mode is currently active */
  private fullscreen = false;
  /** Last refresh key ("path|mode") to avoid pointless re-renders */
  private lastKey = "";
  /** Last measured tab-bar height (px) — cached while the bar is hidden */
  private tabBarHeight = 0;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.deckService = new DeckService(this.app);
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
        const key = file ? `${file.path}|${currentMode(this.app)}` : "";
        if (key !== this.lastKey) {
          this.lastKey = key;
          this.refresh();
        }
      }, 500),
    );

    // ── 3. Commands ─────────────────────────────────────────────────────
    registerCommands(this);

    // ── 4. Esc exits OS fullscreen → leave reading view as well ─────────
    // Keeps internal state in sync when the user presses Esc; also switches
    // the active Markdown view back to edit mode. Our own syncFullscreen()
    // sets this.fullscreen = false first, so it never triggers this.
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
    this.bar = createBar();
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

  // ── PPT navigation ────────────────────────────────────────────────────

  /** Move one step back/forward along the deck chain */
  navigate(direction: "prev" | "next"): void {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    const deck = this.deckService.compute(file);
    if (!deck) return;
    const target = deck.chain[direction === "prev" ? deck.index - 1 : deck.index + 1];
    if (!target) return;
    void this.app.workspace.openLinkText(target, file.path);
  }

  // ── Bar rendering ─────────────────────────────────────────────────────

  /** Decide what the bar shows, then re-render it */
  refresh(): void {
    if (!this.bar) return;

    const file = this.app.workspace.getActiveFile();
    const mode = currentMode(this.app);

    // Card note = has a `deck` property (the WYSIWYG mode's scope marker)
    const cardFm = file ? frontmatterOf(this.app, file) : null;
    const isCard = cardFm !== null && DECK_KEY in cardFm;
    // Measure the tab bar while it is still visible (WYSIWYG hides it
    // below; the last measured value is reused once hidden).
    this.tabBarHeight = syncTabBarHeight(this.tabBarHeight);
    // WYSIWYG mode body class — immersive mode (deck notes only),
    // active in Live Preview and reading view only: hides the tab bar
    // and sidebars, matches the bottom bar's height to the tab bar,
    // hides in-note properties while editing, centers standalone
    // images. Source mode and everything else stay completely native.
    const isSourceMode = mode === "source" && !isLivePreview(this.app);
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

  /** Sync the fullscreen state: add the class + request OS fullscreen, or restore */
  syncFullscreen(active: boolean): void {
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
  toggleWysiwyg(): void {
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
}
