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
import { computeDeck, extractLinks, formatValue, type DeckInfo } from "./src/deck";

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
}

const DEFAULT_SETTINGS: NativeSlidesSettings = {
  showNavButtons: true,
  showPageNumber: true,
  barHidden: false,
  autoFullscreen: true,
};

/** Reserved frontmatter key driving deck navigation (never rendered as a chip) */
const DECK_KEY = "deck";

export default class NativeSlidesPlugin extends Plugin {
  /** The properties bar DOM element */
  private bar: HTMLElement | null = null;
  /** Whether fullscreen reading mode is currently active */
  private fullscreen = false;
  /** Last refresh key ("path|mode") to avoid pointless re-renders */
  private lastKey = "";
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
    this.syncFullscreen(mode === "preview" && this.settings.autoFullscreen);

    // Not a Markdown note / not in reading view / hidden by the user → hide
    if (!file || mode !== "preview" || this.settings.barHidden) {
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

/** Remove all children of an element */
function clearChildren(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}
