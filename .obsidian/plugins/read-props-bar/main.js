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
function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvZGVjay50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiByZWFkLXByb3BzLWJhciBcdTIwMTQgUmVhZGluZy12aWV3IHByb3BlcnRpZXMgYmFyIHdpdGggUFBULXN0eWxlIGRlY2sgbmF2aWdhdGlvblxuICpcbiAqIEZlYXR1cmVzOlxuICogICAxLiBIaWRlcyBPYnNpZGlhbidzIG5hdGl2ZSBzdGF0dXMgYmFyIGFuZCByZW5kZXJzIGEgXCJwcm9wZXJ0aWVzIGJhclwiIGF0IHRoZVxuICogICAgICBib3R0b20gb2YgdGhlIHdpbmRvdy5cbiAqICAgMi4gSW4gcmVhZGluZyB2aWV3LCBzaG93cyB0aGUgY3VycmVudCBub3RlJ3MgcHJvcGVydGllcyAoWUFNTCBmcm9udG1hdHRlcilcbiAqICAgICAgYXMgY2hpcHMgaW4gdGhhdCBiYXIuXG4gKiAgIDMuIFJlYWRpbmcgdmlldyBhdXRvLWVudGVycyBhIGZ1bGxzY3JlZW4tbGlrZSBtb2RlOiB0aGUgcmliYm9uLCBzaWRlYmFycyxcbiAqICAgICAgdGFiIGJhciBhbmQgdGhlIHBhbmUgaGVhZGVyIGJhciBhcmUgaGlkZGVuOyBsZWF2aW5nIHJlYWRpbmcgdmlld1xuICogICAgICByZXN0b3JlcyB0aGVtIGF1dG9tYXRpY2FsbHkuIFByZXNzaW5nIEVzYyB0byBsZWF2ZSB0aGUgT1MgZnVsbHNjcmVlblxuICogICAgICBhbHNvIGV4aXRzIHJlYWRpbmcgdmlldy5cbiAqICAgNC4gSGlkZXMgdGhlIGluLW5vdGUgcHJvcGVydGllcyBwYW5lbCBpbiByZWFkaW5nIHZpZXcgKGtlcHQgaW4gZWRpdCB2aWV3KS5cbiAqICAgNS4gUFBULXN0eWxlIGRlY2sgbmF2aWdhdGlvbiBkcml2ZW4gYnkgT05FIHJlc2VydmVkIGZyb250bWF0dGVyIGtleSwgYGRlY2tgLFxuICogICAgICBob2xkaW5nIHVwIHRvIHR3byBtYXJrZG93biBsaW5rczpcbiAqICAgICAgICAtIG92ZXJ2aWV3IG5vdGUgOiBkZWNrOiBbXCJbW2ZpcnN0LXNsaWRlXV1cIl0gICAgICAgICAgICAob25lIGxpbmsgPSB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdCBwYWdlIG9mIHRoZSBkZWNrOyB0aGUgbm90ZSBpcyB0aGUgb3ZlcnZpZXcpXG4gKiAgICAgICAgLSBzbGlkZSBub3RlICAgIDogZGVjazogW1wiW1tvdmVydmlld11dXCIsIFwiW1tuZXh0LXNsaWRlXV1cIl1cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAoZmlyc3QgbGluayA9IHRoZSBvdmVydmlldyBwYWdlLCBzZWNvbmQgbGluayA9IHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIG5leHQgc2xpZGU7IG9taXQgdGhlIHNlY29uZCBsaW5rIG9uIHRoZSBsYXN0IHNsaWRlKVxuICogICAgICBUaGUgcGFnZSBudW1iZXIgaXMgY29tcHV0ZWQgYXV0b21hdGljYWxseSBieSBzY2FubmluZyB0aGUgdmF1bHQgYW5kXG4gKiAgICAgIHdhbGtpbmcgdGhlIGNoYWluIG9mIGxpbmtzLCBzbyBubyBgcGFnZS1udW1iZXJgIHByb3BlcnR5IGlzIG5lZWRlZC5cbiAqICAgICAgXHUyNUMwIFx1MjVCNiBidXR0b25zIGFwcGVhciBvbiB0aGUgbGVmdCBvZiB0aGUgYmFyLCBhbmQgXCJQcmV2aW91cyBQYWdlXCIgLyBcIk5leHRcbiAqICAgICAgUGFnZVwiIGNvbW1hbmRzIGFyZSByZWdpc3RlcmVkIChkZWZhdWx0IGhvdGtleXMgTW9kK1NoaWZ0K1x1MjE5MCAvIE1vZCtTaGlmdCtcdTIxOTIsXG4gKiAgICAgIHJlYmluZGFibGUgdW5kZXIgU2V0dGluZ3MgXHUyMTkyIEhvdGtleXMpLlxuICogICA2LiBBIHNldHRpbmdzIHRhYiB0b2dnbGVzIHRoZSBcdTI1QzAgXHUyNUI2IGJ1dHRvbnMgYW5kIHRoZSBwYWdlIG51bWJlci5cbiAqXG4gKiBUaGUgZGVjayB1c3VhbGx5IHN0YXJ0cyBmcm9tIGFuIG92ZXJ2aWV3IG5vdGUgdGhhdCBlbWJlZHMgYW4gT2JzaWRpYW4gQmFzZVxuICogdmlldyAoY29yZSBcIkJhc2VzXCIgcGx1Z2luKSBmaWx0ZXJpbmcgbm90ZXMgdGhhdCBsaW5rIHRvIHRoZSBvdmVydmlldyBwYWdlOlxuICpcbiAqICAgYGBgYmFzZVxuICogICBmaWx0ZXJzOlxuICogICAgIGFuZDpcbiAqICAgICAgIC0gZmlsZS5oYXNMaW5rKFwib3ZlcnZpZXdcIilcbiAqICAgdmlld3M6XG4gKiAgICAgLSB0eXBlOiB0YWJsZVxuICogICAgICAgbmFtZTogRGVja1xuICogICBgYGBcbiAqXG4gKiBXaHkgcmVhZCBwcm9wZXJ0aWVzIHZpYSBtZXRhZGF0YUNhY2hlIGluc3RlYWQgb2YgcGFyc2luZyBZQU1MIG1hbnVhbGx5P1xuICogICBPYnNpZGlhbiBtYWludGFpbnMgYSBjYWNoZSBwZXIgbm90ZTsgbWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSlcbiAqICAgLmZyb250bWF0dGVyIHJldHVybnMgdGhlIHBhcnNlZCBwcm9wZXJ0aWVzLCB1cGRhdGVkIGF1dG9tYXRpY2FsbHkgb24gc2F2ZS5cbiAqL1xuXG5pbXBvcnQgeyBQbHVnaW4sIE1hcmtkb3duVmlldywgVEZpbGUsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IGNvbXB1dGVEZWNrLCBleHRyYWN0TGlua3MsIGZvcm1hdFZhbHVlLCB0eXBlIERlY2tJbmZvIH0gZnJvbSBcIi4vc3JjL2RlY2tcIjtcblxuLyoqIFBsdWdpbiBzZXR0aW5ncyAqL1xuaW50ZXJmYWNlIFJlYWRQcm9wc0JhclNldHRpbmdzIHtcbiAgLyoqIFNob3cgXHUyNUMwIFx1MjVCNiBwcmV2aW91cy9uZXh0IGJ1dHRvbnMgb24gdGhlIGxlZnQgb2YgdGhlIGJhciAqL1xuICBzaG93TmF2QnV0dG9uczogYm9vbGVhbjtcbiAgLyoqIFNob3cgdGhlIGF1dG8tY29tcHV0ZWQgcGFnZSBudW1iZXIgYXQgdGhlIGJvdHRvbS1yaWdodCBvZiB0aGUgYmFyICovXG4gIHNob3dQYWdlTnVtYmVyOiBib29sZWFuO1xufVxuXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBSZWFkUHJvcHNCYXJTZXR0aW5ncyA9IHtcbiAgc2hvd05hdkJ1dHRvbnM6IHRydWUsXG4gIHNob3dQYWdlTnVtYmVyOiB0cnVlLFxufTtcblxuLyoqIFJlc2VydmVkIGZyb250bWF0dGVyIGtleSBkcml2aW5nIGRlY2sgbmF2aWdhdGlvbiAobmV2ZXIgcmVuZGVyZWQgYXMgYSBjaGlwKSAqL1xuY29uc3QgREVDS19LRVkgPSBcImRlY2tcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVhZFByb3BzQmFyUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgLyoqIFRoZSBwcm9wZXJ0aWVzIGJhciBET00gZWxlbWVudCAqL1xuICBwcml2YXRlIGJhcjogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgLyoqIFdoZXRoZXIgdGhlIHVzZXIgbWFudWFsbHkgaGlkIHRoZSBiYXIgKHRvZ2dsZSBjb21tYW5kKSAqL1xuICBwcml2YXRlIGJhckhpZGRlbiA9IGZhbHNlO1xuICAvKiogV2hldGhlciBmdWxsc2NyZWVuIHJlYWRpbmcgbW9kZSBpcyBjdXJyZW50bHkgYWN0aXZlICovXG4gIHByaXZhdGUgZnVsbHNjcmVlbiA9IGZhbHNlO1xuICAvKiogV2hldGhlciBhdXRvLWZ1bGxzY3JlZW4gaW4gcmVhZGluZyB2aWV3IGlzIGVuYWJsZWQgKGRlZmF1bHQgb24pICovXG4gIHByaXZhdGUgYXV0b0Z1bGxzY3JlZW4gPSB0cnVlO1xuICAvKiogTGFzdCByZWZyZXNoIGtleSAoXCJwYXRofG1vZGVcIikgdG8gYXZvaWQgcG9pbnRsZXNzIHJlLXJlbmRlcnMgKi9cbiAgcHJpdmF0ZSBsYXN0S2V5ID0gXCJcIjtcbiAgLyoqIFBsdWdpbiBzZXR0aW5ncyAqL1xuICBzZXR0aW5nczogUmVhZFByb3BzQmFyU2V0dGluZ3MgPSB7IC4uLkRFRkFVTFRfU0VUVElOR1MgfTtcblxuICBhc3luYyBvbmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IFJlYWRQcm9wc0JhclNldHRpbmdUYWIodGhpcykpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDEuIFJlZnJlc2ggb24gXCJjdXJyZW50IG5vdGUgLyB2aWV3IGNoYW5nZWRcIiBldmVudHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImZpbGUtb3BlblwiLCAoKSA9PiB0aGlzLnJlZnJlc2goKSkpO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJhY3RpdmUtbGVhZi1jaGFuZ2VcIiwgKCkgPT4gdGhpcy5yZWZyZXNoKCkpKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKFwibGF5b3V0LWNoYW5nZVwiLCAoKSA9PiB0aGlzLnJlZnJlc2goKSkpO1xuICAgIC8vIFJlZnJlc2ggd2hlbiB0aGUgbm90ZSBjb250ZW50IChpbmNsdWRpbmcgZnJvbnRtYXR0ZXIpIGNoYW5nZXMgLyBzYXZlc1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUub24oXCJjaGFuZ2VkXCIsIChmaWxlOiBURmlsZSkgPT4ge1xuICAgICAgICBpZiAoZmlsZSA9PT0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKSkgdGhpcy5yZWZyZXNoKCk7XG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMi4gRmFsbGJhY2sgdGltZXI6IGVkaXRcdTIxOTRyZWFkaW5nIHRvZ2dsZXMgbWF5IGZpcmUgbm8gc3RhbmRhcmQgZXZlbnQgXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5yZWdpc3RlckludGVydmFsKFxuICAgICAgd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGNvbnN0IGtleSA9IGZpbGUgPyBgJHtmaWxlLnBhdGh9fCR7dGhpcy5jdXJyZW50TW9kZSgpfWAgOiBcIlwiO1xuICAgICAgICBpZiAoa2V5ICE9PSB0aGlzLmxhc3RLZXkpIHtcbiAgICAgICAgICB0aGlzLmxhc3RLZXkgPSBrZXk7XG4gICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgIH1cbiAgICAgIH0sIDUwMClcbiAgICApO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDMuIENvbW1hbmRzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIC8vIDNhLiBNYW51YWxseSBzaG93IC8gaGlkZSB0aGUgcHJvcGVydGllcyBiYXJcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwidG9nZ2xlLXByb3BzLWJhclwiLFxuICAgICAgbmFtZTogXCJUb2dnbGUgUHJvcGVydGllcyBCYXJcIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XG4gICAgICAgIHRoaXMuYmFySGlkZGVuID0gIXRoaXMuYmFySGlkZGVuO1xuICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgLy8gM2IuIFBhdXNlIC8gcmVzdW1lIGF1dG8tZnVsbHNjcmVlbiBpbiByZWFkaW5nIHZpZXdcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwidG9nZ2xlLWF1dG8tZnVsbHNjcmVlblwiLFxuICAgICAgbmFtZTogXCJQYXVzZS9SZXN1bWUgQXV0byBGdWxsc2NyZWVuXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4ge1xuICAgICAgICB0aGlzLmF1dG9GdWxsc2NyZWVuID0gIXRoaXMuYXV0b0Z1bGxzY3JlZW47XG4gICAgICAgIC8vIFdoZW4gcGF1c2VkLCByZXN0b3JlIHRoZSBsYXlvdXQgaW1tZWRpYXRlbHk7IHdoZW4gcmVzdW1lZCwgcmUtc3luY1xuICAgICAgICBpZiAoIXRoaXMuYXV0b0Z1bGxzY3JlZW4pIHRoaXMuc3luY0Z1bGxzY3JlZW4oZmFsc2UpO1xuICAgICAgICBlbHNlIHRoaXMucmVmcmVzaCgpO1xuICAgICAgfSxcbiAgICB9KTtcbiAgICAvLyAzYy4gUHJldmlvdXMgLyBuZXh0IHBhZ2UgKGRlY2sgbmF2aWdhdGlvbiwgcmViaW5kYWJsZSBpbiBTZXR0aW5ncyBcdTIxOTIgSG90a2V5cylcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibmF2LXByZXZcIixcbiAgICAgIG5hbWU6IFwiUHJldmlvdXMgUGFnZVwiLFxuICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIiwgXCJTaGlmdFwiXSwga2V5OiBcIkFycm93TGVmdFwiIH1dLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHRoaXMubmF2aWdhdGUoXCJwcmV2XCIpLFxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJuYXYtbmV4dFwiLFxuICAgICAgbmFtZTogXCJOZXh0IFBhZ2VcIixcbiAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJBcnJvd1JpZ2h0XCIgfV0sXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5uYXZpZ2F0ZShcIm5leHRcIiksXG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgNC4gRXNjIGV4aXRzIE9TIGZ1bGxzY3JlZW4gXHUyMTkyIGxlYXZlIHJlYWRpbmcgdmlldyBhcyB3ZWxsIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIC8vIEtlZXBzIGludGVybmFsIHN0YXRlIGluIHN5bmMgd2hlbiB0aGUgdXNlciBwcmVzc2VzIEVzYzsgYWxzbyBzd2l0Y2hlc1xuICAgIC8vIHRoZSBhY3RpdmUgTWFya2Rvd24gdmlldyBiYWNrIHRvIGVkaXQgbW9kZS4gT3VyIG93biBleGl0RnVsbHNjcmVlbigpXG4gICAgLy8gY2FsbHMgc2V0IHRoaXMuZnVsbHNjcmVlbiA9IGZhbHNlIGZpcnN0LCBzbyB0aGV5IG5ldmVyIHRyaWdnZXIgdGhpcy5cbiAgICB0aGlzLnJlZ2lzdGVyRG9tRXZlbnQoZG9jdW1lbnQsIFwiZnVsbHNjcmVlbmNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBpZiAoIWRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50ICYmIHRoaXMuZnVsbHNjcmVlbikge1xuICAgICAgICB0aGlzLmZ1bGxzY3JlZW4gPSBmYWxzZTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKFwicnYtcHJvcHMtZnVsbHNjcmVlblwiKTtcbiAgICAgICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgICAgIGlmICh2aWV3ICYmIHZpZXcuZ2V0TW9kZSgpID09PSBcInByZXZpZXdcIikge1xuICAgICAgICAgIC8vIHNldE1vZGUgaXMgbm90IGluIHRoZSBwdWJsaWMgdHlwaW5ncyBidXQgZXhpc3RzIGF0IHJ1bnRpbWVcbiAgICAgICAgICAodmlldyBhcyB1bmtub3duIGFzIHsgc2V0TW9kZTogKG1vZGU6IFwic291cmNlXCIgfCBcInByZXZpZXdcIikgPT4gdm9pZCB9KS5zZXRNb2RlKFwic291cmNlXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgNS4gQ3JlYXRlIHRoZSBiYXIgYW5kIGRvIHRoZSBmaXJzdCByZW5kZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5iYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRoaXMuYmFyLmNsYXNzTmFtZSA9IFwicnYtcHJvcHMtYmFyXCI7XG4gICAgdGhpcy5iYXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiOyAvLyBoaWRkZW4gdW50aWwgcmVmcmVzaCgpIGRlY2lkZXMgb3RoZXJ3aXNlXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmJhcik7XG4gICAgdGhpcy5yZWZyZXNoKCk7XG4gIH1cblxuICBvbnVubG9hZCgpOiB2b2lkIHtcbiAgICB0aGlzLmJhcj8ucmVtb3ZlKCk7XG4gICAgdGhpcy5iYXIgPSBudWxsO1xuICAgIC8vIExlYXZlIE9TIGZ1bGxzY3JlZW4gYW5kIGRyb3AgdGhlIGZ1bGxzY3JlZW4gY2xhc3Mgc28gbm8gVUkgcmVzaWR1ZSByZW1haW5zXG4gICAgaWYgKGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50KSBkb2N1bWVudC5leGl0RnVsbHNjcmVlbj8uKCkuY2F0Y2goKCkgPT4ge30pO1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShcInJ2LXByb3BzLWZ1bGxzY3JlZW5cIik7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU2V0dGluZ3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgRGVjayByZXNvbHV0aW9uICh3YWxrIHRoZSBsaW5rIGNoYWluKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICAvKiogUmVzb2x2ZSB0aGUgY3VycmVudCBub3RlJ3MgcG9zaXRpb24gaW5zaWRlIGl0cyBkZWNrIChwYXRoLWJhc2VkIHdyYXBwZXIpICovXG4gIHByaXZhdGUgY29tcHV0ZURlY2soZmlsZTogVEZpbGUpOiBEZWNrSW5mbyB8IG51bGwge1xuICAgIHJldHVybiBjb21wdXRlRGVjayhmaWxlLnBhdGgsIChwYXRoKSA9PiB0aGlzLmRlY2tMaW5rUGF0aHMocGF0aCkpO1xuICB9XG5cbiAgLyoqIFJlc29sdmUgdGhlIGBkZWNrYCBwcm9wZXJ0eSBvZiBhIG5vdGUgaW50byByZWFsIG5vdGUgcGF0aHMgKG1heCB0d28pICovXG4gIHByaXZhdGUgZGVja0xpbmtQYXRocyhwYXRoOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZiA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcbiAgICBpZiAoIShmIGluc3RhbmNlb2YgVEZpbGUpKSByZXR1cm4gW107XG4gICAgY29uc3QgZm0gPSB0aGlzLmZyb250bWF0dGVyT2YoZik7XG4gICAgY29uc3QgbmFtZXMgPSBmbSA/IGV4dHJhY3RMaW5rcyhmbVtERUNLX0tFWV0pIDogW107XG4gICAgcmV0dXJuIG5hbWVzXG4gICAgICAubWFwKChuYW1lKSA9PiB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KG5hbWUsIHBhdGgpKVxuICAgICAgLmZpbHRlcigoeCk6IHggaXMgVEZpbGUgPT4gISF4KVxuICAgICAgLm1hcCgoeCkgPT4geC5wYXRoKTtcbiAgfVxuXG4gIC8qKiBGcm9udG1hdHRlciBvZiBhbnkgbm90ZSBhcyBhbiBvYmplY3QsIG9yIG51bGwgd2hlbiBhYnNlbnQgKi9cbiAgcHJpdmF0ZSBmcm9udG1hdHRlck9mKGZpbGU6IFRGaWxlKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsIHtcbiAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgIHJldHVybiBjYWNoZT8uZnJvbnRtYXR0ZXIgPz8gbnVsbDtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBQUFQgbmF2aWdhdGlvbiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICAvKiogTW92ZSBvbmUgc3RlcCBiYWNrL2ZvcndhcmQgYWxvbmcgdGhlIGRlY2sgY2hhaW4gKi9cbiAgcHJpdmF0ZSBuYXZpZ2F0ZShkaXJlY3Rpb246IFwicHJldlwiIHwgXCJuZXh0XCIpOiB2b2lkIHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICBpZiAoIWZpbGUpIHJldHVybjtcbiAgICBjb25zdCBkZWNrID0gdGhpcy5jb21wdXRlRGVjayhmaWxlKTtcbiAgICBpZiAoIWRlY2spIHJldHVybjtcbiAgICBjb25zdCB0YXJnZXQgPSBkZWNrLmNoYWluW2RpcmVjdGlvbiA9PT0gXCJwcmV2XCIgPyBkZWNrLmluZGV4IC0gMSA6IGRlY2suaW5kZXggKyAxXTtcbiAgICBpZiAoIXRhcmdldCkgcmV0dXJuO1xuICAgIHZvaWQgdGhpcy5hcHAud29ya3NwYWNlLm9wZW5MaW5rVGV4dCh0YXJnZXQsIGZpbGUucGF0aCk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgTW9kZSAvIGRhdGEgYWNjZXNzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBNb2RlIG9mIHRoZSBhY3RpdmUgTWFya2Rvd24gdmlldzogJ3ByZXZpZXcnPXJlYWRpbmcgJ3NvdXJjZSc9ZWRpdGluZyAnJz1ub25lICovXG4gIHByaXZhdGUgY3VycmVudE1vZGUoKTogXCJwcmV2aWV3XCIgfCBcInNvdXJjZVwiIHwgXCJcIiB7XG4gICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgcmV0dXJuIHZpZXcgPyAodmlldy5nZXRNb2RlKCkgYXMgXCJwcmV2aWV3XCIgfCBcInNvdXJjZVwiKSA6IFwiXCI7XG4gIH1cblxuICAvKiogQ3VycmVudCBub3RlJ3MgZnJvbnRtYXR0ZXIgYXMgYW4gb2JqZWN0LCBvciBudWxsIHdoZW4gYWJzZW50ICovXG4gIHByaXZhdGUgZnJvbnRtYXR0ZXIoKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsIHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICByZXR1cm4gZmlsZSA/IHRoaXMuZnJvbnRtYXR0ZXJPZihmaWxlKSA6IG51bGw7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgQmFyIHJlbmRlcmluZyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICAvKiogRGVjaWRlIHdoYXQgdGhlIGJhciBzaG93cywgdGhlbiByZS1yZW5kZXIgaXQgKi9cbiAgcmVmcmVzaCgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuYmFyKSByZXR1cm47XG5cbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICBjb25zdCBtb2RlID0gdGhpcy5jdXJyZW50TW9kZSgpO1xuXG4gICAgLy8gQXV0by1mdWxsc2NyZWVuOiBlbnRlciBvbiByZWFkaW5nIHZpZXcsIHJlc3RvcmUgb24gbGVhdmluZyBpdFxuICAgIHRoaXMuc3luY0Z1bGxzY3JlZW4obW9kZSA9PT0gXCJwcmV2aWV3XCIgJiYgdGhpcy5hdXRvRnVsbHNjcmVlbik7XG5cbiAgICAvLyBOb3QgYSBNYXJrZG93biBub3RlIC8gbm90IGluIHJlYWRpbmcgdmlldyAvIGhpZGRlbiBieSB0aGUgdXNlciBcdTIxOTIgaGlkZVxuICAgIGlmICghZmlsZSB8fCBtb2RlICE9PSBcInByZXZpZXdcIiB8fCB0aGlzLmJhckhpZGRlbikge1xuICAgICAgdGhpcy5iYXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZtID0gdGhpcy5mcm9udG1hdHRlcigpO1xuICAgIGNvbnN0IGRlY2sgPSB0aGlzLmNvbXB1dGVEZWNrKGZpbGUpO1xuICAgIGNsZWFyQ2hpbGRyZW4odGhpcy5iYXIpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIExlZnQ6IHByZXZpb3VzIC8gbmV4dCBidXR0b25zIChvbmx5IGluc2lkZSBhIGRlY2spIFx1MjUwMFx1MjUwMFxuICAgIGlmICh0aGlzLnNldHRpbmdzLnNob3dOYXZCdXR0b25zICYmIGRlY2spIHtcbiAgICAgIGNvbnN0IGhhc1ByZXYgPSBkZWNrLmluZGV4ID4gMDtcbiAgICAgIGNvbnN0IGhhc05leHQgPSBkZWNrLmluZGV4IDwgZGVjay5jaGFpbi5sZW5ndGggLSAxO1xuICAgICAgaWYgKGhhc1ByZXYgfHwgaGFzTmV4dCkge1xuICAgICAgICBjb25zdCBuYXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBuYXYuY2xhc3NOYW1lID0gXCJydi1wcm9wcy1uYXZcIjtcbiAgICAgICAgaWYgKGhhc1ByZXYpIG5hdi5hcHBlbmRDaGlsZCh0aGlzLm5hdkJ1dHRvbihcIlx1MjVDMFwiLCBcIlByZXZpb3VzIHBhZ2VcIiwgKCkgPT4gdGhpcy5uYXZpZ2F0ZShcInByZXZcIikpKTtcbiAgICAgICAgaWYgKGhhc05leHQpIG5hdi5hcHBlbmRDaGlsZCh0aGlzLm5hdkJ1dHRvbihcIlx1MjVCNlwiLCBcIk5leHQgcGFnZVwiLCAoKSA9PiB0aGlzLm5hdmlnYXRlKFwibmV4dFwiKSkpO1xuICAgICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChuYXYpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBNaWRkbGU6IGNoaXBzIGZvciB0aGUgcmVtYWluaW5nIHByb3BlcnRpZXMgXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgdmlzaWJsZSA9IGZtXG4gICAgICA/IE9iamVjdC5lbnRyaWVzKGZtKS5maWx0ZXIoKFtrZXldKSA9PiBrZXkgIT09IERFQ0tfS0VZICYmIGtleSAhPT0gXCJwb3NpdGlvblwiKVxuICAgICAgOiBbXTtcblxuICAgIGlmICh2aXNpYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgLy8gTm8gcHJvcGVydGllcyBcdTIxOTIgcGxhY2Vob2xkZXIgdGV4dFxuICAgICAgY29uc3Qgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgc3Bhbi5jbGFzc05hbWUgPSBcInJ2LXByb3BzLWVtcHR5XCI7XG4gICAgICBzcGFuLnRleHRDb250ZW50ID0gXCJObyBwcm9wZXJ0aWVzXCI7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgdmlzaWJsZSkge1xuICAgICAgICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHNwYW4uY2xhc3NOYW1lID0gXCJydi1wcm9wcy1pdGVtXCI7XG4gICAgICAgIGNvbnN0IGsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3Ryb25nXCIpO1xuICAgICAgICBrLnRleHRDb250ZW50ID0ga2V5O1xuICAgICAgICBzcGFuLmFwcGVuZENoaWxkKGspO1xuICAgICAgICBzcGFuLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiOiBcIiArIGZvcm1hdFZhbHVlKHZhbHVlKSkpO1xuICAgICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQm90dG9tLXJpZ2h0OiBhdXRvLWNvbXB1dGVkIHBhZ2UgbnVtYmVyIFx1MjUwMFx1MjUwMFxuICAgIGlmICh0aGlzLnNldHRpbmdzLnNob3dQYWdlTnVtYmVyICYmIGRlY2spIHtcbiAgICAgIGNvbnN0IHBhZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgIHBhZ2UuY2xhc3NOYW1lID0gXCJydi1wcm9wcy1wYWdlXCI7XG4gICAgICAvLyBjaGFpblswXSBpcyB0aGUgb3ZlcnZpZXcgbm90ZTsgc2xpZGVzIHN0YXJ0IGF0IGluZGV4IDEgXHUyMTkyIFwiUGFnZSAxXCJcbiAgICAgIHBhZ2UudGV4dENvbnRlbnQgPSBkZWNrLmluZGV4ID09PSAwID8gXCJPdmVydmlld1wiIDogYFBhZ2UgJHtkZWNrLmluZGV4fWA7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChwYWdlKTtcbiAgICB9XG5cbiAgICB0aGlzLmJhci5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgfVxuXG4gIC8qKiBCdWlsZCBhIFx1MjVDMCAvIFx1MjVCNiBuYXZpZ2F0aW9uIGJ1dHRvbiAqL1xuICBwcml2YXRlIG5hdkJ1dHRvbihsYWJlbDogc3RyaW5nLCB0aXA6IHN0cmluZywgb25DbGljazogKCkgPT4gdm9pZCk6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgIGJ0bi5jbGFzc05hbWUgPSBcInJ2LXByb3BzLW5hdi1idG5cIjtcbiAgICBidG4udGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgICBidG4udGl0bGUgPSB0aXA7XG4gICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvbkNsaWNrKTtcbiAgICByZXR1cm4gYnRuO1xuICB9XG5cbiAgLyoqIFN5bmMgdGhlIGZ1bGxzY3JlZW4gc3RhdGU6IGFkZCB0aGUgY2xhc3MgKyByZXF1ZXN0IE9TIGZ1bGxzY3JlZW4sIG9yIHJlc3RvcmUgKi9cbiAgcHJpdmF0ZSBzeW5jRnVsbHNjcmVlbihhY3RpdmU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5mdWxsc2NyZWVuID09PSBhY3RpdmUpIHJldHVybjsgLy8gbm90aGluZyB0byBkb1xuICAgIHRoaXMuZnVsbHNjcmVlbiA9IGFjdGl2ZTtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC50b2dnbGUoXCJydi1wcm9wcy1mdWxsc2NyZWVuXCIsIGFjdGl2ZSk7XG5cbiAgICAvLyBSZXF1ZXN0IE9TLWxldmVsIGZ1bGxzY3JlZW4gd2hlbiBlbnRlcmluZyAoT2JzaWRpYW4gcnVucyBvbiBFbGVjdHJvbiBhbmRcbiAgICAvLyBzdXBwb3J0cyB0aGUgRnVsbHNjcmVlbiBBUEkpOyBmYWlsdXJlcyAoZS5nLiBpbiBhIHBsYWluIGJyb3dzZXIpIGFyZVxuICAgIC8vIGlnbm9yZWQgc2lsZW50bHkgXHUyMDE0IHRoZSBcImhpZGUgc2lkZWJhcnNcIiBlZmZlY3Qgc3RpbGwgYXBwbGllcy5cbiAgICBpZiAoYWN0aXZlKSB7XG4gICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4/LigpLmNhdGNoKCgpID0+IHt9KTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50KSB7XG4gICAgICBkb2N1bWVudC5leGl0RnVsbHNjcmVlbj8uKCkuY2F0Y2goKCkgPT4ge30pO1xuICAgIH1cbiAgfVxufVxuXG4vLyBcdTI1MDBcdTI1MDAgU2V0dGluZ3MgdGFiIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5jbGFzcyBSZWFkUHJvcHNCYXJTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBSZWFkUHJvcHNCYXJQbHVnaW4pIHtcbiAgICBzdXBlcihwbHVnaW4uYXBwLCBwbHVnaW4pO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiUHJvcGVydGllcyBCYXIgXHUwMEI3IFNldHRpbmdzXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBQcmV2aW91cy9OZXh0IGJ1dHRvbnNcIilcbiAgICAgIC5zZXREZXNjKFwiU2hvdyBcdTI1QzAgXHUyNUI2IGJ1dHRvbnMgb24gdGhlIGxlZnQgb2YgdGhlIGJhciB3aGVuIHRoZSBub3RlIGJlbG9uZ3MgdG8gYSBkZWNrIChoYXMgYSBgZGVja2AgcHJvcGVydHkpXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93TmF2QnV0dG9ucykub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd05hdkJ1dHRvbnMgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlNob3cgcGFnZSBudW1iZXJcIilcbiAgICAgIC5zZXREZXNjKFwiQXV0by1jb21wdXRlZCBmcm9tIHRoZSBkZWNrIGNoYWluIChvdmVydmlldyBwYWdlIHNob3dzIFx1MjAxQ092ZXJ2aWV3XHUyMDFEKTsgc2hvd24gYXQgdGhlIGJvdHRvbS1yaWdodFwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1BhZ2VOdW1iZXIpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dQYWdlTnVtYmVyID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJOYXZpZ2F0aW9uIGhvdGtleXNcIilcbiAgICAgIC5zZXREZXNjKFwiRGVmYXVsdDogUHJldmlvdXMgUGFnZSBNb2QrU2hpZnQrXHUyMTkwLCBOZXh0IFBhZ2UgTW9kK1NoaWZ0K1x1MjE5Mi4gUmViaW5kIHVuZGVyIFNldHRpbmdzIFx1MjE5MiBIb3RrZXlzLlwiKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIk9wZW4gSG90a2V5cyBTZXR0aW5nc1wiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICAvLyBPcGVuIE9ic2lkaWFuJ3MgaG90a2V5cyBzZXR0aW5ncyBwYWdlIChpbnRlcm5hbCBBUEk7IGlnbm9yZSBmYWlsdXJlcylcbiAgICAgICAgICAodGhpcy5hcHAgYXMgdW5rbm93biBhcyB7IHNldHRpbmc/OiB7IG9wZW5UYWJCeUlkPzogKGlkOiBzdHJpbmcpID0+IHZvaWQgfSB9KVxuICAgICAgICAgICAgLnNldHRpbmc/Lm9wZW5UYWJCeUlkPy4oXCJob3RrZXlzXCIpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgfVxufVxuXG4vLyBcdTI1MDBcdTI1MDAgSGVscGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuLyoqIFJlbW92ZSBhbGwgY2hpbGRyZW4gb2YgYW4gZWxlbWVudCAqL1xuZnVuY3Rpb24gY2xlYXJDaGlsZHJlbihlbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgd2hpbGUgKGVsLmZpcnN0Q2hpbGQpIGVsLnJlbW92ZUNoaWxkKGVsLmZpcnN0Q2hpbGQpO1xufVxuIiwgIi8qKlxuICogZGVjay50cyBcdTIwMTQgUHVyZSBkZWNrLXJlc29sdXRpb24gY29yZSBmb3IgcmVhZC1wcm9wcy1iYXIuXG4gKlxuICogRXZlcnl0aGluZyBpbiB0aGlzIG1vZHVsZSBpcyBmcmVlIG9mIE9ic2lkaWFuIHJ1bnRpbWUgZGVwZW5kZW5jaWVzIHNvIGl0IGNhblxuICogYmUgdW5pdCB0ZXN0ZWQgZGlyZWN0bHkgKHNlZSB0ZXN0L2RlY2sudGVzdC50cykuIG1haW4udHMgYWRhcHRzIHRoZSB2YXVsdFxuICogKG1ldGFkYXRhQ2FjaGUpIHRvIHRoaXMgcHVyZSBpbnRlcmZhY2U6IGl0IHJlc29sdmVzIGBkZWNrYCBwcm9wZXJ0aWVzIHRvXG4gKiBub3RlIHBhdGhzLCB0aGVuIGhhbmRzIHRoZSBwYXRoIGdyYXBoIHRvIGNvbXB1dGVEZWNrKCkuXG4gKi9cblxuLyoqIEEgZGVjayBsaW5rIGxpc3QgbmV2ZXIgaG9sZHMgbW9yZSB0aGFuIHR3byBlbnRyaWVzICovXG5leHBvcnQgY29uc3QgTUFYX0RFQ0tfTElOS1MgPSAyO1xuXG4vKiogUmVzdWx0IG9mIHJlc29sdmluZyBhIG5vdGUncyBwb3NpdGlvbiBpbnNpZGUgYSBkZWNrICovXG5leHBvcnQgaW50ZXJmYWNlIERlY2tJbmZvIHtcbiAgLyoqIENoYWluIG9mIG5vdGUgcGF0aHM6IFswXSBpcyB0aGUgb3ZlcnZpZXcgbm90ZSwgdGhlbiBzbGlkZXMgaW4gb3JkZXIgKi9cbiAgY2hhaW46IHN0cmluZ1tdO1xuICAvKiogSW5kZXggb2YgdGhlIGN1cnJlbnQgbm90ZSBpbnNpZGUgY2hhaW4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBSZXNvbHZlIGEgbm90ZSdzIHBvc2l0aW9uIGluc2lkZSBpdHMgZGVjayBieSB3YWxraW5nIHRoZSBsaW5rIGNoYWluLlxuICpcbiAqIENvbnZlbnRpb24gZm9yIHRoZSBzaW5nbGUgYGRlY2tgIHByb3BlcnR5ICh1cCB0byB0d28gbGlua3MpOlxuICogICAtIG92ZXJ2aWV3IG5vdGU6IG9uZSBsaW5rIFx1MjE5MiB0aGF0IGxpbmsgSVMgdGhlIGZpcnN0IHBhZ2U7XG4gKiAgIC0gc2xpZGUgbm90ZTogICAgZmlyc3QgbGluayBcdTIxOTIgdGhlIG92ZXJ2aWV3IHBhZ2UsIHNlY29uZCBsaW5rIFx1MjE5MiBuZXh0IHNsaWRlXG4gKiAgICAgICAgICAgICAgICAgICAgKG5vIHNlY29uZCBsaW5rIG9uIHRoZSBsYXN0IHNsaWRlKS5cbiAqXG4gKiBgZ2V0TGlua3MocGF0aClgIG11c3QgcmV0dXJuIHRoZSByZXNvbHZlZCBub3RlIHBhdGhzIG9mIHRoZSBgZGVja2AgcHJvcGVydHlcbiAqIG9mIHRoZSBub3RlIGF0IGBwYXRoYCAoZW1wdHkgd2hlbiB0aGUgbm90ZSBoYXMgbm9uZSwgb3IgaXRzIGxpbmtzIGFyZVxuICogYnJva2VuIFx1MjAxNCBhIGJyb2tlbiBsaW5rIHNpbXBseSBlbmRzIG9yIGV4Y2x1ZGVzIHRoZSBjaGFpbiwgbmV2ZXIgY3Jhc2hlcykuXG4gKlxuICogUmV0dXJucyB0aGUgZnVsbCBjaGFpbiAoW292ZXJ2aWV3LCBzbGlkZSAxLCBzbGlkZSAyLCBcdTIwMjZdKSBhbmQgdGhlIGN1cnJlbnRcbiAqIG5vdGUncyBpbmRleCwgb3IgbnVsbCB3aGVuIHRoZSBub3RlIGlzIG5vdCBwYXJ0IG9mIGFueSBkZWNrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZURlY2soXG4gIGN1cnJlbnRQYXRoOiBzdHJpbmcsXG4gIGdldExpbmtzOiAocGF0aDogc3RyaW5nKSA9PiBzdHJpbmdbXVxuKTogRGVja0luZm8gfCBudWxsIHtcbiAgY29uc3QgY3VycmVudExpbmtzID0gZ2V0TGlua3MoY3VycmVudFBhdGgpO1xuICBpZiAoY3VycmVudExpbmtzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgbGV0IG92ZXJ2aWV3OiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGxldCBmaXJzdFBhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICBpZiAoY3VycmVudExpbmtzLmxlbmd0aCA+PSAyKSB7XG4gICAgLy8gQSBzbGlkZTogZmlyc3QgbGluayBpcyB0aGUgb3ZlcnZpZXcgcGFnZVxuICAgIG92ZXJ2aWV3ID0gY3VycmVudExpbmtzWzBdO1xuICAgIGZpcnN0UGFnZSA9IGdldExpbmtzKG92ZXJ2aWV3KVswXTtcbiAgfSBlbHNlIHtcbiAgICAvLyBBIHNpbmdsZSBsaW5rOiBlaXRoZXIgd2UgQVJFIHRoZSBvdmVydmlldyAobGluayA9IGZpcnN0IHBhZ2UpLFxuICAgIC8vIG9yIHdlIGFyZSB0aGUgbGFzdCBzbGlkZSAobGluayA9IG92ZXJ2aWV3IHBhZ2UpXG4gICAgY29uc3Qgb25seSA9IGN1cnJlbnRMaW5rc1swXTtcbiAgICBjb25zdCBvbmx5TGlua3MgPSBnZXRMaW5rcyhvbmx5KTtcbiAgICBpZiAob25seUxpbmtzWzBdID09PSBjdXJyZW50UGF0aCkge1xuICAgICAgb3ZlcnZpZXcgPSBjdXJyZW50UGF0aDtcbiAgICAgIGZpcnN0UGFnZSA9IG9ubHk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG92ZXJ2aWV3ID0gb25seTtcbiAgICAgIGZpcnN0UGFnZSA9IG9ubHlMaW5rc1swXTtcbiAgICB9XG4gIH1cbiAgaWYgKCFvdmVydmlldyB8fCAhZmlyc3RQYWdlKSByZXR1cm4gbnVsbDtcblxuICAvLyBXYWxrIHRoZSBjaGFpbjogb3ZlcnZpZXcgXHUyMTkyIGZpcnN0IHBhZ2UgXHUyMTkyIG5leHQgXHUyMTkyIG5leHQgXHUyMTkyIFx1MjAyNlxuICBjb25zdCBjaGFpbjogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgdmlzaXRlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBwdXNoID0gKHA6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHZvaWQgPT4ge1xuICAgIGlmIChwICYmICF2aXNpdGVkLmhhcyhwKSkge1xuICAgICAgdmlzaXRlZC5hZGQocCk7XG4gICAgICBjaGFpbi5wdXNoKHApO1xuICAgIH1cbiAgfTtcbiAgcHVzaChvdmVydmlldyk7XG4gIHB1c2goZmlyc3RQYWdlKTtcbiAgbGV0IGN1ciA9IGZpcnN0UGFnZTtcbiAgd2hpbGUgKGN1cikge1xuICAgIGNvbnN0IG5leHQgPSBnZXRMaW5rcyhjdXIpWzFdO1xuICAgIGlmICghbmV4dCB8fCB2aXNpdGVkLmhhcyhuZXh0KSkgYnJlYWs7IC8vIGVuZCBvZiBkZWNrIG9yIGN5Y2xlIGd1YXJkXG4gICAgcHVzaChuZXh0KTtcbiAgICBjdXIgPSBuZXh0O1xuICB9XG5cbiAgY29uc3QgaW5kZXggPSBjaGFpbi5pbmRleE9mKGN1cnJlbnRQYXRoKTtcbiAgaWYgKGluZGV4ID09PSAtMSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiB7IGNoYWluLCBpbmRleCB9O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdXAgdG8gYG1heGAgbm90ZSBuYW1lcyBmcm9tIGEgYGRlY2tgIHByb3BlcnR5IHZhbHVlLlxuICogQWNjZXB0cyBhIHNpbmdsZSBzdHJpbmcgb3IgYSBZQU1MIGxpc3Qgb2Ygc3RyaW5nczsgdW5xdW90ZWQgW1t4XV0gdmFsdWVzIGFyZVxuICogcGFyc2VkIGJ5IFlBTUwgYXMgbmVzdGVkIGFycmF5cyBhbmQgZmxhdHRlbmVkIGhlcmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0TGlua3ModmFsdWU6IHVua25vd24sIG1heDogbnVtYmVyID0gTUFYX0RFQ0tfTElOS1MpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGZsYXQ6IHVua25vd25bXSA9IFtdO1xuICBjb25zdCBjb2xsZWN0ID0gKHY6IHVua25vd24pOiB2b2lkID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHYpIGNvbGxlY3QoaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZsYXQucHVzaCh2KTtcbiAgICB9XG4gIH07XG4gIGNvbGxlY3QodmFsdWUpO1xuXG4gIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBpdGVtIG9mIGZsYXQpIHtcbiAgICBjb25zdCBuYW1lID0gZXh0cmFjdExpbmtUZXh0KGl0ZW0pO1xuICAgIGlmIChuYW1lKSBvdXQucHVzaChuYW1lKTtcbiAgICBpZiAob3V0Lmxlbmd0aCA+PSBtYXgpIGJyZWFrO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgdGFyZ2V0IG5vdGUgbmFtZSBmcm9tIGEgbWFya2Rvd24gbGluayBzdHJpbmcuXG4gKiBIYW5kbGVzIHNldmVyYWwgc2hhcGVzOlxuICogICBcIltbc2xpZGUtMl1dXCIgICAgICAgIFx1MjE5MiBzbGlkZS0yXG4gKiAgIFwiW1tzbGlkZS0yfGFsaWFzXV1cIiAgXHUyMTkyIHNsaWRlLTJcbiAqICAgXCJbW3NsaWRlLTIjc2VjdGlvbl1dXCJcdTIxOTIgc2xpZGUtMlxuICogICBzbGlkZS0yICAgICAgICAgICAgICBcdTIxOTIgc2xpZGUtMiAoYmFyZSBmaWxlbmFtZSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RMaW5rVGV4dCh2YWx1ZTogdW5rbm93bik6IHN0cmluZyB8IG51bGwge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgdHJpbW1lZCA9IHZhbHVlLnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHRyaW1tZWRcbiAgICAucmVwbGFjZSgvXlxcW1xcWy8sIFwiXCIpXG4gICAgLnJlcGxhY2UoL1xcXVxcXSQvLCBcIlwiKVxuICAgIC5zcGxpdChcInxcIilbMF1cbiAgICAuc3BsaXQoXCIjXCIpWzBdXG4gICAgLnRyaW0oKTtcbn1cblxuLyoqIFJlbmRlciBhIHByb3BlcnR5IHZhbHVlIGFzIHJlYWRhYmxlIHRleHQ6IGFycmF5cy9vYmplY3RzIFx1MjE5MiBKU09OLCBlbHNlIFN0cmluZyAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFZhbHVlKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybiBcIlx1MjAxNFwiO1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUE0Q0Esc0JBQXVFOzs7QUNsQ2hFLElBQU0saUJBQWlCO0FBeUJ2QixTQUFTLFlBQ2QsYUFDQSxVQUNpQjtBQUNqQixRQUFNLGVBQWUsU0FBUyxXQUFXO0FBQ3pDLE1BQUksYUFBYSxXQUFXLEVBQUcsUUFBTztBQUV0QyxNQUFJO0FBQ0osTUFBSTtBQUVKLE1BQUksYUFBYSxVQUFVLEdBQUc7QUFFNUIsZUFBVyxhQUFhLENBQUM7QUFDekIs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
