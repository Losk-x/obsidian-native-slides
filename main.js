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
    const pick = (sels) => {
      for (const sel of sels) {
        const el = contentEl.querySelector(sel);
        if (el) return el;
      }
      return null;
    };
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
    const container = pick([
      isEdit ? ".markdown-source-view.mod-cm6 .cm-content" : ".markdown-reading-view .markdown-preview-view"
    ]);
    const para = pick([
      isEdit ? ".markdown-source-view.mod-cm6 .cm-line" : ".markdown-reading-view .markdown-preview-view p"
    ]);
    const h1 = pick([
      isEdit ? ".markdown-source-view.mod-cm6 .cm-header-1" : ".markdown-reading-view h1",
      isEdit ? ".markdown-source-view.mod-cm6 h1" : ".markdown-reading-view .markdown-preview-view h1"
    ]);
    const listItem = pick([
      isEdit ? ".markdown-source-view.mod-cm6 .HyperMD-list-line" : ".markdown-preview-view ul > li",
      isEdit ? ".HyperMD-list-line" : ".markdown-reading-view .markdown-preview-view ul > li"
    ]);
    const pre = pick([
      isEdit ? ".markdown-source-view.mod-cm6 pre" : ".markdown-reading-view .markdown-preview-view pre",
      isEdit ? ".markdown-source-view.mod-cm6 .cm-editing pre" : ".markdown-preview-view pre",
      isEdit ? ".markdown-source-view.mod-cm6 .HyperMD-codeblock" : ".markdown-preview-view pre"
    ]);
    const quote = pick([
      isEdit ? ".markdown-source-view.mod-cm6 blockquote" : ".markdown-reading-view blockquote",
      isEdit ? ".markdown-source-view.mod-cm6 .HyperMD-quote" : ".markdown-reading-view .markdown-preview-view blockquote"
    ]);
    const inlineCode = pick([
      isEdit ? ".markdown-source-view.mod-cm6 code" : ".markdown-reading-view code",
      isEdit ? ".markdown-source-view.mod-cm6 .cm-inline-code" : ".markdown-reading-view .markdown-preview-view code"
    ]);
    const domTags = [];
    if (isEdit) {
      const tags = /* @__PURE__ */ new Set();
      contentEl.querySelectorAll(".markdown-source-view.mod-cm6 *").forEach((el) => tags.add(el.tagName.toLowerCase()));
      domTags.push(...tags);
    }
    const dump = {
      mode: isEdit ? "edit (Live Preview)" : "reading",
      // Alignment CSS (rules 7/7b) only applies when WYSIWYG is on
      wysiwygActive: document.body.classList.contains("native-slides-wysiwyg"),
      domTags: isEdit ? domTags : void 0,
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
    const wysHint = document.body.classList.contains("native-slides-wysiwyg") ? "WYSIWYG is ON \u2014 alignment rules active." : "WYSIWYG is OFF \u2014 alignment rules NOT active. On a deck note, toggle it on (Mod+Shift+E) and rerun.";
    const scrollHint = isEdit ? " Edit view renders only the visible area \u2014 scroll to the code block/table/quote, then rerun." : "";
    new import_obsidian.Notice("Typography dump \u2192 Console (Cmd+Opt+I). " + wysHint + scrollHint);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvZGVjay50cyIsICJzcmMvY3JlYXRlTmV4dC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBuYXRpdmUtc2xpZGVzIFx1MjAxNCByZWFkaW5nLXZpZXcgcHJvcGVydGllcyBiYXIgd2l0aCBQUFQtc3R5bGUgZGVjayBuYXZpZ2F0aW9uXG4gKlxuICogRmVhdHVyZXM6XG4gKiAgIDEuIEhpZGVzIE9ic2lkaWFuJ3MgbmF0aXZlIHN0YXR1cyBiYXIgYW5kIHJlbmRlcnMgYSBcInByb3BlcnRpZXMgYmFyXCIgYXQgdGhlXG4gKiAgICAgIGJvdHRvbSBvZiB0aGUgd2luZG93LlxuICogICAyLiBJbiByZWFkaW5nIHZpZXcsIHNob3dzIHRoZSBjdXJyZW50IG5vdGUncyBwcm9wZXJ0aWVzIChZQU1MIGZyb250bWF0dGVyKVxuICogICAgICBhcyBjaGlwcyBpbiB0aGF0IGJhci5cbiAqICAgMy4gUmVhZGluZyB2aWV3IGF1dG8tZW50ZXJzIGEgZnVsbHNjcmVlbi1saWtlIG1vZGU6IHRoZSByaWJib24sIHNpZGViYXJzLFxuICogICAgICB0YWIgYmFyIGFuZCB0aGUgcGFuZSBoZWFkZXIgYmFyIGFyZSBoaWRkZW47IGxlYXZpbmcgcmVhZGluZyB2aWV3XG4gKiAgICAgIHJlc3RvcmVzIHRoZW0gYXV0b21hdGljYWxseS4gUHJlc3NpbmcgRXNjIHRvIGxlYXZlIHRoZSBPUyBmdWxsc2NyZWVuXG4gKiAgICAgIGFsc28gZXhpdHMgcmVhZGluZyB2aWV3LlxuICogICA0LiBIaWRlcyB0aGUgaW4tbm90ZSBwcm9wZXJ0aWVzIHBhbmVsIGluIHJlYWRpbmcgdmlldyAoa2VwdCBpbiBlZGl0IHZpZXcpLlxuICogICA1LiBQUFQtc3R5bGUgZGVjayBuYXZpZ2F0aW9uIGRyaXZlbiBieSBPTkUgcmVzZXJ2ZWQgZnJvbnRtYXR0ZXIga2V5LCBgZGVja2AsXG4gKiAgICAgIGhvbGRpbmcgdXAgdG8gdHdvIG1hcmtkb3duIGxpbmtzOlxuICogICAgICAgIC0gb3ZlcnZpZXcgbm90ZSA6IGRlY2s6IFtcIltbZmlyc3Qtc2xpZGVdXVwiXSAgICAgICAgICAgIChvbmUgbGluayA9IHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0IHBhZ2Ugb2YgdGhlIGRlY2s7IHRoZSBub3RlIGlzIHRoZSBvdmVydmlldylcbiAqICAgICAgICAtIHNsaWRlIG5vdGUgICAgOiBkZWNrOiBbXCJbW292ZXJ2aWV3XV1cIiwgXCJbW25leHQtc2xpZGVdXVwiXVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIChmaXJzdCBsaW5rID0gdGhlIG92ZXJ2aWV3IHBhZ2UsIHNlY29uZCBsaW5rID0gdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCBzbGlkZTsgb21pdCB0aGUgc2Vjb25kIGxpbmsgb24gdGhlIGxhc3Qgc2xpZGUpXG4gKiAgICAgIFRoZSBwYWdlIG51bWJlciBpcyBjb21wdXRlZCBhdXRvbWF0aWNhbGx5IGJ5IHNjYW5uaW5nIHRoZSB2YXVsdCBhbmRcbiAqICAgICAgd2Fsa2luZyB0aGUgY2hhaW4gb2YgbGlua3MsIHNvIG5vIGBwYWdlLW51bWJlcmAgcHJvcGVydHkgaXMgbmVlZGVkLlxuICogICAgICBcdTI1QzAgXHUyNUI2IGJ1dHRvbnMgYXBwZWFyIG9uIHRoZSBsZWZ0IG9mIHRoZSBiYXIsIGFuZCBcIlByZXZpb3VzIFBhZ2VcIiAvIFwiTmV4dFxuICogICAgICBQYWdlXCIgY29tbWFuZHMgYXJlIHJlZ2lzdGVyZWQgKGRlZmF1bHQgaG90a2V5cyBNb2QrU2hpZnQrXHUyMTkwIC8gTW9kK1NoaWZ0K1x1MjE5MixcbiAqICAgICAgcmViaW5kYWJsZSB1bmRlciBTZXR0aW5ncyBcdTIxOTIgSG90a2V5cykuXG4gKiAgIDYuIEEgc2V0dGluZ3MgdGFiIHRvZ2dsZXMgdGhlIFx1MjVDMCBcdTI1QjYgYnV0dG9ucyBhbmQgdGhlIHBhZ2UgbnVtYmVyLlxuICogICA3LiBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIgY29tbWFuZDogY3JlYXRlcyBhIG5ldyBzbGlkZSByaWdodCBhZnRlciB0aGVcbiAqICAgICAgY3VycmVudCBvbmUgKG5hbWUtY29sbGlzaW9uIGF3YXJlKSwgcmV3aXJlcyB0aGUgYGRlY2tgIHByb3BlcnRpZXMgb2ZcbiAqICAgICAgYm90aCBub3RlcywgYW5kIG9wZW5zIHRoZSBuZXcgbm90ZSBpbiBlZGl0IG1vZGUuXG4gKiAgIDguIFwiVG9nZ2xlIFdZU0lXWUcgTW9kZVwiIChjb21tYW5kICsgaG90a2V5ICsgYm90dG9tLWJhciBidXR0b24sIGRlY2tcbiAqICAgICAgbm90ZXMgb25seSk6IGFuIGltbWVyc2l2ZSBtb2RlIHdpdGggTUlOSU1BTCBzdHlsZSBpbnRlcnZlbnRpb24gXHUyMDE0XG4gKiAgICAgIHRoZSB0YWIgYmFyIGFuZCBzaWRlYmFycyBoaWRlIGluIGJvdGggdmlld3MsIHRoZSBib3R0b20gYmFyIHNob3dzXG4gKiAgICAgIGluIGVkaXQgdmlldyB0b28gYW5kIG1hdGNoZXMgdGhlIHRhYiBiYXIncyBtZWFzdXJlZCBoZWlnaHQgKG5vXG4gKiAgICAgIGNvbnRlbnQtYXJlYSBoZWlnaHQgY2hhbmdlIHdoZW4gc3dpdGNoaW5nIG1vZGVzKSwgaW4tbm90ZVxuICogICAgICBwcm9wZXJ0aWVzIGhpZGUgd2hpbGUgZWRpdGluZywgYW5kIHN0YW5kYWxvbmUgaW1hZ2UgbGluZXMgYXJlXG4gKiAgICAgIGNlbnRlcmVkLiBEZWZhdWx0IHR5cG9ncmFwaHkgaXMgbGVmdCB1bnRvdWNoZWQgKGVkaXQgYW5kIHJlYWRpbmdcbiAqICAgICAgYWxyZWFkeSBsb29rIG5lYXJseSBpZGVudGljYWw7IG90aGVyIHRoZW1lcy9wbHVnaW5zIG1heSByZXN0eWxlKS5cbiAqICAgICAgQWxsIHJ1bGVzIGFyZSBzY29wZWQgdW5kZXIgYm9keS5uYXRpdmUtc2xpZGVzLXd5c2l3eWcuXG4gKiAgIDkuIFwiRGVidWc6IER1bXAgVHlwb2dyYXBoeSBTdHlsZXNcIiAobnMtZGVidWctc3R5bGVzKTogcHJpbnRzIHRoZVxuICogICAgICBrZXkgY29tcHV0ZWQgc3R5bGVzICsgQ1NTIHZhcmlhYmxlcyBvZiB0aGUgY3VycmVudCB2aWV3IHRvIHRoZVxuICogICAgICBjb25zb2xlIFx1MjAxNCBydW4gb25jZSBwZXIgdmlldyBhbmQgY29tcGFyZSAobWVhc3VyZW1lbnQgdG9vbGluZyxcbiAqICAgICAgbm8gc2NyZWVuc2hvdHMgbmVlZGVkKS5cbiAqXG4gKiBUaGUgZGVjayB1c3VhbGx5IHN0YXJ0cyBmcm9tIGFuIG92ZXJ2aWV3IG5vdGUgdGhhdCBlbWJlZHMgYW4gT2JzaWRpYW4gQmFzZVxuICogdmlldyAoY29yZSBcIkJhc2VzXCIgcGx1Z2luKSBmaWx0ZXJpbmcgbm90ZXMgdGhhdCBsaW5rIHRvIHRoZSBvdmVydmlldyBwYWdlOlxuICpcbiAqICAgYGBgYmFzZVxuICogICBmaWx0ZXJzOlxuICogICAgIGFuZDpcbiAqICAgICAgIC0gZmlsZS5oYXNMaW5rKFwib3ZlcnZpZXdcIilcbiAqICAgdmlld3M6XG4gKiAgICAgLSB0eXBlOiB0YWJsZVxuICogICAgICAgbmFtZTogRGVja1xuICogICBgYGBcbiAqXG4gKiBXaHkgcmVhZCBwcm9wZXJ0aWVzIHZpYSBtZXRhZGF0YUNhY2hlIGluc3RlYWQgb2YgcGFyc2luZyBZQU1MIG1hbnVhbGx5P1xuICogICBPYnNpZGlhbiBtYWludGFpbnMgYSBjYWNoZSBwZXIgbm90ZTsgbWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSlcbiAqICAgLmZyb250bWF0dGVyIHJldHVybnMgdGhlIHBhcnNlZCBwcm9wZXJ0aWVzLCB1cGRhdGVkIGF1dG9tYXRpY2FsbHkgb24gc2F2ZS5cbiAqL1xuXG5pbXBvcnQgeyBNYXJrZG93blZpZXcsIE5vdGljZSwgUGx1Z2luLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgcGxhbkNyZWF0ZU5leHQsIHR5cGUgQ3JlYXRlTmV4dFJlc3VsdCB9IGZyb20gXCIuL3NyYy9jcmVhdGVOZXh0XCI7XG5pbXBvcnQgeyBjb21wdXRlRGVjaywgZXh0cmFjdExpbmtzLCBleHRyYWN0UmF3TGlua3MsIGZvcm1hdFZhbHVlLCB0eXBlIERlY2tJbmZvIH0gZnJvbSBcIi4vc3JjL2RlY2tcIjtcblxuLyoqIFBsdWdpbiBzZXR0aW5ncyAqL1xuaW50ZXJmYWNlIE5hdGl2ZVNsaWRlc1NldHRpbmdzIHtcbiAgLyoqIFNob3cgXHUyNUMwIFx1MjVCNiBwcmV2aW91cy9uZXh0IGJ1dHRvbnMgb24gdGhlIGxlZnQgb2YgdGhlIGJhciAqL1xuICBzaG93TmF2QnV0dG9uczogYm9vbGVhbjtcbiAgLyoqIFNob3cgdGhlIGF1dG8tY29tcHV0ZWQgcGFnZSBudW1iZXIgYXQgdGhlIGJvdHRvbS1yaWdodCBvZiB0aGUgYmFyICovXG4gIHNob3dQYWdlTnVtYmVyOiBib29sZWFuO1xuICAvKiogV2hldGhlciB0aGUgdXNlciBtYW51YWxseSBoaWQgdGhlIGJhciAodG9nZ2xlIGNvbW1hbmQpICovXG4gIGJhckhpZGRlbjogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgYXV0by1mdWxsc2NyZWVuIGluIHJlYWRpbmcgdmlldyBpcyBlbmFibGVkICovXG4gIGF1dG9GdWxsc2NyZWVuOiBib29sZWFuO1xuICAvKiogV1lTSVdZRyBtb2RlICh1bmlmaWVkIGVkaXQvcmVhZGluZyB0eXBvZ3JhcGh5KSBcdTIwMTQgZGVjayBub3RlcyBvbmx5ICovXG4gIHd5c2l3eWdNb2RlOiBib29sZWFuO1xufVxuXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBOYXRpdmVTbGlkZXNTZXR0aW5ncyA9IHtcbiAgc2hvd05hdkJ1dHRvbnM6IHRydWUsXG4gIHNob3dQYWdlTnVtYmVyOiB0cnVlLFxuICBiYXJIaWRkZW46IGZhbHNlLFxuICBhdXRvRnVsbHNjcmVlbjogdHJ1ZSxcbiAgd3lzaXd5Z01vZGU6IGZhbHNlLFxufTtcblxuLyoqIFJlc2VydmVkIGZyb250bWF0dGVyIGtleSBkcml2aW5nIGRlY2sgbmF2aWdhdGlvbiAobmV2ZXIgcmVuZGVyZWQgYXMgYSBjaGlwKSAqL1xuY29uc3QgREVDS19LRVkgPSBcImRlY2tcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTmF0aXZlU2xpZGVzUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgLyoqIFRoZSBwcm9wZXJ0aWVzIGJhciBET00gZWxlbWVudCAqL1xuICBwcml2YXRlIGJhcjogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgLyoqIFdoZXRoZXIgZnVsbHNjcmVlbiByZWFkaW5nIG1vZGUgaXMgY3VycmVudGx5IGFjdGl2ZSAqL1xuICBwcml2YXRlIGZ1bGxzY3JlZW4gPSBmYWxzZTtcbiAgLyoqIExhc3QgcmVmcmVzaCBrZXkgKFwicGF0aHxtb2RlXCIpIHRvIGF2b2lkIHBvaW50bGVzcyByZS1yZW5kZXJzICovXG4gIHByaXZhdGUgbGFzdEtleSA9IFwiXCI7XG4gIC8qKiBMYXN0IG1lYXN1cmVkIHRhYi1iYXIgaGVpZ2h0IChweCkgXHUyMDE0IGNhY2hlZCB3aGlsZSB0aGUgYmFyIGlzIGhpZGRlbiAqL1xuICBwcml2YXRlIHRhYkJhckhlaWdodCA9IDA7XG4gIC8qKiBQbHVnaW4gc2V0dGluZ3MgKi9cbiAgc2V0dGluZ3M6IE5hdGl2ZVNsaWRlc1NldHRpbmdzID0geyAuLi5ERUZBVUxUX1NFVFRJTkdTIH07XG5cbiAgYXN5bmMgb25sb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBOYXRpdmVTbGlkZXNTZXR0aW5nVGFiKHRoaXMpKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCAxLiBSZWZyZXNoIG9uIFwiY3VycmVudCBub3RlIC8gdmlldyBjaGFuZ2VkXCIgZXZlbnRzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJmaWxlLW9wZW5cIiwgKCkgPT4gdGhpcy5yZWZyZXNoKCkpKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKFwiYWN0aXZlLWxlYWYtY2hhbmdlXCIsICgpID0+IHRoaXMucmVmcmVzaCgpKSk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImxheW91dC1jaGFuZ2VcIiwgKCkgPT4gdGhpcy5yZWZyZXNoKCkpKTtcbiAgICAvLyBSZWZyZXNoIHdoZW4gdGhlIG5vdGUgY29udGVudCAoaW5jbHVkaW5nIGZyb250bWF0dGVyKSBjaGFuZ2VzIC8gc2F2ZXNcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLm9uKFwiY2hhbmdlZFwiLCAoZmlsZTogVEZpbGUpID0+IHtcbiAgICAgICAgaWYgKGZpbGUgPT09IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCkpIHRoaXMucmVmcmVzaCgpO1xuICAgICAgfSksXG4gICAgKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCAyLiBGYWxsYmFjayB0aW1lcjogZWRpdFx1MjE5NHJlYWRpbmcgdG9nZ2xlcyBtYXkgZmlyZSBubyBzdGFuZGFyZCBldmVudCBcdTI1MDBcdTI1MDBcbiAgICB0aGlzLnJlZ2lzdGVySW50ZXJ2YWwoXG4gICAgICB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICAgICAgY29uc3Qga2V5ID0gZmlsZSA/IGAke2ZpbGUucGF0aH18JHt0aGlzLmN1cnJlbnRNb2RlKCl9YCA6IFwiXCI7XG4gICAgICAgIGlmIChrZXkgIT09IHRoaXMubGFzdEtleSkge1xuICAgICAgICAgIHRoaXMubGFzdEtleSA9IGtleTtcbiAgICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICAgICAgfVxuICAgICAgfSwgNTAwKSxcbiAgICApO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDMuIENvbW1hbmRzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIC8vIDNhLiBNYW51YWxseSBzaG93IC8gaGlkZSB0aGUgcHJvcGVydGllcyBiYXJcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibnMtdG9nZ2xlLWJhclwiLFxuICAgICAgbmFtZTogXCJUb2dnbGUgUHJvcGVydGllcyBCYXJcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MuYmFySGlkZGVuID0gIXRoaXMuc2V0dGluZ3MuYmFySGlkZGVuO1xuICAgICAgICBhd2FpdCB0aGlzLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgLy8gM2IuIFBhdXNlIC8gcmVzdW1lIGF1dG8tZnVsbHNjcmVlbiBpbiByZWFkaW5nIHZpZXdcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibnMtdG9nZ2xlLWZ1bGxzY3JlZW5cIixcbiAgICAgIG5hbWU6IFwiUGF1c2UvUmVzdW1lIEF1dG8gRnVsbHNjcmVlblwiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5hdXRvRnVsbHNjcmVlbiA9ICF0aGlzLnNldHRpbmdzLmF1dG9GdWxsc2NyZWVuO1xuICAgICAgICBhd2FpdCB0aGlzLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAvLyBXaGVuIHBhdXNlZCwgcmVzdG9yZSB0aGUgbGF5b3V0IGltbWVkaWF0ZWx5OyB3aGVuIHJlc3VtZWQsIHJlLXN5bmNcbiAgICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLmF1dG9GdWxsc2NyZWVuKSB0aGlzLnN5bmNGdWxsc2NyZWVuKGZhbHNlKTtcbiAgICAgICAgZWxzZSB0aGlzLnJlZnJlc2goKTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgLy8gM2MuIFByZXZpb3VzIC8gbmV4dCBwYWdlIChkZWNrIG5hdmlnYXRpb24sIHJlYmluZGFibGUgaW4gU2V0dGluZ3MgXHUyMTkyIEhvdGtleXMpXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLXByZXZcIixcbiAgICAgIG5hbWU6IFwiUHJldmlvdXMgUGFnZVwiLFxuICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIiwgXCJTaGlmdFwiXSwga2V5OiBcIkFycm93TGVmdFwiIH1dLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHRoaXMubmF2aWdhdGUoXCJwcmV2XCIpLFxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJucy1uZXh0XCIsXG4gICAgICBuYW1lOiBcIk5leHQgUGFnZVwiLFxuICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIiwgXCJTaGlmdFwiXSwga2V5OiBcIkFycm93UmlnaHRcIiB9XSxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLm5hdmlnYXRlKFwibmV4dFwiKSxcbiAgICB9KTtcbiAgICAvLyAzZC4gQ3JlYXRlIE5leHQgU2xpZGUgXHUyMDE0IG5ldyBzbGlkZSBhZnRlciB0aGUgY3VycmVudCBvbmUgKGRlY2sgbm90ZXMgb25seSlcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibnMtY3JlYXRlLW5leHRcIixcbiAgICAgIG5hbWU6IFwiQ3JlYXRlIE5leHQgU2xpZGVcIixcbiAgICAgIC8vIEdyZXllZCBvdXQgaW4gdGhlIHBhbGV0dGUgdW5sZXNzIHRoZSBhY3RpdmUgbm90ZSBjYW4gdGFrZSBhIG5leHQgc2xpZGVcbiAgICAgIGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZykgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICAgICAgaWYgKCFmaWxlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGNvbnN0IHBsYW4gPSB0aGlzLnBsYW5DcmVhdGVOZXh0KGZpbGUpO1xuICAgICAgICBpZiAoIXBsYW4pIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKCFjaGVja2luZykgdm9pZCB0aGlzLmV4ZWN1dGVDcmVhdGVOZXh0KGZpbGUsIHBsYW4pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgLy8gM2UuIFRvZ2dsZSBXWVNJV1lHIG1vZGUgXHUyMDE0IHVuaWZpZWQgZWRpdC9yZWFkaW5nIHR5cG9ncmFwaHkgKGRlY2sgbm90ZXMgb25seSlcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibnMtdG9nZ2xlLXd5c2l3eWdcIixcbiAgICAgIG5hbWU6IFwiVG9nZ2xlIFdZU0lXWUcgTW9kZVwiLFxuICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIiwgXCJTaGlmdFwiXSwga2V5OiBcIkVcIiB9XSxcbiAgICAgIGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZykgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICAgICAgaWYgKCFmaWxlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGNvbnN0IGZtID0gdGhpcy5mcm9udG1hdHRlck9mKGZpbGUpO1xuICAgICAgICBpZiAoZm0gPT09IG51bGwgfHwgIShERUNLX0tFWSBpbiBmbSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKCFjaGVja2luZykgdGhpcy50b2dnbGVXeXNpd3lnKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSxcbiAgICB9KTtcbiAgICAvLyAzZi4gRGVidWc6IGR1bXAgdHlwb2dyYXBoeSBjb21wdXRlZCBzdHlsZXMgZm9yIGVkaXQvcmVhZGluZyBjb21wYXJpc29uXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLWRlYnVnLXN0eWxlc1wiLFxuICAgICAgbmFtZTogXCJEZWJ1ZzogRHVtcCBUeXBvZ3JhcGh5IFN0eWxlc1wiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHRoaXMuZGVidWdTdHlsZXMoKSxcbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCA0LiBFc2MgZXhpdHMgT1MgZnVsbHNjcmVlbiBcdTIxOTIgbGVhdmUgcmVhZGluZyB2aWV3IGFzIHdlbGwgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgLy8gS2VlcHMgaW50ZXJuYWwgc3RhdGUgaW4gc3luYyB3aGVuIHRoZSB1c2VyIHByZXNzZXMgRXNjOyBhbHNvIHN3aXRjaGVzXG4gICAgLy8gdGhlIGFjdGl2ZSBNYXJrZG93biB2aWV3IGJhY2sgdG8gZWRpdCBtb2RlLiBPdXIgb3duIGV4aXRGdWxsc2NyZWVuKClcbiAgICAvLyBjYWxscyBzZXQgdGhpcy5mdWxsc2NyZWVuID0gZmFsc2UgZmlyc3QsIHNvIHRoZXkgbmV2ZXIgdHJpZ2dlciB0aGlzLlxuICAgIHRoaXMucmVnaXN0ZXJEb21FdmVudChkb2N1bWVudCwgXCJmdWxsc2NyZWVuY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGlmICghZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQgJiYgdGhpcy5mdWxsc2NyZWVuKSB7XG4gICAgICAgIHRoaXMuZnVsbHNjcmVlbiA9IGZhbHNlO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoXCJuYXRpdmUtc2xpZGVzLWZ1bGxzY3JlZW5cIik7XG4gICAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgICAgICBpZiAodmlldyAmJiB2aWV3LmdldE1vZGUoKSA9PT0gXCJwcmV2aWV3XCIpIHtcbiAgICAgICAgICAvLyBMZWF2ZSByZWFkaW5nIHZpZXcgdmlhIHRoZSBwdWJsaWMgdmlldy1zdGF0ZSBBUElcbiAgICAgICAgICBjb25zdCBzdGF0ZSA9IHZpZXcubGVhZi5nZXRWaWV3U3RhdGUoKTtcbiAgICAgICAgICBzdGF0ZS5zdGF0ZSA9IHsgLi4uc3RhdGUuc3RhdGUsIG1vZGU6IFwic291cmNlXCIgfTtcbiAgICAgICAgICB2b2lkIHZpZXcubGVhZi5zZXRWaWV3U3RhdGUoc3RhdGUsIHsgZm9jdXM6IGZhbHNlIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgNS4gQ3JlYXRlIHRoZSBiYXIgYW5kIGRvIHRoZSBmaXJzdCByZW5kZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5iYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRoaXMuYmFyLmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy1iYXJcIjtcbiAgICB0aGlzLmJhci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7IC8vIGhpZGRlbiB1bnRpbCByZWZyZXNoKCkgZGVjaWRlcyBvdGhlcndpc2VcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuYmFyKTtcbiAgICB0aGlzLnJlZnJlc2goKTtcbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuYmFyPy5yZW1vdmUoKTtcbiAgICB0aGlzLmJhciA9IG51bGw7XG4gICAgLy8gTGVhdmUgT1MgZnVsbHNjcmVlbiBhbmQgZHJvcCB0aGUgZnVsbHNjcmVlbiBjbGFzcyBzbyBubyBVSSByZXNpZHVlIHJlbWFpbnNcbiAgICBpZiAoZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQpIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuPy4oKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKFwibmF0aXZlLXNsaWRlcy1mdWxsc2NyZWVuXCIpO1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShcIm5hdGl2ZS1zbGlkZXMtd3lzaXd5Z1wiKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTZXR0aW5ncyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBEZWNrIHJlc29sdXRpb24gKHdhbGsgdGhlIGxpbmsgY2hhaW4pIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBSZXNvbHZlIHRoZSBjdXJyZW50IG5vdGUncyBwb3NpdGlvbiBpbnNpZGUgaXRzIGRlY2sgKHBhdGgtYmFzZWQgd3JhcHBlcikgKi9cbiAgcHJpdmF0ZSBjb21wdXRlRGVjayhmaWxlOiBURmlsZSk6IERlY2tJbmZvIHwgbnVsbCB7XG4gICAgcmV0dXJuIGNvbXB1dGVEZWNrKGZpbGUucGF0aCwgKHBhdGgpID0+IHRoaXMuZGVja0xpbmtQYXRocyhwYXRoKSk7XG4gIH1cblxuICAvKiogUmVzb2x2ZSB0aGUgYGRlY2tgIHByb3BlcnR5IG9mIGEgbm90ZSBpbnRvIHJlYWwgbm90ZSBwYXRocyAobWF4IHR3bykgKi9cbiAgcHJpdmF0ZSBkZWNrTGlua1BhdGhzKHBhdGg6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBmID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgIGlmICghKGYgaW5zdGFuY2VvZiBURmlsZSkpIHJldHVybiBbXTtcbiAgICBjb25zdCBmbSA9IHRoaXMuZnJvbnRtYXR0ZXJPZihmKTtcbiAgICBjb25zdCBuYW1lcyA9IGZtID8gZXh0cmFjdExpbmtzKGZtW0RFQ0tfS0VZXSkgOiBbXTtcbiAgICByZXR1cm4gbmFtZXNcbiAgICAgIC5tYXAoKG5hbWUpID0+IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3QobmFtZSwgcGF0aCkpXG4gICAgICAuZmlsdGVyKCh4KTogeCBpcyBURmlsZSA9PiAhIXgpXG4gICAgICAubWFwKCh4KSA9PiB4LnBhdGgpO1xuICB9XG5cbiAgLyoqIE5hbWVzIGluIHRoZSBgZGVja2AgcHJvcGVydHkgdGhhdCByZXNvbHZlIHRvIG5vIG5vdGUgKGJyb2tlbiBsaW5rcykgKi9cbiAgcHJpdmF0ZSBicm9rZW5EZWNrTGlua3MoZmlsZTogVEZpbGUpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZm0gPSB0aGlzLmZyb250bWF0dGVyT2YoZmlsZSk7XG4gICAgY29uc3QgbmFtZXMgPSBmbSA/IGV4dHJhY3RMaW5rcyhmbVtERUNLX0tFWV0pIDogW107XG4gICAgcmV0dXJuIG5hbWVzLmZpbHRlcigobmFtZSkgPT4gIXRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3QobmFtZSwgZmlsZS5wYXRoKSk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgQ3JlYXRlIE5leHQgU2xpZGUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLyoqXG4gICAqIFBsYW4gYSBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIgcnVuIGZvciB0aGUgYWN0aXZlIG5vdGUsIG9yIG51bGwgd2hlbiB0aGVcbiAgICogbm90ZSBjYW5ub3QgdGFrZSBhIG5leHQgc2xpZGUgKG5vIHVzYWJsZSBgZGVja2AgcHJvcGVydHkpLlxuICAgKlxuICAgKiBTbGlkZXMgb24gdGhlIGNoYWluIGluc2VydC9hcHBlbmQgYWZ0ZXIgdGhlIGN1cnJlbnQgbm90ZTsgdGhlIG92ZXJ2aWV3XG4gICAqIHBhZ2UgaW5zZXJ0cyBhIG5ldyBmaXJzdCBwYWdlOyBhbiBvZmYtY2hhaW4gbm90ZSB3aXRoIGEgcmVzb2x2YWJsZVxuICAgKiBvdmVydmlldyBsaW5rIHN0aWxsIGdldHMgaXRzIGRlY2xhcmVkIG1pc3NpbmcgbmV4dCBub3RlIGNyZWF0ZWQuXG4gICAqL1xuICBwcml2YXRlIHBsYW5DcmVhdGVOZXh0KGZpbGU6IFRGaWxlKTogQ3JlYXRlTmV4dFJlc3VsdCB8IG51bGwge1xuICAgIGNvbnN0IGZtID0gdGhpcy5mcm9udG1hdHRlck9mKGZpbGUpO1xuICAgIGNvbnN0IHJhdyA9IGZtID8gZXh0cmFjdFJhd0xpbmtzKGZtW0RFQ0tfS0VZXSkgOiBbXTtcbiAgICBpZiAocmF3Lmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgICBjb25zdCBkZWNrID0gdGhpcy5jb21wdXRlRGVjayhmaWxlKTtcbiAgICBjb25zdCBleGlzdGluZ05hbWVzID0gbmV3IFNldCh0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCkubWFwKChmKSA9PiBmLmJhc2VuYW1lKSk7XG5cbiAgICBpZiAoZGVjaykge1xuICAgICAgLy8gT3ZlcnZpZXcgaW5zZXJ0aW9uIG5lZWRzIHRoZSBvbGQgZmlyc3QgcGFnZSdzIGJhY2sgbGluayB0byB0aGVcbiAgICAgIC8vIG92ZXJ2aWV3IChpdHMgb3duIGZyb250bWF0dGVyIG9ubHkgbGlua3MgZm9yd2FyZCkuXG4gICAgICBsZXQgb3ZlcnZpZXdCYWNrTGluazogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKGRlY2suaW5kZXggPT09IDApIHtcbiAgICAgICAgY29uc3Qgb2xkRmlyc3QgPSBkZWNrLmNoYWluWzFdID8gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGRlY2suY2hhaW5bMV0pIDogbnVsbDtcbiAgICAgICAgaWYgKG9sZEZpcnN0IGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgICAgICBjb25zdCBmMiA9IHRoaXMuZnJvbnRtYXR0ZXJPZihvbGRGaXJzdCk7XG4gICAgICAgICAgb3ZlcnZpZXdCYWNrTGluayA9IGYyID8gZXh0cmFjdFJhd0xpbmtzKGYyW0RFQ0tfS0VZXSlbMF0gOiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBwbGFuQ3JlYXRlTmV4dCh7XG4gICAgICAgIGN1cnJlbnROYW1lOiBmaWxlLmJhc2VuYW1lLFxuICAgICAgICBjdXJyZW50TGlua3M6IHJhdyxcbiAgICAgICAgaXNPdmVydmlldzogZGVjay5pbmRleCA9PT0gMCxcbiAgICAgICAgb3ZlcnZpZXdCYWNrTGluayxcbiAgICAgICAgZXhpc3RpbmdOYW1lcyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIE9mZi1jaGFpbiBub3RlOiBzdGlsbCBjcmVhdGUgaXRzIGRlY2xhcmVkIG1pc3NpbmcgbmV4dCBub3RlIHdoZW4gdGhlXG4gICAgLy8gb3ZlcnZpZXcgbGluayByZXNvbHZlcyAodGhlIFx1MjZBMCBicm9rZW4tbGluayB3YXJuaW5nIGRpc2FwcGVhcnMpLlxuICAgIGNvbnN0IG92ZXJ2aWV3TmFtZSA9IHJhdy5sZW5ndGggPj0gMiA/IGV4dHJhY3RMaW5rcyhyYXdbMF0pWzBdIDogbnVsbDtcbiAgICBpZiAob3ZlcnZpZXdOYW1lICYmIHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3Qob3ZlcnZpZXdOYW1lLCBmaWxlLnBhdGgpKSB7XG4gICAgICByZXR1cm4gcGxhbkNyZWF0ZU5leHQoe1xuICAgICAgICBjdXJyZW50TmFtZTogZmlsZS5iYXNlbmFtZSxcbiAgICAgICAgY3VycmVudExpbmtzOiByYXcsXG4gICAgICAgIGlzT3ZlcnZpZXc6IGZhbHNlLFxuICAgICAgICBleGlzdGluZ05hbWVzLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqIEFwcGx5IGEgcGxhbjogY3JlYXRlIHRoZSBub3RlLCByZXdpcmUgYGRlY2tgIHByb3BlcnRpZXMsIG9wZW4gaXQgKi9cbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlQ3JlYXRlTmV4dChmaWxlOiBURmlsZSwgcGxhbjogQ3JlYXRlTmV4dFJlc3VsdCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGRpciA9IGZpbGUucGFyZW50Py5wYXRoID8gZmlsZS5wYXJlbnQucGF0aCArIFwiL1wiIDogXCJcIjtcbiAgICBjb25zdCBuZXdQYXRoID0gYCR7ZGlyfSR7cGxhbi5uZXdOYW1lfS5tZGA7XG4gICAgY29uc3QgZnJvbnRtYXR0ZXIgPSBwbGFuLm5ld0RlY2tMaW5rcy5tYXAoKGxpbmspID0+IEpTT04uc3RyaW5naWZ5KGxpbmspKS5qb2luKFwiLCBcIik7XG4gICAgY29uc3QgY29udGVudCA9IGAtLS1cXG5kZWNrOiBbJHtmcm9udG1hdHRlcn1dXFxuLS0tXFxuYDtcblxuICAgIGxldCBuZXdGaWxlOiBURmlsZTtcbiAgICB0cnkge1xuICAgICAgbmV3RmlsZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShuZXdQYXRoLCBjb250ZW50KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgbmV3IE5vdGljZShgTmF0aXZlIFNsaWRlczogY291bGQgbm90IGNyZWF0ZSBcIiR7cGxhbi5uZXdOYW1lfS5tZFwiICgke1N0cmluZyhlcnJvcil9KWApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJld2lyZSB0aGUgY3VycmVudCBub3RlJ3MgYGRlY2tgIChrZWVwcyBhbGwgb3RoZXIgcHJvcGVydGllcyBpbnRhY3QpXG4gICAgZm9yIChjb25zdCByZXdyaXRlIG9mIHBsYW4ucmV3cml0ZXMpIHtcbiAgICAgIGlmIChyZXdyaXRlLm5hbWUgIT09IGZpbGUuYmFzZW5hbWUpIGNvbnRpbnVlOyAvLyBpbiBwcmFjdGljZSBhbHdheXMgdGhlIGN1cnJlbnQgbm90ZVxuICAgICAgYXdhaXQgdGhpcy5hcHAuZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKGZpbGUsIChmbSkgPT4ge1xuICAgICAgICBmbVtERUNLX0tFWV0gPSByZXdyaXRlLmRlY2s7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBPcGVuIHRoZSBuZXcgbm90ZSBpbiB0aGUgY3VycmVudCBwYW5lLCBlZGl0IG1vZGUgKExpdmUgUHJldmlldylcbiAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpO1xuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUobmV3RmlsZSwgeyBzdGF0ZTogeyBtb2RlOiBcInNvdXJjZVwiIH0gfSk7XG4gIH1cblxuICAvKiogRnJvbnRtYXR0ZXIgb2YgYW55IG5vdGUgYXMgYW4gb2JqZWN0LCBvciBudWxsIHdoZW4gYWJzZW50ICovXG4gIHByaXZhdGUgZnJvbnRtYXR0ZXJPZihmaWxlOiBURmlsZSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCB7XG4gICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgICByZXR1cm4gY2FjaGU/LmZyb250bWF0dGVyID8/IG51bGw7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgUFBUIG5hdmlnYXRpb24gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLyoqIE1vdmUgb25lIHN0ZXAgYmFjay9mb3J3YXJkIGFsb25nIHRoZSBkZWNrIGNoYWluICovXG4gIHByaXZhdGUgbmF2aWdhdGUoZGlyZWN0aW9uOiBcInByZXZcIiB8IFwibmV4dFwiKTogdm9pZCB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgaWYgKCFmaWxlKSByZXR1cm47XG4gICAgY29uc3QgZGVjayA9IHRoaXMuY29tcHV0ZURlY2soZmlsZSk7XG4gICAgaWYgKCFkZWNrKSByZXR1cm47XG4gICAgY29uc3QgdGFyZ2V0ID0gZGVjay5jaGFpbltkaXJlY3Rpb24gPT09IFwicHJldlwiID8gZGVjay5pbmRleCAtIDEgOiBkZWNrLmluZGV4ICsgMV07XG4gICAgaWYgKCF0YXJnZXQpIHJldHVybjtcbiAgICB2b2lkIHRoaXMuYXBwLndvcmtzcGFjZS5vcGVuTGlua1RleHQodGFyZ2V0LCBmaWxlLnBhdGgpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIE1vZGUgLyBkYXRhIGFjY2VzcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICAvKiogTW9kZSBvZiB0aGUgYWN0aXZlIE1hcmtkb3duIHZpZXc6ICdwcmV2aWV3Jz1yZWFkaW5nICdzb3VyY2UnPWVkaXRpbmcgJyc9bm9uZSAqL1xuICBwcml2YXRlIGN1cnJlbnRNb2RlKCk6IFwicHJldmlld1wiIHwgXCJzb3VyY2VcIiB8IFwiXCIge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIHJldHVybiB2aWV3ID8gKHZpZXcuZ2V0TW9kZSgpIGFzIFwicHJldmlld1wiIHwgXCJzb3VyY2VcIikgOiBcIlwiO1xuICB9XG5cbiAgLyoqIEN1cnJlbnQgbm90ZSdzIGZyb250bWF0dGVyIGFzIGFuIG9iamVjdCwgb3IgbnVsbCB3aGVuIGFic2VudCAqL1xuICBwcml2YXRlIGZyb250bWF0dGVyKCk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgcmV0dXJuIGZpbGUgPyB0aGlzLmZyb250bWF0dGVyT2YoZmlsZSkgOiBudWxsO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEJhciByZW5kZXJpbmcgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLyoqIERlY2lkZSB3aGF0IHRoZSBiYXIgc2hvd3MsIHRoZW4gcmUtcmVuZGVyIGl0ICovXG4gIHJlZnJlc2goKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmJhcikgcmV0dXJuO1xuXG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgY29uc3QgbW9kZSA9IHRoaXMuY3VycmVudE1vZGUoKTtcblxuICAgIC8vIENhcmQgbm90ZSA9IGhhcyBhIGBkZWNrYCBwcm9wZXJ0eSAodGhlIFdZU0lXWUcgbW9kZSdzIHNjb3BlIG1hcmtlcilcbiAgICBjb25zdCBjYXJkRm0gPSBmaWxlID8gdGhpcy5mcm9udG1hdHRlck9mKGZpbGUpIDogbnVsbDtcbiAgICBjb25zdCBpc0NhcmQgPSBjYXJkRm0gIT09IG51bGwgJiYgREVDS19LRVkgaW4gY2FyZEZtO1xuICAgIC8vIE1lYXN1cmUgdGhlIHRhYiBiYXIgd2hpbGUgaXQgaXMgc3RpbGwgdmlzaWJsZSAoV1lTSVdZRyBoaWRlcyBpdFxuICAgIC8vIGJlbG93OyB0aGUgbGFzdCBtZWFzdXJlZCB2YWx1ZSBpcyByZXVzZWQgb25jZSBoaWRkZW4pLlxuICAgIHRoaXMuc3luY1RhYkJhckhlaWdodCgpO1xuICAgIC8vIFdZU0lXWUcgbW9kZSBib2R5IGNsYXNzIFx1MjAxNCBpbW1lcnNpdmUgbW9kZSAoZGVjayBub3RlcyBvbmx5KTogaGlkZXNcbiAgICAvLyB0aGUgdGFiIGJhciBhbmQgc2lkZWJhcnMgaW4gYm90aCBlZGl0IGFuZCByZWFkaW5nIHZpZXdzLCBtYXRjaGVzXG4gICAgLy8gdGhlIGJvdHRvbSBiYXIncyBoZWlnaHQgdG8gdGhlIHRhYiBiYXIsIGFuZCBoaWRlcyBpbi1ub3RlXG4gICAgLy8gcHJvcGVydGllcyB3aGlsZSBlZGl0aW5nLlxuICAgIGNvbnN0IHd5c2l3eWcgPSBpc0NhcmQgJiYgdGhpcy5zZXR0aW5ncy53eXNpd3lnTW9kZTtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC50b2dnbGUoXCJuYXRpdmUtc2xpZGVzLXd5c2l3eWdcIiwgd3lzaXd5Zyk7XG5cbiAgICAvLyBBdXRvLWZ1bGxzY3JlZW46IGVudGVyIG9uIHJlYWRpbmcgdmlldywgcmVzdG9yZSBvbiBsZWF2aW5nIGl0XG4gICAgdGhpcy5zeW5jRnVsbHNjcmVlbihtb2RlID09PSBcInByZXZpZXdcIiAmJiB0aGlzLnNldHRpbmdzLmF1dG9GdWxsc2NyZWVuKTtcblxuICAgIC8vIEJhciB2aXNpYmlsaXR5OiByZWFkaW5nIHZpZXcgYWx3YXlzOyBlZGl0IHZpZXcgb25seSBpbiBXWVNJV1lHIG1vZGVcbiAgICAvLyAoc28gdGhlIG1vZGUgaGFzIHZpc2libGUgZmVlZGJhY2sgd2hpbGUgZWRpdGluZykuIEhpZGRlbiB3aGVuIHRoZVxuICAgIC8vIHVzZXIgaGlkIGl0IG1hbnVhbGx5LlxuICAgIGNvbnN0IGJhclZpc2libGUgPVxuICAgICAgISFmaWxlICYmXG4gICAgICAobW9kZSA9PT0gXCJwcmV2aWV3XCIgfHwgKG1vZGUgPT09IFwic291cmNlXCIgJiYgaXNDYXJkICYmIHRoaXMuc2V0dGluZ3Mud3lzaXd5Z01vZGUpKSAmJlxuICAgICAgIXRoaXMuc2V0dGluZ3MuYmFySGlkZGVuO1xuICAgIGlmICghYmFyVmlzaWJsZSkge1xuICAgICAgdGhpcy5iYXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZtID0gdGhpcy5mcm9udG1hdHRlcigpO1xuICAgIGNvbnN0IGRlY2sgPSB0aGlzLmNvbXB1dGVEZWNrKGZpbGUpO1xuICAgIGNsZWFyQ2hpbGRyZW4odGhpcy5iYXIpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIExlZnQ6IHByZXZpb3VzIC8gbmV4dCBidXR0b25zIChib3RoIGFsd2F5cyBzaG93biBpbnNpZGUgYSBkZWNrO1xuICAgIC8vICAgICAgICB0aGUgb25lIHRoYXQgY2Fubm90IG1vdmUgaXMgZGlzYWJsZWQgLyBsaWdodCBncmF5KSBcdTI1MDBcdTI1MDBcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5zaG93TmF2QnV0dG9ucyAmJiBkZWNrKSB7XG4gICAgICBjb25zdCBoYXNQcmV2ID0gZGVjay5pbmRleCA+IDA7XG4gICAgICBjb25zdCBoYXNOZXh0ID0gZGVjay5pbmRleCA8IGRlY2suY2hhaW4ubGVuZ3RoIC0gMTtcbiAgICAgIGNvbnN0IG5hdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBuYXYuY2xhc3NOYW1lID0gXCJuYXRpdmUtc2xpZGVzLW5hdlwiO1xuICAgICAgbmF2LmFwcGVuZENoaWxkKHRoaXMubmF2QnV0dG9uKFwiXHUyNUMwXCIsIFwiUHJldmlvdXMgcGFnZVwiLCAoKSA9PiB0aGlzLm5hdmlnYXRlKFwicHJldlwiKSwgIWhhc1ByZXYpKTtcbiAgICAgIG5hdi5hcHBlbmRDaGlsZCh0aGlzLm5hdkJ1dHRvbihcIlx1MjVCNlwiLCBcIk5leHQgcGFnZVwiLCAoKSA9PiB0aGlzLm5hdmlnYXRlKFwibmV4dFwiKSwgIWhhc05leHQpKTtcbiAgICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKG5hdik7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE1pZGRsZTogY2hpcHMgZm9yIHRoZSByZW1haW5pbmcgcHJvcGVydGllcyAobm8gcGxhY2Vob2xkZXIpIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IHZpc2libGUgPSBmbVxuICAgICAgPyBPYmplY3QuZW50cmllcyhmbSkuZmlsdGVyKChba2V5XSkgPT4ga2V5ICE9PSBERUNLX0tFWSAmJiBrZXkgIT09IFwicG9zaXRpb25cIilcbiAgICAgIDogW107XG5cbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiB2aXNpYmxlKSB7XG4gICAgICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICBzcGFuLmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy1pdGVtXCI7XG4gICAgICBjb25zdCBrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0cm9uZ1wiKTtcbiAgICAgIGsudGV4dENvbnRlbnQgPSBrZXk7XG4gICAgICBzcGFuLmFwcGVuZENoaWxkKGspO1xuICAgICAgc3Bhbi5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIjogXCIgKyBmb3JtYXRWYWx1ZSh2YWx1ZSkpKTtcbiAgICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgIH1cblxuICAgIC8vIEJyb2tlbiBkZWNrIGxpbmtzIFx1MjE5MiB3YXJuaW5nIGNoaXAgc28gZGVjayBhdXRob3JzIHNwb3QgdHlwb3NcbiAgICBjb25zdCBicm9rZW4gPSBmaWxlID8gdGhpcy5icm9rZW5EZWNrTGlua3MoZmlsZSkgOiBbXTtcbiAgICBpZiAoYnJva2VuLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHdhcm4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgIHdhcm4uY2xhc3NOYW1lID0gXCJuYXRpdmUtc2xpZGVzLXdhcm5cIjtcbiAgICAgIHdhcm4udGV4dENvbnRlbnQgPSBcIlx1MjZBMCBcIiArIGJyb2tlbi5qb2luKFwiLCBcIik7XG4gICAgICB3YXJuLnRpdGxlID0gXCJCcm9rZW4gZGVjayBsaW5rKHMpIFx1MjAxNCB0aGUgdGFyZ2V0IG5vdGUgZG9lcyBub3QgZXhpc3RcIjtcbiAgICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKHdhcm4pO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBCb3R0b20tcmlnaHQ6IFdZU0lXWUcgbW9kZSB0b2dnbGUgKGRlY2sgbm90ZXMgb25seSkgXHUyNTAwXHUyNTAwXG4gICAgaWYgKGlzQ2FyZCkge1xuICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgIGJ0bi5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtd3lzaXd5Zy1idG5cIiArICh0aGlzLnNldHRpbmdzLnd5c2l3eWdNb2RlID8gXCIgaXMtYWN0aXZlXCIgOiBcIlwiKTtcbiAgICAgIGJ0bi50ZXh0Q29udGVudCA9IHRoaXMuc2V0dGluZ3Mud3lzaXd5Z01vZGUgPyBcIldZU0lXWUc6IE9uXCIgOiBcIldZU0lXWUc6IE9mZlwiO1xuICAgICAgYnRuLnRpdGxlID0gXCJUb2dnbGUgV1lTSVdZRyBtb2RlIFx1MjAxNCB1bmlmaWVkIHR5cG9ncmFwaHkgYmV0d2VlbiBlZGl0IGFuZCByZWFkaW5nXCI7XG4gICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMudG9nZ2xlV3lzaXd5ZygpKTtcbiAgICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKGJ0bik7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEJvdHRvbS1yaWdodDogYXV0by1jb21wdXRlZCBwYWdlIG51bWJlciBcdTI1MDBcdTI1MDBcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5zaG93UGFnZU51bWJlciAmJiBkZWNrKSB7XG4gICAgICBjb25zdCBwYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICBwYWdlLmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy1wYWdlXCI7XG4gICAgICAvLyBjaGFpblswXSBpcyB0aGUgb3ZlcnZpZXcgbm90ZTsgc2xpZGVzIHN0YXJ0IGF0IGluZGV4IDEgXHUyMTkyIFwiUGFnZSAxXCJcbiAgICAgIHBhZ2UudGV4dENvbnRlbnQgPSBkZWNrLmluZGV4ID09PSAwID8gXCJPdmVydmlld1wiIDogYFBhZ2UgJHtkZWNrLmluZGV4fWA7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChwYWdlKTtcbiAgICB9XG5cbiAgICAvLyBIaWRlIHRoZSBiYXIgZW50aXJlbHkgd2hlbiBpdCBoYXMgbm90aGluZyB0byBkaXNwbGF5IChubyBwcm9wZXJ0aWVzLFxuICAgIC8vIGFuZCBub3QgcGFydCBvZiBhIGRlY2spXG4gICAgdGhpcy5iYXIuc3R5bGUuZGlzcGxheSA9IHRoaXMuYmFyLmNoaWxkRWxlbWVudENvdW50ID09PSAwID8gXCJub25lXCIgOiBcIlwiO1xuICB9XG5cbiAgLyoqIEJ1aWxkIGEgXHUyNUMwIC8gXHUyNUI2IG5hdmlnYXRpb24gYnV0dG9uOyBgZGlzYWJsZWRgIHJlbmRlcnMgaXQgbGlnaHQgZ3JheS9pbmFjdGl2ZSAqL1xuICBwcml2YXRlIG5hdkJ1dHRvbihcbiAgICBsYWJlbDogc3RyaW5nLFxuICAgIHRpcDogc3RyaW5nLFxuICAgIG9uQ2xpY2s6ICgpID0+IHZvaWQsXG4gICAgZGlzYWJsZWQgPSBmYWxzZSxcbiAgKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgYnRuLmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy1uYXYtYnRuXCI7XG4gICAgYnRuLnRleHRDb250ZW50ID0gbGFiZWw7XG4gICAgYnRuLnRpdGxlID0gdGlwO1xuICAgIGJ0bi5kaXNhYmxlZCA9IGRpc2FibGVkO1xuICAgIGlmICghZGlzYWJsZWQpIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25DbGljayk7XG4gICAgcmV0dXJuIGJ0bjtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZWFzdXJlIHRoZSB0b3AgdGFiIGJhciBhbmQgZXhwb3NlIGl0cyBoZWlnaHQgYXMgdGhlIENTUyB2YXJpYWJsZVxuICAgKiAtLW5hdGl2ZS1zbGlkZXMtdGFiYmFyLWhlaWdodC4gVGhlIGJhciBpcyBoaWRkZW4gaW4gV1lTSVdZRyByZWFkaW5nXG4gICAqIHZpZXcsIHNvIHRoZSBsYXN0IG1lYXN1cmVkIHZhbHVlIGlzIGNhY2hlZCBhbmQgcmV1c2VkIHRoZXJlLlxuICAgKi9cbiAgcHJpdmF0ZSBzeW5jVGFiQmFySGVpZ2h0KCk6IHZvaWQge1xuICAgIGNvbnN0IHRhYkJhciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFxuICAgICAgXCIud29ya3NwYWNlLXRhYnMubW9kLXRvcCAud29ya3NwYWNlLXRhYi1oZWFkZXItY29udGFpbmVyXCIsXG4gICAgKTtcbiAgICBpZiAodGFiQmFyICYmIHRhYkJhci5vZmZzZXRIZWlnaHQgPiAwKSB0aGlzLnRhYkJhckhlaWdodCA9IHRhYkJhci5vZmZzZXRIZWlnaHQ7XG4gICAgaWYgKHRoaXMudGFiQmFySGVpZ2h0ID4gMCkge1xuICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KFxuICAgICAgICBcIi0tbmF0aXZlLXNsaWRlcy10YWJiYXItaGVpZ2h0XCIsXG4gICAgICAgIGAke3RoaXMudGFiQmFySGVpZ2h0fXB4YCxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE5vIG1lYXN1cmVtZW50IHlldCAodGFiIGJhciBoaWRkZW4gc2luY2UgbG9hZCkgXHUyMDE0IGxldCB0aGUgQ1NTXG4gICAgICAvLyBmYWxsYmFjayB2YWx1ZSBhcHBseS5cbiAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5yZW1vdmVQcm9wZXJ0eShcIi0tbmF0aXZlLXNsaWRlcy10YWJiYXItaGVpZ2h0XCIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTeW5jIHRoZSBmdWxsc2NyZWVuIHN0YXRlOiBhZGQgdGhlIGNsYXNzICsgcmVxdWVzdCBPUyBmdWxsc2NyZWVuLCBvciByZXN0b3JlICovXG4gIHByaXZhdGUgc3luY0Z1bGxzY3JlZW4oYWN0aXZlOiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZnVsbHNjcmVlbiA9PT0gYWN0aXZlKSByZXR1cm47IC8vIG5vdGhpbmcgdG8gZG9cbiAgICB0aGlzLmZ1bGxzY3JlZW4gPSBhY3RpdmU7XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QudG9nZ2xlKFwibmF0aXZlLXNsaWRlcy1mdWxsc2NyZWVuXCIsIGFjdGl2ZSk7XG5cbiAgICAvLyBSZXF1ZXN0IE9TLWxldmVsIGZ1bGxzY3JlZW4gd2hlbiBlbnRlcmluZyAoT2JzaWRpYW4gcnVucyBvbiBFbGVjdHJvbiBhbmRcbiAgICAvLyBzdXBwb3J0cyB0aGUgRnVsbHNjcmVlbiBBUEkpOyBmYWlsdXJlcyAoZS5nLiBpbiBhIHBsYWluIGJyb3dzZXIpIGFyZVxuICAgIC8vIGlnbm9yZWQgc2lsZW50bHkgXHUyMDE0IHRoZSBcImhpZGUgc2lkZWJhcnNcIiBlZmZlY3Qgc3RpbGwgYXBwbGllcy5cbiAgICBpZiAoYWN0aXZlKSB7XG4gICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4/LigpLmNhdGNoKCgpID0+IHt9KTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50KSB7XG4gICAgICBkb2N1bWVudC5leGl0RnVsbHNjcmVlbj8uKCkuY2F0Y2goKCkgPT4ge30pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGUgdGhlIFdZU0lXWUcgbW9kZSAocGVyc2lzdGVkOyBvbmx5IHJlYWNoYWJsZSBvbiBkZWNrIG5vdGVzKS5cbiAgICogVG9nZ2xpbmcgZnJvbSByZWFkaW5nIHZpZXcganVtcHMgaW50byB0aGUgV1lTSVdZRyBlZGl0IHZpZXcsIHNvIHRoZVxuICAgKiB1bmlmaWVkIHR5cG9ncmFwaHkgaXMgaW1tZWRpYXRlbHkgdmlzaWJsZSB3aGVyZSB0aGUgdXNlciB3b3Jrcy5cbiAgICovXG4gIHByaXZhdGUgdG9nZ2xlV3lzaXd5ZygpOiB2b2lkIHtcbiAgICB0aGlzLnNldHRpbmdzLnd5c2l3eWdNb2RlID0gIXRoaXMuc2V0dGluZ3Mud3lzaXd5Z01vZGU7XG4gICAgdm9pZCB0aGlzLnNhdmVTZXR0aW5ncygpO1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICh2aWV3ICYmIHZpZXcuZ2V0TW9kZSgpID09PSBcInByZXZpZXdcIikge1xuICAgICAgLy8gTGVhdmUgcmVhZGluZyB2aWV3IHZpYSB0aGUgcHVibGljIHZpZXctc3RhdGUgQVBJIChzYW1lIGFzIEVzYylcbiAgICAgIGNvbnN0IHN0YXRlID0gdmlldy5sZWFmLmdldFZpZXdTdGF0ZSgpO1xuICAgICAgc3RhdGUuc3RhdGUgPSB7IC4uLnN0YXRlLnN0YXRlLCBtb2RlOiBcInNvdXJjZVwiIH07XG4gICAgICB2b2lkIHZpZXcubGVhZi5zZXRWaWV3U3RhdGUoc3RhdGUsIHsgZm9jdXM6IGZhbHNlIH0pO1xuICAgIH1cbiAgICB0aGlzLnJlZnJlc2goKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEdW1wIGtleSB0eXBvZ3JhcGh5IGNvbXB1dGVkIHN0eWxlcyArIENTUyB2YXJpYWJsZXMgdG8gdGhlIGNvbnNvbGUuXG4gICAqIFJ1biBvbmNlIGluIGVkaXQgdmlldyBhbmQgb25jZSBpbiByZWFkaW5nIHZpZXcgKHNhbWUgbm90ZSksIHRoZW4gY29tcGFyZVxuICAgKiB0aGUgbnVtYmVycyBcdTIwMTQgdGhhdCBpcyBob3cgdGhlIFdZU0lXWUcgdHlwb2dyYXBoeSBhbGlnbm1lbnQgQ1NTIGlzIHR1bmVkXG4gICAqIHdpdGhvdXQgZXllYmFsbGluZyBzY3JlZW5zaG90cy5cbiAgICovXG4gIHByaXZhdGUgZGVidWdTdHlsZXMoKTogdm9pZCB7XG4gICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgaWYgKCF2aWV3KSB7XG4gICAgICBuZXcgTm90aWNlKFwiTmF0aXZlIFNsaWRlczogbm8gYWN0aXZlIE1hcmtkb3duIG5vdGVcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGlzRWRpdCA9IHZpZXcuZ2V0TW9kZSgpID09PSBcInNvdXJjZVwiO1xuICAgIGNvbnN0IGNvbnRlbnRFbCA9IHZpZXcuY29udGVudEVsO1xuICAgIC8vIEZpcnN0IG1hdGNoaW5nIGNhbmRpZGF0ZSB3aW5zIFx1MjAxNCBlZGl0IChjbTYpIGFuZCByZWFkaW5nIHVzZVxuICAgIC8vIGRpZmZlcmVudCBlbGVtZW50IHN0cnVjdHVyZXMgKGUuZy4gbm8gcHJlL2Jsb2NrcXVvdGUgaW4gY202KS5cbiAgICBjb25zdCBwaWNrID0gKHNlbHM6IHN0cmluZ1tdKTogSFRNTEVsZW1lbnQgfCBudWxsID0+IHtcbiAgICAgIGZvciAoY29uc3Qgc2VsIG9mIHNlbHMpIHtcbiAgICAgICAgY29uc3QgZWwgPSBjb250ZW50RWwucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oc2VsKTtcbiAgICAgICAgaWYgKGVsKSByZXR1cm4gZWw7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIGNvbnN0IHN0eWxlID0gKGVsOiBIVE1MRWxlbWVudCB8IG51bGwsIHByb3BzOiBzdHJpbmdbXSk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPT4ge1xuICAgICAgaWYgKCFlbCkgcmV0dXJuIHsgXCIobWlzc2luZylcIjogXCJlbGVtZW50IG5vdCBpbiB0aGlzIG5vdGVcIiB9O1xuICAgICAgY29uc3QgY3MgPSBnZXRDb21wdXRlZFN0eWxlKGVsKTtcbiAgICAgIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgICAgZm9yIChjb25zdCBwIG9mIHByb3BzKSB7XG4gICAgICAgIGNvbnN0IHYgPSBjcy5nZXRQcm9wZXJ0eVZhbHVlKHApLnRyaW0oKTtcbiAgICAgICAgaWYgKHYpIG91dFtwXSA9IHY7XG4gICAgICB9XG4gICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgY29uc3QgdmFycyA9IGdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSk7XG4gICAgY29uc3QgY3NzVmFyID0gKG5hbWU6IHN0cmluZyk6IHN0cmluZyA9PiB2YXJzLmdldFByb3BlcnR5VmFsdWUobmFtZSkudHJpbSgpO1xuXG4gICAgY29uc3QgY29udGFpbmVyID0gcGljayhbXG4gICAgICBpc0VkaXRcbiAgICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IC5jbS1jb250ZW50XCJcbiAgICAgICAgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlld1wiLFxuICAgIF0pO1xuICAgIGNvbnN0IHBhcmEgPSBwaWNrKFtcbiAgICAgIGlzRWRpdFxuICAgICAgICA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLmNtLWxpbmVcIlxuICAgICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IHBcIixcbiAgICBdKTtcbiAgICBjb25zdCBoMSA9IHBpY2soW1xuICAgICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuY20taGVhZGVyLTFcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyBoMVwiLFxuICAgICAgaXNFZGl0XG4gICAgICAgID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiBoMVwiXG4gICAgICAgIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgaDFcIixcbiAgICBdKTtcbiAgICBjb25zdCBsaXN0SXRlbSA9IHBpY2soW1xuICAgICAgaXNFZGl0XG4gICAgICAgID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuSHlwZXJNRC1saXN0LWxpbmVcIlxuICAgICAgICA6IFwiLm1hcmtkb3duLXByZXZpZXctdmlldyB1bCA+IGxpXCIsXG4gICAgICBpc0VkaXQgPyBcIi5IeXBlck1ELWxpc3QtbGluZVwiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgdWwgPiBsaVwiLFxuICAgIF0pO1xuICAgIGNvbnN0IHByZSA9IHBpY2soW1xuICAgICAgaXNFZGl0XG4gICAgICAgID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiBwcmVcIlxuICAgICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IHByZVwiLFxuICAgICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuY20tZWRpdGluZyBwcmVcIiA6IFwiLm1hcmtkb3duLXByZXZpZXctdmlldyBwcmVcIixcbiAgICAgIGlzRWRpdCA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLkh5cGVyTUQtY29kZWJsb2NrXCIgOiBcIi5tYXJrZG93bi1wcmV2aWV3LXZpZXcgcHJlXCIsXG4gICAgXSk7XG4gICAgY29uc3QgcXVvdGUgPSBwaWNrKFtcbiAgICAgIGlzRWRpdCA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgYmxvY2txdW90ZVwiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IGJsb2NrcXVvdGVcIixcbiAgICAgIGlzRWRpdFxuICAgICAgICA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLkh5cGVyTUQtcXVvdGVcIlxuICAgICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IGJsb2NrcXVvdGVcIixcbiAgICBdKTtcbiAgICBjb25zdCBpbmxpbmVDb2RlID0gcGljayhbXG4gICAgICBpc0VkaXQgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IGNvZGVcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyBjb2RlXCIsXG4gICAgICBpc0VkaXRcbiAgICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IC5jbS1pbmxpbmUtY29kZVwiXG4gICAgICAgIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgY29kZVwiLFxuICAgIF0pO1xuXG4gICAgLy8gU3RydWN0dXJlIHByb2JlIChlZGl0IHZpZXcgb25seSk6IHVuaXF1ZSBlbGVtZW50IHRhZ3MgaW5zaWRlIHRoZVxuICAgIC8vIGVkaXRvciBcdTIwMTQgcmV2ZWFscyBob3cgY202IHJlbmRlcnMgY29kZSBibG9ja3MgZXRjLiB3aGVuIHRoZSB1c3VhbFxuICAgIC8vIHNlbGVjdG9ycyBkbyBub3QgbWF0Y2guXG4gICAgY29uc3QgZG9tVGFnczogc3RyaW5nW10gPSBbXTtcbiAgICBpZiAoaXNFZGl0KSB7XG4gICAgICBjb25zdCB0YWdzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICBjb250ZW50RWxcbiAgICAgICAgLnF1ZXJ5U2VsZWN0b3JBbGwoXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAqXCIpXG4gICAgICAgIC5mb3JFYWNoKChlbCkgPT4gdGFncy5hZGQoZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpKSk7XG4gICAgICBkb21UYWdzLnB1c2goLi4udGFncyk7XG4gICAgfVxuXG4gICAgY29uc3QgZHVtcCA9IHtcbiAgICAgIG1vZGU6IGlzRWRpdCA/IFwiZWRpdCAoTGl2ZSBQcmV2aWV3KVwiIDogXCJyZWFkaW5nXCIsXG4gICAgICAvLyBBbGlnbm1lbnQgQ1NTIChydWxlcyA3LzdiKSBvbmx5IGFwcGxpZXMgd2hlbiBXWVNJV1lHIGlzIG9uXG4gICAgICB3eXNpd3lnQWN0aXZlOiBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5jb250YWlucyhcIm5hdGl2ZS1zbGlkZXMtd3lzaXd5Z1wiKSxcbiAgICAgIGRvbVRhZ3M6IGlzRWRpdCA/IGRvbVRhZ3MgOiB1bmRlZmluZWQsXG4gICAgICBjb250YWluZXI6IHN0eWxlKGNvbnRhaW5lciwgW1xuICAgICAgICBcImZvbnQtZmFtaWx5XCIsXG4gICAgICAgIFwiZm9udC1zaXplXCIsXG4gICAgICAgIFwibGluZS1oZWlnaHRcIixcbiAgICAgICAgXCJtYXgtd2lkdGhcIixcbiAgICAgICAgXCJ3aWR0aFwiLFxuICAgICAgICBcInBhZGRpbmctdG9wXCIsXG4gICAgICAgIFwicGFkZGluZy1yaWdodFwiLFxuICAgICAgICBcInBhZGRpbmctYm90dG9tXCIsXG4gICAgICAgIFwicGFkZGluZy1sZWZ0XCIsXG4gICAgICAgIFwiY29sb3JcIixcbiAgICAgIF0pLFxuICAgICAgcGFyYWdyYXBoOiBzdHlsZShwYXJhLCBbXG4gICAgICAgIFwiZm9udC1zaXplXCIsXG4gICAgICAgIFwibGluZS1oZWlnaHRcIixcbiAgICAgICAgXCJtYXJnaW4tdG9wXCIsXG4gICAgICAgIFwibWFyZ2luLWJvdHRvbVwiLFxuICAgICAgICBcIm1hcmdpbi1sZWZ0XCIsXG4gICAgICAgIFwibWFyZ2luLXJpZ2h0XCIsXG4gICAgICAgIFwidGV4dC1pbmRlbnRcIixcbiAgICAgIF0pLFxuICAgICAgaDE6IHN0eWxlKGgxLCBbXCJmb250LXNpemVcIiwgXCJsaW5lLWhlaWdodFwiLCBcImZvbnQtd2VpZ2h0XCIsIFwibWFyZ2luLXRvcFwiLCBcIm1hcmdpbi1ib3R0b21cIl0pLFxuICAgICAgbGlzdEl0ZW06IHN0eWxlKGxpc3RJdGVtLCBbXG4gICAgICAgIFwicGFkZGluZy1sZWZ0XCIsXG4gICAgICAgIFwibWFyZ2luLWxlZnRcIixcbiAgICAgICAgXCJtYXJnaW4tcmlnaHRcIixcbiAgICAgICAgXCJ0ZXh0LWluZGVudFwiLFxuICAgICAgICBcImxpbmUtaGVpZ2h0XCIsXG4gICAgICBdKSxcbiAgICAgIGNvZGVCbG9jazogc3R5bGUocHJlLCBbXG4gICAgICAgIFwiZm9udC1zaXplXCIsXG4gICAgICAgIFwibGluZS1oZWlnaHRcIixcbiAgICAgICAgXCJwYWRkaW5nLXRvcFwiLFxuICAgICAgICBcInBhZGRpbmctcmlnaHRcIixcbiAgICAgICAgXCJwYWRkaW5nLWJvdHRvbVwiLFxuICAgICAgICBcInBhZGRpbmctbGVmdFwiLFxuICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIixcbiAgICAgICAgXCJib3JkZXItcmFkaXVzXCIsXG4gICAgICBdKSxcbiAgICAgIGJsb2NrcXVvdGU6IHN0eWxlKHF1b3RlLCBbXG4gICAgICAgIFwicGFkZGluZy10b3BcIixcbiAgICAgICAgXCJwYWRkaW5nLXJpZ2h0XCIsXG4gICAgICAgIFwicGFkZGluZy1ib3R0b21cIixcbiAgICAgICAgXCJwYWRkaW5nLWxlZnRcIixcbiAgICAgICAgXCJtYXJnaW4tdG9wXCIsXG4gICAgICAgIFwibWFyZ2luLWJvdHRvbVwiLFxuICAgICAgICBcImJvcmRlci1sZWZ0LXdpZHRoXCIsXG4gICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiLFxuICAgICAgXSksXG4gICAgICBpbmxpbmVDb2RlOiBzdHlsZShpbmxpbmVDb2RlLCBbXG4gICAgICAgIFwiZm9udC1zaXplXCIsXG4gICAgICAgIFwicGFkZGluZy10b3BcIixcbiAgICAgICAgXCJwYWRkaW5nLWJvdHRvbVwiLFxuICAgICAgICBcInBhZGRpbmctbGVmdFwiLFxuICAgICAgICBcInBhZGRpbmctcmlnaHRcIixcbiAgICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCIsXG4gICAgICAgIFwiYm9yZGVyLXJhZGl1c1wiLFxuICAgICAgXSksXG4gICAgICBjc3NWYXJpYWJsZXM6IHtcbiAgICAgICAgXCItLWZvbnQtdGV4dFwiOiBjc3NWYXIoXCItLWZvbnQtdGV4dFwiKSxcbiAgICAgICAgXCItLWxpbmUtaGVpZ2h0LW5vcm1hbFwiOiBjc3NWYXIoXCItLWxpbmUtaGVpZ2h0LW5vcm1hbFwiKSxcbiAgICAgICAgXCItLWgxLXNpemVcIjogY3NzVmFyKFwiLS1oMS1zaXplXCIpLFxuICAgICAgICBcIi0taDEtbGluZS1oZWlnaHRcIjogY3NzVmFyKFwiLS1oMS1saW5lLWhlaWdodFwiKSxcbiAgICAgICAgXCItLWgxLW1hcmdpbi10b3BcIjogY3NzVmFyKFwiLS1oMS1tYXJnaW4tdG9wXCIpLFxuICAgICAgICBcIi0taDEtbWFyZ2luLWJvdHRvbVwiOiBjc3NWYXIoXCItLWgxLW1hcmdpbi1ib3R0b21cIiksXG4gICAgICAgIFwiLS1wLXNwYWNpbmdcIjogY3NzVmFyKFwiLS1wLXNwYWNpbmdcIiksXG4gICAgICAgIFwiLS1saXN0LXNwYWNpbmdcIjogY3NzVmFyKFwiLS1saXN0LXNwYWNpbmdcIiksXG4gICAgICAgIFwiLS1saXN0LWluZGVudFwiOiBjc3NWYXIoXCItLWxpc3QtaW5kZW50XCIpLFxuICAgICAgICBcIi0tY29kZS1zaXplXCI6IGNzc1ZhcihcIi0tY29kZS1zaXplXCIpLFxuICAgICAgICBcIi0tY29kZS1wYWRkaW5nXCI6IGNzc1ZhcihcIi0tY29kZS1wYWRkaW5nXCIpLFxuICAgICAgICBcIi0tY29kZS1yYWRpdXNcIjogY3NzVmFyKFwiLS1jb2RlLXJhZGl1c1wiKSxcbiAgICAgICAgXCItLWJsb2NrcXVvdGUtcGFkZGluZ1wiOiBjc3NWYXIoXCItLWJsb2NrcXVvdGUtcGFkZGluZ1wiKSxcbiAgICAgICAgXCItLWJsb2NrcXVvdGUtYm9yZGVyLXRoaWNrbmVzc1wiOiBjc3NWYXIoXCItLWJsb2NrcXVvdGUtYm9yZGVyLXRoaWNrbmVzc1wiKSxcbiAgICAgICAgXCItLWZpbGUtbWFyZ2luc1wiOiBjc3NWYXIoXCItLWZpbGUtbWFyZ2luc1wiKSxcbiAgICAgICAgXCItLWZpbGUtbGluZS13aWR0aFwiOiBjc3NWYXIoXCItLWZpbGUtbGluZS13aWR0aFwiKSxcbiAgICAgICAgXCItLW5vcm1hbC1mb250LXNpemVcIjogY3NzVmFyKFwiLS1ub3JtYWwtZm9udC1zaXplXCIpLFxuICAgICAgICBcIi0tZm9udC10ZXh0LXNpemVcIjogY3NzVmFyKFwiLS1mb250LXRleHQtc2l6ZVwiKSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIFwiW25hdGl2ZS1zbGlkZXMgZGVidWctc3R5bGVzXSBcIiArXG4gICAgICAgIChpc0VkaXQgPyBcIkVESVRcIiA6IFwiUkVBRElOR1wiKSArXG4gICAgICAgIFwiXFxuXCIgK1xuICAgICAgICBKU09OLnN0cmluZ2lmeShkdW1wLCBudWxsLCAyKSxcbiAgICApO1xuICAgIGNvbnN0IHd5c0hpbnQgPSBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5jb250YWlucyhcIm5hdGl2ZS1zbGlkZXMtd3lzaXd5Z1wiKVxuICAgICAgPyBcIldZU0lXWUcgaXMgT04gXHUyMDE0IGFsaWdubWVudCBydWxlcyBhY3RpdmUuXCJcbiAgICAgIDogXCJXWVNJV1lHIGlzIE9GRiBcdTIwMTQgYWxpZ25tZW50IHJ1bGVzIE5PVCBhY3RpdmUuIE9uIGEgZGVjayBub3RlLCB0b2dnbGUgaXQgb24gKE1vZCtTaGlmdCtFKSBhbmQgcmVydW4uXCI7XG4gICAgLy8gVGhlIGVkaXQgdmlldyBvbmx5IHJlbmRlcnMgdGhlIHZpc2libGUgYXJlYSAoQ29kZU1pcnJvciB2aXJ0dWFsXG4gICAgLy8gcmVuZGVyaW5nKSBcdTIwMTQgb2ZmLXNjcmVlbiBlbGVtZW50cyBhcmUgbm90IGluIHRoZSBET00sIHNvIHNjcm9sbCB0b1xuICAgIC8vIHRoZSBlbGVtZW50IHlvdSB3YW50IHRvIHNhbXBsZSBiZWZvcmUgcnVubmluZy5cbiAgICBjb25zdCBzY3JvbGxIaW50ID0gaXNFZGl0XG4gICAgICA/IFwiIEVkaXQgdmlldyByZW5kZXJzIG9ubHkgdGhlIHZpc2libGUgYXJlYSBcdTIwMTQgc2Nyb2xsIHRvIHRoZSBjb2RlIGJsb2NrL3RhYmxlL3F1b3RlLCB0aGVuIHJlcnVuLlwiXG4gICAgICA6IFwiXCI7XG4gICAgbmV3IE5vdGljZShcIlR5cG9ncmFwaHkgZHVtcCBcdTIxOTIgQ29uc29sZSAoQ21kK09wdCtJKS4gXCIgKyB3eXNIaW50ICsgc2Nyb2xsSGludCk7XG4gIH1cbn1cblxuLy8gXHUyNTAwXHUyNTAwIFNldHRpbmdzIHRhYiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY2xhc3MgTmF0aXZlU2xpZGVzU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogTmF0aXZlU2xpZGVzUGx1Z2luKSB7XG4gICAgc3VwZXIocGx1Z2luLmFwcCwgcGx1Z2luKTtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIlByb3BlcnRpZXMgQmFyIFx1MDBCNyBTZXR0aW5nc1wiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlNob3cgUHJldmlvdXMvTmV4dCBidXR0b25zXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJTaG93IFx1MjVDMCBcdTI1QjYgYnV0dG9ucyBvbiB0aGUgbGVmdCBvZiB0aGUgYmFyIHdoZW4gdGhlIG5vdGUgYmVsb25ncyB0byBhIGRlY2sgKGhhcyBhIGBkZWNrYCBwcm9wZXJ0eSlcIixcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dOYXZCdXR0b25zKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93TmF2QnV0dG9ucyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMucGx1Z2luLnJlZnJlc2goKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlNob3cgcGFnZSBudW1iZXJcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkF1dG8tY29tcHV0ZWQgZnJvbSB0aGUgZGVjayBjaGFpbiAob3ZlcnZpZXcgcGFnZSBzaG93cyBcdTIwMUNPdmVydmlld1x1MjAxRCk7IHNob3duIGF0IHRoZSBib3R0b20tcmlnaHRcIixcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dQYWdlTnVtYmVyKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93UGFnZU51bWJlciA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMucGx1Z2luLnJlZnJlc2goKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkF1dG8gZnVsbHNjcmVlbiBpbiByZWFkaW5nIHZpZXdcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkVudGVyIHRoZSBpbW1lcnNpdmUgZnVsbHNjcmVlbiByZWFkaW5nIG1vZGUgYXV0b21hdGljYWxseSB3aGVuIHN3aXRjaGluZyB0byByZWFkaW5nIHZpZXcgKGFsc28gdG9nZ2xlYWJsZSB2aWEgdGhlIFBhdXNlL1Jlc3VtZSBBdXRvIEZ1bGxzY3JlZW4gY29tbWFuZClcIixcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9GdWxsc2NyZWVuKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvRnVsbHNjcmVlbiA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMucGx1Z2luLnJlZnJlc2goKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIldZU0lXWUcgbW9kZSAoZGVjayBub3RlcylcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkltbWVyc2l2ZSBkZWNrIG1vZGU6IGhpZGVzIHRoZSB0YWIgYmFyIGFuZCBzaWRlYmFycywgc2hvd3MgdGhlIGJvdHRvbSBiYXIgYXQgdGFiLWJhciBoZWlnaHQgaW4gYm90aCB2aWV3cywgYW5kIGhpZGVzIGluLW5vdGUgcHJvcGVydGllcyB3aGlsZSBlZGl0aW5nLiBUb2dnbGUgZnJvbSB0aGUgY29tbWFuZCBwYWxldHRlLCB0aGUgTW9kK1NoaWZ0K0UgaG90a2V5LCBvciB0aGUgYm90dG9tLWJhciBidXR0b24uXCIsXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy53eXNpd3lnTW9kZSkub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mud3lzaXd5Z01vZGUgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJOYXZpZ2F0aW9uIGhvdGtleXNcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkRlZmF1bHQ6IFByZXZpb3VzIFBhZ2UgTW9kK1NoaWZ0K1x1MjE5MCwgTmV4dCBQYWdlIE1vZCtTaGlmdCtcdTIxOTIuIFJlYmluZCB1bmRlciBTZXR0aW5ncyBcdTIxOTIgSG90a2V5cy5cIixcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoXCJPcGVuIEhvdGtleXMgU2V0dGluZ3NcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgLy8gT3BlbiBPYnNpZGlhbidzIGhvdGtleXMgc2V0dGluZ3MgcGFnZSAoaW50ZXJuYWwgQVBJOyBpZ25vcmUgZmFpbHVyZXMpXG4gICAgICAgICAgKFxuICAgICAgICAgICAgdGhpcy5hcHAgYXMgdW5rbm93biBhcyB7IHNldHRpbmc/OiB7IG9wZW5UYWJCeUlkPzogKGlkOiBzdHJpbmcpID0+IHZvaWQgfSB9XG4gICAgICAgICAgKS5zZXR0aW5nPy5vcGVuVGFiQnlJZD8uKFwiaG90a2V5c1wiKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICB9XG59XG5cbi8vIFx1MjUwMFx1MjUwMCBIZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4vKiogUmVtb3ZlIGFsbCBjaGlsZHJlbiBvZiBhbiBlbGVtZW50ICovXG5mdW5jdGlvbiBjbGVhckNoaWxkcmVuKGVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICB3aGlsZSAoZWwuZmlyc3RDaGlsZCkgZWwucmVtb3ZlQ2hpbGQoZWwuZmlyc3RDaGlsZCk7XG59XG4iLCAiLyoqXG4gKiBkZWNrLnRzIFx1MjAxNCBQdXJlIGRlY2stcmVzb2x1dGlvbiBjb3JlIGZvciBuYXRpdmUtc2xpZGVzLlxuICpcbiAqIEV2ZXJ5dGhpbmcgaW4gdGhpcyBtb2R1bGUgaXMgZnJlZSBvZiBPYnNpZGlhbiBydW50aW1lIGRlcGVuZGVuY2llcyBzbyBpdCBjYW5cbiAqIGJlIHVuaXQgdGVzdGVkIGRpcmVjdGx5IChzZWUgdGVzdC9kZWNrLnRlc3QudHMpLiBtYWluLnRzIGFkYXB0cyB0aGUgdmF1bHRcbiAqIChtZXRhZGF0YUNhY2hlKSB0byB0aGlzIHB1cmUgaW50ZXJmYWNlOiBpdCByZXNvbHZlcyBgZGVja2AgcHJvcGVydGllcyB0b1xuICogbm90ZSBwYXRocywgdGhlbiBoYW5kcyB0aGUgcGF0aCBncmFwaCB0byBjb21wdXRlRGVjaygpLlxuICovXG5cbi8qKiBBIGRlY2sgbGluayBsaXN0IG5ldmVyIGhvbGRzIG1vcmUgdGhhbiB0d28gZW50cmllcyAqL1xuZXhwb3J0IGNvbnN0IE1BWF9ERUNLX0xJTktTID0gMjtcblxuLyoqIFJlc3VsdCBvZiByZXNvbHZpbmcgYSBub3RlJ3MgcG9zaXRpb24gaW5zaWRlIGEgZGVjayAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWNrSW5mbyB7XG4gIC8qKiBDaGFpbiBvZiBub3RlIHBhdGhzOiBbMF0gaXMgdGhlIG92ZXJ2aWV3IG5vdGUsIHRoZW4gc2xpZGVzIGluIG9yZGVyICovXG4gIGNoYWluOiBzdHJpbmdbXTtcbiAgLyoqIEluZGV4IG9mIHRoZSBjdXJyZW50IG5vdGUgaW5zaWRlIGNoYWluICovXG4gIGluZGV4OiBudW1iZXI7XG59XG5cbi8qKlxuICogUmVzb2x2ZSBhIG5vdGUncyBwb3NpdGlvbiBpbnNpZGUgaXRzIGRlY2sgYnkgd2Fsa2luZyB0aGUgbGluayBjaGFpbi5cbiAqXG4gKiBDb252ZW50aW9uIGZvciB0aGUgc2luZ2xlIGBkZWNrYCBwcm9wZXJ0eSAodXAgdG8gdHdvIGxpbmtzKTpcbiAqICAgLSBvdmVydmlldyBub3RlOiBvbmUgbGluayBcdTIxOTIgdGhhdCBsaW5rIElTIHRoZSBmaXJzdCBwYWdlO1xuICogICAtIHNsaWRlIG5vdGU6ICAgIGZpcnN0IGxpbmsgXHUyMTkyIHRoZSBvdmVydmlldyBwYWdlLCBzZWNvbmQgbGluayBcdTIxOTIgbmV4dCBzbGlkZVxuICogICAgICAgICAgICAgICAgICAgIChubyBzZWNvbmQgbGluayBvbiB0aGUgbGFzdCBzbGlkZSkuXG4gKlxuICogYGdldExpbmtzKHBhdGgpYCBtdXN0IHJldHVybiB0aGUgcmVzb2x2ZWQgbm90ZSBwYXRocyBvZiB0aGUgYGRlY2tgIHByb3BlcnR5XG4gKiBvZiB0aGUgbm90ZSBhdCBgcGF0aGAgKGVtcHR5IHdoZW4gdGhlIG5vdGUgaGFzIG5vbmUsIG9yIGl0cyBsaW5rcyBhcmVcbiAqIGJyb2tlbiBcdTIwMTQgYSBicm9rZW4gbGluayBzaW1wbHkgZW5kcyBvciBleGNsdWRlcyB0aGUgY2hhaW4sIG5ldmVyIGNyYXNoZXMpLlxuICpcbiAqIFJldHVybnMgdGhlIGZ1bGwgY2hhaW4gKFtvdmVydmlldywgc2xpZGUgMSwgc2xpZGUgMiwgXHUyMDI2XSkgYW5kIHRoZSBjdXJyZW50XG4gKiBub3RlJ3MgaW5kZXgsIG9yIG51bGwgd2hlbiB0aGUgbm90ZSBpcyBub3QgcGFydCBvZiBhbnkgZGVjay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVEZWNrKFxuICBjdXJyZW50UGF0aDogc3RyaW5nLFxuICBnZXRMaW5rczogKHBhdGg6IHN0cmluZykgPT4gc3RyaW5nW10sXG4pOiBEZWNrSW5mbyB8IG51bGwge1xuICBjb25zdCBjdXJyZW50TGlua3MgPSBnZXRMaW5rcyhjdXJyZW50UGF0aCk7XG4gIGlmIChjdXJyZW50TGlua3MubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICBsZXQgb3ZlcnZpZXc6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgbGV0IGZpcnN0UGFnZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gIGlmIChjdXJyZW50TGlua3MubGVuZ3RoID49IDIpIHtcbiAgICAvLyBBIHNsaWRlOiBmaXJzdCBsaW5rIGlzIHRoZSBvdmVydmlldyBwYWdlXG4gICAgb3ZlcnZpZXcgPSBjdXJyZW50TGlua3NbMF07XG4gICAgZmlyc3RQYWdlID0gZ2V0TGlua3Mob3ZlcnZpZXcpWzBdO1xuICB9IGVsc2Uge1xuICAgIC8vIEEgc2luZ2xlIGxpbms6IGVpdGhlciB3ZSBBUkUgdGhlIG92ZXJ2aWV3IChsaW5rID0gZmlyc3QgcGFnZSksXG4gICAgLy8gb3Igd2UgYXJlIHRoZSBsYXN0IHNsaWRlIChsaW5rID0gb3ZlcnZpZXcgcGFnZSlcbiAgICBjb25zdCBvbmx5ID0gY3VycmVudExpbmtzWzBdO1xuICAgIGNvbnN0IG9ubHlMaW5rcyA9IGdldExpbmtzKG9ubHkpO1xuICAgIGlmIChvbmx5TGlua3NbMF0gPT09IGN1cnJlbnRQYXRoKSB7XG4gICAgICBvdmVydmlldyA9IGN1cnJlbnRQYXRoO1xuICAgICAgZmlyc3RQYWdlID0gb25seTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3ZlcnZpZXcgPSBvbmx5O1xuICAgICAgZmlyc3RQYWdlID0gb25seUxpbmtzWzBdO1xuICAgIH1cbiAgfVxuICBpZiAoIW92ZXJ2aWV3IHx8ICFmaXJzdFBhZ2UpIHJldHVybiBudWxsO1xuXG4gIC8vIFdhbGsgdGhlIGNoYWluOiBvdmVydmlldyBcdTIxOTIgZmlyc3QgcGFnZSBcdTIxOTIgbmV4dCBcdTIxOTIgbmV4dCBcdTIxOTIgXHUyMDI2XG4gIGNvbnN0IGNoYWluOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCB2aXNpdGVkID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHB1c2ggPSAocDogc3RyaW5nIHwgdW5kZWZpbmVkKTogdm9pZCA9PiB7XG4gICAgaWYgKHAgJiYgIXZpc2l0ZWQuaGFzKHApKSB7XG4gICAgICB2aXNpdGVkLmFkZChwKTtcbiAgICAgIGNoYWluLnB1c2gocCk7XG4gICAgfVxuICB9O1xuICBwdXNoKG92ZXJ2aWV3KTtcbiAgcHVzaChmaXJzdFBhZ2UpO1xuICBsZXQgY3VyID0gZmlyc3RQYWdlO1xuICB3aGlsZSAoY3VyKSB7XG4gICAgY29uc3QgbmV4dCA9IGdldExpbmtzKGN1cilbMV07XG4gICAgaWYgKCFuZXh0IHx8IHZpc2l0ZWQuaGFzKG5leHQpKSBicmVhazsgLy8gZW5kIG9mIGRlY2sgb3IgY3ljbGUgZ3VhcmRcbiAgICBwdXNoKG5leHQpO1xuICAgIGN1ciA9IG5leHQ7XG4gIH1cblxuICBjb25zdCBpbmRleCA9IGNoYWluLmluZGV4T2YoY3VycmVudFBhdGgpO1xuICBpZiAoaW5kZXggPT09IC0xKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHsgY2hhaW4sIGluZGV4IH07XG59XG5cbi8qKlxuICogRXh0cmFjdCB1cCB0byBgbWF4YCBub3RlIG5hbWVzIGZyb20gYSBgZGVja2AgcHJvcGVydHkgdmFsdWUuXG4gKiBBY2NlcHRzIGEgc2luZ2xlIHN0cmluZyBvciBhIFlBTUwgbGlzdCBvZiBzdHJpbmdzOyB1bnF1b3RlZCBbW3hdXSB2YWx1ZXMgYXJlXG4gKiBwYXJzZWQgYnkgWUFNTCBhcyBuZXN0ZWQgYXJyYXlzIGFuZCBmbGF0dGVuZWQgaGVyZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RMaW5rcyh2YWx1ZTogdW5rbm93biwgbWF4OiBudW1iZXIgPSBNQVhfREVDS19MSU5LUyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgZmxhdDogdW5rbm93bltdID0gW107XG4gIGNvbnN0IGNvbGxlY3QgPSAodjogdW5rbm93bik6IHZvaWQgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHYpKSB7XG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdikgY29sbGVjdChpdGVtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmxhdC5wdXNoKHYpO1xuICAgIH1cbiAgfTtcbiAgY29sbGVjdCh2YWx1ZSk7XG5cbiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGNvbnN0IGl0ZW0gb2YgZmxhdCkge1xuICAgIGNvbnN0IG5hbWUgPSBleHRyYWN0TGlua1RleHQoaXRlbSk7XG4gICAgaWYgKG5hbWUpIG91dC5wdXNoKG5hbWUpO1xuICAgIGlmIChvdXQubGVuZ3RoID49IG1heCkgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHVwIHRvIGBtYXhgIHJhdyBsaW5rIHN0cmluZ3MgZnJvbSBhIGBkZWNrYCBwcm9wZXJ0eSB2YWx1ZSBcdTIwMTQgdGhlXG4gKiB0cmltbWVkIHZhbHVlcyBleGFjdGx5IGFzIHdyaXR0ZW4gKGFsaWFzIC8gcGF0aCBmb3JtcyBwcmVzZXJ2ZWQpLiBTYW1lXG4gKiBmbGF0dGVuaW5nIHJ1bGVzIGFzIGV4dHJhY3RMaW5rcygpLCBidXQgd2l0aG91dCBleHRyYWN0aW5nIHRoZSB0YXJnZXQgbmFtZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RSYXdMaW5rcyh2YWx1ZTogdW5rbm93biwgbWF4OiBudW1iZXIgPSBNQVhfREVDS19MSU5LUyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgZmxhdDogdW5rbm93bltdID0gW107XG4gIGNvbnN0IGNvbGxlY3QgPSAodjogdW5rbm93bik6IHZvaWQgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHYpKSB7XG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdikgY29sbGVjdChpdGVtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmxhdC5wdXNoKHYpO1xuICAgIH1cbiAgfTtcbiAgY29sbGVjdCh2YWx1ZSk7XG5cbiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGNvbnN0IGl0ZW0gb2YgZmxhdCkge1xuICAgIGlmICh0eXBlb2YgaXRlbSAhPT0gXCJzdHJpbmdcIikgY29udGludWU7XG4gICAgY29uc3QgdHJpbW1lZCA9IGl0ZW0udHJpbSgpO1xuICAgIGlmICghdHJpbW1lZCkgY29udGludWU7XG4gICAgb3V0LnB1c2godHJpbW1lZCk7XG4gICAgaWYgKG91dC5sZW5ndGggPj0gbWF4KSBicmVhaztcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIHRhcmdldCBub3RlIG5hbWUgZnJvbSBhIG1hcmtkb3duIGxpbmsgc3RyaW5nLlxuICogSGFuZGxlcyBzZXZlcmFsIHNoYXBlczpcbiAqICAgXCJbW3NsaWRlLTJdXVwiICAgICAgICBcdTIxOTIgc2xpZGUtMlxuICogICBcIltbc2xpZGUtMnxhbGlhc11dXCIgIFx1MjE5MiBzbGlkZS0yXG4gKiAgIFwiW1tzbGlkZS0yI3NlY3Rpb25dXVwiXHUyMTkyIHNsaWRlLTJcbiAqICAgc2xpZGUtMiAgICAgICAgICAgICAgXHUyMTkyIHNsaWRlLTIgKGJhcmUgZmlsZW5hbWUpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0TGlua1RleHQodmFsdWU6IHVua25vd24pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHRyaW1tZWQgPSB2YWx1ZS50cmltKCk7XG4gIGlmICghdHJpbW1lZCkgcmV0dXJuIG51bGw7XG4gIHJldHVybiB0cmltbWVkLnJlcGxhY2UoL15cXFtcXFsvLCBcIlwiKS5yZXBsYWNlKC9cXF1cXF0kLywgXCJcIikuc3BsaXQoXCJ8XCIpWzBdLnNwbGl0KFwiI1wiKVswXS50cmltKCk7XG59XG5cbi8qKiBSZW5kZXIgYSBwcm9wZXJ0eSB2YWx1ZSBhcyByZWFkYWJsZSB0ZXh0OiBhcnJheXMvb2JqZWN0cyBcdTIxOTIgSlNPTiwgZWxzZSBTdHJpbmcgKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRWYWx1ZSh2YWx1ZTogdW5rbm93bik6IHN0cmluZyB7XG4gIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gXCJcdTIwMTRcIjtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIFN0cmluZyh2YWx1ZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBTdHJpbmcodmFsdWUpO1xufVxuIiwgIi8qKlxuICogY3JlYXRlTmV4dC50cyBcdTIwMTQgUHVyZSBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIgcGxhbm5pbmcgY29yZSBmb3IgbmF0aXZlLXNsaWRlcy5cbiAqXG4gKiBFdmVyeXRoaW5nIGluIHRoaXMgbW9kdWxlIGlzIGZyZWUgb2YgT2JzaWRpYW4gcnVudGltZSBkZXBlbmRlbmNpZXMgc28gaXQgY2FuXG4gKiBiZSB1bml0IHRlc3RlZCBkaXJlY3RseSAoc2VlIHRlc3QvY3JlYXRlTmV4dC50ZXN0LnRzKS4gbWFpbi50cyBhZGFwdHMgdGhlXG4gKiB2YXVsdCAobWV0YWRhdGFDYWNoZSwgY29tcHV0ZURlY2spIHRvIHRoaXMgcHVyZSBpbnRlcmZhY2UgYW5kIGFwcGxpZXMgdGhlXG4gKiByZXN1bHRpbmcgcGxhbiB3aXRoIHZhdWx0LmNyZWF0ZSgpICsgZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKCkuXG4gKlxuICogVGhlIHBsYW4gZGVjaWRlcywgZm9yIHRoZSBjdXJyZW50IG5vdGU6XG4gKiAgIC0gdGhlIG5hbWUgb2YgdGhlIG5ldyBzbGlkZSBmaWxlIChjb2xsaXNpb24tYXdhcmUpLFxuICogICAtIHRoZSByYXcgYGRlY2tgIGxpbmsgdGV4dHMgb2YgdGhlIG5ldyBub3RlLFxuICogICAtIHRoZSByZXdyaXRlcyBuZWVkZWQgb24gZXhpc3Rpbmcgbm90ZXMgKGluIHByYWN0aWNlIGFsd2F5cyB0aGUgY3VycmVudFxuICogICAgIG5vdGUgaXRzZWxmKS5cbiAqL1xuXG5pbXBvcnQgeyBleHRyYWN0TGlua1RleHQgfSBmcm9tIFwiLi9kZWNrXCI7XG5cbi8qKiBJbnB1dHMgZm9yIHBsYW5uaW5nIFx1MjAxNCByZXNvbHZlZCBieSB0aGUgYWRhcHRlciBpbiBtYWluLnRzICovXG5leHBvcnQgaW50ZXJmYWNlIENyZWF0ZU5leHRJbnB1dCB7XG4gIC8qKiBCYXNlbmFtZSAod2l0aG91dCBleHRlbnNpb24pIG9mIHRoZSBjdXJyZW50IG5vdGUgKi9cbiAgY3VycmVudE5hbWU6IHN0cmluZztcbiAgLyoqIFJhdyBgZGVja2AgbGluayB0ZXh0cyBvZiB0aGUgY3VycmVudCBub3RlIChleHRyYWN0ZWQsIHVwIHRvIHR3bykgKi9cbiAgY3VycmVudExpbmtzOiBzdHJpbmdbXTtcbiAgLyoqIFRydWUgd2hlbiB0aGUgY3VycmVudCBub3RlIElTIHRoZSBkZWNrJ3Mgb3ZlcnZpZXcgcGFnZSAoY2hhaW4gaW5kZXggMCkgKi9cbiAgaXNPdmVydmlldzogYm9vbGVhbjtcbiAgLyoqXG4gICAqIFJhdyBsaW5rIHRleHQgdGhlIG9sZCBmaXJzdCBwYWdlIHVzZXMgdG8gbGluayBiYWNrIHRvIHRoZSBvdmVydmlldy5cbiAgICogT25seSBtZWFuaW5nZnVsIGZvciBvdmVydmlldyBpbnNlcnRpb24gKHRoZSBvdmVydmlldyBpdHNlbGYgb25seSBsaW5rc1xuICAgKiBmb3J3YXJkLCBzbyBpdHMgb3duIGZyb250bWF0dGVyIGNvbnRhaW5zIG5vIHNlbGYtcmVmZXJlbmNlKS5cbiAgICovXG4gIG92ZXJ2aWV3QmFja0xpbms/OiBzdHJpbmc7XG4gIC8qKiBCYXNlbmFtZXMgb2YgZXZlcnkgbWFya2Rvd24gbm90ZSBpbiB0aGUgdmF1bHQgKGNvbGxpc2lvbi1mcmVlIG5hbWluZykgKi9cbiAgZXhpc3RpbmdOYW1lczogU2V0PHN0cmluZz47XG59XG5cbi8qKiBPbmUgbm90ZSB3aG9zZSBgZGVja2AgcHJvcGVydHkgbXVzdCBiZSByZXdyaXR0ZW4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVja1Jld3JpdGUge1xuICAvKiogQmFzZW5hbWUgb2YgdGhlIG5vdGUgdG8gcmV3cml0ZSAqL1xuICBuYW1lOiBzdHJpbmc7XG4gIC8qKiBUaGUgbmV3IHJhdyBgZGVja2AgbGluayB0ZXh0cyAoc2VyaWFsaXplZCBhcyBhIFlBTUwgbGlzdCkgKi9cbiAgZGVjazogc3RyaW5nW107XG59XG5cbi8qKiBUaGUgZnVsbCBwbGFuIGZvciBjcmVhdGluZyBvbmUgbmV3IHNsaWRlICovXG5leHBvcnQgaW50ZXJmYWNlIENyZWF0ZU5leHRSZXN1bHQge1xuICAvKiogQmFzZW5hbWUgKHdpdGhvdXQgZXh0ZW5zaW9uKSBvZiB0aGUgbmV3IHNsaWRlIGZpbGUgKi9cbiAgbmV3TmFtZTogc3RyaW5nO1xuICAvKiogUmF3IGBkZWNrYCBsaW5rIHRleHRzIGZvciB0aGUgbmV3IG5vdGUncyBmcm9udG1hdHRlciAqL1xuICBuZXdEZWNrTGlua3M6IHN0cmluZ1tdO1xuICAvKiogUmV3cml0ZXMgdG8gYXBwbHkgdG8gZXhpc3Rpbmcgbm90ZXMgKGluIHByYWN0aWNlIGFsd2F5cyB0aGUgY3VycmVudCBub3RlKSAqL1xuICByZXdyaXRlczogRGVja1Jld3JpdGVbXTtcbn1cblxuLyoqXG4gKiBQbGFuIHRoZSBjcmVhdGlvbiBvZiBhIG5ldyBzbGlkZSBhZnRlciB0aGUgY3VycmVudCBub3RlLlxuICpcbiAqIEJlaGF2aW9yczpcbiAqICAgLSBMYXN0IHNsaWRlIChubyBzZWNvbmQgbGluayk6IGFwcGVuZCBgPGN1cnJlbnQ+LW5leHRgIGFzIHRoZSBuZXcgbGFzdFxuICogICAgIHNsaWRlOyB0aGUgY3VycmVudCBub3RlIGdhaW5zIHRoZSBzZWNvbmQgbGluay5cbiAqICAgLSBTbGlkZSB3aXRoIGEgdmFsaWQgbmV4dDogaW5zZXJ0IGA8Y3VycmVudD4tbmV4dGAgYmV0d2VlbiB0aGVtOyB0aGUgbmV3XG4gKiAgICAgbm90ZSB0YWtlcyBvdmVyIHRoZSBvbGQgbmV4dCBsaW5rLlxuICogICAtIFNsaWRlIHdob3NlIHNlY29uZCBsaW5rIGlzIGJyb2tlbiAocGxhaW4sIG5vbi1leGlzdGluZyBuYW1lKTogY3JlYXRlXG4gKiAgICAgZXhhY3RseSB0aGUgZGVjbGFyZWQgbWlzc2luZyBub3RlIGFzIHRoZSBuZXcgbGFzdCBzbGlkZSBcdTIwMTQgdGhlIFx1MjZBMCB3YXJuaW5nXG4gKiAgICAgZGlzYXBwZWFycyBhbmQgdGhlIGF1dGhvcidzIGludGVudCBpcyBob25vdXJlZC4gQSBicm9rZW4gbGluayB0aGF0IGlzXG4gKiAgICAgbm90IGEgcGxhaW4gYmFzZW5hbWUgKHBhdGgtcXVhbGlmaWVkLCBzZWxmLXJlZmVyZW5jaW5nKSBpcyB0cmVhdGVkIGFzXG4gKiAgICAgaW52YWxpZCBhbmQgZHJvcHBlZCAoYXBwZW5kIGEgYDxjdXJyZW50Pi1uZXh0YCBsYXN0IHNsaWRlIGluc3RlYWQpLlxuICogICAtIE92ZXJ2aWV3IHBhZ2UgKHNpbmdsZSBsaW5rID0gZmlyc3QgcGFnZSk6IGluc2VydCBhIG5ldyBmaXJzdCBwYWdlOyB0aGVcbiAqICAgICBvdmVydmlldydzIGxpbmsgcG9pbnRzIHRvIGl0IGFuZCB0aGUgb2xkIGZpcnN0IHBhZ2UgaXMgcHVzaGVkIGJhY2suXG4gKlxuICogUmV0dXJucyBudWxsIHdoZW4gdGhlIG5vdGUgaGFzIG5vIHVzYWJsZSBgZGVja2AgbGlua3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwbGFuQ3JlYXRlTmV4dChpbnB1dDogQ3JlYXRlTmV4dElucHV0KTogQ3JlYXRlTmV4dFJlc3VsdCB8IG51bGwge1xuICBjb25zdCB7IGN1cnJlbnROYW1lLCBjdXJyZW50TGlua3MsIGlzT3ZlcnZpZXcgfSA9IGlucHV0O1xuICBpZiAoY3VycmVudExpbmtzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgLy8gXHUyNTAwXHUyNTAwIE92ZXJ2aWV3IHBhZ2U6IGluc2VydCBhIG5ldyBmaXJzdCBwYWdlIGFmdGVyIGl0IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBpZiAoaXNPdmVydmlldykge1xuICAgIGNvbnN0IG9sZEZpcnN0ID0gY3VycmVudExpbmtzWzBdO1xuICAgIGlmICghb2xkRmlyc3QpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IG5ld05hbWUgPSB1bmlxdWVOYW1lKGAke2N1cnJlbnROYW1lfS1uZXh0YCwgaW5wdXQuZXhpc3RpbmdOYW1lcyk7XG4gICAgY29uc3QgYmFjayA9IGlucHV0Lm92ZXJ2aWV3QmFja0xpbmsgPz8gYFtbJHtjdXJyZW50TmFtZX1dXWA7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5ld05hbWUsXG4gICAgICBuZXdEZWNrTGlua3M6IFtiYWNrLCBvbGRGaXJzdF0sXG4gICAgICByZXdyaXRlczogW3sgbmFtZTogY3VycmVudE5hbWUsIGRlY2s6IFtgW1ske25ld05hbWV9XV1gXSB9XSxcbiAgICB9O1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNsaWRlOiBmaXJzdCBsaW5rIGlzIHRoZSBvdmVydmlldyBwYWdlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCBvdmVydmlld0xpbmsgPSBjdXJyZW50TGlua3NbMF07XG4gIGlmICghb3ZlcnZpZXdMaW5rKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgbmV4dExpbmsgPSBjdXJyZW50TGlua3NbMV07XG5cbiAgaWYgKG5leHRMaW5rKSB7XG4gICAgY29uc3QgbmV4dE5hbWUgPSBleHRyYWN0TGlua1RleHQobmV4dExpbmspO1xuICAgIGlmIChuZXh0TmFtZSAmJiBpc1BsYWluTmFtZShuZXh0TmFtZSkgJiYgbmV4dE5hbWUgIT09IGN1cnJlbnROYW1lKSB7XG4gICAgICBpZiAoIWlucHV0LmV4aXN0aW5nTmFtZXMuaGFzKG5leHROYW1lKSkge1xuICAgICAgICAvLyBUaGUgZGVjbGFyZWQgbmV4dCBub3RlIGRvZXMgbm90IGV4aXN0IHlldCBcdTIxOTIgY3JlYXRlIGV4YWN0bHkgdGhhdFxuICAgICAgICAvLyBub3RlIChmaXhlcyB0aGUgYnJva2VuLWxpbmsgd2FybmluZywgaG9ub3VycyB0aGUgYXV0aG9yJ3MgaW50ZW50KS5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBuZXdOYW1lOiBuZXh0TmFtZSxcbiAgICAgICAgICBuZXdEZWNrTGlua3M6IFtvdmVydmlld0xpbmtdLFxuICAgICAgICAgIHJld3JpdGVzOiBbXSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIC8vIEEgdmFsaWQgbmV4dCBub3RlIGV4aXN0cyBcdTIxOTIgaW5zZXJ0IGJldHdlZW4gaXQgYW5kIHRoZSBjdXJyZW50IG5vdGUuXG4gICAgICBjb25zdCBuZXdOYW1lID0gdW5pcXVlTmFtZShgJHtjdXJyZW50TmFtZX0tbmV4dGAsIGlucHV0LmV4aXN0aW5nTmFtZXMpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmV3TmFtZSxcbiAgICAgICAgbmV3RGVja0xpbmtzOiBbb3ZlcnZpZXdMaW5rLCBuZXh0TGlua10sXG4gICAgICAgIHJld3JpdGVzOiBbeyBuYW1lOiBjdXJyZW50TmFtZSwgZGVjazogW292ZXJ2aWV3TGluaywgYFtbJHtuZXdOYW1lfV1dYF0gfV0sXG4gICAgICB9O1xuICAgIH1cbiAgICAvLyBJbnZhbGlkIChwYXRoLXF1YWxpZmllZCAvIHNlbGYtcmVmZXJlbmNpbmcpIG5leHQgbGluayBcdTIxOTIgZHJvcCBpdCBhbmRcbiAgICAvLyBhcHBlbmQgYSBuZXcgbGFzdCBzbGlkZSAoZmFsbCB0aHJvdWdoIHRvIHRoZSBuby1uZXh0IGJyYW5jaCkuXG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgTGFzdCBzbGlkZSBcdTIxOTIgYXBwZW5kIGEgbmV3IGxhc3Qgc2xpZGUgYWZ0ZXIgaXQgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IG5ld05hbWUgPSB1bmlxdWVOYW1lKGAke2N1cnJlbnROYW1lfS1uZXh0YCwgaW5wdXQuZXhpc3RpbmdOYW1lcyk7XG4gIHJldHVybiB7XG4gICAgbmV3TmFtZSxcbiAgICBuZXdEZWNrTGlua3M6IFtvdmVydmlld0xpbmtdLFxuICAgIHJld3JpdGVzOiBbeyBuYW1lOiBjdXJyZW50TmFtZSwgZGVjazogW292ZXJ2aWV3TGluaywgYFtbJHtuZXdOYW1lfV1dYF0gfV0sXG4gIH07XG59XG5cbi8qKiBBIG5hbWUgdXNhYmxlIGFzIGEgdmF1bHQgbm90ZSBuYW1lOiBubyBwYXRoIHNlcGFyYXRvcnMsIG5vbi1lbXB0eSAqL1xuZnVuY3Rpb24gaXNQbGFpbk5hbWUobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBuYW1lLmxlbmd0aCA+IDAgJiYgIW5hbWUuaW5jbHVkZXMoXCIvXCIpICYmICFuYW1lLmluY2x1ZGVzKFwiXFxcXFwiKTtcbn1cblxuLyoqIEZpcnN0IGZyZWUgbmFtZSBpbiB0aGUgZmFtaWx5IGBiYXNlYCwgYGJhc2UtMmAsIGBiYXNlLTNgLCBcdTIwMjYgKi9cbmZ1bmN0aW9uIHVuaXF1ZU5hbWUoYmFzZTogc3RyaW5nLCBleGlzdGluZzogU2V0PHN0cmluZz4pOiBzdHJpbmcge1xuICBpZiAoIWV4aXN0aW5nLmhhcyhiYXNlKSkgcmV0dXJuIGJhc2U7XG4gIGZvciAobGV0IGkgPSAyOyA7IGkrKykge1xuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGAke2Jhc2V9LSR7aX1gO1xuICAgIGlmICghZXhpc3RpbmcuaGFzKGNhbmRpZGF0ZSkpIHJldHVybiBjYW5kaWRhdGU7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQTREQSxzQkFBK0U7OztBQ2xEeEUsSUFBTSxpQkFBaUI7QUF5QnZCLFNBQVMsWUFDZCxhQUNBLFVBQ2lCO0FBQ2pCLFFBQU0sZUFBZSxTQUFTLFdBQVc7QUFDekMsTUFBSSxhQUFhLFdBQVcsRUFBRyxRQUFPO0FBRXRDLE1BQUk7QUFDSixNQUFJO0FBRUosTUFBSSxhQUFhLFVBQVUsR0FBRztBQUU1QixlQUFXLGFBQWEsQ0FBQztBQUN6QixnQkFBWSxTQUFTLFFBQVEsRUFBRSxDQUFDO0FBQUEsRUFDbEMsT0FBTztBQUdMLFVBQU0sT0FBTyxhQUFhLENBQUM7QUFDM0IsVUFBTSxZQUFZLFNBQVMsSUFBSTtBQUMvQixRQUFJLFVBQVUsQ0FBQyxNQUFNLGFBQWE7QUFDaEMsaUJBQVc7QUFDWCxrQkFBWTtBQUFBLElBQ2QsT0FBTztBQUNMLGlCQUFXO0FBQ1gsa0JBQVksVUFBVSxDQUFDO0FBQUEsSUFDekI7QUFBQSxFQUNGO0FBQ0EsTUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFXLFFBQU87QUFHcEMsUUFBTSxRQUFrQixDQUFDO0FBQ3pCLFFBQU0sVUFBVSxvQkFBSSxJQUFZO0FBQ2hDLFFBQU0sT0FBTyxDQUFDLE1BQWdDO0FBQzVDLFFBQUksS0FBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLEdBQUc7QUFDeEIsY0FBUSxJQUFJLENBQUM7QUFDYixZQUFNLEtBQUssQ0FBQztBQUFBLElBQ2Q7QUFBQSxFQUNGO0FBQ0EsT0FBSyxRQUFRO0FBQ2IsT0FBSyxTQUFTO0FBQ2QsTUFBSSxNQUFNO0FBQ1YsU0FBTyxLQUFLO0FBQ1YsVUFBTSxPQUFPLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDNUIsUUFBSSxDQUFDLFFBQVEsUUFBUSxJ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
