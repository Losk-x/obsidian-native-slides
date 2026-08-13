/**
 * read-props-bar — Reading-view properties bar with PPT-style deck navigation
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

import { Plugin, MarkdownView, TFile, PluginSettingTab, Setting } from "obsidian";

/** Plugin settings */
interface ReadPropsBarSettings {
  /** Show ◀ ▶ previous/next buttons on the left of the bar */
  showNavButtons: boolean;
  /** Show the auto-computed page number at the bottom-right of the bar */
  showPageNumber: boolean;
}

const DEFAULT_SETTINGS: ReadPropsBarSettings = {
  showNavButtons: true,
  showPageNumber: true,
};

/** Reserved frontmatter key driving deck navigation (never rendered as a chip) */
const DECK_KEY = "deck";
/** A deck link list never holds more than two entries */
const MAX_DECK_LINKS = 2;

/** Result of resolving a note's position inside a deck */
interface DeckInfo {
  /** Chain of files: [0] is the overview note, then slides in order */
  chain: TFile[];
  /** Index of the current file inside chain */
  index: number;
}

export default class ReadPropsBarPlugin extends Plugin {
  /** The properties bar DOM element */
  private bar: HTMLElement | null = null;
  /** Whether the user manually hid the bar (toggle command) */
  private barHidden = false;
  /** Whether fullscreen reading mode is currently active */
  private fullscreen = false;
  /** Whether auto-fullscreen in reading view is enabled (default on) */
  private autoFullscreen = true;
  /** Last refresh key ("path|mode") to avoid pointless re-renders */
  private lastKey = "";
  /** Plugin settings */
  settings: ReadPropsBarSettings = { ...DEFAULT_SETTINGS };

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new ReadPropsBarSettingTab(this));

    // ── 1. Refresh on "current note / view changed" events ──────────────
    this.registerEvent(this.app.workspace.on("file-open", () => this.refresh()));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.refresh()));
    this.registerEvent(this.app.workspace.on("layout-change", () => this.refresh()));
    // Refresh when the note content (including frontmatter) changes / saves
    this.registerEvent(
      this.app.metadataCache.on("changed", (file: TFile) => {
        if (file === this.app.workspace.getActiveFile()) this.refresh();
      })
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
      }, 500)
    );

    // ── 3. Commands ─────────────────────────────────────────────────────
    // 3a. Manually show / hide the properties bar
    this.addCommand({
      id: "toggle-props-bar",
      name: "Toggle Properties Bar",
      callback: () => {
        this.barHidden = !this.barHidden;
        this.refresh();
      },
    });
    // 3b. Pause / resume auto-fullscreen in reading view
    this.addCommand({
      id: "toggle-auto-fullscreen",
      name: "Pause/Resume Auto Fullscreen",
      callback: () => {
        this.autoFullscreen = !this.autoFullscreen;
        // When paused, restore the layout immediately; when resumed, re-sync
        if (!this.autoFullscreen) this.syncFullscreen(false);
        else this.refresh();
      },
    });
    // 3c. Previous / next page (deck navigation, rebindable in Settings → Hotkeys)
    this.addCommand({
      id: "nav-prev",
      name: "Previous Page",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "ArrowLeft" }],
      callback: () => this.navigate("prev"),
    });
    this.addCommand({
      id: "nav-next",
      name: "Next Page",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "ArrowRight" }],
      callback: () => this.navigate("next"),
    });

    // ── 4. Esc exits OS fullscreen → leave reading view as well ─────────
    // Keeps internal state in sync when the user presses Esc; also switches
    // the active Markdown view back to edit mode. Our own exitFullscreen()
    // calls set this.fullscreen = false first, so they never trigger this.
    this.registerDomEvent(document, "fullscreenchange", () => {
      if (!document.fullscreenElement && this.fullscreen) {
        this.fullscreen = false;
        document.body.classList.remove("rv-props-fullscreen");
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view && view.getMode() === "preview") {
          // setMode is not in the public typings but exists at runtime
          (view as unknown as { setMode: (mode: "source" | "preview") => void }).setMode("source");
        }
      }
    });

    // ── 5. Create the bar and do the first render ───────────────────────
    this.bar = document.createElement("div");
    this.bar.className = "rv-props-bar";
    this.bar.style.display = "none"; // hidden until refresh() decides otherwise
    document.body.appendChild(this.bar);
    this.refresh();
  }

  onunload(): void {
    this.bar?.remove();
    this.bar = null;
    // Leave OS fullscreen and drop the fullscreen class so no UI residue remains
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    document.body.classList.remove("rv-props-fullscreen");
  }

  // ── Settings ──────────────────────────────────────────────────────────

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  // ── Deck resolution (scan the vault, follow the link chain) ───────────

  /**
   * Resolve the current note's position inside its deck.
   *
   * Convention for the single `deck` property (up to two links):
   *   - overview note: one link → that link IS the first page;
   *   - slide note:    first link → the overview page, second link → next slide
   *                    (no second link on the last slide).
   *
   * Returns the full chain ([overview, slide 1, slide 2, …]) and the current
   * note's index, or null when the note is not part of any deck.
   */
  private computeDeck(file: TFile): DeckInfo | null {
    const currentLinks = this.deckLinks(file);
    if (currentLinks.length === 0) return null;

    let overview: TFile | undefined;
    let firstPage: TFile | undefined;

    if (currentLinks.length >= 2) {
      // A slide: first link is the overview page
      overview = currentLinks[0];
      firstPage = this.deckLinks(overview)[0];
    } else {
      // A single link: either we ARE the overview (link = first page),
      // or we are the last slide (link = overview page)
      const only = currentLinks[0];
      const onlyLinks = this.deckLinks(only);
      if (onlyLinks[0]?.path === file.path) {
        overview = file;
        firstPage = only;
      } else {
        overview = only;
        firstPage = onlyLinks[0];
      }
    }
    if (!overview || !firstPage) return null;

    // Walk the chain: overview → first page → next → next → …
    const chain: TFile[] = [];
    const visited = new Set<string>();
    const push = (f: TFile | undefined): void => {
      if (f && !visited.has(f.path)) {
        visited.add(f.path);
        chain.push(f);
      }
    };
    push(overview);
    push(firstPage);
    let cur = firstPage;
    while (cur) {
      const next = this.deckLinks(cur)[1];
      if (!next || visited.has(next.path)) break; // end of deck or cycle guard
      push(next);
      cur = next;
    }

    const index = chain.findIndex((f) => f.path === file.path);
    if (index === -1) return null;
    return { chain, index };
  }

  /** Resolve the `deck` property of a note into real files (max two) */
  private deckLinks(file: TFile): TFile[] {
    const fm = this.frontmatterOf(file);
    const names = fm ? extractLinks(fm[DECK_KEY]) : [];
    return names
      .map((name) => this.app.metadataCache.getFirstLinkpathDest(name, file.path))
      .filter((f): f is TFile => !!f);
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
    void this.app.workspace.openLinkText(target.path, file.path);
  }

  // ── Mode / data access ────────────────────────────────────────────────

  /** Mode of the active Markdown view: 'preview'=reading 'source'=editing ''=none */
  private currentMode(): "preview" | "source" | "" {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    return view ? (view.getMode() as "preview" | "source") : "";
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

    // Auto-fullscreen: enter on reading view, restore on leaving it
    this.syncFullscreen(mode === "preview" && this.autoFullscreen);

    // Not a Markdown note / not in reading view / hidden by the user → hide
    if (!file || mode !== "preview" || this.barHidden) {
      this.bar.style.display = "none";
      return;
    }

    const fm = this.frontmatter();
    const deck = this.computeDeck(file);
    clearChildren(this.bar);

    // ── Left: previous / next buttons (only inside a deck) ──
    if (this.settings.showNavButtons && deck) {
      const hasPrev = deck.index > 0;
      const hasNext = deck.index < deck.chain.length - 1;
      if (hasPrev || hasNext) {
        const nav = document.createElement("div");
        nav.className = "rv-props-nav";
        if (hasPrev) nav.appendChild(this.navButton("◀", "Previous page", () => this.navigate("prev")));
        if (hasNext) nav.appendChild(this.navButton("▶", "Next page", () => this.navigate("next")));
        this.bar.appendChild(nav);
      }
    }

    // ── Middle: chips for the remaining properties ──
    const visible = fm
      ? Object.entries(fm).filter(([key]) => key !== DECK_KEY && key !== "position")
      : [];

    if (visible.length === 0) {
      // No properties → placeholder text
      const span = document.createElement("span");
      span.className = "rv-props-empty";
      span.textContent = "No properties";
      this.bar.appendChild(span);
    } else {
      for (const [key, value] of visible) {
        const span = document.createElement("span");
        span.className = "rv-props-item";
        const k = document.createElement("strong");
        k.textContent = key;
        span.appendChild(k);
        span.appendChild(document.createTextNode(": " + formatValue(value)));
        this.bar.appendChild(span);
      }
    }

    // ── Bottom-right: auto-computed page number ──
    if (this.settings.showPageNumber && deck) {
      const page = document.createElement("span");
      page.className = "rv-props-page";
      // chain[0] is the overview note; slides start at index 1 → "Page 1"
      page.textContent = deck.index === 0 ? "Overview" : `Page ${deck.index}`;
      this.bar.appendChild(page);
    }

    this.bar.style.display = "";
  }

  /** Build a ◀ / ▶ navigation button */
  private navButton(label: string, tip: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.className = "rv-props-nav-btn";
    btn.textContent = label;
    btn.title = tip;
    btn.addEventListener("click", onClick);
    return btn;
  }

  /** Sync the fullscreen state: add the class + request OS fullscreen, or restore */
  private syncFullscreen(active: boolean): void {
    if (this.fullscreen === active) return; // nothing to do
    this.fullscreen = active;
    document.body.classList.toggle("rv-props-fullscreen", active);

    // Request OS-level fullscreen when entering (Obsidian runs on Electron and
    // supports the Fullscreen API); failures (e.g. in a plain browser) are
    // ignored silently — the "hide sidebars" effect still applies.
    if (active) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }
}

