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
        if (hasPrev) nav.appendChild(this.navButton("\u25C0", "Previous page", () => this.navigate("prev")));
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
    new import_obsidian.Setting(containerEl).setName("Show Previous/Next buttons").setDesc("Show \u25C0 \u25B6 buttons on the left of the bar when the note belongs to a deck (has a `deck` property)").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showNavButtons).onChange(async (value) => {
        this.plugin.settings.showNavButtons = value;
        await this.plugin.saveSettings();
        this.plugin.refresh();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Show page number").setDesc("Auto-computed from the deck chain (overview page shows \u201COverview\u201D); shown at the bottom-right").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showPageNumber).onChange(async (value) => {
        this.plugin.settings.showPageNumber = value;
        await this.plugin.saveSettings();
        this.plugin.refresh();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Navigation hotkeys").setDesc("Default: Previous Page Mod+Shift+\u2190, Next Page Mod+Shift+\u2192. Rebind under Settings \u2192 Hotkeys.").addButton(
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiByZWFkLXByb3BzLWJhciBcdTIwMTQgUmVhZGluZy12aWV3IHByb3BlcnRpZXMgYmFyIHdpdGggUFBULXN0eWxlIGRlY2sgbmF2aWdhdGlvblxuICpcbiAqIEZlYXR1cmVzOlxuICogICAxLiBIaWRlcyBPYnNpZGlhbidzIG5hdGl2ZSBzdGF0dXMgYmFyIGFuZCByZW5kZXJzIGEgXCJwcm9wZXJ0aWVzIGJhclwiIGF0IHRoZVxuICogICAgICBib3R0b20gb2YgdGhlIHdpbmRvdy5cbiAqICAgMi4gSW4gcmVhZGluZyB2aWV3LCBzaG93cyB0aGUgY3VycmVudCBub3RlJ3MgcHJvcGVydGllcyAoWUFNTCBmcm9udG1hdHRlcilcbiAqICAgICAgYXMgY2hpcHMgaW4gdGhhdCBiYXIuXG4gKiAgIDMuIFJlYWRpbmcgdmlldyBhdXRvLWVudGVycyBhIGZ1bGxzY3JlZW4tbGlrZSBtb2RlOiB0aGUgcmliYm9uLCBzaWRlYmFycyxcbiAqICAgICAgdGFiIGJhciBhbmQgdGhlIHBhbmUgaGVhZGVyIGJhciBhcmUgaGlkZGVuOyBsZWF2aW5nIHJlYWRpbmcgdmlld1xuICogICAgICByZXN0b3JlcyB0aGVtIGF1dG9tYXRpY2FsbHkuIFByZXNzaW5nIEVzYyB0byBsZWF2ZSB0aGUgT1MgZnVsbHNjcmVlblxuICogICAgICBhbHNvIGV4aXRzIHJlYWRpbmcgdmlldy5cbiAqICAgNC4gSGlkZXMgdGhlIGluLW5vdGUgcHJvcGVydGllcyBwYW5lbCBpbiByZWFkaW5nIHZpZXcgKGtlcHQgaW4gZWRpdCB2aWV3KS5cbiAqICAgNS4gUFBULXN0eWxlIGRlY2sgbmF2aWdhdGlvbiBkcml2ZW4gYnkgT05FIHJlc2VydmVkIGZyb250bWF0dGVyIGtleSwgYGRlY2tgLFxuICogICAgICBob2xkaW5nIHVwIHRvIHR3byBtYXJrZG93biBsaW5rczpcbiAqICAgICAgICAtIG92ZXJ2aWV3IG5vdGUgOiBkZWNrOiBbXCJbW2ZpcnN0LXNsaWRlXV1cIl0gICAgICAgICAgICAob25lIGxpbmsgPSB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdCBwYWdlIG9mIHRoZSBkZWNrOyB0aGUgbm90ZSBpcyB0aGUgb3ZlcnZpZXcpXG4gKiAgICAgICAgLSBzbGlkZSBub3RlICAgIDogZGVjazogW1wiW1tvdmVydmlld11dXCIsIFwiW1tuZXh0LXNsaWRlXV1cIl1cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAoZmlyc3QgbGluayA9IHRoZSBvdmVydmlldyBwYWdlLCBzZWNvbmQgbGluayA9IHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIG5leHQgc2xpZGU7IG9taXQgdGhlIHNlY29uZCBsaW5rIG9uIHRoZSBsYXN0IHNsaWRlKVxuICogICAgICBUaGUgcGFnZSBudW1iZXIgaXMgY29tcHV0ZWQgYXV0b21hdGljYWxseSBieSBzY2FubmluZyB0aGUgdmF1bHQgYW5kXG4gKiAgICAgIHdhbGtpbmcgdGhlIGNoYWluIG9mIGxpbmtzLCBzbyBubyBgcGFnZS1udW1iZXJgIHByb3BlcnR5IGlzIG5lZWRlZC5cbiAqICAgICAgXHUyNUMwIFx1MjVCNiBidXR0b25zIGFwcGVhciBvbiB0aGUgbGVmdCBvZiB0aGUgYmFyLCBhbmQgXCJQcmV2aW91cyBQYWdlXCIgLyBcIk5leHRcbiAqICAgICAgUGFnZVwiIGNvbW1hbmRzIGFyZSByZWdpc3RlcmVkIChkZWZhdWx0IGhvdGtleXMgTW9kK1NoaWZ0K1x1MjE5MCAvIE1vZCtTaGlmdCtcdTIxOTIsXG4gKiAgICAgIHJlYmluZGFibGUgdW5kZXIgU2V0dGluZ3MgXHUyMTkyIEhvdGtleXMpLlxuICogICA2LiBBIHNldHRpbmdzIHRhYiB0b2dnbGVzIHRoZSBcdTI1QzAgXHUyNUI2IGJ1dHRvbnMgYW5kIHRoZSBwYWdlIG51bWJlci5cbiAqXG4gKiBUaGUgZGVjayB1c3VhbGx5IHN0YXJ0cyBmcm9tIGFuIG92ZXJ2aWV3IG5vdGUgdGhhdCBlbWJlZHMgYW4gT2JzaWRpYW4gQmFzZVxuICogdmlldyAoY29yZSBcIkJhc2VzXCIgcGx1Z2luKSBmaWx0ZXJpbmcgbm90ZXMgdGhhdCBsaW5rIHRvIHRoZSBvdmVydmlldyBwYWdlOlxuICpcbiAqICAgYGBgYmFzZVxuICogICBmaWx0ZXJzOlxuICogICAgIGFuZDpcbiAqICAgICAgIC0gZmlsZS5oYXNMaW5rKFwib3ZlcnZpZXdcIilcbiAqICAgdmlld3M6XG4gKiAgICAgLSB0eXBlOiB0YWJsZVxuICogICAgICAgbmFtZTogRGVja1xuICogICBgYGBcbiAqXG4gKiBXaHkgcmVhZCBwcm9wZXJ0aWVzIHZpYSBtZXRhZGF0YUNhY2hlIGluc3RlYWQgb2YgcGFyc2luZyBZQU1MIG1hbnVhbGx5P1xuICogICBPYnNpZGlhbiBtYWludGFpbnMgYSBjYWNoZSBwZXIgbm90ZTsgbWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSlcbiAqICAgLmZyb250bWF0dGVyIHJldHVybnMgdGhlIHBhcnNlZCBwcm9wZXJ0aWVzLCB1cGRhdGVkIGF1dG9tYXRpY2FsbHkgb24gc2F2ZS5cbiAqL1xuXG5pbXBvcnQgeyBQbHVnaW4sIE1hcmtkb3duVmlldywgVEZpbGUsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuLyoqIFBsdWdpbiBzZXR0aW5ncyAqL1xuaW50ZXJmYWNlIFJlYWRQcm9wc0JhclNldHRpbmdzIHtcbiAgLyoqIFNob3cgXHUyNUMwIFx1MjVCNiBwcmV2aW91cy9uZXh0IGJ1dHRvbnMgb24gdGhlIGxlZnQgb2YgdGhlIGJhciAqL1xuICBzaG93TmF2QnV0dG9uczogYm9vbGVhbjtcbiAgLyoqIFNob3cgdGhlIGF1dG8tY29tcHV0ZWQgcGFnZSBudW1iZXIgYXQgdGhlIGJvdHRvbS1yaWdodCBvZiB0aGUgYmFyICovXG4gIHNob3dQYWdlTnVtYmVyOiBib29sZWFuO1xufVxuXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBSZWFkUHJvcHNCYXJTZXR0aW5ncyA9IHtcbiAgc2hvd05hdkJ1dHRvbnM6IHRydWUsXG4gIHNob3dQYWdlTnVtYmVyOiB0cnVlLFxufTtcblxuLyoqIFJlc2VydmVkIGZyb250bWF0dGVyIGtleSBkcml2aW5nIGRlY2sgbmF2aWdhdGlvbiAobmV2ZXIgcmVuZGVyZWQgYXMgYSBjaGlwKSAqL1xuY29uc3QgREVDS19LRVkgPSBcImRlY2tcIjtcbi8qKiBBIGRlY2sgbGluayBsaXN0IG5ldmVyIGhvbGRzIG1vcmUgdGhhbiB0d28gZW50cmllcyAqL1xuY29uc3QgTUFYX0RFQ0tfTElOS1MgPSAyO1xuXG4vKiogUmVzdWx0IG9mIHJlc29sdmluZyBhIG5vdGUncyBwb3NpdGlvbiBpbnNpZGUgYSBkZWNrICovXG5pbnRlcmZhY2UgRGVja0luZm8ge1xuICAvKiogQ2hhaW4gb2YgZmlsZXM6IFswXSBpcyB0aGUgb3ZlcnZpZXcgbm90ZSwgdGhlbiBzbGlkZXMgaW4gb3JkZXIgKi9cbiAgY2hhaW46IFRGaWxlW107XG4gIC8qKiBJbmRleCBvZiB0aGUgY3VycmVudCBmaWxlIGluc2lkZSBjaGFpbiAqL1xuICBpbmRleDogbnVtYmVyO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZWFkUHJvcHNCYXJQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICAvKiogVGhlIHByb3BlcnRpZXMgYmFyIERPTSBlbGVtZW50ICovXG4gIHByaXZhdGUgYmFyOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICAvKiogV2hldGhlciB0aGUgdXNlciBtYW51YWxseSBoaWQgdGhlIGJhciAodG9nZ2xlIGNvbW1hbmQpICovXG4gIHByaXZhdGUgYmFySGlkZGVuID0gZmFsc2U7XG4gIC8qKiBXaGV0aGVyIGZ1bGxzY3JlZW4gcmVhZGluZyBtb2RlIGlzIGN1cnJlbnRseSBhY3RpdmUgKi9cbiAgcHJpdmF0ZSBmdWxsc2NyZWVuID0gZmFsc2U7XG4gIC8qKiBXaGV0aGVyIGF1dG8tZnVsbHNjcmVlbiBpbiByZWFkaW5nIHZpZXcgaXMgZW5hYmxlZCAoZGVmYXVsdCBvbikgKi9cbiAgcHJpdmF0ZSBhdXRvRnVsbHNjcmVlbiA9IHRydWU7XG4gIC8qKiBMYXN0IHJlZnJlc2gga2V5IChcInBhdGh8bW9kZVwiKSB0byBhdm9pZCBwb2ludGxlc3MgcmUtcmVuZGVycyAqL1xuICBwcml2YXRlIGxhc3RLZXkgPSBcIlwiO1xuICAvKiogUGx1Z2luIHNldHRpbmdzICovXG4gIHNldHRpbmdzOiBSZWFkUHJvcHNCYXJTZXR0aW5ncyA9IHsgLi4uREVGQVVMVF9TRVRUSU5HUyB9O1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgUmVhZFByb3BzQmFyU2V0dGluZ1RhYih0aGlzKSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMS4gUmVmcmVzaCBvbiBcImN1cnJlbnQgbm90ZSAvIHZpZXcgY2hhbmdlZFwiIGV2ZW50cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsICgpID0+IHRoaXMucmVmcmVzaCgpKSk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAoKSA9PiB0aGlzLnJlZnJlc2goKSkpO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJsYXlvdXQtY2hhbmdlXCIsICgpID0+IHRoaXMucmVmcmVzaCgpKSk7XG4gICAgLy8gUmVmcmVzaCB3aGVuIHRoZSBub3RlIGNvbnRlbnQgKGluY2x1ZGluZyBmcm9udG1hdHRlcikgY2hhbmdlcyAvIHNhdmVzXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5vbihcImNoYW5nZWRcIiwgKGZpbGU6IFRGaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlID09PSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpKSB0aGlzLnJlZnJlc2goKTtcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCAyLiBGYWxsYmFjayB0aW1lcjogZWRpdFx1MjE5NHJlYWRpbmcgdG9nZ2xlcyBtYXkgZmlyZSBubyBzdGFuZGFyZCBldmVudCBcdTI1MDBcdTI1MDBcbiAgICB0aGlzLnJlZ2lzdGVySW50ZXJ2YWwoXG4gICAgICB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICAgICAgY29uc3Qga2V5ID0gZmlsZSA/IGAke2ZpbGUucGF0aH18JHt0aGlzLmN1cnJlbnRNb2RlKCl9YCA6IFwiXCI7XG4gICAgICAgIGlmIChrZXkgIT09IHRoaXMubGFzdEtleSkge1xuICAgICAgICAgIHRoaXMubGFzdEtleSA9IGtleTtcbiAgICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICAgICAgfVxuICAgICAgfSwgNTAwKVxuICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMy4gQ29tbWFuZHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgLy8gM2EuIE1hbnVhbGx5IHNob3cgLyBoaWRlIHRoZSBwcm9wZXJ0aWVzIGJhclxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJ0b2dnbGUtcHJvcHMtYmFyXCIsXG4gICAgICBuYW1lOiBcIlRvZ2dsZSBQcm9wZXJ0aWVzIEJhclwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgdGhpcy5iYXJIaWRkZW4gPSAhdGhpcy5iYXJIaWRkZW47XG4gICAgICAgIHRoaXMucmVmcmVzaCgpO1xuICAgICAgfSxcbiAgICB9KTtcbiAgICAvLyAzYi4gUGF1c2UgLyByZXN1bWUgYXV0by1mdWxsc2NyZWVuIGluIHJlYWRpbmcgdmlld1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJ0b2dnbGUtYXV0by1mdWxsc2NyZWVuXCIsXG4gICAgICBuYW1lOiBcIlBhdXNlL1Jlc3VtZSBBdXRvIEZ1bGxzY3JlZW5cIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XG4gICAgICAgIHRoaXMuYXV0b0Z1bGxzY3JlZW4gPSAhdGhpcy5hdXRvRnVsbHNjcmVlbjtcbiAgICAgICAgLy8gV2hlbiBwYXVzZWQsIHJlc3RvcmUgdGhlIGxheW91dCBpbW1lZGlhdGVseTsgd2hlbiByZXN1bWVkLCByZS1zeW5jXG4gICAgICAgIGlmICghdGhpcy5hdXRvRnVsbHNjcmVlbikgdGhpcy5zeW5jRnVsbHNjcmVlbihmYWxzZSk7XG4gICAgICAgIGVsc2UgdGhpcy5yZWZyZXNoKCk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIC8vIDNjLiBQcmV2aW91cyAvIG5leHQgcGFnZSAoZGVjayBuYXZpZ2F0aW9uLCByZWJpbmRhYmxlIGluIFNldHRpbmdzIFx1MjE5MiBIb3RrZXlzKVxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJuYXYtcHJldlwiLFxuICAgICAgbmFtZTogXCJQcmV2aW91cyBQYWdlXCIsXG4gICAgICBob3RrZXlzOiBbeyBtb2RpZmllcnM6IFtcIk1vZFwiLCBcIlNoaWZ0XCJdLCBrZXk6IFwiQXJyb3dMZWZ0XCIgfV0sXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5uYXZpZ2F0ZShcInByZXZcIiksXG4gICAgfSk7XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5hdi1uZXh0XCIsXG4gICAgICBuYW1lOiBcIk5leHQgUGFnZVwiLFxuICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIiwgXCJTaGlmdFwiXSwga2V5OiBcIkFycm93UmlnaHRcIiB9XSxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLm5hdmlnYXRlKFwibmV4dFwiKSxcbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCA0LiBFc2MgZXhpdHMgT1MgZnVsbHNjcmVlbiBcdTIxOTIgbGVhdmUgcmVhZGluZyB2aWV3IGFzIHdlbGwgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgLy8gS2VlcHMgaW50ZXJuYWwgc3RhdGUgaW4gc3luYyB3aGVuIHRoZSB1c2VyIHByZXNzZXMgRXNjOyBhbHNvIHN3aXRjaGVzXG4gICAgLy8gdGhlIGFjdGl2ZSBNYXJrZG93biB2aWV3IGJhY2sgdG8gZWRpdCBtb2RlLiBPdXIgb3duIGV4aXRGdWxsc2NyZWVuKClcbiAgICAvLyBjYWxscyBzZXQgdGhpcy5mdWxsc2NyZWVuID0gZmFsc2UgZmlyc3QsIHNvIHRoZXkgbmV2ZXIgdHJpZ2dlciB0aGlzLlxuICAgIHRoaXMucmVnaXN0ZXJEb21FdmVudChkb2N1bWVudCwgXCJmdWxsc2NyZWVuY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGlmICghZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQgJiYgdGhpcy5mdWxsc2NyZWVuKSB7XG4gICAgICAgIHRoaXMuZnVsbHNjcmVlbiA9IGZhbHNlO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoXCJydi1wcm9wcy1mdWxsc2NyZWVuXCIpO1xuICAgICAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICAgICAgaWYgKHZpZXcgJiYgdmlldy5nZXRNb2RlKCkgPT09IFwicHJldmlld1wiKSB7XG4gICAgICAgICAgLy8gc2V0TW9kZSBpcyBub3QgaW4gdGhlIHB1YmxpYyB0eXBpbmdzIGJ1dCBleGlzdHMgYXQgcnVudGltZVxuICAgICAgICAgICh2aWV3IGFzIHVua25vd24gYXMgeyBzZXRNb2RlOiAobW9kZTogXCJzb3VyY2VcIiB8IFwicHJldmlld1wiKSA9PiB2b2lkIH0pLnNldE1vZGUoXCJzb3VyY2VcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCA1LiBDcmVhdGUgdGhlIGJhciBhbmQgZG8gdGhlIGZpcnN0IHJlbmRlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICB0aGlzLmJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdGhpcy5iYXIuY2xhc3NOYW1lID0gXCJydi1wcm9wcy1iYXJcIjtcbiAgICB0aGlzLmJhci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7IC8vIGhpZGRlbiB1bnRpbCByZWZyZXNoKCkgZGVjaWRlcyBvdGhlcndpc2VcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuYmFyKTtcbiAgICB0aGlzLnJlZnJlc2goKTtcbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuYmFyPy5yZW1vdmUoKTtcbiAgICB0aGlzLmJhciA9IG51bGw7XG4gICAgLy8gTGVhdmUgT1MgZnVsbHNjcmVlbiBhbmQgZHJvcCB0aGUgZnVsbHNjcmVlbiBjbGFzcyBzbyBubyBVSSByZXNpZHVlIHJlbWFpbnNcbiAgICBpZiAoZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQpIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuPy4oKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKFwicnYtcHJvcHMtZnVsbHNjcmVlblwiKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTZXR0aW5ncyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBEZWNrIHJlc29sdXRpb24gKHNjYW4gdGhlIHZhdWx0LCBmb2xsb3cgdGhlIGxpbmsgY2hhaW4pIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKlxuICAgKiBSZXNvbHZlIHRoZSBjdXJyZW50IG5vdGUncyBwb3NpdGlvbiBpbnNpZGUgaXRzIGRlY2suXG4gICAqXG4gICAqIENvbnZlbnRpb24gZm9yIHRoZSBzaW5nbGUgYGRlY2tgIHByb3BlcnR5ICh1cCB0byB0d28gbGlua3MpOlxuICAgKiAgIC0gb3ZlcnZpZXcgbm90ZTogb25lIGxpbmsgXHUyMTkyIHRoYXQgbGluayBJUyB0aGUgZmlyc3QgcGFnZTtcbiAgICogICAtIHNsaWRlIG5vdGU6ICAgIGZpcnN0IGxpbmsgXHUyMTkyIHRoZSBvdmVydmlldyBwYWdlLCBzZWNvbmQgbGluayBcdTIxOTIgbmV4dCBzbGlkZVxuICAgKiAgICAgICAgICAgICAgICAgICAgKG5vIHNlY29uZCBsaW5rIG9uIHRoZSBsYXN0IHNsaWRlKS5cbiAgICpcbiAgICogUmV0dXJucyB0aGUgZnVsbCBjaGFpbiAoW292ZXJ2aWV3LCBzbGlkZSAxLCBzbGlkZSAyLCBcdTIwMjZdKSBhbmQgdGhlIGN1cnJlbnRcbiAgICogbm90ZSdzIGluZGV4LCBvciBudWxsIHdoZW4gdGhlIG5vdGUgaXMgbm90IHBhcnQgb2YgYW55IGRlY2suXG4gICAqL1xuICBwcml2YXRlIGNvbXB1dGVEZWNrKGZpbGU6IFRGaWxlKTogRGVja0luZm8gfCBudWxsIHtcbiAgICBjb25zdCBjdXJyZW50TGlua3MgPSB0aGlzLmRlY2tMaW5rcyhmaWxlKTtcbiAgICBpZiAoY3VycmVudExpbmtzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgICBsZXQgb3ZlcnZpZXc6IFRGaWxlIHwgdW5kZWZpbmVkO1xuICAgIGxldCBmaXJzdFBhZ2U6IFRGaWxlIHwgdW5kZWZpbmVkO1xuXG4gICAgaWYgKGN1cnJlbnRMaW5rcy5sZW5ndGggPj0gMikge1xuICAgICAgLy8gQSBzbGlkZTogZmlyc3QgbGluayBpcyB0aGUgb3ZlcnZpZXcgcGFnZVxuICAgICAgb3ZlcnZpZXcgPSBjdXJyZW50TGlua3NbMF07XG4gICAgICBmaXJzdFBhZ2UgPSB0aGlzLmRlY2tMaW5rcyhvdmVydmlldylbMF07XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEEgc2luZ2xlIGxpbms6IGVpdGhlciB3ZSBBUkUgdGhlIG92ZXJ2aWV3IChsaW5rID0gZmlyc3QgcGFnZSksXG4gICAgICAvLyBvciB3ZSBhcmUgdGhlIGxhc3Qgc2xpZGUgKGxpbmsgPSBvdmVydmlldyBwYWdlKVxuICAgICAgY29uc3Qgb25seSA9IGN1cnJlbnRMaW5rc1swXTtcbiAgICAgIGNvbnN0IG9ubHlMaW5rcyA9IHRoaXMuZGVja0xpbmtzKG9ubHkpO1xuICAgICAgaWYgKG9ubHlMaW5rc1swXT8ucGF0aCA9PT0gZmlsZS5wYXRoKSB7XG4gICAgICAgIG92ZXJ2aWV3ID0gZmlsZTtcbiAgICAgICAgZmlyc3RQYWdlID0gb25seTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG92ZXJ2aWV3ID0gb25seTtcbiAgICAgICAgZmlyc3RQYWdlID0gb25seUxpbmtzWzBdO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIW92ZXJ2aWV3IHx8ICFmaXJzdFBhZ2UpIHJldHVybiBudWxsO1xuXG4gICAgLy8gV2FsayB0aGUgY2hhaW46IG92ZXJ2aWV3IFx1MjE5MiBmaXJzdCBwYWdlIFx1MjE5MiBuZXh0IFx1MjE5MiBuZXh0IFx1MjE5MiBcdTIwMjZcbiAgICBjb25zdCBjaGFpbjogVEZpbGVbXSA9IFtdO1xuICAgIGNvbnN0IHZpc2l0ZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb25zdCBwdXNoID0gKGY6IFRGaWxlIHwgdW5kZWZpbmVkKTogdm9pZCA9PiB7XG4gICAgICBpZiAoZiAmJiAhdmlzaXRlZC5oYXMoZi5wYXRoKSkge1xuICAgICAgICB2aXNpdGVkLmFkZChmLnBhdGgpO1xuICAgICAgICBjaGFpbi5wdXNoKGYpO1xuICAgICAgfVxuICAgIH07XG4gICAgcHVzaChvdmVydmlldyk7XG4gICAgcHVzaChmaXJzdFBhZ2UpO1xuICAgIGxldCBjdXIgPSBmaXJzdFBhZ2U7XG4gICAgd2hpbGUgKGN1cikge1xuICAgICAgY29uc3QgbmV4dCA9IHRoaXMuZGVja0xpbmtzKGN1cilbMV07XG4gICAgICBpZiAoIW5leHQgfHwgdmlzaXRlZC5oYXMobmV4dC5wYXRoKSkgYnJlYWs7IC8vIGVuZCBvZiBkZWNrIG9yIGN5Y2xlIGd1YXJkXG4gICAgICBwdXNoKG5leHQpO1xuICAgICAgY3VyID0gbmV4dDtcbiAgICB9XG5cbiAgICBjb25zdCBpbmRleCA9IGNoYWluLmZpbmRJbmRleCgoZikgPT4gZi5wYXRoID09PSBmaWxlLnBhdGgpO1xuICAgIGlmIChpbmRleCA9PT0gLTEpIHJldHVybiBudWxsO1xuICAgIHJldHVybiB7IGNoYWluLCBpbmRleCB9O1xuICB9XG5cbiAgLyoqIFJlc29sdmUgdGhlIGBkZWNrYCBwcm9wZXJ0eSBvZiBhIG5vdGUgaW50byByZWFsIGZpbGVzIChtYXggdHdvKSAqL1xuICBwcml2YXRlIGRlY2tMaW5rcyhmaWxlOiBURmlsZSk6IFRGaWxlW10ge1xuICAgIGNvbnN0IGZtID0gdGhpcy5mcm9udG1hdHRlck9mKGZpbGUpO1xuICAgIGNvbnN0IG5hbWVzID0gZm0gPyBleHRyYWN0TGlua3MoZm1bREVDS19LRVldKSA6IFtdO1xuICAgIHJldHVybiBuYW1lc1xuICAgICAgLm1hcCgobmFtZSkgPT4gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChuYW1lLCBmaWxlLnBhdGgpKVxuICAgICAgLmZpbHRlcigoZik6IGYgaXMgVEZpbGUgPT4gISFmKTtcbiAgfVxuXG4gIC8qKiBGcm9udG1hdHRlciBvZiBhbnkgbm90ZSBhcyBhbiBvYmplY3QsIG9yIG51bGwgd2hlbiBhYnNlbnQgKi9cbiAgcHJpdmF0ZSBmcm9udG1hdHRlck9mKGZpbGU6IFRGaWxlKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsIHtcbiAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgIHJldHVybiBjYWNoZT8uZnJvbnRtYXR0ZXIgPz8gbnVsbDtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBQUFQgbmF2aWdhdGlvbiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICAvKiogTW92ZSBvbmUgc3RlcCBiYWNrL2ZvcndhcmQgYWxvbmcgdGhlIGRlY2sgY2hhaW4gKi9cbiAgcHJpdmF0ZSBuYXZpZ2F0ZShkaXJlY3Rpb246IFwicHJldlwiIHwgXCJuZXh0XCIpOiB2b2lkIHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICBpZiAoIWZpbGUpIHJldHVybjtcbiAgICBjb25zdCBkZWNrID0gdGhpcy5jb21wdXRlRGVjayhmaWxlKTtcbiAgICBpZiAoIWRlY2spIHJldHVybjtcbiAgICBjb25zdCB0YXJnZXQgPSBkZWNrLmNoYWluW2RpcmVjdGlvbiA9PT0gXCJwcmV2XCIgPyBkZWNrLmluZGV4IC0gMSA6IGRlY2suaW5kZXggKyAxXTtcbiAgICBpZiAoIXRhcmdldCkgcmV0dXJuO1xuICAgIHZvaWQgdGhpcy5hcHAud29ya3NwYWNlLm9wZW5MaW5rVGV4dCh0YXJnZXQucGF0aCwgZmlsZS5wYXRoKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBNb2RlIC8gZGF0YSBhY2Nlc3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLyoqIE1vZGUgb2YgdGhlIGFjdGl2ZSBNYXJrZG93biB2aWV3OiAncHJldmlldyc9cmVhZGluZyAnc291cmNlJz1lZGl0aW5nICcnPW5vbmUgKi9cbiAgcHJpdmF0ZSBjdXJyZW50TW9kZSgpOiBcInByZXZpZXdcIiB8IFwic291cmNlXCIgfCBcIlwiIHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICByZXR1cm4gdmlldyA/ICh2aWV3LmdldE1vZGUoKSBhcyBcInByZXZpZXdcIiB8IFwic291cmNlXCIpIDogXCJcIjtcbiAgfVxuXG4gIC8qKiBDdXJyZW50IG5vdGUncyBmcm9udG1hdHRlciBhcyBhbiBvYmplY3QsIG9yIG51bGwgd2hlbiBhYnNlbnQgKi9cbiAgcHJpdmF0ZSBmcm9udG1hdHRlcigpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIHJldHVybiBmaWxlID8gdGhpcy5mcm9udG1hdHRlck9mKGZpbGUpIDogbnVsbDtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBCYXIgcmVuZGVyaW5nIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBEZWNpZGUgd2hhdCB0aGUgYmFyIHNob3dzLCB0aGVuIHJlLXJlbmRlciBpdCAqL1xuICByZWZyZXNoKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5iYXIpIHJldHVybjtcblxuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGNvbnN0IG1vZGUgPSB0aGlzLmN1cnJlbnRNb2RlKCk7XG5cbiAgICAvLyBBdXRvLWZ1bGxzY3JlZW46IGVudGVyIG9uIHJlYWRpbmcgdmlldywgcmVzdG9yZSBvbiBsZWF2aW5nIGl0XG4gICAgdGhpcy5zeW5jRnVsbHNjcmVlbihtb2RlID09PSBcInByZXZpZXdcIiAmJiB0aGlzLmF1dG9GdWxsc2NyZWVuKTtcblxuICAgIC8vIE5vdCBhIE1hcmtkb3duIG5vdGUgLyBub3QgaW4gcmVhZGluZyB2aWV3IC8gaGlkZGVuIGJ5IHRoZSB1c2VyIFx1MjE5MiBoaWRlXG4gICAgaWYgKCFmaWxlIHx8IG1vZGUgIT09IFwicHJldmlld1wiIHx8IHRoaXMuYmFySGlkZGVuKSB7XG4gICAgICB0aGlzLmJhci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZm0gPSB0aGlzLmZyb250bWF0dGVyKCk7XG4gICAgY29uc3QgZGVjayA9IHRoaXMuY29tcHV0ZURlY2soZmlsZSk7XG4gICAgY2xlYXJDaGlsZHJlbih0aGlzLmJhcik7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTGVmdDogcHJldmlvdXMgLyBuZXh0IGJ1dHRvbnMgKG9ubHkgaW5zaWRlIGEgZGVjaykgXHUyNTAwXHUyNTAwXG4gICAgaWYgKHRoaXMuc2V0dGluZ3Muc2hvd05hdkJ1dHRvbnMgJiYgZGVjaykge1xuICAgICAgY29uc3QgaGFzUHJldiA9IGRlY2suaW5kZXggPiAwO1xuICAgICAgY29uc3QgaGFzTmV4dCA9IGRlY2suaW5kZXggPCBkZWNrLmNoYWluLmxlbmd0aCAtIDE7XG4gICAgICBpZiAoaGFzUHJldiB8fCBoYXNOZXh0KSB7XG4gICAgICAgIGNvbnN0IG5hdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIG5hdi5jbGFzc05hbWUgPSBcInJ2LXByb3BzLW5hdlwiO1xuICAgICAgICBpZiAoaGFzUHJldikgbmF2LmFwcGVuZENoaWxkKHRoaXMubmF2QnV0dG9uKFwiXHUyNUMwXCIsIFwiUHJldmlvdXMgcGFnZVwiLCAoKSA9PiB0aGlzLm5hdmlnYXRlKFwicHJldlwiKSkpO1xuICAgICAgICBpZiAoaGFzTmV4dCkgbmF2LmFwcGVuZENoaWxkKHRoaXMubmF2QnV0dG9uKFwiXHUyNUI2XCIsIFwiTmV4dCBwYWdlXCIsICgpID0+IHRoaXMubmF2aWdhdGUoXCJuZXh0XCIpKSk7XG4gICAgICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKG5hdik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE1pZGRsZTogY2hpcHMgZm9yIHRoZSByZW1haW5pbmcgcHJvcGVydGllcyBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCB2aXNpYmxlID0gZm1cbiAgICAgID8gT2JqZWN0LmVudHJpZXMoZm0pLmZpbHRlcigoW2tleV0pID0+IGtleSAhPT0gREVDS19LRVkgJiYga2V5ICE9PSBcInBvc2l0aW9uXCIpXG4gICAgICA6IFtdO1xuXG4gICAgaWYgKHZpc2libGUubGVuZ3RoID09PSAwKSB7XG4gICAgICAvLyBObyBwcm9wZXJ0aWVzIFx1MjE5MiBwbGFjZWhvbGRlciB0ZXh0XG4gICAgICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICBzcGFuLmNsYXNzTmFtZSA9IFwicnYtcHJvcHMtZW1wdHlcIjtcbiAgICAgIHNwYW4udGV4dENvbnRlbnQgPSBcIk5vIHByb3BlcnRpZXNcIjtcbiAgICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiB2aXNpYmxlKSB7XG4gICAgICAgIGNvbnN0IHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgc3Bhbi5jbGFzc05hbWUgPSBcInJ2LXByb3BzLWl0ZW1cIjtcbiAgICAgICAgY29uc3QgayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHJvbmdcIik7XG4gICAgICAgIGsudGV4dENvbnRlbnQgPSBrZXk7XG4gICAgICAgIHNwYW4uYXBwZW5kQ2hpbGQoayk7XG4gICAgICAgIHNwYW4uYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCI6IFwiICsgZm9ybWF0VmFsdWUodmFsdWUpKSk7XG4gICAgICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBCb3R0b20tcmlnaHQ6IGF1dG8tY29tcHV0ZWQgcGFnZSBudW1iZXIgXHUyNTAwXHUyNTAwXG4gICAgaWYgKHRoaXMuc2V0dGluZ3Muc2hvd1BhZ2VOdW1iZXIgJiYgZGVjaykge1xuICAgICAgY29uc3QgcGFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgcGFnZS5jbGFzc05hbWUgPSBcInJ2LXByb3BzLXBhZ2VcIjtcbiAgICAgIC8vIGNoYWluWzBdIGlzIHRoZSBvdmVydmlldyBub3RlOyBzbGlkZXMgc3RhcnQgYXQgaW5kZXggMSBcdTIxOTIgXCJQYWdlIDFcIlxuICAgICAgcGFnZS50ZXh0Q29udGVudCA9IGRlY2suaW5kZXggPT09IDAgPyBcIk92ZXJ2aWV3XCIgOiBgUGFnZSAke2RlY2suaW5kZXh9YDtcbiAgICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKHBhZ2UpO1xuICAgIH1cblxuICAgIHRoaXMuYmFyLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICB9XG5cbiAgLyoqIEJ1aWxkIGEgXHUyNUMwIC8gXHUyNUI2IG5hdmlnYXRpb24gYnV0dG9uICovXG4gIHByaXZhdGUgbmF2QnV0dG9uKGxhYmVsOiBzdHJpbmcsIHRpcDogc3RyaW5nLCBvbkNsaWNrOiAoKSA9PiB2b2lkKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgYnRuLmNsYXNzTmFtZSA9IFwicnYtcHJvcHMtbmF2LWJ0blwiO1xuICAgIGJ0bi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICAgIGJ0bi50aXRsZSA9IHRpcDtcbiAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uQ2xpY2spO1xuICAgIHJldHVybiBidG47XG4gIH1cblxuICAvKiogU3luYyB0aGUgZnVsbHNjcmVlbiBzdGF0ZTogYWRkIHRoZSBjbGFzcyArIHJlcXVlc3QgT1MgZnVsbHNjcmVlbiwgb3IgcmVzdG9yZSAqL1xuICBwcml2YXRlIHN5bmNGdWxsc2NyZWVuKGFjdGl2ZTogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICh0aGlzLmZ1bGxzY3JlZW4gPT09IGFjdGl2ZSkgcmV0dXJuOyAvLyBub3RoaW5nIHRvIGRvXG4gICAgdGhpcy5mdWxsc2NyZWVuID0gYWN0aXZlO1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnRvZ2dsZShcInJ2LXByb3BzLWZ1bGxzY3JlZW5cIiwgYWN0aXZlKTtcblxuICAgIC8vIFJlcXVlc3QgT1MtbGV2ZWwgZnVsbHNjcmVlbiB3aGVuIGVudGVyaW5nIChPYnNpZGlhbiBydW5zIG9uIEVsZWN0cm9uIGFuZFxuICAgIC8vIHN1cHBvcnRzIHRoZSBGdWxsc2NyZWVuIEFQSSk7IGZhaWx1cmVzIChlLmcuIGluIGEgcGxhaW4gYnJvd3NlcikgYXJlXG4gICAgLy8gaWdub3JlZCBzaWxlbnRseSBcdTIwMTQgdGhlIFwiaGlkZSBzaWRlYmFyc1wiIGVmZmVjdCBzdGlsbCBhcHBsaWVzLlxuICAgIGlmIChhY3RpdmUpIHtcbiAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbj8uKCkuY2F0Y2goKCkgPT4ge30pO1xuICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQpIHtcbiAgICAgIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuPy4oKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgfVxuICB9XG59XG5cbi8vIFx1MjUwMFx1MjUwMCBTZXR0aW5ncyB0YWIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmNsYXNzIFJlYWRQcm9wc0JhclNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBwbHVnaW46IFJlYWRQcm9wc0JhclBsdWdpbikge1xuICAgIHN1cGVyKHBsdWdpbi5hcHAsIHBsdWdpbik7XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJQcm9wZXJ0aWVzIEJhciBcdTAwQjcgU2V0dGluZ3NcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJTaG93IFByZXZpb3VzL05leHQgYnV0dG9uc1wiKVxuICAgICAgLnNldERlc2MoXCJTaG93IFx1MjVDMCBcdTI1QjYgYnV0dG9ucyBvbiB0aGUgbGVmdCBvZiB0aGUgYmFyIHdoZW4gdGhlIG5vdGUgYmVsb25ncyB0byBhIGRlY2sgKGhhcyBhIGBkZWNrYCBwcm9wZXJ0eSlcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dOYXZCdXR0b25zKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93TmF2QnV0dG9ucyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMucGx1Z2luLnJlZnJlc2goKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBwYWdlIG51bWJlclwiKVxuICAgICAgLnNldERlc2MoXCJBdXRvLWNvbXB1dGVkIGZyb20gdGhlIGRlY2sgY2hhaW4gKG92ZXJ2aWV3IHBhZ2Ugc2hvd3MgXHUyMDFDT3ZlcnZpZXdcdTIwMUQpOyBzaG93biBhdCB0aGUgYm90dG9tLXJpZ2h0XCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93UGFnZU51bWJlcikub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1BhZ2VOdW1iZXIgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk5hdmlnYXRpb24gaG90a2V5c1wiKVxuICAgICAgLnNldERlc2MoXCJEZWZhdWx0OiBQcmV2aW91cyBQYWdlIE1vZCtTaGlmdCtcdTIxOTAsIE5leHQgUGFnZSBNb2QrU2hpZnQrXHUyMTkyLiBSZWJpbmQgdW5kZXIgU2V0dGluZ3MgXHUyMTkyIEhvdGtleXMuXCIpXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiT3BlbiBIb3RrZXlzIFNldHRpbmdzXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIC8vIE9wZW4gT2JzaWRpYW4ncyBob3RrZXlzIHNldHRpbmdzIHBhZ2UgKGludGVybmFsIEFQSTsgaWdub3JlIGZhaWx1cmVzKVxuICAgICAgICAgICh0aGlzLmFwcCBhcyB1bmtub3duIGFzIHsgc2V0dGluZz86IHsgb3BlblRhYkJ5SWQ/OiAoaWQ6IHN0cmluZykgPT4gdm9pZCB9IH0pXG4gICAgICAgICAgICAuc2V0dGluZz8ub3BlblRhYkJ5SWQ/LihcImhvdGtleXNcIik7XG4gICAgICAgIH0pXG4gICAgICApO1xuICB9XG59XG5cbi8vIFx1MjUwMFx1MjUwMCBIZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4vKipcbiAqIEV4dHJhY3QgdXAgdG8gTUFYX0RFQ0tfTElOS1Mgbm90ZSBuYW1lcyBmcm9tIGEgYGRlY2tgIHByb3BlcnR5IHZhbHVlLlxuICogQWNjZXB0cyBhIHNpbmdsZSBzdHJpbmcgb3IgYSBZQU1MIGxpc3Qgb2Ygc3RyaW5nczsgdW5xdW90ZWQgW1t4XV0gdmFsdWVzIGFyZVxuICogcGFyc2VkIGJ5IFlBTUwgYXMgbmVzdGVkIGFycmF5cyBhbmQgZmxhdHRlbmVkIGhlcmUuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RMaW5rcyh2YWx1ZTogdW5rbm93bik6IHN0cmluZ1tdIHtcbiAgY29uc3QgZmxhdDogdW5rbm93bltdID0gW107XG4gIGNvbnN0IGNvbGxlY3QgPSAodjogdW5rbm93bik6IHZvaWQgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHYpKSB7XG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdikgY29sbGVjdChpdGVtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmxhdC5wdXNoKHYpO1xuICAgIH1cbiAgfTtcbiAgY29sbGVjdCh2YWx1ZSk7XG5cbiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGNvbnN0IGl0ZW0gb2YgZmxhdCkge1xuICAgIGNvbnN0IG5hbWUgPSBleHRyYWN0TGlua1RleHQoaXRlbSk7XG4gICAgaWYgKG5hbWUpIG91dC5wdXNoKG5hbWUpO1xuICAgIGlmIChvdXQubGVuZ3RoID49IE1BWF9ERUNLX0xJTktTKSBicmVhaztcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIHRhcmdldCBub3RlIG5hbWUgZnJvbSBhIG1hcmtkb3duIGxpbmsgc3RyaW5nLlxuICogSGFuZGxlcyBzZXZlcmFsIHNoYXBlczpcbiAqICAgXCJbW3NsaWRlLTJdXVwiICAgICAgICBcdTIxOTIgc2xpZGUtMlxuICogICBcIltbc2xpZGUtMnxhbGlhc11dXCIgIFx1MjE5MiBzbGlkZS0yXG4gKiAgIFwiW1tzbGlkZS0yI3NlY3Rpb25dXVwiXHUyMTkyIHNsaWRlLTJcbiAqICAgc2xpZGUtMiAgICAgICAgICAgICAgXHUyMTkyIHNsaWRlLTIgKGJhcmUgZmlsZW5hbWUpXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RMaW5rVGV4dCh2YWx1ZTogdW5rbm93bik6IHN0cmluZyB8IG51bGwge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgdHJpbW1lZCA9IHZhbHVlLnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHRyaW1tZWRcbiAgICAucmVwbGFjZSgvXlxcW1xcWy8sIFwiXCIpXG4gICAgLnJlcGxhY2UoL1xcXVxcXSQvLCBcIlwiKVxuICAgIC5zcGxpdChcInxcIilbMF1cbiAgICAuc3BsaXQoXCIjXCIpWzBdXG4gICAgLnRyaW0oKTtcbn1cblxuLyoqIFJlbmRlciBhIHByb3BlcnR5IHZhbHVlIGFzIHJlYWRhYmxlIHRleHQ6IGFycmF5cy9vYmplY3RzIFx1MjE5MiBKU09OLCBlbHNlIFN0cmluZyAqL1xuZnVuY3Rpb24gZm9ybWF0VmFsdWUodmFsdWU6IHVua25vd24pOiBzdHJpbmcge1xuICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFwiXHUyMDE0XCI7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBTdHJpbmcodmFsdWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbn1cblxuLyoqIFJlbW92ZSBhbGwgY2hpbGRyZW4gb2YgYW4gZWxlbWVudCAqL1xuZnVuY3Rpb24gY2xlYXJDaGlsZHJlbihlbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgd2hpbGUgKGVsLmZpcnN0Q2hpbGQpIGVsLnJlbW92ZUNoaWxkKGVsLmZpcnN0Q2hpbGQpO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBNENBLHNCQUF1RTtBQVV2RSxJQUFNLG1CQUF5QztBQUFBLEVBQzdDLGdCQUFnQjtBQUFBLEVBQ2hCLGdCQUFnQjtBQUNsQjtBQUdBLElBQU0sV0FBVztBQUVqQixJQUFNLGlCQUFpQjtBQVV2QixJQUFxQixxQkFBckIsY0FBZ0QsdUJBQU87QUFBQSxFQUF2RDtBQUFBO0FBRUU7QUFBQSxTQUFRLE1BQTBCO0FBRWxDO0FBQUEsU0FBUSxZQUFZO0FBRXBCO0FBQUEsU0FBUSxhQUFhO0FBRXJCO0FBQUEsU0FBUSxpQkFBaUI7QUFFekI7QUFBQSxTQUFRLFVBQVU7QUFFbEI7QUFBQSxvQkFBaUMsRUFBRSxHQUFHLGlCQUFpQjtBQUFBO0FBQUEsRUFFdkQsTUFBTSxTQUF3QjtBQUM1QixVQUFNLEtBQUssYUFBYTtBQUN4QixTQUFLLGNBQWMsSUFBSSx1QkFBdUIsSUFBSSxDQUFDO0FBR25ELFNBQUssY0FBYyxLQUFLLElBQUksVUFBVSxHQUFHLGFBQWEsTUFB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
