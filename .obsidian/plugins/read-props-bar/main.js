"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ReadPropsBarPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  showNavButtons: true,
  showPageNumber: true
};
var DECK_KEY = "deck";
var MAX_DECK_LINKS = 2;
var ReadPropsBarPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    /** The properties bar DOM element */
    this.bar = null;
    /** Whether the user manually hid the bar (toggle command) */
    this.barHidden = false;
    /** Whether fullscreen reading mode is currently active */
    this.fullscreen = false;
    /** Whether auto-fullscreen in reading view is enabled (default on) */
    this.autoFullscreen = true;
    /** Last refresh key ("path|mode") to avoid pointless re-renders */
    this.lastKey = "";
    /** Plugin settings */
    this.settings = { ...DEFAULT_SETTINGS };
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new ReadPropsBarSettingTab(this));
    this.registerEvent(this.app.workspace.on("file-open", () => this.refresh()));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.refresh()));
    this.registerEvent(this.app.workspace.on("layout-change", () => this.refresh()));
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        if (file === this.app.workspace.getActiveFile()) this.refresh();
      })
    );
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
    this.addCommand({
      id: "toggle-props-bar",
      name: "Toggle Properties Bar",
      callback: () => {
        this.barHidden = !this.barHidden;
        this.refresh();
      }
    });
    this.addCommand({
      id: "toggle-auto-fullscreen",
      name: "Pause/Resume Auto Fullscreen",
      callback: () => {
        this.autoFullscreen = !this.autoFullscreen;
        if (!this.autoFullscreen) this.syncFullscreen(false);
        else this.refresh();
      }
    });
    this.addCommand({
      id: "nav-prev",
      name: "Previous Page",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "ArrowLeft" }],
      callback: () => this.navigate("prev")
    });
    this.addCommand({
      id: "nav-next",
      name: "Next Page",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "ArrowRight" }],
      callback: () => this.navigate("next")
    });
    this.registerDomEvent(document, "fullscreenchange", () => {
      if (!document.fullscreenElement && this.fullscreen) {
        this.fullscreen = false;
        document.body.classList.remove("rv-props-fullscreen");
        const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
        if (view && view.getMode() === "preview") {
          view.setMode("source");
        }
      }
    });
    this.bar = document.createElement("div");
    this.bar.className = "rv-props-bar";
    this.bar.style.display = "none";
    document.body.appendChild(this.bar);
    this.refresh();
  }
  onunload() {
    this.bar?.remove();
    this.bar = null;
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {
    });
    document.body.classList.remove("rv-props-fullscreen");
  }
  // ── Settings ──────────────────────────────────────────────────────────
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
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
  computeDeck(file) {
    const currentLinks = this.deckLinks(file);
    if (currentLinks.length === 0) return null;
    let overview;
    let firstPage;
    if (currentLinks.length >= 2) {
      overview = currentLinks[0];
      firstPage = this.deckLinks(overview)[0];
    } else {
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
    const chain = [];
    const visited = /* @__PURE__ */ new Set();
    const push = (f) => {
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
      if (!next || visited.has(next.path)) break;
      push(next);
      cur = next;
    }
    const index = chain.findIndex((f) => f.path === file.path);
    if (index === -1) return null;
    return { chain, index };
  }
  /** Resolve the `deck` property of a note into real files (max two) */
  deckLinks(file) {
    const fm = this.frontmatterOf(file);
    const names = fm ? extractLinks(fm[DECK_KEY]) : [];
    return names.map((name) => this.app.metadataCache.getFirstLinkpathDest(name, file.path)).filter((f) => !!f);
  }
  /** Frontmatter of any note as an object, or null when absent */
  frontmatterOf(file) {
    const cache = this.app.metadataCache.getFileCache(file);
    return cache?.frontmatter ?? null;
  }
  // ── PPT navigation ────────────────────────────────────────────────────
  /** Move one step back/forward along the deck chain */
  navigate(direction) {
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
  currentMode() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    return view ? view.getMode() : "";
  }
  /** Current note's frontmatter as an object, or null when absent */
  frontmatter() {
    const file = this.app.workspace.getActiveFile();
    return file ? this.frontmatterOf(file) : null;
  }
  // ── Bar rendering ─────────────────────────────────────────────────────
  /** Decide what the bar shows, then re-render it */
  refresh() {
    if (!this.bar) return;
    const file = this.app.workspace.getActiveFile();
    const mode = this.currentMode();
    this.syncFullscreen(mode === "preview" && this.autoFullscreen);
    if (!file || mode !== "preview" || this.barHidden) {
      this.bar.style.display = "none";
      return;
    }
    const fm = this.frontmatter();
    const deck = this.computeDeck(file);
    clearChildren(this.bar);
    if (this.settings.showNavButtons && deck) {
      const hasPrev = deck.index > 0;
      const hasNext = deck.index < deck.chain.length - 1;
      if (hasPrev || hasNext) {
        const nav = document.createElement("div");
        nav.className = "rv-props-nav";
        if (hasPrev)
          nav.appendChild(this.navButton("\u25C0", "Previous page", () => this.navigate("prev")));
        if (hasNext) nav.appendChild(this.navButton("\u25B6", "Next page", () => this.navigate("next")));
        this.bar.appendChild(nav);
      }
    }
    const visible = fm ? Object.entries(fm).filter(([key]) => key !== DECK_KEY && key !== "position") : [];
    if (visible.length === 0) {
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
    if (this.settings.showPageNumber && deck) {
      const page = document.createElement("span");
      page.className = "rv-props-page";
      page.textContent = deck.index === 0 ? "Overview" : `Page ${deck.index}`;
      this.bar.appendChild(page);
    }
    this.bar.style.display = "";
  }
  /** Build a ◀ / ▶ navigation button */
  navButton(label, tip, onClick) {
    const btn = document.createElement("button");
    btn.className = "rv-props-nav-btn";
    btn.textContent = label;
    btn.title = tip;
    btn.addEventListener("click", onClick);
    return btn;
  }
  /** Sync the fullscreen state: add the class + request OS fullscreen, or restore */
  syncFullscreen(active) {
    if (this.fullscreen === active) return;
    this.fullscreen = active;
    document.body.classList.toggle("rv-props-fullscreen", active);
    if (active) {
      document.documentElement.requestFullscreen?.().catch(() => {
      });
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {
      });
    }
  }
};
var ReadPropsBarSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(plugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Properties Bar \xB7 Settings" });
    new import_obsidian.Setting(containerEl).setName("Show Previous/Next buttons").setDesc(
      "Show \u25C0 \u25B6 buttons on the left of the bar when the note belongs to a deck (has a `deck` property)"
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showNavButtons).onChange(async (value) => {
        this.plugin.settings.showNavButtons = value;
        await this.plugin.saveSettings();
        this.plugin.refresh();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Show page number").setDesc(
      "Auto-computed from the deck chain (overview page shows \u201COverview\u201D); shown at the bottom-right"
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showPageNumber).onChange(async (value) => {
        this.plugin.settings.showPageNumber = value;
        await this.plugin.saveSettings();
        this.plugin.refresh();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Navigation hotkeys").setDesc(
      "Default: Previous Page Mod+Shift+\u2190, Next Page Mod+Shift+\u2192. Rebind under Settings \u2192 Hotkeys."
    ).addButton(
      (button) => button.setButtonText("Open Hotkeys Settings").onClick(() => {
        this.app.setting?.openTabById?.("hotkeys");
      })
    );
  }
};
function extractLinks(value) {
  const flat = [];
  const collect = (v) => {
    if (Array.isArray(v)) {
      for (const item of v) collect(item);
    } else {
      flat.push(v);
    }
  };
  collect(value);
  const out = [];
  for (const item of flat) {
    const name = extractLinkText(item);
    if (name) out.push(name);
    if (out.length >= MAX_DECK_LINKS) break;
  }
  return out;
}
function extractLinkText(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^\[\[/, "").replace(/\]\]$/, "").split("|")[0].split("#")[0].trim();
}
function formatValue(value) {
  if (value === null || value === void 0) return "\u2014";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiByZWFkLXByb3BzLWJhciBcdTIwMTQgUmVhZGluZy12aWV3IHByb3BlcnRpZXMgYmFyIHdpdGggUFBULXN0eWxlIGRlY2sgbmF2aWdhdGlvblxuICpcbiAqIEZlYXR1cmVzOlxuICogICAxLiBIaWRlcyBPYnNpZGlhbidzIG5hdGl2ZSBzdGF0dXMgYmFyIGFuZCByZW5kZXJzIGEgXCJwcm9wZXJ0aWVzIGJhclwiIGF0IHRoZVxuICogICAgICBib3R0b20gb2YgdGhlIHdpbmRvdy5cbiAqICAgMi4gSW4gcmVhZGluZyB2aWV3LCBzaG93cyB0aGUgY3VycmVudCBub3RlJ3MgcHJvcGVydGllcyAoWUFNTCBmcm9udG1hdHRlcilcbiAqICAgICAgYXMgY2hpcHMgaW4gdGhhdCBiYXIuXG4gKiAgIDMuIFJlYWRpbmcgdmlldyBhdXRvLWVudGVycyBhIGZ1bGxzY3JlZW4tbGlrZSBtb2RlOiB0aGUgcmliYm9uLCBzaWRlYmFycyxcbiAqICAgICAgdGFiIGJhciBhbmQgdGhlIHBhbmUgaGVhZGVyIGJhciBhcmUgaGlkZGVuOyBsZWF2aW5nIHJlYWRpbmcgdmlld1xuICogICAgICByZXN0b3JlcyB0aGVtIGF1dG9tYXRpY2FsbHkuIFByZXNzaW5nIEVzYyB0byBsZWF2ZSB0aGUgT1MgZnVsbHNjcmVlblxuICogICAgICBhbHNvIGV4aXRzIHJlYWRpbmcgdmlldy5cbiAqICAgNC4gSGlkZXMgdGhlIGluLW5vdGUgcHJvcGVydGllcyBwYW5lbCBpbiByZWFkaW5nIHZpZXcgKGtlcHQgaW4gZWRpdCB2aWV3KS5cbiAqICAgNS4gUFBULXN0eWxlIGRlY2sgbmF2aWdhdGlvbiBkcml2ZW4gYnkgT05FIHJlc2VydmVkIGZyb250bWF0dGVyIGtleSwgYGRlY2tgLFxuICogICAgICBob2xkaW5nIHVwIHRvIHR3byBtYXJrZG93biBsaW5rczpcbiAqICAgICAgICAtIG92ZXJ2aWV3IG5vdGUgOiBkZWNrOiBbXCJbW2ZpcnN0LXNsaWRlXV1cIl0gICAgICAgICAgICAob25lIGxpbmsgPSB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdCBwYWdlIG9mIHRoZSBkZWNrOyB0aGUgbm90ZSBpcyB0aGUgb3ZlcnZpZXcpXG4gKiAgICAgICAgLSBzbGlkZSBub3RlICAgIDogZGVjazogW1wiW1tvdmVydmlld11dXCIsIFwiW1tuZXh0LXNsaWRlXV1cIl1cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAoZmlyc3QgbGluayA9IHRoZSBvdmVydmlldyBwYWdlLCBzZWNvbmQgbGluayA9IHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIG5leHQgc2xpZGU7IG9taXQgdGhlIHNlY29uZCBsaW5rIG9uIHRoZSBsYXN0IHNsaWRlKVxuICogICAgICBUaGUgcGFnZSBudW1iZXIgaXMgY29tcHV0ZWQgYXV0b21hdGljYWxseSBieSBzY2FubmluZyB0aGUgdmF1bHQgYW5kXG4gKiAgICAgIHdhbGtpbmcgdGhlIGNoYWluIG9mIGxpbmtzLCBzbyBubyBgcGFnZS1udW1iZXJgIHByb3BlcnR5IGlzIG5lZWRlZC5cbiAqICAgICAgXHUyNUMwIFx1MjVCNiBidXR0b25zIGFwcGVhciBvbiB0aGUgbGVmdCBvZiB0aGUgYmFyLCBhbmQgXCJQcmV2aW91cyBQYWdlXCIgLyBcIk5leHRcbiAqICAgICAgUGFnZVwiIGNvbW1hbmRzIGFyZSByZWdpc3RlcmVkIChkZWZhdWx0IGhvdGtleXMgTW9kK1NoaWZ0K1x1MjE5MCAvIE1vZCtTaGlmdCtcdTIxOTIsXG4gKiAgICAgIHJlYmluZGFibGUgdW5kZXIgU2V0dGluZ3MgXHUyMTkyIEhvdGtleXMpLlxuICogICA2LiBBIHNldHRpbmdzIHRhYiB0b2dnbGVzIHRoZSBcdTI1QzAgXHUyNUI2IGJ1dHRvbnMgYW5kIHRoZSBwYWdlIG51bWJlci5cbiAqXG4gKiBUaGUgZGVjayB1c3VhbGx5IHN0YXJ0cyBmcm9tIGFuIG92ZXJ2aWV3IG5vdGUgdGhhdCBlbWJlZHMgYW4gT2JzaWRpYW4gQmFzZVxuICogdmlldyAoY29yZSBcIkJhc2VzXCIgcGx1Z2luKSBmaWx0ZXJpbmcgbm90ZXMgdGhhdCBsaW5rIHRvIHRoZSBvdmVydmlldyBwYWdlOlxuICpcbiAqICAgYGBgYmFzZVxuICogICBmaWx0ZXJzOlxuICogICAgIGFuZDpcbiAqICAgICAgIC0gZmlsZS5oYXNMaW5rKFwib3ZlcnZpZXdcIilcbiAqICAgdmlld3M6XG4gKiAgICAgLSB0eXBlOiB0YWJsZVxuICogICAgICAgbmFtZTogRGVja1xuICogICBgYGBcbiAqXG4gKiBXaHkgcmVhZCBwcm9wZXJ0aWVzIHZpYSBtZXRhZGF0YUNhY2hlIGluc3RlYWQgb2YgcGFyc2luZyBZQU1MIG1hbnVhbGx5P1xuICogICBPYnNpZGlhbiBtYWludGFpbnMgYSBjYWNoZSBwZXIgbm90ZTsgbWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSlcbiAqICAgLmZyb250bWF0dGVyIHJldHVybnMgdGhlIHBhcnNlZCBwcm9wZXJ0aWVzLCB1cGRhdGVkIGF1dG9tYXRpY2FsbHkgb24gc2F2ZS5cbiAqL1xuXG5pbXBvcnQgeyBQbHVnaW4sIE1hcmtkb3duVmlldywgVEZpbGUsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuLyoqIFBsdWdpbiBzZXR0aW5ncyAqL1xuaW50ZXJmYWNlIFJlYWRQcm9wc0JhclNldHRpbmdzIHtcbiAgLyoqIFNob3cgXHUyNUMwIFx1MjVCNiBwcmV2aW91cy9uZXh0IGJ1dHRvbnMgb24gdGhlIGxlZnQgb2YgdGhlIGJhciAqL1xuICBzaG93TmF2QnV0dG9uczogYm9vbGVhbjtcbiAgLyoqIFNob3cgdGhlIGF1dG8tY29tcHV0ZWQgcGFnZSBudW1iZXIgYXQgdGhlIGJvdHRvbS1yaWdodCBvZiB0aGUgYmFyICovXG4gIHNob3dQYWdlTnVtYmVyOiBib29sZWFuO1xufVxuXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBSZWFkUHJvcHNCYXJTZXR0aW5ncyA9IHtcbiAgc2hvd05hdkJ1dHRvbnM6IHRydWUsXG4gIHNob3dQYWdlTnVtYmVyOiB0cnVlLFxufTtcblxuLyoqIFJlc2VydmVkIGZyb250bWF0dGVyIGtleSBkcml2aW5nIGRlY2sgbmF2aWdhdGlvbiAobmV2ZXIgcmVuZGVyZWQgYXMgYSBjaGlwKSAqL1xuY29uc3QgREVDS19LRVkgPSBcImRlY2tcIjtcbi8qKiBBIGRlY2sgbGluayBsaXN0IG5ldmVyIGhvbGRzIG1vcmUgdGhhbiB0d28gZW50cmllcyAqL1xuY29uc3QgTUFYX0RFQ0tfTElOS1MgPSAyO1xuXG4vKiogUmVzdWx0IG9mIHJlc29sdmluZyBhIG5vdGUncyBwb3NpdGlvbiBpbnNpZGUgYSBkZWNrICovXG5pbnRlcmZhY2UgRGVja0luZm8ge1xuICAvKiogQ2hhaW4gb2YgZmlsZXM6IFswXSBpcyB0aGUgb3ZlcnZpZXcgbm90ZSwgdGhlbiBzbGlkZXMgaW4gb3JkZXIgKi9cbiAgY2hhaW46IFRGaWxlW107XG4gIC8qKiBJbmRleCBvZiB0aGUgY3VycmVudCBmaWxlIGluc2lkZSBjaGFpbiAqL1xuICBpbmRleDogbnVtYmVyO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZWFkUHJvcHNCYXJQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICAvKiogVGhlIHByb3BlcnRpZXMgYmFyIERPTSBlbGVtZW50ICovXG4gIHByaXZhdGUgYmFyOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICAvKiogV2hldGhlciB0aGUgdXNlciBtYW51YWxseSBoaWQgdGhlIGJhciAodG9nZ2xlIGNvbW1hbmQpICovXG4gIHByaXZhdGUgYmFySGlkZGVuID0gZmFsc2U7XG4gIC8qKiBXaGV0aGVyIGZ1bGxzY3JlZW4gcmVhZGluZyBtb2RlIGlzIGN1cnJlbnRseSBhY3RpdmUgKi9cbiAgcHJpdmF0ZSBmdWxsc2NyZWVuID0gZmFsc2U7XG4gIC8qKiBXaGV0aGVyIGF1dG8tZnVsbHNjcmVlbiBpbiByZWFkaW5nIHZpZXcgaXMgZW5hYmxlZCAoZGVmYXVsdCBvbikgKi9cbiAgcHJpdmF0ZSBhdXRvRnVsbHNjcmVlbiA9IHRydWU7XG4gIC8qKiBMYXN0IHJlZnJlc2gga2V5IChcInBhdGh8bW9kZVwiKSB0byBhdm9pZCBwb2ludGxlc3MgcmUtcmVuZGVycyAqL1xuICBwcml2YXRlIGxhc3RLZXkgPSBcIlwiO1xuICAvKiogUGx1Z2luIHNldHRpbmdzICovXG4gIHNldHRpbmdzOiBSZWFkUHJvcHNCYXJTZXR0aW5ncyA9IHsgLi4uREVGQVVMVF9TRVRUSU5HUyB9O1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgUmVhZFByb3BzQmFyU2V0dGluZ1RhYih0aGlzKSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMS4gUmVmcmVzaCBvbiBcImN1cnJlbnQgbm90ZSAvIHZpZXcgY2hhbmdlZFwiIGV2ZW50cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsICgpID0+IHRoaXMucmVmcmVzaCgpKSk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAoKSA9PiB0aGlzLnJlZnJlc2goKSkpO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJsYXlvdXQtY2hhbmdlXCIsICgpID0+IHRoaXMucmVmcmVzaCgpKSk7XG4gICAgLy8gUmVmcmVzaCB3aGVuIHRoZSBub3RlIGNvbnRlbnQgKGluY2x1ZGluZyBmcm9udG1hdHRlcikgY2hhbmdlcyAvIHNhdmVzXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5vbihcImNoYW5nZWRcIiwgKGZpbGU6IFRGaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlID09PSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpKSB0aGlzLnJlZnJlc2goKTtcbiAgICAgIH0pLFxuICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMi4gRmFsbGJhY2sgdGltZXI6IGVkaXRcdTIxOTRyZWFkaW5nIHRvZ2dsZXMgbWF5IGZpcmUgbm8gc3RhbmRhcmQgZXZlbnQgXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5yZWdpc3RlckludGVydmFsKFxuICAgICAgd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGNvbnN0IGtleSA9IGZpbGUgPyBgJHtmaWxlLnBhdGh9fCR7dGhpcy5jdXJyZW50TW9kZSgpfWAgOiBcIlwiO1xuICAgICAgICBpZiAoa2V5ICE9PSB0aGlzLmxhc3RLZXkpIHtcbiAgICAgICAgICB0aGlzLmxhc3RLZXkgPSBrZXk7XG4gICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgIH1cbiAgICAgIH0sIDUwMCksXG4gICAgKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCAzLiBDb21tYW5kcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICAvLyAzYS4gTWFudWFsbHkgc2hvdyAvIGhpZGUgdGhlIHByb3BlcnRpZXMgYmFyXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcInRvZ2dsZS1wcm9wcy1iYXJcIixcbiAgICAgIG5hbWU6IFwiVG9nZ2xlIFByb3BlcnRpZXMgQmFyXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4ge1xuICAgICAgICB0aGlzLmJhckhpZGRlbiA9ICF0aGlzLmJhckhpZGRlbjtcbiAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIC8vIDNiLiBQYXVzZSAvIHJlc3VtZSBhdXRvLWZ1bGxzY3JlZW4gaW4gcmVhZGluZyB2aWV3XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcInRvZ2dsZS1hdXRvLWZ1bGxzY3JlZW5cIixcbiAgICAgIG5hbWU6IFwiUGF1c2UvUmVzdW1lIEF1dG8gRnVsbHNjcmVlblwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgdGhpcy5hdXRvRnVsbHNjcmVlbiA9ICF0aGlzLmF1dG9GdWxsc2NyZWVuO1xuICAgICAgICAvLyBXaGVuIHBhdXNlZCwgcmVzdG9yZSB0aGUgbGF5b3V0IGltbWVkaWF0ZWx5OyB3aGVuIHJlc3VtZWQsIHJlLXN5bmNcbiAgICAgICAgaWYgKCF0aGlzLmF1dG9GdWxsc2NyZWVuKSB0aGlzLnN5bmNGdWxsc2NyZWVuKGZhbHNlKTtcbiAgICAgICAgZWxzZSB0aGlzLnJlZnJlc2goKTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgLy8gM2MuIFByZXZpb3VzIC8gbmV4dCBwYWdlIChkZWNrIG5hdmlnYXRpb24sIHJlYmluZGFibGUgaW4gU2V0dGluZ3MgXHUyMTkyIEhvdGtleXMpXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5hdi1wcmV2XCIsXG4gICAgICBuYW1lOiBcIlByZXZpb3VzIFBhZ2VcIixcbiAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJBcnJvd0xlZnRcIiB9XSxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLm5hdmlnYXRlKFwicHJldlwiKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibmF2LW5leHRcIixcbiAgICAgIG5hbWU6IFwiTmV4dCBQYWdlXCIsXG4gICAgICBob3RrZXlzOiBbeyBtb2RpZmllcnM6IFtcIk1vZFwiLCBcIlNoaWZ0XCJdLCBrZXk6IFwiQXJyb3dSaWdodFwiIH1dLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHRoaXMubmF2aWdhdGUoXCJuZXh0XCIpLFxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDQuIEVzYyBleGl0cyBPUyBmdWxsc2NyZWVuIFx1MjE5MiBsZWF2ZSByZWFkaW5nIHZpZXcgYXMgd2VsbCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICAvLyBLZWVwcyBpbnRlcm5hbCBzdGF0ZSBpbiBzeW5jIHdoZW4gdGhlIHVzZXIgcHJlc3NlcyBFc2M7IGFsc28gc3dpdGNoZXNcbiAgICAvLyB0aGUgYWN0aXZlIE1hcmtkb3duIHZpZXcgYmFjayB0byBlZGl0IG1vZGUuIE91ciBvd24gZXhpdEZ1bGxzY3JlZW4oKVxuICAgIC8vIGNhbGxzIHNldCB0aGlzLmZ1bGxzY3JlZW4gPSBmYWxzZSBmaXJzdCwgc28gdGhleSBuZXZlciB0cmlnZ2VyIHRoaXMuXG4gICAgdGhpcy5yZWdpc3RlckRvbUV2ZW50KGRvY3VtZW50LCBcImZ1bGxzY3JlZW5jaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgaWYgKCFkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCAmJiB0aGlzLmZ1bGxzY3JlZW4pIHtcbiAgICAgICAgdGhpcy5mdWxsc2NyZWVuID0gZmFsc2U7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShcInJ2LXByb3BzLWZ1bGxzY3JlZW5cIik7XG4gICAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgICAgICBpZiAodmlldyAmJiB2aWV3LmdldE1vZGUoKSA9PT0gXCJwcmV2aWV3XCIpIHtcbiAgICAgICAgICAvLyBzZXRNb2RlIGlzIG5vdCBpbiB0aGUgcHVibGljIHR5cGluZ3MgYnV0IGV4aXN0cyBhdCBydW50aW1lXG4gICAgICAgICAgKHZpZXcgYXMgdW5rbm93biBhcyB7IHNldE1vZGU6IChtb2RlOiBcInNvdXJjZVwiIHwgXCJwcmV2aWV3XCIpID0+IHZvaWQgfSkuc2V0TW9kZShcInNvdXJjZVwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDUuIENyZWF0ZSB0aGUgYmFyIGFuZCBkbyB0aGUgZmlyc3QgcmVuZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIHRoaXMuYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLmJhci5jbGFzc05hbWUgPSBcInJ2LXByb3BzLWJhclwiO1xuICAgIHRoaXMuYmFyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjsgLy8gaGlkZGVuIHVudGlsIHJlZnJlc2goKSBkZWNpZGVzIG90aGVyd2lzZVxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5iYXIpO1xuICAgIHRoaXMucmVmcmVzaCgpO1xuICB9XG5cbiAgb251bmxvYWQoKTogdm9pZCB7XG4gICAgdGhpcy5iYXI/LnJlbW92ZSgpO1xuICAgIHRoaXMuYmFyID0gbnVsbDtcbiAgICAvLyBMZWF2ZSBPUyBmdWxsc2NyZWVuIGFuZCBkcm9wIHRoZSBmdWxsc2NyZWVuIGNsYXNzIHNvIG5vIFVJIHJlc2lkdWUgcmVtYWluc1xuICAgIGlmIChkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCkgZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4/LigpLmNhdGNoKCgpID0+IHt9KTtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoXCJydi1wcm9wcy1mdWxsc2NyZWVuXCIpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNldHRpbmdzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIERlY2sgcmVzb2x1dGlvbiAoc2NhbiB0aGUgdmF1bHQsIGZvbGxvdyB0aGUgbGluayBjaGFpbikgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLyoqXG4gICAqIFJlc29sdmUgdGhlIGN1cnJlbnQgbm90ZSdzIHBvc2l0aW9uIGluc2lkZSBpdHMgZGVjay5cbiAgICpcbiAgICogQ29udmVudGlvbiBmb3IgdGhlIHNpbmdsZSBgZGVja2AgcHJvcGVydHkgKHVwIHRvIHR3byBsaW5rcyk6XG4gICAqICAgLSBvdmVydmlldyBub3RlOiBvbmUgbGluayBcdTIxOTIgdGhhdCBsaW5rIElTIHRoZSBmaXJzdCBwYWdlO1xuICAgKiAgIC0gc2xpZGUgbm90ZTogICAgZmlyc3QgbGluayBcdTIxOTIgdGhlIG92ZXJ2aWV3IHBhZ2UsIHNlY29uZCBsaW5rIFx1MjE5MiBuZXh0IHNsaWRlXG4gICAqICAgICAgICAgICAgICAgICAgICAobm8gc2Vjb25kIGxpbmsgb24gdGhlIGxhc3Qgc2xpZGUpLlxuICAgKlxuICAgKiBSZXR1cm5zIHRoZSBmdWxsIGNoYWluIChbb3ZlcnZpZXcsIHNsaWRlIDEsIHNsaWRlIDIsIFx1MjAyNl0pIGFuZCB0aGUgY3VycmVudFxuICAgKiBub3RlJ3MgaW5kZXgsIG9yIG51bGwgd2hlbiB0aGUgbm90ZSBpcyBub3QgcGFydCBvZiBhbnkgZGVjay5cbiAgICovXG4gIHByaXZhdGUgY29tcHV0ZURlY2soZmlsZTogVEZpbGUpOiBEZWNrSW5mbyB8IG51bGwge1xuICAgIGNvbnN0IGN1cnJlbnRMaW5rcyA9IHRoaXMuZGVja0xpbmtzKGZpbGUpO1xuICAgIGlmIChjdXJyZW50TGlua3MubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICAgIGxldCBvdmVydmlldzogVEZpbGUgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGZpcnN0UGFnZTogVEZpbGUgfCB1bmRlZmluZWQ7XG5cbiAgICBpZiAoY3VycmVudExpbmtzLmxlbmd0aCA+PSAyKSB7XG4gICAgICAvLyBBIHNsaWRlOiBmaXJzdCBsaW5rIGlzIHRoZSBvdmVydmlldyBwYWdlXG4gICAgICBvdmVydmlldyA9IGN1cnJlbnRMaW5rc1swXTtcbiAgICAgIGZpcnN0UGFnZSA9IHRoaXMuZGVja0xpbmtzKG92ZXJ2aWV3KVswXTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQSBzaW5nbGUgbGluazogZWl0aGVyIHdlIEFSRSB0aGUgb3ZlcnZpZXcgKGxpbmsgPSBmaXJzdCBwYWdlKSxcbiAgICAgIC8vIG9yIHdlIGFyZSB0aGUgbGFzdCBzbGlkZSAobGluayA9IG92ZXJ2aWV3IHBhZ2UpXG4gICAgICBjb25zdCBvbmx5ID0gY3VycmVudExpbmtzWzBdO1xuICAgICAgY29uc3Qgb25seUxpbmtzID0gdGhpcy5kZWNrTGlua3Mob25seSk7XG4gICAgICBpZiAob25seUxpbmtzWzBdPy5wYXRoID09PSBmaWxlLnBhdGgpIHtcbiAgICAgICAgb3ZlcnZpZXcgPSBmaWxlO1xuICAgICAgICBmaXJzdFBhZ2UgPSBvbmx5O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3ZlcnZpZXcgPSBvbmx5O1xuICAgICAgICBmaXJzdFBhZ2UgPSBvbmx5TGlua3NbMF07XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghb3ZlcnZpZXcgfHwgIWZpcnN0UGFnZSkgcmV0dXJuIG51bGw7XG5cbiAgICAvLyBXYWxrIHRoZSBjaGFpbjogb3ZlcnZpZXcgXHUyMTkyIGZpcnN0IHBhZ2UgXHUyMTkyIG5leHQgXHUyMTkyIG5leHQgXHUyMTkyIFx1MjAyNlxuICAgIGNvbnN0IGNoYWluOiBURmlsZVtdID0gW107XG4gICAgY29uc3QgdmlzaXRlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGNvbnN0IHB1c2ggPSAoZjogVEZpbGUgfCB1bmRlZmluZWQpOiB2b2lkID0+IHtcbiAgICAgIGlmIChmICYmICF2aXNpdGVkLmhhcyhmLnBhdGgpKSB7XG4gICAgICAgIHZpc2l0ZWQuYWRkKGYucGF0aCk7XG4gICAgICAgIGNoYWluLnB1c2goZik7XG4gICAgICB9XG4gICAgfTtcbiAgICBwdXNoKG92ZXJ2aWV3KTtcbiAgICBwdXNoKGZpcnN0UGFnZSk7XG4gICAgbGV0IGN1ciA9IGZpcnN0UGFnZTtcbiAgICB3aGlsZSAoY3VyKSB7XG4gICAgICBjb25zdCBuZXh0ID0gdGhpcy5kZWNrTGlua3MoY3VyKVsxXTtcbiAgICAgIGlmICghbmV4dCB8fCB2aXNpdGVkLmhhcyhuZXh0LnBhdGgpKSBicmVhazsgLy8gZW5kIG9mIGRlY2sgb3IgY3ljbGUgZ3VhcmRcbiAgICAgIHB1c2gobmV4dCk7XG4gICAgICBjdXIgPSBuZXh0O1xuICAgIH1cblxuICAgIGNvbnN0IGluZGV4ID0gY2hhaW4uZmluZEluZGV4KChmKSA9PiBmLnBhdGggPT09IGZpbGUucGF0aCk7XG4gICAgaWYgKGluZGV4ID09PSAtMSkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHsgY2hhaW4sIGluZGV4IH07XG4gIH1cblxuICAvKiogUmVzb2x2ZSB0aGUgYGRlY2tgIHByb3BlcnR5IG9mIGEgbm90ZSBpbnRvIHJlYWwgZmlsZXMgKG1heCB0d28pICovXG4gIHByaXZhdGUgZGVja0xpbmtzKGZpbGU6IFRGaWxlKTogVEZpbGVbXSB7XG4gICAgY29uc3QgZm0gPSB0aGlzLmZyb250bWF0dGVyT2YoZmlsZSk7XG4gICAgY29uc3QgbmFtZXMgPSBmbSA/IGV4dHJhY3RMaW5rcyhmbVtERUNLX0tFWV0pIDogW107XG4gICAgcmV0dXJuIG5hbWVzXG4gICAgICAubWFwKChuYW1lKSA9PiB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KG5hbWUsIGZpbGUucGF0aCkpXG4gICAgICAuZmlsdGVyKChmKTogZiBpcyBURmlsZSA9PiAhIWYpO1xuICB9XG5cbiAgLyoqIEZyb250bWF0dGVyIG9mIGFueSBub3RlIGFzIGFuIG9iamVjdCwgb3IgbnVsbCB3aGVuIGFic2VudCAqL1xuICBwcml2YXRlIGZyb250bWF0dGVyT2YoZmlsZTogVEZpbGUpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG4gICAgcmV0dXJuIGNhY2hlPy5mcm9udG1hdHRlciA/PyBudWxsO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFBQVCBuYXZpZ2F0aW9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBNb3ZlIG9uZSBzdGVwIGJhY2svZm9yd2FyZCBhbG9uZyB0aGUgZGVjayBjaGFpbiAqL1xuICBwcml2YXRlIG5hdmlnYXRlKGRpcmVjdGlvbjogXCJwcmV2XCIgfCBcIm5leHRcIik6IHZvaWQge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGlmICghZmlsZSkgcmV0dXJuO1xuICAgIGNvbnN0IGRlY2sgPSB0aGlzLmNvbXB1dGVEZWNrKGZpbGUpO1xuICAgIGlmICghZGVjaykgcmV0dXJuO1xuICAgIGNvbnN0IHRhcmdldCA9IGRlY2suY2hhaW5bZGlyZWN0aW9uID09PSBcInByZXZcIiA/IGRlY2suaW5kZXggLSAxIDogZGVjay5pbmRleCArIDFdO1xuICAgIGlmICghdGFyZ2V0KSByZXR1cm47XG4gICAgdm9pZCB0aGlzLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KHRhcmdldC5wYXRoLCBmaWxlLnBhdGgpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIE1vZGUgLyBkYXRhIGFjY2VzcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICAvKiogTW9kZSBvZiB0aGUgYWN0aXZlIE1hcmtkb3duIHZpZXc6ICdwcmV2aWV3Jz1yZWFkaW5nICdzb3VyY2UnPWVkaXRpbmcgJyc9bm9uZSAqL1xuICBwcml2YXRlIGN1cnJlbnRNb2RlKCk6IFwicHJldmlld1wiIHwgXCJzb3VyY2VcIiB8IFwiXCIge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIHJldHVybiB2aWV3ID8gKHZpZXcuZ2V0TW9kZSgpIGFzIFwicHJldmlld1wiIHwgXCJzb3VyY2VcIikgOiBcIlwiO1xuICB9XG5cbiAgLyoqIEN1cnJlbnQgbm90ZSdzIGZyb250bWF0dGVyIGFzIGFuIG9iamVjdCwgb3IgbnVsbCB3aGVuIGFic2VudCAqL1xuICBwcml2YXRlIGZyb250bWF0dGVyKCk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgcmV0dXJuIGZpbGUgPyB0aGlzLmZyb250bWF0dGVyT2YoZmlsZSkgOiBudWxsO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEJhciByZW5kZXJpbmcgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLyoqIERlY2lkZSB3aGF0IHRoZSBiYXIgc2hvd3MsIHRoZW4gcmUtcmVuZGVyIGl0ICovXG4gIHJlZnJlc2goKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmJhcikgcmV0dXJuO1xuXG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgY29uc3QgbW9kZSA9IHRoaXMuY3VycmVudE1vZGUoKTtcblxuICAgIC8vIEF1dG8tZnVsbHNjcmVlbjogZW50ZXIgb24gcmVhZGluZyB2aWV3LCByZXN0b3JlIG9uIGxlYXZpbmcgaXRcbiAgICB0aGlzLnN5bmNGdWxsc2NyZWVuKG1vZGUgPT09IFwicHJldmlld1wiICYmIHRoaXMuYXV0b0Z1bGxzY3JlZW4pO1xuXG4gICAgLy8gTm90IGEgTWFya2Rvd24gbm90ZSAvIG5vdCBpbiByZWFkaW5nIHZpZXcgLyBoaWRkZW4gYnkgdGhlIHVzZXIgXHUyMTkyIGhpZGVcbiAgICBpZiAoIWZpbGUgfHwgbW9kZSAhPT0gXCJwcmV2aWV3XCIgfHwgdGhpcy5iYXJIaWRkZW4pIHtcbiAgICAgIHRoaXMuYmFyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmbSA9IHRoaXMuZnJvbnRtYXR0ZXIoKTtcbiAgICBjb25zdCBkZWNrID0gdGhpcy5jb21wdXRlRGVjayhmaWxlKTtcbiAgICBjbGVhckNoaWxkcmVuKHRoaXMuYmFyKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBMZWZ0OiBwcmV2aW91cyAvIG5leHQgYnV0dG9ucyAob25seSBpbnNpZGUgYSBkZWNrKSBcdTI1MDBcdTI1MDBcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5zaG93TmF2QnV0dG9ucyAmJiBkZWNrKSB7XG4gICAgICBjb25zdCBoYXNQcmV2ID0gZGVjay5pbmRleCA+IDA7XG4gICAgICBjb25zdCBoYXNOZXh0ID0gZGVjay5pbmRleCA8IGRlY2suY2hhaW4ubGVuZ3RoIC0gMTtcbiAgICAgIGlmIChoYXNQcmV2IHx8IGhhc05leHQpIHtcbiAgICAgICAgY29uc3QgbmF2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgbmF2LmNsYXNzTmFtZSA9IFwicnYtcHJvcHMtbmF2XCI7XG4gICAgICAgIGlmIChoYXNQcmV2KVxuICAgICAgICAgIG5hdi5hcHBlbmRDaGlsZCh0aGlzLm5hdkJ1dHRvbihcIlx1MjVDMFwiLCBcIlByZXZpb3VzIHBhZ2VcIiwgKCkgPT4gdGhpcy5uYXZpZ2F0ZShcInByZXZcIikpKTtcbiAgICAgICAgaWYgKGhhc05leHQpIG5hdi5hcHBlbmRDaGlsZCh0aGlzLm5hdkJ1dHRvbihcIlx1MjVCNlwiLCBcIk5leHQgcGFnZVwiLCAoKSA9PiB0aGlzLm5hdmlnYXRlKFwibmV4dFwiKSkpO1xuICAgICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChuYXYpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBNaWRkbGU6IGNoaXBzIGZvciB0aGUgcmVtYWluaW5nIHByb3BlcnRpZXMgXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgdmlzaWJsZSA9IGZtXG4gICAgICA/IE9iamVjdC5lbnRyaWVzKGZtKS5maWx0ZXIoKFtrZXldKSA9PiBrZXkgIT09IERFQ0tfS0VZICYmIGtleSAhPT0gXCJwb3NpdGlvblwiKVxuICAgICAgOiBbXTtcblxuICAgIGlmICh2aXNpYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgLy8gTm8gcHJvcGVydGllcyBcdTIxOTIgcGxhY2Vob2xkZXIgdGV4dFxuICAgICAgY29uc3Qgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgc3Bhbi5jbGFzc05hbWUgPSBcInJ2LXByb3BzLWVtcHR5XCI7XG4gICAgICBzcGFuLnRleHRDb250ZW50ID0gXCJObyBwcm9wZXJ0aWVzXCI7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgdmlzaWJsZSkge1xuICAgICAgICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHNwYW4uY2xhc3NOYW1lID0gXCJydi1wcm9wcy1pdGVtXCI7XG4gICAgICAgIGNvbnN0IGsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3Ryb25nXCIpO1xuICAgICAgICBrLnRleHRDb250ZW50ID0ga2V5O1xuICAgICAgICBzcGFuLmFwcGVuZENoaWxkKGspO1xuICAgICAgICBzcGFuLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiOiBcIiArIGZvcm1hdFZhbHVlKHZhbHVlKSkpO1xuICAgICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQm90dG9tLXJpZ2h0OiBhdXRvLWNvbXB1dGVkIHBhZ2UgbnVtYmVyIFx1MjUwMFx1MjUwMFxuICAgIGlmICh0aGlzLnNldHRpbmdzLnNob3dQYWdlTnVtYmVyICYmIGRlY2spIHtcbiAgICAgIGNvbnN0IHBhZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgIHBhZ2UuY2xhc3NOYW1lID0gXCJydi1wcm9wcy1wYWdlXCI7XG4gICAgICAvLyBjaGFpblswXSBpcyB0aGUgb3ZlcnZpZXcgbm90ZTsgc2xpZGVzIHN0YXJ0IGF0IGluZGV4IDEgXHUyMTkyIFwiUGFnZSAxXCJcbiAgICAgIHBhZ2UudGV4dENvbnRlbnQgPSBkZWNrLmluZGV4ID09PSAwID8gXCJPdmVydmlld1wiIDogYFBhZ2UgJHtkZWNrLmluZGV4fWA7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChwYWdlKTtcbiAgICB9XG5cbiAgICB0aGlzLmJhci5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgfVxuXG4gIC8qKiBCdWlsZCBhIFx1MjVDMCAvIFx1MjVCNiBuYXZpZ2F0aW9uIGJ1dHRvbiAqL1xuICBwcml2YXRlIG5hdkJ1dHRvbihsYWJlbDogc3RyaW5nLCB0aXA6IHN0cmluZywgb25DbGljazogKCkgPT4gdm9pZCk6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgIGJ0bi5jbGFzc05hbWUgPSBcInJ2LXByb3BzLW5hdi1idG5cIjtcbiAgICBidG4udGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgICBidG4udGl0bGUgPSB0aXA7XG4gICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvbkNsaWNrKTtcbiAgICByZXR1cm4gYnRuO1xuICB9XG5cbiAgLyoqIFN5bmMgdGhlIGZ1bGxzY3JlZW4gc3RhdGU6IGFkZCB0aGUgY2xhc3MgKyByZXF1ZXN0IE9TIGZ1bGxzY3JlZW4sIG9yIHJlc3RvcmUgKi9cbiAgcHJpdmF0ZSBzeW5jRnVsbHNjcmVlbihhY3RpdmU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5mdWxsc2NyZWVuID09PSBhY3RpdmUpIHJldHVybjsgLy8gbm90aGluZyB0byBkb1xuICAgIHRoaXMuZnVsbHNjcmVlbiA9IGFjdGl2ZTtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC50b2dnbGUoXCJydi1wcm9wcy1mdWxsc2NyZWVuXCIsIGFjdGl2ZSk7XG5cbiAgICAvLyBSZXF1ZXN0IE9TLWxldmVsIGZ1bGxzY3JlZW4gd2hlbiBlbnRlcmluZyAoT2JzaWRpYW4gcnVucyBvbiBFbGVjdHJvbiBhbmRcbiAgICAvLyBzdXBwb3J0cyB0aGUgRnVsbHNjcmVlbiBBUEkpOyBmYWlsdXJlcyAoZS5nLiBpbiBhIHBsYWluIGJyb3dzZXIpIGFyZVxuICAgIC8vIGlnbm9yZWQgc2lsZW50bHkgXHUyMDE0IHRoZSBcImhpZGUgc2lkZWJhcnNcIiBlZmZlY3Qgc3RpbGwgYXBwbGllcy5cbiAgICBpZiAoYWN0aXZlKSB7XG4gICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4/LigpLmNhdGNoKCgpID0+IHt9KTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50KSB7XG4gICAgICBkb2N1bWVudC5leGl0RnVsbHNjcmVlbj8uKCkuY2F0Y2goKCkgPT4ge30pO1xuICAgIH1cbiAgfVxufVxuXG4vLyBcdTI1MDBcdTI1MDAgU2V0dGluZ3MgdGFiIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5jbGFzcyBSZWFkUHJvcHNCYXJTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBSZWFkUHJvcHNCYXJQbHVnaW4pIHtcbiAgICBzdXBlcihwbHVnaW4uYXBwLCBwbHVnaW4pO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiUHJvcGVydGllcyBCYXIgXHUwMEI3IFNldHRpbmdzXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBQcmV2aW91cy9OZXh0IGJ1dHRvbnNcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIlNob3cgXHUyNUMwIFx1MjVCNiBidXR0b25zIG9uIHRoZSBsZWZ0IG9mIHRoZSBiYXIgd2hlbiB0aGUgbm90ZSBiZWxvbmdzIHRvIGEgZGVjayAoaGFzIGEgYGRlY2tgIHByb3BlcnR5KVwiLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd05hdkJ1dHRvbnMpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dOYXZCdXR0b25zID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBwYWdlIG51bWJlclwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiQXV0by1jb21wdXRlZCBmcm9tIHRoZSBkZWNrIGNoYWluIChvdmVydmlldyBwYWdlIHNob3dzIFx1MjAxQ092ZXJ2aWV3XHUyMDFEKTsgc2hvd24gYXQgdGhlIGJvdHRvbS1yaWdodFwiLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1BhZ2VOdW1iZXIpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dQYWdlTnVtYmVyID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTmF2aWdhdGlvbiBob3RrZXlzXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJEZWZhdWx0OiBQcmV2aW91cyBQYWdlIE1vZCtTaGlmdCtcdTIxOTAsIE5leHQgUGFnZSBNb2QrU2hpZnQrXHUyMTkyLiBSZWJpbmQgdW5kZXIgU2V0dGluZ3MgXHUyMTkyIEhvdGtleXMuXCIsXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiT3BlbiBIb3RrZXlzIFNldHRpbmdzXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIC8vIE9wZW4gT2JzaWRpYW4ncyBob3RrZXlzIHNldHRpbmdzIHBhZ2UgKGludGVybmFsIEFQSTsgaWdub3JlIGZhaWx1cmVzKVxuICAgICAgICAgIChcbiAgICAgICAgICAgIHRoaXMuYXBwIGFzIHVua25vd24gYXMgeyBzZXR0aW5nPzogeyBvcGVuVGFiQnlJZD86IChpZDogc3RyaW5nKSA9PiB2b2lkIH0gfVxuICAgICAgICAgICkuc2V0dGluZz8ub3BlblRhYkJ5SWQ/LihcImhvdGtleXNcIik7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgfVxufVxuXG4vLyBcdTI1MDBcdTI1MDAgSGVscGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuLyoqXG4gKiBFeHRyYWN0IHVwIHRvIE1BWF9ERUNLX0xJTktTIG5vdGUgbmFtZXMgZnJvbSBhIGBkZWNrYCBwcm9wZXJ0eSB2YWx1ZS5cbiAqIEFjY2VwdHMgYSBzaW5nbGUgc3RyaW5nIG9yIGEgWUFNTCBsaXN0IG9mIHN0cmluZ3M7IHVucXVvdGVkIFtbeF1dIHZhbHVlcyBhcmVcbiAqIHBhcnNlZCBieSBZQU1MIGFzIG5lc3RlZCBhcnJheXMgYW5kIGZsYXR0ZW5lZCBoZXJlLlxuICovXG5mdW5jdGlvbiBleHRyYWN0TGlua3ModmFsdWU6IHVua25vd24pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGZsYXQ6IHVua25vd25bXSA9IFtdO1xuICBjb25zdCBjb2xsZWN0ID0gKHY6IHVua25vd24pOiB2b2lkID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHYpIGNvbGxlY3QoaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZsYXQucHVzaCh2KTtcbiAgICB9XG4gIH07XG4gIGNvbGxlY3QodmFsdWUpO1xuXG4gIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBpdGVtIG9mIGZsYXQpIHtcbiAgICBjb25zdCBuYW1lID0gZXh0cmFjdExpbmtUZXh0KGl0ZW0pO1xuICAgIGlmIChuYW1lKSBvdXQucHVzaChuYW1lKTtcbiAgICBpZiAob3V0Lmxlbmd0aCA+PSBNQVhfREVDS19MSU5LUykgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRoZSB0YXJnZXQgbm90ZSBuYW1lIGZyb20gYSBtYXJrZG93biBsaW5rIHN0cmluZy5cbiAqIEhhbmRsZXMgc2V2ZXJhbCBzaGFwZXM6XG4gKiAgIFwiW1tzbGlkZS0yXV1cIiAgICAgICAgXHUyMTkyIHNsaWRlLTJcbiAqICAgXCJbW3NsaWRlLTJ8YWxpYXNdXVwiICBcdTIxOTIgc2xpZGUtMlxuICogICBcIltbc2xpZGUtMiNzZWN0aW9uXV1cIlx1MjE5MiBzbGlkZS0yXG4gKiAgIHNsaWRlLTIgICAgICAgICAgICAgIFx1MjE5MiBzbGlkZS0yIChiYXJlIGZpbGVuYW1lKVxuICovXG5mdW5jdGlvbiBleHRyYWN0TGlua1RleHQodmFsdWU6IHVua25vd24pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHRyaW1tZWQgPSB2YWx1ZS50cmltKCk7XG4gIGlmICghdHJpbW1lZCkgcmV0dXJuIG51bGw7XG4gIHJldHVybiB0cmltbWVkLnJlcGxhY2UoL15cXFtcXFsvLCBcIlwiKS5yZXBsYWNlKC9cXF1cXF0kLywgXCJcIikuc3BsaXQoXCJ8XCIpWzBdLnNwbGl0KFwiI1wiKVswXS50cmltKCk7XG59XG5cbi8qKiBSZW5kZXIgYSBwcm9wZXJ0eSB2YWx1ZSBhcyByZWFkYWJsZSB0ZXh0OiBhcnJheXMvb2JqZWN0cyBcdTIxOTIgSlNPTiwgZWxzZSBTdHJpbmcgKi9cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybiBcIlx1MjAxNFwiO1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSk7XG59XG5cbi8qKiBSZW1vdmUgYWxsIGNoaWxkcmVuIG9mIGFuIGVsZW1lbnQgKi9cbmZ1bmN0aW9uIGNsZWFyQ2hpbGRyZW4oZWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIHdoaWxlIChlbC5maXJzdENoaWxkKSBlbC5yZW1vdmVDaGlsZChlbC5maXJzdENoaWxkKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQTRDQSxzQkFBdUU7QUFVdkUsSUFBTSxtQkFBeUM7QUFBQSxFQUM3QyxnQkFBZ0I7QUFBQSxFQUNoQixnQkFBZ0I7QUFDbEI7QUFHQSxJQUFNLFdBQVc7QUFFakIsSUFBTSxpQkFBaUI7QUFVdkIsSUFBcUIscUJBQXJCLGNBQWdELHVCQUFPO0FBQUEsRUFBdkQ7QUFBQTtBQUVFO0FBQUEsU0FBUSxNQUEwQjtBQUVsQztBQUFBLFNBQVEsWUFBWTtBQUVwQjtBQUFBLFNBQVEsYUFBYTtBQUVyQjtBQUFBLFNBQVEsaUJBQWlCO0FBRXpCO0FBQUEsU0FBUSxVQUFVO0FBRWxCO0FBQUEsb0JBQWlDLEVBQUUsR0FBRyxpQkFBaUI7QUFBQTtBQUFBLEVBRXZELE1BQU0sU0FBd0I7QUFDNUIsVUFBTSxLQUFLLGFBQWE7QUFDeEIsU0FBSyxjQUFjLElBQUksdUJBQXVC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
