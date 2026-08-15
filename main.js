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
  default: () => NativeSlidesPlugin
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
function extractRawLinks(value, max = MAX_DECK_LINKS) {
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
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    out.push(trimmed);
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

// src/createNext.ts
function planCreateNext(input) {
  const { currentName, currentLinks, isOverview } = input;
  if (currentLinks.length === 0) return null;
  if (isOverview) {
    const oldFirst = currentLinks[0];
    if (!oldFirst) return null;
    const newName2 = uniqueName(`${currentName}-next`, input.existingNames);
    const back = input.overviewBackLink ?? `[[${currentName}]]`;
    return {
      newName: newName2,
      newDeckLinks: [back, oldFirst],
      rewrites: [{ name: currentName, deck: [`[[${newName2}]]`] }]
    };
  }
  const overviewLink = currentLinks[0];
  if (!overviewLink) return null;
  const nextLink = currentLinks[1];
  if (nextLink) {
    const nextName = extractLinkText(nextLink);
    if (nextName && isPlainName(nextName) && nextName !== currentName) {
      if (!input.existingNames.has(nextName)) {
        return {
          newName: nextName,
          newDeckLinks: [overviewLink],
          rewrites: []
        };
      }
      const newName2 = uniqueName(`${currentName}-next`, input.existingNames);
      return {
        newName: newName2,
        newDeckLinks: [overviewLink, nextLink],
        rewrites: [{ name: currentName, deck: [overviewLink, `[[${newName2}]]`] }]
      };
    }
  }
  const newName = uniqueName(`${currentName}-next`, input.existingNames);
  return {
    newName,
    newDeckLinks: [overviewLink],
    rewrites: [{ name: currentName, deck: [overviewLink, `[[${newName}]]`] }]
  };
}
function isPlainName(name) {
  return name.length > 0 && !name.includes("/") && !name.includes("\\");
}
function uniqueName(base, existing) {
  if (!existing.has(base)) return base;
  for (let i = 2; ; i++) {
    const candidate = `${base}-${i}`;
    if (!existing.has(candidate)) return candidate;
  }
}

// main.ts
var DEFAULT_SETTINGS = {
  showNavButtons: true,
  showPageNumber: true,
  barHidden: false,
  autoFullscreen: true,
  hideCardPropertiesInEdit: true,
  wysiwygMode: false
};
var DECK_KEY = "deck";
var NativeSlidesPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    /** The properties bar DOM element */
    this.bar = null;
    /** Whether fullscreen reading mode is currently active */
    this.fullscreen = false;
    /** Last refresh key ("path|mode") to avoid pointless re-renders */
    this.lastKey = "";
    /** Whether the right-sidebar Properties view was auto-opened this session */
    this.sidebarOpenedThisSession = false;
    /** Plugin settings */
    this.settings = { ...DEFAULT_SETTINGS };
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new NativeSlidesSettingTab(this));
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
      id: "ns-toggle-bar",
      name: "Toggle Properties Bar",
      callback: async () => {
        this.settings.barHidden = !this.settings.barHidden;
        await this.saveSettings();
        this.refresh();
      }
    });
    this.addCommand({
      id: "ns-toggle-fullscreen",
      name: "Pause/Resume Auto Fullscreen",
      callback: async () => {
        this.settings.autoFullscreen = !this.settings.autoFullscreen;
        await this.saveSettings();
        if (!this.settings.autoFullscreen) this.syncFullscreen(false);
        else this.refresh();
      }
    });
    this.addCommand({
      id: "ns-prev",
      name: "Previous Page",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "ArrowLeft" }],
      callback: () => this.navigate("prev")
    });
    this.addCommand({
      id: "ns-next",
      name: "Next Page",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "ArrowRight" }],
      callback: () => this.navigate("next")
    });
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
      }
    });
    this.addCommand({
      id: "ns-toggle-wysiwyg",
      name: "Toggle WYSIWYG Mode",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "W" }],
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;
        const fm = this.frontmatterOf(file);
        if (fm === null || !(DECK_KEY in fm)) return false;
        if (!checking) this.toggleWysiwyg();
        return true;
      }
    });
    this.registerDomEvent(document, "fullscreenchange", () => {
      if (!document.fullscreenElement && this.fullscreen) {
        this.fullscreen = false;
        document.body.classList.remove("native-slides-fullscreen");
        const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
        if (view && view.getMode() === "preview") {
          const state = view.leaf.getViewState();
          state.state = { ...state.state, mode: "source" };
          void view.leaf.setViewState(state, { focus: false });
        }
      }
    });
    this.bar = document.createElement("div");
    this.bar.className = "native-slides-bar";
    this.bar.style.display = "none";
    document.body.appendChild(this.bar);
    this.refresh();
  }
  onunload() {
    this.bar?.remove();
    this.bar = null;
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {
    });
    document.body.classList.remove("native-slides-fullscreen");
    document.body.classList.remove("native-slides-wysiwyg");
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
  /** Names in the `deck` property that resolve to no note (broken links) */
  brokenDeckLinks(file) {
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
  planCreateNext(file) {
    const fm = this.frontmatterOf(file);
    const raw = fm ? extractRawLinks(fm[DECK_KEY]) : [];
    if (raw.length === 0) return null;
    const deck = this.computeDeck(file);
    const existingNames = new Set(this.app.vault.getMarkdownFiles().map((f) => f.basename));
    if (deck) {
      let overviewBackLink;
      if (deck.index === 0) {
        const oldFirst = deck.chain[1] ? this.app.vault.getAbstractFileByPath(deck.chain[1]) : null;
        if (oldFirst instanceof import_obsidian.TFile) {
          const f2 = this.frontmatterOf(oldFirst);
          overviewBackLink = f2 ? extractRawLinks(f2[DECK_KEY])[0] : void 0;
        }
      }
      return planCreateNext({
        currentName: file.basename,
        currentLinks: raw,
        isOverview: deck.index === 0,
        overviewBackLink,
        existingNames
      });
    }
    const overviewName = raw.length >= 2 ? extractLinks(raw[0])[0] : null;
    if (overviewName && this.app.metadataCache.getFirstLinkpathDest(overviewName, file.path)) {
      return planCreateNext({
        currentName: file.basename,
        currentLinks: raw,
        isOverview: false,
        existingNames
      });
    }
    return null;
  }
  /** Apply a plan: create the note, rewire `deck` properties, open it */
  async executeCreateNext(file, plan) {
    const dir = file.parent?.path ? file.parent.path + "/" : "";
    const newPath = `${dir}${plan.newName}.md`;
    const frontmatter = plan.newDeckLinks.map((link) => JSON.stringify(link)).join(", ");
    const content = `---
deck: [${frontmatter}]
---
`;
    let newFile;
    try {
      newFile = await this.app.vault.create(newPath, content);
    } catch (error) {
      new import_obsidian.Notice(`Native Slides: could not create "${plan.newName}.md" (${String(error)})`);
      return;
    }
    for (const rewrite of plan.rewrites) {
      if (rewrite.name !== file.basename) continue;
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        fm[DECK_KEY] = rewrite.deck;
      });
    }
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(newFile, { state: { mode: "source" } });
  }
  /** Open the built-in "Properties view: Show file properties" panel */
  async showFileProperties() {
    const commands = this.app.commands;
    if (!commands?.executeCommandById) return;
    const id = Object.entries(commands.commands ?? {}).find(
      ([, c]) => /(?:show|display).*file.*properties|(?:显示|打开).*文件.*属性/i.test(c.name ?? "")
    )?.[0];
    if (id) await commands.executeCommandById(id);
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
    const cardFm = file ? this.frontmatterOf(file) : null;
    const isCard = cardFm !== null && DECK_KEY in cardFm;
    document.body.classList.toggle(
      "native-slides-card",
      isCard && this.settings.hideCardPropertiesInEdit
    );
    document.body.classList.toggle("native-slides-wysiwyg", isCard && this.settings.wysiwygMode);
    if (isCard && this.settings.hideCardPropertiesInEdit && mode === "source" && !this.sidebarOpenedThisSession) {
      this.sidebarOpenedThisSession = true;
      void this.showFileProperties();
    }
    this.syncFullscreen(mode === "preview" && this.settings.autoFullscreen);
    if (!file || mode !== "preview" || this.settings.barHidden) {
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
      nav.className = "native-slides-nav";
      nav.appendChild(this.navButton("\u25C0", "Previous page", () => this.navigate("prev"), !hasPrev));
      nav.appendChild(this.navButton("\u25B6", "Next page", () => this.navigate("next"), !hasNext));
      this.bar.appendChild(nav);
    }
    const visible = fm ? Object.entries(fm).filter(([key]) => key !== DECK_KEY && key !== "position") : [];
    for (const [key, value] of visible) {
      const span = document.createElement("span");
      span.className = "native-slides-item";
      const k = document.createElement("strong");
      k.textContent = key;
      span.appendChild(k);
      span.appendChild(document.createTextNode(": " + formatValue(value)));
      this.bar.appendChild(span);
    }
    const broken = file ? this.brokenDeckLinks(file) : [];
    if (broken.length > 0) {
      const warn = document.createElement("span");
      warn.className = "native-slides-warn";
      warn.textContent = "\u26A0 " + broken.join(", ");
      warn.title = "Broken deck link(s) \u2014 the target note does not exist";
      this.bar.appendChild(warn);
    }
    if (isCard) {
      const btn = document.createElement("button");
      btn.className = "native-slides-wysiwyg-btn" + (this.settings.wysiwygMode ? " is-active" : "");
      btn.textContent = this.settings.wysiwygMode ? "WYSIWYG: On" : "WYSIWYG: Off";
      btn.title = "Toggle WYSIWYG mode \u2014 unified typography between edit and reading";
      btn.addEventListener("click", () => this.toggleWysiwyg());
      this.bar.appendChild(btn);
    }
    if (this.settings.showPageNumber && deck) {
      const page = document.createElement("span");
      page.className = "native-slides-page";
      page.textContent = deck.index === 0 ? "Overview" : `Page ${deck.index}`;
      this.bar.appendChild(page);
    }
    this.bar.style.display = this.bar.childElementCount === 0 ? "none" : "";
  }
  /** Build a ◀ / ▶ navigation button; `disabled` renders it light gray/inactive */
  navButton(label, tip, onClick, disabled = false) {
    const btn = document.createElement("button");
    btn.className = "native-slides-nav-btn";
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
    document.body.classList.toggle("native-slides-fullscreen", active);
    if (active) {
      document.documentElement.requestFullscreen?.().catch(() => {
      });
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {
      });
    }
  }
  /** Toggle the WYSIWYG mode (persisted; only reachable on deck notes) */
  toggleWysiwyg() {
    this.settings.wysiwygMode = !this.settings.wysiwygMode;
    void this.saveSettings();
    this.refresh();
  }
};
var NativeSlidesSettingTab = class extends import_obsidian.PluginSettingTab {
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
    new import_obsidian.Setting(containerEl).setName("Auto fullscreen in reading view").setDesc(
      "Enter the immersive fullscreen reading mode automatically when switching to reading view (also toggleable via the Pause/Resume Auto Fullscreen command)"
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoFullscreen).onChange(async (value) => {
        this.plugin.settings.autoFullscreen = value;
        await this.plugin.saveSettings();
        this.plugin.refresh();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Hide in-note properties in edit mode (deck notes)").setDesc(
      "For deck (card) notes in Live Preview, the in-note properties panel is always hidden (WYSIWYG \u2014 same as reading view). Edit them in the right-sidebar Properties view (opened automatically the first time a deck note is activated in a session) or in Source mode."
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.hideCardPropertiesInEdit).onChange(async (value) => {
        this.plugin.settings.hideCardPropertiesInEdit = value;
        await this.plugin.saveSettings();
        this.plugin.refresh();
      })
    );
    new import_obsidian.Setting(containerEl).setName("WYSIWYG mode (deck notes)").setDesc(
      "Unified typography between edit and reading views for deck notes (tab bar hides in reading; the bottom bar takes its place). Toggle from the command palette, the Mod+Shift+W hotkey, or the bottom-bar button."
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.wysiwygMode).onChange(async (value) => {
        this.plugin.settings.wysiwygMode = value;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvZGVjay50cyIsICJzcmMvY3JlYXRlTmV4dC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBuYXRpdmUtc2xpZGVzIFx1MjAxNCByZWFkaW5nLXZpZXcgcHJvcGVydGllcyBiYXIgd2l0aCBQUFQtc3R5bGUgZGVjayBuYXZpZ2F0aW9uXG4gKlxuICogRmVhdHVyZXM6XG4gKiAgIDEuIEhpZGVzIE9ic2lkaWFuJ3MgbmF0aXZlIHN0YXR1cyBiYXIgYW5kIHJlbmRlcnMgYSBcInByb3BlcnRpZXMgYmFyXCIgYXQgdGhlXG4gKiAgICAgIGJvdHRvbSBvZiB0aGUgd2luZG93LlxuICogICAyLiBJbiByZWFkaW5nIHZpZXcsIHNob3dzIHRoZSBjdXJyZW50IG5vdGUncyBwcm9wZXJ0aWVzIChZQU1MIGZyb250bWF0dGVyKVxuICogICAgICBhcyBjaGlwcyBpbiB0aGF0IGJhci5cbiAqICAgMy4gUmVhZGluZyB2aWV3IGF1dG8tZW50ZXJzIGEgZnVsbHNjcmVlbi1saWtlIG1vZGU6IHRoZSByaWJib24sIHNpZGViYXJzLFxuICogICAgICB0YWIgYmFyIGFuZCB0aGUgcGFuZSBoZWFkZXIgYmFyIGFyZSBoaWRkZW47IGxlYXZpbmcgcmVhZGluZyB2aWV3XG4gKiAgICAgIHJlc3RvcmVzIHRoZW0gYXV0b21hdGljYWxseS4gUHJlc3NpbmcgRXNjIHRvIGxlYXZlIHRoZSBPUyBmdWxsc2NyZWVuXG4gKiAgICAgIGFsc28gZXhpdHMgcmVhZGluZyB2aWV3LlxuICogICA0LiBIaWRlcyB0aGUgaW4tbm90ZSBwcm9wZXJ0aWVzIHBhbmVsIGluIHJlYWRpbmcgdmlldyAoa2VwdCBpbiBlZGl0IHZpZXcpLlxuICogICA1LiBQUFQtc3R5bGUgZGVjayBuYXZpZ2F0aW9uIGRyaXZlbiBieSBPTkUgcmVzZXJ2ZWQgZnJvbnRtYXR0ZXIga2V5LCBgZGVja2AsXG4gKiAgICAgIGhvbGRpbmcgdXAgdG8gdHdvIG1hcmtkb3duIGxpbmtzOlxuICogICAgICAgIC0gb3ZlcnZpZXcgbm90ZSA6IGRlY2s6IFtcIltbZmlyc3Qtc2xpZGVdXVwiXSAgICAgICAgICAgIChvbmUgbGluayA9IHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0IHBhZ2Ugb2YgdGhlIGRlY2s7IHRoZSBub3RlIGlzIHRoZSBvdmVydmlldylcbiAqICAgICAgICAtIHNsaWRlIG5vdGUgICAgOiBkZWNrOiBbXCJbW292ZXJ2aWV3XV1cIiwgXCJbW25leHQtc2xpZGVdXVwiXVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIChmaXJzdCBsaW5rID0gdGhlIG92ZXJ2aWV3IHBhZ2UsIHNlY29uZCBsaW5rID0gdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCBzbGlkZTsgb21pdCB0aGUgc2Vjb25kIGxpbmsgb24gdGhlIGxhc3Qgc2xpZGUpXG4gKiAgICAgIFRoZSBwYWdlIG51bWJlciBpcyBjb21wdXRlZCBhdXRvbWF0aWNhbGx5IGJ5IHNjYW5uaW5nIHRoZSB2YXVsdCBhbmRcbiAqICAgICAgd2Fsa2luZyB0aGUgY2hhaW4gb2YgbGlua3MsIHNvIG5vIGBwYWdlLW51bWJlcmAgcHJvcGVydHkgaXMgbmVlZGVkLlxuICogICAgICBcdTI1QzAgXHUyNUI2IGJ1dHRvbnMgYXBwZWFyIG9uIHRoZSBsZWZ0IG9mIHRoZSBiYXIsIGFuZCBcIlByZXZpb3VzIFBhZ2VcIiAvIFwiTmV4dFxuICogICAgICBQYWdlXCIgY29tbWFuZHMgYXJlIHJlZ2lzdGVyZWQgKGRlZmF1bHQgaG90a2V5cyBNb2QrU2hpZnQrXHUyMTkwIC8gTW9kK1NoaWZ0K1x1MjE5MixcbiAqICAgICAgcmViaW5kYWJsZSB1bmRlciBTZXR0aW5ncyBcdTIxOTIgSG90a2V5cykuXG4gKiAgIDYuIEEgc2V0dGluZ3MgdGFiIHRvZ2dsZXMgdGhlIFx1MjVDMCBcdTI1QjYgYnV0dG9ucyBhbmQgdGhlIHBhZ2UgbnVtYmVyLlxuICogICA3LiBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIgY29tbWFuZDogY3JlYXRlcyBhIG5ldyBzbGlkZSByaWdodCBhZnRlciB0aGVcbiAqICAgICAgY3VycmVudCBvbmUgKG5hbWUtY29sbGlzaW9uIGF3YXJlKSwgcmV3aXJlcyB0aGUgYGRlY2tgIHByb3BlcnRpZXMgb2ZcbiAqICAgICAgYm90aCBub3RlcywgYW5kIG9wZW5zIHRoZSBuZXcgbm90ZSBpbiBlZGl0IG1vZGUuXG4gKiAgIDguIFwiVG9nZ2xlIFdZU0lXWUcgTW9kZVwiIChjb21tYW5kICsgaG90a2V5ICsgYm90dG9tLWJhciBidXR0b24sIGRlY2tcbiAqICAgICAgbm90ZXMgb25seSk6IHN3aXRjaGVzIHRvIHVuaWZpZWQgZWRpdC9yZWFkaW5nIHR5cG9ncmFwaHkgXHUyMDE0IGxhdGVyXG4gKiAgICAgIHBoYXNlcyBhZGQgdGhlIHRhYi1iYXIgc3ltbWV0cnkgYW5kIHRoZSB0eXBvZ3JhcGh5IENTUyBzY29wZWRcbiAqICAgICAgdW5kZXIgYm9keS5uYXRpdmUtc2xpZGVzLXd5c2l3eWcuXG4gKlxuICogVGhlIGRlY2sgdXN1YWxseSBzdGFydHMgZnJvbSBhbiBvdmVydmlldyBub3RlIHRoYXQgZW1iZWRzIGFuIE9ic2lkaWFuIEJhc2VcbiAqIHZpZXcgKGNvcmUgXCJCYXNlc1wiIHBsdWdpbikgZmlsdGVyaW5nIG5vdGVzIHRoYXQgbGluayB0byB0aGUgb3ZlcnZpZXcgcGFnZTpcbiAqXG4gKiAgIGBgYGJhc2VcbiAqICAgZmlsdGVyczpcbiAqICAgICBhbmQ6XG4gKiAgICAgICAtIGZpbGUuaGFzTGluayhcIm92ZXJ2aWV3XCIpXG4gKiAgIHZpZXdzOlxuICogICAgIC0gdHlwZTogdGFibGVcbiAqICAgICAgIG5hbWU6IERlY2tcbiAqICAgYGBgXG4gKlxuICogV2h5IHJlYWQgcHJvcGVydGllcyB2aWEgbWV0YWRhdGFDYWNoZSBpbnN0ZWFkIG9mIHBhcnNpbmcgWUFNTCBtYW51YWxseT9cbiAqICAgT2JzaWRpYW4gbWFpbnRhaW5zIGEgY2FjaGUgcGVyIG5vdGU7IG1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpXG4gKiAgIC5mcm9udG1hdHRlciByZXR1cm5zIHRoZSBwYXJzZWQgcHJvcGVydGllcywgdXBkYXRlZCBhdXRvbWF0aWNhbGx5IG9uIHNhdmUuXG4gKi9cblxuaW1wb3J0IHsgTWFya2Rvd25WaWV3LCBOb3RpY2UsIFBsdWdpbiwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZywgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IHBsYW5DcmVhdGVOZXh0LCB0eXBlIENyZWF0ZU5leHRSZXN1bHQgfSBmcm9tIFwiLi9zcmMvY3JlYXRlTmV4dFwiO1xuaW1wb3J0IHsgY29tcHV0ZURlY2ssIGV4dHJhY3RMaW5rcywgZXh0cmFjdFJhd0xpbmtzLCBmb3JtYXRWYWx1ZSwgdHlwZSBEZWNrSW5mbyB9IGZyb20gXCIuL3NyYy9kZWNrXCI7XG5cbi8qKiBQbHVnaW4gc2V0dGluZ3MgKi9cbmludGVyZmFjZSBOYXRpdmVTbGlkZXNTZXR0aW5ncyB7XG4gIC8qKiBTaG93IFx1MjVDMCBcdTI1QjYgcHJldmlvdXMvbmV4dCBidXR0b25zIG9uIHRoZSBsZWZ0IG9mIHRoZSBiYXIgKi9cbiAgc2hvd05hdkJ1dHRvbnM6IGJvb2xlYW47XG4gIC8qKiBTaG93IHRoZSBhdXRvLWNvbXB1dGVkIHBhZ2UgbnVtYmVyIGF0IHRoZSBib3R0b20tcmlnaHQgb2YgdGhlIGJhciAqL1xuICBzaG93UGFnZU51bWJlcjogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgdGhlIHVzZXIgbWFudWFsbHkgaGlkIHRoZSBiYXIgKHRvZ2dsZSBjb21tYW5kKSAqL1xuICBiYXJIaWRkZW46IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIGF1dG8tZnVsbHNjcmVlbiBpbiByZWFkaW5nIHZpZXcgaXMgZW5hYmxlZCAqL1xuICBhdXRvRnVsbHNjcmVlbjogYm9vbGVhbjtcbiAgLyoqIEhpZGUgYSBmb2xkZWQgcHJvcGVydGllcyBwYW5lbCBjb21wbGV0ZWx5IGluIExpdmUgUHJldmlldyBmb3IgZGVjayBub3RlcyAqL1xuICBoaWRlQ2FyZFByb3BlcnRpZXNJbkVkaXQ6IGJvb2xlYW47XG4gIC8qKiBXWVNJV1lHIG1vZGUgKHVuaWZpZWQgZWRpdC9yZWFkaW5nIHR5cG9ncmFwaHkpIFx1MjAxNCBkZWNrIG5vdGVzIG9ubHkgKi9cbiAgd3lzaXd5Z01vZGU6IGJvb2xlYW47XG59XG5cbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IE5hdGl2ZVNsaWRlc1NldHRpbmdzID0ge1xuICBzaG93TmF2QnV0dG9uczogdHJ1ZSxcbiAgc2hvd1BhZ2VOdW1iZXI6IHRydWUsXG4gIGJhckhpZGRlbjogZmFsc2UsXG4gIGF1dG9GdWxsc2NyZWVuOiB0cnVlLFxuICBoaWRlQ2FyZFByb3BlcnRpZXNJbkVkaXQ6IHRydWUsXG4gIHd5c2l3eWdNb2RlOiBmYWxzZSxcbn07XG5cbi8qKiBSZXNlcnZlZCBmcm9udG1hdHRlciBrZXkgZHJpdmluZyBkZWNrIG5hdmlnYXRpb24gKG5ldmVyIHJlbmRlcmVkIGFzIGEgY2hpcCkgKi9cbmNvbnN0IERFQ0tfS0VZID0gXCJkZWNrXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE5hdGl2ZVNsaWRlc1BsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIC8qKiBUaGUgcHJvcGVydGllcyBiYXIgRE9NIGVsZW1lbnQgKi9cbiAgcHJpdmF0ZSBiYXI6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIC8qKiBXaGV0aGVyIGZ1bGxzY3JlZW4gcmVhZGluZyBtb2RlIGlzIGN1cnJlbnRseSBhY3RpdmUgKi9cbiAgcHJpdmF0ZSBmdWxsc2NyZWVuID0gZmFsc2U7XG4gIC8qKiBMYXN0IHJlZnJlc2gga2V5IChcInBhdGh8bW9kZVwiKSB0byBhdm9pZCBwb2ludGxlc3MgcmUtcmVuZGVycyAqL1xuICBwcml2YXRlIGxhc3RLZXkgPSBcIlwiO1xuICAvKiogV2hldGhlciB0aGUgcmlnaHQtc2lkZWJhciBQcm9wZXJ0aWVzIHZpZXcgd2FzIGF1dG8tb3BlbmVkIHRoaXMgc2Vzc2lvbiAqL1xuICBwcml2YXRlIHNpZGViYXJPcGVuZWRUaGlzU2Vzc2lvbiA9IGZhbHNlO1xuICAvKiogUGx1Z2luIHNldHRpbmdzICovXG4gIHNldHRpbmdzOiBOYXRpdmVTbGlkZXNTZXR0aW5ncyA9IHsgLi4uREVGQVVMVF9TRVRUSU5HUyB9O1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgTmF0aXZlU2xpZGVzU2V0dGluZ1RhYih0aGlzKSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMS4gUmVmcmVzaCBvbiBcImN1cnJlbnQgbm90ZSAvIHZpZXcgY2hhbmdlZFwiIGV2ZW50cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsICgpID0+IHRoaXMucmVmcmVzaCgpKSk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAoKSA9PiB0aGlzLnJlZnJlc2goKSkpO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJsYXlvdXQtY2hhbmdlXCIsICgpID0+IHRoaXMucmVmcmVzaCgpKSk7XG4gICAgLy8gUmVmcmVzaCB3aGVuIHRoZSBub3RlIGNvbnRlbnQgKGluY2x1ZGluZyBmcm9udG1hdHRlcikgY2hhbmdlcyAvIHNhdmVzXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5vbihcImNoYW5nZWRcIiwgKGZpbGU6IFRGaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlID09PSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpKSB0aGlzLnJlZnJlc2goKTtcbiAgICAgIH0pLFxuICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMi4gRmFsbGJhY2sgdGltZXI6IGVkaXRcdTIxOTRyZWFkaW5nIHRvZ2dsZXMgbWF5IGZpcmUgbm8gc3RhbmRhcmQgZXZlbnQgXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5yZWdpc3RlckludGVydmFsKFxuICAgICAgd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGNvbnN0IGtleSA9IGZpbGUgPyBgJHtmaWxlLnBhdGh9fCR7dGhpcy5jdXJyZW50TW9kZSgpfWAgOiBcIlwiO1xuICAgICAgICBpZiAoa2V5ICE9PSB0aGlzLmxhc3RLZXkpIHtcbiAgICAgICAgICB0aGlzLmxhc3RLZXkgPSBrZXk7XG4gICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgIH1cbiAgICAgIH0sIDUwMCksXG4gICAgKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCAzLiBDb21tYW5kcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICAvLyAzYS4gTWFudWFsbHkgc2hvdyAvIGhpZGUgdGhlIHByb3BlcnRpZXMgYmFyXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLXRvZ2dsZS1iYXJcIixcbiAgICAgIG5hbWU6IFwiVG9nZ2xlIFByb3BlcnRpZXMgQmFyXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgICB0aGlzLnNldHRpbmdzLmJhckhpZGRlbiA9ICF0aGlzLnNldHRpbmdzLmJhckhpZGRlbjtcbiAgICAgICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIC8vIDNiLiBQYXVzZSAvIHJlc3VtZSBhdXRvLWZ1bGxzY3JlZW4gaW4gcmVhZGluZyB2aWV3XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLXRvZ2dsZS1mdWxsc2NyZWVuXCIsXG4gICAgICBuYW1lOiBcIlBhdXNlL1Jlc3VtZSBBdXRvIEZ1bGxzY3JlZW5cIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MuYXV0b0Z1bGxzY3JlZW4gPSAhdGhpcy5zZXR0aW5ncy5hdXRvRnVsbHNjcmVlbjtcbiAgICAgICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgLy8gV2hlbiBwYXVzZWQsIHJlc3RvcmUgdGhlIGxheW91dCBpbW1lZGlhdGVseTsgd2hlbiByZXN1bWVkLCByZS1zeW5jXG4gICAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5hdXRvRnVsbHNjcmVlbikgdGhpcy5zeW5jRnVsbHNjcmVlbihmYWxzZSk7XG4gICAgICAgIGVsc2UgdGhpcy5yZWZyZXNoKCk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIC8vIDNjLiBQcmV2aW91cyAvIG5leHQgcGFnZSAoZGVjayBuYXZpZ2F0aW9uLCByZWJpbmRhYmxlIGluIFNldHRpbmdzIFx1MjE5MiBIb3RrZXlzKVxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJucy1wcmV2XCIsXG4gICAgICBuYW1lOiBcIlByZXZpb3VzIFBhZ2VcIixcbiAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJBcnJvd0xlZnRcIiB9XSxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLm5hdmlnYXRlKFwicHJldlwiKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibnMtbmV4dFwiLFxuICAgICAgbmFtZTogXCJOZXh0IFBhZ2VcIixcbiAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJBcnJvd1JpZ2h0XCIgfV0sXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5uYXZpZ2F0ZShcIm5leHRcIiksXG4gICAgfSk7XG4gICAgLy8gM2QuIENyZWF0ZSBOZXh0IFNsaWRlIFx1MjAxNCBuZXcgc2xpZGUgYWZ0ZXIgdGhlIGN1cnJlbnQgb25lIChkZWNrIG5vdGVzIG9ubHkpXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLWNyZWF0ZS1uZXh0XCIsXG4gICAgICBuYW1lOiBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIsXG4gICAgICAvLyBHcmV5ZWQgb3V0IGluIHRoZSBwYWxldHRlIHVubGVzcyB0aGUgYWN0aXZlIG5vdGUgY2FuIHRha2UgYSBuZXh0IHNsaWRlXG4gICAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmcpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGlmICghZmlsZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBjb25zdCBwbGFuID0gdGhpcy5wbGFuQ3JlYXRlTmV4dChmaWxlKTtcbiAgICAgICAgaWYgKCFwbGFuKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghY2hlY2tpbmcpIHZvaWQgdGhpcy5leGVjdXRlQ3JlYXRlTmV4dChmaWxlLCBwbGFuKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIC8vIDNlLiBUb2dnbGUgV1lTSVdZRyBtb2RlIFx1MjAxNCB1bmlmaWVkIGVkaXQvcmVhZGluZyB0eXBvZ3JhcGh5IChkZWNrIG5vdGVzIG9ubHkpXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLXRvZ2dsZS13eXNpd3lnXCIsXG4gICAgICBuYW1lOiBcIlRvZ2dsZSBXWVNJV1lHIE1vZGVcIixcbiAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJXXCIgfV0sXG4gICAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmcpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGlmICghZmlsZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBjb25zdCBmbSA9IHRoaXMuZnJvbnRtYXR0ZXJPZihmaWxlKTtcbiAgICAgICAgaWYgKGZtID09PSBudWxsIHx8ICEoREVDS19LRVkgaW4gZm0pKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghY2hlY2tpbmcpIHRoaXMudG9nZ2xlV3lzaXd5ZygpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgNC4gRXNjIGV4aXRzIE9TIGZ1bGxzY3JlZW4gXHUyMTkyIGxlYXZlIHJlYWRpbmcgdmlldyBhcyB3ZWxsIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIC8vIEtlZXBzIGludGVybmFsIHN0YXRlIGluIHN5bmMgd2hlbiB0aGUgdXNlciBwcmVzc2VzIEVzYzsgYWxzbyBzd2l0Y2hlc1xuICAgIC8vIHRoZSBhY3RpdmUgTWFya2Rvd24gdmlldyBiYWNrIHRvIGVkaXQgbW9kZS4gT3VyIG93biBleGl0RnVsbHNjcmVlbigpXG4gICAgLy8gY2FsbHMgc2V0IHRoaXMuZnVsbHNjcmVlbiA9IGZhbHNlIGZpcnN0LCBzbyB0aGV5IG5ldmVyIHRyaWdnZXIgdGhpcy5cbiAgICB0aGlzLnJlZ2lzdGVyRG9tRXZlbnQoZG9jdW1lbnQsIFwiZnVsbHNjcmVlbmNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBpZiAoIWRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50ICYmIHRoaXMuZnVsbHNjcmVlbikge1xuICAgICAgICB0aGlzLmZ1bGxzY3JlZW4gPSBmYWxzZTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKFwibmF0aXZlLXNsaWRlcy1mdWxsc2NyZWVuXCIpO1xuICAgICAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICAgICAgaWYgKHZpZXcgJiYgdmlldy5nZXRNb2RlKCkgPT09IFwicHJldmlld1wiKSB7XG4gICAgICAgICAgLy8gTGVhdmUgcmVhZGluZyB2aWV3IHZpYSB0aGUgcHVibGljIHZpZXctc3RhdGUgQVBJXG4gICAgICAgICAgY29uc3Qgc3RhdGUgPSB2aWV3LmxlYWYuZ2V0Vmlld1N0YXRlKCk7XG4gICAgICAgICAgc3RhdGUuc3RhdGUgPSB7IC4uLnN0YXRlLnN0YXRlLCBtb2RlOiBcInNvdXJjZVwiIH07XG4gICAgICAgICAgdm9pZCB2aWV3LmxlYWYuc2V0Vmlld1N0YXRlKHN0YXRlLCB7IGZvY3VzOiBmYWxzZSB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDUuIENyZWF0ZSB0aGUgYmFyIGFuZCBkbyB0aGUgZmlyc3QgcmVuZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIHRoaXMuYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLmJhci5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtYmFyXCI7XG4gICAgdGhpcy5iYXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiOyAvLyBoaWRkZW4gdW50aWwgcmVmcmVzaCgpIGRlY2lkZXMgb3RoZXJ3aXNlXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmJhcik7XG4gICAgdGhpcy5yZWZyZXNoKCk7XG4gIH1cblxuICBvbnVubG9hZCgpOiB2b2lkIHtcbiAgICB0aGlzLmJhcj8ucmVtb3ZlKCk7XG4gICAgdGhpcy5iYXIgPSBudWxsO1xuICAgIC8vIExlYXZlIE9TIGZ1bGxzY3JlZW4gYW5kIGRyb3AgdGhlIGZ1bGxzY3JlZW4gY2xhc3Mgc28gbm8gVUkgcmVzaWR1ZSByZW1haW5zXG4gICAgaWYgKGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50KSBkb2N1bWVudC5leGl0RnVsbHNjcmVlbj8uKCkuY2F0Y2goKCkgPT4ge30pO1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShcIm5hdGl2ZS1zbGlkZXMtZnVsbHNjcmVlblwiKTtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoXCJuYXRpdmUtc2xpZGVzLXd5c2l3eWdcIik7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU2V0dGluZ3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgRGVjayByZXNvbHV0aW9uICh3YWxrIHRoZSBsaW5rIGNoYWluKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICAvKiogUmVzb2x2ZSB0aGUgY3VycmVudCBub3RlJ3MgcG9zaXRpb24gaW5zaWRlIGl0cyBkZWNrIChwYXRoLWJhc2VkIHdyYXBwZXIpICovXG4gIHByaXZhdGUgY29tcHV0ZURlY2soZmlsZTogVEZpbGUpOiBEZWNrSW5mbyB8IG51bGwge1xuICAgIHJldHVybiBjb21wdXRlRGVjayhmaWxlLnBhdGgsIChwYXRoKSA9PiB0aGlzLmRlY2tMaW5rUGF0aHMocGF0aCkpO1xuICB9XG5cbiAgLyoqIFJlc29sdmUgdGhlIGBkZWNrYCBwcm9wZXJ0eSBvZiBhIG5vdGUgaW50byByZWFsIG5vdGUgcGF0aHMgKG1heCB0d28pICovXG4gIHByaXZhdGUgZGVja0xpbmtQYXRocyhwYXRoOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZiA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcbiAgICBpZiAoIShmIGluc3RhbmNlb2YgVEZpbGUpKSByZXR1cm4gW107XG4gICAgY29uc3QgZm0gPSB0aGlzLmZyb250bWF0dGVyT2YoZik7XG4gICAgY29uc3QgbmFtZXMgPSBmbSA/IGV4dHJhY3RMaW5rcyhmbVtERUNLX0tFWV0pIDogW107XG4gICAgcmV0dXJuIG5hbWVzXG4gICAgICAubWFwKChuYW1lKSA9PiB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KG5hbWUsIHBhdGgpKVxuICAgICAgLmZpbHRlcigoeCk6IHggaXMgVEZpbGUgPT4gISF4KVxuICAgICAgLm1hcCgoeCkgPT4geC5wYXRoKTtcbiAgfVxuXG4gIC8qKiBOYW1lcyBpbiB0aGUgYGRlY2tgIHByb3BlcnR5IHRoYXQgcmVzb2x2ZSB0byBubyBub3RlIChicm9rZW4gbGlua3MpICovXG4gIHByaXZhdGUgYnJva2VuRGVja0xpbmtzKGZpbGU6IFRGaWxlKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGZtID0gdGhpcy5mcm9udG1hdHRlck9mKGZpbGUpO1xuICAgIGNvbnN0IG5hbWVzID0gZm0gPyBleHRyYWN0TGlua3MoZm1bREVDS19LRVldKSA6IFtdO1xuICAgIHJldHVybiBuYW1lcy5maWx0ZXIoKG5hbWUpID0+ICF0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KG5hbWUsIGZpbGUucGF0aCkpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIENyZWF0ZSBOZXh0IFNsaWRlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKlxuICAgKiBQbGFuIGEgXCJDcmVhdGUgTmV4dCBTbGlkZVwiIHJ1biBmb3IgdGhlIGFjdGl2ZSBub3RlLCBvciBudWxsIHdoZW4gdGhlXG4gICAqIG5vdGUgY2Fubm90IHRha2UgYSBuZXh0IHNsaWRlIChubyB1c2FibGUgYGRlY2tgIHByb3BlcnR5KS5cbiAgICpcbiAgICogU2xpZGVzIG9uIHRoZSBjaGFpbiBpbnNlcnQvYXBwZW5kIGFmdGVyIHRoZSBjdXJyZW50IG5vdGU7IHRoZSBvdmVydmlld1xuICAgKiBwYWdlIGluc2VydHMgYSBuZXcgZmlyc3QgcGFnZTsgYW4gb2ZmLWNoYWluIG5vdGUgd2l0aCBhIHJlc29sdmFibGVcbiAgICogb3ZlcnZpZXcgbGluayBzdGlsbCBnZXRzIGl0cyBkZWNsYXJlZCBtaXNzaW5nIG5leHQgbm90ZSBjcmVhdGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBwbGFuQ3JlYXRlTmV4dChmaWxlOiBURmlsZSk6IENyZWF0ZU5leHRSZXN1bHQgfCBudWxsIHtcbiAgICBjb25zdCBmbSA9IHRoaXMuZnJvbnRtYXR0ZXJPZihmaWxlKTtcbiAgICBjb25zdCByYXcgPSBmbSA/IGV4dHJhY3RSYXdMaW5rcyhmbVtERUNLX0tFWV0pIDogW107XG4gICAgaWYgKHJhdy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuXG4gICAgY29uc3QgZGVjayA9IHRoaXMuY29tcHV0ZURlY2soZmlsZSk7XG4gICAgY29uc3QgZXhpc3RpbmdOYW1lcyA9IG5ldyBTZXQodGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpLm1hcCgoZikgPT4gZi5iYXNlbmFtZSkpO1xuXG4gICAgaWYgKGRlY2spIHtcbiAgICAgIC8vIE92ZXJ2aWV3IGluc2VydGlvbiBuZWVkcyB0aGUgb2xkIGZpcnN0IHBhZ2UncyBiYWNrIGxpbmsgdG8gdGhlXG4gICAgICAvLyBvdmVydmlldyAoaXRzIG93biBmcm9udG1hdHRlciBvbmx5IGxpbmtzIGZvcndhcmQpLlxuICAgICAgbGV0IG92ZXJ2aWV3QmFja0xpbms6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChkZWNrLmluZGV4ID09PSAwKSB7XG4gICAgICAgIGNvbnN0IG9sZEZpcnN0ID0gZGVjay5jaGFpblsxXSA/IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChkZWNrLmNoYWluWzFdKSA6IG51bGw7XG4gICAgICAgIGlmIChvbGRGaXJzdCBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICAgICAgY29uc3QgZjIgPSB0aGlzLmZyb250bWF0dGVyT2Yob2xkRmlyc3QpO1xuICAgICAgICAgIG92ZXJ2aWV3QmFja0xpbmsgPSBmMiA/IGV4dHJhY3RSYXdMaW5rcyhmMltERUNLX0tFWV0pWzBdIDogdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcGxhbkNyZWF0ZU5leHQoe1xuICAgICAgICBjdXJyZW50TmFtZTogZmlsZS5iYXNlbmFtZSxcbiAgICAgICAgY3VycmVudExpbmtzOiByYXcsXG4gICAgICAgIGlzT3ZlcnZpZXc6IGRlY2suaW5kZXggPT09IDAsXG4gICAgICAgIG92ZXJ2aWV3QmFja0xpbmssXG4gICAgICAgIGV4aXN0aW5nTmFtZXMsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBPZmYtY2hhaW4gbm90ZTogc3RpbGwgY3JlYXRlIGl0cyBkZWNsYXJlZCBtaXNzaW5nIG5leHQgbm90ZSB3aGVuIHRoZVxuICAgIC8vIG92ZXJ2aWV3IGxpbmsgcmVzb2x2ZXMgKHRoZSBcdTI2QTAgYnJva2VuLWxpbmsgd2FybmluZyBkaXNhcHBlYXJzKS5cbiAgICBjb25zdCBvdmVydmlld05hbWUgPSByYXcubGVuZ3RoID49IDIgPyBleHRyYWN0TGlua3MocmF3WzBdKVswXSA6IG51bGw7XG4gICAgaWYgKG92ZXJ2aWV3TmFtZSAmJiB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KG92ZXJ2aWV3TmFtZSwgZmlsZS5wYXRoKSkge1xuICAgICAgcmV0dXJuIHBsYW5DcmVhdGVOZXh0KHtcbiAgICAgICAgY3VycmVudE5hbWU6IGZpbGUuYmFzZW5hbWUsXG4gICAgICAgIGN1cnJlbnRMaW5rczogcmF3LFxuICAgICAgICBpc092ZXJ2aWV3OiBmYWxzZSxcbiAgICAgICAgZXhpc3RpbmdOYW1lcyxcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKiBBcHBseSBhIHBsYW46IGNyZWF0ZSB0aGUgbm90ZSwgcmV3aXJlIGBkZWNrYCBwcm9wZXJ0aWVzLCBvcGVuIGl0ICovXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZUNyZWF0ZU5leHQoZmlsZTogVEZpbGUsIHBsYW46IENyZWF0ZU5leHRSZXN1bHQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBkaXIgPSBmaWxlLnBhcmVudD8ucGF0aCA/IGZpbGUucGFyZW50LnBhdGggKyBcIi9cIiA6IFwiXCI7XG4gICAgY29uc3QgbmV3UGF0aCA9IGAke2Rpcn0ke3BsYW4ubmV3TmFtZX0ubWRgO1xuICAgIGNvbnN0IGZyb250bWF0dGVyID0gcGxhbi5uZXdEZWNrTGlua3MubWFwKChsaW5rKSA9PiBKU09OLnN0cmluZ2lmeShsaW5rKSkuam9pbihcIiwgXCIpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBgLS0tXFxuZGVjazogWyR7ZnJvbnRtYXR0ZXJ9XVxcbi0tLVxcbmA7XG5cbiAgICBsZXQgbmV3RmlsZTogVEZpbGU7XG4gICAgdHJ5IHtcbiAgICAgIG5ld0ZpbGUgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUobmV3UGF0aCwgY29udGVudCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIG5ldyBOb3RpY2UoYE5hdGl2ZSBTbGlkZXM6IGNvdWxkIG5vdCBjcmVhdGUgXCIke3BsYW4ubmV3TmFtZX0ubWRcIiAoJHtTdHJpbmcoZXJyb3IpfSlgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSZXdpcmUgdGhlIGN1cnJlbnQgbm90ZSdzIGBkZWNrYCAoa2VlcHMgYWxsIG90aGVyIHByb3BlcnRpZXMgaW50YWN0KVxuICAgIGZvciAoY29uc3QgcmV3cml0ZSBvZiBwbGFuLnJld3JpdGVzKSB7XG4gICAgICBpZiAocmV3cml0ZS5uYW1lICE9PSBmaWxlLmJhc2VuYW1lKSBjb250aW51ZTsgLy8gaW4gcHJhY3RpY2UgYWx3YXlzIHRoZSBjdXJyZW50IG5vdGVcbiAgICAgIGF3YWl0IHRoaXMuYXBwLmZpbGVNYW5hZ2VyLnByb2Nlc3NGcm9udE1hdHRlcihmaWxlLCAoZm0pID0+IHtcbiAgICAgICAgZm1bREVDS19LRVldID0gcmV3cml0ZS5kZWNrO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gT3BlbiB0aGUgbmV3IG5vdGUgaW4gdGhlIGN1cnJlbnQgcGFuZSwgZWRpdCBtb2RlIChMaXZlIFByZXZpZXcpXG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKTtcbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKG5ld0ZpbGUsIHsgc3RhdGU6IHsgbW9kZTogXCJzb3VyY2VcIiB9IH0pO1xuICB9XG5cbiAgLyoqIE9wZW4gdGhlIGJ1aWx0LWluIFwiUHJvcGVydGllcyB2aWV3OiBTaG93IGZpbGUgcHJvcGVydGllc1wiIHBhbmVsICovXG4gIHByaXZhdGUgYXN5bmMgc2hvd0ZpbGVQcm9wZXJ0aWVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIGBhcHAuY29tbWFuZHNgIGlzIG5vdCBpbiB0aGUgcHVibGljIHR5cGluZ3M7IHRoZSBydW50aW1lIEFQSSBpcyBzdGFibGVcbiAgICAvLyBhbmQgZXhlY3V0aW5nIGEgYnVpbHQtaW4gY29tbWFuZCBpcyB0aGUgc3RhbmRhcmQgd2F5IHRvIG9wZW4gdGhlIHBhbmVsLlxuICAgIGNvbnN0IGNvbW1hbmRzID0gKFxuICAgICAgdGhpcy5hcHAgYXMgdW5rbm93biBhcyB7XG4gICAgICAgIGNvbW1hbmRzPzoge1xuICAgICAgICAgIGNvbW1hbmRzPzogUmVjb3JkPHN0cmluZywgeyBuYW1lPzogc3RyaW5nIH0+O1xuICAgICAgICAgIGV4ZWN1dGVDb21tYW5kQnlJZD86IChpZDogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+O1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICkuY29tbWFuZHM7XG4gICAgaWYgKCFjb21tYW5kcz8uZXhlY3V0ZUNvbW1hbmRCeUlkKSByZXR1cm47XG4gICAgLy8gTG9jYXRlIHRoZSBjb21tYW5kIGJ5IGl0cyAobG9jYWxpemVkKSBuYW1lIFx1MjAxNCByb2J1c3QgYWNyb3NzIHZlcnNpb25zXG4gICAgY29uc3QgaWQgPSBPYmplY3QuZW50cmllcyhjb21tYW5kcy5jb21tYW5kcyA/PyB7fSkuZmluZCgoWywgY10pID0+XG4gICAgICAvKD86c2hvd3xkaXNwbGF5KS4qZmlsZS4qcHJvcGVydGllc3woPzpcdTY2M0VcdTc5M0F8XHU2MjUzXHU1RjAwKS4qXHU2NTg3XHU0RUY2LipcdTVDNUVcdTYwMjcvaS50ZXN0KGMubmFtZSA/PyBcIlwiKSxcbiAgICApPy5bMF07XG4gICAgaWYgKGlkKSBhd2FpdCBjb21tYW5kcy5leGVjdXRlQ29tbWFuZEJ5SWQoaWQpO1xuICB9XG5cbiAgLyoqIEZyb250bWF0dGVyIG9mIGFueSBub3RlIGFzIGFuIG9iamVjdCwgb3IgbnVsbCB3aGVuIGFic2VudCAqL1xuICBwcml2YXRlIGZyb250bWF0dGVyT2YoZmlsZTogVEZpbGUpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG4gICAgcmV0dXJuIGNhY2hlPy5mcm9udG1hdHRlciA/PyBudWxsO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFBQVCBuYXZpZ2F0aW9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBNb3ZlIG9uZSBzdGVwIGJhY2svZm9yd2FyZCBhbG9uZyB0aGUgZGVjayBjaGFpbiAqL1xuICBwcml2YXRlIG5hdmlnYXRlKGRpcmVjdGlvbjogXCJwcmV2XCIgfCBcIm5leHRcIik6IHZvaWQge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGlmICghZmlsZSkgcmV0dXJuO1xuICAgIGNvbnN0IGRlY2sgPSB0aGlzLmNvbXB1dGVEZWNrKGZpbGUpO1xuICAgIGlmICghZGVjaykgcmV0dXJuO1xuICAgIGNvbnN0IHRhcmdldCA9IGRlY2suY2hhaW5bZGlyZWN0aW9uID09PSBcInByZXZcIiA/IGRlY2suaW5kZXggLSAxIDogZGVjay5pbmRleCArIDFdO1xuICAgIGlmICghdGFyZ2V0KSByZXR1cm47XG4gICAgdm9pZCB0aGlzLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KHRhcmdldCwgZmlsZS5wYXRoKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBNb2RlIC8gZGF0YSBhY2Nlc3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLyoqIE1vZGUgb2YgdGhlIGFjdGl2ZSBNYXJrZG93biB2aWV3OiAncHJldmlldyc9cmVhZGluZyAnc291cmNlJz1lZGl0aW5nICcnPW5vbmUgKi9cbiAgcHJpdmF0ZSBjdXJyZW50TW9kZSgpOiBcInByZXZpZXdcIiB8IFwic291cmNlXCIgfCBcIlwiIHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICByZXR1cm4gdmlldyA/ICh2aWV3LmdldE1vZGUoKSBhcyBcInByZXZpZXdcIiB8IFwic291cmNlXCIpIDogXCJcIjtcbiAgfVxuXG4gIC8qKiBDdXJyZW50IG5vdGUncyBmcm9udG1hdHRlciBhcyBhbiBvYmplY3QsIG9yIG51bGwgd2hlbiBhYnNlbnQgKi9cbiAgcHJpdmF0ZSBmcm9udG1hdHRlcigpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIHJldHVybiBmaWxlID8gdGhpcy5mcm9udG1hdHRlck9mKGZpbGUpIDogbnVsbDtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBCYXIgcmVuZGVyaW5nIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBEZWNpZGUgd2hhdCB0aGUgYmFyIHNob3dzLCB0aGVuIHJlLXJlbmRlciBpdCAqL1xuICByZWZyZXNoKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5iYXIpIHJldHVybjtcblxuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGNvbnN0IG1vZGUgPSB0aGlzLmN1cnJlbnRNb2RlKCk7XG5cbiAgICAvLyBDYXJkLW5vdGUgYm9keSBjbGFzcyAobm90ZSBoYXMgYSBgZGVja2AgcHJvcGVydHkpIFx1MjAxNCBlbmFibGVzIHRoZVxuICAgIC8vIGVkaXQtbW9kZSBcImhpZGUgaW4tbm90ZSBwcm9wZXJ0aWVzXCIgQ1NTIChMaXZlIFByZXZpZXcgV1lTSVdZRyBzdGVwKS5cbiAgICBjb25zdCBjYXJkRm0gPSBmaWxlID8gdGhpcy5mcm9udG1hdHRlck9mKGZpbGUpIDogbnVsbDtcbiAgICBjb25zdCBpc0NhcmQgPSBjYXJkRm0gIT09IG51bGwgJiYgREVDS19LRVkgaW4gY2FyZEZtO1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnRvZ2dsZShcbiAgICAgIFwibmF0aXZlLXNsaWRlcy1jYXJkXCIsXG4gICAgICBpc0NhcmQgJiYgdGhpcy5zZXR0aW5ncy5oaWRlQ2FyZFByb3BlcnRpZXNJbkVkaXQsXG4gICAgKTtcbiAgICAvLyBXWVNJV1lHIG1vZGUgYm9keSBjbGFzcyBcdTIwMTQgdW5pZmllZCBlZGl0L3JlYWRpbmcgdHlwb2dyYXBoeSBDU1NcbiAgICAvLyAoZGVjayBub3RlcyBvbmx5OyB0aGUgdHlwb2dyYXBoeSBydWxlcyBsYW5kIGluIGxhdGVyIHBoYXNlcylcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC50b2dnbGUoXCJuYXRpdmUtc2xpZGVzLXd5c2l3eWdcIiwgaXNDYXJkICYmIHRoaXMuc2V0dGluZ3Mud3lzaXd5Z01vZGUpO1xuXG4gICAgLy8gV1lTSVdZRzogb25jZSBwZXIgc2Vzc2lvbiwgb3BlbiB0aGUgcmlnaHQtc2lkZWJhciBQcm9wZXJ0aWVzIHZpZXcgd2hlbiBhXG4gICAgLy8gY2FyZCBub3RlIGlzIGFjdGl2YXRlZCBpbiBlZGl0IG1vZGUgXHUyMDE0IGEgZ2VudGxlIGhpbnQgdGhhdCBpdHMgKGhpZGRlbilcbiAgICAvLyBwcm9wZXJ0aWVzIGFyZSBlZGl0ZWQgdGhlcmUuXG4gICAgaWYgKFxuICAgICAgaXNDYXJkICYmXG4gICAgICB0aGlzLnNldHRpbmdzLmhpZGVDYXJkUHJvcGVydGllc0luRWRpdCAmJlxuICAgICAgbW9kZSA9PT0gXCJzb3VyY2VcIiAmJlxuICAgICAgIXRoaXMuc2lkZWJhck9wZW5lZFRoaXNTZXNzaW9uXG4gICAgKSB7XG4gICAgICB0aGlzLnNpZGViYXJPcGVuZWRUaGlzU2Vzc2lvbiA9IHRydWU7XG4gICAgICB2b2lkIHRoaXMuc2hvd0ZpbGVQcm9wZXJ0aWVzKCk7XG4gICAgfVxuXG4gICAgLy8gQXV0by1mdWxsc2NyZWVuOiBlbnRlciBvbiByZWFkaW5nIHZpZXcsIHJlc3RvcmUgb24gbGVhdmluZyBpdFxuICAgIHRoaXMuc3luY0Z1bGxzY3JlZW4obW9kZSA9PT0gXCJwcmV2aWV3XCIgJiYgdGhpcy5zZXR0aW5ncy5hdXRvRnVsbHNjcmVlbik7XG5cbiAgICAvLyBOb3QgYSBNYXJrZG93biBub3RlIC8gbm90IGluIHJlYWRpbmcgdmlldyAvIGhpZGRlbiBieSB0aGUgdXNlciBcdTIxOTIgaGlkZVxuICAgIGlmICghZmlsZSB8fCBtb2RlICE9PSBcInByZXZpZXdcIiB8fCB0aGlzLnNldHRpbmdzLmJhckhpZGRlbikge1xuICAgICAgdGhpcy5iYXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZtID0gdGhpcy5mcm9udG1hdHRlcigpO1xuICAgIGNvbnN0IGRlY2sgPSB0aGlzLmNvbXB1dGVEZWNrKGZpbGUpO1xuICAgIGNsZWFyQ2hpbGRyZW4odGhpcy5iYXIpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIExlZnQ6IHByZXZpb3VzIC8gbmV4dCBidXR0b25zIChib3RoIGFsd2F5cyBzaG93biBpbnNpZGUgYSBkZWNrO1xuICAgIC8vICAgICAgICB0aGUgb25lIHRoYXQgY2Fubm90IG1vdmUgaXMgZGlzYWJsZWQgLyBsaWdodCBncmF5KSBcdTI1MDBcdTI1MDBcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5zaG93TmF2QnV0dG9ucyAmJiBkZWNrKSB7XG4gICAgICBjb25zdCBoYXNQcmV2ID0gZGVjay5pbmRleCA+IDA7XG4gICAgICBjb25zdCBoYXNOZXh0ID0gZGVjay5pbmRleCA8IGRlY2suY2hhaW4ubGVuZ3RoIC0gMTtcbiAgICAgIGNvbnN0IG5hdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBuYXYuY2xhc3NOYW1lID0gXCJuYXRpdmUtc2xpZGVzLW5hdlwiO1xuICAgICAgbmF2LmFwcGVuZENoaWxkKHRoaXMubmF2QnV0dG9uKFwiXHUyNUMwXCIsIFwiUHJldmlvdXMgcGFnZVwiLCAoKSA9PiB0aGlzLm5hdmlnYXRlKFwicHJldlwiKSwgIWhhc1ByZXYpKTtcbiAgICAgIG5hdi5hcHBlbmRDaGlsZCh0aGlzLm5hdkJ1dHRvbihcIlx1MjVCNlwiLCBcIk5leHQgcGFnZVwiLCAoKSA9PiB0aGlzLm5hdmlnYXRlKFwibmV4dFwiKSwgIWhhc05leHQpKTtcbiAgICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKG5hdik7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE1pZGRsZTogY2hpcHMgZm9yIHRoZSByZW1haW5pbmcgcHJvcGVydGllcyAobm8gcGxhY2Vob2xkZXIpIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IHZpc2libGUgPSBmbVxuICAgICAgPyBPYmplY3QuZW50cmllcyhmbSkuZmlsdGVyKChba2V5XSkgPT4ga2V5ICE9PSBERUNLX0tFWSAmJiBrZXkgIT09IFwicG9zaXRpb25cIilcbiAgICAgIDogW107XG5cbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiB2aXNpYmxlKSB7XG4gICAgICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICBzcGFuLmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy1pdGVtXCI7XG4gICAgICBjb25zdCBrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0cm9uZ1wiKTtcbiAgICAgIGsudGV4dENvbnRlbnQgPSBrZXk7XG4gICAgICBzcGFuLmFwcGVuZENoaWxkKGspO1xuICAgICAgc3Bhbi5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIjogXCIgKyBmb3JtYXRWYWx1ZSh2YWx1ZSkpKTtcbiAgICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgIH1cblxuICAgIC8vIEJyb2tlbiBkZWNrIGxpbmtzIFx1MjE5MiB3YXJuaW5nIGNoaXAgc28gZGVjayBhdXRob3JzIHNwb3QgdHlwb3NcbiAgICBjb25zdCBicm9rZW4gPSBmaWxlID8gdGhpcy5icm9rZW5EZWNrTGlua3MoZmlsZSkgOiBbXTtcbiAgICBpZiAoYnJva2VuLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHdhcm4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgIHdhcm4uY2xhc3NOYW1lID0gXCJuYXRpdmUtc2xpZGVzLXdhcm5cIjtcbiAgICAgIHdhcm4udGV4dENvbnRlbnQgPSBcIlx1MjZBMCBcIiArIGJyb2tlbi5qb2luKFwiLCBcIik7XG4gICAgICB3YXJuLnRpdGxlID0gXCJCcm9rZW4gZGVjayBsaW5rKHMpIFx1MjAxNCB0aGUgdGFyZ2V0IG5vdGUgZG9lcyBub3QgZXhpc3RcIjtcbiAgICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKHdhcm4pO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBCb3R0b20tcmlnaHQ6IFdZU0lXWUcgbW9kZSB0b2dnbGUgKGRlY2sgbm90ZXMgb25seSkgXHUyNTAwXHUyNTAwXG4gICAgaWYgKGlzQ2FyZCkge1xuICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgIGJ0bi5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtd3lzaXd5Zy1idG5cIiArICh0aGlzLnNldHRpbmdzLnd5c2l3eWdNb2RlID8gXCIgaXMtYWN0aXZlXCIgOiBcIlwiKTtcbiAgICAgIGJ0bi50ZXh0Q29udGVudCA9IHRoaXMuc2V0dGluZ3Mud3lzaXd5Z01vZGUgPyBcIldZU0lXWUc6IE9uXCIgOiBcIldZU0lXWUc6IE9mZlwiO1xuICAgICAgYnRuLnRpdGxlID0gXCJUb2dnbGUgV1lTSVdZRyBtb2RlIFx1MjAxNCB1bmlmaWVkIHR5cG9ncmFwaHkgYmV0d2VlbiBlZGl0IGFuZCByZWFkaW5nXCI7XG4gICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMudG9nZ2xlV3lzaXd5ZygpKTtcbiAgICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKGJ0bik7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEJvdHRvbS1yaWdodDogYXV0by1jb21wdXRlZCBwYWdlIG51bWJlciBcdTI1MDBcdTI1MDBcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5zaG93UGFnZU51bWJlciAmJiBkZWNrKSB7XG4gICAgICBjb25zdCBwYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICBwYWdlLmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy1wYWdlXCI7XG4gICAgICAvLyBjaGFpblswXSBpcyB0aGUgb3ZlcnZpZXcgbm90ZTsgc2xpZGVzIHN0YXJ0IGF0IGluZGV4IDEgXHUyMTkyIFwiUGFnZSAxXCJcbiAgICAgIHBhZ2UudGV4dENvbnRlbnQgPSBkZWNrLmluZGV4ID09PSAwID8gXCJPdmVydmlld1wiIDogYFBhZ2UgJHtkZWNrLmluZGV4fWA7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChwYWdlKTtcbiAgICB9XG5cbiAgICAvLyBIaWRlIHRoZSBiYXIgZW50aXJlbHkgd2hlbiBpdCBoYXMgbm90aGluZyB0byBkaXNwbGF5IChubyBwcm9wZXJ0aWVzLFxuICAgIC8vIGFuZCBub3QgcGFydCBvZiBhIGRlY2spXG4gICAgdGhpcy5iYXIuc3R5bGUuZGlzcGxheSA9IHRoaXMuYmFyLmNoaWxkRWxlbWVudENvdW50ID09PSAwID8gXCJub25lXCIgOiBcIlwiO1xuICB9XG5cbiAgLyoqIEJ1aWxkIGEgXHUyNUMwIC8gXHUyNUI2IG5hdmlnYXRpb24gYnV0dG9uOyBgZGlzYWJsZWRgIHJlbmRlcnMgaXQgbGlnaHQgZ3JheS9pbmFjdGl2ZSAqL1xuICBwcml2YXRlIG5hdkJ1dHRvbihcbiAgICBsYWJlbDogc3RyaW5nLFxuICAgIHRpcDogc3RyaW5nLFxuICAgIG9uQ2xpY2s6ICgpID0+IHZvaWQsXG4gICAgZGlzYWJsZWQgPSBmYWxzZSxcbiAgKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgYnRuLmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy1uYXYtYnRuXCI7XG4gICAgYnRuLnRleHRDb250ZW50ID0gbGFiZWw7XG4gICAgYnRuLnRpdGxlID0gdGlwO1xuICAgIGJ0bi5kaXNhYmxlZCA9IGRpc2FibGVkO1xuICAgIGlmICghZGlzYWJsZWQpIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25DbGljayk7XG4gICAgcmV0dXJuIGJ0bjtcbiAgfVxuXG4gIC8qKiBTeW5jIHRoZSBmdWxsc2NyZWVuIHN0YXRlOiBhZGQgdGhlIGNsYXNzICsgcmVxdWVzdCBPUyBmdWxsc2NyZWVuLCBvciByZXN0b3JlICovXG4gIHByaXZhdGUgc3luY0Z1bGxzY3JlZW4oYWN0aXZlOiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZnVsbHNjcmVlbiA9PT0gYWN0aXZlKSByZXR1cm47IC8vIG5vdGhpbmcgdG8gZG9cbiAgICB0aGlzLmZ1bGxzY3JlZW4gPSBhY3RpdmU7XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QudG9nZ2xlKFwibmF0aXZlLXNsaWRlcy1mdWxsc2NyZWVuXCIsIGFjdGl2ZSk7XG5cbiAgICAvLyBSZXF1ZXN0IE9TLWxldmVsIGZ1bGxzY3JlZW4gd2hlbiBlbnRlcmluZyAoT2JzaWRpYW4gcnVucyBvbiBFbGVjdHJvbiBhbmRcbiAgICAvLyBzdXBwb3J0cyB0aGUgRnVsbHNjcmVlbiBBUEkpOyBmYWlsdXJlcyAoZS5nLiBpbiBhIHBsYWluIGJyb3dzZXIpIGFyZVxuICAgIC8vIGlnbm9yZWQgc2lsZW50bHkgXHUyMDE0IHRoZSBcImhpZGUgc2lkZWJhcnNcIiBlZmZlY3Qgc3RpbGwgYXBwbGllcy5cbiAgICBpZiAoYWN0aXZlKSB7XG4gICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4/LigpLmNhdGNoKCgpID0+IHt9KTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50KSB7XG4gICAgICBkb2N1bWVudC5leGl0RnVsbHNjcmVlbj8uKCkuY2F0Y2goKCkgPT4ge30pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBUb2dnbGUgdGhlIFdZU0lXWUcgbW9kZSAocGVyc2lzdGVkOyBvbmx5IHJlYWNoYWJsZSBvbiBkZWNrIG5vdGVzKSAqL1xuICBwcml2YXRlIHRvZ2dsZVd5c2l3eWcoKTogdm9pZCB7XG4gICAgdGhpcy5zZXR0aW5ncy53eXNpd3lnTW9kZSA9ICF0aGlzLnNldHRpbmdzLnd5c2l3eWdNb2RlO1xuICAgIHZvaWQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICB0aGlzLnJlZnJlc2goKTtcbiAgfVxufVxuXG4vLyBcdTI1MDBcdTI1MDAgU2V0dGluZ3MgdGFiIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5jbGFzcyBOYXRpdmVTbGlkZXNTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBOYXRpdmVTbGlkZXNQbHVnaW4pIHtcbiAgICBzdXBlcihwbHVnaW4uYXBwLCBwbHVnaW4pO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiUHJvcGVydGllcyBCYXIgXHUwMEI3IFNldHRpbmdzXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBQcmV2aW91cy9OZXh0IGJ1dHRvbnNcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIlNob3cgXHUyNUMwIFx1MjVCNiBidXR0b25zIG9uIHRoZSBsZWZ0IG9mIHRoZSBiYXIgd2hlbiB0aGUgbm90ZSBiZWxvbmdzIHRvIGEgZGVjayAoaGFzIGEgYGRlY2tgIHByb3BlcnR5KVwiLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd05hdkJ1dHRvbnMpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dOYXZCdXR0b25zID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBwYWdlIG51bWJlclwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiQXV0by1jb21wdXRlZCBmcm9tIHRoZSBkZWNrIGNoYWluIChvdmVydmlldyBwYWdlIHNob3dzIFx1MjAxQ092ZXJ2aWV3XHUyMDFEKTsgc2hvd24gYXQgdGhlIGJvdHRvbS1yaWdodFwiLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1BhZ2VOdW1iZXIpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dQYWdlTnVtYmVyID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiQXV0byBmdWxsc2NyZWVuIGluIHJlYWRpbmcgdmlld1wiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiRW50ZXIgdGhlIGltbWVyc2l2ZSBmdWxsc2NyZWVuIHJlYWRpbmcgbW9kZSBhdXRvbWF0aWNhbGx5IHdoZW4gc3dpdGNoaW5nIHRvIHJlYWRpbmcgdmlldyAoYWxzbyB0b2dnbGVhYmxlIHZpYSB0aGUgUGF1c2UvUmVzdW1lIEF1dG8gRnVsbHNjcmVlbiBjb21tYW5kKVwiLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b0Z1bGxzY3JlZW4pLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9GdWxsc2NyZWVuID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiSGlkZSBpbi1ub3RlIHByb3BlcnRpZXMgaW4gZWRpdCBtb2RlIChkZWNrIG5vdGVzKVwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiRm9yIGRlY2sgKGNhcmQpIG5vdGVzIGluIExpdmUgUHJldmlldywgdGhlIGluLW5vdGUgcHJvcGVydGllcyBwYW5lbCBpcyBhbHdheXMgaGlkZGVuIChXWVNJV1lHIFx1MjAxNCBzYW1lIGFzIHJlYWRpbmcgdmlldykuIEVkaXQgdGhlbSBpbiB0aGUgcmlnaHQtc2lkZWJhciBQcm9wZXJ0aWVzIHZpZXcgKG9wZW5lZCBhdXRvbWF0aWNhbGx5IHRoZSBmaXJzdCB0aW1lIGEgZGVjayBub3RlIGlzIGFjdGl2YXRlZCBpbiBhIHNlc3Npb24pIG9yIGluIFNvdXJjZSBtb2RlLlwiLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuaGlkZUNhcmRQcm9wZXJ0aWVzSW5FZGl0KS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5oaWRlQ2FyZFByb3BlcnRpZXNJbkVkaXQgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJXWVNJV1lHIG1vZGUgKGRlY2sgbm90ZXMpXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJVbmlmaWVkIHR5cG9ncmFwaHkgYmV0d2VlbiBlZGl0IGFuZCByZWFkaW5nIHZpZXdzIGZvciBkZWNrIG5vdGVzICh0YWIgYmFyIGhpZGVzIGluIHJlYWRpbmc7IHRoZSBib3R0b20gYmFyIHRha2VzIGl0cyBwbGFjZSkuIFRvZ2dsZSBmcm9tIHRoZSBjb21tYW5kIHBhbGV0dGUsIHRoZSBNb2QrU2hpZnQrVyBob3RrZXksIG9yIHRoZSBib3R0b20tYmFyIGJ1dHRvbi5cIixcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnd5c2l3eWdNb2RlKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy53eXNpd3lnTW9kZSA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMucGx1Z2luLnJlZnJlc2goKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk5hdmlnYXRpb24gaG90a2V5c1wiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiRGVmYXVsdDogUHJldmlvdXMgUGFnZSBNb2QrU2hpZnQrXHUyMTkwLCBOZXh0IFBhZ2UgTW9kK1NoaWZ0K1x1MjE5Mi4gUmViaW5kIHVuZGVyIFNldHRpbmdzIFx1MjE5MiBIb3RrZXlzLlwiLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIk9wZW4gSG90a2V5cyBTZXR0aW5nc1wiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICAvLyBPcGVuIE9ic2lkaWFuJ3MgaG90a2V5cyBzZXR0aW5ncyBwYWdlIChpbnRlcm5hbCBBUEk7IGlnbm9yZSBmYWlsdXJlcylcbiAgICAgICAgICAoXG4gICAgICAgICAgICB0aGlzLmFwcCBhcyB1bmtub3duIGFzIHsgc2V0dGluZz86IHsgb3BlblRhYkJ5SWQ/OiAoaWQ6IHN0cmluZykgPT4gdm9pZCB9IH1cbiAgICAgICAgICApLnNldHRpbmc/Lm9wZW5UYWJCeUlkPy4oXCJob3RrZXlzXCIpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cbn1cblxuLy8gXHUyNTAwXHUyNTAwIEhlbHBlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbi8qKiBSZW1vdmUgYWxsIGNoaWxkcmVuIG9mIGFuIGVsZW1lbnQgKi9cbmZ1bmN0aW9uIGNsZWFyQ2hpbGRyZW4oZWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIHdoaWxlIChlbC5maXJzdENoaWxkKSBlbC5yZW1vdmVDaGlsZChlbC5maXJzdENoaWxkKTtcbn1cbiIsICIvKipcbiAqIGRlY2sudHMgXHUyMDE0IFB1cmUgZGVjay1yZXNvbHV0aW9uIGNvcmUgZm9yIG5hdGl2ZS1zbGlkZXMuXG4gKlxuICogRXZlcnl0aGluZyBpbiB0aGlzIG1vZHVsZSBpcyBmcmVlIG9mIE9ic2lkaWFuIHJ1bnRpbWUgZGVwZW5kZW5jaWVzIHNvIGl0IGNhblxuICogYmUgdW5pdCB0ZXN0ZWQgZGlyZWN0bHkgKHNlZSB0ZXN0L2RlY2sudGVzdC50cykuIG1haW4udHMgYWRhcHRzIHRoZSB2YXVsdFxuICogKG1ldGFkYXRhQ2FjaGUpIHRvIHRoaXMgcHVyZSBpbnRlcmZhY2U6IGl0IHJlc29sdmVzIGBkZWNrYCBwcm9wZXJ0aWVzIHRvXG4gKiBub3RlIHBhdGhzLCB0aGVuIGhhbmRzIHRoZSBwYXRoIGdyYXBoIHRvIGNvbXB1dGVEZWNrKCkuXG4gKi9cblxuLyoqIEEgZGVjayBsaW5rIGxpc3QgbmV2ZXIgaG9sZHMgbW9yZSB0aGFuIHR3byBlbnRyaWVzICovXG5leHBvcnQgY29uc3QgTUFYX0RFQ0tfTElOS1MgPSAyO1xuXG4vKiogUmVzdWx0IG9mIHJlc29sdmluZyBhIG5vdGUncyBwb3NpdGlvbiBpbnNpZGUgYSBkZWNrICovXG5leHBvcnQgaW50ZXJmYWNlIERlY2tJbmZvIHtcbiAgLyoqIENoYWluIG9mIG5vdGUgcGF0aHM6IFswXSBpcyB0aGUgb3ZlcnZpZXcgbm90ZSwgdGhlbiBzbGlkZXMgaW4gb3JkZXIgKi9cbiAgY2hhaW46IHN0cmluZ1tdO1xuICAvKiogSW5kZXggb2YgdGhlIGN1cnJlbnQgbm90ZSBpbnNpZGUgY2hhaW4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBSZXNvbHZlIGEgbm90ZSdzIHBvc2l0aW9uIGluc2lkZSBpdHMgZGVjayBieSB3YWxraW5nIHRoZSBsaW5rIGNoYWluLlxuICpcbiAqIENvbnZlbnRpb24gZm9yIHRoZSBzaW5nbGUgYGRlY2tgIHByb3BlcnR5ICh1cCB0byB0d28gbGlua3MpOlxuICogICAtIG92ZXJ2aWV3IG5vdGU6IG9uZSBsaW5rIFx1MjE5MiB0aGF0IGxpbmsgSVMgdGhlIGZpcnN0IHBhZ2U7XG4gKiAgIC0gc2xpZGUgbm90ZTogICAgZmlyc3QgbGluayBcdTIxOTIgdGhlIG92ZXJ2aWV3IHBhZ2UsIHNlY29uZCBsaW5rIFx1MjE5MiBuZXh0IHNsaWRlXG4gKiAgICAgICAgICAgICAgICAgICAgKG5vIHNlY29uZCBsaW5rIG9uIHRoZSBsYXN0IHNsaWRlKS5cbiAqXG4gKiBgZ2V0TGlua3MocGF0aClgIG11c3QgcmV0dXJuIHRoZSByZXNvbHZlZCBub3RlIHBhdGhzIG9mIHRoZSBgZGVja2AgcHJvcGVydHlcbiAqIG9mIHRoZSBub3RlIGF0IGBwYXRoYCAoZW1wdHkgd2hlbiB0aGUgbm90ZSBoYXMgbm9uZSwgb3IgaXRzIGxpbmtzIGFyZVxuICogYnJva2VuIFx1MjAxNCBhIGJyb2tlbiBsaW5rIHNpbXBseSBlbmRzIG9yIGV4Y2x1ZGVzIHRoZSBjaGFpbiwgbmV2ZXIgY3Jhc2hlcykuXG4gKlxuICogUmV0dXJucyB0aGUgZnVsbCBjaGFpbiAoW292ZXJ2aWV3LCBzbGlkZSAxLCBzbGlkZSAyLCBcdTIwMjZdKSBhbmQgdGhlIGN1cnJlbnRcbiAqIG5vdGUncyBpbmRleCwgb3IgbnVsbCB3aGVuIHRoZSBub3RlIGlzIG5vdCBwYXJ0IG9mIGFueSBkZWNrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZURlY2soXG4gIGN1cnJlbnRQYXRoOiBzdHJpbmcsXG4gIGdldExpbmtzOiAocGF0aDogc3RyaW5nKSA9PiBzdHJpbmdbXSxcbik6IERlY2tJbmZvIHwgbnVsbCB7XG4gIGNvbnN0IGN1cnJlbnRMaW5rcyA9IGdldExpbmtzKGN1cnJlbnRQYXRoKTtcbiAgaWYgKGN1cnJlbnRMaW5rcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuXG4gIGxldCBvdmVydmlldzogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBsZXQgZmlyc3RQYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbiAgaWYgKGN1cnJlbnRMaW5rcy5sZW5ndGggPj0gMikge1xuICAgIC8vIEEgc2xpZGU6IGZpcnN0IGxpbmsgaXMgdGhlIG92ZXJ2aWV3IHBhZ2VcbiAgICBvdmVydmlldyA9IGN1cnJlbnRMaW5rc1swXTtcbiAgICBmaXJzdFBhZ2UgPSBnZXRMaW5rcyhvdmVydmlldylbMF07XG4gIH0gZWxzZSB7XG4gICAgLy8gQSBzaW5nbGUgbGluazogZWl0aGVyIHdlIEFSRSB0aGUgb3ZlcnZpZXcgKGxpbmsgPSBmaXJzdCBwYWdlKSxcbiAgICAvLyBvciB3ZSBhcmUgdGhlIGxhc3Qgc2xpZGUgKGxpbmsgPSBvdmVydmlldyBwYWdlKVxuICAgIGNvbnN0IG9ubHkgPSBjdXJyZW50TGlua3NbMF07XG4gICAgY29uc3Qgb25seUxpbmtzID0gZ2V0TGlua3Mob25seSk7XG4gICAgaWYgKG9ubHlMaW5rc1swXSA9PT0gY3VycmVudFBhdGgpIHtcbiAgICAgIG92ZXJ2aWV3ID0gY3VycmVudFBhdGg7XG4gICAgICBmaXJzdFBhZ2UgPSBvbmx5O1xuICAgIH0gZWxzZSB7XG4gICAgICBvdmVydmlldyA9IG9ubHk7XG4gICAgICBmaXJzdFBhZ2UgPSBvbmx5TGlua3NbMF07XG4gICAgfVxuICB9XG4gIGlmICghb3ZlcnZpZXcgfHwgIWZpcnN0UGFnZSkgcmV0dXJuIG51bGw7XG5cbiAgLy8gV2FsayB0aGUgY2hhaW46IG92ZXJ2aWV3IFx1MjE5MiBmaXJzdCBwYWdlIFx1MjE5MiBuZXh0IFx1MjE5MiBuZXh0IFx1MjE5MiBcdTIwMjZcbiAgY29uc3QgY2hhaW46IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHZpc2l0ZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgcHVzaCA9IChwOiBzdHJpbmcgfCB1bmRlZmluZWQpOiB2b2lkID0+IHtcbiAgICBpZiAocCAmJiAhdmlzaXRlZC5oYXMocCkpIHtcbiAgICAgIHZpc2l0ZWQuYWRkKHApO1xuICAgICAgY2hhaW4ucHVzaChwKTtcbiAgICB9XG4gIH07XG4gIHB1c2gob3ZlcnZpZXcpO1xuICBwdXNoKGZpcnN0UGFnZSk7XG4gIGxldCBjdXIgPSBmaXJzdFBhZ2U7XG4gIHdoaWxlIChjdXIpIHtcbiAgICBjb25zdCBuZXh0ID0gZ2V0TGlua3MoY3VyKVsxXTtcbiAgICBpZiAoIW5leHQgfHwgdmlzaXRlZC5oYXMobmV4dCkpIGJyZWFrOyAvLyBlbmQgb2YgZGVjayBvciBjeWNsZSBndWFyZFxuICAgIHB1c2gobmV4dCk7XG4gICAgY3VyID0gbmV4dDtcbiAgfVxuXG4gIGNvbnN0IGluZGV4ID0gY2hhaW4uaW5kZXhPZihjdXJyZW50UGF0aCk7XG4gIGlmIChpbmRleCA9PT0gLTEpIHJldHVybiBudWxsO1xuICByZXR1cm4geyBjaGFpbiwgaW5kZXggfTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHVwIHRvIGBtYXhgIG5vdGUgbmFtZXMgZnJvbSBhIGBkZWNrYCBwcm9wZXJ0eSB2YWx1ZS5cbiAqIEFjY2VwdHMgYSBzaW5nbGUgc3RyaW5nIG9yIGEgWUFNTCBsaXN0IG9mIHN0cmluZ3M7IHVucXVvdGVkIFtbeF1dIHZhbHVlcyBhcmVcbiAqIHBhcnNlZCBieSBZQU1MIGFzIG5lc3RlZCBhcnJheXMgYW5kIGZsYXR0ZW5lZCBoZXJlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdExpbmtzKHZhbHVlOiB1bmtub3duLCBtYXg6IG51bWJlciA9IE1BWF9ERUNLX0xJTktTKTogc3RyaW5nW10ge1xuICBjb25zdCBmbGF0OiB1bmtub3duW10gPSBbXTtcbiAgY29uc3QgY29sbGVjdCA9ICh2OiB1bmtub3duKTogdm9pZCA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB2KSBjb2xsZWN0KGl0ZW0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBmbGF0LnB1c2godik7XG4gICAgfVxuICB9O1xuICBjb2xsZWN0KHZhbHVlKTtcblxuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIGZvciAoY29uc3QgaXRlbSBvZiBmbGF0KSB7XG4gICAgY29uc3QgbmFtZSA9IGV4dHJhY3RMaW5rVGV4dChpdGVtKTtcbiAgICBpZiAobmFtZSkgb3V0LnB1c2gobmFtZSk7XG4gICAgaWYgKG91dC5sZW5ndGggPj0gbWF4KSBicmVhaztcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdXAgdG8gYG1heGAgcmF3IGxpbmsgc3RyaW5ncyBmcm9tIGEgYGRlY2tgIHByb3BlcnR5IHZhbHVlIFx1MjAxNCB0aGVcbiAqIHRyaW1tZWQgdmFsdWVzIGV4YWN0bHkgYXMgd3JpdHRlbiAoYWxpYXMgLyBwYXRoIGZvcm1zIHByZXNlcnZlZCkuIFNhbWVcbiAqIGZsYXR0ZW5pbmcgcnVsZXMgYXMgZXh0cmFjdExpbmtzKCksIGJ1dCB3aXRob3V0IGV4dHJhY3RpbmcgdGhlIHRhcmdldCBuYW1lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFJhd0xpbmtzKHZhbHVlOiB1bmtub3duLCBtYXg6IG51bWJlciA9IE1BWF9ERUNLX0xJTktTKTogc3RyaW5nW10ge1xuICBjb25zdCBmbGF0OiB1bmtub3duW10gPSBbXTtcbiAgY29uc3QgY29sbGVjdCA9ICh2OiB1bmtub3duKTogdm9pZCA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB2KSBjb2xsZWN0KGl0ZW0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBmbGF0LnB1c2godik7XG4gICAgfVxuICB9O1xuICBjb2xsZWN0KHZhbHVlKTtcblxuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIGZvciAoY29uc3QgaXRlbSBvZiBmbGF0KSB7XG4gICAgaWYgKHR5cGVvZiBpdGVtICE9PSBcInN0cmluZ1wiKSBjb250aW51ZTtcbiAgICBjb25zdCB0cmltbWVkID0gaXRlbS50cmltKCk7XG4gICAgaWYgKCF0cmltbWVkKSBjb250aW51ZTtcbiAgICBvdXQucHVzaCh0cmltbWVkKTtcbiAgICBpZiAob3V0Lmxlbmd0aCA+PSBtYXgpIGJyZWFrO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgdGFyZ2V0IG5vdGUgbmFtZSBmcm9tIGEgbWFya2Rvd24gbGluayBzdHJpbmcuXG4gKiBIYW5kbGVzIHNldmVyYWwgc2hhcGVzOlxuICogICBcIltbc2xpZGUtMl1dXCIgICAgICAgIFx1MjE5MiBzbGlkZS0yXG4gKiAgIFwiW1tzbGlkZS0yfGFsaWFzXV1cIiAgXHUyMTkyIHNsaWRlLTJcbiAqICAgXCJbW3NsaWRlLTIjc2VjdGlvbl1dXCJcdTIxOTIgc2xpZGUtMlxuICogICBzbGlkZS0yICAgICAgICAgICAgICBcdTIxOTIgc2xpZGUtMiAoYmFyZSBmaWxlbmFtZSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RMaW5rVGV4dCh2YWx1ZTogdW5rbm93bik6IHN0cmluZyB8IG51bGwge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgdHJpbW1lZCA9IHZhbHVlLnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHRyaW1tZWQucmVwbGFjZSgvXlxcW1xcWy8sIFwiXCIpLnJlcGxhY2UoL1xcXVxcXSQvLCBcIlwiKS5zcGxpdChcInxcIilbMF0uc3BsaXQoXCIjXCIpWzBdLnRyaW0oKTtcbn1cblxuLyoqIFJlbmRlciBhIHByb3BlcnR5IHZhbHVlIGFzIHJlYWRhYmxlIHRleHQ6IGFycmF5cy9vYmplY3RzIFx1MjE5MiBKU09OLCBlbHNlIFN0cmluZyAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFZhbHVlKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybiBcIlx1MjAxNFwiO1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSk7XG59XG4iLCAiLyoqXG4gKiBjcmVhdGVOZXh0LnRzIFx1MjAxNCBQdXJlIFwiQ3JlYXRlIE5leHQgU2xpZGVcIiBwbGFubmluZyBjb3JlIGZvciBuYXRpdmUtc2xpZGVzLlxuICpcbiAqIEV2ZXJ5dGhpbmcgaW4gdGhpcyBtb2R1bGUgaXMgZnJlZSBvZiBPYnNpZGlhbiBydW50aW1lIGRlcGVuZGVuY2llcyBzbyBpdCBjYW5cbiAqIGJlIHVuaXQgdGVzdGVkIGRpcmVjdGx5IChzZWUgdGVzdC9jcmVhdGVOZXh0LnRlc3QudHMpLiBtYWluLnRzIGFkYXB0cyB0aGVcbiAqIHZhdWx0IChtZXRhZGF0YUNhY2hlLCBjb21wdXRlRGVjaykgdG8gdGhpcyBwdXJlIGludGVyZmFjZSBhbmQgYXBwbGllcyB0aGVcbiAqIHJlc3VsdGluZyBwbGFuIHdpdGggdmF1bHQuY3JlYXRlKCkgKyBmaWxlTWFuYWdlci5wcm9jZXNzRnJvbnRNYXR0ZXIoKS5cbiAqXG4gKiBUaGUgcGxhbiBkZWNpZGVzLCBmb3IgdGhlIGN1cnJlbnQgbm90ZTpcbiAqICAgLSB0aGUgbmFtZSBvZiB0aGUgbmV3IHNsaWRlIGZpbGUgKGNvbGxpc2lvbi1hd2FyZSksXG4gKiAgIC0gdGhlIHJhdyBgZGVja2AgbGluayB0ZXh0cyBvZiB0aGUgbmV3IG5vdGUsXG4gKiAgIC0gdGhlIHJld3JpdGVzIG5lZWRlZCBvbiBleGlzdGluZyBub3RlcyAoaW4gcHJhY3RpY2UgYWx3YXlzIHRoZSBjdXJyZW50XG4gKiAgICAgbm90ZSBpdHNlbGYpLlxuICovXG5cbmltcG9ydCB7IGV4dHJhY3RMaW5rVGV4dCB9IGZyb20gXCIuL2RlY2tcIjtcblxuLyoqIElucHV0cyBmb3IgcGxhbm5pbmcgXHUyMDE0IHJlc29sdmVkIGJ5IHRoZSBhZGFwdGVyIGluIG1haW4udHMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlTmV4dElucHV0IHtcbiAgLyoqIEJhc2VuYW1lICh3aXRob3V0IGV4dGVuc2lvbikgb2YgdGhlIGN1cnJlbnQgbm90ZSAqL1xuICBjdXJyZW50TmFtZTogc3RyaW5nO1xuICAvKiogUmF3IGBkZWNrYCBsaW5rIHRleHRzIG9mIHRoZSBjdXJyZW50IG5vdGUgKGV4dHJhY3RlZCwgdXAgdG8gdHdvKSAqL1xuICBjdXJyZW50TGlua3M6IHN0cmluZ1tdO1xuICAvKiogVHJ1ZSB3aGVuIHRoZSBjdXJyZW50IG5vdGUgSVMgdGhlIGRlY2sncyBvdmVydmlldyBwYWdlIChjaGFpbiBpbmRleCAwKSAqL1xuICBpc092ZXJ2aWV3OiBib29sZWFuO1xuICAvKipcbiAgICogUmF3IGxpbmsgdGV4dCB0aGUgb2xkIGZpcnN0IHBhZ2UgdXNlcyB0byBsaW5rIGJhY2sgdG8gdGhlIG92ZXJ2aWV3LlxuICAgKiBPbmx5IG1lYW5pbmdmdWwgZm9yIG92ZXJ2aWV3IGluc2VydGlvbiAodGhlIG92ZXJ2aWV3IGl0c2VsZiBvbmx5IGxpbmtzXG4gICAqIGZvcndhcmQsIHNvIGl0cyBvd24gZnJvbnRtYXR0ZXIgY29udGFpbnMgbm8gc2VsZi1yZWZlcmVuY2UpLlxuICAgKi9cbiAgb3ZlcnZpZXdCYWNrTGluaz86IHN0cmluZztcbiAgLyoqIEJhc2VuYW1lcyBvZiBldmVyeSBtYXJrZG93biBub3RlIGluIHRoZSB2YXVsdCAoY29sbGlzaW9uLWZyZWUgbmFtaW5nKSAqL1xuICBleGlzdGluZ05hbWVzOiBTZXQ8c3RyaW5nPjtcbn1cblxuLyoqIE9uZSBub3RlIHdob3NlIGBkZWNrYCBwcm9wZXJ0eSBtdXN0IGJlIHJld3JpdHRlbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWNrUmV3cml0ZSB7XG4gIC8qKiBCYXNlbmFtZSBvZiB0aGUgbm90ZSB0byByZXdyaXRlICovXG4gIG5hbWU6IHN0cmluZztcbiAgLyoqIFRoZSBuZXcgcmF3IGBkZWNrYCBsaW5rIHRleHRzIChzZXJpYWxpemVkIGFzIGEgWUFNTCBsaXN0KSAqL1xuICBkZWNrOiBzdHJpbmdbXTtcbn1cblxuLyoqIFRoZSBmdWxsIHBsYW4gZm9yIGNyZWF0aW5nIG9uZSBuZXcgc2xpZGUgKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlTmV4dFJlc3VsdCB7XG4gIC8qKiBCYXNlbmFtZSAod2l0aG91dCBleHRlbnNpb24pIG9mIHRoZSBuZXcgc2xpZGUgZmlsZSAqL1xuICBuZXdOYW1lOiBzdHJpbmc7XG4gIC8qKiBSYXcgYGRlY2tgIGxpbmsgdGV4dHMgZm9yIHRoZSBuZXcgbm90ZSdzIGZyb250bWF0dGVyICovXG4gIG5ld0RlY2tMaW5rczogc3RyaW5nW107XG4gIC8qKiBSZXdyaXRlcyB0byBhcHBseSB0byBleGlzdGluZyBub3RlcyAoaW4gcHJhY3RpY2UgYWx3YXlzIHRoZSBjdXJyZW50IG5vdGUpICovXG4gIHJld3JpdGVzOiBEZWNrUmV3cml0ZVtdO1xufVxuXG4vKipcbiAqIFBsYW4gdGhlIGNyZWF0aW9uIG9mIGEgbmV3IHNsaWRlIGFmdGVyIHRoZSBjdXJyZW50IG5vdGUuXG4gKlxuICogQmVoYXZpb3JzOlxuICogICAtIExhc3Qgc2xpZGUgKG5vIHNlY29uZCBsaW5rKTogYXBwZW5kIGA8Y3VycmVudD4tbmV4dGAgYXMgdGhlIG5ldyBsYXN0XG4gKiAgICAgc2xpZGU7IHRoZSBjdXJyZW50IG5vdGUgZ2FpbnMgdGhlIHNlY29uZCBsaW5rLlxuICogICAtIFNsaWRlIHdpdGggYSB2YWxpZCBuZXh0OiBpbnNlcnQgYDxjdXJyZW50Pi1uZXh0YCBiZXR3ZWVuIHRoZW07IHRoZSBuZXdcbiAqICAgICBub3RlIHRha2VzIG92ZXIgdGhlIG9sZCBuZXh0IGxpbmsuXG4gKiAgIC0gU2xpZGUgd2hvc2Ugc2Vjb25kIGxpbmsgaXMgYnJva2VuIChwbGFpbiwgbm9uLWV4aXN0aW5nIG5hbWUpOiBjcmVhdGVcbiAqICAgICBleGFjdGx5IHRoZSBkZWNsYXJlZCBtaXNzaW5nIG5vdGUgYXMgdGhlIG5ldyBsYXN0IHNsaWRlIFx1MjAxNCB0aGUgXHUyNkEwIHdhcm5pbmdcbiAqICAgICBkaXNhcHBlYXJzIGFuZCB0aGUgYXV0aG9yJ3MgaW50ZW50IGlzIGhvbm91cmVkLiBBIGJyb2tlbiBsaW5rIHRoYXQgaXNcbiAqICAgICBub3QgYSBwbGFpbiBiYXNlbmFtZSAocGF0aC1xdWFsaWZpZWQsIHNlbGYtcmVmZXJlbmNpbmcpIGlzIHRyZWF0ZWQgYXNcbiAqICAgICBpbnZhbGlkIGFuZCBkcm9wcGVkIChhcHBlbmQgYSBgPGN1cnJlbnQ+LW5leHRgIGxhc3Qgc2xpZGUgaW5zdGVhZCkuXG4gKiAgIC0gT3ZlcnZpZXcgcGFnZSAoc2luZ2xlIGxpbmsgPSBmaXJzdCBwYWdlKTogaW5zZXJ0IGEgbmV3IGZpcnN0IHBhZ2U7IHRoZVxuICogICAgIG92ZXJ2aWV3J3MgbGluayBwb2ludHMgdG8gaXQgYW5kIHRoZSBvbGQgZmlyc3QgcGFnZSBpcyBwdXNoZWQgYmFjay5cbiAqXG4gKiBSZXR1cm5zIG51bGwgd2hlbiB0aGUgbm90ZSBoYXMgbm8gdXNhYmxlIGBkZWNrYCBsaW5rcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBsYW5DcmVhdGVOZXh0KGlucHV0OiBDcmVhdGVOZXh0SW5wdXQpOiBDcmVhdGVOZXh0UmVzdWx0IHwgbnVsbCB7XG4gIGNvbnN0IHsgY3VycmVudE5hbWUsIGN1cnJlbnRMaW5rcywgaXNPdmVydmlldyB9ID0gaW5wdXQ7XG4gIGlmIChjdXJyZW50TGlua3MubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICAvLyBcdTI1MDBcdTI1MDAgT3ZlcnZpZXcgcGFnZTogaW5zZXJ0IGEgbmV3IGZpcnN0IHBhZ2UgYWZ0ZXIgaXQgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGlmIChpc092ZXJ2aWV3KSB7XG4gICAgY29uc3Qgb2xkRmlyc3QgPSBjdXJyZW50TGlua3NbMF07XG4gICAgaWYgKCFvbGRGaXJzdCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgbmV3TmFtZSA9IHVuaXF1ZU5hbWUoYCR7Y3VycmVudE5hbWV9LW5leHRgLCBpbnB1dC5leGlzdGluZ05hbWVzKTtcbiAgICBjb25zdCBiYWNrID0gaW5wdXQub3ZlcnZpZXdCYWNrTGluayA/PyBgW1ske2N1cnJlbnROYW1lfV1dYDtcbiAgICByZXR1cm4ge1xuICAgICAgbmV3TmFtZSxcbiAgICAgIG5ld0RlY2tMaW5rczogW2JhY2ssIG9sZEZpcnN0XSxcbiAgICAgIHJld3JpdGVzOiBbeyBuYW1lOiBjdXJyZW50TmFtZSwgZGVjazogW2BbWyR7bmV3TmFtZX1dXWBdIH1dLFxuICAgIH07XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU2xpZGU6IGZpcnN0IGxpbmsgaXMgdGhlIG92ZXJ2aWV3IHBhZ2UgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IG92ZXJ2aWV3TGluayA9IGN1cnJlbnRMaW5rc1swXTtcbiAgaWYgKCFvdmVydmlld0xpbmspIHJldHVybiBudWxsO1xuICBjb25zdCBuZXh0TGluayA9IGN1cnJlbnRMaW5rc1sxXTtcblxuICBpZiAobmV4dExpbmspIHtcbiAgICBjb25zdCBuZXh0TmFtZSA9IGV4dHJhY3RMaW5rVGV4dChuZXh0TGluayk7XG4gICAgaWYgKG5leHROYW1lICYmIGlzUGxhaW5OYW1lKG5leHROYW1lKSAmJiBuZXh0TmFtZSAhPT0gY3VycmVudE5hbWUpIHtcbiAgICAgIGlmICghaW5wdXQuZXhpc3RpbmdOYW1lcy5oYXMobmV4dE5hbWUpKSB7XG4gICAgICAgIC8vIFRoZSBkZWNsYXJlZCBuZXh0IG5vdGUgZG9lcyBub3QgZXhpc3QgeWV0IFx1MjE5MiBjcmVhdGUgZXhhY3RseSB0aGF0XG4gICAgICAgIC8vIG5vdGUgKGZpeGVzIHRoZSBicm9rZW4tbGluayB3YXJuaW5nLCBob25vdXJzIHRoZSBhdXRob3IncyBpbnRlbnQpLlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5ld05hbWU6IG5leHROYW1lLFxuICAgICAgICAgIG5ld0RlY2tMaW5rczogW292ZXJ2aWV3TGlua10sXG4gICAgICAgICAgcmV3cml0ZXM6IFtdLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgLy8gQSB2YWxpZCBuZXh0IG5vdGUgZXhpc3RzIFx1MjE5MiBpbnNlcnQgYmV0d2VlbiBpdCBhbmQgdGhlIGN1cnJlbnQgbm90ZS5cbiAgICAgIGNvbnN0IG5ld05hbWUgPSB1bmlxdWVOYW1lKGAke2N1cnJlbnROYW1lfS1uZXh0YCwgaW5wdXQuZXhpc3RpbmdOYW1lcyk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBuZXdOYW1lLFxuICAgICAgICBuZXdEZWNrTGlua3M6IFtvdmVydmlld0xpbmssIG5leHRMaW5rXSxcbiAgICAgICAgcmV3cml0ZXM6IFt7IG5hbWU6IGN1cnJlbnROYW1lLCBkZWNrOiBbb3ZlcnZpZXdMaW5rLCBgW1ske25ld05hbWV9XV1gXSB9XSxcbiAgICAgIH07XG4gICAgfVxuICAgIC8vIEludmFsaWQgKHBhdGgtcXVhbGlmaWVkIC8gc2VsZi1yZWZlcmVuY2luZykgbmV4dCBsaW5rIFx1MjE5MiBkcm9wIGl0IGFuZFxuICAgIC8vIGFwcGVuZCBhIG5ldyBsYXN0IHNsaWRlIChmYWxsIHRocm91Z2ggdG8gdGhlIG5vLW5leHQgYnJhbmNoKS5cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBMYXN0IHNsaWRlIFx1MjE5MiBhcHBlbmQgYSBuZXcgbGFzdCBzbGlkZSBhZnRlciBpdCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3QgbmV3TmFtZSA9IHVuaXF1ZU5hbWUoYCR7Y3VycmVudE5hbWV9LW5leHRgLCBpbnB1dC5leGlzdGluZ05hbWVzKTtcbiAgcmV0dXJuIHtcbiAgICBuZXdOYW1lLFxuICAgIG5ld0RlY2tMaW5rczogW292ZXJ2aWV3TGlua10sXG4gICAgcmV3cml0ZXM6IFt7IG5hbWU6IGN1cnJlbnROYW1lLCBkZWNrOiBbb3ZlcnZpZXdMaW5rLCBgW1ske25ld05hbWV9XV1gXSB9XSxcbiAgfTtcbn1cblxuLyoqIEEgbmFtZSB1c2FibGUgYXMgYSB2YXVsdCBub3RlIG5hbWU6IG5vIHBhdGggc2VwYXJhdG9ycywgbm9uLWVtcHR5ICovXG5mdW5jdGlvbiBpc1BsYWluTmFtZShuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIG5hbWUubGVuZ3RoID4gMCAmJiAhbmFtZS5pbmNsdWRlcyhcIi9cIikgJiYgIW5hbWUuaW5jbHVkZXMoXCJcXFxcXCIpO1xufVxuXG4vKiogRmlyc3QgZnJlZSBuYW1lIGluIHRoZSBmYW1pbHkgYGJhc2VgLCBgYmFzZS0yYCwgYGJhc2UtM2AsIFx1MjAyNiAqL1xuZnVuY3Rpb24gdW5pcXVlTmFtZShiYXNlOiBzdHJpbmcsIGV4aXN0aW5nOiBTZXQ8c3RyaW5nPik6IHN0cmluZyB7XG4gIGlmICghZXhpc3RpbmcuaGFzKGJhc2UpKSByZXR1cm4gYmFzZTtcbiAgZm9yIChsZXQgaSA9IDI7IDsgaSsrKSB7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gYCR7YmFzZX0tJHtpfWA7XG4gICAgaWYgKCFleGlzdGluZy5oYXMoY2FuZGlkYXRlKSkgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBbURBLHNCQUErRTs7O0FDekN4RSxJQUFNLGlCQUFpQjtBQXlCdkIsU0FBUyxZQUNkLGFBQ0EsVUFDaUI7QUFDakIsUUFBTSxlQUFlLFNBQVMsV0FBVztBQUN6QyxNQUFJLGFBQWEsV0FBVyxFQUFHLFFBQU87QUFFdEMsTUFBSTtBQUNKLE1BQUk7QUFFSixNQUFJLGFBQWEsVUFBVSxHQUFHO0FBRTVCLGVBQVcsYUFBYSxDQUFDO0FBQ3pCLGdCQUFZLFNBQVMsUUFBUSxFQUFFLENBQUM7QUFBQSxFQUNsQyxPQUFPO0FBR0wsVUFBTSxPQUFPLGFBQWEsQ0FBQztBQUMzQixVQUFNLFlBQVksU0FBUyxJQUFJO0FBQy9CLFFBQUksVUFBVSxDQUFDLE1BQU0sYUFBYTtBQUNoQyxpQkFBVztBQUNYLGtCQUFZO0FBQUEsSUFDZCxPQUFPO0FBQ0wsaUJBQVc7QUFDWCxrQkFBWSxVQUFVLENBQUM7QUFBQSxJQUN6QjtBQUFBLEVBQ0Y7QUFDQSxNQUFJLENBQUMsWUFBWSxDQUFDLFVBQVcsUUFBTztBQUdwQyxRQUFNLFFBQWtCLENBQUM7QUFDekIsUUFBTSxVQUFVLG9CQUFJLElBQVk7QUFDaEMsUUFBTSxPQUFPLENBQUMsTUFBZ0M7QUFDNUMsUUFBSSxLQUFLLENBQUMsUUFBUSxJQUFJLENBQUMsR0FBRztBQUN4QixjQUFRLElBQUksQ0FBQztBQUNiLFlBQU0sS0FBSyxDQUFDO0FB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
