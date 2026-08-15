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
    /** Last measured tab-bar height (px) — cached while the bar is hidden */
    this.tabBarHeight = 0;
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
    this.addCommand({
      id: "ns-debug-styles",
      name: "Debug: Dump Typography Styles",
      callback: () => this.debugStyles()
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
    this.syncTabBarHeight();
    const wysiwyg = isCard && this.settings.wysiwygMode;
    document.body.classList.toggle("native-slides-wysiwyg", wysiwyg);
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
  /**
   * Measure the top tab bar and expose its height as the CSS variable
   * --native-slides-tabbar-height. The bar is hidden in WYSIWYG reading
   * view, so the last measured value is cached and reused there.
   */
  syncTabBarHeight() {
    const tabBar = document.querySelector(
      ".workspace-tabs.mod-top .workspace-tab-header-container"
    );
    if (tabBar && tabBar.offsetHeight > 0) this.tabBarHeight = tabBar.offsetHeight;
    if (this.tabBarHeight > 0) {
      document.documentElement.style.setProperty(
        "--native-slides-tabbar-height",
        `${this.tabBarHeight}px`
      );
    } else {
      document.documentElement.style.removeProperty("--native-slides-tabbar-height");
    }
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
  /**
   * Dump key typography computed styles + CSS variables to the console.
   * Run once in edit view and once in reading view (same note), then compare
   * the numbers — that is how the WYSIWYG typography alignment CSS is tuned
   * without eyeballing screenshots.
   */
  debugStyles() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (!view) {
      new import_obsidian.Notice("Native Slides: no active Markdown note");
      return;
    }
    const isEdit = view.getMode() === "source";
    const contentEl = view.contentEl;
    const pick = (sel) => contentEl.querySelector(sel);
    const style = (el, props) => {
      if (!el) return { "(missing)": "element not in this note" };
      const cs = getComputedStyle(el);
      const out = {};
      for (const p of props) {
        const v = cs.getPropertyValue(p).trim();
        if (v) out[p] = v;
      }
      return out;
    };
    const vars = getComputedStyle(document.body);
    const cssVar = (name) => vars.getPropertyValue(name).trim();
    const container = pick(
      isEdit ? ".markdown-source-view.mod-cm6 .cm-content" : ".markdown-reading-view .markdown-preview-view"
    );
    const para = pick(
      isEdit ? ".markdown-source-view.mod-cm6 .cm-line" : ".markdown-reading-view .markdown-preview-view p"
    );
    const h1 = pick(
      isEdit ? ".markdown-source-view.mod-cm6 .cm-line .cm-header-1" : ".markdown-reading-view .markdown-preview-view h1"
    );
    const listItem = pick(
      isEdit ? ".markdown-source-view.mod-cm6 .HyperMD-list-line" : ".markdown-reading-view .markdown-preview-view ul > li"
    );
    const pre = pick(
      isEdit ? ".markdown-source-view.mod-cm6 pre" : ".markdown-reading-view .markdown-preview-view pre"
    );
    const quote = pick(
      isEdit ? ".markdown-source-view.mod-cm6 blockquote" : ".markdown-reading-view .markdown-preview-view blockquote"
    );
    const inlineCode = pick(
      isEdit ? ".markdown-source-view.mod-cm6 code" : ".markdown-reading-view .markdown-preview-view code"
    );
    const dump = {
      mode: isEdit ? "edit (Live Preview)" : "reading",
      container: style(container, [
        "font-family",
        "font-size",
        "line-height",
        "max-width",
        "width",
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left",
        "color"
      ]),
      paragraph: style(para, [
        "font-size",
        "line-height",
        "margin-top",
        "margin-bottom",
        "margin-left",
        "margin-right",
        "text-indent"
      ]),
      h1: style(h1, ["font-size", "line-height", "font-weight", "margin-top", "margin-bottom"]),
      listItem: style(listItem, [
        "padding-left",
        "margin-left",
        "margin-right",
        "text-indent",
        "line-height"
      ]),
      codeBlock: style(pre, [
        "font-size",
        "line-height",
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left",
        "background-color",
        "border-radius"
      ]),
      blockquote: style(quote, [
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left",
        "margin-top",
        "margin-bottom",
        "border-left-width",
        "background-color"
      ]),
      inlineCode: style(inlineCode, [
        "font-size",
        "padding-top",
        "padding-bottom",
        "padding-left",
        "padding-right",
        "background-color",
        "border-radius"
      ]),
      cssVariables: {
        "--font-text": cssVar("--font-text"),
        "--line-height-normal": cssVar("--line-height-normal"),
        "--h1-size": cssVar("--h1-size"),
        "--h1-line-height": cssVar("--h1-line-height"),
        "--h1-margin-top": cssVar("--h1-margin-top"),
        "--h1-margin-bottom": cssVar("--h1-margin-bottom"),
        "--p-spacing": cssVar("--p-spacing"),
        "--list-spacing": cssVar("--list-spacing"),
        "--list-indent": cssVar("--list-indent"),
        "--code-size": cssVar("--code-size"),
        "--code-padding": cssVar("--code-padding"),
        "--code-radius": cssVar("--code-radius"),
        "--blockquote-padding": cssVar("--blockquote-padding"),
        "--blockquote-border-thickness": cssVar("--blockquote-border-thickness"),
        "--file-margins": cssVar("--file-margins"),
        "--file-line-width": cssVar("--file-line-width"),
        "--normal-font-size": cssVar("--normal-font-size"),
        "--font-text-size": cssVar("--font-text-size")
      }
    };
    console.log(
      "[native-slides debug-styles] " + (isEdit ? "EDIT" : "READING") + "\n" + JSON.stringify(dump, null, 2)
    );
    new import_obsidian.Notice(
      "Typography dump \u2192 Console (Cmd+Opt+I). Run again in the other view; for code/quote data, run on a note containing them."
    );
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
    new import_obsidian.Setting(containerEl).setName("WYSIWYG mode (deck notes)").setDesc(
      "Immersive deck mode: hides the tab bar and sidebars, shows the bottom bar at tab-bar height in both views, and hides in-note properties while editing. Toggle from the command palette, the Mod+Shift+E hotkey, or the bottom-bar button."
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvZGVjay50cyIsICJzcmMvY3JlYXRlTmV4dC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBuYXRpdmUtc2xpZGVzIFx1MjAxNCByZWFkaW5nLXZpZXcgcHJvcGVydGllcyBiYXIgd2l0aCBQUFQtc3R5bGUgZGVjayBuYXZpZ2F0aW9uXG4gKlxuICogRmVhdHVyZXM6XG4gKiAgIDEuIEhpZGVzIE9ic2lkaWFuJ3MgbmF0aXZlIHN0YXR1cyBiYXIgYW5kIHJlbmRlcnMgYSBcInByb3BlcnRpZXMgYmFyXCIgYXQgdGhlXG4gKiAgICAgIGJvdHRvbSBvZiB0aGUgd2luZG93LlxuICogICAyLiBJbiByZWFkaW5nIHZpZXcsIHNob3dzIHRoZSBjdXJyZW50IG5vdGUncyBwcm9wZXJ0aWVzIChZQU1MIGZyb250bWF0dGVyKVxuICogICAgICBhcyBjaGlwcyBpbiB0aGF0IGJhci5cbiAqICAgMy4gUmVhZGluZyB2aWV3IGF1dG8tZW50ZXJzIGEgZnVsbHNjcmVlbi1saWtlIG1vZGU6IHRoZSByaWJib24sIHNpZGViYXJzLFxuICogICAgICB0YWIgYmFyIGFuZCB0aGUgcGFuZSBoZWFkZXIgYmFyIGFyZSBoaWRkZW47IGxlYXZpbmcgcmVhZGluZyB2aWV3XG4gKiAgICAgIHJlc3RvcmVzIHRoZW0gYXV0b21hdGljYWxseS4gUHJlc3NpbmcgRXNjIHRvIGxlYXZlIHRoZSBPUyBmdWxsc2NyZWVuXG4gKiAgICAgIGFsc28gZXhpdHMgcmVhZGluZyB2aWV3LlxuICogICA0LiBIaWRlcyB0aGUgaW4tbm90ZSBwcm9wZXJ0aWVzIHBhbmVsIGluIHJlYWRpbmcgdmlldyAoa2VwdCBpbiBlZGl0IHZpZXcpLlxuICogICA1LiBQUFQtc3R5bGUgZGVjayBuYXZpZ2F0aW9uIGRyaXZlbiBieSBPTkUgcmVzZXJ2ZWQgZnJvbnRtYXR0ZXIga2V5LCBgZGVja2AsXG4gKiAgICAgIGhvbGRpbmcgdXAgdG8gdHdvIG1hcmtkb3duIGxpbmtzOlxuICogICAgICAgIC0gb3ZlcnZpZXcgbm90ZSA6IGRlY2s6IFtcIltbZmlyc3Qtc2xpZGVdXVwiXSAgICAgICAgICAgIChvbmUgbGluayA9IHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0IHBhZ2Ugb2YgdGhlIGRlY2s7IHRoZSBub3RlIGlzIHRoZSBvdmVydmlldylcbiAqICAgICAgICAtIHNsaWRlIG5vdGUgICAgOiBkZWNrOiBbXCJbW292ZXJ2aWV3XV1cIiwgXCJbW25leHQtc2xpZGVdXVwiXVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIChmaXJzdCBsaW5rID0gdGhlIG92ZXJ2aWV3IHBhZ2UsIHNlY29uZCBsaW5rID0gdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCBzbGlkZTsgb21pdCB0aGUgc2Vjb25kIGxpbmsgb24gdGhlIGxhc3Qgc2xpZGUpXG4gKiAgICAgIFRoZSBwYWdlIG51bWJlciBpcyBjb21wdXRlZCBhdXRvbWF0aWNhbGx5IGJ5IHNjYW5uaW5nIHRoZSB2YXVsdCBhbmRcbiAqICAgICAgd2Fsa2luZyB0aGUgY2hhaW4gb2YgbGlua3MsIHNvIG5vIGBwYWdlLW51bWJlcmAgcHJvcGVydHkgaXMgbmVlZGVkLlxuICogICAgICBcdTI1QzAgXHUyNUI2IGJ1dHRvbnMgYXBwZWFyIG9uIHRoZSBsZWZ0IG9mIHRoZSBiYXIsIGFuZCBcIlByZXZpb3VzIFBhZ2VcIiAvIFwiTmV4dFxuICogICAgICBQYWdlXCIgY29tbWFuZHMgYXJlIHJlZ2lzdGVyZWQgKGRlZmF1bHQgaG90a2V5cyBNb2QrU2hpZnQrXHUyMTkwIC8gTW9kK1NoaWZ0K1x1MjE5MixcbiAqICAgICAgcmViaW5kYWJsZSB1bmRlciBTZXR0aW5ncyBcdTIxOTIgSG90a2V5cykuXG4gKiAgIDYuIEEgc2V0dGluZ3MgdGFiIHRvZ2dsZXMgdGhlIFx1MjVDMCBcdTI1QjYgYnV0dG9ucyBhbmQgdGhlIHBhZ2UgbnVtYmVyLlxuICogICA3LiBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIgY29tbWFuZDogY3JlYXRlcyBhIG5ldyBzbGlkZSByaWdodCBhZnRlciB0aGVcbiAqICAgICAgY3VycmVudCBvbmUgKG5hbWUtY29sbGlzaW9uIGF3YXJlKSwgcmV3aXJlcyB0aGUgYGRlY2tgIHByb3BlcnRpZXMgb2ZcbiAqICAgICAgYm90aCBub3RlcywgYW5kIG9wZW5zIHRoZSBuZXcgbm90ZSBpbiBlZGl0IG1vZGUuXG4gKiAgIDguIFwiVG9nZ2xlIFdZU0lXWUcgTW9kZVwiIChjb21tYW5kICsgaG90a2V5ICsgYm90dG9tLWJhciBidXR0b24sIGRlY2tcbiAqICAgICAgbm90ZXMgb25seSk6IHN3aXRjaGVzIHRvIHVuaWZpZWQgZWRpdC9yZWFkaW5nIHR5cG9ncmFwaHkgXHUyMDE0IGFuXG4gKiAgICAgIGltbWVyc2l2ZSBtb2RlOiB0aGUgdGFiIGJhciBhbmQgc2lkZWJhcnMgaGlkZSBpbiBib3RoIHZpZXdzLCB0aGVcbiAqICAgICAgYm90dG9tIGJhciBzaG93cyBpbiBlZGl0IHZpZXcgdG9vIGFuZCBtYXRjaGVzIHRoZSB0YWIgYmFyJ3NcbiAqICAgICAgbWVhc3VyZWQgaGVpZ2h0IChubyBjb250ZW50LWFyZWEgaGVpZ2h0IGNoYW5nZSB3aGVuIHN3aXRjaGluZ1xuICogICAgICBtb2RlcyksIGluLW5vdGUgcHJvcGVydGllcyBoaWRlIHdoaWxlIGVkaXRpbmcsIGFuZCB0eXBvZ3JhcGh5XG4gKiAgICAgIGFsaWdubWVudCBDU1MgbmFycm93cyBlZGl0L3JlYWRpbmcgZGlmZmVyZW5jZXMuIEFsbCBydWxlcyBhcmVcbiAqICAgICAgc2NvcGVkIHVuZGVyIGJvZHkubmF0aXZlLXNsaWRlcy13eXNpd3lnLlxuICogICA5LiBcIkRlYnVnOiBEdW1wIFR5cG9ncmFwaHkgU3R5bGVzXCIgKG5zLWRlYnVnLXN0eWxlcyk6IHByaW50cyB0aGVcbiAqICAgICAga2V5IGNvbXB1dGVkIHN0eWxlcyArIENTUyB2YXJpYWJsZXMgb2YgdGhlIGN1cnJlbnQgdmlldyB0byB0aGVcbiAqICAgICAgY29uc29sZSBcdTIwMTQgcnVuIG9uY2UgcGVyIHZpZXcgYW5kIGNvbXBhcmUgdG8gdHVuZSBydWxlIDgnc1xuICogICAgICB0eXBvZ3JhcGh5IGFsaWdubWVudCB3aXRob3V0IGV5ZWJhbGxpbmcgc2NyZWVuc2hvdHMuXG4gKlxuICogVGhlIGRlY2sgdXN1YWxseSBzdGFydHMgZnJvbSBhbiBvdmVydmlldyBub3RlIHRoYXQgZW1iZWRzIGFuIE9ic2lkaWFuIEJhc2VcbiAqIHZpZXcgKGNvcmUgXCJCYXNlc1wiIHBsdWdpbikgZmlsdGVyaW5nIG5vdGVzIHRoYXQgbGluayB0byB0aGUgb3ZlcnZpZXcgcGFnZTpcbiAqXG4gKiAgIGBgYGJhc2VcbiAqICAgZmlsdGVyczpcbiAqICAgICBhbmQ6XG4gKiAgICAgICAtIGZpbGUuaGFzTGluayhcIm92ZXJ2aWV3XCIpXG4gKiAgIHZpZXdzOlxuICogICAgIC0gdHlwZTogdGFibGVcbiAqICAgICAgIG5hbWU6IERlY2tcbiAqICAgYGBgXG4gKlxuICogV2h5IHJlYWQgcHJvcGVydGllcyB2aWEgbWV0YWRhdGFDYWNoZSBpbnN0ZWFkIG9mIHBhcnNpbmcgWUFNTCBtYW51YWxseT9cbiAqICAgT2JzaWRpYW4gbWFpbnRhaW5zIGEgY2FjaGUgcGVyIG5vdGU7IG1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpXG4gKiAgIC5mcm9udG1hdHRlciByZXR1cm5zIHRoZSBwYXJzZWQgcHJvcGVydGllcywgdXBkYXRlZCBhdXRvbWF0aWNhbGx5IG9uIHNhdmUuXG4gKi9cblxuaW1wb3J0IHsgTWFya2Rvd25WaWV3LCBOb3RpY2UsIFBsdWdpbiwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZywgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IHBsYW5DcmVhdGVOZXh0LCB0eXBlIENyZWF0ZU5leHRSZXN1bHQgfSBmcm9tIFwiLi9zcmMvY3JlYXRlTmV4dFwiO1xuaW1wb3J0IHsgY29tcHV0ZURlY2ssIGV4dHJhY3RMaW5rcywgZXh0cmFjdFJhd0xpbmtzLCBmb3JtYXRWYWx1ZSwgdHlwZSBEZWNrSW5mbyB9IGZyb20gXCIuL3NyYy9kZWNrXCI7XG5cbi8qKiBQbHVnaW4gc2V0dGluZ3MgKi9cbmludGVyZmFjZSBOYXRpdmVTbGlkZXNTZXR0aW5ncyB7XG4gIC8qKiBTaG93IFx1MjVDMCBcdTI1QjYgcHJldmlvdXMvbmV4dCBidXR0b25zIG9uIHRoZSBsZWZ0IG9mIHRoZSBiYXIgKi9cbiAgc2hvd05hdkJ1dHRvbnM6IGJvb2xlYW47XG4gIC8qKiBTaG93IHRoZSBhdXRvLWNvbXB1dGVkIHBhZ2UgbnVtYmVyIGF0IHRoZSBib3R0b20tcmlnaHQgb2YgdGhlIGJhciAqL1xuICBzaG93UGFnZU51bWJlcjogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgdGhlIHVzZXIgbWFudWFsbHkgaGlkIHRoZSBiYXIgKHRvZ2dsZSBjb21tYW5kKSAqL1xuICBiYXJIaWRkZW46IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIGF1dG8tZnVsbHNjcmVlbiBpbiByZWFkaW5nIHZpZXcgaXMgZW5hYmxlZCAqL1xuICBhdXRvRnVsbHNjcmVlbjogYm9vbGVhbjtcbiAgLyoqIFdZU0lXWUcgbW9kZSAodW5pZmllZCBlZGl0L3JlYWRpbmcgdHlwb2dyYXBoeSkgXHUyMDE0IGRlY2sgbm90ZXMgb25seSAqL1xuICB3eXNpd3lnTW9kZTogYm9vbGVhbjtcbn1cblxuY29uc3QgREVGQVVMVF9TRVRUSU5HUzogTmF0aXZlU2xpZGVzU2V0dGluZ3MgPSB7XG4gIHNob3dOYXZCdXR0b25zOiB0cnVlLFxuICBzaG93UGFnZU51bWJlcjogdHJ1ZSxcbiAgYmFySGlkZGVuOiBmYWxzZSxcbiAgYXV0b0Z1bGxzY3JlZW46IHRydWUsXG4gIHd5c2l3eWdNb2RlOiBmYWxzZSxcbn07XG5cbi8qKiBSZXNlcnZlZCBmcm9udG1hdHRlciBrZXkgZHJpdmluZyBkZWNrIG5hdmlnYXRpb24gKG5ldmVyIHJlbmRlcmVkIGFzIGEgY2hpcCkgKi9cbmNvbnN0IERFQ0tfS0VZID0gXCJkZWNrXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE5hdGl2ZVNsaWRlc1BsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIC8qKiBUaGUgcHJvcGVydGllcyBiYXIgRE9NIGVsZW1lbnQgKi9cbiAgcHJpdmF0ZSBiYXI6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIC8qKiBXaGV0aGVyIGZ1bGxzY3JlZW4gcmVhZGluZyBtb2RlIGlzIGN1cnJlbnRseSBhY3RpdmUgKi9cbiAgcHJpdmF0ZSBmdWxsc2NyZWVuID0gZmFsc2U7XG4gIC8qKiBMYXN0IHJlZnJlc2gga2V5IChcInBhdGh8bW9kZVwiKSB0byBhdm9pZCBwb2ludGxlc3MgcmUtcmVuZGVycyAqL1xuICBwcml2YXRlIGxhc3RLZXkgPSBcIlwiO1xuICAvKiogTGFzdCBtZWFzdXJlZCB0YWItYmFyIGhlaWdodCAocHgpIFx1MjAxNCBjYWNoZWQgd2hpbGUgdGhlIGJhciBpcyBoaWRkZW4gKi9cbiAgcHJpdmF0ZSB0YWJCYXJIZWlnaHQgPSAwO1xuICAvKiogUGx1Z2luIHNldHRpbmdzICovXG4gIHNldHRpbmdzOiBOYXRpdmVTbGlkZXNTZXR0aW5ncyA9IHsgLi4uREVGQVVMVF9TRVRUSU5HUyB9O1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgTmF0aXZlU2xpZGVzU2V0dGluZ1RhYih0aGlzKSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMS4gUmVmcmVzaCBvbiBcImN1cnJlbnQgbm90ZSAvIHZpZXcgY2hhbmdlZFwiIGV2ZW50cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsICgpID0+IHRoaXMucmVmcmVzaCgpKSk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAoKSA9PiB0aGlzLnJlZnJlc2goKSkpO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJsYXlvdXQtY2hhbmdlXCIsICgpID0+IHRoaXMucmVmcmVzaCgpKSk7XG4gICAgLy8gUmVmcmVzaCB3aGVuIHRoZSBub3RlIGNvbnRlbnQgKGluY2x1ZGluZyBmcm9udG1hdHRlcikgY2hhbmdlcyAvIHNhdmVzXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5vbihcImNoYW5nZWRcIiwgKGZpbGU6IFRGaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlID09PSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpKSB0aGlzLnJlZnJlc2goKTtcbiAgICAgIH0pLFxuICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMi4gRmFsbGJhY2sgdGltZXI6IGVkaXRcdTIxOTRyZWFkaW5nIHRvZ2dsZXMgbWF5IGZpcmUgbm8gc3RhbmRhcmQgZXZlbnQgXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5yZWdpc3RlckludGVydmFsKFxuICAgICAgd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGNvbnN0IGtleSA9IGZpbGUgPyBgJHtmaWxlLnBhdGh9fCR7dGhpcy5jdXJyZW50TW9kZSgpfWAgOiBcIlwiO1xuICAgICAgICBpZiAoa2V5ICE9PSB0aGlzLmxhc3RLZXkpIHtcbiAgICAgICAgICB0aGlzLmxhc3RLZXkgPSBrZXk7XG4gICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgIH1cbiAgICAgIH0sIDUwMCksXG4gICAgKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCAzLiBDb21tYW5kcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICAvLyAzYS4gTWFudWFsbHkgc2hvdyAvIGhpZGUgdGhlIHByb3BlcnRpZXMgYmFyXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLXRvZ2dsZS1iYXJcIixcbiAgICAgIG5hbWU6IFwiVG9nZ2xlIFByb3BlcnRpZXMgQmFyXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgICB0aGlzLnNldHRpbmdzLmJhckhpZGRlbiA9ICF0aGlzLnNldHRpbmdzLmJhckhpZGRlbjtcbiAgICAgICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIC8vIDNiLiBQYXVzZSAvIHJlc3VtZSBhdXRvLWZ1bGxzY3JlZW4gaW4gcmVhZGluZyB2aWV3XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLXRvZ2dsZS1mdWxsc2NyZWVuXCIsXG4gICAgICBuYW1lOiBcIlBhdXNlL1Jlc3VtZSBBdXRvIEZ1bGxzY3JlZW5cIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MuYXV0b0Z1bGxzY3JlZW4gPSAhdGhpcy5zZXR0aW5ncy5hdXRvRnVsbHNjcmVlbjtcbiAgICAgICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgLy8gV2hlbiBwYXVzZWQsIHJlc3RvcmUgdGhlIGxheW91dCBpbW1lZGlhdGVseTsgd2hlbiByZXN1bWVkLCByZS1zeW5jXG4gICAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5hdXRvRnVsbHNjcmVlbikgdGhpcy5zeW5jRnVsbHNjcmVlbihmYWxzZSk7XG4gICAgICAgIGVsc2UgdGhpcy5yZWZyZXNoKCk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIC8vIDNjLiBQcmV2aW91cyAvIG5leHQgcGFnZSAoZGVjayBuYXZpZ2F0aW9uLCByZWJpbmRhYmxlIGluIFNldHRpbmdzIFx1MjE5MiBIb3RrZXlzKVxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJucy1wcmV2XCIsXG4gICAgICBuYW1lOiBcIlByZXZpb3VzIFBhZ2VcIixcbiAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJBcnJvd0xlZnRcIiB9XSxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLm5hdmlnYXRlKFwicHJldlwiKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibnMtbmV4dFwiLFxuICAgICAgbmFtZTogXCJOZXh0IFBhZ2VcIixcbiAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJBcnJvd1JpZ2h0XCIgfV0sXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5uYXZpZ2F0ZShcIm5leHRcIiksXG4gICAgfSk7XG4gICAgLy8gM2QuIENyZWF0ZSBOZXh0IFNsaWRlIFx1MjAxNCBuZXcgc2xpZGUgYWZ0ZXIgdGhlIGN1cnJlbnQgb25lIChkZWNrIG5vdGVzIG9ubHkpXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLWNyZWF0ZS1uZXh0XCIsXG4gICAgICBuYW1lOiBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIsXG4gICAgICAvLyBHcmV5ZWQgb3V0IGluIHRoZSBwYWxldHRlIHVubGVzcyB0aGUgYWN0aXZlIG5vdGUgY2FuIHRha2UgYSBuZXh0IHNsaWRlXG4gICAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmcpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGlmICghZmlsZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBjb25zdCBwbGFuID0gdGhpcy5wbGFuQ3JlYXRlTmV4dChmaWxlKTtcbiAgICAgICAgaWYgKCFwbGFuKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghY2hlY2tpbmcpIHZvaWQgdGhpcy5leGVjdXRlQ3JlYXRlTmV4dChmaWxlLCBwbGFuKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIC8vIDNlLiBUb2dnbGUgV1lTSVdZRyBtb2RlIFx1MjAxNCB1bmlmaWVkIGVkaXQvcmVhZGluZyB0eXBvZ3JhcGh5IChkZWNrIG5vdGVzIG9ubHkpXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLXRvZ2dsZS13eXNpd3lnXCIsXG4gICAgICBuYW1lOiBcIlRvZ2dsZSBXWVNJV1lHIE1vZGVcIixcbiAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJFXCIgfV0sXG4gICAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmcpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGlmICghZmlsZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBjb25zdCBmbSA9IHRoaXMuZnJvbnRtYXR0ZXJPZihmaWxlKTtcbiAgICAgICAgaWYgKGZtID09PSBudWxsIHx8ICEoREVDS19LRVkgaW4gZm0pKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghY2hlY2tpbmcpIHRoaXMudG9nZ2xlV3lzaXd5ZygpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgLy8gM2YuIERlYnVnOiBkdW1wIHR5cG9ncmFwaHkgY29tcHV0ZWQgc3R5bGVzIGZvciBlZGl0L3JlYWRpbmcgY29tcGFyaXNvblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJucy1kZWJ1Zy1zdHlsZXNcIixcbiAgICAgIG5hbWU6IFwiRGVidWc6IER1bXAgVHlwb2dyYXBoeSBTdHlsZXNcIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLmRlYnVnU3R5bGVzKCksXG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgNC4gRXNjIGV4aXRzIE9TIGZ1bGxzY3JlZW4gXHUyMTkyIGxlYXZlIHJlYWRpbmcgdmlldyBhcyB3ZWxsIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIC8vIEtlZXBzIGludGVybmFsIHN0YXRlIGluIHN5bmMgd2hlbiB0aGUgdXNlciBwcmVzc2VzIEVzYzsgYWxzbyBzd2l0Y2hlc1xuICAgIC8vIHRoZSBhY3RpdmUgTWFya2Rvd24gdmlldyBiYWNrIHRvIGVkaXQgbW9kZS4gT3VyIG93biBleGl0RnVsbHNjcmVlbigpXG4gICAgLy8gY2FsbHMgc2V0IHRoaXMuZnVsbHNjcmVlbiA9IGZhbHNlIGZpcnN0LCBzbyB0aGV5IG5ldmVyIHRyaWdnZXIgdGhpcy5cbiAgICB0aGlzLnJlZ2lzdGVyRG9tRXZlbnQoZG9jdW1lbnQsIFwiZnVsbHNjcmVlbmNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBpZiAoIWRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50ICYmIHRoaXMuZnVsbHNjcmVlbikge1xuICAgICAgICB0aGlzLmZ1bGxzY3JlZW4gPSBmYWxzZTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKFwibmF0aXZlLXNsaWRlcy1mdWxsc2NyZWVuXCIpO1xuICAgICAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICAgICAgaWYgKHZpZXcgJiYgdmlldy5nZXRNb2RlKCkgPT09IFwicHJldmlld1wiKSB7XG4gICAgICAgICAgLy8gTGVhdmUgcmVhZGluZyB2aWV3IHZpYSB0aGUgcHVibGljIHZpZXctc3RhdGUgQVBJXG4gICAgICAgICAgY29uc3Qgc3RhdGUgPSB2aWV3LmxlYWYuZ2V0Vmlld1N0YXRlKCk7XG4gICAgICAgICAgc3RhdGUuc3RhdGUgPSB7IC4uLnN0YXRlLnN0YXRlLCBtb2RlOiBcInNvdXJjZVwiIH07XG4gICAgICAgICAgdm9pZCB2aWV3LmxlYWYuc2V0Vmlld1N0YXRlKHN0YXRlLCB7IGZvY3VzOiBmYWxzZSB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDUuIENyZWF0ZSB0aGUgYmFyIGFuZCBkbyB0aGUgZmlyc3QgcmVuZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIHRoaXMuYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLmJhci5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtYmFyXCI7XG4gICAgdGhpcy5iYXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiOyAvLyBoaWRkZW4gdW50aWwgcmVmcmVzaCgpIGRlY2lkZXMgb3RoZXJ3aXNlXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmJhcik7XG4gICAgdGhpcy5yZWZyZXNoKCk7XG4gIH1cblxuICBvbnVubG9hZCgpOiB2b2lkIHtcbiAgICB0aGlzLmJhcj8ucmVtb3ZlKCk7XG4gICAgdGhpcy5iYXIgPSBudWxsO1xuICAgIC8vIExlYXZlIE9TIGZ1bGxzY3JlZW4gYW5kIGRyb3AgdGhlIGZ1bGxzY3JlZW4gY2xhc3Mgc28gbm8gVUkgcmVzaWR1ZSByZW1haW5zXG4gICAgaWYgKGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50KSBkb2N1bWVudC5leGl0RnVsbHNjcmVlbj8uKCkuY2F0Y2goKCkgPT4ge30pO1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShcIm5hdGl2ZS1zbGlkZXMtZnVsbHNjcmVlblwiKTtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoXCJuYXRpdmUtc2xpZGVzLXd5c2l3eWdcIik7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU2V0dGluZ3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgRGVjayByZXNvbHV0aW9uICh3YWxrIHRoZSBsaW5rIGNoYWluKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICAvKiogUmVzb2x2ZSB0aGUgY3VycmVudCBub3RlJ3MgcG9zaXRpb24gaW5zaWRlIGl0cyBkZWNrIChwYXRoLWJhc2VkIHdyYXBwZXIpICovXG4gIHByaXZhdGUgY29tcHV0ZURlY2soZmlsZTogVEZpbGUpOiBEZWNrSW5mbyB8IG51bGwge1xuICAgIHJldHVybiBjb21wdXRlRGVjayhmaWxlLnBhdGgsIChwYXRoKSA9PiB0aGlzLmRlY2tMaW5rUGF0aHMocGF0aCkpO1xuICB9XG5cbiAgLyoqIFJlc29sdmUgdGhlIGBkZWNrYCBwcm9wZXJ0eSBvZiBhIG5vdGUgaW50byByZWFsIG5vdGUgcGF0aHMgKG1heCB0d28pICovXG4gIHByaXZhdGUgZGVja0xpbmtQYXRocyhwYXRoOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZiA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcbiAgICBpZiAoIShmIGluc3RhbmNlb2YgVEZpbGUpKSByZXR1cm4gW107XG4gICAgY29uc3QgZm0gPSB0aGlzLmZyb250bWF0dGVyT2YoZik7XG4gICAgY29uc3QgbmFtZXMgPSBmbSA/IGV4dHJhY3RMaW5rcyhmbVtERUNLX0tFWV0pIDogW107XG4gICAgcmV0dXJuIG5hbWVzXG4gICAgICAubWFwKChuYW1lKSA9PiB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KG5hbWUsIHBhdGgpKVxuICAgICAgLmZpbHRlcigoeCk6IHggaXMgVEZpbGUgPT4gISF4KVxuICAgICAgLm1hcCgoeCkgPT4geC5wYXRoKTtcbiAgfVxuXG4gIC8qKiBOYW1lcyBpbiB0aGUgYGRlY2tgIHByb3BlcnR5IHRoYXQgcmVzb2x2ZSB0byBubyBub3RlIChicm9rZW4gbGlua3MpICovXG4gIHByaXZhdGUgYnJva2VuRGVja0xpbmtzKGZpbGU6IFRGaWxlKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGZtID0gdGhpcy5mcm9udG1hdHRlck9mKGZpbGUpO1xuICAgIGNvbnN0IG5hbWVzID0gZm0gPyBleHRyYWN0TGlua3MoZm1bREVDS19LRVldKSA6IFtdO1xuICAgIHJldHVybiBuYW1lcy5maWx0ZXIoKG5hbWUpID0+ICF0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KG5hbWUsIGZpbGUucGF0aCkpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIENyZWF0ZSBOZXh0IFNsaWRlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKlxuICAgKiBQbGFuIGEgXCJDcmVhdGUgTmV4dCBTbGlkZVwiIHJ1biBmb3IgdGhlIGFjdGl2ZSBub3RlLCBvciBudWxsIHdoZW4gdGhlXG4gICAqIG5vdGUgY2Fubm90IHRha2UgYSBuZXh0IHNsaWRlIChubyB1c2FibGUgYGRlY2tgIHByb3BlcnR5KS5cbiAgICpcbiAgICogU2xpZGVzIG9uIHRoZSBjaGFpbiBpbnNlcnQvYXBwZW5kIGFmdGVyIHRoZSBjdXJyZW50IG5vdGU7IHRoZSBvdmVydmlld1xuICAgKiBwYWdlIGluc2VydHMgYSBuZXcgZmlyc3QgcGFnZTsgYW4gb2ZmLWNoYWluIG5vdGUgd2l0aCBhIHJlc29sdmFibGVcbiAgICogb3ZlcnZpZXcgbGluayBzdGlsbCBnZXRzIGl0cyBkZWNsYXJlZCBtaXNzaW5nIG5leHQgbm90ZSBjcmVhdGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBwbGFuQ3JlYXRlTmV4dChmaWxlOiBURmlsZSk6IENyZWF0ZU5leHRSZXN1bHQgfCBudWxsIHtcbiAgICBjb25zdCBmbSA9IHRoaXMuZnJvbnRtYXR0ZXJPZihmaWxlKTtcbiAgICBjb25zdCByYXcgPSBmbSA/IGV4dHJhY3RSYXdMaW5rcyhmbVtERUNLX0tFWV0pIDogW107XG4gICAgaWYgKHJhdy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuXG4gICAgY29uc3QgZGVjayA9IHRoaXMuY29tcHV0ZURlY2soZmlsZSk7XG4gICAgY29uc3QgZXhpc3RpbmdOYW1lcyA9IG5ldyBTZXQodGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpLm1hcCgoZikgPT4gZi5iYXNlbmFtZSkpO1xuXG4gICAgaWYgKGRlY2spIHtcbiAgICAgIC8vIE92ZXJ2aWV3IGluc2VydGlvbiBuZWVkcyB0aGUgb2xkIGZpcnN0IHBhZ2UncyBiYWNrIGxpbmsgdG8gdGhlXG4gICAgICAvLyBvdmVydmlldyAoaXRzIG93biBmcm9udG1hdHRlciBvbmx5IGxpbmtzIGZvcndhcmQpLlxuICAgICAgbGV0IG92ZXJ2aWV3QmFja0xpbms6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChkZWNrLmluZGV4ID09PSAwKSB7XG4gICAgICAgIGNvbnN0IG9sZEZpcnN0ID0gZGVjay5jaGFpblsxXSA/IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChkZWNrLmNoYWluWzFdKSA6IG51bGw7XG4gICAgICAgIGlmIChvbGRGaXJzdCBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICAgICAgY29uc3QgZjIgPSB0aGlzLmZyb250bWF0dGVyT2Yob2xkRmlyc3QpO1xuICAgICAgICAgIG92ZXJ2aWV3QmFja0xpbmsgPSBmMiA/IGV4dHJhY3RSYXdMaW5rcyhmMltERUNLX0tFWV0pWzBdIDogdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcGxhbkNyZWF0ZU5leHQoe1xuICAgICAgICBjdXJyZW50TmFtZTogZmlsZS5iYXNlbmFtZSxcbiAgICAgICAgY3VycmVudExpbmtzOiByYXcsXG4gICAgICAgIGlzT3ZlcnZpZXc6IGRlY2suaW5kZXggPT09IDAsXG4gICAgICAgIG92ZXJ2aWV3QmFja0xpbmssXG4gICAgICAgIGV4aXN0aW5nTmFtZXMsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBPZmYtY2hhaW4gbm90ZTogc3RpbGwgY3JlYXRlIGl0cyBkZWNsYXJlZCBtaXNzaW5nIG5leHQgbm90ZSB3aGVuIHRoZVxuICAgIC8vIG92ZXJ2aWV3IGxpbmsgcmVzb2x2ZXMgKHRoZSBcdTI2QTAgYnJva2VuLWxpbmsgd2FybmluZyBkaXNhcHBlYXJzKS5cbiAgICBjb25zdCBvdmVydmlld05hbWUgPSByYXcubGVuZ3RoID49IDIgPyBleHRyYWN0TGlua3MocmF3WzBdKVswXSA6IG51bGw7XG4gICAgaWYgKG92ZXJ2aWV3TmFtZSAmJiB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KG92ZXJ2aWV3TmFtZSwgZmlsZS5wYXRoKSkge1xuICAgICAgcmV0dXJuIHBsYW5DcmVhdGVOZXh0KHtcbiAgICAgICAgY3VycmVudE5hbWU6IGZpbGUuYmFzZW5hbWUsXG4gICAgICAgIGN1cnJlbnRMaW5rczogcmF3LFxuICAgICAgICBpc092ZXJ2aWV3OiBmYWxzZSxcbiAgICAgICAgZXhpc3RpbmdOYW1lcyxcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKiBBcHBseSBhIHBsYW46IGNyZWF0ZSB0aGUgbm90ZSwgcmV3aXJlIGBkZWNrYCBwcm9wZXJ0aWVzLCBvcGVuIGl0ICovXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZUNyZWF0ZU5leHQoZmlsZTogVEZpbGUsIHBsYW46IENyZWF0ZU5leHRSZXN1bHQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBkaXIgPSBmaWxlLnBhcmVudD8ucGF0aCA/IGZpbGUucGFyZW50LnBhdGggKyBcIi9cIiA6IFwiXCI7XG4gICAgY29uc3QgbmV3UGF0aCA9IGAke2Rpcn0ke3BsYW4ubmV3TmFtZX0ubWRgO1xuICAgIGNvbnN0IGZyb250bWF0dGVyID0gcGxhbi5uZXdEZWNrTGlua3MubWFwKChsaW5rKSA9PiBKU09OLnN0cmluZ2lmeShsaW5rKSkuam9pbihcIiwgXCIpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBgLS0tXFxuZGVjazogWyR7ZnJvbnRtYXR0ZXJ9XVxcbi0tLVxcbmA7XG5cbiAgICBsZXQgbmV3RmlsZTogVEZpbGU7XG4gICAgdHJ5IHtcbiAgICAgIG5ld0ZpbGUgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUobmV3UGF0aCwgY29udGVudCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIG5ldyBOb3RpY2UoYE5hdGl2ZSBTbGlkZXM6IGNvdWxkIG5vdCBjcmVhdGUgXCIke3BsYW4ubmV3TmFtZX0ubWRcIiAoJHtTdHJpbmcoZXJyb3IpfSlgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSZXdpcmUgdGhlIGN1cnJlbnQgbm90ZSdzIGBkZWNrYCAoa2VlcHMgYWxsIG90aGVyIHByb3BlcnRpZXMgaW50YWN0KVxuICAgIGZvciAoY29uc3QgcmV3cml0ZSBvZiBwbGFuLnJld3JpdGVzKSB7XG4gICAgICBpZiAocmV3cml0ZS5uYW1lICE9PSBmaWxlLmJhc2VuYW1lKSBjb250aW51ZTsgLy8gaW4gcHJhY3RpY2UgYWx3YXlzIHRoZSBjdXJyZW50IG5vdGVcbiAgICAgIGF3YWl0IHRoaXMuYXBwLmZpbGVNYW5hZ2VyLnByb2Nlc3NGcm9udE1hdHRlcihmaWxlLCAoZm0pID0+IHtcbiAgICAgICAgZm1bREVDS19LRVldID0gcmV3cml0ZS5kZWNrO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gT3BlbiB0aGUgbmV3IG5vdGUgaW4gdGhlIGN1cnJlbnQgcGFuZSwgZWRpdCBtb2RlIChMaXZlIFByZXZpZXcpXG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKTtcbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKG5ld0ZpbGUsIHsgc3RhdGU6IHsgbW9kZTogXCJzb3VyY2VcIiB9IH0pO1xuICB9XG5cbiAgLyoqIEZyb250bWF0dGVyIG9mIGFueSBub3RlIGFzIGFuIG9iamVjdCwgb3IgbnVsbCB3aGVuIGFic2VudCAqL1xuICBwcml2YXRlIGZyb250bWF0dGVyT2YoZmlsZTogVEZpbGUpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG4gICAgcmV0dXJuIGNhY2hlPy5mcm9udG1hdHRlciA/PyBudWxsO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFBQVCBuYXZpZ2F0aW9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBNb3ZlIG9uZSBzdGVwIGJhY2svZm9yd2FyZCBhbG9uZyB0aGUgZGVjayBjaGFpbiAqL1xuICBwcml2YXRlIG5hdmlnYXRlKGRpcmVjdGlvbjogXCJwcmV2XCIgfCBcIm5leHRcIik6IHZvaWQge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGlmICghZmlsZSkgcmV0dXJuO1xuICAgIGNvbnN0IGRlY2sgPSB0aGlzLmNvbXB1dGVEZWNrKGZpbGUpO1xuICAgIGlmICghZGVjaykgcmV0dXJuO1xuICAgIGNvbnN0IHRhcmdldCA9IGRlY2suY2hhaW5bZGlyZWN0aW9uID09PSBcInByZXZcIiA/IGRlY2suaW5kZXggLSAxIDogZGVjay5pbmRleCArIDFdO1xuICAgIGlmICghdGFyZ2V0KSByZXR1cm47XG4gICAgdm9pZCB0aGlzLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KHRhcmdldCwgZmlsZS5wYXRoKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBNb2RlIC8gZGF0YSBhY2Nlc3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLyoqIE1vZGUgb2YgdGhlIGFjdGl2ZSBNYXJrZG93biB2aWV3OiAncHJldmlldyc9cmVhZGluZyAnc291cmNlJz1lZGl0aW5nICcnPW5vbmUgKi9cbiAgcHJpdmF0ZSBjdXJyZW50TW9kZSgpOiBcInByZXZpZXdcIiB8IFwic291cmNlXCIgfCBcIlwiIHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICByZXR1cm4gdmlldyA/ICh2aWV3LmdldE1vZGUoKSBhcyBcInByZXZpZXdcIiB8IFwic291cmNlXCIpIDogXCJcIjtcbiAgfVxuXG4gIC8qKiBDdXJyZW50IG5vdGUncyBmcm9udG1hdHRlciBhcyBhbiBvYmplY3QsIG9yIG51bGwgd2hlbiBhYnNlbnQgKi9cbiAgcHJpdmF0ZSBmcm9udG1hdHRlcigpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIHJldHVybiBmaWxlID8gdGhpcy5mcm9udG1hdHRlck9mKGZpbGUpIDogbnVsbDtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBCYXIgcmVuZGVyaW5nIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBEZWNpZGUgd2hhdCB0aGUgYmFyIHNob3dzLCB0aGVuIHJlLXJlbmRlciBpdCAqL1xuICByZWZyZXNoKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5iYXIpIHJldHVybjtcblxuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGNvbnN0IG1vZGUgPSB0aGlzLmN1cnJlbnRNb2RlKCk7XG5cbiAgICAvLyBDYXJkIG5vdGUgPSBoYXMgYSBgZGVja2AgcHJvcGVydHkgKHRoZSBXWVNJV1lHIG1vZGUncyBzY29wZSBtYXJrZXIpXG4gICAgY29uc3QgY2FyZEZtID0gZmlsZSA/IHRoaXMuZnJvbnRtYXR0ZXJPZihmaWxlKSA6IG51bGw7XG4gICAgY29uc3QgaXNDYXJkID0gY2FyZEZtICE9PSBudWxsICYmIERFQ0tfS0VZIGluIGNhcmRGbTtcbiAgICAvLyBNZWFzdXJlIHRoZSB0YWIgYmFyIHdoaWxlIGl0IGlzIHN0aWxsIHZpc2libGUgKFdZU0lXWUcgaGlkZXMgaXRcbiAgICAvLyBiZWxvdzsgdGhlIGxhc3QgbWVhc3VyZWQgdmFsdWUgaXMgcmV1c2VkIG9uY2UgaGlkZGVuKS5cbiAgICB0aGlzLnN5bmNUYWJCYXJIZWlnaHQoKTtcbiAgICAvLyBXWVNJV1lHIG1vZGUgYm9keSBjbGFzcyBcdTIwMTQgaW1tZXJzaXZlIG1vZGUgKGRlY2sgbm90ZXMgb25seSk6IGhpZGVzXG4gICAgLy8gdGhlIHRhYiBiYXIgYW5kIHNpZGViYXJzIGluIGJvdGggZWRpdCBhbmQgcmVhZGluZyB2aWV3cywgbWF0Y2hlc1xuICAgIC8vIHRoZSBib3R0b20gYmFyJ3MgaGVpZ2h0IHRvIHRoZSB0YWIgYmFyLCBhbmQgaGlkZXMgaW4tbm90ZVxuICAgIC8vIHByb3BlcnRpZXMgd2hpbGUgZWRpdGluZy5cbiAgICBjb25zdCB3eXNpd3lnID0gaXNDYXJkICYmIHRoaXMuc2V0dGluZ3Mud3lzaXd5Z01vZGU7XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QudG9nZ2xlKFwibmF0aXZlLXNsaWRlcy13eXNpd3lnXCIsIHd5c2l3eWcpO1xuXG4gICAgLy8gQXV0by1mdWxsc2NyZWVuOiBlbnRlciBvbiByZWFkaW5nIHZpZXcsIHJlc3RvcmUgb24gbGVhdmluZyBpdFxuICAgIHRoaXMuc3luY0Z1bGxzY3JlZW4obW9kZSA9PT0gXCJwcmV2aWV3XCIgJiYgdGhpcy5zZXR0aW5ncy5hdXRvRnVsbHNjcmVlbik7XG5cbiAgICAvLyBCYXIgdmlzaWJpbGl0eTogcmVhZGluZyB2aWV3IGFsd2F5czsgZWRpdCB2aWV3IG9ubHkgaW4gV1lTSVdZRyBtb2RlXG4gICAgLy8gKHNvIHRoZSBtb2RlIGhhcyB2aXNpYmxlIGZlZWRiYWNrIHdoaWxlIGVkaXRpbmcpLiBIaWRkZW4gd2hlbiB0aGVcbiAgICAvLyB1c2VyIGhpZCBpdCBtYW51YWxseS5cbiAgICBjb25zdCBiYXJWaXNpYmxlID1cbiAgICAgICEhZmlsZSAmJlxuICAgICAgKG1vZGUgPT09IFwicHJldmlld1wiIHx8IChtb2RlID09PSBcInNvdXJjZVwiICYmIGlzQ2FyZCAmJiB0aGlzLnNldHRpbmdzLnd5c2l3eWdNb2RlKSkgJiZcbiAgICAgICF0aGlzLnNldHRpbmdzLmJhckhpZGRlbjtcbiAgICBpZiAoIWJhclZpc2libGUpIHtcbiAgICAgIHRoaXMuYmFyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmbSA9IHRoaXMuZnJvbnRtYXR0ZXIoKTtcbiAgICBjb25zdCBkZWNrID0gdGhpcy5jb21wdXRlRGVjayhmaWxlKTtcbiAgICBjbGVhckNoaWxkcmVuKHRoaXMuYmFyKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBMZWZ0OiBwcmV2aW91cyAvIG5leHQgYnV0dG9ucyAoYm90aCBhbHdheXMgc2hvd24gaW5zaWRlIGEgZGVjaztcbiAgICAvLyAgICAgICAgdGhlIG9uZSB0aGF0IGNhbm5vdCBtb3ZlIGlzIGRpc2FibGVkIC8gbGlnaHQgZ3JheSkgXHUyNTAwXHUyNTAwXG4gICAgaWYgKHRoaXMuc2V0dGluZ3Muc2hvd05hdkJ1dHRvbnMgJiYgZGVjaykge1xuICAgICAgY29uc3QgaGFzUHJldiA9IGRlY2suaW5kZXggPiAwO1xuICAgICAgY29uc3QgaGFzTmV4dCA9IGRlY2suaW5kZXggPCBkZWNrLmNoYWluLmxlbmd0aCAtIDE7XG4gICAgICBjb25zdCBuYXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgbmF2LmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy1uYXZcIjtcbiAgICAgIG5hdi5hcHBlbmRDaGlsZCh0aGlzLm5hdkJ1dHRvbihcIlx1MjVDMFwiLCBcIlByZXZpb3VzIHBhZ2VcIiwgKCkgPT4gdGhpcy5uYXZpZ2F0ZShcInByZXZcIiksICFoYXNQcmV2KSk7XG4gICAgICBuYXYuYXBwZW5kQ2hpbGQodGhpcy5uYXZCdXR0b24oXCJcdTI1QjZcIiwgXCJOZXh0IHBhZ2VcIiwgKCkgPT4gdGhpcy5uYXZpZ2F0ZShcIm5leHRcIiksICFoYXNOZXh0KSk7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChuYXYpO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBNaWRkbGU6IGNoaXBzIGZvciB0aGUgcmVtYWluaW5nIHByb3BlcnRpZXMgKG5vIHBsYWNlaG9sZGVyKSBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCB2aXNpYmxlID0gZm1cbiAgICAgID8gT2JqZWN0LmVudHJpZXMoZm0pLmZpbHRlcigoW2tleV0pID0+IGtleSAhPT0gREVDS19LRVkgJiYga2V5ICE9PSBcInBvc2l0aW9uXCIpXG4gICAgICA6IFtdO1xuXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgdmlzaWJsZSkge1xuICAgICAgY29uc3Qgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgc3Bhbi5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtaXRlbVwiO1xuICAgICAgY29uc3QgayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHJvbmdcIik7XG4gICAgICBrLnRleHRDb250ZW50ID0ga2V5O1xuICAgICAgc3Bhbi5hcHBlbmRDaGlsZChrKTtcbiAgICAgIHNwYW4uYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCI6IFwiICsgZm9ybWF0VmFsdWUodmFsdWUpKSk7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICB9XG5cbiAgICAvLyBCcm9rZW4gZGVjayBsaW5rcyBcdTIxOTIgd2FybmluZyBjaGlwIHNvIGRlY2sgYXV0aG9ycyBzcG90IHR5cG9zXG4gICAgY29uc3QgYnJva2VuID0gZmlsZSA/IHRoaXMuYnJva2VuRGVja0xpbmtzKGZpbGUpIDogW107XG4gICAgaWYgKGJyb2tlbi5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB3YXJuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICB3YXJuLmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy13YXJuXCI7XG4gICAgICB3YXJuLnRleHRDb250ZW50ID0gXCJcdTI2QTAgXCIgKyBicm9rZW4uam9pbihcIiwgXCIpO1xuICAgICAgd2Fybi50aXRsZSA9IFwiQnJva2VuIGRlY2sgbGluayhzKSBcdTIwMTQgdGhlIHRhcmdldCBub3RlIGRvZXMgbm90IGV4aXN0XCI7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZCh3YXJuKTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQm90dG9tLXJpZ2h0OiBXWVNJV1lHIG1vZGUgdG9nZ2xlIChkZWNrIG5vdGVzIG9ubHkpIFx1MjUwMFx1MjUwMFxuICAgIGlmIChpc0NhcmQpIHtcbiAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICBidG4uY2xhc3NOYW1lID0gXCJuYXRpdmUtc2xpZGVzLXd5c2l3eWctYnRuXCIgKyAodGhpcy5zZXR0aW5ncy53eXNpd3lnTW9kZSA/IFwiIGlzLWFjdGl2ZVwiIDogXCJcIik7XG4gICAgICBidG4udGV4dENvbnRlbnQgPSB0aGlzLnNldHRpbmdzLnd5c2l3eWdNb2RlID8gXCJXWVNJV1lHOiBPblwiIDogXCJXWVNJV1lHOiBPZmZcIjtcbiAgICAgIGJ0bi50aXRsZSA9IFwiVG9nZ2xlIFdZU0lXWUcgbW9kZSBcdTIwMTQgdW5pZmllZCB0eXBvZ3JhcGh5IGJldHdlZW4gZWRpdCBhbmQgcmVhZGluZ1wiO1xuICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLnRvZ2dsZVd5c2l3eWcoKSk7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChidG4pO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBCb3R0b20tcmlnaHQ6IGF1dG8tY29tcHV0ZWQgcGFnZSBudW1iZXIgXHUyNTAwXHUyNTAwXG4gICAgaWYgKHRoaXMuc2V0dGluZ3Muc2hvd1BhZ2VOdW1iZXIgJiYgZGVjaykge1xuICAgICAgY29uc3QgcGFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgcGFnZS5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtcGFnZVwiO1xuICAgICAgLy8gY2hhaW5bMF0gaXMgdGhlIG92ZXJ2aWV3IG5vdGU7IHNsaWRlcyBzdGFydCBhdCBpbmRleCAxIFx1MjE5MiBcIlBhZ2UgMVwiXG4gICAgICBwYWdlLnRleHRDb250ZW50ID0gZGVjay5pbmRleCA9PT0gMCA/IFwiT3ZlcnZpZXdcIiA6IGBQYWdlICR7ZGVjay5pbmRleH1gO1xuICAgICAgdGhpcy5iYXIuYXBwZW5kQ2hpbGQocGFnZSk7XG4gICAgfVxuXG4gICAgLy8gSGlkZSB0aGUgYmFyIGVudGlyZWx5IHdoZW4gaXQgaGFzIG5vdGhpbmcgdG8gZGlzcGxheSAobm8gcHJvcGVydGllcyxcbiAgICAvLyBhbmQgbm90IHBhcnQgb2YgYSBkZWNrKVxuICAgIHRoaXMuYmFyLnN0eWxlLmRpc3BsYXkgPSB0aGlzLmJhci5jaGlsZEVsZW1lbnRDb3VudCA9PT0gMCA/IFwibm9uZVwiIDogXCJcIjtcbiAgfVxuXG4gIC8qKiBCdWlsZCBhIFx1MjVDMCAvIFx1MjVCNiBuYXZpZ2F0aW9uIGJ1dHRvbjsgYGRpc2FibGVkYCByZW5kZXJzIGl0IGxpZ2h0IGdyYXkvaW5hY3RpdmUgKi9cbiAgcHJpdmF0ZSBuYXZCdXR0b24oXG4gICAgbGFiZWw6IHN0cmluZyxcbiAgICB0aXA6IHN0cmluZyxcbiAgICBvbkNsaWNrOiAoKSA9PiB2b2lkLFxuICAgIGRpc2FibGVkID0gZmFsc2UsXG4gICk6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgIGJ0bi5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtbmF2LWJ0blwiO1xuICAgIGJ0bi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICAgIGJ0bi50aXRsZSA9IHRpcDtcbiAgICBidG4uZGlzYWJsZWQgPSBkaXNhYmxlZDtcbiAgICBpZiAoIWRpc2FibGVkKSBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uQ2xpY2spO1xuICAgIHJldHVybiBidG47XG4gIH1cblxuICAvKipcbiAgICogTWVhc3VyZSB0aGUgdG9wIHRhYiBiYXIgYW5kIGV4cG9zZSBpdHMgaGVpZ2h0IGFzIHRoZSBDU1MgdmFyaWFibGVcbiAgICogLS1uYXRpdmUtc2xpZGVzLXRhYmJhci1oZWlnaHQuIFRoZSBiYXIgaXMgaGlkZGVuIGluIFdZU0lXWUcgcmVhZGluZ1xuICAgKiB2aWV3LCBzbyB0aGUgbGFzdCBtZWFzdXJlZCB2YWx1ZSBpcyBjYWNoZWQgYW5kIHJldXNlZCB0aGVyZS5cbiAgICovXG4gIHByaXZhdGUgc3luY1RhYkJhckhlaWdodCgpOiB2b2lkIHtcbiAgICBjb25zdCB0YWJCYXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcbiAgICAgIFwiLndvcmtzcGFjZS10YWJzLm1vZC10b3AgLndvcmtzcGFjZS10YWItaGVhZGVyLWNvbnRhaW5lclwiLFxuICAgICk7XG4gICAgaWYgKHRhYkJhciAmJiB0YWJCYXIub2Zmc2V0SGVpZ2h0ID4gMCkgdGhpcy50YWJCYXJIZWlnaHQgPSB0YWJCYXIub2Zmc2V0SGVpZ2h0O1xuICAgIGlmICh0aGlzLnRhYkJhckhlaWdodCA+IDApIHtcbiAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eShcbiAgICAgICAgXCItLW5hdGl2ZS1zbGlkZXMtdGFiYmFyLWhlaWdodFwiLFxuICAgICAgICBgJHt0aGlzLnRhYkJhckhlaWdodH1weGAsXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBObyBtZWFzdXJlbWVudCB5ZXQgKHRhYiBiYXIgaGlkZGVuIHNpbmNlIGxvYWQpIFx1MjAxNCBsZXQgdGhlIENTU1xuICAgICAgLy8gZmFsbGJhY2sgdmFsdWUgYXBwbHkuXG4gICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUucmVtb3ZlUHJvcGVydHkoXCItLW5hdGl2ZS1zbGlkZXMtdGFiYmFyLWhlaWdodFwiKTtcbiAgICB9XG4gIH1cblxuICAvKiogU3luYyB0aGUgZnVsbHNjcmVlbiBzdGF0ZTogYWRkIHRoZSBjbGFzcyArIHJlcXVlc3QgT1MgZnVsbHNjcmVlbiwgb3IgcmVzdG9yZSAqL1xuICBwcml2YXRlIHN5bmNGdWxsc2NyZWVuKGFjdGl2ZTogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICh0aGlzLmZ1bGxzY3JlZW4gPT09IGFjdGl2ZSkgcmV0dXJuOyAvLyBub3RoaW5nIHRvIGRvXG4gICAgdGhpcy5mdWxsc2NyZWVuID0gYWN0aXZlO1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnRvZ2dsZShcIm5hdGl2ZS1zbGlkZXMtZnVsbHNjcmVlblwiLCBhY3RpdmUpO1xuXG4gICAgLy8gUmVxdWVzdCBPUy1sZXZlbCBmdWxsc2NyZWVuIHdoZW4gZW50ZXJpbmcgKE9ic2lkaWFuIHJ1bnMgb24gRWxlY3Ryb24gYW5kXG4gICAgLy8gc3VwcG9ydHMgdGhlIEZ1bGxzY3JlZW4gQVBJKTsgZmFpbHVyZXMgKGUuZy4gaW4gYSBwbGFpbiBicm93c2VyKSBhcmVcbiAgICAvLyBpZ25vcmVkIHNpbGVudGx5IFx1MjAxNCB0aGUgXCJoaWRlIHNpZGViYXJzXCIgZWZmZWN0IHN0aWxsIGFwcGxpZXMuXG4gICAgaWYgKGFjdGl2ZSkge1xuICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuPy4oKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgfSBlbHNlIGlmIChkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCkge1xuICAgICAgZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4/LigpLmNhdGNoKCgpID0+IHt9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlIHRoZSBXWVNJV1lHIG1vZGUgKHBlcnNpc3RlZDsgb25seSByZWFjaGFibGUgb24gZGVjayBub3RlcykuXG4gICAqIFRvZ2dsaW5nIGZyb20gcmVhZGluZyB2aWV3IGp1bXBzIGludG8gdGhlIFdZU0lXWUcgZWRpdCB2aWV3LCBzbyB0aGVcbiAgICogdW5pZmllZCB0eXBvZ3JhcGh5IGlzIGltbWVkaWF0ZWx5IHZpc2libGUgd2hlcmUgdGhlIHVzZXIgd29ya3MuXG4gICAqL1xuICBwcml2YXRlIHRvZ2dsZVd5c2l3eWcoKTogdm9pZCB7XG4gICAgdGhpcy5zZXR0aW5ncy53eXNpd3lnTW9kZSA9ICF0aGlzLnNldHRpbmdzLnd5c2l3eWdNb2RlO1xuICAgIHZvaWQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAodmlldyAmJiB2aWV3LmdldE1vZGUoKSA9PT0gXCJwcmV2aWV3XCIpIHtcbiAgICAgIC8vIExlYXZlIHJlYWRpbmcgdmlldyB2aWEgdGhlIHB1YmxpYyB2aWV3LXN0YXRlIEFQSSAoc2FtZSBhcyBFc2MpXG4gICAgICBjb25zdCBzdGF0ZSA9IHZpZXcubGVhZi5nZXRWaWV3U3RhdGUoKTtcbiAgICAgIHN0YXRlLnN0YXRlID0geyAuLi5zdGF0ZS5zdGF0ZSwgbW9kZTogXCJzb3VyY2VcIiB9O1xuICAgICAgdm9pZCB2aWV3LmxlYWYuc2V0Vmlld1N0YXRlKHN0YXRlLCB7IGZvY3VzOiBmYWxzZSB9KTtcbiAgICB9XG4gICAgdGhpcy5yZWZyZXNoKCk7XG4gIH1cblxuICAvKipcbiAgICogRHVtcCBrZXkgdHlwb2dyYXBoeSBjb21wdXRlZCBzdHlsZXMgKyBDU1MgdmFyaWFibGVzIHRvIHRoZSBjb25zb2xlLlxuICAgKiBSdW4gb25jZSBpbiBlZGl0IHZpZXcgYW5kIG9uY2UgaW4gcmVhZGluZyB2aWV3IChzYW1lIG5vdGUpLCB0aGVuIGNvbXBhcmVcbiAgICogdGhlIG51bWJlcnMgXHUyMDE0IHRoYXQgaXMgaG93IHRoZSBXWVNJV1lHIHR5cG9ncmFwaHkgYWxpZ25tZW50IENTUyBpcyB0dW5lZFxuICAgKiB3aXRob3V0IGV5ZWJhbGxpbmcgc2NyZWVuc2hvdHMuXG4gICAqL1xuICBwcml2YXRlIGRlYnVnU3R5bGVzKCk6IHZvaWQge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldykge1xuICAgICAgbmV3IE5vdGljZShcIk5hdGl2ZSBTbGlkZXM6IG5vIGFjdGl2ZSBNYXJrZG93biBub3RlXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBpc0VkaXQgPSB2aWV3LmdldE1vZGUoKSA9PT0gXCJzb3VyY2VcIjtcbiAgICBjb25zdCBjb250ZW50RWwgPSB2aWV3LmNvbnRlbnRFbDtcbiAgICBjb25zdCBwaWNrID0gKHNlbDogc3RyaW5nKTogSFRNTEVsZW1lbnQgfCBudWxsID0+IGNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihzZWwpO1xuICAgIGNvbnN0IHN0eWxlID0gKGVsOiBIVE1MRWxlbWVudCB8IG51bGwsIHByb3BzOiBzdHJpbmdbXSk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPT4ge1xuICAgICAgaWYgKCFlbCkgcmV0dXJuIHsgXCIobWlzc2luZylcIjogXCJlbGVtZW50IG5vdCBpbiB0aGlzIG5vdGVcIiB9O1xuICAgICAgY29uc3QgY3MgPSBnZXRDb21wdXRlZFN0eWxlKGVsKTtcbiAgICAgIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgICAgZm9yIChjb25zdCBwIG9mIHByb3BzKSB7XG4gICAgICAgIGNvbnN0IHYgPSBjcy5nZXRQcm9wZXJ0eVZhbHVlKHApLnRyaW0oKTtcbiAgICAgICAgaWYgKHYpIG91dFtwXSA9IHY7XG4gICAgICB9XG4gICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgY29uc3QgdmFycyA9IGdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSk7XG4gICAgY29uc3QgY3NzVmFyID0gKG5hbWU6IHN0cmluZyk6IHN0cmluZyA9PiB2YXJzLmdldFByb3BlcnR5VmFsdWUobmFtZSkudHJpbSgpO1xuXG4gICAgY29uc3QgY29udGFpbmVyID0gcGljayhcbiAgICAgIGlzRWRpdFxuICAgICAgICA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLmNtLWNvbnRlbnRcIlxuICAgICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3XCIsXG4gICAgKTtcbiAgICBjb25zdCBwYXJhID0gcGljayhcbiAgICAgIGlzRWRpdFxuICAgICAgICA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLmNtLWxpbmVcIlxuICAgICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IHBcIixcbiAgICApO1xuICAgIGNvbnN0IGgxID0gcGljayhcbiAgICAgIGlzRWRpdFxuICAgICAgICA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLmNtLWxpbmUgLmNtLWhlYWRlci0xXCJcbiAgICAgICAgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlldyBoMVwiLFxuICAgICk7XG4gICAgY29uc3QgbGlzdEl0ZW0gPSBwaWNrKFxuICAgICAgaXNFZGl0XG4gICAgICAgID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuSHlwZXJNRC1saXN0LWxpbmVcIlxuICAgICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IHVsID4gbGlcIixcbiAgICApO1xuICAgIGNvbnN0IHByZSA9IHBpY2soXG4gICAgICBpc0VkaXRcbiAgICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IHByZVwiXG4gICAgICAgIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgcHJlXCIsXG4gICAgKTtcbiAgICBjb25zdCBxdW90ZSA9IHBpY2soXG4gICAgICBpc0VkaXRcbiAgICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IGJsb2NrcXVvdGVcIlxuICAgICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IGJsb2NrcXVvdGVcIixcbiAgICApO1xuICAgIGNvbnN0IGlubGluZUNvZGUgPSBwaWNrKFxuICAgICAgaXNFZGl0XG4gICAgICAgID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiBjb2RlXCJcbiAgICAgICAgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlldyBjb2RlXCIsXG4gICAgKTtcblxuICAgIGNvbnN0IGR1bXAgPSB7XG4gICAgICBtb2RlOiBpc0VkaXQgPyBcImVkaXQgKExpdmUgUHJldmlldylcIiA6IFwicmVhZGluZ1wiLFxuICAgICAgY29udGFpbmVyOiBzdHlsZShjb250YWluZXIsIFtcbiAgICAgICAgXCJmb250LWZhbWlseVwiLFxuICAgICAgICBcImZvbnQtc2l6ZVwiLFxuICAgICAgICBcImxpbmUtaGVpZ2h0XCIsXG4gICAgICAgIFwibWF4LXdpZHRoXCIsXG4gICAgICAgIFwid2lkdGhcIixcbiAgICAgICAgXCJwYWRkaW5nLXRvcFwiLFxuICAgICAgICBcInBhZGRpbmctcmlnaHRcIixcbiAgICAgICAgXCJwYWRkaW5nLWJvdHRvbVwiLFxuICAgICAgICBcInBhZGRpbmctbGVmdFwiLFxuICAgICAgICBcImNvbG9yXCIsXG4gICAgICBdKSxcbiAgICAgIHBhcmFncmFwaDogc3R5bGUocGFyYSwgW1xuICAgICAgICBcImZvbnQtc2l6ZVwiLFxuICAgICAgICBcImxpbmUtaGVpZ2h0XCIsXG4gICAgICAgIFwibWFyZ2luLXRvcFwiLFxuICAgICAgICBcIm1hcmdpbi1ib3R0b21cIixcbiAgICAgICAgXCJtYXJnaW4tbGVmdFwiLFxuICAgICAgICBcIm1hcmdpbi1yaWdodFwiLFxuICAgICAgICBcInRleHQtaW5kZW50XCIsXG4gICAgICBdKSxcbiAgICAgIGgxOiBzdHlsZShoMSwgW1wiZm9udC1zaXplXCIsIFwibGluZS1oZWlnaHRcIiwgXCJmb250LXdlaWdodFwiLCBcIm1hcmdpbi10b3BcIiwgXCJtYXJnaW4tYm90dG9tXCJdKSxcbiAgICAgIGxpc3RJdGVtOiBzdHlsZShsaXN0SXRlbSwgW1xuICAgICAgICBcInBhZGRpbmctbGVmdFwiLFxuICAgICAgICBcIm1hcmdpbi1sZWZ0XCIsXG4gICAgICAgIFwibWFyZ2luLXJpZ2h0XCIsXG4gICAgICAgIFwidGV4dC1pbmRlbnRcIixcbiAgICAgICAgXCJsaW5lLWhlaWdodFwiLFxuICAgICAgXSksXG4gICAgICBjb2RlQmxvY2s6IHN0eWxlKHByZSwgW1xuICAgICAgICBcImZvbnQtc2l6ZVwiLFxuICAgICAgICBcImxpbmUtaGVpZ2h0XCIsXG4gICAgICAgIFwicGFkZGluZy10b3BcIixcbiAgICAgICAgXCJwYWRkaW5nLXJpZ2h0XCIsXG4gICAgICAgIFwicGFkZGluZy1ib3R0b21cIixcbiAgICAgICAgXCJwYWRkaW5nLWxlZnRcIixcbiAgICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCIsXG4gICAgICAgIFwiYm9yZGVyLXJhZGl1c1wiLFxuICAgICAgXSksXG4gICAgICBibG9ja3F1b3RlOiBzdHlsZShxdW90ZSwgW1xuICAgICAgICBcInBhZGRpbmctdG9wXCIsXG4gICAgICAgIFwicGFkZGluZy1yaWdodFwiLFxuICAgICAgICBcInBhZGRpbmctYm90dG9tXCIsXG4gICAgICAgIFwicGFkZGluZy1sZWZ0XCIsXG4gICAgICAgIFwibWFyZ2luLXRvcFwiLFxuICAgICAgICBcIm1hcmdpbi1ib3R0b21cIixcbiAgICAgICAgXCJib3JkZXItbGVmdC13aWR0aFwiLFxuICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIixcbiAgICAgIF0pLFxuICAgICAgaW5saW5lQ29kZTogc3R5bGUoaW5saW5lQ29kZSwgW1xuICAgICAgICBcImZvbnQtc2l6ZVwiLFxuICAgICAgICBcInBhZGRpbmctdG9wXCIsXG4gICAgICAgIFwicGFkZGluZy1ib3R0b21cIixcbiAgICAgICAgXCJwYWRkaW5nLWxlZnRcIixcbiAgICAgICAgXCJwYWRkaW5nLXJpZ2h0XCIsXG4gICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiLFxuICAgICAgICBcImJvcmRlci1yYWRpdXNcIixcbiAgICAgIF0pLFxuICAgICAgY3NzVmFyaWFibGVzOiB7XG4gICAgICAgIFwiLS1mb250LXRleHRcIjogY3NzVmFyKFwiLS1mb250LXRleHRcIiksXG4gICAgICAgIFwiLS1saW5lLWhlaWdodC1ub3JtYWxcIjogY3NzVmFyKFwiLS1saW5lLWhlaWdodC1ub3JtYWxcIiksXG4gICAgICAgIFwiLS1oMS1zaXplXCI6IGNzc1ZhcihcIi0taDEtc2l6ZVwiKSxcbiAgICAgICAgXCItLWgxLWxpbmUtaGVpZ2h0XCI6IGNzc1ZhcihcIi0taDEtbGluZS1oZWlnaHRcIiksXG4gICAgICAgIFwiLS1oMS1tYXJnaW4tdG9wXCI6IGNzc1ZhcihcIi0taDEtbWFyZ2luLXRvcFwiKSxcbiAgICAgICAgXCItLWgxLW1hcmdpbi1ib3R0b21cIjogY3NzVmFyKFwiLS1oMS1tYXJnaW4tYm90dG9tXCIpLFxuICAgICAgICBcIi0tcC1zcGFjaW5nXCI6IGNzc1ZhcihcIi0tcC1zcGFjaW5nXCIpLFxuICAgICAgICBcIi0tbGlzdC1zcGFjaW5nXCI6IGNzc1ZhcihcIi0tbGlzdC1zcGFjaW5nXCIpLFxuICAgICAgICBcIi0tbGlzdC1pbmRlbnRcIjogY3NzVmFyKFwiLS1saXN0LWluZGVudFwiKSxcbiAgICAgICAgXCItLWNvZGUtc2l6ZVwiOiBjc3NWYXIoXCItLWNvZGUtc2l6ZVwiKSxcbiAgICAgICAgXCItLWNvZGUtcGFkZGluZ1wiOiBjc3NWYXIoXCItLWNvZGUtcGFkZGluZ1wiKSxcbiAgICAgICAgXCItLWNvZGUtcmFkaXVzXCI6IGNzc1ZhcihcIi0tY29kZS1yYWRpdXNcIiksXG4gICAgICAgIFwiLS1ibG9ja3F1b3RlLXBhZGRpbmdcIjogY3NzVmFyKFwiLS1ibG9ja3F1b3RlLXBhZGRpbmdcIiksXG4gICAgICAgIFwiLS1ibG9ja3F1b3RlLWJvcmRlci10aGlja25lc3NcIjogY3NzVmFyKFwiLS1ibG9ja3F1b3RlLWJvcmRlci10aGlja25lc3NcIiksXG4gICAgICAgIFwiLS1maWxlLW1hcmdpbnNcIjogY3NzVmFyKFwiLS1maWxlLW1hcmdpbnNcIiksXG4gICAgICAgIFwiLS1maWxlLWxpbmUtd2lkdGhcIjogY3NzVmFyKFwiLS1maWxlLWxpbmUtd2lkdGhcIiksXG4gICAgICAgIFwiLS1ub3JtYWwtZm9udC1zaXplXCI6IGNzc1ZhcihcIi0tbm9ybWFsLWZvbnQtc2l6ZVwiKSxcbiAgICAgICAgXCItLWZvbnQtdGV4dC1zaXplXCI6IGNzc1ZhcihcIi0tZm9udC10ZXh0LXNpemVcIiksXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc29sZS5sb2coXG4gICAgICBcIltuYXRpdmUtc2xpZGVzIGRlYnVnLXN0eWxlc10gXCIgK1xuICAgICAgICAoaXNFZGl0ID8gXCJFRElUXCIgOiBcIlJFQURJTkdcIikgK1xuICAgICAgICBcIlxcblwiICtcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoZHVtcCwgbnVsbCwgMiksXG4gICAgKTtcbiAgICBuZXcgTm90aWNlKFxuICAgICAgXCJUeXBvZ3JhcGh5IGR1bXAgXHUyMTkyIENvbnNvbGUgKENtZCtPcHQrSSkuIFJ1biBhZ2FpbiBpbiB0aGUgb3RoZXIgdmlldzsgZm9yIGNvZGUvcXVvdGUgZGF0YSwgcnVuIG9uIGEgbm90ZSBjb250YWluaW5nIHRoZW0uXCIsXG4gICAgKTtcbiAgfVxufVxuXG4vLyBcdTI1MDBcdTI1MDAgU2V0dGluZ3MgdGFiIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5jbGFzcyBOYXRpdmVTbGlkZXNTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBOYXRpdmVTbGlkZXNQbHVnaW4pIHtcbiAgICBzdXBlcihwbHVnaW4uYXBwLCBwbHVnaW4pO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiUHJvcGVydGllcyBCYXIgXHUwMEI3IFNldHRpbmdzXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBQcmV2aW91cy9OZXh0IGJ1dHRvbnNcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIlNob3cgXHUyNUMwIFx1MjVCNiBidXR0b25zIG9uIHRoZSBsZWZ0IG9mIHRoZSBiYXIgd2hlbiB0aGUgbm90ZSBiZWxvbmdzIHRvIGEgZGVjayAoaGFzIGEgYGRlY2tgIHByb3BlcnR5KVwiLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd05hdkJ1dHRvbnMpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dOYXZCdXR0b25zID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBwYWdlIG51bWJlclwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiQXV0by1jb21wdXRlZCBmcm9tIHRoZSBkZWNrIGNoYWluIChvdmVydmlldyBwYWdlIHNob3dzIFx1MjAxQ092ZXJ2aWV3XHUyMDFEKTsgc2hvd24gYXQgdGhlIGJvdHRvbS1yaWdodFwiLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1BhZ2VOdW1iZXIpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dQYWdlTnVtYmVyID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiQXV0byBmdWxsc2NyZWVuIGluIHJlYWRpbmcgdmlld1wiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiRW50ZXIgdGhlIGltbWVyc2l2ZSBmdWxsc2NyZWVuIHJlYWRpbmcgbW9kZSBhdXRvbWF0aWNhbGx5IHdoZW4gc3dpdGNoaW5nIHRvIHJlYWRpbmcgdmlldyAoYWxzbyB0b2dnbGVhYmxlIHZpYSB0aGUgUGF1c2UvUmVzdW1lIEF1dG8gRnVsbHNjcmVlbiBjb21tYW5kKVwiLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b0Z1bGxzY3JlZW4pLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9GdWxsc2NyZWVuID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiV1lTSVdZRyBtb2RlIChkZWNrIG5vdGVzKVwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiSW1tZXJzaXZlIGRlY2sgbW9kZTogaGlkZXMgdGhlIHRhYiBiYXIgYW5kIHNpZGViYXJzLCBzaG93cyB0aGUgYm90dG9tIGJhciBhdCB0YWItYmFyIGhlaWdodCBpbiBib3RoIHZpZXdzLCBhbmQgaGlkZXMgaW4tbm90ZSBwcm9wZXJ0aWVzIHdoaWxlIGVkaXRpbmcuIFRvZ2dsZSBmcm9tIHRoZSBjb21tYW5kIHBhbGV0dGUsIHRoZSBNb2QrU2hpZnQrRSBob3RrZXksIG9yIHRoZSBib3R0b20tYmFyIGJ1dHRvbi5cIixcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnd5c2l3eWdNb2RlKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy53eXNpd3lnTW9kZSA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMucGx1Z2luLnJlZnJlc2goKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk5hdmlnYXRpb24gaG90a2V5c1wiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiRGVmYXVsdDogUHJldmlvdXMgUGFnZSBNb2QrU2hpZnQrXHUyMTkwLCBOZXh0IFBhZ2UgTW9kK1NoaWZ0K1x1MjE5Mi4gUmViaW5kIHVuZGVyIFNldHRpbmdzIFx1MjE5MiBIb3RrZXlzLlwiLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIk9wZW4gSG90a2V5cyBTZXR0aW5nc1wiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICAvLyBPcGVuIE9ic2lkaWFuJ3MgaG90a2V5cyBzZXR0aW5ncyBwYWdlIChpbnRlcm5hbCBBUEk7IGlnbm9yZSBmYWlsdXJlcylcbiAgICAgICAgICAoXG4gICAgICAgICAgICB0aGlzLmFwcCBhcyB1bmtub3duIGFzIHsgc2V0dGluZz86IHsgb3BlblRhYkJ5SWQ/OiAoaWQ6IHN0cmluZykgPT4gdm9pZCB9IH1cbiAgICAgICAgICApLnNldHRpbmc/Lm9wZW5UYWJCeUlkPy4oXCJob3RrZXlzXCIpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cbn1cblxuLy8gXHUyNTAwXHUyNTAwIEhlbHBlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbi8qKiBSZW1vdmUgYWxsIGNoaWxkcmVuIG9mIGFuIGVsZW1lbnQgKi9cbmZ1bmN0aW9uIGNsZWFyQ2hpbGRyZW4oZWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIHdoaWxlIChlbC5maXJzdENoaWxkKSBlbC5yZW1vdmVDaGlsZChlbC5maXJzdENoaWxkKTtcbn1cbiIsICIvKipcbiAqIGRlY2sudHMgXHUyMDE0IFB1cmUgZGVjay1yZXNvbHV0aW9uIGNvcmUgZm9yIG5hdGl2ZS1zbGlkZXMuXG4gKlxuICogRXZlcnl0aGluZyBpbiB0aGlzIG1vZHVsZSBpcyBmcmVlIG9mIE9ic2lkaWFuIHJ1bnRpbWUgZGVwZW5kZW5jaWVzIHNvIGl0IGNhblxuICogYmUgdW5pdCB0ZXN0ZWQgZGlyZWN0bHkgKHNlZSB0ZXN0L2RlY2sudGVzdC50cykuIG1haW4udHMgYWRhcHRzIHRoZSB2YXVsdFxuICogKG1ldGFkYXRhQ2FjaGUpIHRvIHRoaXMgcHVyZSBpbnRlcmZhY2U6IGl0IHJlc29sdmVzIGBkZWNrYCBwcm9wZXJ0aWVzIHRvXG4gKiBub3RlIHBhdGhzLCB0aGVuIGhhbmRzIHRoZSBwYXRoIGdyYXBoIHRvIGNvbXB1dGVEZWNrKCkuXG4gKi9cblxuLyoqIEEgZGVjayBsaW5rIGxpc3QgbmV2ZXIgaG9sZHMgbW9yZSB0aGFuIHR3byBlbnRyaWVzICovXG5leHBvcnQgY29uc3QgTUFYX0RFQ0tfTElOS1MgPSAyO1xuXG4vKiogUmVzdWx0IG9mIHJlc29sdmluZyBhIG5vdGUncyBwb3NpdGlvbiBpbnNpZGUgYSBkZWNrICovXG5leHBvcnQgaW50ZXJmYWNlIERlY2tJbmZvIHtcbiAgLyoqIENoYWluIG9mIG5vdGUgcGF0aHM6IFswXSBpcyB0aGUgb3ZlcnZpZXcgbm90ZSwgdGhlbiBzbGlkZXMgaW4gb3JkZXIgKi9cbiAgY2hhaW46IHN0cmluZ1tdO1xuICAvKiogSW5kZXggb2YgdGhlIGN1cnJlbnQgbm90ZSBpbnNpZGUgY2hhaW4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBSZXNvbHZlIGEgbm90ZSdzIHBvc2l0aW9uIGluc2lkZSBpdHMgZGVjayBieSB3YWxraW5nIHRoZSBsaW5rIGNoYWluLlxuICpcbiAqIENvbnZlbnRpb24gZm9yIHRoZSBzaW5nbGUgYGRlY2tgIHByb3BlcnR5ICh1cCB0byB0d28gbGlua3MpOlxuICogICAtIG92ZXJ2aWV3IG5vdGU6IG9uZSBsaW5rIFx1MjE5MiB0aGF0IGxpbmsgSVMgdGhlIGZpcnN0IHBhZ2U7XG4gKiAgIC0gc2xpZGUgbm90ZTogICAgZmlyc3QgbGluayBcdTIxOTIgdGhlIG92ZXJ2aWV3IHBhZ2UsIHNlY29uZCBsaW5rIFx1MjE5MiBuZXh0IHNsaWRlXG4gKiAgICAgICAgICAgICAgICAgICAgKG5vIHNlY29uZCBsaW5rIG9uIHRoZSBsYXN0IHNsaWRlKS5cbiAqXG4gKiBgZ2V0TGlua3MocGF0aClgIG11c3QgcmV0dXJuIHRoZSByZXNvbHZlZCBub3RlIHBhdGhzIG9mIHRoZSBgZGVja2AgcHJvcGVydHlcbiAqIG9mIHRoZSBub3RlIGF0IGBwYXRoYCAoZW1wdHkgd2hlbiB0aGUgbm90ZSBoYXMgbm9uZSwgb3IgaXRzIGxpbmtzIGFyZVxuICogYnJva2VuIFx1MjAxNCBhIGJyb2tlbiBsaW5rIHNpbXBseSBlbmRzIG9yIGV4Y2x1ZGVzIHRoZSBjaGFpbiwgbmV2ZXIgY3Jhc2hlcykuXG4gKlxuICogUmV0dXJucyB0aGUgZnVsbCBjaGFpbiAoW292ZXJ2aWV3LCBzbGlkZSAxLCBzbGlkZSAyLCBcdTIwMjZdKSBhbmQgdGhlIGN1cnJlbnRcbiAqIG5vdGUncyBpbmRleCwgb3IgbnVsbCB3aGVuIHRoZSBub3RlIGlzIG5vdCBwYXJ0IG9mIGFueSBkZWNrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZURlY2soXG4gIGN1cnJlbnRQYXRoOiBzdHJpbmcsXG4gIGdldExpbmtzOiAocGF0aDogc3RyaW5nKSA9PiBzdHJpbmdbXSxcbik6IERlY2tJbmZvIHwgbnVsbCB7XG4gIGNvbnN0IGN1cnJlbnRMaW5rcyA9IGdldExpbmtzKGN1cnJlbnRQYXRoKTtcbiAgaWYgKGN1cnJlbnRMaW5rcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuXG4gIGxldCBvdmVydmlldzogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBsZXQgZmlyc3RQYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbiAgaWYgKGN1cnJlbnRMaW5rcy5sZW5ndGggPj0gMikge1xuICAgIC8vIEEgc2xpZGU6IGZpcnN0IGxpbmsgaXMgdGhlIG92ZXJ2aWV3IHBhZ2VcbiAgICBvdmVydmlldyA9IGN1cnJlbnRMaW5rc1swXTtcbiAgICBmaXJzdFBhZ2UgPSBnZXRMaW5rcyhvdmVydmlldylbMF07XG4gIH0gZWxzZSB7XG4gICAgLy8gQSBzaW5nbGUgbGluazogZWl0aGVyIHdlIEFSRSB0aGUgb3ZlcnZpZXcgKGxpbmsgPSBmaXJzdCBwYWdlKSxcbiAgICAvLyBvciB3ZSBhcmUgdGhlIGxhc3Qgc2xpZGUgKGxpbmsgPSBvdmVydmlldyBwYWdlKVxuICAgIGNvbnN0IG9ubHkgPSBjdXJyZW50TGlua3NbMF07XG4gICAgY29uc3Qgb25seUxpbmtzID0gZ2V0TGlua3Mob25seSk7XG4gICAgaWYgKG9ubHlMaW5rc1swXSA9PT0gY3VycmVudFBhdGgpIHtcbiAgICAgIG92ZXJ2aWV3ID0gY3VycmVudFBhdGg7XG4gICAgICBmaXJzdFBhZ2UgPSBvbmx5O1xuICAgIH0gZWxzZSB7XG4gICAgICBvdmVydmlldyA9IG9ubHk7XG4gICAgICBmaXJzdFBhZ2UgPSBvbmx5TGlua3NbMF07XG4gICAgfVxuICB9XG4gIGlmICghb3ZlcnZpZXcgfHwgIWZpcnN0UGFnZSkgcmV0dXJuIG51bGw7XG5cbiAgLy8gV2FsayB0aGUgY2hhaW46IG92ZXJ2aWV3IFx1MjE5MiBmaXJzdCBwYWdlIFx1MjE5MiBuZXh0IFx1MjE5MiBuZXh0IFx1MjE5MiBcdTIwMjZcbiAgY29uc3QgY2hhaW46IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHZpc2l0ZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgcHVzaCA9IChwOiBzdHJpbmcgfCB1bmRlZmluZWQpOiB2b2lkID0+IHtcbiAgICBpZiAocCAmJiAhdmlzaXRlZC5oYXMocCkpIHtcbiAgICAgIHZpc2l0ZWQuYWRkKHApO1xuICAgICAgY2hhaW4ucHVzaChwKTtcbiAgICB9XG4gIH07XG4gIHB1c2gob3ZlcnZpZXcpO1xuICBwdXNoKGZpcnN0UGFnZSk7XG4gIGxldCBjdXIgPSBmaXJzdFBhZ2U7XG4gIHdoaWxlIChjdXIpIHtcbiAgICBjb25zdCBuZXh0ID0gZ2V0TGlua3MoY3VyKVsxXTtcbiAgICBpZiAoIW5leHQgfHwgdmlzaXRlZC5oYXMobmV4dCkpIGJyZWFrOyAvLyBlbmQgb2YgZGVjayBvciBjeWNsZSBndWFyZFxuICAgIHB1c2gobmV4dCk7XG4gICAgY3VyID0gbmV4dDtcbiAgfVxuXG4gIGNvbnN0IGluZGV4ID0gY2hhaW4uaW5kZXhPZihjdXJyZW50UGF0aCk7XG4gIGlmIChpbmRleCA9PT0gLTEpIHJldHVybiBudWxsO1xuICByZXR1cm4geyBjaGFpbiwgaW5kZXggfTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHVwIHRvIGBtYXhgIG5vdGUgbmFtZXMgZnJvbSBhIGBkZWNrYCBwcm9wZXJ0eSB2YWx1ZS5cbiAqIEFjY2VwdHMgYSBzaW5nbGUgc3RyaW5nIG9yIGEgWUFNTCBsaXN0IG9mIHN0cmluZ3M7IHVucXVvdGVkIFtbeF1dIHZhbHVlcyBhcmVcbiAqIHBhcnNlZCBieSBZQU1MIGFzIG5lc3RlZCBhcnJheXMgYW5kIGZsYXR0ZW5lZCBoZXJlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdExpbmtzKHZhbHVlOiB1bmtub3duLCBtYXg6IG51bWJlciA9IE1BWF9ERUNLX0xJTktTKTogc3RyaW5nW10ge1xuICBjb25zdCBmbGF0OiB1bmtub3duW10gPSBbXTtcbiAgY29uc3QgY29sbGVjdCA9ICh2OiB1bmtub3duKTogdm9pZCA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB2KSBjb2xsZWN0KGl0ZW0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBmbGF0LnB1c2godik7XG4gICAgfVxuICB9O1xuICBjb2xsZWN0KHZhbHVlKTtcblxuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIGZvciAoY29uc3QgaXRlbSBvZiBmbGF0KSB7XG4gICAgY29uc3QgbmFtZSA9IGV4dHJhY3RMaW5rVGV4dChpdGVtKTtcbiAgICBpZiAobmFtZSkgb3V0LnB1c2gobmFtZSk7XG4gICAgaWYgKG91dC5sZW5ndGggPj0gbWF4KSBicmVhaztcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdXAgdG8gYG1heGAgcmF3IGxpbmsgc3RyaW5ncyBmcm9tIGEgYGRlY2tgIHByb3BlcnR5IHZhbHVlIFx1MjAxNCB0aGVcbiAqIHRyaW1tZWQgdmFsdWVzIGV4YWN0bHkgYXMgd3JpdHRlbiAoYWxpYXMgLyBwYXRoIGZvcm1zIHByZXNlcnZlZCkuIFNhbWVcbiAqIGZsYXR0ZW5pbmcgcnVsZXMgYXMgZXh0cmFjdExpbmtzKCksIGJ1dCB3aXRob3V0IGV4dHJhY3RpbmcgdGhlIHRhcmdldCBuYW1lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFJhd0xpbmtzKHZhbHVlOiB1bmtub3duLCBtYXg6IG51bWJlciA9IE1BWF9ERUNLX0xJTktTKTogc3RyaW5nW10ge1xuICBjb25zdCBmbGF0OiB1bmtub3duW10gPSBbXTtcbiAgY29uc3QgY29sbGVjdCA9ICh2OiB1bmtub3duKTogdm9pZCA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB2KSBjb2xsZWN0KGl0ZW0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBmbGF0LnB1c2godik7XG4gICAgfVxuICB9O1xuICBjb2xsZWN0KHZhbHVlKTtcblxuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIGZvciAoY29uc3QgaXRlbSBvZiBmbGF0KSB7XG4gICAgaWYgKHR5cGVvZiBpdGVtICE9PSBcInN0cmluZ1wiKSBjb250aW51ZTtcbiAgICBjb25zdCB0cmltbWVkID0gaXRlbS50cmltKCk7XG4gICAgaWYgKCF0cmltbWVkKSBjb250aW51ZTtcbiAgICBvdXQucHVzaCh0cmltbWVkKTtcbiAgICBpZiAob3V0Lmxlbmd0aCA+PSBtYXgpIGJyZWFrO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgdGFyZ2V0IG5vdGUgbmFtZSBmcm9tIGEgbWFya2Rvd24gbGluayBzdHJpbmcuXG4gKiBIYW5kbGVzIHNldmVyYWwgc2hhcGVzOlxuICogICBcIltbc2xpZGUtMl1dXCIgICAgICAgIFx1MjE5MiBzbGlkZS0yXG4gKiAgIFwiW1tzbGlkZS0yfGFsaWFzXV1cIiAgXHUyMTkyIHNsaWRlLTJcbiAqICAgXCJbW3NsaWRlLTIjc2VjdGlvbl1dXCJcdTIxOTIgc2xpZGUtMlxuICogICBzbGlkZS0yICAgICAgICAgICAgICBcdTIxOTIgc2xpZGUtMiAoYmFyZSBmaWxlbmFtZSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RMaW5rVGV4dCh2YWx1ZTogdW5rbm93bik6IHN0cmluZyB8IG51bGwge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgdHJpbW1lZCA9IHZhbHVlLnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHRyaW1tZWQucmVwbGFjZSgvXlxcW1xcWy8sIFwiXCIpLnJlcGxhY2UoL1xcXVxcXSQvLCBcIlwiKS5zcGxpdChcInxcIilbMF0uc3BsaXQoXCIjXCIpWzBdLnRyaW0oKTtcbn1cblxuLyoqIFJlbmRlciBhIHByb3BlcnR5IHZhbHVlIGFzIHJlYWRhYmxlIHRleHQ6IGFycmF5cy9vYmplY3RzIFx1MjE5MiBKU09OLCBlbHNlIFN0cmluZyAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFZhbHVlKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybiBcIlx1MjAxNFwiO1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSk7XG59XG4iLCAiLyoqXG4gKiBjcmVhdGVOZXh0LnRzIFx1MjAxNCBQdXJlIFwiQ3JlYXRlIE5leHQgU2xpZGVcIiBwbGFubmluZyBjb3JlIGZvciBuYXRpdmUtc2xpZGVzLlxuICpcbiAqIEV2ZXJ5dGhpbmcgaW4gdGhpcyBtb2R1bGUgaXMgZnJlZSBvZiBPYnNpZGlhbiBydW50aW1lIGRlcGVuZGVuY2llcyBzbyBpdCBjYW5cbiAqIGJlIHVuaXQgdGVzdGVkIGRpcmVjdGx5IChzZWUgdGVzdC9jcmVhdGVOZXh0LnRlc3QudHMpLiBtYWluLnRzIGFkYXB0cyB0aGVcbiAqIHZhdWx0IChtZXRhZGF0YUNhY2hlLCBjb21wdXRlRGVjaykgdG8gdGhpcyBwdXJlIGludGVyZmFjZSBhbmQgYXBwbGllcyB0aGVcbiAqIHJlc3VsdGluZyBwbGFuIHdpdGggdmF1bHQuY3JlYXRlKCkgKyBmaWxlTWFuYWdlci5wcm9jZXNzRnJvbnRNYXR0ZXIoKS5cbiAqXG4gKiBUaGUgcGxhbiBkZWNpZGVzLCBmb3IgdGhlIGN1cnJlbnQgbm90ZTpcbiAqICAgLSB0aGUgbmFtZSBvZiB0aGUgbmV3IHNsaWRlIGZpbGUgKGNvbGxpc2lvbi1hd2FyZSksXG4gKiAgIC0gdGhlIHJhdyBgZGVja2AgbGluayB0ZXh0cyBvZiB0aGUgbmV3IG5vdGUsXG4gKiAgIC0gdGhlIHJld3JpdGVzIG5lZWRlZCBvbiBleGlzdGluZyBub3RlcyAoaW4gcHJhY3RpY2UgYWx3YXlzIHRoZSBjdXJyZW50XG4gKiAgICAgbm90ZSBpdHNlbGYpLlxuICovXG5cbmltcG9ydCB7IGV4dHJhY3RMaW5rVGV4dCB9IGZyb20gXCIuL2RlY2tcIjtcblxuLyoqIElucHV0cyBmb3IgcGxhbm5pbmcgXHUyMDE0IHJlc29sdmVkIGJ5IHRoZSBhZGFwdGVyIGluIG1haW4udHMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlTmV4dElucHV0IHtcbiAgLyoqIEJhc2VuYW1lICh3aXRob3V0IGV4dGVuc2lvbikgb2YgdGhlIGN1cnJlbnQgbm90ZSAqL1xuICBjdXJyZW50TmFtZTogc3RyaW5nO1xuICAvKiogUmF3IGBkZWNrYCBsaW5rIHRleHRzIG9mIHRoZSBjdXJyZW50IG5vdGUgKGV4dHJhY3RlZCwgdXAgdG8gdHdvKSAqL1xuICBjdXJyZW50TGlua3M6IHN0cmluZ1tdO1xuICAvKiogVHJ1ZSB3aGVuIHRoZSBjdXJyZW50IG5vdGUgSVMgdGhlIGRlY2sncyBvdmVydmlldyBwYWdlIChjaGFpbiBpbmRleCAwKSAqL1xuICBpc092ZXJ2aWV3OiBib29sZWFuO1xuICAvKipcbiAgICogUmF3IGxpbmsgdGV4dCB0aGUgb2xkIGZpcnN0IHBhZ2UgdXNlcyB0byBsaW5rIGJhY2sgdG8gdGhlIG92ZXJ2aWV3LlxuICAgKiBPbmx5IG1lYW5pbmdmdWwgZm9yIG92ZXJ2aWV3IGluc2VydGlvbiAodGhlIG92ZXJ2aWV3IGl0c2VsZiBvbmx5IGxpbmtzXG4gICAqIGZvcndhcmQsIHNvIGl0cyBvd24gZnJvbnRtYXR0ZXIgY29udGFpbnMgbm8gc2VsZi1yZWZlcmVuY2UpLlxuICAgKi9cbiAgb3ZlcnZpZXdCYWNrTGluaz86IHN0cmluZztcbiAgLyoqIEJhc2VuYW1lcyBvZiBldmVyeSBtYXJrZG93biBub3RlIGluIHRoZSB2YXVsdCAoY29sbGlzaW9uLWZyZWUgbmFtaW5nKSAqL1xuICBleGlzdGluZ05hbWVzOiBTZXQ8c3RyaW5nPjtcbn1cblxuLyoqIE9uZSBub3RlIHdob3NlIGBkZWNrYCBwcm9wZXJ0eSBtdXN0IGJlIHJld3JpdHRlbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWNrUmV3cml0ZSB7XG4gIC8qKiBCYXNlbmFtZSBvZiB0aGUgbm90ZSB0byByZXdyaXRlICovXG4gIG5hbWU6IHN0cmluZztcbiAgLyoqIFRoZSBuZXcgcmF3IGBkZWNrYCBsaW5rIHRleHRzIChzZXJpYWxpemVkIGFzIGEgWUFNTCBsaXN0KSAqL1xuICBkZWNrOiBzdHJpbmdbXTtcbn1cblxuLyoqIFRoZSBmdWxsIHBsYW4gZm9yIGNyZWF0aW5nIG9uZSBuZXcgc2xpZGUgKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlTmV4dFJlc3VsdCB7XG4gIC8qKiBCYXNlbmFtZSAod2l0aG91dCBleHRlbnNpb24pIG9mIHRoZSBuZXcgc2xpZGUgZmlsZSAqL1xuICBuZXdOYW1lOiBzdHJpbmc7XG4gIC8qKiBSYXcgYGRlY2tgIGxpbmsgdGV4dHMgZm9yIHRoZSBuZXcgbm90ZSdzIGZyb250bWF0dGVyICovXG4gIG5ld0RlY2tMaW5rczogc3RyaW5nW107XG4gIC8qKiBSZXdyaXRlcyB0byBhcHBseSB0byBleGlzdGluZyBub3RlcyAoaW4gcHJhY3RpY2UgYWx3YXlzIHRoZSBjdXJyZW50IG5vdGUpICovXG4gIHJld3JpdGVzOiBEZWNrUmV3cml0ZVtdO1xufVxuXG4vKipcbiAqIFBsYW4gdGhlIGNyZWF0aW9uIG9mIGEgbmV3IHNsaWRlIGFmdGVyIHRoZSBjdXJyZW50IG5vdGUuXG4gKlxuICogQmVoYXZpb3JzOlxuICogICAtIExhc3Qgc2xpZGUgKG5vIHNlY29uZCBsaW5rKTogYXBwZW5kIGA8Y3VycmVudD4tbmV4dGAgYXMgdGhlIG5ldyBsYXN0XG4gKiAgICAgc2xpZGU7IHRoZSBjdXJyZW50IG5vdGUgZ2FpbnMgdGhlIHNlY29uZCBsaW5rLlxuICogICAtIFNsaWRlIHdpdGggYSB2YWxpZCBuZXh0OiBpbnNlcnQgYDxjdXJyZW50Pi1uZXh0YCBiZXR3ZWVuIHRoZW07IHRoZSBuZXdcbiAqICAgICBub3RlIHRha2VzIG92ZXIgdGhlIG9sZCBuZXh0IGxpbmsuXG4gKiAgIC0gU2xpZGUgd2hvc2Ugc2Vjb25kIGxpbmsgaXMgYnJva2VuIChwbGFpbiwgbm9uLWV4aXN0aW5nIG5hbWUpOiBjcmVhdGVcbiAqICAgICBleGFjdGx5IHRoZSBkZWNsYXJlZCBtaXNzaW5nIG5vdGUgYXMgdGhlIG5ldyBsYXN0IHNsaWRlIFx1MjAxNCB0aGUgXHUyNkEwIHdhcm5pbmdcbiAqICAgICBkaXNhcHBlYXJzIGFuZCB0aGUgYXV0aG9yJ3MgaW50ZW50IGlzIGhvbm91cmVkLiBBIGJyb2tlbiBsaW5rIHRoYXQgaXNcbiAqICAgICBub3QgYSBwbGFpbiBiYXNlbmFtZSAocGF0aC1xdWFsaWZpZWQsIHNlbGYtcmVmZXJlbmNpbmcpIGlzIHRyZWF0ZWQgYXNcbiAqICAgICBpbnZhbGlkIGFuZCBkcm9wcGVkIChhcHBlbmQgYSBgPGN1cnJlbnQ+LW5leHRgIGxhc3Qgc2xpZGUgaW5zdGVhZCkuXG4gKiAgIC0gT3ZlcnZpZXcgcGFnZSAoc2luZ2xlIGxpbmsgPSBmaXJzdCBwYWdlKTogaW5zZXJ0IGEgbmV3IGZpcnN0IHBhZ2U7IHRoZVxuICogICAgIG92ZXJ2aWV3J3MgbGluayBwb2ludHMgdG8gaXQgYW5kIHRoZSBvbGQgZmlyc3QgcGFnZSBpcyBwdXNoZWQgYmFjay5cbiAqXG4gKiBSZXR1cm5zIG51bGwgd2hlbiB0aGUgbm90ZSBoYXMgbm8gdXNhYmxlIGBkZWNrYCBsaW5rcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBsYW5DcmVhdGVOZXh0KGlucHV0OiBDcmVhdGVOZXh0SW5wdXQpOiBDcmVhdGVOZXh0UmVzdWx0IHwgbnVsbCB7XG4gIGNvbnN0IHsgY3VycmVudE5hbWUsIGN1cnJlbnRMaW5rcywgaXNPdmVydmlldyB9ID0gaW5wdXQ7XG4gIGlmIChjdXJyZW50TGlua3MubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICAvLyBcdTI1MDBcdTI1MDAgT3ZlcnZpZXcgcGFnZTogaW5zZXJ0IGEgbmV3IGZpcnN0IHBhZ2UgYWZ0ZXIgaXQgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGlmIChpc092ZXJ2aWV3KSB7XG4gICAgY29uc3Qgb2xkRmlyc3QgPSBjdXJyZW50TGlua3NbMF07XG4gICAgaWYgKCFvbGRGaXJzdCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgbmV3TmFtZSA9IHVuaXF1ZU5hbWUoYCR7Y3VycmVudE5hbWV9LW5leHRgLCBpbnB1dC5leGlzdGluZ05hbWVzKTtcbiAgICBjb25zdCBiYWNrID0gaW5wdXQub3ZlcnZpZXdCYWNrTGluayA/PyBgW1ske2N1cnJlbnROYW1lfV1dYDtcbiAgICByZXR1cm4ge1xuICAgICAgbmV3TmFtZSxcbiAgICAgIG5ld0RlY2tMaW5rczogW2JhY2ssIG9sZEZpcnN0XSxcbiAgICAgIHJld3JpdGVzOiBbeyBuYW1lOiBjdXJyZW50TmFtZSwgZGVjazogW2BbWyR7bmV3TmFtZX1dXWBdIH1dLFxuICAgIH07XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU2xpZGU6IGZpcnN0IGxpbmsgaXMgdGhlIG92ZXJ2aWV3IHBhZ2UgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IG92ZXJ2aWV3TGluayA9IGN1cnJlbnRMaW5rc1swXTtcbiAgaWYgKCFvdmVydmlld0xpbmspIHJldHVybiBudWxsO1xuICBjb25zdCBuZXh0TGluayA9IGN1cnJlbnRMaW5rc1sxXTtcblxuICBpZiAobmV4dExpbmspIHtcbiAgICBjb25zdCBuZXh0TmFtZSA9IGV4dHJhY3RMaW5rVGV4dChuZXh0TGluayk7XG4gICAgaWYgKG5leHROYW1lICYmIGlzUGxhaW5OYW1lKG5leHROYW1lKSAmJiBuZXh0TmFtZSAhPT0gY3VycmVudE5hbWUpIHtcbiAgICAgIGlmICghaW5wdXQuZXhpc3RpbmdOYW1lcy5oYXMobmV4dE5hbWUpKSB7XG4gICAgICAgIC8vIFRoZSBkZWNsYXJlZCBuZXh0IG5vdGUgZG9lcyBub3QgZXhpc3QgeWV0IFx1MjE5MiBjcmVhdGUgZXhhY3RseSB0aGF0XG4gICAgICAgIC8vIG5vdGUgKGZpeGVzIHRoZSBicm9rZW4tbGluayB3YXJuaW5nLCBob25vdXJzIHRoZSBhdXRob3IncyBpbnRlbnQpLlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5ld05hbWU6IG5leHROYW1lLFxuICAgICAgICAgIG5ld0RlY2tMaW5rczogW292ZXJ2aWV3TGlua10sXG4gICAgICAgICAgcmV3cml0ZXM6IFtdLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgLy8gQSB2YWxpZCBuZXh0IG5vdGUgZXhpc3RzIFx1MjE5MiBpbnNlcnQgYmV0d2VlbiBpdCBhbmQgdGhlIGN1cnJlbnQgbm90ZS5cbiAgICAgIGNvbnN0IG5ld05hbWUgPSB1bmlxdWVOYW1lKGAke2N1cnJlbnROYW1lfS1uZXh0YCwgaW5wdXQuZXhpc3RpbmdOYW1lcyk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBuZXdOYW1lLFxuICAgICAgICBuZXdEZWNrTGlua3M6IFtvdmVydmlld0xpbmssIG5leHRMaW5rXSxcbiAgICAgICAgcmV3cml0ZXM6IFt7IG5hbWU6IGN1cnJlbnROYW1lLCBkZWNrOiBbb3ZlcnZpZXdMaW5rLCBgW1ske25ld05hbWV9XV1gXSB9XSxcbiAgICAgIH07XG4gICAgfVxuICAgIC8vIEludmFsaWQgKHBhdGgtcXVhbGlmaWVkIC8gc2VsZi1yZWZlcmVuY2luZykgbmV4dCBsaW5rIFx1MjE5MiBkcm9wIGl0IGFuZFxuICAgIC8vIGFwcGVuZCBhIG5ldyBsYXN0IHNsaWRlIChmYWxsIHRocm91Z2ggdG8gdGhlIG5vLW5leHQgYnJhbmNoKS5cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBMYXN0IHNsaWRlIFx1MjE5MiBhcHBlbmQgYSBuZXcgbGFzdCBzbGlkZSBhZnRlciBpdCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3QgbmV3TmFtZSA9IHVuaXF1ZU5hbWUoYCR7Y3VycmVudE5hbWV9LW5leHRgLCBpbnB1dC5leGlzdGluZ05hbWVzKTtcbiAgcmV0dXJuIHtcbiAgICBuZXdOYW1lLFxuICAgIG5ld0RlY2tMaW5rczogW292ZXJ2aWV3TGlua10sXG4gICAgcmV3cml0ZXM6IFt7IG5hbWU6IGN1cnJlbnROYW1lLCBkZWNrOiBbb3ZlcnZpZXdMaW5rLCBgW1ske25ld05hbWV9XV1gXSB9XSxcbiAgfTtcbn1cblxuLyoqIEEgbmFtZSB1c2FibGUgYXMgYSB2YXVsdCBub3RlIG5hbWU6IG5vIHBhdGggc2VwYXJhdG9ycywgbm9uLWVtcHR5ICovXG5mdW5jdGlvbiBpc1BsYWluTmFtZShuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIG5hbWUubGVuZ3RoID4gMCAmJiAhbmFtZS5pbmNsdWRlcyhcIi9cIikgJiYgIW5hbWUuaW5jbHVkZXMoXCJcXFxcXCIpO1xufVxuXG4vKiogRmlyc3QgZnJlZSBuYW1lIGluIHRoZSBmYW1pbHkgYGJhc2VgLCBgYmFzZS0yYCwgYGJhc2UtM2AsIFx1MjAyNiAqL1xuZnVuY3Rpb24gdW5pcXVlTmFtZShiYXNlOiBzdHJpbmcsIGV4aXN0aW5nOiBTZXQ8c3RyaW5nPik6IHN0cmluZyB7XG4gIGlmICghZXhpc3RpbmcuaGFzKGJhc2UpKSByZXR1cm4gYmFzZTtcbiAgZm9yIChsZXQgaSA9IDI7IDsgaSsrKSB7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gYCR7YmFzZX0tJHtpfWA7XG4gICAgaWYgKCFleGlzdGluZy5oYXMoY2FuZGlkYXRlKSkgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBMkRBLHNCQUErRTs7O0FDakR4RSxJQUFNLGlCQUFpQjtBQXlCdkIsU0FBUyxZQUNkLGFBQ0EsVUFDaUI7QUFDakIsUUFBTSxlQUFlLFNBQVMsV0FBVztBQUN6QyxNQUFJLGFBQWEsV0FBVyxFQUFHLFFBQU87QUFFdEMsTUFBSTtBQUNKLE1BQUk7QUFFSixNQUFJLGFBQWEsVUFBVSxH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
