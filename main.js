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

// src/deck.ts
var MAX_DECK_LINKS = 2;
function computeDeck(currentPath, getLinks) {
  const currentLinks = getLinks(currentPath);
  if (currentLinks.length === 0) return null;
  let overview;
  let firstPage;
  if (currentLinks.length >= 2) {
    overview = currentLinks[0];
    firstPage = getLinks(overview)[0];
  } else {
    const only = currentLinks[0];
    const onlyLinks = getLinks(only);
    if (onlyLinks[0] === currentPath) {
      overview = currentPath;
      firstPage = only;
    } else {
      overview = only;
      firstPage = onlyLinks[0];
    }
  }
  if (!overview || !firstPage) return null;
  const chain = [];
  const visited = /* @__PURE__ */ new Set();
  const push = (p) => {
    if (p && !visited.has(p)) {
      visited.add(p);
      chain.push(p);
    }
  };
  push(overview);
  push(firstPage);
  let cur = firstPage;
  while (cur) {
    const next = getLinks(cur)[1];
    if (!next || visited.has(next)) break;
    push(next);
    cur = next;
  }
  const index = chain.indexOf(currentPath);
  if (index === -1) return null;
  return { chain, index };
}
function extractLinks(value, max = MAX_DECK_LINKS) {
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
    if (out.length >= max) break;
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

// main.ts
var DEFAULT_SETTINGS = {
  showNavButtons: true,
  showPageNumber: true
};
var DECK_KEY = "deck";
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
  // ── Deck resolution (walk the link chain) ─────────────────────────────
  /** Resolve the current note's position inside its deck (path-based wrapper) */
  computeDeck(file) {
    return computeDeck(file.path, (path) => this.deckLinkPaths(path));
  }
  /** Resolve the `deck` property of a note into real note paths (max two) */
  deckLinkPaths(path) {
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof import_obsidian.TFile)) return [];
    const fm = this.frontmatterOf(f);
    const names = fm ? extractLinks(fm[DECK_KEY]) : [];
    return names.map((name) => this.app.metadataCache.getFirstLinkpathDest(name, path)).filter((x) => !!x).map((x) => x.path);
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
    void this.app.workspace.openLinkText(target, file.path);
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
      const nav = document.createElement("div");
      nav.className = "rv-props-nav";
      nav.appendChild(this.navButton("\u25C0", "Previous page", () => this.navigate("prev"), !hasPrev));
      nav.appendChild(this.navButton("\u25B6", "Next page", () => this.navigate("next"), !hasNext));
      this.bar.appendChild(nav);
    }
    const visible = fm ? Object.entries(fm).filter(([key]) => key !== DECK_KEY && key !== "position") : [];
    for (const [key, value] of visible) {
      const span = document.createElement("span");
      span.className = "rv-props-item";
      const k = document.createElement("strong");
      k.textContent = key;
      span.appendChild(k);
      span.appendChild(document.createTextNode(": " + formatValue(value)));
      this.bar.appendChild(span);
    }
    if (this.settings.showPageNumber && deck) {
      const page = document.createElement("span");
      page.className = "rv-props-page";
      page.textContent = deck.index === 0 ? "Overview" : `Page ${deck.index}`;
      this.bar.appendChild(page);
    }
    this.bar.style.display = this.bar.childElementCount === 0 ? "none" : "";
  }
  /** Build a ◀ / ▶ navigation button; `disabled` renders it light gray/inactive */
  navButton(label, tip, onClick, disabled = false) {
    const btn = document.createElement("button");
    btn.className = "rv-props-nav-btn";
    btn.textContent = label;
    btn.title = tip;
    btn.disabled = disabled;
    if (!disabled) btn.addEventListener("click", onClick);
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
function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvZGVjay50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiByZWFkLXByb3BzLWJhciBcdTIwMTQgUmVhZGluZy12aWV3IHByb3BlcnRpZXMgYmFyIHdpdGggUFBULXN0eWxlIGRlY2sgbmF2aWdhdGlvblxuICpcbiAqIEZlYXR1cmVzOlxuICogICAxLiBIaWRlcyBPYnNpZGlhbidzIG5hdGl2ZSBzdGF0dXMgYmFyIGFuZCByZW5kZXJzIGEgXCJwcm9wZXJ0aWVzIGJhclwiIGF0IHRoZVxuICogICAgICBib3R0b20gb2YgdGhlIHdpbmRvdy5cbiAqICAgMi4gSW4gcmVhZGluZyB2aWV3LCBzaG93cyB0aGUgY3VycmVudCBub3RlJ3MgcHJvcGVydGllcyAoWUFNTCBmcm9udG1hdHRlcilcbiAqICAgICAgYXMgY2hpcHMgaW4gdGhhdCBiYXIuXG4gKiAgIDMuIFJlYWRpbmcgdmlldyBhdXRvLWVudGVycyBhIGZ1bGxzY3JlZW4tbGlrZSBtb2RlOiB0aGUgcmliYm9uLCBzaWRlYmFycyxcbiAqICAgICAgdGFiIGJhciBhbmQgdGhlIHBhbmUgaGVhZGVyIGJhciBhcmUgaGlkZGVuOyBsZWF2aW5nIHJlYWRpbmcgdmlld1xuICogICAgICByZXN0b3JlcyB0aGVtIGF1dG9tYXRpY2FsbHkuIFByZXNzaW5nIEVzYyB0byBsZWF2ZSB0aGUgT1MgZnVsbHNjcmVlblxuICogICAgICBhbHNvIGV4aXRzIHJlYWRpbmcgdmlldy5cbiAqICAgNC4gSGlkZXMgdGhlIGluLW5vdGUgcHJvcGVydGllcyBwYW5lbCBpbiByZWFkaW5nIHZpZXcgKGtlcHQgaW4gZWRpdCB2aWV3KS5cbiAqICAgNS4gUFBULXN0eWxlIGRlY2sgbmF2aWdhdGlvbiBkcml2ZW4gYnkgT05FIHJlc2VydmVkIGZyb250bWF0dGVyIGtleSwgYGRlY2tgLFxuICogICAgICBob2xkaW5nIHVwIHRvIHR3byBtYXJrZG93biBsaW5rczpcbiAqICAgICAgICAtIG92ZXJ2aWV3IG5vdGUgOiBkZWNrOiBbXCJbW2ZpcnN0LXNsaWRlXV1cIl0gICAgICAgICAgICAob25lIGxpbmsgPSB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdCBwYWdlIG9mIHRoZSBkZWNrOyB0aGUgbm90ZSBpcyB0aGUgb3ZlcnZpZXcpXG4gKiAgICAgICAgLSBzbGlkZSBub3RlICAgIDogZGVjazogW1wiW1tvdmVydmlld11dXCIsIFwiW1tuZXh0LXNsaWRlXV1cIl1cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAoZmlyc3QgbGluayA9IHRoZSBvdmVydmlldyBwYWdlLCBzZWNvbmQgbGluayA9IHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIG5leHQgc2xpZGU7IG9taXQgdGhlIHNlY29uZCBsaW5rIG9uIHRoZSBsYXN0IHNsaWRlKVxuICogICAgICBUaGUgcGFnZSBudW1iZXIgaXMgY29tcHV0ZWQgYXV0b21hdGljYWxseSBieSBzY2FubmluZyB0aGUgdmF1bHQgYW5kXG4gKiAgICAgIHdhbGtpbmcgdGhlIGNoYWluIG9mIGxpbmtzLCBzbyBubyBgcGFnZS1udW1iZXJgIHByb3BlcnR5IGlzIG5lZWRlZC5cbiAqICAgICAgXHUyNUMwIFx1MjVCNiBidXR0b25zIGFwcGVhciBvbiB0aGUgbGVmdCBvZiB0aGUgYmFyLCBhbmQgXCJQcmV2aW91cyBQYWdlXCIgLyBcIk5leHRcbiAqICAgICAgUGFnZVwiIGNvbW1hbmRzIGFyZSByZWdpc3RlcmVkIChkZWZhdWx0IGhvdGtleXMgTW9kK1NoaWZ0K1x1MjE5MCAvIE1vZCtTaGlmdCtcdTIxOTIsXG4gKiAgICAgIHJlYmluZGFibGUgdW5kZXIgU2V0dGluZ3MgXHUyMTkyIEhvdGtleXMpLlxuICogICA2LiBBIHNldHRpbmdzIHRhYiB0b2dnbGVzIHRoZSBcdTI1QzAgXHUyNUI2IGJ1dHRvbnMgYW5kIHRoZSBwYWdlIG51bWJlci5cbiAqXG4gKiBUaGUgZGVjayB1c3VhbGx5IHN0YXJ0cyBmcm9tIGFuIG92ZXJ2aWV3IG5vdGUgdGhhdCBlbWJlZHMgYW4gT2JzaWRpYW4gQmFzZVxuICogdmlldyAoY29yZSBcIkJhc2VzXCIgcGx1Z2luKSBmaWx0ZXJpbmcgbm90ZXMgdGhhdCBsaW5rIHRvIHRoZSBvdmVydmlldyBwYWdlOlxuICpcbiAqICAgYGBgYmFzZVxuICogICBmaWx0ZXJzOlxuICogICAgIGFuZDpcbiAqICAgICAgIC0gZmlsZS5oYXNMaW5rKFwib3ZlcnZpZXdcIilcbiAqICAgdmlld3M6XG4gKiAgICAgLSB0eXBlOiB0YWJsZVxuICogICAgICAgbmFtZTogRGVja1xuICogICBgYGBcbiAqXG4gKiBXaHkgcmVhZCBwcm9wZXJ0aWVzIHZpYSBtZXRhZGF0YUNhY2hlIGluc3RlYWQgb2YgcGFyc2luZyBZQU1MIG1hbnVhbGx5P1xuICogICBPYnNpZGlhbiBtYWludGFpbnMgYSBjYWNoZSBwZXIgbm90ZTsgbWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSlcbiAqICAgLmZyb250bWF0dGVyIHJldHVybnMgdGhlIHBhcnNlZCBwcm9wZXJ0aWVzLCB1cGRhdGVkIGF1dG9tYXRpY2FsbHkgb24gc2F2ZS5cbiAqL1xuXG5pbXBvcnQgeyBQbHVnaW4sIE1hcmtkb3duVmlldywgVEZpbGUsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IGNvbXB1dGVEZWNrLCBleHRyYWN0TGlua3MsIGZvcm1hdFZhbHVlLCB0eXBlIERlY2tJbmZvIH0gZnJvbSBcIi4vc3JjL2RlY2tcIjtcblxuLyoqIFBsdWdpbiBzZXR0aW5ncyAqL1xuaW50ZXJmYWNlIFJlYWRQcm9wc0JhclNldHRpbmdzIHtcbiAgLyoqIFNob3cgXHUyNUMwIFx1MjVCNiBwcmV2aW91cy9uZXh0IGJ1dHRvbnMgb24gdGhlIGxlZnQgb2YgdGhlIGJhciAqL1xuICBzaG93TmF2QnV0dG9uczogYm9vbGVhbjtcbiAgLyoqIFNob3cgdGhlIGF1dG8tY29tcHV0ZWQgcGFnZSBudW1iZXIgYXQgdGhlIGJvdHRvbS1yaWdodCBvZiB0aGUgYmFyICovXG4gIHNob3dQYWdlTnVtYmVyOiBib29sZWFuO1xufVxuXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBSZWFkUHJvcHNCYXJTZXR0aW5ncyA9IHtcbiAgc2hvd05hdkJ1dHRvbnM6IHRydWUsXG4gIHNob3dQYWdlTnVtYmVyOiB0cnVlLFxufTtcblxuLyoqIFJlc2VydmVkIGZyb250bWF0dGVyIGtleSBkcml2aW5nIGRlY2sgbmF2aWdhdGlvbiAobmV2ZXIgcmVuZGVyZWQgYXMgYSBjaGlwKSAqL1xuY29uc3QgREVDS19LRVkgPSBcImRlY2tcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVhZFByb3BzQmFyUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgLyoqIFRoZSBwcm9wZXJ0aWVzIGJhciBET00gZWxlbWVudCAqL1xuICBwcml2YXRlIGJhcjogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgLyoqIFdoZXRoZXIgdGhlIHVzZXIgbWFudWFsbHkgaGlkIHRoZSBiYXIgKHRvZ2dsZSBjb21tYW5kKSAqL1xuICBwcml2YXRlIGJhckhpZGRlbiA9IGZhbHNlO1xuICAvKiogV2hldGhlciBmdWxsc2NyZWVuIHJlYWRpbmcgbW9kZSBpcyBjdXJyZW50bHkgYWN0aXZlICovXG4gIHByaXZhdGUgZnVsbHNjcmVlbiA9IGZhbHNlO1xuICAvKiogV2hldGhlciBhdXRvLWZ1bGxzY3JlZW4gaW4gcmVhZGluZyB2aWV3IGlzIGVuYWJsZWQgKGRlZmF1bHQgb24pICovXG4gIHByaXZhdGUgYXV0b0Z1bGxzY3JlZW4gPSB0cnVlO1xuICAvKiogTGFzdCByZWZyZXNoIGtleSAoXCJwYXRofG1vZGVcIikgdG8gYXZvaWQgcG9pbnRsZXNzIHJlLXJlbmRlcnMgKi9cbiAgcHJpdmF0ZSBsYXN0S2V5ID0gXCJcIjtcbiAgLyoqIFBsdWdpbiBzZXR0aW5ncyAqL1xuICBzZXR0aW5nczogUmVhZFByb3BzQmFyU2V0dGluZ3MgPSB7IC4uLkRFRkFVTFRfU0VUVElOR1MgfTtcblxuICBhc3luYyBvbmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IFJlYWRQcm9wc0JhclNldHRpbmdUYWIodGhpcykpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDEuIFJlZnJlc2ggb24gXCJjdXJyZW50IG5vdGUgLyB2aWV3IGNoYW5nZWRcIiBldmVudHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImZpbGUtb3BlblwiLCAoKSA9PiB0aGlzLnJlZnJlc2goKSkpO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJhY3RpdmUtbGVhZi1jaGFuZ2VcIiwgKCkgPT4gdGhpcy5yZWZyZXNoKCkpKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKFwibGF5b3V0LWNoYW5nZVwiLCAoKSA9PiB0aGlzLnJlZnJlc2goKSkpO1xuICAgIC8vIFJlZnJlc2ggd2hlbiB0aGUgbm90ZSBjb250ZW50IChpbmNsdWRpbmcgZnJvbnRtYXR0ZXIpIGNoYW5nZXMgLyBzYXZlc1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUub24oXCJjaGFuZ2VkXCIsIChmaWxlOiBURmlsZSkgPT4ge1xuICAgICAgICBpZiAoZmlsZSA9PT0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKSkgdGhpcy5yZWZyZXNoKCk7XG4gICAgICB9KSxcbiAgICApO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDIuIEZhbGxiYWNrIHRpbWVyOiBlZGl0XHUyMTk0cmVhZGluZyB0b2dnbGVzIG1heSBmaXJlIG5vIHN0YW5kYXJkIGV2ZW50IFx1MjUwMFx1MjUwMFxuICAgIHRoaXMucmVnaXN0ZXJJbnRlcnZhbChcbiAgICAgIHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgICAgICBjb25zdCBrZXkgPSBmaWxlID8gYCR7ZmlsZS5wYXRofXwke3RoaXMuY3VycmVudE1vZGUoKX1gIDogXCJcIjtcbiAgICAgICAgaWYgKGtleSAhPT0gdGhpcy5sYXN0S2V5KSB7XG4gICAgICAgICAgdGhpcy5sYXN0S2V5ID0ga2V5O1xuICAgICAgICAgIHRoaXMucmVmcmVzaCgpO1xuICAgICAgICB9XG4gICAgICB9LCA1MDApLFxuICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMy4gQ29tbWFuZHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgLy8gM2EuIE1hbnVhbGx5IHNob3cgLyBoaWRlIHRoZSBwcm9wZXJ0aWVzIGJhclxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJ0b2dnbGUtcHJvcHMtYmFyXCIsXG4gICAgICBuYW1lOiBcIlRvZ2dsZSBQcm9wZXJ0aWVzIEJhclwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgdGhpcy5iYXJIaWRkZW4gPSAhdGhpcy5iYXJIaWRkZW47XG4gICAgICAgIHRoaXMucmVmcmVzaCgpO1xuICAgICAgfSxcbiAgICB9KTtcbiAgICAvLyAzYi4gUGF1c2UgLyByZXN1bWUgYXV0by1mdWxsc2NyZWVuIGluIHJlYWRpbmcgdmlld1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJ0b2dnbGUtYXV0by1mdWxsc2NyZWVuXCIsXG4gICAgICBuYW1lOiBcIlBhdXNlL1Jlc3VtZSBBdXRvIEZ1bGxzY3JlZW5cIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XG4gICAgICAgIHRoaXMuYXV0b0Z1bGxzY3JlZW4gPSAhdGhpcy5hdXRvRnVsbHNjcmVlbjtcbiAgICAgICAgLy8gV2hlbiBwYXVzZWQsIHJlc3RvcmUgdGhlIGxheW91dCBpbW1lZGlhdGVseTsgd2hlbiByZXN1bWVkLCByZS1zeW5jXG4gICAgICAgIGlmICghdGhpcy5hdXRvRnVsbHNjcmVlbikgdGhpcy5zeW5jRnVsbHNjcmVlbihmYWxzZSk7XG4gICAgICAgIGVsc2UgdGhpcy5yZWZyZXNoKCk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIC8vIDNjLiBQcmV2aW91cyAvIG5leHQgcGFnZSAoZGVjayBuYXZpZ2F0aW9uLCByZWJpbmRhYmxlIGluIFNldHRpbmdzIFx1MjE5MiBIb3RrZXlzKVxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJuYXYtcHJldlwiLFxuICAgICAgbmFtZTogXCJQcmV2aW91cyBQYWdlXCIsXG4gICAgICBob3RrZXlzOiBbeyBtb2RpZmllcnM6IFtcIk1vZFwiLCBcIlNoaWZ0XCJdLCBrZXk6IFwiQXJyb3dMZWZ0XCIgfV0sXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5uYXZpZ2F0ZShcInByZXZcIiksXG4gICAgfSk7XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5hdi1uZXh0XCIsXG4gICAgICBuYW1lOiBcIk5leHQgUGFnZVwiLFxuICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIiwgXCJTaGlmdFwiXSwga2V5OiBcIkFycm93UmlnaHRcIiB9XSxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLm5hdmlnYXRlKFwibmV4dFwiKSxcbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCA0LiBFc2MgZXhpdHMgT1MgZnVsbHNjcmVlbiBcdTIxOTIgbGVhdmUgcmVhZGluZyB2aWV3IGFzIHdlbGwgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgLy8gS2VlcHMgaW50ZXJuYWwgc3RhdGUgaW4gc3luYyB3aGVuIHRoZSB1c2VyIHByZXNzZXMgRXNjOyBhbHNvIHN3aXRjaGVzXG4gICAgLy8gdGhlIGFjdGl2ZSBNYXJrZG93biB2aWV3IGJhY2sgdG8gZWRpdCBtb2RlLiBPdXIgb3duIGV4aXRGdWxsc2NyZWVuKClcbiAgICAvLyBjYWxscyBzZXQgdGhpcy5mdWxsc2NyZWVuID0gZmFsc2UgZmlyc3QsIHNvIHRoZXkgbmV2ZXIgdHJpZ2dlciB0aGlzLlxuICAgIHRoaXMucmVnaXN0ZXJEb21FdmVudChkb2N1bWVudCwgXCJmdWxsc2NyZWVuY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGlmICghZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQgJiYgdGhpcy5mdWxsc2NyZWVuKSB7XG4gICAgICAgIHRoaXMuZnVsbHNjcmVlbiA9IGZhbHNlO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoXCJydi1wcm9wcy1mdWxsc2NyZWVuXCIpO1xuICAgICAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICAgICAgaWYgKHZpZXcgJiYgdmlldy5nZXRNb2RlKCkgPT09IFwicHJldmlld1wiKSB7XG4gICAgICAgICAgLy8gc2V0TW9kZSBpcyBub3QgaW4gdGhlIHB1YmxpYyB0eXBpbmdzIGJ1dCBleGlzdHMgYXQgcnVudGltZVxuICAgICAgICAgICh2aWV3IGFzIHVua25vd24gYXMgeyBzZXRNb2RlOiAobW9kZTogXCJzb3VyY2VcIiB8IFwicHJldmlld1wiKSA9PiB2b2lkIH0pLnNldE1vZGUoXCJzb3VyY2VcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCA1LiBDcmVhdGUgdGhlIGJhciBhbmQgZG8gdGhlIGZpcnN0IHJlbmRlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICB0aGlzLmJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdGhpcy5iYXIuY2xhc3NOYW1lID0gXCJydi1wcm9wcy1iYXJcIjtcbiAgICB0aGlzLmJhci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7IC8vIGhpZGRlbiB1bnRpbCByZWZyZXNoKCkgZGVjaWRlcyBvdGhlcndpc2VcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuYmFyKTtcbiAgICB0aGlzLnJlZnJlc2goKTtcbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuYmFyPy5yZW1vdmUoKTtcbiAgICB0aGlzLmJhciA9IG51bGw7XG4gICAgLy8gTGVhdmUgT1MgZnVsbHNjcmVlbiBhbmQgZHJvcCB0aGUgZnVsbHNjcmVlbiBjbGFzcyBzbyBubyBVSSByZXNpZHVlIHJlbWFpbnNcbiAgICBpZiAoZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQpIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuPy4oKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKFwicnYtcHJvcHMtZnVsbHNjcmVlblwiKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTZXR0aW5ncyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBEZWNrIHJlc29sdXRpb24gKHdhbGsgdGhlIGxpbmsgY2hhaW4pIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBSZXNvbHZlIHRoZSBjdXJyZW50IG5vdGUncyBwb3NpdGlvbiBpbnNpZGUgaXRzIGRlY2sgKHBhdGgtYmFzZWQgd3JhcHBlcikgKi9cbiAgcHJpdmF0ZSBjb21wdXRlRGVjayhmaWxlOiBURmlsZSk6IERlY2tJbmZvIHwgbnVsbCB7XG4gICAgcmV0dXJuIGNvbXB1dGVEZWNrKGZpbGUucGF0aCwgKHBhdGgpID0+IHRoaXMuZGVja0xpbmtQYXRocyhwYXRoKSk7XG4gIH1cblxuICAvKiogUmVzb2x2ZSB0aGUgYGRlY2tgIHByb3BlcnR5IG9mIGEgbm90ZSBpbnRvIHJlYWwgbm90ZSBwYXRocyAobWF4IHR3bykgKi9cbiAgcHJpdmF0ZSBkZWNrTGlua1BhdGhzKHBhdGg6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBmID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgIGlmICghKGYgaW5zdGFuY2VvZiBURmlsZSkpIHJldHVybiBbXTtcbiAgICBjb25zdCBmbSA9IHRoaXMuZnJvbnRtYXR0ZXJPZihmKTtcbiAgICBjb25zdCBuYW1lcyA9IGZtID8gZXh0cmFjdExpbmtzKGZtW0RFQ0tfS0VZXSkgOiBbXTtcbiAgICByZXR1cm4gbmFtZXNcbiAgICAgIC5tYXAoKG5hbWUpID0+IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3QobmFtZSwgcGF0aCkpXG4gICAgICAuZmlsdGVyKCh4KTogeCBpcyBURmlsZSA9PiAhIXgpXG4gICAgICAubWFwKCh4KSA9PiB4LnBhdGgpO1xuICB9XG5cbiAgLyoqIEZyb250bWF0dGVyIG9mIGFueSBub3RlIGFzIGFuIG9iamVjdCwgb3IgbnVsbCB3aGVuIGFic2VudCAqL1xuICBwcml2YXRlIGZyb250bWF0dGVyT2YoZmlsZTogVEZpbGUpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG4gICAgcmV0dXJuIGNhY2hlPy5mcm9udG1hdHRlciA/PyBudWxsO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFBQVCBuYXZpZ2F0aW9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBNb3ZlIG9uZSBzdGVwIGJhY2svZm9yd2FyZCBhbG9uZyB0aGUgZGVjayBjaGFpbiAqL1xuICBwcml2YXRlIG5hdmlnYXRlKGRpcmVjdGlvbjogXCJwcmV2XCIgfCBcIm5leHRcIik6IHZvaWQge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGlmICghZmlsZSkgcmV0dXJuO1xuICAgIGNvbnN0IGRlY2sgPSB0aGlzLmNvbXB1dGVEZWNrKGZpbGUpO1xuICAgIGlmICghZGVjaykgcmV0dXJuO1xuICAgIGNvbnN0IHRhcmdldCA9IGRlY2suY2hhaW5bZGlyZWN0aW9uID09PSBcInByZXZcIiA/IGRlY2suaW5kZXggLSAxIDogZGVjay5pbmRleCArIDFdO1xuICAgIGlmICghdGFyZ2V0KSByZXR1cm47XG4gICAgdm9pZCB0aGlzLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KHRhcmdldCwgZmlsZS5wYXRoKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBNb2RlIC8gZGF0YSBhY2Nlc3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLyoqIE1vZGUgb2YgdGhlIGFjdGl2ZSBNYXJrZG93biB2aWV3OiAncHJldmlldyc9cmVhZGluZyAnc291cmNlJz1lZGl0aW5nICcnPW5vbmUgKi9cbiAgcHJpdmF0ZSBjdXJyZW50TW9kZSgpOiBcInByZXZpZXdcIiB8IFwic291cmNlXCIgfCBcIlwiIHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICByZXR1cm4gdmlldyA/ICh2aWV3LmdldE1vZGUoKSBhcyBcInByZXZpZXdcIiB8IFwic291cmNlXCIpIDogXCJcIjtcbiAgfVxuXG4gIC8qKiBDdXJyZW50IG5vdGUncyBmcm9udG1hdHRlciBhcyBhbiBvYmplY3QsIG9yIG51bGwgd2hlbiBhYnNlbnQgKi9cbiAgcHJpdmF0ZSBmcm9udG1hdHRlcigpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIHJldHVybiBmaWxlID8gdGhpcy5mcm9udG1hdHRlck9mKGZpbGUpIDogbnVsbDtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBCYXIgcmVuZGVyaW5nIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBEZWNpZGUgd2hhdCB0aGUgYmFyIHNob3dzLCB0aGVuIHJlLXJlbmRlciBpdCAqL1xuICByZWZyZXNoKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5iYXIpIHJldHVybjtcblxuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGNvbnN0IG1vZGUgPSB0aGlzLmN1cnJlbnRNb2RlKCk7XG5cbiAgICAvLyBBdXRvLWZ1bGxzY3JlZW46IGVudGVyIG9uIHJlYWRpbmcgdmlldywgcmVzdG9yZSBvbiBsZWF2aW5nIGl0XG4gICAgdGhpcy5zeW5jRnVsbHNjcmVlbihtb2RlID09PSBcInByZXZpZXdcIiAmJiB0aGlzLmF1dG9GdWxsc2NyZWVuKTtcblxuICAgIC8vIE5vdCBhIE1hcmtkb3duIG5vdGUgLyBub3QgaW4gcmVhZGluZyB2aWV3IC8gaGlkZGVuIGJ5IHRoZSB1c2VyIFx1MjE5MiBoaWRlXG4gICAgaWYgKCFmaWxlIHx8IG1vZGUgIT09IFwicHJldmlld1wiIHx8IHRoaXMuYmFySGlkZGVuKSB7XG4gICAgICB0aGlzLmJhci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZm0gPSB0aGlzLmZyb250bWF0dGVyKCk7XG4gICAgY29uc3QgZGVjayA9IHRoaXMuY29tcHV0ZURlY2soZmlsZSk7XG4gICAgY2xlYXJDaGlsZHJlbih0aGlzLmJhcik7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTGVmdDogcHJldmlvdXMgLyBuZXh0IGJ1dHRvbnMgKGJvdGggYWx3YXlzIHNob3duIGluc2lkZSBhIGRlY2s7XG4gICAgLy8gICAgICAgIHRoZSBvbmUgdGhhdCBjYW5ub3QgbW92ZSBpcyBkaXNhYmxlZCAvIGxpZ2h0IGdyYXkpIFx1MjUwMFx1MjUwMFxuICAgIGlmICh0aGlzLnNldHRpbmdzLnNob3dOYXZCdXR0b25zICYmIGRlY2spIHtcbiAgICAgIGNvbnN0IGhhc1ByZXYgPSBkZWNrLmluZGV4ID4gMDtcbiAgICAgIGNvbnN0IGhhc05leHQgPSBkZWNrLmluZGV4IDwgZGVjay5jaGFpbi5sZW5ndGggLSAxO1xuICAgICAgY29uc3QgbmF2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIG5hdi5jbGFzc05hbWUgPSBcInJ2LXByb3BzLW5hdlwiO1xuICAgICAgbmF2LmFwcGVuZENoaWxkKHRoaXMubmF2QnV0dG9uKFwiXHUyNUMwXCIsIFwiUHJldmlvdXMgcGFnZVwiLCAoKSA9PiB0aGlzLm5hdmlnYXRlKFwicHJldlwiKSwgIWhhc1ByZXYpKTtcbiAgICAgIG5hdi5hcHBlbmRDaGlsZCh0aGlzLm5hdkJ1dHRvbihcIlx1MjVCNlwiLCBcIk5leHQgcGFnZVwiLCAoKSA9PiB0aGlzLm5hdmlnYXRlKFwibmV4dFwiKSwgIWhhc05leHQpKTtcbiAgICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKG5hdik7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE1pZGRsZTogY2hpcHMgZm9yIHRoZSByZW1haW5pbmcgcHJvcGVydGllcyAobm8gcGxhY2Vob2xkZXIpIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IHZpc2libGUgPSBmbVxuICAgICAgPyBPYmplY3QuZW50cmllcyhmbSkuZmlsdGVyKChba2V5XSkgPT4ga2V5ICE9PSBERUNLX0tFWSAmJiBrZXkgIT09IFwicG9zaXRpb25cIilcbiAgICAgIDogW107XG5cbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiB2aXNpYmxlKSB7XG4gICAgICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICBzcGFuLmNsYXNzTmFtZSA9IFwicnYtcHJvcHMtaXRlbVwiO1xuICAgICAgY29uc3QgayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHJvbmdcIik7XG4gICAgICBrLnRleHRDb250ZW50ID0ga2V5O1xuICAgICAgc3Bhbi5hcHBlbmRDaGlsZChrKTtcbiAgICAgIHNwYW4uYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCI6IFwiICsgZm9ybWF0VmFsdWUodmFsdWUpKSk7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQm90dG9tLXJpZ2h0OiBhdXRvLWNvbXB1dGVkIHBhZ2UgbnVtYmVyIFx1MjUwMFx1MjUwMFxuICAgIGlmICh0aGlzLnNldHRpbmdzLnNob3dQYWdlTnVtYmVyICYmIGRlY2spIHtcbiAgICAgIGNvbnN0IHBhZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgIHBhZ2UuY2xhc3NOYW1lID0gXCJydi1wcm9wcy1wYWdlXCI7XG4gICAgICAvLyBjaGFpblswXSBpcyB0aGUgb3ZlcnZpZXcgbm90ZTsgc2xpZGVzIHN0YXJ0IGF0IGluZGV4IDEgXHUyMTkyIFwiUGFnZSAxXCJcbiAgICAgIHBhZ2UudGV4dENvbnRlbnQgPSBkZWNrLmluZGV4ID09PSAwID8gXCJPdmVydmlld1wiIDogYFBhZ2UgJHtkZWNrLmluZGV4fWA7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChwYWdlKTtcbiAgICB9XG5cbiAgICAvLyBIaWRlIHRoZSBiYXIgZW50aXJlbHkgd2hlbiBpdCBoYXMgbm90aGluZyB0byBkaXNwbGF5IChubyBwcm9wZXJ0aWVzLFxuICAgIC8vIGFuZCBub3QgcGFydCBvZiBhIGRlY2spXG4gICAgdGhpcy5iYXIuc3R5bGUuZGlzcGxheSA9IHRoaXMuYmFyLmNoaWxkRWxlbWVudENvdW50ID09PSAwID8gXCJub25lXCIgOiBcIlwiO1xuICB9XG5cbiAgLyoqIEJ1aWxkIGEgXHUyNUMwIC8gXHUyNUI2IG5hdmlnYXRpb24gYnV0dG9uOyBgZGlzYWJsZWRgIHJlbmRlcnMgaXQgbGlnaHQgZ3JheS9pbmFjdGl2ZSAqL1xuICBwcml2YXRlIG5hdkJ1dHRvbihcbiAgICBsYWJlbDogc3RyaW5nLFxuICAgIHRpcDogc3RyaW5nLFxuICAgIG9uQ2xpY2s6ICgpID0+IHZvaWQsXG4gICAgZGlzYWJsZWQgPSBmYWxzZSxcbiAgKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgYnRuLmNsYXNzTmFtZSA9IFwicnYtcHJvcHMtbmF2LWJ0blwiO1xuICAgIGJ0bi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICAgIGJ0bi50aXRsZSA9IHRpcDtcbiAgICBidG4uZGlzYWJsZWQgPSBkaXNhYmxlZDtcbiAgICBpZiAoIWRpc2FibGVkKSBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uQ2xpY2spO1xuICAgIHJldHVybiBidG47XG4gIH1cblxuICAvKiogU3luYyB0aGUgZnVsbHNjcmVlbiBzdGF0ZTogYWRkIHRoZSBjbGFzcyArIHJlcXVlc3QgT1MgZnVsbHNjcmVlbiwgb3IgcmVzdG9yZSAqL1xuICBwcml2YXRlIHN5bmNGdWxsc2NyZWVuKGFjdGl2ZTogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICh0aGlzLmZ1bGxzY3JlZW4gPT09IGFjdGl2ZSkgcmV0dXJuOyAvLyBub3RoaW5nIHRvIGRvXG4gICAgdGhpcy5mdWxsc2NyZWVuID0gYWN0aXZlO1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnRvZ2dsZShcInJ2LXByb3BzLWZ1bGxzY3JlZW5cIiwgYWN0aXZlKTtcblxuICAgIC8vIFJlcXVlc3QgT1MtbGV2ZWwgZnVsbHNjcmVlbiB3aGVuIGVudGVyaW5nIChPYnNpZGlhbiBydW5zIG9uIEVsZWN0cm9uIGFuZFxuICAgIC8vIHN1cHBvcnRzIHRoZSBGdWxsc2NyZWVuIEFQSSk7IGZhaWx1cmVzIChlLmcuIGluIGEgcGxhaW4gYnJvd3NlcikgYXJlXG4gICAgLy8gaWdub3JlZCBzaWxlbnRseSBcdTIwMTQgdGhlIFwiaGlkZSBzaWRlYmFyc1wiIGVmZmVjdCBzdGlsbCBhcHBsaWVzLlxuICAgIGlmIChhY3RpdmUpIHtcbiAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbj8uKCkuY2F0Y2goKCkgPT4ge30pO1xuICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQpIHtcbiAgICAgIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuPy4oKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgfVxuICB9XG59XG5cbi8vIFx1MjUwMFx1MjUwMCBTZXR0aW5ncyB0YWIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmNsYXNzIFJlYWRQcm9wc0JhclNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBwbHVnaW46IFJlYWRQcm9wc0JhclBsdWdpbikge1xuICAgIHN1cGVyKHBsdWdpbi5hcHAsIHBsdWdpbik7XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJQcm9wZXJ0aWVzIEJhciBcdTAwQjcgU2V0dGluZ3NcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJTaG93IFByZXZpb3VzL05leHQgYnV0dG9uc1wiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiU2hvdyBcdTI1QzAgXHUyNUI2IGJ1dHRvbnMgb24gdGhlIGxlZnQgb2YgdGhlIGJhciB3aGVuIHRoZSBub3RlIGJlbG9uZ3MgdG8gYSBkZWNrIChoYXMgYSBgZGVja2AgcHJvcGVydHkpXCIsXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93TmF2QnV0dG9ucykub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd05hdkJ1dHRvbnMgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJTaG93IHBhZ2UgbnVtYmVyXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJBdXRvLWNvbXB1dGVkIGZyb20gdGhlIGRlY2sgY2hhaW4gKG92ZXJ2aWV3IHBhZ2Ugc2hvd3MgXHUyMDFDT3ZlcnZpZXdcdTIwMUQpOyBzaG93biBhdCB0aGUgYm90dG9tLXJpZ2h0XCIsXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93UGFnZU51bWJlcikub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1BhZ2VOdW1iZXIgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJOYXZpZ2F0aW9uIGhvdGtleXNcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkRlZmF1bHQ6IFByZXZpb3VzIFBhZ2UgTW9kK1NoaWZ0K1x1MjE5MCwgTmV4dCBQYWdlIE1vZCtTaGlmdCtcdTIxOTIuIFJlYmluZCB1bmRlciBTZXR0aW5ncyBcdTIxOTIgSG90a2V5cy5cIixcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoXCJPcGVuIEhvdGtleXMgU2V0dGluZ3NcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgLy8gT3BlbiBPYnNpZGlhbidzIGhvdGtleXMgc2V0dGluZ3MgcGFnZSAoaW50ZXJuYWwgQVBJOyBpZ25vcmUgZmFpbHVyZXMpXG4gICAgICAgICAgKFxuICAgICAgICAgICAgdGhpcy5hcHAgYXMgdW5rbm93biBhcyB7IHNldHRpbmc/OiB7IG9wZW5UYWJCeUlkPzogKGlkOiBzdHJpbmcpID0+IHZvaWQgfSB9XG4gICAgICAgICAgKS5zZXR0aW5nPy5vcGVuVGFiQnlJZD8uKFwiaG90a2V5c1wiKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICB9XG59XG5cbi8vIFx1MjUwMFx1MjUwMCBIZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4vKiogUmVtb3ZlIGFsbCBjaGlsZHJlbiBvZiBhbiBlbGVtZW50ICovXG5mdW5jdGlvbiBjbGVhckNoaWxkcmVuKGVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICB3aGlsZSAoZWwuZmlyc3RDaGlsZCkgZWwucmVtb3ZlQ2hpbGQoZWwuZmlyc3RDaGlsZCk7XG59XG4iLCAiLyoqXG4gKiBkZWNrLnRzIFx1MjAxNCBQdXJlIGRlY2stcmVzb2x1dGlvbiBjb3JlIGZvciByZWFkLXByb3BzLWJhci5cbiAqXG4gKiBFdmVyeXRoaW5nIGluIHRoaXMgbW9kdWxlIGlzIGZyZWUgb2YgT2JzaWRpYW4gcnVudGltZSBkZXBlbmRlbmNpZXMgc28gaXQgY2FuXG4gKiBiZSB1bml0IHRlc3RlZCBkaXJlY3RseSAoc2VlIHRlc3QvZGVjay50ZXN0LnRzKS4gbWFpbi50cyBhZGFwdHMgdGhlIHZhdWx0XG4gKiAobWV0YWRhdGFDYWNoZSkgdG8gdGhpcyBwdXJlIGludGVyZmFjZTogaXQgcmVzb2x2ZXMgYGRlY2tgIHByb3BlcnRpZXMgdG9cbiAqIG5vdGUgcGF0aHMsIHRoZW4gaGFuZHMgdGhlIHBhdGggZ3JhcGggdG8gY29tcHV0ZURlY2soKS5cbiAqL1xuXG4vKiogQSBkZWNrIGxpbmsgbGlzdCBuZXZlciBob2xkcyBtb3JlIHRoYW4gdHdvIGVudHJpZXMgKi9cbmV4cG9ydCBjb25zdCBNQVhfREVDS19MSU5LUyA9IDI7XG5cbi8qKiBSZXN1bHQgb2YgcmVzb2x2aW5nIGEgbm90ZSdzIHBvc2l0aW9uIGluc2lkZSBhIGRlY2sgKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVja0luZm8ge1xuICAvKiogQ2hhaW4gb2Ygbm90ZSBwYXRoczogWzBdIGlzIHRoZSBvdmVydmlldyBub3RlLCB0aGVuIHNsaWRlcyBpbiBvcmRlciAqL1xuICBjaGFpbjogc3RyaW5nW107XG4gIC8qKiBJbmRleCBvZiB0aGUgY3VycmVudCBub3RlIGluc2lkZSBjaGFpbiAqL1xuICBpbmRleDogbnVtYmVyO1xufVxuXG4vKipcbiAqIFJlc29sdmUgYSBub3RlJ3MgcG9zaXRpb24gaW5zaWRlIGl0cyBkZWNrIGJ5IHdhbGtpbmcgdGhlIGxpbmsgY2hhaW4uXG4gKlxuICogQ29udmVudGlvbiBmb3IgdGhlIHNpbmdsZSBgZGVja2AgcHJvcGVydHkgKHVwIHRvIHR3byBsaW5rcyk6XG4gKiAgIC0gb3ZlcnZpZXcgbm90ZTogb25lIGxpbmsgXHUyMTkyIHRoYXQgbGluayBJUyB0aGUgZmlyc3QgcGFnZTtcbiAqICAgLSBzbGlkZSBub3RlOiAgICBmaXJzdCBsaW5rIFx1MjE5MiB0aGUgb3ZlcnZpZXcgcGFnZSwgc2Vjb25kIGxpbmsgXHUyMTkyIG5leHQgc2xpZGVcbiAqICAgICAgICAgICAgICAgICAgICAobm8gc2Vjb25kIGxpbmsgb24gdGhlIGxhc3Qgc2xpZGUpLlxuICpcbiAqIGBnZXRMaW5rcyhwYXRoKWAgbXVzdCByZXR1cm4gdGhlIHJlc29sdmVkIG5vdGUgcGF0aHMgb2YgdGhlIGBkZWNrYCBwcm9wZXJ0eVxuICogb2YgdGhlIG5vdGUgYXQgYHBhdGhgIChlbXB0eSB3aGVuIHRoZSBub3RlIGhhcyBub25lLCBvciBpdHMgbGlua3MgYXJlXG4gKiBicm9rZW4gXHUyMDE0IGEgYnJva2VuIGxpbmsgc2ltcGx5IGVuZHMgb3IgZXhjbHVkZXMgdGhlIGNoYWluLCBuZXZlciBjcmFzaGVzKS5cbiAqXG4gKiBSZXR1cm5zIHRoZSBmdWxsIGNoYWluIChbb3ZlcnZpZXcsIHNsaWRlIDEsIHNsaWRlIDIsIFx1MjAyNl0pIGFuZCB0aGUgY3VycmVudFxuICogbm90ZSdzIGluZGV4LCBvciBudWxsIHdoZW4gdGhlIG5vdGUgaXMgbm90IHBhcnQgb2YgYW55IGRlY2suXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlRGVjayhcbiAgY3VycmVudFBhdGg6IHN0cmluZyxcbiAgZ2V0TGlua3M6IChwYXRoOiBzdHJpbmcpID0+IHN0cmluZ1tdLFxuKTogRGVja0luZm8gfCBudWxsIHtcbiAgY29uc3QgY3VycmVudExpbmtzID0gZ2V0TGlua3MoY3VycmVudFBhdGgpO1xuICBpZiAoY3VycmVudExpbmtzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgbGV0IG92ZXJ2aWV3OiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGxldCBmaXJzdFBhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICBpZiAoY3VycmVudExpbmtzLmxlbmd0aCA+PSAyKSB7XG4gICAgLy8gQSBzbGlkZTogZmlyc3QgbGluayBpcyB0aGUgb3ZlcnZpZXcgcGFnZVxuICAgIG92ZXJ2aWV3ID0gY3VycmVudExpbmtzWzBdO1xuICAgIGZpcnN0UGFnZSA9IGdldExpbmtzKG92ZXJ2aWV3KVswXTtcbiAgfSBlbHNlIHtcbiAgICAvLyBBIHNpbmdsZSBsaW5rOiBlaXRoZXIgd2UgQVJFIHRoZSBvdmVydmlldyAobGluayA9IGZpcnN0IHBhZ2UpLFxuICAgIC8vIG9yIHdlIGFyZSB0aGUgbGFzdCBzbGlkZSAobGluayA9IG92ZXJ2aWV3IHBhZ2UpXG4gICAgY29uc3Qgb25seSA9IGN1cnJlbnRMaW5rc1swXTtcbiAgICBjb25zdCBvbmx5TGlua3MgPSBnZXRMaW5rcyhvbmx5KTtcbiAgICBpZiAob25seUxpbmtzWzBdID09PSBjdXJyZW50UGF0aCkge1xuICAgICAgb3ZlcnZpZXcgPSBjdXJyZW50UGF0aDtcbiAgICAgIGZpcnN0UGFnZSA9IG9ubHk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG92ZXJ2aWV3ID0gb25seTtcbiAgICAgIGZpcnN0UGFnZSA9IG9ubHlMaW5rc1swXTtcbiAgICB9XG4gIH1cbiAgaWYgKCFvdmVydmlldyB8fCAhZmlyc3RQYWdlKSByZXR1cm4gbnVsbDtcblxuICAvLyBXYWxrIHRoZSBjaGFpbjogb3ZlcnZpZXcgXHUyMTkyIGZpcnN0IHBhZ2UgXHUyMTkyIG5leHQgXHUyMTkyIG5leHQgXHUyMTkyIFx1MjAyNlxuICBjb25zdCBjaGFpbjogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgdmlzaXRlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBwdXNoID0gKHA6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHZvaWQgPT4ge1xuICAgIGlmIChwICYmICF2aXNpdGVkLmhhcyhwKSkge1xuICAgICAgdmlzaXRlZC5hZGQocCk7XG4gICAgICBjaGFpbi5wdXNoKHApO1xuICAgIH1cbiAgfTtcbiAgcHVzaChvdmVydmlldyk7XG4gIHB1c2goZmlyc3RQYWdlKTtcbiAgbGV0IGN1ciA9IGZpcnN0UGFnZTtcbiAgd2hpbGUgKGN1cikge1xuICAgIGNvbnN0IG5leHQgPSBnZXRMaW5rcyhjdXIpWzFdO1xuICAgIGlmICghbmV4dCB8fCB2aXNpdGVkLmhhcyhuZXh0KSkgYnJlYWs7IC8vIGVuZCBvZiBkZWNrIG9yIGN5Y2xlIGd1YXJkXG4gICAgcHVzaChuZXh0KTtcbiAgICBjdXIgPSBuZXh0O1xuICB9XG5cbiAgY29uc3QgaW5kZXggPSBjaGFpbi5pbmRleE9mKGN1cnJlbnRQYXRoKTtcbiAgaWYgKGluZGV4ID09PSAtMSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiB7IGNoYWluLCBpbmRleCB9O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdXAgdG8gYG1heGAgbm90ZSBuYW1lcyBmcm9tIGEgYGRlY2tgIHByb3BlcnR5IHZhbHVlLlxuICogQWNjZXB0cyBhIHNpbmdsZSBzdHJpbmcgb3IgYSBZQU1MIGxpc3Qgb2Ygc3RyaW5nczsgdW5xdW90ZWQgW1t4XV0gdmFsdWVzIGFyZVxuICogcGFyc2VkIGJ5IFlBTUwgYXMgbmVzdGVkIGFycmF5cyBhbmQgZmxhdHRlbmVkIGhlcmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0TGlua3ModmFsdWU6IHVua25vd24sIG1heDogbnVtYmVyID0gTUFYX0RFQ0tfTElOS1MpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGZsYXQ6IHVua25vd25bXSA9IFtdO1xuICBjb25zdCBjb2xsZWN0ID0gKHY6IHVua25vd24pOiB2b2lkID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHYpIGNvbGxlY3QoaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZsYXQucHVzaCh2KTtcbiAgICB9XG4gIH07XG4gIGNvbGxlY3QodmFsdWUpO1xuXG4gIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBpdGVtIG9mIGZsYXQpIHtcbiAgICBjb25zdCBuYW1lID0gZXh0cmFjdExpbmtUZXh0KGl0ZW0pO1xuICAgIGlmIChuYW1lKSBvdXQucHVzaChuYW1lKTtcbiAgICBpZiAob3V0Lmxlbmd0aCA+PSBtYXgpIGJyZWFrO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgdGFyZ2V0IG5vdGUgbmFtZSBmcm9tIGEgbWFya2Rvd24gbGluayBzdHJpbmcuXG4gKiBIYW5kbGVzIHNldmVyYWwgc2hhcGVzOlxuICogICBcIltbc2xpZGUtMl1dXCIgICAgICAgIFx1MjE5MiBzbGlkZS0yXG4gKiAgIFwiW1tzbGlkZS0yfGFsaWFzXV1cIiAgXHUyMTkyIHNsaWRlLTJcbiAqICAgXCJbW3NsaWRlLTIjc2VjdGlvbl1dXCJcdTIxOTIgc2xpZGUtMlxuICogICBzbGlkZS0yICAgICAgICAgICAgICBcdTIxOTIgc2xpZGUtMiAoYmFyZSBmaWxlbmFtZSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RMaW5rVGV4dCh2YWx1ZTogdW5rbm93bik6IHN0cmluZyB8IG51bGwge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgdHJpbW1lZCA9IHZhbHVlLnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHRyaW1tZWQucmVwbGFjZSgvXlxcW1xcWy8sIFwiXCIpLnJlcGxhY2UoL1xcXVxcXSQvLCBcIlwiKS5zcGxpdChcInxcIilbMF0uc3BsaXQoXCIjXCIpWzBdLnRyaW0oKTtcbn1cblxuLyoqIFJlbmRlciBhIHByb3BlcnR5IHZhbHVlIGFzIHJlYWRhYmxlIHRleHQ6IGFycmF5cy9vYmplY3RzIFx1MjE5MiBKU09OLCBlbHNlIFN0cmluZyAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFZhbHVlKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybiBcIlx1MjAxNFwiO1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUE0Q0Esc0JBQXVFOzs7QUNsQ2hFLElBQU0saUJBQWlCO0FBeUJ2QixTQUFTLFlBQ2QsYUFDQSxVQUNpQjtBQUNqQixRQUFNLGVBQWUsU0FBUyxXQUFXO0FBQ3pDLE1BQUksYUFBYSxXQUFXLEVBQUcsUUFBTztB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