// ── Settings tab ────────────────────────────────────────────────────────

class ReadPropsBarSettingTab extends PluginSettingTab {
  constructor(private plugin: ReadPropsBarPlugin) {
    super(plugin.app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Properties Bar · Settings" });

    new Setting(containerEl)
      .setName("Show Previous/Next buttons")
      .setDesc("Show ◀ ▶ buttons on the left of the bar when the note belongs to a deck (has a `deck` property)")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showNavButtons).onChange(async (value) => {
          this.plugin.settings.showNavButtons = value;
          await this.plugin.saveSettings();
          this.plugin.refresh();
        })
      );

    new Setting(containerEl)
      .setName("Show page number")
      .setDesc("Auto-computed from the deck chain (overview page shows “Overview”); shown at the bottom-right")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showPageNumber).onChange(async (value) => {
          this.plugin.settings.showPageNumber = value;
          await this.plugin.saveSettings();
          this.plugin.refresh();
        })
      );

    new Setting(containerEl)
      .setName("Navigation hotkeys")
      .setDesc("Default: Previous Page Mod+Shift+←, Next Page Mod+Shift+→. Rebind under Settings → Hotkeys.")
      .addButton((button) =>
        button.setButtonText("Open Hotkeys Settings").onClick(() => {
          // Open Obsidian's hotkeys settings page (internal API; ignore failures)
          (this.app as unknown as { setting?: { openTabById?: (id: string) => void } })
            .setting?.openTabById?.("hotkeys");
        })
      );
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Extract up to MAX_DECK_LINKS note names from a `deck` property value.
 * Accepts a single string or a YAML list of strings; unquoted [[x]] values are
 * parsed by YAML as nested arrays and flattened here.
 */
function extractLinks(value: unknown): string[] {
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
    if (out.length >= MAX_DECK_LINKS) break;
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
function extractLinkText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed
    .replace(/^\[\[/, "")
    .replace(/\]\]$/, "")
    .split("|")[0]
    .split("#")[0]
    .trim();
}

/** Render a property value as readable text: arrays/objects → JSON, else String */
function formatValue(value: unknown): string {
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

/** Remove all children of an element */
function clearChildren(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}
