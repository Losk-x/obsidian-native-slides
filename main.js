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
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "E" }],
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
    const barVisible = !!file && (mode === "preview" || mode === "source" && isCard && this.settings.wysiwygMode) && !this.settings.barHidden;
    if (!barVisible) {
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
  /**
   * Toggle the WYSIWYG mode (persisted; only reachable on deck notes).
   * Toggling from reading view jumps into the WYSIWYG edit view, so the
   * unified typography is immediately visible where the user works.
   */
  toggleWysiwyg() {
    this.settings.wysiwygMode = !this.settings.wysiwygMode;
    void this.saveSettings();
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (view && view.getMode() === "preview") {
      const state = view.leaf.getViewState();
      state.state = { ...state.state, mode: "source" };
      void view.leaf.setViewState(state, { focus: false });
    }
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
      "Unified typography between edit and reading views for deck notes (tab bar hides in reading; the bottom bar takes its place). Toggle from the command palette, the Mod+Shift+E hotkey, or the bottom-bar button."
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvZGVjay50cyIsICJzcmMvY3JlYXRlTmV4dC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBuYXRpdmUtc2xpZGVzIFx1MjAxNCByZWFkaW5nLXZpZXcgcHJvcGVydGllcyBiYXIgd2l0aCBQUFQtc3R5bGUgZGVjayBuYXZpZ2F0aW9uXG4gKlxuICogRmVhdHVyZXM6XG4gKiAgIDEuIEhpZGVzIE9ic2lkaWFuJ3MgbmF0aXZlIHN0YXR1cyBiYXIgYW5kIHJlbmRlcnMgYSBcInByb3BlcnRpZXMgYmFyXCIgYXQgdGhlXG4gKiAgICAgIGJvdHRvbSBvZiB0aGUgd2luZG93LlxuICogICAyLiBJbiByZWFkaW5nIHZpZXcsIHNob3dzIHRoZSBjdXJyZW50IG5vdGUncyBwcm9wZXJ0aWVzIChZQU1MIGZyb250bWF0dGVyKVxuICogICAgICBhcyBjaGlwcyBpbiB0aGF0IGJhci5cbiAqICAgMy4gUmVhZGluZyB2aWV3IGF1dG8tZW50ZXJzIGEgZnVsbHNjcmVlbi1saWtlIG1vZGU6IHRoZSByaWJib24sIHNpZGViYXJzLFxuICogICAgICB0YWIgYmFyIGFuZCB0aGUgcGFuZSBoZWFkZXIgYmFyIGFyZSBoaWRkZW47IGxlYXZpbmcgcmVhZGluZyB2aWV3XG4gKiAgICAgIHJlc3RvcmVzIHRoZW0gYXV0b21hdGljYWxseS4gUHJlc3NpbmcgRXNjIHRvIGxlYXZlIHRoZSBPUyBmdWxsc2NyZWVuXG4gKiAgICAgIGFsc28gZXhpdHMgcmVhZGluZyB2aWV3LlxuICogICA0LiBIaWRlcyB0aGUgaW4tbm90ZSBwcm9wZXJ0aWVzIHBhbmVsIGluIHJlYWRpbmcgdmlldyAoa2VwdCBpbiBlZGl0IHZpZXcpLlxuICogICA1LiBQUFQtc3R5bGUgZGVjayBuYXZpZ2F0aW9uIGRyaXZlbiBieSBPTkUgcmVzZXJ2ZWQgZnJvbnRtYXR0ZXIga2V5LCBgZGVja2AsXG4gKiAgICAgIGhvbGRpbmcgdXAgdG8gdHdvIG1hcmtkb3duIGxpbmtzOlxuICogICAgICAgIC0gb3ZlcnZpZXcgbm90ZSA6IGRlY2s6IFtcIltbZmlyc3Qtc2xpZGVdXVwiXSAgICAgICAgICAgIChvbmUgbGluayA9IHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0IHBhZ2Ugb2YgdGhlIGRlY2s7IHRoZSBub3RlIGlzIHRoZSBvdmVydmlldylcbiAqICAgICAgICAtIHNsaWRlIG5vdGUgICAgOiBkZWNrOiBbXCJbW292ZXJ2aWV3XV1cIiwgXCJbW25leHQtc2xpZGVdXVwiXVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIChmaXJzdCBsaW5rID0gdGhlIG92ZXJ2aWV3IHBhZ2UsIHNlY29uZCBsaW5rID0gdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCBzbGlkZTsgb21pdCB0aGUgc2Vjb25kIGxpbmsgb24gdGhlIGxhc3Qgc2xpZGUpXG4gKiAgICAgIFRoZSBwYWdlIG51bWJlciBpcyBjb21wdXRlZCBhdXRvbWF0aWNhbGx5IGJ5IHNjYW5uaW5nIHRoZSB2YXVsdCBhbmRcbiAqICAgICAgd2Fsa2luZyB0aGUgY2hhaW4gb2YgbGlua3MsIHNvIG5vIGBwYWdlLW51bWJlcmAgcHJvcGVydHkgaXMgbmVlZGVkLlxuICogICAgICBcdTI1QzAgXHUyNUI2IGJ1dHRvbnMgYXBwZWFyIG9uIHRoZSBsZWZ0IG9mIHRoZSBiYXIsIGFuZCBcIlByZXZpb3VzIFBhZ2VcIiAvIFwiTmV4dFxuICogICAgICBQYWdlXCIgY29tbWFuZHMgYXJlIHJlZ2lzdGVyZWQgKGRlZmF1bHQgaG90a2V5cyBNb2QrU2hpZnQrXHUyMTkwIC8gTW9kK1NoaWZ0K1x1MjE5MixcbiAqICAgICAgcmViaW5kYWJsZSB1bmRlciBTZXR0aW5ncyBcdTIxOTIgSG90a2V5cykuXG4gKiAgIDYuIEEgc2V0dGluZ3MgdGFiIHRvZ2dsZXMgdGhlIFx1MjVDMCBcdTI1QjYgYnV0dG9ucyBhbmQgdGhlIHBhZ2UgbnVtYmVyLlxuICogICA3LiBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIgY29tbWFuZDogY3JlYXRlcyBhIG5ldyBzbGlkZSByaWdodCBhZnRlciB0aGVcbiAqICAgICAgY3VycmVudCBvbmUgKG5hbWUtY29sbGlzaW9uIGF3YXJlKSwgcmV3aXJlcyB0aGUgYGRlY2tgIHByb3BlcnRpZXMgb2ZcbiAqICAgICAgYm90aCBub3RlcywgYW5kIG9wZW5zIHRoZSBuZXcgbm90ZSBpbiBlZGl0IG1vZGUuXG4gKiAgIDguIFwiVG9nZ2xlIFdZU0lXWUcgTW9kZVwiIChjb21tYW5kICsgaG90a2V5ICsgYm90dG9tLWJhciBidXR0b24sIGRlY2tcbiAqICAgICAgbm90ZXMgb25seSk6IHN3aXRjaGVzIHRvIHVuaWZpZWQgZWRpdC9yZWFkaW5nIHR5cG9ncmFwaHkgXHUyMDE0IGxhdGVyXG4gKiAgICAgIHBoYXNlcyBhZGQgdGhlIHRhYi1iYXIgc3ltbWV0cnkgYW5kIHRoZSB0eXBvZ3JhcGh5IENTUyBzY29wZWRcbiAqICAgICAgdW5kZXIgYm9keS5uYXRpdmUtc2xpZGVzLXd5c2l3eWcuXG4gKlxuICogVGhlIGRlY2sgdXN1YWxseSBzdGFydHMgZnJvbSBhbiBvdmVydmlldyBub3RlIHRoYXQgZW1iZWRzIGFuIE9ic2lkaWFuIEJhc2VcbiAqIHZpZXcgKGNvcmUgXCJCYXNlc1wiIHBsdWdpbikgZmlsdGVyaW5nIG5vdGVzIHRoYXQgbGluayB0byB0aGUgb3ZlcnZpZXcgcGFnZTpcbiAqXG4gKiAgIGBgYGJhc2VcbiAqICAgZmlsdGVyczpcbiAqICAgICBhbmQ6XG4gKiAgICAgICAtIGZpbGUuaGFzTGluayhcIm92ZXJ2aWV3XCIpXG4gKiAgIHZpZXdzOlxuICogICAgIC0gdHlwZTogdGFibGVcbiAqICAgICAgIG5hbWU6IERlY2tcbiAqICAgYGBgXG4gKlxuICogV2h5IHJlYWQgcHJvcGVydGllcyB2aWEgbWV0YWRhdGFDYWNoZSBpbnN0ZWFkIG9mIHBhcnNpbmcgWUFNTCBtYW51YWxseT9cbiAqICAgT2JzaWRpYW4gbWFpbnRhaW5zIGEgY2FjaGUgcGVyIG5vdGU7IG1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpXG4gKiAgIC5mcm9udG1hdHRlciByZXR1cm5zIHRoZSBwYXJzZWQgcHJvcGVydGllcywgdXBkYXRlZCBhdXRvbWF0aWNhbGx5IG9uIHNhdmUuXG4gKi9cblxuaW1wb3J0IHsgTWFya2Rvd25WaWV3LCBOb3RpY2UsIFBsdWdpbiwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZywgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IHBsYW5DcmVhdGVOZXh0LCB0eXBlIENyZWF0ZU5leHRSZXN1bHQgfSBmcm9tIFwiLi9zcmMvY3JlYXRlTmV4dFwiO1xuaW1wb3J0IHsgY29tcHV0ZURlY2ssIGV4dHJhY3RMaW5rcywgZXh0cmFjdFJhd0xpbmtzLCBmb3JtYXRWYWx1ZSwgdHlwZSBEZWNrSW5mbyB9IGZyb20gXCIuL3NyYy9kZWNrXCI7XG5cbi8qKiBQbHVnaW4gc2V0dGluZ3MgKi9cbmludGVyZmFjZSBOYXRpdmVTbGlkZXNTZXR0aW5ncyB7XG4gIC8qKiBTaG93IFx1MjVDMCBcdTI1QjYgcHJldmlvdXMvbmV4dCBidXR0b25zIG9uIHRoZSBsZWZ0IG9mIHRoZSBiYXIgKi9cbiAgc2hvd05hdkJ1dHRvbnM6IGJvb2xlYW47XG4gIC8qKiBTaG93IHRoZSBhdXRvLWNvbXB1dGVkIHBhZ2UgbnVtYmVyIGF0IHRoZSBib3R0b20tcmlnaHQgb2YgdGhlIGJhciAqL1xuICBzaG93UGFnZU51bWJlcjogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgdGhlIHVzZXIgbWFudWFsbHkgaGlkIHRoZSBiYXIgKHRvZ2dsZSBjb21tYW5kKSAqL1xuICBiYXJIaWRkZW46IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIGF1dG8tZnVsbHNjcmVlbiBpbiByZWFkaW5nIHZpZXcgaXMgZW5hYmxlZCAqL1xuICBhdXRvRnVsbHNjcmVlbjogYm9vbGVhbjtcbiAgLyoqIEhpZGUgYSBmb2xkZWQgcHJvcGVydGllcyBwYW5lbCBjb21wbGV0ZWx5IGluIExpdmUgUHJldmlldyBmb3IgZGVjayBub3RlcyAqL1xuICBoaWRlQ2FyZFByb3BlcnRpZXNJbkVkaXQ6IGJvb2xlYW47XG4gIC8qKiBXWVNJV1lHIG1vZGUgKHVuaWZpZWQgZWRpdC9yZWFkaW5nIHR5cG9ncmFwaHkpIFx1MjAxNCBkZWNrIG5vdGVzIG9ubHkgKi9cbiAgd3lzaXd5Z01vZGU6IGJvb2xlYW47XG59XG5cbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IE5hdGl2ZVNsaWRlc1NldHRpbmdzID0ge1xuICBzaG93TmF2QnV0dG9uczogdHJ1ZSxcbiAgc2hvd1BhZ2VOdW1iZXI6IHRydWUsXG4gIGJhckhpZGRlbjogZmFsc2UsXG4gIGF1dG9GdWxsc2NyZWVuOiB0cnVlLFxuICBoaWRlQ2FyZFByb3BlcnRpZXNJbkVkaXQ6IHRydWUsXG4gIHd5c2l3eWdNb2RlOiBmYWxzZSxcbn07XG5cbi8qKiBSZXNlcnZlZCBmcm9udG1hdHRlciBrZXkgZHJpdmluZyBkZWNrIG5hdmlnYXRpb24gKG5ldmVyIHJlbmRlcmVkIGFzIGEgY2hpcCkgKi9cbmNvbnN0IERFQ0tfS0VZID0gXCJkZWNrXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE5hdGl2ZVNsaWRlc1BsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIC8qKiBUaGUgcHJvcGVydGllcyBiYXIgRE9NIGVsZW1lbnQgKi9cbiAgcHJpdmF0ZSBiYXI6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIC8qKiBXaGV0aGVyIGZ1bGxzY3JlZW4gcmVhZGluZyBtb2RlIGlzIGN1cnJlbnRseSBhY3RpdmUgKi9cbiAgcHJpdmF0ZSBmdWxsc2NyZWVuID0gZmFsc2U7XG4gIC8qKiBMYXN0IHJlZnJlc2gga2V5IChcInBhdGh8bW9kZVwiKSB0byBhdm9pZCBwb2ludGxlc3MgcmUtcmVuZGVycyAqL1xuICBwcml2YXRlIGxhc3RLZXkgPSBcIlwiO1xuICAvKiogV2hldGhlciB0aGUgcmlnaHQtc2lkZWJhciBQcm9wZXJ0aWVzIHZpZXcgd2FzIGF1dG8tb3BlbmVkIHRoaXMgc2Vzc2lvbiAqL1xuICBwcml2YXRlIHNpZGViYXJPcGVuZWRUaGlzU2Vzc2lvbiA9IGZhbHNlO1xuICAvKiogUGx1Z2luIHNldHRpbmdzICovXG4gIHNldHRpbmdzOiBOYXRpdmVTbGlkZXNTZXR0aW5ncyA9IHsgLi4uREVGQVVMVF9TRVRUSU5HUyB9O1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgTmF0aXZlU2xpZGVzU2V0dGluZ1RhYih0aGlzKSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMS4gUmVmcmVzaCBvbiBcImN1cnJlbnQgbm90ZSAvIHZpZXcgY2hhbmdlZFwiIGV2ZW50cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsICgpID0+IHRoaXMucmVmcmVzaCgpKSk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAoKSA9PiB0aGlzLnJlZnJlc2goKSkpO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJsYXlvdXQtY2hhbmdlXCIsICgpID0+IHRoaXMucmVmcmVzaCgpKSk7XG4gICAgLy8gUmVmcmVzaCB3aGVuIHRoZSBub3RlIGNvbnRlbnQgKGluY2x1ZGluZyBmcm9udG1hdHRlcikgY2hhbmdlcyAvIHNhdmVzXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5vbihcImNoYW5nZWRcIiwgKGZpbGU6IFRGaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlID09PSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpKSB0aGlzLnJlZnJlc2goKTtcbiAgICAgIH0pLFxuICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMi4gRmFsbGJhY2sgdGltZXI6IGVkaXRcdTIxOTRyZWFkaW5nIHRvZ2dsZXMgbWF5IGZpcmUgbm8gc3RhbmRhcmQgZXZlbnQgXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5yZWdpc3RlckludGVydmFsKFxuICAgICAgd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGNvbnN0IGtleSA9IGZpbGUgPyBgJHtmaWxlLnBhdGh9fCR7dGhpcy5jdXJyZW50TW9kZSgpfWAgOiBcIlwiO1xuICAgICAgICBpZiAoa2V5ICE9PSB0aGlzLmxhc3RLZXkpIHtcbiAgICAgICAgICB0aGlzLmxhc3RLZXkgPSBrZXk7XG4gICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgIH1cbiAgICAgIH0sIDUwMCksXG4gICAgKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCAzLiBDb21tYW5kcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICAvLyAzYS4gTWFudWFsbHkgc2hvdyAvIGhpZGUgdGhlIHByb3BlcnRpZXMgYmFyXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLXRvZ2dsZS1iYXJcIixcbiAgICAgIG5hbWU6IFwiVG9nZ2xlIFByb3BlcnRpZXMgQmFyXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgICB0aGlzLnNldHRpbmdzLmJhckhpZGRlbiA9ICF0aGlzLnNldHRpbmdzLmJhckhpZGRlbjtcbiAgICAgICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIC8vIDNiLiBQYXVzZSAvIHJlc3VtZSBhdXRvLWZ1bGxzY3JlZW4gaW4gcmVhZGluZyB2aWV3XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLXRvZ2dsZS1mdWxsc2NyZWVuXCIsXG4gICAgICBuYW1lOiBcIlBhdXNlL1Jlc3VtZSBBdXRvIEZ1bGxzY3JlZW5cIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MuYXV0b0Z1bGxzY3JlZW4gPSAhdGhpcy5zZXR0aW5ncy5hdXRvRnVsbHNjcmVlbjtcbiAgICAgICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgLy8gV2hlbiBwYXVzZWQsIHJlc3RvcmUgdGhlIGxheW91dCBpbW1lZGlhdGVseTsgd2hlbiByZXN1bWVkLCByZS1zeW5jXG4gICAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5hdXRvRnVsbHNjcmVlbikgdGhpcy5zeW5jRnVsbHNjcmVlbihmYWxzZSk7XG4gICAgICAgIGVsc2UgdGhpcy5yZWZyZXNoKCk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIC8vIDNjLiBQcmV2aW91cyAvIG5leHQgcGFnZSAoZGVjayBuYXZpZ2F0aW9uLCByZWJpbmRhYmxlIGluIFNldHRpbmdzIFx1MjE5MiBIb3RrZXlzKVxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJucy1wcmV2XCIsXG4gICAgICBuYW1lOiBcIlByZXZpb3VzIFBhZ2VcIixcbiAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJBcnJvd0xlZnRcIiB9XSxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLm5hdmlnYXRlKFwicHJldlwiKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibnMtbmV4dFwiLFxuICAgICAgbmFtZTogXCJOZXh0IFBhZ2VcIixcbiAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJBcnJvd1JpZ2h0XCIgfV0sXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5uYXZpZ2F0ZShcIm5leHRcIiksXG4gICAgfSk7XG4gICAgLy8gM2QuIENyZWF0ZSBOZXh0IFNsaWRlIFx1MjAxNCBuZXcgc2xpZGUgYWZ0ZXIgdGhlIGN1cnJlbnQgb25lIChkZWNrIG5vdGVzIG9ubHkpXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLWNyZWF0ZS1uZXh0XCIsXG4gICAgICBuYW1lOiBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIsXG4gICAgICAvLyBHcmV5ZWQgb3V0IGluIHRoZSBwYWxldHRlIHVubGVzcyB0aGUgYWN0aXZlIG5vdGUgY2FuIHRha2UgYSBuZXh0IHNsaWRlXG4gICAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmcpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGlmICghZmlsZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBjb25zdCBwbGFuID0gdGhpcy5wbGFuQ3JlYXRlTmV4dChmaWxlKTtcbiAgICAgICAgaWYgKCFwbGFuKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghY2hlY2tpbmcpIHZvaWQgdGhpcy5leGVjdXRlQ3JlYXRlTmV4dChmaWxlLCBwbGFuKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIC8vIDNlLiBUb2dnbGUgV1lTSVdZRyBtb2RlIFx1MjAxNCB1bmlmaWVkIGVkaXQvcmVhZGluZyB0eXBvZ3JhcGh5IChkZWNrIG5vdGVzIG9ubHkpXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLXRvZ2dsZS13eXNpd3lnXCIsXG4gICAgICBuYW1lOiBcIlRvZ2dsZSBXWVNJV1lHIE1vZGVcIixcbiAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJFXCIgfV0sXG4gICAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmcpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGlmICghZmlsZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBjb25zdCBmbSA9IHRoaXMuZnJvbnRtYXR0ZXJPZihmaWxlKTtcbiAgICAgICAgaWYgKGZtID09PSBudWxsIHx8ICEoREVDS19LRVkgaW4gZm0pKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghY2hlY2tpbmcpIHRoaXMudG9nZ2xlV3lzaXd5ZygpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgNC4gRXNjIGV4aXRzIE9TIGZ1bGxzY3JlZW4gXHUyMTkyIGxlYXZlIHJlYWRpbmcgdmlldyBhcyB3ZWxsIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIC8vIEtlZXBzIGludGVybmFsIHN0YXRlIGluIHN5bmMgd2hlbiB0aGUgdXNlciBwcmVzc2VzIEVzYzsgYWxzbyBzd2l0Y2hlc1xuICAgIC8vIHRoZSBhY3RpdmUgTWFya2Rvd24gdmlldyBiYWNrIHRvIGVkaXQgbW9kZS4gT3VyIG93biBleGl0RnVsbHNjcmVlbigpXG4gICAgLy8gY2FsbHMgc2V0IHRoaXMuZnVsbHNjcmVlbiA9IGZhbHNlIGZpcnN0LCBzbyB0aGV5IG5ldmVyIHRyaWdnZXIgdGhpcy5cbiAgICB0aGlzLnJlZ2lzdGVyRG9tRXZlbnQoZG9jdW1lbnQsIFwiZnVsbHNjcmVlbmNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBpZiAoIWRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50ICYmIHRoaXMuZnVsbHNjcmVlbikge1xuICAgICAgICB0aGlzLmZ1bGxzY3JlZW4gPSBmYWxzZTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKFwibmF0aXZlLXNsaWRlcy1mdWxsc2NyZWVuXCIpO1xuICAgICAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICAgICAgaWYgKHZpZXcgJiYgdmlldy5nZXRNb2RlKCkgPT09IFwicHJldmlld1wiKSB7XG4gICAgICAgICAgLy8gTGVhdmUgcmVhZGluZyB2aWV3IHZpYSB0aGUgcHVibGljIHZpZXctc3RhdGUgQVBJXG4gICAgICAgICAgY29uc3Qgc3RhdGUgPSB2aWV3LmxlYWYuZ2V0Vmlld1N0YXRlKCk7XG4gICAgICAgICAgc3RhdGUuc3RhdGUgPSB7IC4uLnN0YXRlLnN0YXRlLCBtb2RlOiBcInNvdXJjZVwiIH07XG4gICAgICAgICAgdm9pZCB2aWV3LmxlYWYuc2V0Vmlld1N0YXRlKHN0YXRlLCB7IGZvY3VzOiBmYWxzZSB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDUuIENyZWF0ZSB0aGUgYmFyIGFuZCBkbyB0aGUgZmlyc3QgcmVuZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIHRoaXMuYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLmJhci5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtYmFyXCI7XG4gICAgdGhpcy5iYXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiOyAvLyBoaWRkZW4gdW50aWwgcmVmcmVzaCgpIGRlY2lkZXMgb3RoZXJ3aXNlXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmJhcik7XG4gICAgdGhpcy5yZWZyZXNoKCk7XG4gIH1cblxuICBvbnVubG9hZCgpOiB2b2lkIHtcbiAgICB0aGlzLmJhcj8ucmVtb3ZlKCk7XG4gICAgdGhpcy5iYXIgPSBudWxsO1xuICAgIC8vIExlYXZlIE9TIGZ1bGxzY3JlZW4gYW5kIGRyb3AgdGhlIGZ1bGxzY3JlZW4gY2xhc3Mgc28gbm8gVUkgcmVzaWR1ZSByZW1haW5zXG4gICAgaWYgKGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50KSBkb2N1bWVudC5leGl0RnVsbHNjcmVlbj8uKCkuY2F0Y2goKCkgPT4ge30pO1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShcIm5hdGl2ZS1zbGlkZXMtZnVsbHNjcmVlblwiKTtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoXCJuYXRpdmUtc2xpZGVzLXd5c2l3eWdcIik7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU2V0dGluZ3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgRGVjayByZXNvbHV0aW9uICh3YWxrIHRoZSBsaW5rIGNoYWluKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICAvKiogUmVzb2x2ZSB0aGUgY3VycmVudCBub3RlJ3MgcG9zaXRpb24gaW5zaWRlIGl0cyBkZWNrIChwYXRoLWJhc2VkIHdyYXBwZXIpICovXG4gIHByaXZhdGUgY29tcHV0ZURlY2soZmlsZTogVEZpbGUpOiBEZWNrSW5mbyB8IG51bGwge1xuICAgIHJldHVybiBjb21wdXRlRGVjayhmaWxlLnBhdGgsIChwYXRoKSA9PiB0aGlzLmRlY2tMaW5rUGF0aHMocGF0aCkpO1xuICB9XG5cbiAgLyoqIFJlc29sdmUgdGhlIGBkZWNrYCBwcm9wZXJ0eSBvZiBhIG5vdGUgaW50byByZWFsIG5vdGUgcGF0aHMgKG1heCB0d28pICovXG4gIHByaXZhdGUgZGVja0xpbmtQYXRocyhwYXRoOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZiA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcbiAgICBpZiAoIShmIGluc3RhbmNlb2YgVEZpbGUpKSByZXR1cm4gW107XG4gICAgY29uc3QgZm0gPSB0aGlzLmZyb250bWF0dGVyT2YoZik7XG4gICAgY29uc3QgbmFtZXMgPSBmbSA/IGV4dHJhY3RMaW5rcyhmbVtERUNLX0tFWV0pIDogW107XG4gICAgcmV0dXJuIG5hbWVzXG4gICAgICAubWFwKChuYW1lKSA9PiB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KG5hbWUsIHBhdGgpKVxuICAgICAgLmZpbHRlcigoeCk6IHggaXMgVEZpbGUgPT4gISF4KVxuICAgICAgLm1hcCgoeCkgPT4geC5wYXRoKTtcbiAgfVxuXG4gIC8qKiBOYW1lcyBpbiB0aGUgYGRlY2tgIHByb3BlcnR5IHRoYXQgcmVzb2x2ZSB0byBubyBub3RlIChicm9rZW4gbGlua3MpICovXG4gIHByaXZhdGUgYnJva2VuRGVja0xpbmtzKGZpbGU6IFRGaWxlKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGZtID0gdGhpcy5mcm9udG1hdHRlck9mKGZpbGUpO1xuICAgIGNvbnN0IG5hbWVzID0gZm0gPyBleHRyYWN0TGlua3MoZm1bREVDS19LRVldKSA6IFtdO1xuICAgIHJldHVybiBuYW1lcy5maWx0ZXIoKG5hbWUpID0+ICF0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KG5hbWUsIGZpbGUucGF0aCkpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIENyZWF0ZSBOZXh0IFNsaWRlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKlxuICAgKiBQbGFuIGEgXCJDcmVhdGUgTmV4dCBTbGlkZVwiIHJ1biBmb3IgdGhlIGFjdGl2ZSBub3RlLCBvciBudWxsIHdoZW4gdGhlXG4gICAqIG5vdGUgY2Fubm90IHRha2UgYSBuZXh0IHNsaWRlIChubyB1c2FibGUgYGRlY2tgIHByb3BlcnR5KS5cbiAgICpcbiAgICogU2xpZGVzIG9uIHRoZSBjaGFpbiBpbnNlcnQvYXBwZW5kIGFmdGVyIHRoZSBjdXJyZW50IG5vdGU7IHRoZSBvdmVydmlld1xuICAgKiBwYWdlIGluc2VydHMgYSBuZXcgZmlyc3QgcGFnZTsgYW4gb2ZmLWNoYWluIG5vdGUgd2l0aCBhIHJlc29sdmFibGVcbiAgICogb3ZlcnZpZXcgbGluayBzdGlsbCBnZXRzIGl0cyBkZWNsYXJlZCBtaXNzaW5nIG5leHQgbm90ZSBjcmVhdGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBwbGFuQ3JlYXRlTmV4dChmaWxlOiBURmlsZSk6IENyZWF0ZU5leHRSZXN1bHQgfCBudWxsIHtcbiAgICBjb25zdCBmbSA9IHRoaXMuZnJvbnRtYXR0ZXJPZihmaWxlKTtcbiAgICBjb25zdCByYXcgPSBmbSA/IGV4dHJhY3RSYXdMaW5rcyhmbVtERUNLX0tFWV0pIDogW107XG4gICAgaWYgKHJhdy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuXG4gICAgY29uc3QgZGVjayA9IHRoaXMuY29tcHV0ZURlY2soZmlsZSk7XG4gICAgY29uc3QgZXhpc3RpbmdOYW1lcyA9IG5ldyBTZXQodGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpLm1hcCgoZikgPT4gZi5iYXNlbmFtZSkpO1xuXG4gICAgaWYgKGRlY2spIHtcbiAgICAgIC8vIE92ZXJ2aWV3IGluc2VydGlvbiBuZWVkcyB0aGUgb2xkIGZpcnN0IHBhZ2UncyBiYWNrIGxpbmsgdG8gdGhlXG4gICAgICAvLyBvdmVydmlldyAoaXRzIG93biBmcm9udG1hdHRlciBvbmx5IGxpbmtzIGZvcndhcmQpLlxuICAgICAgbGV0IG92ZXJ2aWV3QmFja0xpbms6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChkZWNrLmluZGV4ID09PSAwKSB7XG4gICAgICAgIGNvbnN0IG9sZEZpcnN0ID0gZGVjay5jaGFpblsxXSA/IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChkZWNrLmNoYWluWzFdKSA6IG51bGw7XG4gICAgICAgIGlmIChvbGRGaXJzdCBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICAgICAgY29uc3QgZjIgPSB0aGlzLmZyb250bWF0dGVyT2Yob2xkRmlyc3QpO1xuICAgICAgICAgIG92ZXJ2aWV3QmFja0xpbmsgPSBmMiA/IGV4dHJhY3RSYXdMaW5rcyhmMltERUNLX0tFWV0pWzBdIDogdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcGxhbkNyZWF0ZU5leHQoe1xuICAgICAgICBjdXJyZW50TmFtZTogZmlsZS5iYXNlbmFtZSxcbiAgICAgICAgY3VycmVudExpbmtzOiByYXcsXG4gICAgICAgIGlzT3ZlcnZpZXc6IGRlY2suaW5kZXggPT09IDAsXG4gICAgICAgIG92ZXJ2aWV3QmFja0xpbmssXG4gICAgICAgIGV4aXN0aW5nTmFtZXMsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBPZmYtY2hhaW4gbm90ZTogc3RpbGwgY3JlYXRlIGl0cyBkZWNsYXJlZCBtaXNzaW5nIG5leHQgbm90ZSB3aGVuIHRoZVxuICAgIC8vIG92ZXJ2aWV3IGxpbmsgcmVzb2x2ZXMgKHRoZSBcdTI2QTAgYnJva2VuLWxpbmsgd2FybmluZyBkaXNhcHBlYXJzKS5cbiAgICBjb25zdCBvdmVydmlld05hbWUgPSByYXcubGVuZ3RoID49IDIgPyBleHRyYWN0TGlua3MocmF3WzBdKVswXSA6IG51bGw7XG4gICAgaWYgKG92ZXJ2aWV3TmFtZSAmJiB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KG92ZXJ2aWV3TmFtZSwgZmlsZS5wYXRoKSkge1xuICAgICAgcmV0dXJuIHBsYW5DcmVhdGVOZXh0KHtcbiAgICAgICAgY3VycmVudE5hbWU6IGZpbGUuYmFzZW5hbWUsXG4gICAgICAgIGN1cnJlbnRMaW5rczogcmF3LFxuICAgICAgICBpc092ZXJ2aWV3OiBmYWxzZSxcbiAgICAgICAgZXhpc3RpbmdOYW1lcyxcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKiBBcHBseSBhIHBsYW46IGNyZWF0ZSB0aGUgbm90ZSwgcmV3aXJlIGBkZWNrYCBwcm9wZXJ0aWVzLCBvcGVuIGl0ICovXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZUNyZWF0ZU5leHQoZmlsZTogVEZpbGUsIHBsYW46IENyZWF0ZU5leHRSZXN1bHQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBkaXIgPSBmaWxlLnBhcmVudD8ucGF0aCA/IGZpbGUucGFyZW50LnBhdGggKyBcIi9cIiA6IFwiXCI7XG4gICAgY29uc3QgbmV3UGF0aCA9IGAke2Rpcn0ke3BsYW4ubmV3TmFtZX0ubWRgO1xuICAgIGNvbnN0IGZyb250bWF0dGVyID0gcGxhbi5uZXdEZWNrTGlua3MubWFwKChsaW5rKSA9PiBKU09OLnN0cmluZ2lmeShsaW5rKSkuam9pbihcIiwgXCIpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBgLS0tXFxuZGVjazogWyR7ZnJvbnRtYXR0ZXJ9XVxcbi0tLVxcbmA7XG5cbiAgICBsZXQgbmV3RmlsZTogVEZpbGU7XG4gICAgdHJ5IHtcbiAgICAgIG5ld0ZpbGUgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUobmV3UGF0aCwgY29udGVudCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIG5ldyBOb3RpY2UoYE5hdGl2ZSBTbGlkZXM6IGNvdWxkIG5vdCBjcmVhdGUgXCIke3BsYW4ubmV3TmFtZX0ubWRcIiAoJHtTdHJpbmcoZXJyb3IpfSlgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSZXdpcmUgdGhlIGN1cnJlbnQgbm90ZSdzIGBkZWNrYCAoa2VlcHMgYWxsIG90aGVyIHByb3BlcnRpZXMgaW50YWN0KVxuICAgIGZvciAoY29uc3QgcmV3cml0ZSBvZiBwbGFuLnJld3JpdGVzKSB7XG4gICAgICBpZiAocmV3cml0ZS5uYW1lICE9PSBmaWxlLmJhc2VuYW1lKSBjb250aW51ZTsgLy8gaW4gcHJhY3RpY2UgYWx3YXlzIHRoZSBjdXJyZW50IG5vdGVcbiAgICAgIGF3YWl0IHRoaXMuYXBwLmZpbGVNYW5hZ2VyLnByb2Nlc3NGcm9udE1hdHRlcihmaWxlLCAoZm0pID0+IHtcbiAgICAgICAgZm1bREVDS19LRVldID0gcmV3cml0ZS5kZWNrO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gT3BlbiB0aGUgbmV3IG5vdGUgaW4gdGhlIGN1cnJlbnQgcGFuZSwgZWRpdCBtb2RlIChMaXZlIFByZXZpZXcpXG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKTtcbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKG5ld0ZpbGUsIHsgc3RhdGU6IHsgbW9kZTogXCJzb3VyY2VcIiB9IH0pO1xuICB9XG5cbiAgLyoqIE9wZW4gdGhlIGJ1aWx0LWluIFwiUHJvcGVydGllcyB2aWV3OiBTaG93IGZpbGUgcHJvcGVydGllc1wiIHBhbmVsICovXG4gIHByaXZhdGUgYXN5bmMgc2hvd0ZpbGVQcm9wZXJ0aWVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIGBhcHAuY29tbWFuZHNgIGlzIG5vdCBpbiB0aGUgcHVibGljIHR5cGluZ3M7IHRoZSBydW50aW1lIEFQSSBpcyBzdGFibGVcbiAgICAvLyBhbmQgZXhlY3V0aW5nIGEgYnVpbHQtaW4gY29tbWFuZCBpcyB0aGUgc3RhbmRhcmQgd2F5IHRvIG9wZW4gdGhlIHBhbmVsLlxuICAgIGNvbnN0IGNvbW1hbmRzID0gKFxuICAgICAgdGhpcy5hcHAgYXMgdW5rbm93biBhcyB7XG4gICAgICAgIGNvbW1hbmRzPzoge1xuICAgICAgICAgIGNvbW1hbmRzPzogUmVjb3JkPHN0cmluZywgeyBuYW1lPzogc3RyaW5nIH0+O1xuICAgICAgICAgIGV4ZWN1dGVDb21tYW5kQnlJZD86IChpZDogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+O1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICkuY29tbWFuZHM7XG4gICAgaWYgKCFjb21tYW5kcz8uZXhlY3V0ZUNvbW1hbmRCeUlkKSByZXR1cm47XG4gICAgLy8gTG9jYXRlIHRoZSBjb21tYW5kIGJ5IGl0cyAobG9jYWxpemVkKSBuYW1lIFx1MjAxNCByb2J1c3QgYWNyb3NzIHZlcnNpb25zXG4gICAgY29uc3QgaWQgPSBPYmplY3QuZW50cmllcyhjb21tYW5kcy5jb21tYW5kcyA/PyB7fSkuZmluZCgoWywgY10pID0+XG4gICAgICAvKD86c2hvd3xkaXNwbGF5KS4qZmlsZS4qcHJvcGVydGllc3woPzpcdTY2M0VcdTc5M0F8XHU2MjUzXHU1RjAwKS4qXHU2NTg3XHU0RUY2LipcdTVDNUVcdTYwMjcvaS50ZXN0KGMubmFtZSA/PyBcIlwiKSxcbiAgICApPy5bMF07XG4gICAgaWYgKGlkKSBhd2FpdCBjb21tYW5kcy5leGVjdXRlQ29tbWFuZEJ5SWQoaWQpO1xuICB9XG5cbiAgLyoqIEZyb250bWF0dGVyIG9mIGFueSBub3RlIGFzIGFuIG9iamVjdCwgb3IgbnVsbCB3aGVuIGFic2VudCAqL1xuICBwcml2YXRlIGZyb250bWF0dGVyT2YoZmlsZTogVEZpbGUpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG4gICAgcmV0dXJuIGNhY2hlPy5mcm9udG1hdHRlciA/PyBudWxsO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFBQVCBuYXZpZ2F0aW9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBNb3ZlIG9uZSBzdGVwIGJhY2svZm9yd2FyZCBhbG9uZyB0aGUgZGVjayBjaGFpbiAqL1xuICBwcml2YXRlIG5hdmlnYXRlKGRpcmVjdGlvbjogXCJwcmV2XCIgfCBcIm5leHRcIik6IHZvaWQge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGlmICghZmlsZSkgcmV0dXJuO1xuICAgIGNvbnN0IGRlY2sgPSB0aGlzLmNvbXB1dGVEZWNrKGZpbGUpO1xuICAgIGlmICghZGVjaykgcmV0dXJuO1xuICAgIGNvbnN0IHRhcmdldCA9IGRlY2suY2hhaW5bZGlyZWN0aW9uID09PSBcInByZXZcIiA/IGRlY2suaW5kZXggLSAxIDogZGVjay5pbmRleCArIDFdO1xuICAgIGlmICghdGFyZ2V0KSByZXR1cm47XG4gICAgdm9pZCB0aGlzLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KHRhcmdldCwgZmlsZS5wYXRoKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBNb2RlIC8gZGF0YSBhY2Nlc3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLyoqIE1vZGUgb2YgdGhlIGFjdGl2ZSBNYXJrZG93biB2aWV3OiAncHJldmlldyc9cmVhZGluZyAnc291cmNlJz1lZGl0aW5nICcnPW5vbmUgKi9cbiAgcHJpdmF0ZSBjdXJyZW50TW9kZSgpOiBcInByZXZpZXdcIiB8IFwic291cmNlXCIgfCBcIlwiIHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICByZXR1cm4gdmlldyA/ICh2aWV3LmdldE1vZGUoKSBhcyBcInByZXZpZXdcIiB8IFwic291cmNlXCIpIDogXCJcIjtcbiAgfVxuXG4gIC8qKiBDdXJyZW50IG5vdGUncyBmcm9udG1hdHRlciBhcyBhbiBvYmplY3QsIG9yIG51bGwgd2hlbiBhYnNlbnQgKi9cbiAgcHJpdmF0ZSBmcm9udG1hdHRlcigpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIHJldHVybiBmaWxlID8gdGhpcy5mcm9udG1hdHRlck9mKGZpbGUpIDogbnVsbDtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBCYXIgcmVuZGVyaW5nIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBEZWNpZGUgd2hhdCB0aGUgYmFyIHNob3dzLCB0aGVuIHJlLXJlbmRlciBpdCAqL1xuICByZWZyZXNoKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5iYXIpIHJldHVybjtcblxuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGNvbnN0IG1vZGUgPSB0aGlzLmN1cnJlbnRNb2RlKCk7XG5cbiAgICAvLyBDYXJkLW5vdGUgYm9keSBjbGFzcyAobm90ZSBoYXMgYSBgZGVja2AgcHJvcGVydHkpIFx1MjAxNCBlbmFibGVzIHRoZVxuICAgIC8vIGVkaXQtbW9kZSBcImhpZGUgaW4tbm90ZSBwcm9wZXJ0aWVzXCIgQ1NTIChMaXZlIFByZXZpZXcgV1lTSVdZRyBzdGVwKS5cbiAgICBjb25zdCBjYXJkRm0gPSBmaWxlID8gdGhpcy5mcm9udG1hdHRlck9mKGZpbGUpIDogbnVsbDtcbiAgICBjb25zdCBpc0NhcmQgPSBjYXJkRm0gIT09IG51bGwgJiYgREVDS19LRVkgaW4gY2FyZEZtO1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnRvZ2dsZShcbiAgICAgIFwibmF0aXZlLXNsaWRlcy1jYXJkXCIsXG4gICAgICBpc0NhcmQgJiYgdGhpcy5zZXR0aW5ncy5oaWRlQ2FyZFByb3BlcnRpZXNJbkVkaXQsXG4gICAgKTtcbiAgICAvLyBXWVNJV1lHIG1vZGUgYm9keSBjbGFzcyBcdTIwMTQgdW5pZmllZCBlZGl0L3JlYWRpbmcgdHlwb2dyYXBoeSBDU1NcbiAgICAvLyAoZGVjayBub3RlcyBvbmx5OyB0aGUgdHlwb2dyYXBoeSBydWxlcyBsYW5kIGluIGxhdGVyIHBoYXNlcylcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC50b2dnbGUoXCJuYXRpdmUtc2xpZGVzLXd5c2l3eWdcIiwgaXNDYXJkICYmIHRoaXMuc2V0dGluZ3Mud3lzaXd5Z01vZGUpO1xuXG4gICAgLy8gV1lTSVdZRzogb25jZSBwZXIgc2Vzc2lvbiwgb3BlbiB0aGUgcmlnaHQtc2lkZWJhciBQcm9wZXJ0aWVzIHZpZXcgd2hlbiBhXG4gICAgLy8gY2FyZCBub3RlIGlzIGFjdGl2YXRlZCBpbiBlZGl0IG1vZGUgXHUyMDE0IGEgZ2VudGxlIGhpbnQgdGhhdCBpdHMgKGhpZGRlbilcbiAgICAvLyBwcm9wZXJ0aWVzIGFyZSBlZGl0ZWQgdGhlcmUuXG4gICAgaWYgKFxuICAgICAgaXNDYXJkICYmXG4gICAgICB0aGlzLnNldHRpbmdzLmhpZGVDYXJkUHJvcGVydGllc0luRWRpdCAmJlxuICAgICAgbW9kZSA9PT0gXCJzb3VyY2VcIiAmJlxuICAgICAgIXRoaXMuc2lkZWJhck9wZW5lZFRoaXNTZXNzaW9uXG4gICAgKSB7XG4gICAgICB0aGlzLnNpZGViYXJPcGVuZWRUaGlzU2Vzc2lvbiA9IHRydWU7XG4gICAgICB2b2lkIHRoaXMuc2hvd0ZpbGVQcm9wZXJ0aWVzKCk7XG4gICAgfVxuXG4gICAgLy8gQXV0by1mdWxsc2NyZWVuOiBlbnRlciBvbiByZWFkaW5nIHZpZXcsIHJlc3RvcmUgb24gbGVhdmluZyBpdFxuICAgIHRoaXMuc3luY0Z1bGxzY3JlZW4obW9kZSA9PT0gXCJwcmV2aWV3XCIgJiYgdGhpcy5zZXR0aW5ncy5hdXRvRnVsbHNjcmVlbik7XG5cbiAgICAvLyBCYXIgdmlzaWJpbGl0eTogcmVhZGluZyB2aWV3IGFsd2F5czsgZWRpdCB2aWV3IG9ubHkgaW4gV1lTSVdZRyBtb2RlXG4gICAgLy8gKHNvIHRoZSBtb2RlIGhhcyB2aXNpYmxlIGZlZWRiYWNrIHdoaWxlIGVkaXRpbmcpLiBIaWRkZW4gd2hlbiB0aGVcbiAgICAvLyB1c2VyIGhpZCBpdCBtYW51YWxseS5cbiAgICBjb25zdCBiYXJWaXNpYmxlID1cbiAgICAgICEhZmlsZSAmJlxuICAgICAgKG1vZGUgPT09IFwicHJldmlld1wiIHx8IChtb2RlID09PSBcInNvdXJjZVwiICYmIGlzQ2FyZCAmJiB0aGlzLnNldHRpbmdzLnd5c2l3eWdNb2RlKSkgJiZcbiAgICAgICF0aGlzLnNldHRpbmdzLmJhckhpZGRlbjtcbiAgICBpZiAoIWJhclZpc2libGUpIHtcbiAgICAgIHRoaXMuYmFyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmbSA9IHRoaXMuZnJvbnRtYXR0ZXIoKTtcbiAgICBjb25zdCBkZWNrID0gdGhpcy5jb21wdXRlRGVjayhmaWxlKTtcbiAgICBjbGVhckNoaWxkcmVuKHRoaXMuYmFyKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBMZWZ0OiBwcmV2aW91cyAvIG5leHQgYnV0dG9ucyAoYm90aCBhbHdheXMgc2hvd24gaW5zaWRlIGEgZGVjaztcbiAgICAvLyAgICAgICAgdGhlIG9uZSB0aGF0IGNhbm5vdCBtb3ZlIGlzIGRpc2FibGVkIC8gbGlnaHQgZ3JheSkgXHUyNTAwXHUyNTAwXG4gICAgaWYgKHRoaXMuc2V0dGluZ3Muc2hvd05hdkJ1dHRvbnMgJiYgZGVjaykge1xuICAgICAgY29uc3QgaGFzUHJldiA9IGRlY2suaW5kZXggPiAwO1xuICAgICAgY29uc3QgaGFzTmV4dCA9IGRlY2suaW5kZXggPCBkZWNrLmNoYWluLmxlbmd0aCAtIDE7XG4gICAgICBjb25zdCBuYXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgbmF2LmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy1uYXZcIjtcbiAgICAgIG5hdi5hcHBlbmRDaGlsZCh0aGlzLm5hdkJ1dHRvbihcIlx1MjVDMFwiLCBcIlByZXZpb3VzIHBhZ2VcIiwgKCkgPT4gdGhpcy5uYXZpZ2F0ZShcInByZXZcIiksICFoYXNQcmV2KSk7XG4gICAgICBuYXYuYXBwZW5kQ2hpbGQodGhpcy5uYXZCdXR0b24oXCJcdTI1QjZcIiwgXCJOZXh0IHBhZ2VcIiwgKCkgPT4gdGhpcy5uYXZpZ2F0ZShcIm5leHRcIiksICFoYXNOZXh0KSk7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChuYXYpO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBNaWRkbGU6IGNoaXBzIGZvciB0aGUgcmVtYWluaW5nIHByb3BlcnRpZXMgKG5vIHBsYWNlaG9sZGVyKSBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCB2aXNpYmxlID0gZm1cbiAgICAgID8gT2JqZWN0LmVudHJpZXMoZm0pLmZpbHRlcigoW2tleV0pID0+IGtleSAhPT0gREVDS19LRVkgJiYga2V5ICE9PSBcInBvc2l0aW9uXCIpXG4gICAgICA6IFtdO1xuXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgdmlzaWJsZSkge1xuICAgICAgY29uc3Qgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgc3Bhbi5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtaXRlbVwiO1xuICAgICAgY29uc3QgayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHJvbmdcIik7XG4gICAgICBrLnRleHRDb250ZW50ID0ga2V5O1xuICAgICAgc3Bhbi5hcHBlbmRDaGlsZChrKTtcbiAgICAgIHNwYW4uYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCI6IFwiICsgZm9ybWF0VmFsdWUodmFsdWUpKSk7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICB9XG5cbiAgICAvLyBCcm9rZW4gZGVjayBsaW5rcyBcdTIxOTIgd2FybmluZyBjaGlwIHNvIGRlY2sgYXV0aG9ycyBzcG90IHR5cG9zXG4gICAgY29uc3QgYnJva2VuID0gZmlsZSA/IHRoaXMuYnJva2VuRGVja0xpbmtzKGZpbGUpIDogW107XG4gICAgaWYgKGJyb2tlbi5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB3YXJuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICB3YXJuLmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy13YXJuXCI7XG4gICAgICB3YXJuLnRleHRDb250ZW50ID0gXCJcdTI2QTAgXCIgKyBicm9rZW4uam9pbihcIiwgXCIpO1xuICAgICAgd2Fybi50aXRsZSA9IFwiQnJva2VuIGRlY2sgbGluayhzKSBcdTIwMTQgdGhlIHRhcmdldCBub3RlIGRvZXMgbm90IGV4aXN0XCI7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZCh3YXJuKTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQm90dG9tLXJpZ2h0OiBXWVNJV1lHIG1vZGUgdG9nZ2xlIChkZWNrIG5vdGVzIG9ubHkpIFx1MjUwMFx1MjUwMFxuICAgIGlmIChpc0NhcmQpIHtcbiAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICBidG4uY2xhc3NOYW1lID0gXCJuYXRpdmUtc2xpZGVzLXd5c2l3eWctYnRuXCIgKyAodGhpcy5zZXR0aW5ncy53eXNpd3lnTW9kZSA/IFwiIGlzLWFjdGl2ZVwiIDogXCJcIik7XG4gICAgICBidG4udGV4dENvbnRlbnQgPSB0aGlzLnNldHRpbmdzLnd5c2l3eWdNb2RlID8gXCJXWVNJV1lHOiBPblwiIDogXCJXWVNJV1lHOiBPZmZcIjtcbiAgICAgIGJ0bi50aXRsZSA9IFwiVG9nZ2xlIFdZU0lXWUcgbW9kZSBcdTIwMTQgdW5pZmllZCB0eXBvZ3JhcGh5IGJldHdlZW4gZWRpdCBhbmQgcmVhZGluZ1wiO1xuICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLnRvZ2dsZVd5c2l3eWcoKSk7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChidG4pO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBCb3R0b20tcmlnaHQ6IGF1dG8tY29tcHV0ZWQgcGFnZSBudW1iZXIgXHUyNTAwXHUyNTAwXG4gICAgaWYgKHRoaXMuc2V0dGluZ3Muc2hvd1BhZ2VOdW1iZXIgJiYgZGVjaykge1xuICAgICAgY29uc3QgcGFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgcGFnZS5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtcGFnZVwiO1xuICAgICAgLy8gY2hhaW5bMF0gaXMgdGhlIG92ZXJ2aWV3IG5vdGU7IHNsaWRlcyBzdGFydCBhdCBpbmRleCAxIFx1MjE5MiBcIlBhZ2UgMVwiXG4gICAgICBwYWdlLnRleHRDb250ZW50ID0gZGVjay5pbmRleCA9PT0gMCA/IFwiT3ZlcnZpZXdcIiA6IGBQYWdlICR7ZGVjay5pbmRleH1gO1xuICAgICAgdGhpcy5iYXIuYXBwZW5kQ2hpbGQocGFnZSk7XG4gICAgfVxuXG4gICAgLy8gSGlkZSB0aGUgYmFyIGVudGlyZWx5IHdoZW4gaXQgaGFzIG5vdGhpbmcgdG8gZGlzcGxheSAobm8gcHJvcGVydGllcyxcbiAgICAvLyBhbmQgbm90IHBhcnQgb2YgYSBkZWNrKVxuICAgIHRoaXMuYmFyLnN0eWxlLmRpc3BsYXkgPSB0aGlzLmJhci5jaGlsZEVsZW1lbnRDb3VudCA9PT0gMCA/IFwibm9uZVwiIDogXCJcIjtcbiAgfVxuXG4gIC8qKiBCdWlsZCBhIFx1MjVDMCAvIFx1MjVCNiBuYXZpZ2F0aW9uIGJ1dHRvbjsgYGRpc2FibGVkYCByZW5kZXJzIGl0IGxpZ2h0IGdyYXkvaW5hY3RpdmUgKi9cbiAgcHJpdmF0ZSBuYXZCdXR0b24oXG4gICAgbGFiZWw6IHN0cmluZyxcbiAgICB0aXA6IHN0cmluZyxcbiAgICBvbkNsaWNrOiAoKSA9PiB2b2lkLFxuICAgIGRpc2FibGVkID0gZmFsc2UsXG4gICk6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgIGJ0bi5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtbmF2LWJ0blwiO1xuICAgIGJ0bi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICAgIGJ0bi50aXRsZSA9IHRpcDtcbiAgICBidG4uZGlzYWJsZWQgPSBkaXNhYmxlZDtcbiAgICBpZiAoIWRpc2FibGVkKSBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uQ2xpY2spO1xuICAgIHJldHVybiBidG47XG4gIH1cblxuICAvKiogU3luYyB0aGUgZnVsbHNjcmVlbiBzdGF0ZTogYWRkIHRoZSBjbGFzcyArIHJlcXVlc3QgT1MgZnVsbHNjcmVlbiwgb3IgcmVzdG9yZSAqL1xuICBwcml2YXRlIHN5bmNGdWxsc2NyZWVuKGFjdGl2ZTogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICh0aGlzLmZ1bGxzY3JlZW4gPT09IGFjdGl2ZSkgcmV0dXJuOyAvLyBub3RoaW5nIHRvIGRvXG4gICAgdGhpcy5mdWxsc2NyZWVuID0gYWN0aXZlO1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnRvZ2dsZShcIm5hdGl2ZS1zbGlkZXMtZnVsbHNjcmVlblwiLCBhY3RpdmUpO1xuXG4gICAgLy8gUmVxdWVzdCBPUy1sZXZlbCBmdWxsc2NyZWVuIHdoZW4gZW50ZXJpbmcgKE9ic2lkaWFuIHJ1bnMgb24gRWxlY3Ryb24gYW5kXG4gICAgLy8gc3VwcG9ydHMgdGhlIEZ1bGxzY3JlZW4gQVBJKTsgZmFpbHVyZXMgKGUuZy4gaW4gYSBwbGFpbiBicm93c2VyKSBhcmVcbiAgICAvLyBpZ25vcmVkIHNpbGVudGx5IFx1MjAxNCB0aGUgXCJoaWRlIHNpZGViYXJzXCIgZWZmZWN0IHN0aWxsIGFwcGxpZXMuXG4gICAgaWYgKGFjdGl2ZSkge1xuICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuPy4oKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgfSBlbHNlIGlmIChkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCkge1xuICAgICAgZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4/LigpLmNhdGNoKCgpID0+IHt9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlIHRoZSBXWVNJV1lHIG1vZGUgKHBlcnNpc3RlZDsgb25seSByZWFjaGFibGUgb24gZGVjayBub3RlcykuXG4gICAqIFRvZ2dsaW5nIGZyb20gcmVhZGluZyB2aWV3IGp1bXBzIGludG8gdGhlIFdZU0lXWUcgZWRpdCB2aWV3LCBzbyB0aGVcbiAgICogdW5pZmllZCB0eXBvZ3JhcGh5IGlzIGltbWVkaWF0ZWx5IHZpc2libGUgd2hlcmUgdGhlIHVzZXIgd29ya3MuXG4gICAqL1xuICBwcml2YXRlIHRvZ2dsZVd5c2l3eWcoKTogdm9pZCB7XG4gICAgdGhpcy5zZXR0aW5ncy53eXNpd3lnTW9kZSA9ICF0aGlzLnNldHRpbmdzLnd5c2l3eWdNb2RlO1xuICAgIHZvaWQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAodmlldyAmJiB2aWV3LmdldE1vZGUoKSA9PT0gXCJwcmV2aWV3XCIpIHtcbiAgICAgIC8vIExlYXZlIHJlYWRpbmcgdmlldyB2aWEgdGhlIHB1YmxpYyB2aWV3LXN0YXRlIEFQSSAoc2FtZSBhcyBFc2MpXG4gICAgICBjb25zdCBzdGF0ZSA9IHZpZXcubGVhZi5nZXRWaWV3U3RhdGUoKTtcbiAgICAgIHN0YXRlLnN0YXRlID0geyAuLi5zdGF0ZS5zdGF0ZSwgbW9kZTogXCJzb3VyY2VcIiB9O1xuICAgICAgdm9pZCB2aWV3LmxlYWYuc2V0Vmlld1N0YXRlKHN0YXRlLCB7IGZvY3VzOiBmYWxzZSB9KTtcbiAgICB9XG4gICAgdGhpcy5yZWZyZXNoKCk7XG4gIH1cbn1cblxuLy8gXHUyNTAwXHUyNTAwIFNldHRpbmdzIHRhYiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY2xhc3MgTmF0aXZlU2xpZGVzU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogTmF0aXZlU2xpZGVzUGx1Z2luKSB7XG4gICAgc3VwZXIocGx1Z2luLmFwcCwgcGx1Z2luKTtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIlByb3BlcnRpZXMgQmFyIFx1MDBCNyBTZXR0aW5nc1wiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlNob3cgUHJldmlvdXMvTmV4dCBidXR0b25zXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJTaG93IFx1MjVDMCBcdTI1QjYgYnV0dG9ucyBvbiB0aGUgbGVmdCBvZiB0aGUgYmFyIHdoZW4gdGhlIG5vdGUgYmVsb25ncyB0byBhIGRlY2sgKGhhcyBhIGBkZWNrYCBwcm9wZXJ0eSlcIixcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dOYXZCdXR0b25zKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93TmF2QnV0dG9ucyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMucGx1Z2luLnJlZnJlc2goKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlNob3cgcGFnZSBudW1iZXJcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkF1dG8tY29tcHV0ZWQgZnJvbSB0aGUgZGVjayBjaGFpbiAob3ZlcnZpZXcgcGFnZSBzaG93cyBcdTIwMUNPdmVydmlld1x1MjAxRCk7IHNob3duIGF0IHRoZSBib3R0b20tcmlnaHRcIixcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dQYWdlTnVtYmVyKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93UGFnZU51bWJlciA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMucGx1Z2luLnJlZnJlc2goKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkF1dG8gZnVsbHNjcmVlbiBpbiByZWFkaW5nIHZpZXdcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkVudGVyIHRoZSBpbW1lcnNpdmUgZnVsbHNjcmVlbiByZWFkaW5nIG1vZGUgYXV0b21hdGljYWxseSB3aGVuIHN3aXRjaGluZyB0byByZWFkaW5nIHZpZXcgKGFsc28gdG9nZ2xlYWJsZSB2aWEgdGhlIFBhdXNlL1Jlc3VtZSBBdXRvIEZ1bGxzY3JlZW4gY29tbWFuZClcIixcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9GdWxsc2NyZWVuKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvRnVsbHNjcmVlbiA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMucGx1Z2luLnJlZnJlc2goKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkhpZGUgaW4tbm90ZSBwcm9wZXJ0aWVzIGluIGVkaXQgbW9kZSAoZGVjayBub3RlcylcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkZvciBkZWNrIChjYXJkKSBub3RlcyBpbiBMaXZlIFByZXZpZXcsIHRoZSBpbi1ub3RlIHByb3BlcnRpZXMgcGFuZWwgaXMgYWx3YXlzIGhpZGRlbiAoV1lTSVdZRyBcdTIwMTQgc2FtZSBhcyByZWFkaW5nIHZpZXcpLiBFZGl0IHRoZW0gaW4gdGhlIHJpZ2h0LXNpZGViYXIgUHJvcGVydGllcyB2aWV3IChvcGVuZWQgYXV0b21hdGljYWxseSB0aGUgZmlyc3QgdGltZSBhIGRlY2sgbm90ZSBpcyBhY3RpdmF0ZWQgaW4gYSBzZXNzaW9uKSBvciBpbiBTb3VyY2UgbW9kZS5cIixcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmhpZGVDYXJkUHJvcGVydGllc0luRWRpdCkub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaGlkZUNhcmRQcm9wZXJ0aWVzSW5FZGl0ID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiV1lTSVdZRyBtb2RlIChkZWNrIG5vdGVzKVwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiVW5pZmllZCB0eXBvZ3JhcGh5IGJldHdlZW4gZWRpdCBhbmQgcmVhZGluZyB2aWV3cyBmb3IgZGVjayBub3RlcyAodGFiIGJhciBoaWRlcyBpbiByZWFkaW5nOyB0aGUgYm90dG9tIGJhciB0YWtlcyBpdHMgcGxhY2UpLiBUb2dnbGUgZnJvbSB0aGUgY29tbWFuZCBwYWxldHRlLCB0aGUgTW9kK1NoaWZ0K0UgaG90a2V5LCBvciB0aGUgYm90dG9tLWJhciBidXR0b24uXCIsXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy53eXNpd3lnTW9kZSkub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mud3lzaXd5Z01vZGUgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJOYXZpZ2F0aW9uIGhvdGtleXNcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkRlZmF1bHQ6IFByZXZpb3VzIFBhZ2UgTW9kK1NoaWZ0K1x1MjE5MCwgTmV4dCBQYWdlIE1vZCtTaGlmdCtcdTIxOTIuIFJlYmluZCB1bmRlciBTZXR0aW5ncyBcdTIxOTIgSG90a2V5cy5cIixcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoXCJPcGVuIEhvdGtleXMgU2V0dGluZ3NcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgLy8gT3BlbiBPYnNpZGlhbidzIGhvdGtleXMgc2V0dGluZ3MgcGFnZSAoaW50ZXJuYWwgQVBJOyBpZ25vcmUgZmFpbHVyZXMpXG4gICAgICAgICAgKFxuICAgICAgICAgICAgdGhpcy5hcHAgYXMgdW5rbm93biBhcyB7IHNldHRpbmc/OiB7IG9wZW5UYWJCeUlkPzogKGlkOiBzdHJpbmcpID0+IHZvaWQgfSB9XG4gICAgICAgICAgKS5zZXR0aW5nPy5vcGVuVGFiQnlJZD8uKFwiaG90a2V5c1wiKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICB9XG59XG5cbi8vIFx1MjUwMFx1MjUwMCBIZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4vKiogUmVtb3ZlIGFsbCBjaGlsZHJlbiBvZiBhbiBlbGVtZW50ICovXG5mdW5jdGlvbiBjbGVhckNoaWxkcmVuKGVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICB3aGlsZSAoZWwuZmlyc3RDaGlsZCkgZWwucmVtb3ZlQ2hpbGQoZWwuZmlyc3RDaGlsZCk7XG59XG4iLCAiLyoqXG4gKiBkZWNrLnRzIFx1MjAxNCBQdXJlIGRlY2stcmVzb2x1dGlvbiBjb3JlIGZvciBuYXRpdmUtc2xpZGVzLlxuICpcbiAqIEV2ZXJ5dGhpbmcgaW4gdGhpcyBtb2R1bGUgaXMgZnJlZSBvZiBPYnNpZGlhbiBydW50aW1lIGRlcGVuZGVuY2llcyBzbyBpdCBjYW5cbiAqIGJlIHVuaXQgdGVzdGVkIGRpcmVjdGx5IChzZWUgdGVzdC9kZWNrLnRlc3QudHMpLiBtYWluLnRzIGFkYXB0cyB0aGUgdmF1bHRcbiAqIChtZXRhZGF0YUNhY2hlKSB0byB0aGlzIHB1cmUgaW50ZXJmYWNlOiBpdCByZXNvbHZlcyBgZGVja2AgcHJvcGVydGllcyB0b1xuICogbm90ZSBwYXRocywgdGhlbiBoYW5kcyB0aGUgcGF0aCBncmFwaCB0byBjb21wdXRlRGVjaygpLlxuICovXG5cbi8qKiBBIGRlY2sgbGluayBsaXN0IG5ldmVyIGhvbGRzIG1vcmUgdGhhbiB0d28gZW50cmllcyAqL1xuZXhwb3J0IGNvbnN0IE1BWF9ERUNLX0xJTktTID0gMjtcblxuLyoqIFJlc3VsdCBvZiByZXNvbHZpbmcgYSBub3RlJ3MgcG9zaXRpb24gaW5zaWRlIGEgZGVjayAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWNrSW5mbyB7XG4gIC8qKiBDaGFpbiBvZiBub3RlIHBhdGhzOiBbMF0gaXMgdGhlIG92ZXJ2aWV3IG5vdGUsIHRoZW4gc2xpZGVzIGluIG9yZGVyICovXG4gIGNoYWluOiBzdHJpbmdbXTtcbiAgLyoqIEluZGV4IG9mIHRoZSBjdXJyZW50IG5vdGUgaW5zaWRlIGNoYWluICovXG4gIGluZGV4OiBudW1iZXI7XG59XG5cbi8qKlxuICogUmVzb2x2ZSBhIG5vdGUncyBwb3NpdGlvbiBpbnNpZGUgaXRzIGRlY2sgYnkgd2Fsa2luZyB0aGUgbGluayBjaGFpbi5cbiAqXG4gKiBDb252ZW50aW9uIGZvciB0aGUgc2luZ2xlIGBkZWNrYCBwcm9wZXJ0eSAodXAgdG8gdHdvIGxpbmtzKTpcbiAqICAgLSBvdmVydmlldyBub3RlOiBvbmUgbGluayBcdTIxOTIgdGhhdCBsaW5rIElTIHRoZSBmaXJzdCBwYWdlO1xuICogICAtIHNsaWRlIG5vdGU6ICAgIGZpcnN0IGxpbmsgXHUyMTkyIHRoZSBvdmVydmlldyBwYWdlLCBzZWNvbmQgbGluayBcdTIxOTIgbmV4dCBzbGlkZVxuICogICAgICAgICAgICAgICAgICAgIChubyBzZWNvbmQgbGluayBvbiB0aGUgbGFzdCBzbGlkZSkuXG4gKlxuICogYGdldExpbmtzKHBhdGgpYCBtdXN0IHJldHVybiB0aGUgcmVzb2x2ZWQgbm90ZSBwYXRocyBvZiB0aGUgYGRlY2tgIHByb3BlcnR5XG4gKiBvZiB0aGUgbm90ZSBhdCBgcGF0aGAgKGVtcHR5IHdoZW4gdGhlIG5vdGUgaGFzIG5vbmUsIG9yIGl0cyBsaW5rcyBhcmVcbiAqIGJyb2tlbiBcdTIwMTQgYSBicm9rZW4gbGluayBzaW1wbHkgZW5kcyBvciBleGNsdWRlcyB0aGUgY2hhaW4sIG5ldmVyIGNyYXNoZXMpLlxuICpcbiAqIFJldHVybnMgdGhlIGZ1bGwgY2hhaW4gKFtvdmVydmlldywgc2xpZGUgMSwgc2xpZGUgMiwgXHUyMDI2XSkgYW5kIHRoZSBjdXJyZW50XG4gKiBub3RlJ3MgaW5kZXgsIG9yIG51bGwgd2hlbiB0aGUgbm90ZSBpcyBub3QgcGFydCBvZiBhbnkgZGVjay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVEZWNrKFxuICBjdXJyZW50UGF0aDogc3RyaW5nLFxuICBnZXRMaW5rczogKHBhdGg6IHN0cmluZykgPT4gc3RyaW5nW10sXG4pOiBEZWNrSW5mbyB8IG51bGwge1xuICBjb25zdCBjdXJyZW50TGlua3MgPSBnZXRMaW5rcyhjdXJyZW50UGF0aCk7XG4gIGlmIChjdXJyZW50TGlua3MubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICBsZXQgb3ZlcnZpZXc6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgbGV0IGZpcnN0UGFnZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gIGlmIChjdXJyZW50TGlua3MubGVuZ3RoID49IDIpIHtcbiAgICAvLyBBIHNsaWRlOiBmaXJzdCBsaW5rIGlzIHRoZSBvdmVydmlldyBwYWdlXG4gICAgb3ZlcnZpZXcgPSBjdXJyZW50TGlua3NbMF07XG4gICAgZmlyc3RQYWdlID0gZ2V0TGlua3Mob3ZlcnZpZXcpWzBdO1xuICB9IGVsc2Uge1xuICAgIC8vIEEgc2luZ2xlIGxpbms6IGVpdGhlciB3ZSBBUkUgdGhlIG92ZXJ2aWV3IChsaW5rID0gZmlyc3QgcGFnZSksXG4gICAgLy8gb3Igd2UgYXJlIHRoZSBsYXN0IHNsaWRlIChsaW5rID0gb3ZlcnZpZXcgcGFnZSlcbiAgICBjb25zdCBvbmx5ID0gY3VycmVudExpbmtzWzBdO1xuICAgIGNvbnN0IG9ubHlMaW5rcyA9IGdldExpbmtzKG9ubHkpO1xuICAgIGlmIChvbmx5TGlua3NbMF0gPT09IGN1cnJlbnRQYXRoKSB7XG4gICAgICBvdmVydmlldyA9IGN1cnJlbnRQYXRoO1xuICAgICAgZmlyc3RQYWdlID0gb25seTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3ZlcnZpZXcgPSBvbmx5O1xuICAgICAgZmlyc3RQYWdlID0gb25seUxpbmtzWzBdO1xuICAgIH1cbiAgfVxuICBpZiAoIW92ZXJ2aWV3IHx8ICFmaXJzdFBhZ2UpIHJldHVybiBudWxsO1xuXG4gIC8vIFdhbGsgdGhlIGNoYWluOiBvdmVydmlldyBcdTIxOTIgZmlyc3QgcGFnZSBcdTIxOTIgbmV4dCBcdTIxOTIgbmV4dCBcdTIxOTIgXHUyMDI2XG4gIGNvbnN0IGNoYWluOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCB2aXNpdGVkID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHB1c2ggPSAocDogc3RyaW5nIHwgdW5kZWZpbmVkKTogdm9pZCA9PiB7XG4gICAgaWYgKHAgJiYgIXZpc2l0ZWQuaGFzKHApKSB7XG4gICAgICB2aXNpdGVkLmFkZChwKTtcbiAgICAgIGNoYWluLnB1c2gocCk7XG4gICAgfVxuICB9O1xuICBwdXNoKG92ZXJ2aWV3KTtcbiAgcHVzaChmaXJzdFBhZ2UpO1xuICBsZXQgY3VyID0gZmlyc3RQYWdlO1xuICB3aGlsZSAoY3VyKSB7XG4gICAgY29uc3QgbmV4dCA9IGdldExpbmtzKGN1cilbMV07XG4gICAgaWYgKCFuZXh0IHx8IHZpc2l0ZWQuaGFzKG5leHQpKSBicmVhazsgLy8gZW5kIG9mIGRlY2sgb3IgY3ljbGUgZ3VhcmRcbiAgICBwdXNoKG5leHQpO1xuICAgIGN1ciA9IG5leHQ7XG4gIH1cblxuICBjb25zdCBpbmRleCA9IGNoYWluLmluZGV4T2YoY3VycmVudFBhdGgpO1xuICBpZiAoaW5kZXggPT09IC0xKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHsgY2hhaW4sIGluZGV4IH07XG59XG5cbi8qKlxuICogRXh0cmFjdCB1cCB0byBgbWF4YCBub3RlIG5hbWVzIGZyb20gYSBgZGVja2AgcHJvcGVydHkgdmFsdWUuXG4gKiBBY2NlcHRzIGEgc2luZ2xlIHN0cmluZyBvciBhIFlBTUwgbGlzdCBvZiBzdHJpbmdzOyB1bnF1b3RlZCBbW3hdXSB2YWx1ZXMgYXJlXG4gKiBwYXJzZWQgYnkgWUFNTCBhcyBuZXN0ZWQgYXJyYXlzIGFuZCBmbGF0dGVuZWQgaGVyZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RMaW5rcyh2YWx1ZTogdW5rbm93biwgbWF4OiBudW1iZXIgPSBNQVhfREVDS19MSU5LUyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgZmxhdDogdW5rbm93bltdID0gW107XG4gIGNvbnN0IGNvbGxlY3QgPSAodjogdW5rbm93bik6IHZvaWQgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHYpKSB7XG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdikgY29sbGVjdChpdGVtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmxhdC5wdXNoKHYpO1xuICAgIH1cbiAgfTtcbiAgY29sbGVjdCh2YWx1ZSk7XG5cbiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGNvbnN0IGl0ZW0gb2YgZmxhdCkge1xuICAgIGNvbnN0IG5hbWUgPSBleHRyYWN0TGlua1RleHQoaXRlbSk7XG4gICAgaWYgKG5hbWUpIG91dC5wdXNoKG5hbWUpO1xuICAgIGlmIChvdXQubGVuZ3RoID49IG1heCkgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHVwIHRvIGBtYXhgIHJhdyBsaW5rIHN0cmluZ3MgZnJvbSBhIGBkZWNrYCBwcm9wZXJ0eSB2YWx1ZSBcdTIwMTQgdGhlXG4gKiB0cmltbWVkIHZhbHVlcyBleGFjdGx5IGFzIHdyaXR0ZW4gKGFsaWFzIC8gcGF0aCBmb3JtcyBwcmVzZXJ2ZWQpLiBTYW1lXG4gKiBmbGF0dGVuaW5nIHJ1bGVzIGFzIGV4dHJhY3RMaW5rcygpLCBidXQgd2l0aG91dCBleHRyYWN0aW5nIHRoZSB0YXJnZXQgbmFtZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RSYXdMaW5rcyh2YWx1ZTogdW5rbm93biwgbWF4OiBudW1iZXIgPSBNQVhfREVDS19MSU5LUyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgZmxhdDogdW5rbm93bltdID0gW107XG4gIGNvbnN0IGNvbGxlY3QgPSAodjogdW5rbm93bik6IHZvaWQgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHYpKSB7XG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdikgY29sbGVjdChpdGVtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmxhdC5wdXNoKHYpO1xuICAgIH1cbiAgfTtcbiAgY29sbGVjdCh2YWx1ZSk7XG5cbiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGNvbnN0IGl0ZW0gb2YgZmxhdCkge1xuICAgIGlmICh0eXBlb2YgaXRlbSAhPT0gXCJzdHJpbmdcIikgY29udGludWU7XG4gICAgY29uc3QgdHJpbW1lZCA9IGl0ZW0udHJpbSgpO1xuICAgIGlmICghdHJpbW1lZCkgY29udGludWU7XG4gICAgb3V0LnB1c2godHJpbW1lZCk7XG4gICAgaWYgKG91dC5sZW5ndGggPj0gbWF4KSBicmVhaztcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIHRhcmdldCBub3RlIG5hbWUgZnJvbSBhIG1hcmtkb3duIGxpbmsgc3RyaW5nLlxuICogSGFuZGxlcyBzZXZlcmFsIHNoYXBlczpcbiAqICAgXCJbW3NsaWRlLTJdXVwiICAgICAgICBcdTIxOTIgc2xpZGUtMlxuICogICBcIltbc2xpZGUtMnxhbGlhc11dXCIgIFx1MjE5MiBzbGlkZS0yXG4gKiAgIFwiW1tzbGlkZS0yI3NlY3Rpb25dXVwiXHUyMTkyIHNsaWRlLTJcbiAqICAgc2xpZGUtMiAgICAgICAgICAgICAgXHUyMTkyIHNsaWRlLTIgKGJhcmUgZmlsZW5hbWUpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0TGlua1RleHQodmFsdWU6IHVua25vd24pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHRyaW1tZWQgPSB2YWx1ZS50cmltKCk7XG4gIGlmICghdHJpbW1lZCkgcmV0dXJuIG51bGw7XG4gIHJldHVybiB0cmltbWVkLnJlcGxhY2UoL15cXFtcXFsvLCBcIlwiKS5yZXBsYWNlKC9cXF1cXF0kLywgXCJcIikuc3BsaXQoXCJ8XCIpWzBdLnNwbGl0KFwiI1wiKVswXS50cmltKCk7XG59XG5cbi8qKiBSZW5kZXIgYSBwcm9wZXJ0eSB2YWx1ZSBhcyByZWFkYWJsZSB0ZXh0OiBhcnJheXMvb2JqZWN0cyBcdTIxOTIgSlNPTiwgZWxzZSBTdHJpbmcgKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRWYWx1ZSh2YWx1ZTogdW5rbm93bik6IHN0cmluZyB7XG4gIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gXCJcdTIwMTRcIjtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIFN0cmluZyh2YWx1ZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBTdHJpbmcodmFsdWUpO1xufVxuIiwgIi8qKlxuICogY3JlYXRlTmV4dC50cyBcdTIwMTQgUHVyZSBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIgcGxhbm5pbmcgY29yZSBmb3IgbmF0aXZlLXNsaWRlcy5cbiAqXG4gKiBFdmVyeXRoaW5nIGluIHRoaXMgbW9kdWxlIGlzIGZyZWUgb2YgT2JzaWRpYW4gcnVudGltZSBkZXBlbmRlbmNpZXMgc28gaXQgY2FuXG4gKiBiZSB1bml0IHRlc3RlZCBkaXJlY3RseSAoc2VlIHRlc3QvY3JlYXRlTmV4dC50ZXN0LnRzKS4gbWFpbi50cyBhZGFwdHMgdGhlXG4gKiB2YXVsdCAobWV0YWRhdGFDYWNoZSwgY29tcHV0ZURlY2spIHRvIHRoaXMgcHVyZSBpbnRlcmZhY2UgYW5kIGFwcGxpZXMgdGhlXG4gKiByZXN1bHRpbmcgcGxhbiB3aXRoIHZhdWx0LmNyZWF0ZSgpICsgZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKCkuXG4gKlxuICogVGhlIHBsYW4gZGVjaWRlcywgZm9yIHRoZSBjdXJyZW50IG5vdGU6XG4gKiAgIC0gdGhlIG5hbWUgb2YgdGhlIG5ldyBzbGlkZSBmaWxlIChjb2xsaXNpb24tYXdhcmUpLFxuICogICAtIHRoZSByYXcgYGRlY2tgIGxpbmsgdGV4dHMgb2YgdGhlIG5ldyBub3RlLFxuICogICAtIHRoZSByZXdyaXRlcyBuZWVkZWQgb24gZXhpc3Rpbmcgbm90ZXMgKGluIHByYWN0aWNlIGFsd2F5cyB0aGUgY3VycmVudFxuICogICAgIG5vdGUgaXRzZWxmKS5cbiAqL1xuXG5pbXBvcnQgeyBleHRyYWN0TGlua1RleHQgfSBmcm9tIFwiLi9kZWNrXCI7XG5cbi8qKiBJbnB1dHMgZm9yIHBsYW5uaW5nIFx1MjAxNCByZXNvbHZlZCBieSB0aGUgYWRhcHRlciBpbiBtYWluLnRzICovXG5leHBvcnQgaW50ZXJmYWNlIENyZWF0ZU5leHRJbnB1dCB7XG4gIC8qKiBCYXNlbmFtZSAod2l0aG91dCBleHRlbnNpb24pIG9mIHRoZSBjdXJyZW50IG5vdGUgKi9cbiAgY3VycmVudE5hbWU6IHN0cmluZztcbiAgLyoqIFJhdyBgZGVja2AgbGluayB0ZXh0cyBvZiB0aGUgY3VycmVudCBub3RlIChleHRyYWN0ZWQsIHVwIHRvIHR3bykgKi9cbiAgY3VycmVudExpbmtzOiBzdHJpbmdbXTtcbiAgLyoqIFRydWUgd2hlbiB0aGUgY3VycmVudCBub3RlIElTIHRoZSBkZWNrJ3Mgb3ZlcnZpZXcgcGFnZSAoY2hhaW4gaW5kZXggMCkgKi9cbiAgaXNPdmVydmlldzogYm9vbGVhbjtcbiAgLyoqXG4gICAqIFJhdyBsaW5rIHRleHQgdGhlIG9sZCBmaXJzdCBwYWdlIHVzZXMgdG8gbGluayBiYWNrIHRvIHRoZSBvdmVydmlldy5cbiAgICogT25seSBtZWFuaW5nZnVsIGZvciBvdmVydmlldyBpbnNlcnRpb24gKHRoZSBvdmVydmlldyBpdHNlbGYgb25seSBsaW5rc1xuICAgKiBmb3J3YXJkLCBzbyBpdHMgb3duIGZyb250bWF0dGVyIGNvbnRhaW5zIG5vIHNlbGYtcmVmZXJlbmNlKS5cbiAgICovXG4gIG92ZXJ2aWV3QmFja0xpbms/OiBzdHJpbmc7XG4gIC8qKiBCYXNlbmFtZXMgb2YgZXZlcnkgbWFya2Rvd24gbm90ZSBpbiB0aGUgdmF1bHQgKGNvbGxpc2lvbi1mcmVlIG5hbWluZykgKi9cbiAgZXhpc3RpbmdOYW1lczogU2V0PHN0cmluZz47XG59XG5cbi8qKiBPbmUgbm90ZSB3aG9zZSBgZGVja2AgcHJvcGVydHkgbXVzdCBiZSByZXdyaXR0ZW4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVja1Jld3JpdGUge1xuICAvKiogQmFzZW5hbWUgb2YgdGhlIG5vdGUgdG8gcmV3cml0ZSAqL1xuICBuYW1lOiBzdHJpbmc7XG4gIC8qKiBUaGUgbmV3IHJhdyBgZGVja2AgbGluayB0ZXh0cyAoc2VyaWFsaXplZCBhcyBhIFlBTUwgbGlzdCkgKi9cbiAgZGVjazogc3RyaW5nW107XG59XG5cbi8qKiBUaGUgZnVsbCBwbGFuIGZvciBjcmVhdGluZyBvbmUgbmV3IHNsaWRlICovXG5leHBvcnQgaW50ZXJmYWNlIENyZWF0ZU5leHRSZXN1bHQge1xuICAvKiogQmFzZW5hbWUgKHdpdGhvdXQgZXh0ZW5zaW9uKSBvZiB0aGUgbmV3IHNsaWRlIGZpbGUgKi9cbiAgbmV3TmFtZTogc3RyaW5nO1xuICAvKiogUmF3IGBkZWNrYCBsaW5rIHRleHRzIGZvciB0aGUgbmV3IG5vdGUncyBmcm9udG1hdHRlciAqL1xuICBuZXdEZWNrTGlua3M6IHN0cmluZ1tdO1xuICAvKiogUmV3cml0ZXMgdG8gYXBwbHkgdG8gZXhpc3Rpbmcgbm90ZXMgKGluIHByYWN0aWNlIGFsd2F5cyB0aGUgY3VycmVudCBub3RlKSAqL1xuICByZXdyaXRlczogRGVja1Jld3JpdGVbXTtcbn1cblxuLyoqXG4gKiBQbGFuIHRoZSBjcmVhdGlvbiBvZiBhIG5ldyBzbGlkZSBhZnRlciB0aGUgY3VycmVudCBub3RlLlxuICpcbiAqIEJlaGF2aW9yczpcbiAqICAgLSBMYXN0IHNsaWRlIChubyBzZWNvbmQgbGluayk6IGFwcGVuZCBgPGN1cnJlbnQ+LW5leHRgIGFzIHRoZSBuZXcgbGFzdFxuICogICAgIHNsaWRlOyB0aGUgY3VycmVudCBub3RlIGdhaW5zIHRoZSBzZWNvbmQgbGluay5cbiAqICAgLSBTbGlkZSB3aXRoIGEgdmFsaWQgbmV4dDogaW5zZXJ0IGA8Y3VycmVudD4tbmV4dGAgYmV0d2VlbiB0aGVtOyB0aGUgbmV3XG4gKiAgICAgbm90ZSB0YWtlcyBvdmVyIHRoZSBvbGQgbmV4dCBsaW5rLlxuICogICAtIFNsaWRlIHdob3NlIHNlY29uZCBsaW5rIGlzIGJyb2tlbiAocGxhaW4sIG5vbi1leGlzdGluZyBuYW1lKTogY3JlYXRlXG4gKiAgICAgZXhhY3RseSB0aGUgZGVjbGFyZWQgbWlzc2luZyBub3RlIGFzIHRoZSBuZXcgbGFzdCBzbGlkZSBcdTIwMTQgdGhlIFx1MjZBMCB3YXJuaW5nXG4gKiAgICAgZGlzYXBwZWFycyBhbmQgdGhlIGF1dGhvcidzIGludGVudCBpcyBob25vdXJlZC4gQSBicm9rZW4gbGluayB0aGF0IGlzXG4gKiAgICAgbm90IGEgcGxhaW4gYmFzZW5hbWUgKHBhdGgtcXVhbGlmaWVkLCBzZWxmLXJlZmVyZW5jaW5nKSBpcyB0cmVhdGVkIGFzXG4gKiAgICAgaW52YWxpZCBhbmQgZHJvcHBlZCAoYXBwZW5kIGEgYDxjdXJyZW50Pi1uZXh0YCBsYXN0IHNsaWRlIGluc3RlYWQpLlxuICogICAtIE92ZXJ2aWV3IHBhZ2UgKHNpbmdsZSBsaW5rID0gZmlyc3QgcGFnZSk6IGluc2VydCBhIG5ldyBmaXJzdCBwYWdlOyB0aGVcbiAqICAgICBvdmVydmlldydzIGxpbmsgcG9pbnRzIHRvIGl0IGFuZCB0aGUgb2xkIGZpcnN0IHBhZ2UgaXMgcHVzaGVkIGJhY2suXG4gKlxuICogUmV0dXJucyBudWxsIHdoZW4gdGhlIG5vdGUgaGFzIG5vIHVzYWJsZSBgZGVja2AgbGlua3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwbGFuQ3JlYXRlTmV4dChpbnB1dDogQ3JlYXRlTmV4dElucHV0KTogQ3JlYXRlTmV4dFJlc3VsdCB8IG51bGwge1xuICBjb25zdCB7IGN1cnJlbnROYW1lLCBjdXJyZW50TGlua3MsIGlzT3ZlcnZpZXcgfSA9IGlucHV0O1xuICBpZiAoY3VycmVudExpbmtzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgLy8gXHUyNTAwXHUyNTAwIE92ZXJ2aWV3IHBhZ2U6IGluc2VydCBhIG5ldyBmaXJzdCBwYWdlIGFmdGVyIGl0IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBpZiAoaXNPdmVydmlldykge1xuICAgIGNvbnN0IG9sZEZpcnN0ID0gY3VycmVudExpbmtzWzBdO1xuICAgIGlmICghb2xkRmlyc3QpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IG5ld05hbWUgPSB1bmlxdWVOYW1lKGAke2N1cnJlbnROYW1lfS1uZXh0YCwgaW5wdXQuZXhpc3RpbmdOYW1lcyk7XG4gICAgY29uc3QgYmFjayA9IGlucHV0Lm92ZXJ2aWV3QmFja0xpbmsgPz8gYFtbJHtjdXJyZW50TmFtZX1dXWA7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5ld05hbWUsXG4gICAgICBuZXdEZWNrTGlua3M6IFtiYWNrLCBvbGRGaXJzdF0sXG4gICAgICByZXdyaXRlczogW3sgbmFtZTogY3VycmVudE5hbWUsIGRlY2s6IFtgW1ske25ld05hbWV9XV1gXSB9XSxcbiAgICB9O1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNsaWRlOiBmaXJzdCBsaW5rIGlzIHRoZSBvdmVydmlldyBwYWdlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCBvdmVydmlld0xpbmsgPSBjdXJyZW50TGlua3NbMF07XG4gIGlmICghb3ZlcnZpZXdMaW5rKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgbmV4dExpbmsgPSBjdXJyZW50TGlua3NbMV07XG5cbiAgaWYgKG5leHRMaW5rKSB7XG4gICAgY29uc3QgbmV4dE5hbWUgPSBleHRyYWN0TGlua1RleHQobmV4dExpbmspO1xuICAgIGlmIChuZXh0TmFtZSAmJiBpc1BsYWluTmFtZShuZXh0TmFtZSkgJiYgbmV4dE5hbWUgIT09IGN1cnJlbnROYW1lKSB7XG4gICAgICBpZiAoIWlucHV0LmV4aXN0aW5nTmFtZXMuaGFzKG5leHROYW1lKSkge1xuICAgICAgICAvLyBUaGUgZGVjbGFyZWQgbmV4dCBub3RlIGRvZXMgbm90IGV4aXN0IHlldCBcdTIxOTIgY3JlYXRlIGV4YWN0bHkgdGhhdFxuICAgICAgICAvLyBub3RlIChmaXhlcyB0aGUgYnJva2VuLWxpbmsgd2FybmluZywgaG9ub3VycyB0aGUgYXV0aG9yJ3MgaW50ZW50KS5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBuZXdOYW1lOiBuZXh0TmFtZSxcbiAgICAgICAgICBuZXdEZWNrTGlua3M6IFtvdmVydmlld0xpbmtdLFxuICAgICAgICAgIHJld3JpdGVzOiBbXSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIC8vIEEgdmFsaWQgbmV4dCBub3RlIGV4aXN0cyBcdTIxOTIgaW5zZXJ0IGJldHdlZW4gaXQgYW5kIHRoZSBjdXJyZW50IG5vdGUuXG4gICAgICBjb25zdCBuZXdOYW1lID0gdW5pcXVlTmFtZShgJHtjdXJyZW50TmFtZX0tbmV4dGAsIGlucHV0LmV4aXN0aW5nTmFtZXMpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmV3TmFtZSxcbiAgICAgICAgbmV3RGVja0xpbmtzOiBbb3ZlcnZpZXdMaW5rLCBuZXh0TGlua10sXG4gICAgICAgIHJld3JpdGVzOiBbeyBuYW1lOiBjdXJyZW50TmFtZSwgZGVjazogW292ZXJ2aWV3TGluaywgYFtbJHtuZXdOYW1lfV1dYF0gfV0sXG4gICAgICB9O1xuICAgIH1cbiAgICAvLyBJbnZhbGlkIChwYXRoLXF1YWxpZmllZCAvIHNlbGYtcmVmZXJlbmNpbmcpIG5leHQgbGluayBcdTIxOTIgZHJvcCBpdCBhbmRcbiAgICAvLyBhcHBlbmQgYSBuZXcgbGFzdCBzbGlkZSAoZmFsbCB0aHJvdWdoIHRvIHRoZSBuby1uZXh0IGJyYW5jaCkuXG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgTGFzdCBzbGlkZSBcdTIxOTIgYXBwZW5kIGEgbmV3IGxhc3Qgc2xpZGUgYWZ0ZXIgaXQgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IG5ld05hbWUgPSB1bmlxdWVOYW1lKGAke2N1cnJlbnROYW1lfS1uZXh0YCwgaW5wdXQuZXhpc3RpbmdOYW1lcyk7XG4gIHJldHVybiB7XG4gICAgbmV3TmFtZSxcbiAgICBuZXdEZWNrTGlua3M6IFtvdmVydmlld0xpbmtdLFxuICAgIHJld3JpdGVzOiBbeyBuYW1lOiBjdXJyZW50TmFtZSwgZGVjazogW292ZXJ2aWV3TGluaywgYFtbJHtuZXdOYW1lfV1dYF0gfV0sXG4gIH07XG59XG5cbi8qKiBBIG5hbWUgdXNhYmxlIGFzIGEgdmF1bHQgbm90ZSBuYW1lOiBubyBwYXRoIHNlcGFyYXRvcnMsIG5vbi1lbXB0eSAqL1xuZnVuY3Rpb24gaXNQbGFpbk5hbWUobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBuYW1lLmxlbmd0aCA+IDAgJiYgIW5hbWUuaW5jbHVkZXMoXCIvXCIpICYmICFuYW1lLmluY2x1ZGVzKFwiXFxcXFwiKTtcbn1cblxuLyoqIEZpcnN0IGZyZWUgbmFtZSBpbiB0aGUgZmFtaWx5IGBiYXNlYCwgYGJhc2UtMmAsIGBiYXNlLTNgLCBcdTIwMjYgKi9cbmZ1bmN0aW9uIHVuaXF1ZU5hbWUoYmFzZTogc3RyaW5nLCBleGlzdGluZzogU2V0PHN0cmluZz4pOiBzdHJpbmcge1xuICBpZiAoIWV4aXN0aW5nLmhhcyhiYXNlKSkgcmV0dXJuIGJhc2U7XG4gIGZvciAobGV0IGkgPSAyOyA7IGkrKykge1xuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGAke2Jhc2V9LSR7aX1gO1xuICAgIGlmICghZXhpc3RpbmcuaGFzKGNhbmRpZGF0ZSkpIHJldHVybiBjYW5kaWRhdGU7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQW1EQSxzQkFBK0U7OztBQ3pDeEUsSUFBTSxpQkFBaUI7QUF5QnZCLFNBQVMsWUFDZCxhQUNBLFVBQ2lCO0FBQ2pCLFFBQU0sZUFBZSxTQUFTLFdBQVc7QUFDekMsTUFBSSxhQUFhLFdBQVcsRUFBRyxRQUFPO0FBRXRDLE1BQUk7QUFDSixNQUFJO0FBRUosTUFBSSxhQUFhLFVBQVUsR0FBRztBQUU1QixlQUFXLGFBQWEsQ0FBQztBQUN6QixnQkFBWSxTQUFTLFFBQVEsRUFBRSxDQUFDO0FBQUEsRUFDbEMsT0FBTztBQUdMLFVBQU0sT0FBTyxhQUFhLENBQUM7QUFDM0IsVUFBTSxZQUFZLFNBQVMsSUFBSTtBQUMvQixRQUFJLFVBQVUsQ0FBQyxNQUFNLGFBQWE7QUFDaEMsaUJBQVc7QUFDWCxrQkFBWTtBQUFBLElBQ2QsT0FBTztBQUNMLGlCQUFXO0FBQ1gsa0JBQVksVUFBVSxDQUFDO0FBQUEsSUFDekI7QUFBQSxFQUNGO0FBQ0EsTUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFXLFFBQU87QUFHcEMsUUFBTSxRQUFrQixDQUFDO0FBQ3pCLFFBQU0sVUFBVSxvQkFBSSxJQUFZO0FBQ2hDLFFBQU0sT0FBTyxDQUFDLE1BQWdDO0FBQzVDLFFBQUksS0FBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLEdBQUc7QUFDeEIsY0FBUSxJQUFJLENBQUM7QUFDYixZQUFNLEtBQUssQ0FBQztBQUFBLElBQ2Q7QUFBQSxFQUNGO0FBQ0EsT0FBSyxRQUFRO0FBQ2IsT0FBSyxTQUFTO0FBQ2QsTUFBSSxNQUFNO0FBQ1YsU0FBTyxLQUFLO0FBQ1YsVUFBTSxPQUFPLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDNUIsUUFBSSxDQUFDLFFBQVEsUUFBUSxJQUFJLElBQUksRUFB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
