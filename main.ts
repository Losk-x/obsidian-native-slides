/**
 * native-slides — a "Slides mode" for Obsidian deck notes
 *
 * One reserved frontmatter key, `deck` (up to two markdown links), drives
 * prev/next navigation and auto-computed page numbers. A deck note can be
 * entered into **Slides mode** — an immersive, editable (Live Preview) view
 * with a slides bar showing properties, navigation and the page number.
 *
 * Native Obsidian modes (Source / default Live Preview / Reading view) are
 * left completely untouched: no status-bar hiding, no slides bar, no
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
import { DECK_KEY, DEFAULT_SETTINGS, SLIDES_THEMES, type NativeSlidesSettings } from "./src/types";
import { clearChildren } from "./src/utils";

export default class NativeSlidesPlugin extends Plugin {
  /** The slides bar DOM element */
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
  /** Last measured tab-bar height (px) — cached while the slides bar is hidden */
  private tabBarHeight = 0;
  /** Whether the mouse pointer is hidden for presenting (session state) */
  pointerHidden = false;

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

    // ── 4. Pin the Slides editor to one screen ───────────────────────────
    // CSS `overflow: hidden` blocks the wheel, but native drag-select
    // autoscroll and CodeMirror's programmatic scrollIntoView still move the
    // scroller. This capture-phase listener resets any scroll inside the
    // active markdown view back to the top while Slides mode is active.
    this.registerDomEvent(
      document,
      "scroll",
      (evt) => {
        if (!document.body.classList.contains("native-slides-mode")) return;
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return;
        const el = evt.target;
        if (el instanceof HTMLElement && view.contentEl.contains(el)) {
          if (el.scrollTop !== 0) el.scrollTop = 0;
          if (el.scrollLeft !== 0) el.scrollLeft = 0;
        }
      },
      { capture: true },
    );

    // ── 5. Escape key exits Slides mode ─────────────────────────────────
    this.registerDomEvent(document, "keydown", (evt: KeyboardEvent) => {
      if (evt.key === "Escape" && this.slidesMode && this.settings.escExitsSlides) {
        this.exitSlides();
      }
    });

    // ── 6. Create the slides bar and do the first render ────────────────
    this.bar = createBar();
    document.body.appendChild(this.bar);
    this.refresh();
  }

  onunload(): void {
    this.bar?.remove();
    this.bar = null;
    document.body.classList.remove("native-slides-mode");
    document.body.classList.remove("native-slides-pointer-hidden");
    this.removeThemeClasses();
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

  /** Remove every `native-slides-theme-*` class from <body> */
  private removeThemeClasses(): void {
    for (const cls of Array.from(document.body.classList)) {
      if (cls.startsWith("native-slides-theme-")) document.body.classList.remove(cls);
    }
  }

  /**
   * Keep the single `native-slides-theme-<id>` body class in sync with the
   * `slidesTheme` setting — the style templates in styles.css hook off it.
   * Unknown ids (e.g. after a downgrade) fall back to the default theme.
   */
  private applyThemeClass(): void {
    const id = SLIDES_THEMES.some((t) => t.id === this.settings.slidesTheme)
      ? this.settings.slidesTheme
      : DEFAULT_SETTINGS.slidesTheme;
    const cls = `native-slides-theme-${id}`;
    for (const c of Array.from(document.body.classList)) {
      if (c.startsWith("native-slides-theme-") && c !== cls) document.body.classList.remove(c);
    }
    document.body.classList.add(cls);
  }

  /**
   * Toggle hiding the mouse pointer window-wide for presenting. Hiding also
   * parks focus (blurs the editor, so the caret disappears); showing leaves
   * focus parked — click slide content to resume editing.
   */
  togglePointer(): void {
    this.pointerHidden = !this.pointerHidden;
    if (this.pointerHidden) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active !== document.body) active.blur();
    }
    this.refresh();
  }

  /**
   * Keep the `native-slides-pointer-hidden` body class in sync with the
   * presenting state — styles.css turns every cursor invisible while set.
   * Leaving Slides mode always restores the pointer.
   */
  private syncPointerClass(slides: boolean): void {
    document.body.classList.toggle("native-slides-pointer-hidden", slides && this.pointerHidden);
  }

  /**
   * Render the card title (an H1 inside the card) per the `slidesTitle`
   * setting, via the `.cm-content` data-slides-title attribute — the CSS
   * ::before pseudo-element renders it. "" (default) shows nothing;
   * "filename" uses the file name; any other value names a frontmatter
   * property. The file name (inline title) outside the card is always hidden
   * by CSS in Slides mode.
   */
  private updateInlineTitle(slides: boolean): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const file = this.app.workspace.getActiveFile();
    const content = view?.contentEl.querySelector<HTMLElement>(".cm-content");
    if (!content || !file) return;

    let text: string | null = null;
    if (slides) {
      const src = this.settings.slidesTitle.trim();
      if (src === "filename") {
        text = file.basename;
      } else if (src) {
        const fm = frontmatterOf(this.app, file);
        const v = fm?.[src];
        if (v != null) {
          text = typeof v === "string" ? v : Array.isArray(v) ? v.join(", ") : String(v);
        }
      }
    }

    if (text) content.setAttribute("data-slides-title", text);
    else content.removeAttribute("data-slides-title");
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

  /** Jump to a specific index in the deck chain (progress bar click) */
  async jumpTo(index: number): Promise<void> {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    const deck = this.deckService.compute(file);
    if (!deck || index < 0 || index >= deck.chain.length || index === deck.index) return;
    const target = deck.chain[index];
    if (!target) return;
    if (!this.slidesMode) await this.enterSlides();
    void this.app.workspace.openLinkText(target, file.path);
  }

  // ── Bar rendering ─────────────────────────────────────────────────────

  /** Decide what the slides bar shows, then re-render it */
  refresh(): void {
    if (!this.bar) return;
    this.applyThemeClass();

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
    if (!slides) this.pointerHidden = false; // leaving Slides restores the pointer
    this.syncPointerClass(slides);
    this.updateInlineTitle(slides);

    const barVisible = slides && this.settings.showSlidesBar && !this.settings.barHidden;
    // When bar is hidden, set bottom padding to 0 so the card fills the full
    // window height. When visible, remove the override so CSS falls back to
    // --native-slides-tabbar-height (clears the bar as before).
    if (barVisible) {
      document.documentElement.style.removeProperty("--native-slides-bar-height");
    } else {
      document.documentElement.style.setProperty("--native-slides-bar-height", "0px");
    }
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

    // ── Bottom-right: auto-computed page number ──
    if (this.settings.pageNumberStyle !== "none" && deck) {
      const page = document.createElement("span");
      page.className = "native-slides-page";
      // chain[0] is the overview (page 0); content slides start at index 1.
      // Total = content pages only (excludes overview).
      const total = deck.chain.length - 1;
      page.textContent =
        this.settings.pageNumberStyle === "fraction" ? `${deck.index} / ${total}` : `${deck.index}`;
      this.bar.appendChild(page);
    }

    // ── Progress indicator: discrete clickable segments at bar top ──
    if (this.settings.showProgress && deck && deck.chain.length > 1) {
      const progress = document.createElement("div");
      progress.className = "native-slides-progress";
      for (let i = 0; i < deck.chain.length; i++) {
        const seg = document.createElement("div");
        const state = i < deck.index ? "past" : i === deck.index ? "current" : "future";
        seg.className = `native-slides-progress-seg native-slides-progress-seg--${state}`;
        seg.addEventListener("click", () => void this.jumpTo(i));
        progress.appendChild(seg);
      }
      this.bar.appendChild(progress);
    }

    // Hide the slides bar entirely when it has nothing to display (no properties,
    // and not part of a deck)
    this.bar.style.display = this.bar.childElementCount === 0 ? "none" : "";
  }
}
