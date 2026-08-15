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
var SAMPLE_NOTE_NAMES = [
  "typography-sample-headings",
  "typography-sample-list",
  "typography-sample-code",
  "typography-sample-quote",
  "typography-sample-media"
];
var STYLE_SECTIONS = [
  "container",
  "paragraph",
  "h1",
  "listItem",
  "codeBlock",
  "blockquote",
  "inlineCode",
  "table",
  "image",
  "horizontalRule"
];
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
      callback: () => void this.debugStyles()
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
  /**
   * True when the active edit view is Live Preview (WYSIWYG) — as
   * opposed to Source mode. Obsidian reports both as mode "source";
   * the view state carries a `source` flag (Source mode = true), with
   * a DOM class fallback (.is-live-preview) for safety.
   */
  isLivePreview() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (!view || view.getMode() !== "source") return false;
    const state = view.getState();
    if (state.source === true) return false;
    if (state.source === false) return true;
    return !!view.contentEl.querySelector(".markdown-source-view.mod-cm6.is-live-preview");
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
    const isSourceMode = mode === "source" && !this.isLivePreview();
    const wysiwyg = isCard && this.settings.wysiwygMode && !isSourceMode;
    document.body.classList.toggle("native-slides-wysiwyg", wysiwyg);
    this.syncFullscreen(mode === "preview" && this.settings.autoFullscreen);
    const barVisible = !!file && (mode === "preview" || mode === "source" && wysiwyg) && !this.settings.barHidden;
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
  /** Sample the current view's typography computed styles + CSS variables */
  sampleStyles() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (!view) return null;
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
      isEdit ? ".markdown-source-view.mod-cm6 .cm-line:not(.HyperMD-header)" : ".markdown-reading-view .markdown-preview-view p"
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
    const table = pick([
      isEdit ? ".markdown-source-view.mod-cm6 table" : ".markdown-reading-view table",
      isEdit ? ".cm-line table" : ".markdown-reading-view .markdown-preview-view table"
    ]);
    const img = pick([
      isEdit ? ".markdown-source-view.mod-cm6 img" : ".markdown-reading-view img",
      isEdit ? ".cm-line img" : ".markdown-reading-view .markdown-preview-view img",
      "img"
      // whole-document fallback
    ]);
    const hr = pick([
      isEdit ? ".markdown-source-view.mod-cm6 hr" : ".markdown-reading-view hr",
      isEdit ? ".cm-line hr" : ".markdown-reading-view .markdown-preview-view hr",
      isEdit ? ".cm-hr" : ".markdown-preview-view hr"
    ]);
    const sourceViewClass = contentEl.querySelector(".markdown-source-view.mod-cm6")?.className ?? "";
    const domTags = [];
    if (isEdit) {
      const tags = /* @__PURE__ */ new Set();
      contentEl.querySelectorAll(".markdown-source-view.mod-cm6 *").forEach((el) => tags.add(el.tagName.toLowerCase()));
      domTags.push(...tags);
    }
    const listLines = [];
    if (isEdit) {
      contentEl.querySelectorAll(".HyperMD-list-line").forEach((el, i) => {
        if (i >= 4) return;
        const cs = getComputedStyle(el);
        listLines.push({
          className: el.className,
          paddingLeft: cs.getPropertyValue("padding-left").trim()
        });
      });
    }
    const metadataDisplay = isEdit ? (() => {
      const el = contentEl.querySelector(
        ".markdown-source-view .metadata-container"
      );
      return el ? getComputedStyle(el).display : "(not in DOM)";
    })() : void 0;
    const h1OffsetTop = (() => {
      if (!h1) return void 0;
      let top = 0;
      let node = h1;
      while (node && node !== contentEl && node !== document.body) {
        top += node.offsetTop;
        node = node.offsetParent;
      }
      return top;
    })();
    const anchor = isEdit ? contentEl.querySelector(".cm-content") : contentEl.querySelector(".markdown-reading-view .markdown-preview-view");
    const h1TopInContent = (() => {
      if (!h1 || !anchor) return void 0;
      return Math.round(h1.getBoundingClientRect().top - anchor.getBoundingClientRect().top);
    })();
    const cmContentChildren = isEdit ? (() => {
      if (!anchor) return void 0;
      return Array.from(anchor.children).slice(0, 4).map((el) => {
        const cs = getComputedStyle(el);
        return {
          cls: el.className || el.tagName.toLowerCase(),
          display: cs.display,
          height: Math.round(el.getBoundingClientRect().height)
        };
      });
    })() : void 0;
    const dump = {
      mode: isEdit ? "edit (Live Preview)" : "reading",
      // Alignment CSS (rules 7/7b) only applies when WYSIWYG is on
      wysiwygActive: document.body.classList.contains("native-slides-wysiwyg"),
      domTags: isEdit ? domTags : void 0,
      sourceViewClass: isEdit ? sourceViewClass : void 0,
      livePreview: isEdit ? this.isLivePreview() : void 0,
      listLines: isEdit ? listLines : void 0,
      metadataContainerDisplay: isEdit ? metadataDisplay : void 0,
      h1OffsetTop,
      h1TopInContent,
      cmContentChildren,
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
        "color",
        "text-align"
      ]),
      paragraph: style(para, [
        "font-size",
        "line-height",
        "margin-top",
        "margin-bottom",
        "margin-left",
        "margin-right",
        "text-indent",
        "text-align"
      ]),
      h1: style(h1, [
        "font-size",
        "line-height",
        "font-weight",
        "margin-top",
        "margin-bottom",
        "text-align"
      ]),
      listItem: style(listItem, [
        "padding-left",
        "margin-left",
        "margin-right",
        "text-indent",
        "line-height",
        "text-align"
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
      table: style(table, ["font-size", "line-height", "width", "border-collapse"]),
      image: style(img, ["display", "margin-left", "margin-right", "max-width", "width"]),
      horizontalRule: style(hr, ["margin-top", "margin-bottom", "border-top-width", "height"]),
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
    return dump;
  }
  /**
   * Debug typography: samples the fixed one-page sample notes (each
   * covering a group of elements — all visible without scrolling),
   * then the kitchen-sink note in reading view (no virtualization
   * there), merges everything, computes the edit-vs-reading diff and
   * writes it to .native-slides-debug.json in the vault root.
   * The user's own note is restored at the end.
   */
  async debugStyles() {
    if (!this.settings.wysiwygMode) {
      new import_obsidian.Notice("Native Slides: turn WYSIWYG mode on first (Mod+Shift+E on a deck note)");
      return;
    }
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (!view) {
      new import_obsidian.Notice("Native Slides: no active Markdown note");
      return;
    }
    const startMode = view.getMode();
    const activeFile = this.app.workspace.getActiveFile();
    const leaf = this.app.workspace.getLeaf(false);
    const edit = {};
    for (const name of SAMPLE_NOTE_NAMES) {
      const f = this.app.vault.getAbstractFileByPath(`${name}.md`);
      if (!(f instanceof import_obsidian.TFile)) continue;
      await leaf.openFile(f, { state: { mode: "source" } });
      await sleep(500);
      const s = this.sampleStyles();
      if (s) mergeSample(edit, s);
    }
    let reading = null;
    const demo = this.app.vault.getAbstractFileByPath("typography-demo.md");
    if (demo instanceof import_obsidian.TFile) {
      await leaf.openFile(demo, { state: { mode: "preview" } });
      await sleep(800);
      reading = this.sampleStyles();
    }
    if (activeFile) {
      await leaf.openFile(activeFile, { state: { mode: startMode } });
      this.refresh();
    }
    if (!reading) {
      new import_obsidian.Notice("Native Slides: reading sample failed");
      return;
    }
    const payload = { edit, reading, diff: diffDumps(edit, reading) };
    try {
      await this.app.vault.adapter.write(
        ".native-slides-debug.json",
        JSON.stringify(payload, null, 2)
      );
      new import_obsidian.Notice("Typography dump \u2192 .native-slides-debug.json (vault root)");
    } catch (error) {
      new import_obsidian.Notice(`Native Slides: could not write debug file (${String(error)})`);
    }
    console.log("[native-slides debug-styles]", JSON.stringify(payload, null, 2));
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
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function mergeSample(target, sample) {
  for (const key of STYLE_SECTIONS) {
    const section = sample[key];
    if (!section || "(missing)" in section) continue;
    const existing = target[key];
    if (existing && !("(missing)" in existing)) continue;
    target[key] = section;
  }
  for (const key of [
    "listLines",
    "metadataContainerDisplay",
    "h1OffsetTop",
    "h1TopInContent",
    "cmContentChildren"
  ]) {
    const probe = sample[key];
    if (probe === void 0 || probe === null) continue;
    if (Array.isArray(probe) && probe.length === 0) continue;
    if (typeof probe === "object" && !Array.isArray(probe) && Object.keys(probe).length === 0)
      continue;
    if (target[key] === void 0) target[key] = probe;
  }
}
function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}
function diffDumps(edit, reading) {
  const out = {};
  for (const section of STYLE_SECTIONS) {
    const e = edit[section] ?? {};
    const r = reading[section] ?? {};
    const keys = /* @__PURE__ */ new Set([...Object.keys(e), ...Object.keys(r)]);
    const diffs = {};
    for (const key of keys) {
      if (e[key] !== r[key]) {
        diffs[key] = { edit: e[key] ?? "(missing)", reading: r[key] ?? "(missing)" };
      }
    }
    if (Object.keys(diffs).length > 0) out[section] = diffs;
  }
  return out;
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvZGVjay50cyIsICJzcmMvY3JlYXRlTmV4dC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBuYXRpdmUtc2xpZGVzIFx1MjAxNCByZWFkaW5nLXZpZXcgcHJvcGVydGllcyBiYXIgd2l0aCBQUFQtc3R5bGUgZGVjayBuYXZpZ2F0aW9uXG4gKlxuICogRmVhdHVyZXM6XG4gKiAgIDEuIEhpZGVzIE9ic2lkaWFuJ3MgbmF0aXZlIHN0YXR1cyBiYXIgYW5kIHJlbmRlcnMgYSBcInByb3BlcnRpZXMgYmFyXCIgYXQgdGhlXG4gKiAgICAgIGJvdHRvbSBvZiB0aGUgd2luZG93LlxuICogICAyLiBJbiByZWFkaW5nIHZpZXcsIHNob3dzIHRoZSBjdXJyZW50IG5vdGUncyBwcm9wZXJ0aWVzIChZQU1MIGZyb250bWF0dGVyKVxuICogICAgICBhcyBjaGlwcyBpbiB0aGF0IGJhci5cbiAqICAgMy4gUmVhZGluZyB2aWV3IGF1dG8tZW50ZXJzIGEgZnVsbHNjcmVlbi1saWtlIG1vZGU6IHRoZSByaWJib24sIHNpZGViYXJzLFxuICogICAgICB0YWIgYmFyIGFuZCB0aGUgcGFuZSBoZWFkZXIgYmFyIGFyZSBoaWRkZW47IGxlYXZpbmcgcmVhZGluZyB2aWV3XG4gKiAgICAgIHJlc3RvcmVzIHRoZW0gYXV0b21hdGljYWxseS4gUHJlc3NpbmcgRXNjIHRvIGxlYXZlIHRoZSBPUyBmdWxsc2NyZWVuXG4gKiAgICAgIGFsc28gZXhpdHMgcmVhZGluZyB2aWV3LlxuICogICA0LiBIaWRlcyB0aGUgaW4tbm90ZSBwcm9wZXJ0aWVzIHBhbmVsIGluIHJlYWRpbmcgdmlldyAoa2VwdCBpbiBlZGl0IHZpZXcpLlxuICogICA1LiBQUFQtc3R5bGUgZGVjayBuYXZpZ2F0aW9uIGRyaXZlbiBieSBPTkUgcmVzZXJ2ZWQgZnJvbnRtYXR0ZXIga2V5LCBgZGVja2AsXG4gKiAgICAgIGhvbGRpbmcgdXAgdG8gdHdvIG1hcmtkb3duIGxpbmtzOlxuICogICAgICAgIC0gb3ZlcnZpZXcgbm90ZSA6IGRlY2s6IFtcIltbZmlyc3Qtc2xpZGVdXVwiXSAgICAgICAgICAgIChvbmUgbGluayA9IHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0IHBhZ2Ugb2YgdGhlIGRlY2s7IHRoZSBub3RlIGlzIHRoZSBvdmVydmlldylcbiAqICAgICAgICAtIHNsaWRlIG5vdGUgICAgOiBkZWNrOiBbXCJbW292ZXJ2aWV3XV1cIiwgXCJbW25leHQtc2xpZGVdXVwiXVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIChmaXJzdCBsaW5rID0gdGhlIG92ZXJ2aWV3IHBhZ2UsIHNlY29uZCBsaW5rID0gdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCBzbGlkZTsgb21pdCB0aGUgc2Vjb25kIGxpbmsgb24gdGhlIGxhc3Qgc2xpZGUpXG4gKiAgICAgIFRoZSBwYWdlIG51bWJlciBpcyBjb21wdXRlZCBhdXRvbWF0aWNhbGx5IGJ5IHNjYW5uaW5nIHRoZSB2YXVsdCBhbmRcbiAqICAgICAgd2Fsa2luZyB0aGUgY2hhaW4gb2YgbGlua3MsIHNvIG5vIGBwYWdlLW51bWJlcmAgcHJvcGVydHkgaXMgbmVlZGVkLlxuICogICAgICBcdTI1QzAgXHUyNUI2IGJ1dHRvbnMgYXBwZWFyIG9uIHRoZSBsZWZ0IG9mIHRoZSBiYXIsIGFuZCBcIlByZXZpb3VzIFBhZ2VcIiAvIFwiTmV4dFxuICogICAgICBQYWdlXCIgY29tbWFuZHMgYXJlIHJlZ2lzdGVyZWQgKGRlZmF1bHQgaG90a2V5cyBNb2QrU2hpZnQrXHUyMTkwIC8gTW9kK1NoaWZ0K1x1MjE5MixcbiAqICAgICAgcmViaW5kYWJsZSB1bmRlciBTZXR0aW5ncyBcdTIxOTIgSG90a2V5cykuXG4gKiAgIDYuIEEgc2V0dGluZ3MgdGFiIHRvZ2dsZXMgdGhlIFx1MjVDMCBcdTI1QjYgYnV0dG9ucyBhbmQgdGhlIHBhZ2UgbnVtYmVyLlxuICogICA3LiBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIgY29tbWFuZDogY3JlYXRlcyBhIG5ldyBzbGlkZSByaWdodCBhZnRlciB0aGVcbiAqICAgICAgY3VycmVudCBvbmUgKG5hbWUtY29sbGlzaW9uIGF3YXJlKSwgcmV3aXJlcyB0aGUgYGRlY2tgIHByb3BlcnRpZXMgb2ZcbiAqICAgICAgYm90aCBub3RlcywgYW5kIG9wZW5zIHRoZSBuZXcgbm90ZSBpbiBlZGl0IG1vZGUuXG4gKiAgIDguIFwiVG9nZ2xlIFdZU0lXWUcgTW9kZVwiIChjb21tYW5kICsgaG90a2V5ICsgYm90dG9tLWJhciBidXR0b24sIGRlY2tcbiAqICAgICAgbm90ZXMgb25seSk6IFdZU0lXWUcgPSB0aGUgTGl2ZSBQcmV2aWV3IHN0eWxlZCB0byBtYXRjaCB0aGVcbiAqICAgICAgcmVhZGluZyB2aWV3ICh0aGUgcmVhZGluZyB2aWV3IGlzIHRoZSB1bnRvdWNoZWQgcmVmZXJlbmNlKS5cbiAqICAgICAgT3ZlcnJpZGVzIGFwcGx5IE9OTFkgaW5zaWRlIFdZU0lXWUcncyBMaXZlIFByZXZpZXcgKHRvcCBtYXJnaW4sXG4gKiAgICAgIGxpc3QgaW5kZW50LCBjb2RlLWJsb2NrIG1ldHJpY3MpIHBsdXMgbGF5b3V0IHdvcms6IHRhYiBiYXIgYW5kXG4gKiAgICAgIHNpZGViYXJzIGhpZGUgKExpdmUgUHJldmlldyArIHJlYWRpbmcpLCB0aGUgYm90dG9tIGJhciBzaG93cyBpblxuICogICAgICBMaXZlIFByZXZpZXcgdG9vIGFuZCBtYXRjaGVzIHRoZSB0YWIgYmFyJ3MgbWVhc3VyZWQgaGVpZ2h0IChub1xuICogICAgICBjb250ZW50LWFyZWEgaGVpZ2h0IGNoYW5nZSB3aGVuIHN3aXRjaGluZyBtb2RlcyksIGluLW5vdGVcbiAqICAgICAgcHJvcGVydGllcyBoaWRlIHdoaWxlIGVkaXRpbmcsIHN0YW5kYWxvbmUgaW1hZ2UgbGluZXMgYXJlXG4gKiAgICAgIGNlbnRlcmVkLiBTb3VyY2UgbW9kZSBhbmQgdGhlIGRlZmF1bHQgKG5vbi1XWVNJV1lHKSBMaXZlXG4gKiAgICAgIFByZXZpZXcgYXJlIGNvbXBsZXRlbHkgdW50b3VjaGVkLiBBbGwgcnVsZXMgYXJlIHNjb3BlZCB1bmRlclxuICogICAgICBib2R5Lm5hdGl2ZS1zbGlkZXMtd3lzaXd5Zy5cbiAqICAgOS4gXCJEZWJ1ZzogRHVtcCBUeXBvZ3JhcGh5IFN0eWxlc1wiIChucy1kZWJ1Zy1zdHlsZXMpOiBwcmludHMgdGhlXG4gKiAgICAgIGtleSBjb21wdXRlZCBzdHlsZXMgKyBDU1MgdmFyaWFibGVzIG9mIHRoZSBjdXJyZW50IHZpZXcgdG8gdGhlXG4gKiAgICAgIGNvbnNvbGUgXHUyMDE0IHJ1biBvbmNlIHBlciB2aWV3IGFuZCBjb21wYXJlIChtZWFzdXJlbWVudCB0b29saW5nLFxuICogICAgICBubyBzY3JlZW5zaG90cyBuZWVkZWQpLlxuICpcbiAqIFRoZSBkZWNrIHVzdWFsbHkgc3RhcnRzIGZyb20gYW4gb3ZlcnZpZXcgbm90ZSB0aGF0IGVtYmVkcyBhbiBPYnNpZGlhbiBCYXNlXG4gKiB2aWV3IChjb3JlIFwiQmFzZXNcIiBwbHVnaW4pIGZpbHRlcmluZyBub3RlcyB0aGF0IGxpbmsgdG8gdGhlIG92ZXJ2aWV3IHBhZ2U6XG4gKlxuICogICBgYGBiYXNlXG4gKiAgIGZpbHRlcnM6XG4gKiAgICAgYW5kOlxuICogICAgICAgLSBmaWxlLmhhc0xpbmsoXCJvdmVydmlld1wiKVxuICogICB2aWV3czpcbiAqICAgICAtIHR5cGU6IHRhYmxlXG4gKiAgICAgICBuYW1lOiBEZWNrXG4gKiAgIGBgYFxuICpcbiAqIFdoeSByZWFkIHByb3BlcnRpZXMgdmlhIG1ldGFkYXRhQ2FjaGUgaW5zdGVhZCBvZiBwYXJzaW5nIFlBTUwgbWFudWFsbHk/XG4gKiAgIE9ic2lkaWFuIG1haW50YWlucyBhIGNhY2hlIHBlciBub3RlOyBtZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKVxuICogICAuZnJvbnRtYXR0ZXIgcmV0dXJucyB0aGUgcGFyc2VkIHByb3BlcnRpZXMsIHVwZGF0ZWQgYXV0b21hdGljYWxseSBvbiBzYXZlLlxuICovXG5cbmltcG9ydCB7IE1hcmtkb3duVmlldywgTm90aWNlLCBQbHVnaW4sIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBwbGFuQ3JlYXRlTmV4dCwgdHlwZSBDcmVhdGVOZXh0UmVzdWx0IH0gZnJvbSBcIi4vc3JjL2NyZWF0ZU5leHRcIjtcbmltcG9ydCB7IGNvbXB1dGVEZWNrLCBleHRyYWN0TGlua3MsIGV4dHJhY3RSYXdMaW5rcywgZm9ybWF0VmFsdWUsIHR5cGUgRGVja0luZm8gfSBmcm9tIFwiLi9zcmMvZGVja1wiO1xuXG4vKiogUGx1Z2luIHNldHRpbmdzICovXG5pbnRlcmZhY2UgTmF0aXZlU2xpZGVzU2V0dGluZ3Mge1xuICAvKiogU2hvdyBcdTI1QzAgXHUyNUI2IHByZXZpb3VzL25leHQgYnV0dG9ucyBvbiB0aGUgbGVmdCBvZiB0aGUgYmFyICovXG4gIHNob3dOYXZCdXR0b25zOiBib29sZWFuO1xuICAvKiogU2hvdyB0aGUgYXV0by1jb21wdXRlZCBwYWdlIG51bWJlciBhdCB0aGUgYm90dG9tLXJpZ2h0IG9mIHRoZSBiYXIgKi9cbiAgc2hvd1BhZ2VOdW1iZXI6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoZSB1c2VyIG1hbnVhbGx5IGhpZCB0aGUgYmFyICh0b2dnbGUgY29tbWFuZCkgKi9cbiAgYmFySGlkZGVuOiBib29sZWFuO1xuICAvKiogV2hldGhlciBhdXRvLWZ1bGxzY3JlZW4gaW4gcmVhZGluZyB2aWV3IGlzIGVuYWJsZWQgKi9cbiAgYXV0b0Z1bGxzY3JlZW46IGJvb2xlYW47XG4gIC8qKiBXWVNJV1lHIG1vZGUgKHVuaWZpZWQgZWRpdC9yZWFkaW5nIHR5cG9ncmFwaHkpIFx1MjAxNCBkZWNrIG5vdGVzIG9ubHkgKi9cbiAgd3lzaXd5Z01vZGU6IGJvb2xlYW47XG59XG5cbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IE5hdGl2ZVNsaWRlc1NldHRpbmdzID0ge1xuICBzaG93TmF2QnV0dG9uczogdHJ1ZSxcbiAgc2hvd1BhZ2VOdW1iZXI6IHRydWUsXG4gIGJhckhpZGRlbjogZmFsc2UsXG4gIGF1dG9GdWxsc2NyZWVuOiB0cnVlLFxuICB3eXNpd3lnTW9kZTogZmFsc2UsXG59O1xuXG4vKiogUmVzZXJ2ZWQgZnJvbnRtYXR0ZXIga2V5IGRyaXZpbmcgZGVjayBuYXZpZ2F0aW9uIChuZXZlciByZW5kZXJlZCBhcyBhIGNoaXApICovXG5jb25zdCBERUNLX0tFWSA9IFwiZGVja1wiO1xuXG4vKipcbiAqIEZpeGVkIG9uZS1wYWdlIHNhbXBsZSBub3RlcyB1c2VkIGJ5IHRoZSBucy1kZWJ1Zy1zdHlsZXMgY29tbWFuZFxuICogKGVkaXQgc2lkZSkuIERvIG5vdCByZW5hbWUgb3IgcmVtb3ZlIHRoZW06IGVhY2ggY292ZXJzIGEgZ3JvdXAgb2ZcbiAqIHR5cG9ncmFwaHkgZWxlbWVudHMgc28gZXZlcnl0aGluZyBpcyB2aXNpYmxlIHdpdGhvdXQgc2Nyb2xsaW5nLlxuICovXG5jb25zdCBTQU1QTEVfTk9URV9OQU1FUyA9IFtcbiAgXCJ0eXBvZ3JhcGh5LXNhbXBsZS1oZWFkaW5nc1wiLFxuICBcInR5cG9ncmFwaHktc2FtcGxlLWxpc3RcIixcbiAgXCJ0eXBvZ3JhcGh5LXNhbXBsZS1jb2RlXCIsXG4gIFwidHlwb2dyYXBoeS1zYW1wbGUtcXVvdGVcIixcbiAgXCJ0eXBvZ3JhcGh5LXNhbXBsZS1tZWRpYVwiLFxuXTtcblxuLyoqIFN0eWxlIHNlY3Rpb25zIHNhbXBsZWQgYnkgc2FtcGxlU3R5bGVzKCkgYW5kIGNvbXBhcmVkIGJ5IGRpZmZEdW1wcygpICovXG5jb25zdCBTVFlMRV9TRUNUSU9OUyA9IFtcbiAgXCJjb250YWluZXJcIixcbiAgXCJwYXJhZ3JhcGhcIixcbiAgXCJoMVwiLFxuICBcImxpc3RJdGVtXCIsXG4gIFwiY29kZUJsb2NrXCIsXG4gIFwiYmxvY2txdW90ZVwiLFxuICBcImlubGluZUNvZGVcIixcbiAgXCJ0YWJsZVwiLFxuICBcImltYWdlXCIsXG4gIFwiaG9yaXpvbnRhbFJ1bGVcIixcbl07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE5hdGl2ZVNsaWRlc1BsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIC8qKiBUaGUgcHJvcGVydGllcyBiYXIgRE9NIGVsZW1lbnQgKi9cbiAgcHJpdmF0ZSBiYXI6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIC8qKiBXaGV0aGVyIGZ1bGxzY3JlZW4gcmVhZGluZyBtb2RlIGlzIGN1cnJlbnRseSBhY3RpdmUgKi9cbiAgcHJpdmF0ZSBmdWxsc2NyZWVuID0gZmFsc2U7XG4gIC8qKiBMYXN0IHJlZnJlc2gga2V5IChcInBhdGh8bW9kZVwiKSB0byBhdm9pZCBwb2ludGxlc3MgcmUtcmVuZGVycyAqL1xuICBwcml2YXRlIGxhc3RLZXkgPSBcIlwiO1xuICAvKiogTGFzdCBtZWFzdXJlZCB0YWItYmFyIGhlaWdodCAocHgpIFx1MjAxNCBjYWNoZWQgd2hpbGUgdGhlIGJhciBpcyBoaWRkZW4gKi9cbiAgcHJpdmF0ZSB0YWJCYXJIZWlnaHQgPSAwO1xuICAvKiogUGx1Z2luIHNldHRpbmdzICovXG4gIHNldHRpbmdzOiBOYXRpdmVTbGlkZXNTZXR0aW5ncyA9IHsgLi4uREVGQVVMVF9TRVRUSU5HUyB9O1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgTmF0aXZlU2xpZGVzU2V0dGluZ1RhYih0aGlzKSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMS4gUmVmcmVzaCBvbiBcImN1cnJlbnQgbm90ZSAvIHZpZXcgY2hhbmdlZFwiIGV2ZW50cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsICgpID0+IHRoaXMucmVmcmVzaCgpKSk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAoKSA9PiB0aGlzLnJlZnJlc2goKSkpO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJsYXlvdXQtY2hhbmdlXCIsICgpID0+IHRoaXMucmVmcmVzaCgpKSk7XG4gICAgLy8gUmVmcmVzaCB3aGVuIHRoZSBub3RlIGNvbnRlbnQgKGluY2x1ZGluZyBmcm9udG1hdHRlcikgY2hhbmdlcyAvIHNhdmVzXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5vbihcImNoYW5nZWRcIiwgKGZpbGU6IFRGaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlID09PSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpKSB0aGlzLnJlZnJlc2goKTtcbiAgICAgIH0pLFxuICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMi4gRmFsbGJhY2sgdGltZXI6IGVkaXRcdTIxOTRyZWFkaW5nIHRvZ2dsZXMgbWF5IGZpcmUgbm8gc3RhbmRhcmQgZXZlbnQgXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5yZWdpc3RlckludGVydmFsKFxuICAgICAgd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGNvbnN0IGtleSA9IGZpbGUgPyBgJHtmaWxlLnBhdGh9fCR7dGhpcy5jdXJyZW50TW9kZSgpfWAgOiBcIlwiO1xuICAgICAgICBpZiAoa2V5ICE9PSB0aGlzLmxhc3RLZXkpIHtcbiAgICAgICAgICB0aGlzLmxhc3RLZXkgPSBrZXk7XG4gICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgIH1cbiAgICAgIH0sIDUwMCksXG4gICAgKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCAzLiBDb21tYW5kcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICAvLyAzYS4gTWFudWFsbHkgc2hvdyAvIGhpZGUgdGhlIHByb3BlcnRpZXMgYmFyXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLXRvZ2dsZS1iYXJcIixcbiAgICAgIG5hbWU6IFwiVG9nZ2xlIFByb3BlcnRpZXMgQmFyXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgICB0aGlzLnNldHRpbmdzLmJhckhpZGRlbiA9ICF0aGlzLnNldHRpbmdzLmJhckhpZGRlbjtcbiAgICAgICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIC8vIDNiLiBQYXVzZSAvIHJlc3VtZSBhdXRvLWZ1bGxzY3JlZW4gaW4gcmVhZGluZyB2aWV3XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLXRvZ2dsZS1mdWxsc2NyZWVuXCIsXG4gICAgICBuYW1lOiBcIlBhdXNlL1Jlc3VtZSBBdXRvIEZ1bGxzY3JlZW5cIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MuYXV0b0Z1bGxzY3JlZW4gPSAhdGhpcy5zZXR0aW5ncy5hdXRvRnVsbHNjcmVlbjtcbiAgICAgICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgLy8gV2hlbiBwYXVzZWQsIHJlc3RvcmUgdGhlIGxheW91dCBpbW1lZGlhdGVseTsgd2hlbiByZXN1bWVkLCByZS1zeW5jXG4gICAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5hdXRvRnVsbHNjcmVlbikgdGhpcy5zeW5jRnVsbHNjcmVlbihmYWxzZSk7XG4gICAgICAgIGVsc2UgdGhpcy5yZWZyZXNoKCk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIC8vIDNjLiBQcmV2aW91cyAvIG5leHQgcGFnZSAoZGVjayBuYXZpZ2F0aW9uLCByZWJpbmRhYmxlIGluIFNldHRpbmdzIFx1MjE5MiBIb3RrZXlzKVxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJucy1wcmV2XCIsXG4gICAgICBuYW1lOiBcIlByZXZpb3VzIFBhZ2VcIixcbiAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJBcnJvd0xlZnRcIiB9XSxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLm5hdmlnYXRlKFwicHJldlwiKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibnMtbmV4dFwiLFxuICAgICAgbmFtZTogXCJOZXh0IFBhZ2VcIixcbiAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJBcnJvd1JpZ2h0XCIgfV0sXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5uYXZpZ2F0ZShcIm5leHRcIiksXG4gICAgfSk7XG4gICAgLy8gM2QuIENyZWF0ZSBOZXh0IFNsaWRlIFx1MjAxNCBuZXcgc2xpZGUgYWZ0ZXIgdGhlIGN1cnJlbnQgb25lIChkZWNrIG5vdGVzIG9ubHkpXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLWNyZWF0ZS1uZXh0XCIsXG4gICAgICBuYW1lOiBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIsXG4gICAgICAvLyBHcmV5ZWQgb3V0IGluIHRoZSBwYWxldHRlIHVubGVzcyB0aGUgYWN0aXZlIG5vdGUgY2FuIHRha2UgYSBuZXh0IHNsaWRlXG4gICAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmcpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGlmICghZmlsZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBjb25zdCBwbGFuID0gdGhpcy5wbGFuQ3JlYXRlTmV4dChmaWxlKTtcbiAgICAgICAgaWYgKCFwbGFuKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghY2hlY2tpbmcpIHZvaWQgdGhpcy5leGVjdXRlQ3JlYXRlTmV4dChmaWxlLCBwbGFuKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIC8vIDNlLiBUb2dnbGUgV1lTSVdZRyBtb2RlIFx1MjAxNCB1bmlmaWVkIGVkaXQvcmVhZGluZyB0eXBvZ3JhcGh5IChkZWNrIG5vdGVzIG9ubHkpXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5zLXRvZ2dsZS13eXNpd3lnXCIsXG4gICAgICBuYW1lOiBcIlRvZ2dsZSBXWVNJV1lHIE1vZGVcIixcbiAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJFXCIgfV0sXG4gICAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmcpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGlmICghZmlsZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBjb25zdCBmbSA9IHRoaXMuZnJvbnRtYXR0ZXJPZihmaWxlKTtcbiAgICAgICAgaWYgKGZtID09PSBudWxsIHx8ICEoREVDS19LRVkgaW4gZm0pKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghY2hlY2tpbmcpIHRoaXMudG9nZ2xlV3lzaXd5ZygpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgLy8gM2YuIERlYnVnOiBkdW1wIHR5cG9ncmFwaHkgY29tcHV0ZWQgc3R5bGVzIGZvciBlZGl0L3JlYWRpbmcgY29tcGFyaXNvblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJucy1kZWJ1Zy1zdHlsZXNcIixcbiAgICAgIG5hbWU6IFwiRGVidWc6IER1bXAgVHlwb2dyYXBoeSBTdHlsZXNcIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB2b2lkIHRoaXMuZGVidWdTdHlsZXMoKSxcbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCA0LiBFc2MgZXhpdHMgT1MgZnVsbHNjcmVlbiBcdTIxOTIgbGVhdmUgcmVhZGluZyB2aWV3IGFzIHdlbGwgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgLy8gS2VlcHMgaW50ZXJuYWwgc3RhdGUgaW4gc3luYyB3aGVuIHRoZSB1c2VyIHByZXNzZXMgRXNjOyBhbHNvIHN3aXRjaGVzXG4gICAgLy8gdGhlIGFjdGl2ZSBNYXJrZG93biB2aWV3IGJhY2sgdG8gZWRpdCBtb2RlLiBPdXIgb3duIGV4aXRGdWxsc2NyZWVuKClcbiAgICAvLyBjYWxscyBzZXQgdGhpcy5mdWxsc2NyZWVuID0gZmFsc2UgZmlyc3QsIHNvIHRoZXkgbmV2ZXIgdHJpZ2dlciB0aGlzLlxuICAgIHRoaXMucmVnaXN0ZXJEb21FdmVudChkb2N1bWVudCwgXCJmdWxsc2NyZWVuY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGlmICghZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQgJiYgdGhpcy5mdWxsc2NyZWVuKSB7XG4gICAgICAgIHRoaXMuZnVsbHNjcmVlbiA9IGZhbHNlO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoXCJuYXRpdmUtc2xpZGVzLWZ1bGxzY3JlZW5cIik7XG4gICAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgICAgICBpZiAodmlldyAmJiB2aWV3LmdldE1vZGUoKSA9PT0gXCJwcmV2aWV3XCIpIHtcbiAgICAgICAgICAvLyBMZWF2ZSByZWFkaW5nIHZpZXcgdmlhIHRoZSBwdWJsaWMgdmlldy1zdGF0ZSBBUElcbiAgICAgICAgICBjb25zdCBzdGF0ZSA9IHZpZXcubGVhZi5nZXRWaWV3U3RhdGUoKTtcbiAgICAgICAgICBzdGF0ZS5zdGF0ZSA9IHsgLi4uc3RhdGUuc3RhdGUsIG1vZGU6IFwic291cmNlXCIgfTtcbiAgICAgICAgICB2b2lkIHZpZXcubGVhZi5zZXRWaWV3U3RhdGUoc3RhdGUsIHsgZm9jdXM6IGZhbHNlIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgNS4gQ3JlYXRlIHRoZSBiYXIgYW5kIGRvIHRoZSBmaXJzdCByZW5kZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5iYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRoaXMuYmFyLmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy1iYXJcIjtcbiAgICB0aGlzLmJhci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7IC8vIGhpZGRlbiB1bnRpbCByZWZyZXNoKCkgZGVjaWRlcyBvdGhlcndpc2VcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuYmFyKTtcbiAgICB0aGlzLnJlZnJlc2goKTtcbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuYmFyPy5yZW1vdmUoKTtcbiAgICB0aGlzLmJhciA9IG51bGw7XG4gICAgLy8gTGVhdmUgT1MgZnVsbHNjcmVlbiBhbmQgZHJvcCB0aGUgZnVsbHNjcmVlbiBjbGFzcyBzbyBubyBVSSByZXNpZHVlIHJlbWFpbnNcbiAgICBpZiAoZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQpIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuPy4oKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKFwibmF0aXZlLXNsaWRlcy1mdWxsc2NyZWVuXCIpO1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShcIm5hdGl2ZS1zbGlkZXMtd3lzaXd5Z1wiKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTZXR0aW5ncyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBEZWNrIHJlc29sdXRpb24gKHdhbGsgdGhlIGxpbmsgY2hhaW4pIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBSZXNvbHZlIHRoZSBjdXJyZW50IG5vdGUncyBwb3NpdGlvbiBpbnNpZGUgaXRzIGRlY2sgKHBhdGgtYmFzZWQgd3JhcHBlcikgKi9cbiAgcHJpdmF0ZSBjb21wdXRlRGVjayhmaWxlOiBURmlsZSk6IERlY2tJbmZvIHwgbnVsbCB7XG4gICAgcmV0dXJuIGNvbXB1dGVEZWNrKGZpbGUucGF0aCwgKHBhdGgpID0+IHRoaXMuZGVja0xpbmtQYXRocyhwYXRoKSk7XG4gIH1cblxuICAvKiogUmVzb2x2ZSB0aGUgYGRlY2tgIHByb3BlcnR5IG9mIGEgbm90ZSBpbnRvIHJlYWwgbm90ZSBwYXRocyAobWF4IHR3bykgKi9cbiAgcHJpdmF0ZSBkZWNrTGlua1BhdGhzKHBhdGg6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBmID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgIGlmICghKGYgaW5zdGFuY2VvZiBURmlsZSkpIHJldHVybiBbXTtcbiAgICBjb25zdCBmbSA9IHRoaXMuZnJvbnRtYXR0ZXJPZihmKTtcbiAgICBjb25zdCBuYW1lcyA9IGZtID8gZXh0cmFjdExpbmtzKGZtW0RFQ0tfS0VZXSkgOiBbXTtcbiAgICByZXR1cm4gbmFtZXNcbiAgICAgIC5tYXAoKG5hbWUpID0+IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3QobmFtZSwgcGF0aCkpXG4gICAgICAuZmlsdGVyKCh4KTogeCBpcyBURmlsZSA9PiAhIXgpXG4gICAgICAubWFwKCh4KSA9PiB4LnBhdGgpO1xuICB9XG5cbiAgLyoqIE5hbWVzIGluIHRoZSBgZGVja2AgcHJvcGVydHkgdGhhdCByZXNvbHZlIHRvIG5vIG5vdGUgKGJyb2tlbiBsaW5rcykgKi9cbiAgcHJpdmF0ZSBicm9rZW5EZWNrTGlua3MoZmlsZTogVEZpbGUpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZm0gPSB0aGlzLmZyb250bWF0dGVyT2YoZmlsZSk7XG4gICAgY29uc3QgbmFtZXMgPSBmbSA/IGV4dHJhY3RMaW5rcyhmbVtERUNLX0tFWV0pIDogW107XG4gICAgcmV0dXJuIG5hbWVzLmZpbHRlcigobmFtZSkgPT4gIXRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3QobmFtZSwgZmlsZS5wYXRoKSk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgQ3JlYXRlIE5leHQgU2xpZGUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLyoqXG4gICAqIFBsYW4gYSBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIgcnVuIGZvciB0aGUgYWN0aXZlIG5vdGUsIG9yIG51bGwgd2hlbiB0aGVcbiAgICogbm90ZSBjYW5ub3QgdGFrZSBhIG5leHQgc2xpZGUgKG5vIHVzYWJsZSBgZGVja2AgcHJvcGVydHkpLlxuICAgKlxuICAgKiBTbGlkZXMgb24gdGhlIGNoYWluIGluc2VydC9hcHBlbmQgYWZ0ZXIgdGhlIGN1cnJlbnQgbm90ZTsgdGhlIG92ZXJ2aWV3XG4gICAqIHBhZ2UgaW5zZXJ0cyBhIG5ldyBmaXJzdCBwYWdlOyBhbiBvZmYtY2hhaW4gbm90ZSB3aXRoIGEgcmVzb2x2YWJsZVxuICAgKiBvdmVydmlldyBsaW5rIHN0aWxsIGdldHMgaXRzIGRlY2xhcmVkIG1pc3NpbmcgbmV4dCBub3RlIGNyZWF0ZWQuXG4gICAqL1xuICBwcml2YXRlIHBsYW5DcmVhdGVOZXh0KGZpbGU6IFRGaWxlKTogQ3JlYXRlTmV4dFJlc3VsdCB8IG51bGwge1xuICAgIGNvbnN0IGZtID0gdGhpcy5mcm9udG1hdHRlck9mKGZpbGUpO1xuICAgIGNvbnN0IHJhdyA9IGZtID8gZXh0cmFjdFJhd0xpbmtzKGZtW0RFQ0tfS0VZXSkgOiBbXTtcbiAgICBpZiAocmF3Lmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgICBjb25zdCBkZWNrID0gdGhpcy5jb21wdXRlRGVjayhmaWxlKTtcbiAgICBjb25zdCBleGlzdGluZ05hbWVzID0gbmV3IFNldCh0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCkubWFwKChmKSA9PiBmLmJhc2VuYW1lKSk7XG5cbiAgICBpZiAoZGVjaykge1xuICAgICAgLy8gT3ZlcnZpZXcgaW5zZXJ0aW9uIG5lZWRzIHRoZSBvbGQgZmlyc3QgcGFnZSdzIGJhY2sgbGluayB0byB0aGVcbiAgICAgIC8vIG92ZXJ2aWV3IChpdHMgb3duIGZyb250bWF0dGVyIG9ubHkgbGlua3MgZm9yd2FyZCkuXG4gICAgICBsZXQgb3ZlcnZpZXdCYWNrTGluazogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKGRlY2suaW5kZXggPT09IDApIHtcbiAgICAgICAgY29uc3Qgb2xkRmlyc3QgPSBkZWNrLmNoYWluWzFdID8gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGRlY2suY2hhaW5bMV0pIDogbnVsbDtcbiAgICAgICAgaWYgKG9sZEZpcnN0IGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgICAgICBjb25zdCBmMiA9IHRoaXMuZnJvbnRtYXR0ZXJPZihvbGRGaXJzdCk7XG4gICAgICAgICAgb3ZlcnZpZXdCYWNrTGluayA9IGYyID8gZXh0cmFjdFJhd0xpbmtzKGYyW0RFQ0tfS0VZXSlbMF0gOiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBwbGFuQ3JlYXRlTmV4dCh7XG4gICAgICAgIGN1cnJlbnROYW1lOiBmaWxlLmJhc2VuYW1lLFxuICAgICAgICBjdXJyZW50TGlua3M6IHJhdyxcbiAgICAgICAgaXNPdmVydmlldzogZGVjay5pbmRleCA9PT0gMCxcbiAgICAgICAgb3ZlcnZpZXdCYWNrTGluayxcbiAgICAgICAgZXhpc3RpbmdOYW1lcyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIE9mZi1jaGFpbiBub3RlOiBzdGlsbCBjcmVhdGUgaXRzIGRlY2xhcmVkIG1pc3NpbmcgbmV4dCBub3RlIHdoZW4gdGhlXG4gICAgLy8gb3ZlcnZpZXcgbGluayByZXNvbHZlcyAodGhlIFx1MjZBMCBicm9rZW4tbGluayB3YXJuaW5nIGRpc2FwcGVhcnMpLlxuICAgIGNvbnN0IG92ZXJ2aWV3TmFtZSA9IHJhdy5sZW5ndGggPj0gMiA/IGV4dHJhY3RMaW5rcyhyYXdbMF0pWzBdIDogbnVsbDtcbiAgICBpZiAob3ZlcnZpZXdOYW1lICYmIHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3Qob3ZlcnZpZXdOYW1lLCBmaWxlLnBhdGgpKSB7XG4gICAgICByZXR1cm4gcGxhbkNyZWF0ZU5leHQoe1xuICAgICAgICBjdXJyZW50TmFtZTogZmlsZS5iYXNlbmFtZSxcbiAgICAgICAgY3VycmVudExpbmtzOiByYXcsXG4gICAgICAgIGlzT3ZlcnZpZXc6IGZhbHNlLFxuICAgICAgICBleGlzdGluZ05hbWVzLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqIEFwcGx5IGEgcGxhbjogY3JlYXRlIHRoZSBub3RlLCByZXdpcmUgYGRlY2tgIHByb3BlcnRpZXMsIG9wZW4gaXQgKi9cbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlQ3JlYXRlTmV4dChmaWxlOiBURmlsZSwgcGxhbjogQ3JlYXRlTmV4dFJlc3VsdCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGRpciA9IGZpbGUucGFyZW50Py5wYXRoID8gZmlsZS5wYXJlbnQucGF0aCArIFwiL1wiIDogXCJcIjtcbiAgICBjb25zdCBuZXdQYXRoID0gYCR7ZGlyfSR7cGxhbi5uZXdOYW1lfS5tZGA7XG4gICAgY29uc3QgZnJvbnRtYXR0ZXIgPSBwbGFuLm5ld0RlY2tMaW5rcy5tYXAoKGxpbmspID0+IEpTT04uc3RyaW5naWZ5KGxpbmspKS5qb2luKFwiLCBcIik7XG4gICAgY29uc3QgY29udGVudCA9IGAtLS1cXG5kZWNrOiBbJHtmcm9udG1hdHRlcn1dXFxuLS0tXFxuYDtcblxuICAgIGxldCBuZXdGaWxlOiBURmlsZTtcbiAgICB0cnkge1xuICAgICAgbmV3RmlsZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShuZXdQYXRoLCBjb250ZW50KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgbmV3IE5vdGljZShgTmF0aXZlIFNsaWRlczogY291bGQgbm90IGNyZWF0ZSBcIiR7cGxhbi5uZXdOYW1lfS5tZFwiICgke1N0cmluZyhlcnJvcil9KWApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJld2lyZSB0aGUgY3VycmVudCBub3RlJ3MgYGRlY2tgIChrZWVwcyBhbGwgb3RoZXIgcHJvcGVydGllcyBpbnRhY3QpXG4gICAgZm9yIChjb25zdCByZXdyaXRlIG9mIHBsYW4ucmV3cml0ZXMpIHtcbiAgICAgIGlmIChyZXdyaXRlLm5hbWUgIT09IGZpbGUuYmFzZW5hbWUpIGNvbnRpbnVlOyAvLyBpbiBwcmFjdGljZSBhbHdheXMgdGhlIGN1cnJlbnQgbm90ZVxuICAgICAgYXdhaXQgdGhpcy5hcHAuZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKGZpbGUsIChmbSkgPT4ge1xuICAgICAgICBmbVtERUNLX0tFWV0gPSByZXdyaXRlLmRlY2s7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBPcGVuIHRoZSBuZXcgbm90ZSBpbiB0aGUgY3VycmVudCBwYW5lLCBlZGl0IG1vZGUgKExpdmUgUHJldmlldylcbiAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpO1xuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUobmV3RmlsZSwgeyBzdGF0ZTogeyBtb2RlOiBcInNvdXJjZVwiIH0gfSk7XG4gIH1cblxuICAvKiogRnJvbnRtYXR0ZXIgb2YgYW55IG5vdGUgYXMgYW4gb2JqZWN0LCBvciBudWxsIHdoZW4gYWJzZW50ICovXG4gIHByaXZhdGUgZnJvbnRtYXR0ZXJPZihmaWxlOiBURmlsZSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCB7XG4gICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgICByZXR1cm4gY2FjaGU/LmZyb250bWF0dGVyID8/IG51bGw7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgUFBUIG5hdmlnYXRpb24gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLyoqIE1vdmUgb25lIHN0ZXAgYmFjay9mb3J3YXJkIGFsb25nIHRoZSBkZWNrIGNoYWluICovXG4gIHByaXZhdGUgbmF2aWdhdGUoZGlyZWN0aW9uOiBcInByZXZcIiB8IFwibmV4dFwiKTogdm9pZCB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgaWYgKCFmaWxlKSByZXR1cm47XG4gICAgY29uc3QgZGVjayA9IHRoaXMuY29tcHV0ZURlY2soZmlsZSk7XG4gICAgaWYgKCFkZWNrKSByZXR1cm47XG4gICAgY29uc3QgdGFyZ2V0ID0gZGVjay5jaGFpbltkaXJlY3Rpb24gPT09IFwicHJldlwiID8gZGVjay5pbmRleCAtIDEgOiBkZWNrLmluZGV4ICsgMV07XG4gICAgaWYgKCF0YXJnZXQpIHJldHVybjtcbiAgICB2b2lkIHRoaXMuYXBwLndvcmtzcGFjZS5vcGVuTGlua1RleHQodGFyZ2V0LCBmaWxlLnBhdGgpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIE1vZGUgLyBkYXRhIGFjY2VzcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICAvKiogTW9kZSBvZiB0aGUgYWN0aXZlIE1hcmtkb3duIHZpZXc6ICdwcmV2aWV3Jz1yZWFkaW5nICdzb3VyY2UnPWVkaXRpbmcgJyc9bm9uZSAqL1xuICBwcml2YXRlIGN1cnJlbnRNb2RlKCk6IFwicHJldmlld1wiIHwgXCJzb3VyY2VcIiB8IFwiXCIge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIHJldHVybiB2aWV3ID8gKHZpZXcuZ2V0TW9kZSgpIGFzIFwicHJldmlld1wiIHwgXCJzb3VyY2VcIikgOiBcIlwiO1xuICB9XG5cbiAgLyoqXG4gICAqIFRydWUgd2hlbiB0aGUgYWN0aXZlIGVkaXQgdmlldyBpcyBMaXZlIFByZXZpZXcgKFdZU0lXWUcpIFx1MjAxNCBhc1xuICAgKiBvcHBvc2VkIHRvIFNvdXJjZSBtb2RlLiBPYnNpZGlhbiByZXBvcnRzIGJvdGggYXMgbW9kZSBcInNvdXJjZVwiO1xuICAgKiB0aGUgdmlldyBzdGF0ZSBjYXJyaWVzIGEgYHNvdXJjZWAgZmxhZyAoU291cmNlIG1vZGUgPSB0cnVlKSwgd2l0aFxuICAgKiBhIERPTSBjbGFzcyBmYWxsYmFjayAoLmlzLWxpdmUtcHJldmlldykgZm9yIHNhZmV0eS5cbiAgICovXG4gIHByaXZhdGUgaXNMaXZlUHJldmlldygpOiBib29sZWFuIHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAoIXZpZXcgfHwgdmlldy5nZXRNb2RlKCkgIT09IFwic291cmNlXCIpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBzdGF0ZSA9IHZpZXcuZ2V0U3RhdGUoKSBhcyB7IHNvdXJjZT86IGJvb2xlYW4gfTtcbiAgICBpZiAoc3RhdGUuc291cmNlID09PSB0cnVlKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHN0YXRlLnNvdXJjZSA9PT0gZmFsc2UpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiAhIXZpZXcuY29udGVudEVsLnF1ZXJ5U2VsZWN0b3IoXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNi5pcy1saXZlLXByZXZpZXdcIik7XG4gIH1cblxuICAvKiogQ3VycmVudCBub3RlJ3MgZnJvbnRtYXR0ZXIgYXMgYW4gb2JqZWN0LCBvciBudWxsIHdoZW4gYWJzZW50ICovXG4gIHByaXZhdGUgZnJvbnRtYXR0ZXIoKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsIHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICByZXR1cm4gZmlsZSA/IHRoaXMuZnJvbnRtYXR0ZXJPZihmaWxlKSA6IG51bGw7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgQmFyIHJlbmRlcmluZyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICAvKiogRGVjaWRlIHdoYXQgdGhlIGJhciBzaG93cywgdGhlbiByZS1yZW5kZXIgaXQgKi9cbiAgcmVmcmVzaCgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuYmFyKSByZXR1cm47XG5cbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICBjb25zdCBtb2RlID0gdGhpcy5jdXJyZW50TW9kZSgpO1xuXG4gICAgLy8gQ2FyZCBub3RlID0gaGFzIGEgYGRlY2tgIHByb3BlcnR5ICh0aGUgV1lTSVdZRyBtb2RlJ3Mgc2NvcGUgbWFya2VyKVxuICAgIGNvbnN0IGNhcmRGbSA9IGZpbGUgPyB0aGlzLmZyb250bWF0dGVyT2YoZmlsZSkgOiBudWxsO1xuICAgIGNvbnN0IGlzQ2FyZCA9IGNhcmRGbSAhPT0gbnVsbCAmJiBERUNLX0tFWSBpbiBjYXJkRm07XG4gICAgLy8gTWVhc3VyZSB0aGUgdGFiIGJhciB3aGlsZSBpdCBpcyBzdGlsbCB2aXNpYmxlIChXWVNJV1lHIGhpZGVzIGl0XG4gICAgLy8gYmVsb3c7IHRoZSBsYXN0IG1lYXN1cmVkIHZhbHVlIGlzIHJldXNlZCBvbmNlIGhpZGRlbikuXG4gICAgdGhpcy5zeW5jVGFiQmFySGVpZ2h0KCk7XG4gICAgLy8gV1lTSVdZRyBtb2RlIGJvZHkgY2xhc3MgXHUyMDE0IGltbWVyc2l2ZSBtb2RlIChkZWNrIG5vdGVzIG9ubHkpLFxuICAgIC8vIGFjdGl2ZSBpbiBMaXZlIFByZXZpZXcgYW5kIHJlYWRpbmcgdmlldyBvbmx5OiBoaWRlcyB0aGUgdGFiIGJhclxuICAgIC8vIGFuZCBzaWRlYmFycywgbWF0Y2hlcyB0aGUgYm90dG9tIGJhcidzIGhlaWdodCB0byB0aGUgdGFiIGJhcixcbiAgICAvLyBoaWRlcyBpbi1ub3RlIHByb3BlcnRpZXMgd2hpbGUgZWRpdGluZywgY2VudGVycyBzdGFuZGFsb25lXG4gICAgLy8gaW1hZ2VzLiBTb3VyY2UgbW9kZSBhbmQgZXZlcnl0aGluZyBlbHNlIHN0YXkgY29tcGxldGVseSBuYXRpdmUuXG4gICAgY29uc3QgaXNTb3VyY2VNb2RlID0gbW9kZSA9PT0gXCJzb3VyY2VcIiAmJiAhdGhpcy5pc0xpdmVQcmV2aWV3KCk7XG4gICAgY29uc3Qgd3lzaXd5ZyA9IGlzQ2FyZCAmJiB0aGlzLnNldHRpbmdzLnd5c2l3eWdNb2RlICYmICFpc1NvdXJjZU1vZGU7XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QudG9nZ2xlKFwibmF0aXZlLXNsaWRlcy13eXNpd3lnXCIsIHd5c2l3eWcpO1xuXG4gICAgLy8gQXV0by1mdWxsc2NyZWVuOiBlbnRlciBvbiByZWFkaW5nIHZpZXcsIHJlc3RvcmUgb24gbGVhdmluZyBpdFxuICAgIHRoaXMuc3luY0Z1bGxzY3JlZW4obW9kZSA9PT0gXCJwcmV2aWV3XCIgJiYgdGhpcy5zZXR0aW5ncy5hdXRvRnVsbHNjcmVlbik7XG5cbiAgICAvLyBCYXIgdmlzaWJpbGl0eTogcmVhZGluZyB2aWV3IGFsd2F5czsgZWRpdCB2aWV3IG9ubHkgaW4gV1lTSVdZRyBtb2RlXG4gICAgLy8gKHNvIHRoZSBtb2RlIGhhcyB2aXNpYmxlIGZlZWRiYWNrIHdoaWxlIGVkaXRpbmcpLiBIaWRkZW4gd2hlbiB0aGVcbiAgICAvLyB1c2VyIGhpZCBpdCBtYW51YWxseS5cbiAgICBjb25zdCBiYXJWaXNpYmxlID1cbiAgICAgICEhZmlsZSAmJiAobW9kZSA9PT0gXCJwcmV2aWV3XCIgfHwgKG1vZGUgPT09IFwic291cmNlXCIgJiYgd3lzaXd5ZykpICYmICF0aGlzLnNldHRpbmdzLmJhckhpZGRlbjtcbiAgICBpZiAoIWJhclZpc2libGUpIHtcbiAgICAgIHRoaXMuYmFyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmbSA9IHRoaXMuZnJvbnRtYXR0ZXIoKTtcbiAgICBjb25zdCBkZWNrID0gdGhpcy5jb21wdXRlRGVjayhmaWxlKTtcbiAgICBjbGVhckNoaWxkcmVuKHRoaXMuYmFyKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBMZWZ0OiBwcmV2aW91cyAvIG5leHQgYnV0dG9ucyAoYm90aCBhbHdheXMgc2hvd24gaW5zaWRlIGEgZGVjaztcbiAgICAvLyAgICAgICAgdGhlIG9uZSB0aGF0IGNhbm5vdCBtb3ZlIGlzIGRpc2FibGVkIC8gbGlnaHQgZ3JheSkgXHUyNTAwXHUyNTAwXG4gICAgaWYgKHRoaXMuc2V0dGluZ3Muc2hvd05hdkJ1dHRvbnMgJiYgZGVjaykge1xuICAgICAgY29uc3QgaGFzUHJldiA9IGRlY2suaW5kZXggPiAwO1xuICAgICAgY29uc3QgaGFzTmV4dCA9IGRlY2suaW5kZXggPCBkZWNrLmNoYWluLmxlbmd0aCAtIDE7XG4gICAgICBjb25zdCBuYXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgbmF2LmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy1uYXZcIjtcbiAgICAgIG5hdi5hcHBlbmRDaGlsZCh0aGlzLm5hdkJ1dHRvbihcIlx1MjVDMFwiLCBcIlByZXZpb3VzIHBhZ2VcIiwgKCkgPT4gdGhpcy5uYXZpZ2F0ZShcInByZXZcIiksICFoYXNQcmV2KSk7XG4gICAgICBuYXYuYXBwZW5kQ2hpbGQodGhpcy5uYXZCdXR0b24oXCJcdTI1QjZcIiwgXCJOZXh0IHBhZ2VcIiwgKCkgPT4gdGhpcy5uYXZpZ2F0ZShcIm5leHRcIiksICFoYXNOZXh0KSk7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChuYXYpO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBNaWRkbGU6IGNoaXBzIGZvciB0aGUgcmVtYWluaW5nIHByb3BlcnRpZXMgKG5vIHBsYWNlaG9sZGVyKSBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCB2aXNpYmxlID0gZm1cbiAgICAgID8gT2JqZWN0LmVudHJpZXMoZm0pLmZpbHRlcigoW2tleV0pID0+IGtleSAhPT0gREVDS19LRVkgJiYga2V5ICE9PSBcInBvc2l0aW9uXCIpXG4gICAgICA6IFtdO1xuXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgdmlzaWJsZSkge1xuICAgICAgY29uc3Qgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgc3Bhbi5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtaXRlbVwiO1xuICAgICAgY29uc3QgayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHJvbmdcIik7XG4gICAgICBrLnRleHRDb250ZW50ID0ga2V5O1xuICAgICAgc3Bhbi5hcHBlbmRDaGlsZChrKTtcbiAgICAgIHNwYW4uYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCI6IFwiICsgZm9ybWF0VmFsdWUodmFsdWUpKSk7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICB9XG5cbiAgICAvLyBCcm9rZW4gZGVjayBsaW5rcyBcdTIxOTIgd2FybmluZyBjaGlwIHNvIGRlY2sgYXV0aG9ycyBzcG90IHR5cG9zXG4gICAgY29uc3QgYnJva2VuID0gZmlsZSA/IHRoaXMuYnJva2VuRGVja0xpbmtzKGZpbGUpIDogW107XG4gICAgaWYgKGJyb2tlbi5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB3YXJuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICB3YXJuLmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy13YXJuXCI7XG4gICAgICB3YXJuLnRleHRDb250ZW50ID0gXCJcdTI2QTAgXCIgKyBicm9rZW4uam9pbihcIiwgXCIpO1xuICAgICAgd2Fybi50aXRsZSA9IFwiQnJva2VuIGRlY2sgbGluayhzKSBcdTIwMTQgdGhlIHRhcmdldCBub3RlIGRvZXMgbm90IGV4aXN0XCI7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZCh3YXJuKTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQm90dG9tLXJpZ2h0OiBXWVNJV1lHIG1vZGUgdG9nZ2xlIChkZWNrIG5vdGVzIG9ubHkpIFx1MjUwMFx1MjUwMFxuICAgIGlmIChpc0NhcmQpIHtcbiAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICBidG4uY2xhc3NOYW1lID0gXCJuYXRpdmUtc2xpZGVzLXd5c2l3eWctYnRuXCIgKyAodGhpcy5zZXR0aW5ncy53eXNpd3lnTW9kZSA/IFwiIGlzLWFjdGl2ZVwiIDogXCJcIik7XG4gICAgICBidG4udGV4dENvbnRlbnQgPSB0aGlzLnNldHRpbmdzLnd5c2l3eWdNb2RlID8gXCJXWVNJV1lHOiBPblwiIDogXCJXWVNJV1lHOiBPZmZcIjtcbiAgICAgIGJ0bi50aXRsZSA9IFwiVG9nZ2xlIFdZU0lXWUcgbW9kZSBcdTIwMTQgdW5pZmllZCB0eXBvZ3JhcGh5IGJldHdlZW4gZWRpdCBhbmQgcmVhZGluZ1wiO1xuICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLnRvZ2dsZVd5c2l3eWcoKSk7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChidG4pO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBCb3R0b20tcmlnaHQ6IGF1dG8tY29tcHV0ZWQgcGFnZSBudW1iZXIgXHUyNTAwXHUyNTAwXG4gICAgaWYgKHRoaXMuc2V0dGluZ3Muc2hvd1BhZ2VOdW1iZXIgJiYgZGVjaykge1xuICAgICAgY29uc3QgcGFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgcGFnZS5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtcGFnZVwiO1xuICAgICAgLy8gY2hhaW5bMF0gaXMgdGhlIG92ZXJ2aWV3IG5vdGU7IHNsaWRlcyBzdGFydCBhdCBpbmRleCAxIFx1MjE5MiBcIlBhZ2UgMVwiXG4gICAgICBwYWdlLnRleHRDb250ZW50ID0gZGVjay5pbmRleCA9PT0gMCA/IFwiT3ZlcnZpZXdcIiA6IGBQYWdlICR7ZGVjay5pbmRleH1gO1xuICAgICAgdGhpcy5iYXIuYXBwZW5kQ2hpbGQocGFnZSk7XG4gICAgfVxuXG4gICAgLy8gSGlkZSB0aGUgYmFyIGVudGlyZWx5IHdoZW4gaXQgaGFzIG5vdGhpbmcgdG8gZGlzcGxheSAobm8gcHJvcGVydGllcyxcbiAgICAvLyBhbmQgbm90IHBhcnQgb2YgYSBkZWNrKVxuICAgIHRoaXMuYmFyLnN0eWxlLmRpc3BsYXkgPSB0aGlzLmJhci5jaGlsZEVsZW1lbnRDb3VudCA9PT0gMCA/IFwibm9uZVwiIDogXCJcIjtcbiAgfVxuXG4gIC8qKiBCdWlsZCBhIFx1MjVDMCAvIFx1MjVCNiBuYXZpZ2F0aW9uIGJ1dHRvbjsgYGRpc2FibGVkYCByZW5kZXJzIGl0IGxpZ2h0IGdyYXkvaW5hY3RpdmUgKi9cbiAgcHJpdmF0ZSBuYXZCdXR0b24oXG4gICAgbGFiZWw6IHN0cmluZyxcbiAgICB0aXA6IHN0cmluZyxcbiAgICBvbkNsaWNrOiAoKSA9PiB2b2lkLFxuICAgIGRpc2FibGVkID0gZmFsc2UsXG4gICk6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgIGJ0bi5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtbmF2LWJ0blwiO1xuICAgIGJ0bi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICAgIGJ0bi50aXRsZSA9IHRpcDtcbiAgICBidG4uZGlzYWJsZWQgPSBkaXNhYmxlZDtcbiAgICBpZiAoIWRpc2FibGVkKSBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uQ2xpY2spO1xuICAgIHJldHVybiBidG47XG4gIH1cblxuICAvKipcbiAgICogTWVhc3VyZSB0aGUgdG9wIHRhYiBiYXIgYW5kIGV4cG9zZSBpdHMgaGVpZ2h0IGFzIHRoZSBDU1MgdmFyaWFibGVcbiAgICogLS1uYXRpdmUtc2xpZGVzLXRhYmJhci1oZWlnaHQuIFRoZSBiYXIgaXMgaGlkZGVuIGluIFdZU0lXWUcgcmVhZGluZ1xuICAgKiB2aWV3LCBzbyB0aGUgbGFzdCBtZWFzdXJlZCB2YWx1ZSBpcyBjYWNoZWQgYW5kIHJldXNlZCB0aGVyZS5cbiAgICovXG4gIHByaXZhdGUgc3luY1RhYkJhckhlaWdodCgpOiB2b2lkIHtcbiAgICBjb25zdCB0YWJCYXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcbiAgICAgIFwiLndvcmtzcGFjZS10YWJzLm1vZC10b3AgLndvcmtzcGFjZS10YWItaGVhZGVyLWNvbnRhaW5lclwiLFxuICAgICk7XG4gICAgaWYgKHRhYkJhciAmJiB0YWJCYXIub2Zmc2V0SGVpZ2h0ID4gMCkgdGhpcy50YWJCYXJIZWlnaHQgPSB0YWJCYXIub2Zmc2V0SGVpZ2h0O1xuICAgIGlmICh0aGlzLnRhYkJhckhlaWdodCA+IDApIHtcbiAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eShcbiAgICAgICAgXCItLW5hdGl2ZS1zbGlkZXMtdGFiYmFyLWhlaWdodFwiLFxuICAgICAgICBgJHt0aGlzLnRhYkJhckhlaWdodH1weGAsXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBObyBtZWFzdXJlbWVudCB5ZXQgKHRhYiBiYXIgaGlkZGVuIHNpbmNlIGxvYWQpIFx1MjAxNCBsZXQgdGhlIENTU1xuICAgICAgLy8gZmFsbGJhY2sgdmFsdWUgYXBwbHkuXG4gICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUucmVtb3ZlUHJvcGVydHkoXCItLW5hdGl2ZS1zbGlkZXMtdGFiYmFyLWhlaWdodFwiKTtcbiAgICB9XG4gIH1cblxuICAvKiogU3luYyB0aGUgZnVsbHNjcmVlbiBzdGF0ZTogYWRkIHRoZSBjbGFzcyArIHJlcXVlc3QgT1MgZnVsbHNjcmVlbiwgb3IgcmVzdG9yZSAqL1xuICBwcml2YXRlIHN5bmNGdWxsc2NyZWVuKGFjdGl2ZTogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICh0aGlzLmZ1bGxzY3JlZW4gPT09IGFjdGl2ZSkgcmV0dXJuOyAvLyBub3RoaW5nIHRvIGRvXG4gICAgdGhpcy5mdWxsc2NyZWVuID0gYWN0aXZlO1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnRvZ2dsZShcIm5hdGl2ZS1zbGlkZXMtZnVsbHNjcmVlblwiLCBhY3RpdmUpO1xuXG4gICAgLy8gUmVxdWVzdCBPUy1sZXZlbCBmdWxsc2NyZWVuIHdoZW4gZW50ZXJpbmcgKE9ic2lkaWFuIHJ1bnMgb24gRWxlY3Ryb24gYW5kXG4gICAgLy8gc3VwcG9ydHMgdGhlIEZ1bGxzY3JlZW4gQVBJKTsgZmFpbHVyZXMgKGUuZy4gaW4gYSBwbGFpbiBicm93c2VyKSBhcmVcbiAgICAvLyBpZ25vcmVkIHNpbGVudGx5IFx1MjAxNCB0aGUgXCJoaWRlIHNpZGViYXJzXCIgZWZmZWN0IHN0aWxsIGFwcGxpZXMuXG4gICAgaWYgKGFjdGl2ZSkge1xuICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuPy4oKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgfSBlbHNlIGlmIChkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCkge1xuICAgICAgZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4/LigpLmNhdGNoKCgpID0+IHt9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlIHRoZSBXWVNJV1lHIG1vZGUgKHBlcnNpc3RlZDsgb25seSByZWFjaGFibGUgb24gZGVjayBub3RlcykuXG4gICAqIFRvZ2dsaW5nIGZyb20gcmVhZGluZyB2aWV3IGp1bXBzIGludG8gdGhlIFdZU0lXWUcgZWRpdCB2aWV3LCBzbyB0aGVcbiAgICogdW5pZmllZCB0eXBvZ3JhcGh5IGlzIGltbWVkaWF0ZWx5IHZpc2libGUgd2hlcmUgdGhlIHVzZXIgd29ya3MuXG4gICAqL1xuICBwcml2YXRlIHRvZ2dsZVd5c2l3eWcoKTogdm9pZCB7XG4gICAgdGhpcy5zZXR0aW5ncy53eXNpd3lnTW9kZSA9ICF0aGlzLnNldHRpbmdzLnd5c2l3eWdNb2RlO1xuICAgIHZvaWQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAodmlldyAmJiB2aWV3LmdldE1vZGUoKSA9PT0gXCJwcmV2aWV3XCIpIHtcbiAgICAgIC8vIExlYXZlIHJlYWRpbmcgdmlldyB2aWEgdGhlIHB1YmxpYyB2aWV3LXN0YXRlIEFQSSAoc2FtZSBhcyBFc2MpXG4gICAgICBjb25zdCBzdGF0ZSA9IHZpZXcubGVhZi5nZXRWaWV3U3RhdGUoKTtcbiAgICAgIHN0YXRlLnN0YXRlID0geyAuLi5zdGF0ZS5zdGF0ZSwgbW9kZTogXCJzb3VyY2VcIiB9O1xuICAgICAgdm9pZCB2aWV3LmxlYWYuc2V0Vmlld1N0YXRlKHN0YXRlLCB7IGZvY3VzOiBmYWxzZSB9KTtcbiAgICB9XG4gICAgdGhpcy5yZWZyZXNoKCk7XG4gIH1cblxuICAvKiogU2FtcGxlIHRoZSBjdXJyZW50IHZpZXcncyB0eXBvZ3JhcGh5IGNvbXB1dGVkIHN0eWxlcyArIENTUyB2YXJpYWJsZXMgKi9cbiAgcHJpdmF0ZSBzYW1wbGVTdHlsZXMoKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsIHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAoIXZpZXcpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IGlzRWRpdCA9IHZpZXcuZ2V0TW9kZSgpID09PSBcInNvdXJjZVwiO1xuICAgIGNvbnN0IGNvbnRlbnRFbCA9IHZpZXcuY29udGVudEVsO1xuICAgIC8vIEZpcnN0IG1hdGNoaW5nIGNhbmRpZGF0ZSB3aW5zIFx1MjAxNCBlZGl0IChjbTYpIGFuZCByZWFkaW5nIHVzZVxuICAgIC8vIGRpZmZlcmVudCBlbGVtZW50IHN0cnVjdHVyZXMgKGUuZy4gbm8gcHJlL2Jsb2NrcXVvdGUgaW4gY202KS5cbiAgICBjb25zdCBwaWNrID0gKHNlbHM6IHN0cmluZ1tdKTogSFRNTEVsZW1lbnQgfCBudWxsID0+IHtcbiAgICAgIGZvciAoY29uc3Qgc2VsIG9mIHNlbHMpIHtcbiAgICAgICAgY29uc3QgZWwgPSBjb250ZW50RWwucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oc2VsKTtcbiAgICAgICAgaWYgKGVsKSByZXR1cm4gZWw7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIGNvbnN0IHN0eWxlID0gKGVsOiBIVE1MRWxlbWVudCB8IG51bGwsIHByb3BzOiBzdHJpbmdbXSk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPT4ge1xuICAgICAgaWYgKCFlbCkgcmV0dXJuIHsgXCIobWlzc2luZylcIjogXCJlbGVtZW50IG5vdCBpbiB0aGlzIG5vdGVcIiB9O1xuICAgICAgY29uc3QgY3MgPSBnZXRDb21wdXRlZFN0eWxlKGVsKTtcbiAgICAgIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgICAgZm9yIChjb25zdCBwIG9mIHByb3BzKSB7XG4gICAgICAgIGNvbnN0IHYgPSBjcy5nZXRQcm9wZXJ0eVZhbHVlKHApLnRyaW0oKTtcbiAgICAgICAgaWYgKHYpIG91dFtwXSA9IHY7XG4gICAgICB9XG4gICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgY29uc3QgdmFycyA9IGdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSk7XG4gICAgY29uc3QgY3NzVmFyID0gKG5hbWU6IHN0cmluZyk6IHN0cmluZyA9PiB2YXJzLmdldFByb3BlcnR5VmFsdWUobmFtZSkudHJpbSgpO1xuXG4gICAgY29uc3QgY29udGFpbmVyID0gcGljayhbXG4gICAgICBpc0VkaXRcbiAgICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IC5jbS1jb250ZW50XCJcbiAgICAgICAgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlld1wiLFxuICAgIF0pO1xuICAgIGNvbnN0IHBhcmEgPSBwaWNrKFtcbiAgICAgIGlzRWRpdFxuICAgICAgICA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLmNtLWxpbmU6bm90KC5IeXBlck1ELWhlYWRlcilcIlxuICAgICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IHBcIixcbiAgICBdKTtcbiAgICBjb25zdCBoMSA9IHBpY2soW1xuICAgICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuY20taGVhZGVyLTFcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyBoMVwiLFxuICAgICAgaXNFZGl0XG4gICAgICAgID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiBoMVwiXG4gICAgICAgIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgaDFcIixcbiAgICBdKTtcbiAgICBjb25zdCBsaXN0SXRlbSA9IHBpY2soW1xuICAgICAgaXNFZGl0XG4gICAgICAgID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuSHlwZXJNRC1saXN0LWxpbmVcIlxuICAgICAgICA6IFwiLm1hcmtkb3duLXByZXZpZXctdmlldyB1bCA+IGxpXCIsXG4gICAgICBpc0VkaXQgPyBcIi5IeXBlck1ELWxpc3QtbGluZVwiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgdWwgPiBsaVwiLFxuICAgIF0pO1xuICAgIGNvbnN0IHByZSA9IHBpY2soW1xuICAgICAgaXNFZGl0XG4gICAgICAgID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiBwcmVcIlxuICAgICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IHByZVwiLFxuICAgICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuY20tZWRpdGluZyBwcmVcIiA6IFwiLm1hcmtkb3duLXByZXZpZXctdmlldyBwcmVcIixcbiAgICAgIGlzRWRpdCA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLkh5cGVyTUQtY29kZWJsb2NrXCIgOiBcIi5tYXJrZG93bi1wcmV2aWV3LXZpZXcgcHJlXCIsXG4gICAgXSk7XG4gICAgY29uc3QgcXVvdGUgPSBwaWNrKFtcbiAgICAgIGlzRWRpdCA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgYmxvY2txdW90ZVwiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IGJsb2NrcXVvdGVcIixcbiAgICAgIGlzRWRpdFxuICAgICAgICA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLkh5cGVyTUQtcXVvdGVcIlxuICAgICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IGJsb2NrcXVvdGVcIixcbiAgICBdKTtcbiAgICBjb25zdCBpbmxpbmVDb2RlID0gcGljayhbXG4gICAgICBpc0VkaXQgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IGNvZGVcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyBjb2RlXCIsXG4gICAgICBpc0VkaXRcbiAgICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IC5jbS1pbmxpbmUtY29kZVwiXG4gICAgICAgIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgY29kZVwiLFxuICAgIF0pO1xuICAgIGNvbnN0IHRhYmxlID0gcGljayhbXG4gICAgICBpc0VkaXQgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IHRhYmxlXCIgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgdGFibGVcIixcbiAgICAgIGlzRWRpdCA/IFwiLmNtLWxpbmUgdGFibGVcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IHRhYmxlXCIsXG4gICAgXSk7XG4gICAgY29uc3QgaW1nID0gcGljayhbXG4gICAgICBpc0VkaXQgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IGltZ1wiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IGltZ1wiLFxuICAgICAgaXNFZGl0ID8gXCIuY20tbGluZSBpbWdcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IGltZ1wiLFxuICAgICAgXCJpbWdcIiwgLy8gd2hvbGUtZG9jdW1lbnQgZmFsbGJhY2tcbiAgICBdKTtcbiAgICBjb25zdCBociA9IHBpY2soW1xuICAgICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiBoclwiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IGhyXCIsXG4gICAgICBpc0VkaXQgPyBcIi5jbS1saW5lIGhyXCIgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlldyBoclwiLFxuICAgICAgaXNFZGl0ID8gXCIuY20taHJcIiA6IFwiLm1hcmtkb3duLXByZXZpZXctdmlldyBoclwiLFxuICAgIF0pO1xuXG4gICAgLy8gU3RydWN0dXJlIHByb2JlcyAoZWRpdCB2aWV3IG9ubHkpOiB0aGUgc291cmNlLXZpZXcgY2xhc3MgbGlzdFxuICAgIC8vIChjb25maXJtcyB0aGUgTGl2ZSBQcmV2aWV3IG1hcmtlciBjbGFzcykgYW5kIHVuaXF1ZSBlbGVtZW50IHRhZ3NcbiAgICAvLyBpbnNpZGUgdGhlIGVkaXRvciAocmV2ZWFscyBob3cgY202IHJlbmRlcnMgY29kZSBibG9ja3MgZXRjLiB3aGVuXG4gICAgLy8gdGhlIHVzdWFsIHNlbGVjdG9ycyBkbyBub3QgbWF0Y2gpLlxuICAgIGNvbnN0IHNvdXJjZVZpZXdDbGFzcyA9XG4gICAgICBjb250ZW50RWwucXVlcnlTZWxlY3RvcihcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202XCIpPy5jbGFzc05hbWUgPz8gXCJcIjtcbiAgICBjb25zdCBkb21UYWdzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmIChpc0VkaXQpIHtcbiAgICAgIGNvbnN0IHRhZ3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgIGNvbnRlbnRFbFxuICAgICAgICAucXVlcnlTZWxlY3RvckFsbChcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202ICpcIilcbiAgICAgICAgLmZvckVhY2goKGVsKSA9PiB0YWdzLmFkZChlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCkpKTtcbiAgICAgIGRvbVRhZ3MucHVzaCguLi50YWdzKTtcbiAgICB9XG4gICAgLy8gTGlzdC1saW5lIHByb2JlIChlZGl0IHZpZXcgb25seSk6IGNsYXNzIG5hbWVzICsgY29tcHV0ZWQgcGFkZGluZ1xuICAgIC8vIG9mIHRoZSBmaXJzdCBsaXN0IGxpbmVzIFx1MjAxNCBuZXN0ZWQgbGV2ZWxzIG9mdGVuIHVzZSBkaXN0aW5jdFxuICAgIC8vIGNsYXNzZXMgb3IgaW5saW5lIHBhZGRpbmdzLCB3aGljaCBkZWNpZGVzIHdoZXRoZXIgYSBsZXZlbC1hd2FyZVxuICAgIC8vIGluZGVudCBvdmVycmlkZSBpcyBldmVuIHBvc3NpYmxlLlxuICAgIGNvbnN0IGxpc3RMaW5lczogeyBjbGFzc05hbWU6IHN0cmluZzsgcGFkZGluZ0xlZnQ6IHN0cmluZyB9W10gPSBbXTtcbiAgICBpZiAoaXNFZGl0KSB7XG4gICAgICBjb250ZW50RWwucXVlcnlTZWxlY3RvckFsbChcIi5IeXBlck1ELWxpc3QtbGluZVwiKS5mb3JFYWNoKChlbCwgaSkgPT4ge1xuICAgICAgICBpZiAoaSA+PSA0KSByZXR1cm47XG4gICAgICAgIGNvbnN0IGNzID0gZ2V0Q29tcHV0ZWRTdHlsZShlbCk7XG4gICAgICAgIGxpc3RMaW5lcy5wdXNoKHtcbiAgICAgICAgICBjbGFzc05hbWU6IGVsLmNsYXNzTmFtZSxcbiAgICAgICAgICBwYWRkaW5nTGVmdDogY3MuZ2V0UHJvcGVydHlWYWx1ZShcInBhZGRpbmctbGVmdFwiKS50cmltKCksXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICAgIC8vIEZyb250bWF0dGVyIHByb2JlczogZG9lcyB0aGUgKGhpZGRlbikgcHJvcGVydGllcyBhcmVhIHN0aWxsXG4gICAgLy8gb2NjdXB5IHNwYWNlIGluIExpdmUgUHJldmlldz8gQW5kIGhvdyBmYXIgaXMgdGhlIEgxIGZyb20gdGhlXG4gICAgLy8gdG9wIG9mIHRoZSBjb250ZW50IGFyZWE/IChyZWFkaW5nIG1vZGUgaGFzIG5vIHN1Y2ggcGFkZGluZylcbiAgICBjb25zdCBtZXRhZGF0YURpc3BsYXkgPSBpc0VkaXRcbiAgICAgID8gKCgpID0+IHtcbiAgICAgICAgICBjb25zdCBlbCA9IGNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcbiAgICAgICAgICAgIFwiLm1hcmtkb3duLXNvdXJjZS12aWV3IC5tZXRhZGF0YS1jb250YWluZXJcIixcbiAgICAgICAgICApO1xuICAgICAgICAgIHJldHVybiBlbCA/IGdldENvbXB1dGVkU3R5bGUoZWwpLmRpc3BsYXkgOiBcIihub3QgaW4gRE9NKVwiO1xuICAgICAgICB9KSgpXG4gICAgICA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBoMU9mZnNldFRvcCA9ICgoKSA9PiB7XG4gICAgICBpZiAoIWgxKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgbGV0IHRvcCA9IDA7XG4gICAgICBsZXQgbm9kZTogSFRNTEVsZW1lbnQgfCBudWxsID0gaDE7XG4gICAgICB3aGlsZSAobm9kZSAmJiBub2RlICE9PSBjb250ZW50RWwgJiYgbm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICB0b3AgKz0gbm9kZS5vZmZzZXRUb3A7XG4gICAgICAgIG5vZGUgPSBub2RlLm9mZnNldFBhcmVudCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gdG9wO1xuICAgIH0pKCk7XG4gICAgLy8gV2hhdCBvY2N1cGllcyB0aGUgc3BhY2UgYmV0d2VlbiB0aGUgY29udGVudCB0b3AgYW5kIHRoZSBIMT9cbiAgICAvLyAoZWRpdCkgZmlyc3QgY2hpbGRyZW4gb2YgLmNtLWNvbnRlbnQsIGFuZCB0aGUgbmV0IEgxIGRpc3RhbmNlXG4gICAgLy8gZnJvbSB0aGUgY29udGVudCBhbmNob3IgXHUyMDE0IHJlYWRpbmcgaGFzIG5vIHN1Y2ggZ2FwLlxuICAgIGNvbnN0IGFuY2hvciA9IGlzRWRpdFxuICAgICAgPyBjb250ZW50RWwucXVlcnlTZWxlY3RvcihcIi5jbS1jb250ZW50XCIpXG4gICAgICA6IGNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3XCIpO1xuICAgIGNvbnN0IGgxVG9wSW5Db250ZW50ID0gKCgpID0+IHtcbiAgICAgIGlmICghaDEgfHwgIWFuY2hvcikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIHJldHVybiBNYXRoLnJvdW5kKGgxLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCAtIGFuY2hvci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3ApO1xuICAgIH0pKCk7XG4gICAgY29uc3QgY21Db250ZW50Q2hpbGRyZW4gPSBpc0VkaXRcbiAgICAgID8gKCgpID0+IHtcbiAgICAgICAgICBpZiAoIWFuY2hvcikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShhbmNob3IuY2hpbGRyZW4pXG4gICAgICAgICAgICAuc2xpY2UoMCwgNClcbiAgICAgICAgICAgIC5tYXAoKGVsKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGNzID0gZ2V0Q29tcHV0ZWRTdHlsZShlbCk7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY2xzOiAoZWwgYXMgSFRNTEVsZW1lbnQpLmNsYXNzTmFtZSB8fCBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCksXG4gICAgICAgICAgICAgICAgZGlzcGxheTogY3MuZGlzcGxheSxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IE1hdGgucm91bmQoZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0KSxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSgpXG4gICAgICA6IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0IGR1bXAgPSB7XG4gICAgICBtb2RlOiBpc0VkaXQgPyBcImVkaXQgKExpdmUgUHJldmlldylcIiA6IFwicmVhZGluZ1wiLFxuICAgICAgLy8gQWxpZ25tZW50IENTUyAocnVsZXMgNy83Yikgb25seSBhcHBsaWVzIHdoZW4gV1lTSVdZRyBpcyBvblxuICAgICAgd3lzaXd5Z0FjdGl2ZTogZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuY29udGFpbnMoXCJuYXRpdmUtc2xpZGVzLXd5c2l3eWdcIiksXG4gICAgICBkb21UYWdzOiBpc0VkaXQgPyBkb21UYWdzIDogdW5kZWZpbmVkLFxuICAgICAgc291cmNlVmlld0NsYXNzOiBpc0VkaXQgPyBzb3VyY2VWaWV3Q2xhc3MgOiB1bmRlZmluZWQsXG4gICAgICBsaXZlUHJldmlldzogaXNFZGl0ID8gdGhpcy5pc0xpdmVQcmV2aWV3KCkgOiB1bmRlZmluZWQsXG4gICAgICBsaXN0TGluZXM6IGlzRWRpdCA/IGxpc3RMaW5lcyA6IHVuZGVmaW5lZCxcbiAgICAgIG1ldGFkYXRhQ29udGFpbmVyRGlzcGxheTogaXNFZGl0ID8gbWV0YWRhdGFEaXNwbGF5IDogdW5kZWZpbmVkLFxuICAgICAgaDFPZmZzZXRUb3A6IGgxT2Zmc2V0VG9wLFxuICAgICAgaDFUb3BJbkNvbnRlbnQ6IGgxVG9wSW5Db250ZW50LFxuICAgICAgY21Db250ZW50Q2hpbGRyZW46IGNtQ29udGVudENoaWxkcmVuLFxuICAgICAgY29udGFpbmVyOiBzdHlsZShjb250YWluZXIsIFtcbiAgICAgICAgXCJmb250LWZhbWlseVwiLFxuICAgICAgICBcImZvbnQtc2l6ZVwiLFxuICAgICAgICBcImxpbmUtaGVpZ2h0XCIsXG4gICAgICAgIFwibWF4LXdpZHRoXCIsXG4gICAgICAgIFwid2lkdGhcIixcbiAgICAgICAgXCJwYWRkaW5nLXRvcFwiLFxuICAgICAgICBcInBhZGRpbmctcmlnaHRcIixcbiAgICAgICAgXCJwYWRkaW5nLWJvdHRvbVwiLFxuICAgICAgICBcInBhZGRpbmctbGVmdFwiLFxuICAgICAgICBcImNvbG9yXCIsXG4gICAgICAgIFwidGV4dC1hbGlnblwiLFxuICAgICAgXSksXG4gICAgICBwYXJhZ3JhcGg6IHN0eWxlKHBhcmEsIFtcbiAgICAgICAgXCJmb250LXNpemVcIixcbiAgICAgICAgXCJsaW5lLWhlaWdodFwiLFxuICAgICAgICBcIm1hcmdpbi10b3BcIixcbiAgICAgICAgXCJtYXJnaW4tYm90dG9tXCIsXG4gICAgICAgIFwibWFyZ2luLWxlZnRcIixcbiAgICAgICAgXCJtYXJnaW4tcmlnaHRcIixcbiAgICAgICAgXCJ0ZXh0LWluZGVudFwiLFxuICAgICAgICBcInRleHQtYWxpZ25cIixcbiAgICAgIF0pLFxuICAgICAgaDE6IHN0eWxlKGgxLCBbXG4gICAgICAgIFwiZm9udC1zaXplXCIsXG4gICAgICAgIFwibGluZS1oZWlnaHRcIixcbiAgICAgICAgXCJmb250LXdlaWdodFwiLFxuICAgICAgICBcIm1hcmdpbi10b3BcIixcbiAgICAgICAgXCJtYXJnaW4tYm90dG9tXCIsXG4gICAgICAgIFwidGV4dC1hbGlnblwiLFxuICAgICAgXSksXG4gICAgICBsaXN0SXRlbTogc3R5bGUobGlzdEl0ZW0sIFtcbiAgICAgICAgXCJwYWRkaW5nLWxlZnRcIixcbiAgICAgICAgXCJtYXJnaW4tbGVmdFwiLFxuICAgICAgICBcIm1hcmdpbi1yaWdodFwiLFxuICAgICAgICBcInRleHQtaW5kZW50XCIsXG4gICAgICAgIFwibGluZS1oZWlnaHRcIixcbiAgICAgICAgXCJ0ZXh0LWFsaWduXCIsXG4gICAgICBdKSxcbiAgICAgIGNvZGVCbG9jazogc3R5bGUocHJlLCBbXG4gICAgICAgIFwiZm9udC1zaXplXCIsXG4gICAgICAgIFwibGluZS1oZWlnaHRcIixcbiAgICAgICAgXCJwYWRkaW5nLXRvcFwiLFxuICAgICAgICBcInBhZGRpbmctcmlnaHRcIixcbiAgICAgICAgXCJwYWRkaW5nLWJvdHRvbVwiLFxuICAgICAgICBcInBhZGRpbmctbGVmdFwiLFxuICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIixcbiAgICAgICAgXCJib3JkZXItcmFkaXVzXCIsXG4gICAgICBdKSxcbiAgICAgIGJsb2NrcXVvdGU6IHN0eWxlKHF1b3RlLCBbXG4gICAgICAgIFwicGFkZGluZy10b3BcIixcbiAgICAgICAgXCJwYWRkaW5nLXJpZ2h0XCIsXG4gICAgICAgIFwicGFkZGluZy1ib3R0b21cIixcbiAgICAgICAgXCJwYWRkaW5nLWxlZnRcIixcbiAgICAgICAgXCJtYXJnaW4tdG9wXCIsXG4gICAgICAgIFwibWFyZ2luLWJvdHRvbVwiLFxuICAgICAgICBcImJvcmRlci1sZWZ0LXdpZHRoXCIsXG4gICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiLFxuICAgICAgXSksXG4gICAgICBpbmxpbmVDb2RlOiBzdHlsZShpbmxpbmVDb2RlLCBbXG4gICAgICAgIFwiZm9udC1zaXplXCIsXG4gICAgICAgIFwicGFkZGluZy10b3BcIixcbiAgICAgICAgXCJwYWRkaW5nLWJvdHRvbVwiLFxuICAgICAgICBcInBhZGRpbmctbGVmdFwiLFxuICAgICAgICBcInBhZGRpbmctcmlnaHRcIixcbiAgICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCIsXG4gICAgICAgIFwiYm9yZGVyLXJhZGl1c1wiLFxuICAgICAgXSksXG4gICAgICB0YWJsZTogc3R5bGUodGFibGUsIFtcImZvbnQtc2l6ZVwiLCBcImxpbmUtaGVpZ2h0XCIsIFwid2lkdGhcIiwgXCJib3JkZXItY29sbGFwc2VcIl0pLFxuICAgICAgaW1hZ2U6IHN0eWxlKGltZywgW1wiZGlzcGxheVwiLCBcIm1hcmdpbi1sZWZ0XCIsIFwibWFyZ2luLXJpZ2h0XCIsIFwibWF4LXdpZHRoXCIsIFwid2lkdGhcIl0pLFxuICAgICAgaG9yaXpvbnRhbFJ1bGU6IHN0eWxlKGhyLCBbXCJtYXJnaW4tdG9wXCIsIFwibWFyZ2luLWJvdHRvbVwiLCBcImJvcmRlci10b3Atd2lkdGhcIiwgXCJoZWlnaHRcIl0pLFxuICAgICAgY3NzVmFyaWFibGVzOiB7XG4gICAgICAgIFwiLS1mb250LXRleHRcIjogY3NzVmFyKFwiLS1mb250LXRleHRcIiksXG4gICAgICAgIFwiLS1saW5lLWhlaWdodC1ub3JtYWxcIjogY3NzVmFyKFwiLS1saW5lLWhlaWdodC1ub3JtYWxcIiksXG4gICAgICAgIFwiLS1oMS1zaXplXCI6IGNzc1ZhcihcIi0taDEtc2l6ZVwiKSxcbiAgICAgICAgXCItLWgxLWxpbmUtaGVpZ2h0XCI6IGNzc1ZhcihcIi0taDEtbGluZS1oZWlnaHRcIiksXG4gICAgICAgIFwiLS1oMS1tYXJnaW4tdG9wXCI6IGNzc1ZhcihcIi0taDEtbWFyZ2luLXRvcFwiKSxcbiAgICAgICAgXCItLWgxLW1hcmdpbi1ib3R0b21cIjogY3NzVmFyKFwiLS1oMS1tYXJnaW4tYm90dG9tXCIpLFxuICAgICAgICBcIi0tcC1zcGFjaW5nXCI6IGNzc1ZhcihcIi0tcC1zcGFjaW5nXCIpLFxuICAgICAgICBcIi0tbGlzdC1zcGFjaW5nXCI6IGNzc1ZhcihcIi0tbGlzdC1zcGFjaW5nXCIpLFxuICAgICAgICBcIi0tbGlzdC1pbmRlbnRcIjogY3NzVmFyKFwiLS1saXN0LWluZGVudFwiKSxcbiAgICAgICAgXCItLWNvZGUtc2l6ZVwiOiBjc3NWYXIoXCItLWNvZGUtc2l6ZVwiKSxcbiAgICAgICAgXCItLWNvZGUtcGFkZGluZ1wiOiBjc3NWYXIoXCItLWNvZGUtcGFkZGluZ1wiKSxcbiAgICAgICAgXCItLWNvZGUtcmFkaXVzXCI6IGNzc1ZhcihcIi0tY29kZS1yYWRpdXNcIiksXG4gICAgICAgIFwiLS1ibG9ja3F1b3RlLXBhZGRpbmdcIjogY3NzVmFyKFwiLS1ibG9ja3F1b3RlLXBhZGRpbmdcIiksXG4gICAgICAgIFwiLS1ibG9ja3F1b3RlLWJvcmRlci10aGlja25lc3NcIjogY3NzVmFyKFwiLS1ibG9ja3F1b3RlLWJvcmRlci10aGlja25lc3NcIiksXG4gICAgICAgIFwiLS1maWxlLW1hcmdpbnNcIjogY3NzVmFyKFwiLS1maWxlLW1hcmdpbnNcIiksXG4gICAgICAgIFwiLS1maWxlLWxpbmUtd2lkdGhcIjogY3NzVmFyKFwiLS1maWxlLWxpbmUtd2lkdGhcIiksXG4gICAgICAgIFwiLS1ub3JtYWwtZm9udC1zaXplXCI6IGNzc1ZhcihcIi0tbm9ybWFsLWZvbnQtc2l6ZVwiKSxcbiAgICAgICAgXCItLWZvbnQtdGV4dC1zaXplXCI6IGNzc1ZhcihcIi0tZm9udC10ZXh0LXNpemVcIiksXG4gICAgICB9LFxuICAgIH07XG4gICAgcmV0dXJuIGR1bXA7XG4gIH1cblxuICAvKipcbiAgICogRGVidWcgdHlwb2dyYXBoeTogc2FtcGxlcyB0aGUgZml4ZWQgb25lLXBhZ2Ugc2FtcGxlIG5vdGVzIChlYWNoXG4gICAqIGNvdmVyaW5nIGEgZ3JvdXAgb2YgZWxlbWVudHMgXHUyMDE0IGFsbCB2aXNpYmxlIHdpdGhvdXQgc2Nyb2xsaW5nKSxcbiAgICogdGhlbiB0aGUga2l0Y2hlbi1zaW5rIG5vdGUgaW4gcmVhZGluZyB2aWV3IChubyB2aXJ0dWFsaXphdGlvblxuICAgKiB0aGVyZSksIG1lcmdlcyBldmVyeXRoaW5nLCBjb21wdXRlcyB0aGUgZWRpdC12cy1yZWFkaW5nIGRpZmYgYW5kXG4gICAqIHdyaXRlcyBpdCB0byAubmF0aXZlLXNsaWRlcy1kZWJ1Zy5qc29uIGluIHRoZSB2YXVsdCByb290LlxuICAgKiBUaGUgdXNlcidzIG93biBub3RlIGlzIHJlc3RvcmVkIGF0IHRoZSBlbmQuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGRlYnVnU3R5bGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5zZXR0aW5ncy53eXNpd3lnTW9kZSkge1xuICAgICAgbmV3IE5vdGljZShcIk5hdGl2ZSBTbGlkZXM6IHR1cm4gV1lTSVdZRyBtb2RlIG9uIGZpcnN0IChNb2QrU2hpZnQrRSBvbiBhIGRlY2sgbm90ZSlcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICghdmlldykge1xuICAgICAgbmV3IE5vdGljZShcIk5hdGl2ZSBTbGlkZXM6IG5vIGFjdGl2ZSBNYXJrZG93biBub3RlXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzdGFydE1vZGUgPSB2aWV3LmdldE1vZGUoKTtcbiAgICBjb25zdCBhY3RpdmVGaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpO1xuXG4gICAgLy8gRWRpdCBzaWRlOiBlYWNoIHNob3J0IG5vdGUga2VlcHMgZXZlcnkgdGFyZ2V0IGVsZW1lbnQgb24gc2NyZWVuXG4gICAgY29uc3QgZWRpdDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgU0FNUExFX05PVEVfTkFNRVMpIHtcbiAgICAgIGNvbnN0IGYgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoYCR7bmFtZX0ubWRgKTtcbiAgICAgIGlmICghKGYgaW5zdGFuY2VvZiBURmlsZSkpIGNvbnRpbnVlO1xuICAgICAgYXdhaXQgbGVhZi5vcGVuRmlsZShmLCB7IHN0YXRlOiB7IG1vZGU6IFwic291cmNlXCIgfSB9KTtcbiAgICAgIGF3YWl0IHNsZWVwKDUwMCk7XG4gICAgICBjb25zdCBzID0gdGhpcy5zYW1wbGVTdHlsZXMoKTtcbiAgICAgIGlmIChzKSBtZXJnZVNhbXBsZShlZGl0LCBzKTtcbiAgICB9XG5cbiAgICAvLyBSZWFkaW5nIHNpZGU6IHRoZSBraXRjaGVuLXNpbmsgbm90ZSByZW5kZXJzIGV2ZXJ5dGhpbmcgYXQgb25jZVxuICAgIGxldCByZWFkaW5nOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwgPSBudWxsO1xuICAgIGNvbnN0IGRlbW8gPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoXCJ0eXBvZ3JhcGh5LWRlbW8ubWRcIik7XG4gICAgaWYgKGRlbW8gaW5zdGFuY2VvZiBURmlsZSkge1xuICAgICAgYXdhaXQgbGVhZi5vcGVuRmlsZShkZW1vLCB7IHN0YXRlOiB7IG1vZGU6IFwicHJldmlld1wiIH0gfSk7XG4gICAgICBhd2FpdCBzbGVlcCg4MDApO1xuICAgICAgcmVhZGluZyA9IHRoaXMuc2FtcGxlU3R5bGVzKCk7XG4gICAgfVxuXG4gICAgLy8gUmVzdG9yZSB0aGUgdXNlcidzIG5vdGVcbiAgICBpZiAoYWN0aXZlRmlsZSkge1xuICAgICAgYXdhaXQgbGVhZi5vcGVuRmlsZShhY3RpdmVGaWxlLCB7IHN0YXRlOiB7IG1vZGU6IHN0YXJ0TW9kZSB9IH0pO1xuICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgfVxuICAgIGlmICghcmVhZGluZykge1xuICAgICAgbmV3IE5vdGljZShcIk5hdGl2ZSBTbGlkZXM6IHJlYWRpbmcgc2FtcGxlIGZhaWxlZFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwYXlsb2FkID0geyBlZGl0LCByZWFkaW5nLCBkaWZmOiBkaWZmRHVtcHMoZWRpdCwgcmVhZGluZykgfTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci53cml0ZShcbiAgICAgICAgXCIubmF0aXZlLXNsaWRlcy1kZWJ1Zy5qc29uXCIsXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KHBheWxvYWQsIG51bGwsIDIpLFxuICAgICAgKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJUeXBvZ3JhcGh5IGR1bXAgXHUyMTkyIC5uYXRpdmUtc2xpZGVzLWRlYnVnLmpzb24gKHZhdWx0IHJvb3QpXCIpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBuZXcgTm90aWNlKGBOYXRpdmUgU2xpZGVzOiBjb3VsZCBub3Qgd3JpdGUgZGVidWcgZmlsZSAoJHtTdHJpbmcoZXJyb3IpfSlgKTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coXCJbbmF0aXZlLXNsaWRlcyBkZWJ1Zy1zdHlsZXNdXCIsIEpTT04uc3RyaW5naWZ5KHBheWxvYWQsIG51bGwsIDIpKTtcbiAgfVxufVxuXG4vLyBcdTI1MDBcdTI1MDAgU2V0dGluZ3MgdGFiIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5jbGFzcyBOYXRpdmVTbGlkZXNTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBOYXRpdmVTbGlkZXNQbHVnaW4pIHtcbiAgICBzdXBlcihwbHVnaW4uYXBwLCBwbHVnaW4pO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiUHJvcGVydGllcyBCYXIgXHUwMEI3IFNldHRpbmdzXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBQcmV2aW91cy9OZXh0IGJ1dHRvbnNcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIlNob3cgXHUyNUMwIFx1MjVCNiBidXR0b25zIG9uIHRoZSBsZWZ0IG9mIHRoZSBiYXIgd2hlbiB0aGUgbm90ZSBiZWxvbmdzIHRvIGEgZGVjayAoaGFzIGEgYGRlY2tgIHByb3BlcnR5KVwiLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd05hdkJ1dHRvbnMpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dOYXZCdXR0b25zID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBwYWdlIG51bWJlclwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiQXV0by1jb21wdXRlZCBmcm9tIHRoZSBkZWNrIGNoYWluIChvdmVydmlldyBwYWdlIHNob3dzIFx1MjAxQ092ZXJ2aWV3XHUyMDFEKTsgc2hvd24gYXQgdGhlIGJvdHRvbS1yaWdodFwiLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1BhZ2VOdW1iZXIpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dQYWdlTnVtYmVyID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiQXV0byBmdWxsc2NyZWVuIGluIHJlYWRpbmcgdmlld1wiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiRW50ZXIgdGhlIGltbWVyc2l2ZSBmdWxsc2NyZWVuIHJlYWRpbmcgbW9kZSBhdXRvbWF0aWNhbGx5IHdoZW4gc3dpdGNoaW5nIHRvIHJlYWRpbmcgdmlldyAoYWxzbyB0b2dnbGVhYmxlIHZpYSB0aGUgUGF1c2UvUmVzdW1lIEF1dG8gRnVsbHNjcmVlbiBjb21tYW5kKVwiLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b0Z1bGxzY3JlZW4pLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9GdWxsc2NyZWVuID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiV1lTSVdZRyBtb2RlIChkZWNrIG5vdGVzKVwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiSW1tZXJzaXZlIGRlY2sgbW9kZTogaGlkZXMgdGhlIHRhYiBiYXIgYW5kIHNpZGViYXJzLCBzaG93cyB0aGUgYm90dG9tIGJhciBhdCB0YWItYmFyIGhlaWdodCBpbiBib3RoIHZpZXdzLCBhbmQgaGlkZXMgaW4tbm90ZSBwcm9wZXJ0aWVzIHdoaWxlIGVkaXRpbmcuIFRvZ2dsZSBmcm9tIHRoZSBjb21tYW5kIHBhbGV0dGUsIHRoZSBNb2QrU2hpZnQrRSBob3RrZXksIG9yIHRoZSBib3R0b20tYmFyIGJ1dHRvbi5cIixcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnd5c2l3eWdNb2RlKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy53eXNpd3lnTW9kZSA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMucGx1Z2luLnJlZnJlc2goKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk5hdmlnYXRpb24gaG90a2V5c1wiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiRGVmYXVsdDogUHJldmlvdXMgUGFnZSBNb2QrU2hpZnQrXHUyMTkwLCBOZXh0IFBhZ2UgTW9kK1NoaWZ0K1x1MjE5Mi4gUmViaW5kIHVuZGVyIFNldHRpbmdzIFx1MjE5MiBIb3RrZXlzLlwiLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIk9wZW4gSG90a2V5cyBTZXR0aW5nc1wiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICAvLyBPcGVuIE9ic2lkaWFuJ3MgaG90a2V5cyBzZXR0aW5ncyBwYWdlIChpbnRlcm5hbCBBUEk7IGlnbm9yZSBmYWlsdXJlcylcbiAgICAgICAgICAoXG4gICAgICAgICAgICB0aGlzLmFwcCBhcyB1bmtub3duIGFzIHsgc2V0dGluZz86IHsgb3BlblRhYkJ5SWQ/OiAoaWQ6IHN0cmluZykgPT4gdm9pZCB9IH1cbiAgICAgICAgICApLnNldHRpbmc/Lm9wZW5UYWJCeUlkPy4oXCJob3RrZXlzXCIpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cbn1cblxuLy8gXHUyNTAwXHUyNTAwIEhlbHBlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbi8qKiBQcm9taXNlLWJhc2VkIHNsZWVwICovXG5mdW5jdGlvbiBzbGVlcChtczogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpO1xufVxuXG4vKipcbiAqIE1lcmdlIG5vbi1taXNzaW5nIHN0eWxlIHNlY3Rpb25zIG9mIGEgZnJlc2ggc2FtcGxlIGludG8gdGhlIHRhcmdldFxuICogKGZpcnN0IG5vbi1taXNzaW5nIHZhbHVlIHdpbnMpLlxuICovXG5mdW5jdGlvbiBtZXJnZVNhbXBsZSh0YXJnZXQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBzYW1wbGU6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XG4gIGZvciAoY29uc3Qga2V5IG9mIFNUWUxFX1NFQ1RJT05TKSB7XG4gICAgY29uc3Qgc2VjdGlvbiA9IHNhbXBsZVtrZXldIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4gfCB1bmRlZmluZWQ7XG4gICAgaWYgKCFzZWN0aW9uIHx8IFwiKG1pc3NpbmcpXCIgaW4gc2VjdGlvbikgY29udGludWU7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0YXJnZXRba2V5XSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgdW5kZWZpbmVkO1xuICAgIGlmIChleGlzdGluZyAmJiAhKFwiKG1pc3NpbmcpXCIgaW4gZXhpc3RpbmcpKSBjb250aW51ZTtcbiAgICB0YXJnZXRba2V5XSA9IHNlY3Rpb247XG4gIH1cbiAgLy8gUHJvYmUgZmllbGRzIHJpZGUgYWxvbmcgKGZpcnN0IG5vbi1lbXB0eSB3aW5zKVxuICBmb3IgKGNvbnN0IGtleSBvZiBbXG4gICAgXCJsaXN0TGluZXNcIixcbiAgICBcIm1ldGFkYXRhQ29udGFpbmVyRGlzcGxheVwiLFxuICAgIFwiaDFPZmZzZXRUb3BcIixcbiAgICBcImgxVG9wSW5Db250ZW50XCIsXG4gICAgXCJjbUNvbnRlbnRDaGlsZHJlblwiLFxuICBdKSB7XG4gICAgY29uc3QgcHJvYmUgPSBzYW1wbGVba2V5XTtcbiAgICBpZiAocHJvYmUgPT09IHVuZGVmaW5lZCB8fCBwcm9iZSA9PT0gbnVsbCkgY29udGludWU7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocHJvYmUpICYmIHByb2JlLmxlbmd0aCA9PT0gMCkgY29udGludWU7XG4gICAgaWYgKHR5cGVvZiBwcm9iZSA9PT0gXCJvYmplY3RcIiAmJiAhQXJyYXkuaXNBcnJheShwcm9iZSkgJiYgT2JqZWN0LmtleXMocHJvYmUpLmxlbmd0aCA9PT0gMClcbiAgICAgIGNvbnRpbnVlO1xuICAgIGlmICh0YXJnZXRba2V5XSA9PT0gdW5kZWZpbmVkKSB0YXJnZXRba2V5XSA9IHByb2JlO1xuICB9XG59XG5cbi8qKiBSZW1vdmUgYWxsIGNoaWxkcmVuIG9mIGFuIGVsZW1lbnQgKi9cbmZ1bmN0aW9uIGNsZWFyQ2hpbGRyZW4oZWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIHdoaWxlIChlbC5maXJzdENoaWxkKSBlbC5yZW1vdmVDaGlsZChlbC5maXJzdENoaWxkKTtcbn1cblxuLyoqXG4gKiBDb21wYXJlIHRoZSBzdHlsZSBzZWN0aW9ucyBvZiBhbiBlZGl0IGR1bXAgYW5kIGEgcmVhZGluZyBkdW1wOyBvbmx5XG4gKiBrZXlzIHdob3NlIHZhbHVlcyBkaWZmZXIgYXJlIGtlcHQsIGFzIHsga2V5OiB7IGVkaXQsIHJlYWRpbmcgfSB9LlxuICovXG5mdW5jdGlvbiBkaWZmRHVtcHMoXG4gIGVkaXQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICByZWFkaW5nOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuICBmb3IgKGNvbnN0IHNlY3Rpb24gb2YgU1RZTEVfU0VDVElPTlMpIHtcbiAgICBjb25zdCBlID0gKGVkaXRbc2VjdGlvbl0gPz8ge30pIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gICAgY29uc3QgciA9IChyZWFkaW5nW3NlY3Rpb25dID8/IHt9KSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICAgIGNvbnN0IGtleXMgPSBuZXcgU2V0KFsuLi5PYmplY3Qua2V5cyhlKSwgLi4uT2JqZWN0LmtleXMocildKTtcbiAgICBjb25zdCBkaWZmczogUmVjb3JkPHN0cmluZywgeyBlZGl0OiBzdHJpbmc7IHJlYWRpbmc6IHN0cmluZyB9PiA9IHt9O1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICAgIGlmIChlW2tleV0gIT09IHJba2V5XSkge1xuICAgICAgICBkaWZmc1trZXldID0geyBlZGl0OiBlW2tleV0gPz8gXCIobWlzc2luZylcIiwgcmVhZGluZzogcltrZXldID8/IFwiKG1pc3NpbmcpXCIgfTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKE9iamVjdC5rZXlzKGRpZmZzKS5sZW5ndGggPiAwKSBvdXRbc2VjdGlvbl0gPSBkaWZmcztcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuIiwgIi8qKlxuICogZGVjay50cyBcdTIwMTQgUHVyZSBkZWNrLXJlc29sdXRpb24gY29yZSBmb3IgbmF0aXZlLXNsaWRlcy5cbiAqXG4gKiBFdmVyeXRoaW5nIGluIHRoaXMgbW9kdWxlIGlzIGZyZWUgb2YgT2JzaWRpYW4gcnVudGltZSBkZXBlbmRlbmNpZXMgc28gaXQgY2FuXG4gKiBiZSB1bml0IHRlc3RlZCBkaXJlY3RseSAoc2VlIHRlc3QvZGVjay50ZXN0LnRzKS4gbWFpbi50cyBhZGFwdHMgdGhlIHZhdWx0XG4gKiAobWV0YWRhdGFDYWNoZSkgdG8gdGhpcyBwdXJlIGludGVyZmFjZTogaXQgcmVzb2x2ZXMgYGRlY2tgIHByb3BlcnRpZXMgdG9cbiAqIG5vdGUgcGF0aHMsIHRoZW4gaGFuZHMgdGhlIHBhdGggZ3JhcGggdG8gY29tcHV0ZURlY2soKS5cbiAqL1xuXG4vKiogQSBkZWNrIGxpbmsgbGlzdCBuZXZlciBob2xkcyBtb3JlIHRoYW4gdHdvIGVudHJpZXMgKi9cbmV4cG9ydCBjb25zdCBNQVhfREVDS19MSU5LUyA9IDI7XG5cbi8qKiBSZXN1bHQgb2YgcmVzb2x2aW5nIGEgbm90ZSdzIHBvc2l0aW9uIGluc2lkZSBhIGRlY2sgKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVja0luZm8ge1xuICAvKiogQ2hhaW4gb2Ygbm90ZSBwYXRoczogWzBdIGlzIHRoZSBvdmVydmlldyBub3RlLCB0aGVuIHNsaWRlcyBpbiBvcmRlciAqL1xuICBjaGFpbjogc3RyaW5nW107XG4gIC8qKiBJbmRleCBvZiB0aGUgY3VycmVudCBub3RlIGluc2lkZSBjaGFpbiAqL1xuICBpbmRleDogbnVtYmVyO1xufVxuXG4vKipcbiAqIFJlc29sdmUgYSBub3RlJ3MgcG9zaXRpb24gaW5zaWRlIGl0cyBkZWNrIGJ5IHdhbGtpbmcgdGhlIGxpbmsgY2hhaW4uXG4gKlxuICogQ29udmVudGlvbiBmb3IgdGhlIHNpbmdsZSBgZGVja2AgcHJvcGVydHkgKHVwIHRvIHR3byBsaW5rcyk6XG4gKiAgIC0gb3ZlcnZpZXcgbm90ZTogb25lIGxpbmsgXHUyMTkyIHRoYXQgbGluayBJUyB0aGUgZmlyc3QgcGFnZTtcbiAqICAgLSBzbGlkZSBub3RlOiAgICBmaXJzdCBsaW5rIFx1MjE5MiB0aGUgb3ZlcnZpZXcgcGFnZSwgc2Vjb25kIGxpbmsgXHUyMTkyIG5leHQgc2xpZGVcbiAqICAgICAgICAgICAgICAgICAgICAobm8gc2Vjb25kIGxpbmsgb24gdGhlIGxhc3Qgc2xpZGUpLlxuICpcbiAqIGBnZXRMaW5rcyhwYXRoKWAgbXVzdCByZXR1cm4gdGhlIHJlc29sdmVkIG5vdGUgcGF0aHMgb2YgdGhlIGBkZWNrYCBwcm9wZXJ0eVxuICogb2YgdGhlIG5vdGUgYXQgYHBhdGhgIChlbXB0eSB3aGVuIHRoZSBub3RlIGhhcyBub25lLCBvciBpdHMgbGlua3MgYXJlXG4gKiBicm9rZW4gXHUyMDE0IGEgYnJva2VuIGxpbmsgc2ltcGx5IGVuZHMgb3IgZXhjbHVkZXMgdGhlIGNoYWluLCBuZXZlciBjcmFzaGVzKS5cbiAqXG4gKiBSZXR1cm5zIHRoZSBmdWxsIGNoYWluIChbb3ZlcnZpZXcsIHNsaWRlIDEsIHNsaWRlIDIsIFx1MjAyNl0pIGFuZCB0aGUgY3VycmVudFxuICogbm90ZSdzIGluZGV4LCBvciBudWxsIHdoZW4gdGhlIG5vdGUgaXMgbm90IHBhcnQgb2YgYW55IGRlY2suXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlRGVjayhcbiAgY3VycmVudFBhdGg6IHN0cmluZyxcbiAgZ2V0TGlua3M6IChwYXRoOiBzdHJpbmcpID0+IHN0cmluZ1tdLFxuKTogRGVja0luZm8gfCBudWxsIHtcbiAgY29uc3QgY3VycmVudExpbmtzID0gZ2V0TGlua3MoY3VycmVudFBhdGgpO1xuICBpZiAoY3VycmVudExpbmtzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgbGV0IG92ZXJ2aWV3OiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGxldCBmaXJzdFBhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICBpZiAoY3VycmVudExpbmtzLmxlbmd0aCA+PSAyKSB7XG4gICAgLy8gQSBzbGlkZTogZmlyc3QgbGluayBpcyB0aGUgb3ZlcnZpZXcgcGFnZVxuICAgIG92ZXJ2aWV3ID0gY3VycmVudExpbmtzWzBdO1xuICAgIGZpcnN0UGFnZSA9IGdldExpbmtzKG92ZXJ2aWV3KVswXTtcbiAgfSBlbHNlIHtcbiAgICAvLyBBIHNpbmdsZSBsaW5rOiBlaXRoZXIgd2UgQVJFIHRoZSBvdmVydmlldyAobGluayA9IGZpcnN0IHBhZ2UpLFxuICAgIC8vIG9yIHdlIGFyZSB0aGUgbGFzdCBzbGlkZSAobGluayA9IG92ZXJ2aWV3IHBhZ2UpXG4gICAgY29uc3Qgb25seSA9IGN1cnJlbnRMaW5rc1swXTtcbiAgICBjb25zdCBvbmx5TGlua3MgPSBnZXRMaW5rcyhvbmx5KTtcbiAgICBpZiAob25seUxpbmtzWzBdID09PSBjdXJyZW50UGF0aCkge1xuICAgICAgb3ZlcnZpZXcgPSBjdXJyZW50UGF0aDtcbiAgICAgIGZpcnN0UGFnZSA9IG9ubHk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG92ZXJ2aWV3ID0gb25seTtcbiAgICAgIGZpcnN0UGFnZSA9IG9ubHlMaW5rc1swXTtcbiAgICB9XG4gIH1cbiAgaWYgKCFvdmVydmlldyB8fCAhZmlyc3RQYWdlKSByZXR1cm4gbnVsbDtcblxuICAvLyBXYWxrIHRoZSBjaGFpbjogb3ZlcnZpZXcgXHUyMTkyIGZpcnN0IHBhZ2UgXHUyMTkyIG5leHQgXHUyMTkyIG5leHQgXHUyMTkyIFx1MjAyNlxuICBjb25zdCBjaGFpbjogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgdmlzaXRlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBwdXNoID0gKHA6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHZvaWQgPT4ge1xuICAgIGlmIChwICYmICF2aXNpdGVkLmhhcyhwKSkge1xuICAgICAgdmlzaXRlZC5hZGQocCk7XG4gICAgICBjaGFpbi5wdXNoKHApO1xuICAgIH1cbiAgfTtcbiAgcHVzaChvdmVydmlldyk7XG4gIHB1c2goZmlyc3RQYWdlKTtcbiAgbGV0IGN1ciA9IGZpcnN0UGFnZTtcbiAgd2hpbGUgKGN1cikge1xuICAgIGNvbnN0IG5leHQgPSBnZXRMaW5rcyhjdXIpWzFdO1xuICAgIGlmICghbmV4dCB8fCB2aXNpdGVkLmhhcyhuZXh0KSkgYnJlYWs7IC8vIGVuZCBvZiBkZWNrIG9yIGN5Y2xlIGd1YXJkXG4gICAgcHVzaChuZXh0KTtcbiAgICBjdXIgPSBuZXh0O1xuICB9XG5cbiAgY29uc3QgaW5kZXggPSBjaGFpbi5pbmRleE9mKGN1cnJlbnRQYXRoKTtcbiAgaWYgKGluZGV4ID09PSAtMSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiB7IGNoYWluLCBpbmRleCB9O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdXAgdG8gYG1heGAgbm90ZSBuYW1lcyBmcm9tIGEgYGRlY2tgIHByb3BlcnR5IHZhbHVlLlxuICogQWNjZXB0cyBhIHNpbmdsZSBzdHJpbmcgb3IgYSBZQU1MIGxpc3Qgb2Ygc3RyaW5nczsgdW5xdW90ZWQgW1t4XV0gdmFsdWVzIGFyZVxuICogcGFyc2VkIGJ5IFlBTUwgYXMgbmVzdGVkIGFycmF5cyBhbmQgZmxhdHRlbmVkIGhlcmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0TGlua3ModmFsdWU6IHVua25vd24sIG1heDogbnVtYmVyID0gTUFYX0RFQ0tfTElOS1MpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGZsYXQ6IHVua25vd25bXSA9IFtdO1xuICBjb25zdCBjb2xsZWN0ID0gKHY6IHVua25vd24pOiB2b2lkID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHYpIGNvbGxlY3QoaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZsYXQucHVzaCh2KTtcbiAgICB9XG4gIH07XG4gIGNvbGxlY3QodmFsdWUpO1xuXG4gIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBpdGVtIG9mIGZsYXQpIHtcbiAgICBjb25zdCBuYW1lID0gZXh0cmFjdExpbmtUZXh0KGl0ZW0pO1xuICAgIGlmIChuYW1lKSBvdXQucHVzaChuYW1lKTtcbiAgICBpZiAob3V0Lmxlbmd0aCA+PSBtYXgpIGJyZWFrO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogRXh0cmFjdCB1cCB0byBgbWF4YCByYXcgbGluayBzdHJpbmdzIGZyb20gYSBgZGVja2AgcHJvcGVydHkgdmFsdWUgXHUyMDE0IHRoZVxuICogdHJpbW1lZCB2YWx1ZXMgZXhhY3RseSBhcyB3cml0dGVuIChhbGlhcyAvIHBhdGggZm9ybXMgcHJlc2VydmVkKS4gU2FtZVxuICogZmxhdHRlbmluZyBydWxlcyBhcyBleHRyYWN0TGlua3MoKSwgYnV0IHdpdGhvdXQgZXh0cmFjdGluZyB0aGUgdGFyZ2V0IG5hbWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0UmF3TGlua3ModmFsdWU6IHVua25vd24sIG1heDogbnVtYmVyID0gTUFYX0RFQ0tfTElOS1MpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGZsYXQ6IHVua25vd25bXSA9IFtdO1xuICBjb25zdCBjb2xsZWN0ID0gKHY6IHVua25vd24pOiB2b2lkID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHYpIGNvbGxlY3QoaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZsYXQucHVzaCh2KTtcbiAgICB9XG4gIH07XG4gIGNvbGxlY3QodmFsdWUpO1xuXG4gIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBpdGVtIG9mIGZsYXQpIHtcbiAgICBpZiAodHlwZW9mIGl0ZW0gIT09IFwic3RyaW5nXCIpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHRyaW1tZWQgPSBpdGVtLnRyaW0oKTtcbiAgICBpZiAoIXRyaW1tZWQpIGNvbnRpbnVlO1xuICAgIG91dC5wdXNoKHRyaW1tZWQpO1xuICAgIGlmIChvdXQubGVuZ3RoID49IG1heCkgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRoZSB0YXJnZXQgbm90ZSBuYW1lIGZyb20gYSBtYXJrZG93biBsaW5rIHN0cmluZy5cbiAqIEhhbmRsZXMgc2V2ZXJhbCBzaGFwZXM6XG4gKiAgIFwiW1tzbGlkZS0yXV1cIiAgICAgICAgXHUyMTkyIHNsaWRlLTJcbiAqICAgXCJbW3NsaWRlLTJ8YWxpYXNdXVwiICBcdTIxOTIgc2xpZGUtMlxuICogICBcIltbc2xpZGUtMiNzZWN0aW9uXV1cIlx1MjE5MiBzbGlkZS0yXG4gKiAgIHNsaWRlLTIgICAgICAgICAgICAgIFx1MjE5MiBzbGlkZS0yIChiYXJlIGZpbGVuYW1lKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdExpbmtUZXh0KHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHJldHVybiBudWxsO1xuICBjb25zdCB0cmltbWVkID0gdmFsdWUudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHJldHVybiBudWxsO1xuICByZXR1cm4gdHJpbW1lZC5yZXBsYWNlKC9eXFxbXFxbLywgXCJcIikucmVwbGFjZSgvXFxdXFxdJC8sIFwiXCIpLnNwbGl0KFwifFwiKVswXS5zcGxpdChcIiNcIilbMF0udHJpbSgpO1xufVxuXG4vKiogUmVuZGVyIGEgcHJvcGVydHkgdmFsdWUgYXMgcmVhZGFibGUgdGV4dDogYXJyYXlzL29iamVjdHMgXHUyMTkyIEpTT04sIGVsc2UgU3RyaW5nICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0VmFsdWUodmFsdWU6IHVua25vd24pOiBzdHJpbmcge1xuICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFwiXHUyMDE0XCI7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBTdHJpbmcodmFsdWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbn1cbiIsICIvKipcbiAqIGNyZWF0ZU5leHQudHMgXHUyMDE0IFB1cmUgXCJDcmVhdGUgTmV4dCBTbGlkZVwiIHBsYW5uaW5nIGNvcmUgZm9yIG5hdGl2ZS1zbGlkZXMuXG4gKlxuICogRXZlcnl0aGluZyBpbiB0aGlzIG1vZHVsZSBpcyBmcmVlIG9mIE9ic2lkaWFuIHJ1bnRpbWUgZGVwZW5kZW5jaWVzIHNvIGl0IGNhblxuICogYmUgdW5pdCB0ZXN0ZWQgZGlyZWN0bHkgKHNlZSB0ZXN0L2NyZWF0ZU5leHQudGVzdC50cykuIG1haW4udHMgYWRhcHRzIHRoZVxuICogdmF1bHQgKG1ldGFkYXRhQ2FjaGUsIGNvbXB1dGVEZWNrKSB0byB0aGlzIHB1cmUgaW50ZXJmYWNlIGFuZCBhcHBsaWVzIHRoZVxuICogcmVzdWx0aW5nIHBsYW4gd2l0aCB2YXVsdC5jcmVhdGUoKSArIGZpbGVNYW5hZ2VyLnByb2Nlc3NGcm9udE1hdHRlcigpLlxuICpcbiAqIFRoZSBwbGFuIGRlY2lkZXMsIGZvciB0aGUgY3VycmVudCBub3RlOlxuICogICAtIHRoZSBuYW1lIG9mIHRoZSBuZXcgc2xpZGUgZmlsZSAoY29sbGlzaW9uLWF3YXJlKSxcbiAqICAgLSB0aGUgcmF3IGBkZWNrYCBsaW5rIHRleHRzIG9mIHRoZSBuZXcgbm90ZSxcbiAqICAgLSB0aGUgcmV3cml0ZXMgbmVlZGVkIG9uIGV4aXN0aW5nIG5vdGVzIChpbiBwcmFjdGljZSBhbHdheXMgdGhlIGN1cnJlbnRcbiAqICAgICBub3RlIGl0c2VsZikuXG4gKi9cblxuaW1wb3J0IHsgZXh0cmFjdExpbmtUZXh0IH0gZnJvbSBcIi4vZGVja1wiO1xuXG4vKiogSW5wdXRzIGZvciBwbGFubmluZyBcdTIwMTQgcmVzb2x2ZWQgYnkgdGhlIGFkYXB0ZXIgaW4gbWFpbi50cyAqL1xuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVOZXh0SW5wdXQge1xuICAvKiogQmFzZW5hbWUgKHdpdGhvdXQgZXh0ZW5zaW9uKSBvZiB0aGUgY3VycmVudCBub3RlICovXG4gIGN1cnJlbnROYW1lOiBzdHJpbmc7XG4gIC8qKiBSYXcgYGRlY2tgIGxpbmsgdGV4dHMgb2YgdGhlIGN1cnJlbnQgbm90ZSAoZXh0cmFjdGVkLCB1cCB0byB0d28pICovXG4gIGN1cnJlbnRMaW5rczogc3RyaW5nW107XG4gIC8qKiBUcnVlIHdoZW4gdGhlIGN1cnJlbnQgbm90ZSBJUyB0aGUgZGVjaydzIG92ZXJ2aWV3IHBhZ2UgKGNoYWluIGluZGV4IDApICovXG4gIGlzT3ZlcnZpZXc6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBSYXcgbGluayB0ZXh0IHRoZSBvbGQgZmlyc3QgcGFnZSB1c2VzIHRvIGxpbmsgYmFjayB0byB0aGUgb3ZlcnZpZXcuXG4gICAqIE9ubHkgbWVhbmluZ2Z1bCBmb3Igb3ZlcnZpZXcgaW5zZXJ0aW9uICh0aGUgb3ZlcnZpZXcgaXRzZWxmIG9ubHkgbGlua3NcbiAgICogZm9yd2FyZCwgc28gaXRzIG93biBmcm9udG1hdHRlciBjb250YWlucyBubyBzZWxmLXJlZmVyZW5jZSkuXG4gICAqL1xuICBvdmVydmlld0JhY2tMaW5rPzogc3RyaW5nO1xuICAvKiogQmFzZW5hbWVzIG9mIGV2ZXJ5IG1hcmtkb3duIG5vdGUgaW4gdGhlIHZhdWx0IChjb2xsaXNpb24tZnJlZSBuYW1pbmcpICovXG4gIGV4aXN0aW5nTmFtZXM6IFNldDxzdHJpbmc+O1xufVxuXG4vKiogT25lIG5vdGUgd2hvc2UgYGRlY2tgIHByb3BlcnR5IG11c3QgYmUgcmV3cml0dGVuICovXG5leHBvcnQgaW50ZXJmYWNlIERlY2tSZXdyaXRlIHtcbiAgLyoqIEJhc2VuYW1lIG9mIHRoZSBub3RlIHRvIHJld3JpdGUgKi9cbiAgbmFtZTogc3RyaW5nO1xuICAvKiogVGhlIG5ldyByYXcgYGRlY2tgIGxpbmsgdGV4dHMgKHNlcmlhbGl6ZWQgYXMgYSBZQU1MIGxpc3QpICovXG4gIGRlY2s6IHN0cmluZ1tdO1xufVxuXG4vKiogVGhlIGZ1bGwgcGxhbiBmb3IgY3JlYXRpbmcgb25lIG5ldyBzbGlkZSAqL1xuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVOZXh0UmVzdWx0IHtcbiAgLyoqIEJhc2VuYW1lICh3aXRob3V0IGV4dGVuc2lvbikgb2YgdGhlIG5ldyBzbGlkZSBmaWxlICovXG4gIG5ld05hbWU6IHN0cmluZztcbiAgLyoqIFJhdyBgZGVja2AgbGluayB0ZXh0cyBmb3IgdGhlIG5ldyBub3RlJ3MgZnJvbnRtYXR0ZXIgKi9cbiAgbmV3RGVja0xpbmtzOiBzdHJpbmdbXTtcbiAgLyoqIFJld3JpdGVzIHRvIGFwcGx5IHRvIGV4aXN0aW5nIG5vdGVzIChpbiBwcmFjdGljZSBhbHdheXMgdGhlIGN1cnJlbnQgbm90ZSkgKi9cbiAgcmV3cml0ZXM6IERlY2tSZXdyaXRlW107XG59XG5cbi8qKlxuICogUGxhbiB0aGUgY3JlYXRpb24gb2YgYSBuZXcgc2xpZGUgYWZ0ZXIgdGhlIGN1cnJlbnQgbm90ZS5cbiAqXG4gKiBCZWhhdmlvcnM6XG4gKiAgIC0gTGFzdCBzbGlkZSAobm8gc2Vjb25kIGxpbmspOiBhcHBlbmQgYDxjdXJyZW50Pi1uZXh0YCBhcyB0aGUgbmV3IGxhc3RcbiAqICAgICBzbGlkZTsgdGhlIGN1cnJlbnQgbm90ZSBnYWlucyB0aGUgc2Vjb25kIGxpbmsuXG4gKiAgIC0gU2xpZGUgd2l0aCBhIHZhbGlkIG5leHQ6IGluc2VydCBgPGN1cnJlbnQ+LW5leHRgIGJldHdlZW4gdGhlbTsgdGhlIG5ld1xuICogICAgIG5vdGUgdGFrZXMgb3ZlciB0aGUgb2xkIG5leHQgbGluay5cbiAqICAgLSBTbGlkZSB3aG9zZSBzZWNvbmQgbGluayBpcyBicm9rZW4gKHBsYWluLCBub24tZXhpc3RpbmcgbmFtZSk6IGNyZWF0ZVxuICogICAgIGV4YWN0bHkgdGhlIGRlY2xhcmVkIG1pc3Npbmcgbm90ZSBhcyB0aGUgbmV3IGxhc3Qgc2xpZGUgXHUyMDE0IHRoZSBcdTI2QTAgd2FybmluZ1xuICogICAgIGRpc2FwcGVhcnMgYW5kIHRoZSBhdXRob3IncyBpbnRlbnQgaXMgaG9ub3VyZWQuIEEgYnJva2VuIGxpbmsgdGhhdCBpc1xuICogICAgIG5vdCBhIHBsYWluIGJhc2VuYW1lIChwYXRoLXF1YWxpZmllZCwgc2VsZi1yZWZlcmVuY2luZykgaXMgdHJlYXRlZCBhc1xuICogICAgIGludmFsaWQgYW5kIGRyb3BwZWQgKGFwcGVuZCBhIGA8Y3VycmVudD4tbmV4dGAgbGFzdCBzbGlkZSBpbnN0ZWFkKS5cbiAqICAgLSBPdmVydmlldyBwYWdlIChzaW5nbGUgbGluayA9IGZpcnN0IHBhZ2UpOiBpbnNlcnQgYSBuZXcgZmlyc3QgcGFnZTsgdGhlXG4gKiAgICAgb3ZlcnZpZXcncyBsaW5rIHBvaW50cyB0byBpdCBhbmQgdGhlIG9sZCBmaXJzdCBwYWdlIGlzIHB1c2hlZCBiYWNrLlxuICpcbiAqIFJldHVybnMgbnVsbCB3aGVuIHRoZSBub3RlIGhhcyBubyB1c2FibGUgYGRlY2tgIGxpbmtzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGxhbkNyZWF0ZU5leHQoaW5wdXQ6IENyZWF0ZU5leHRJbnB1dCk6IENyZWF0ZU5leHRSZXN1bHQgfCBudWxsIHtcbiAgY29uc3QgeyBjdXJyZW50TmFtZSwgY3VycmVudExpbmtzLCBpc092ZXJ2aWV3IH0gPSBpbnB1dDtcbiAgaWYgKGN1cnJlbnRMaW5rcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBPdmVydmlldyBwYWdlOiBpbnNlcnQgYSBuZXcgZmlyc3QgcGFnZSBhZnRlciBpdCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgaWYgKGlzT3ZlcnZpZXcpIHtcbiAgICBjb25zdCBvbGRGaXJzdCA9IGN1cnJlbnRMaW5rc1swXTtcbiAgICBpZiAoIW9sZEZpcnN0KSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBuZXdOYW1lID0gdW5pcXVlTmFtZShgJHtjdXJyZW50TmFtZX0tbmV4dGAsIGlucHV0LmV4aXN0aW5nTmFtZXMpO1xuICAgIGNvbnN0IGJhY2sgPSBpbnB1dC5vdmVydmlld0JhY2tMaW5rID8/IGBbWyR7Y3VycmVudE5hbWV9XV1gO1xuICAgIHJldHVybiB7XG4gICAgICBuZXdOYW1lLFxuICAgICAgbmV3RGVja0xpbmtzOiBbYmFjaywgb2xkRmlyc3RdLFxuICAgICAgcmV3cml0ZXM6IFt7IG5hbWU6IGN1cnJlbnROYW1lLCBkZWNrOiBbYFtbJHtuZXdOYW1lfV1dYF0gfV0sXG4gICAgfTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTbGlkZTogZmlyc3QgbGluayBpcyB0aGUgb3ZlcnZpZXcgcGFnZSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3Qgb3ZlcnZpZXdMaW5rID0gY3VycmVudExpbmtzWzBdO1xuICBpZiAoIW92ZXJ2aWV3TGluaykgcmV0dXJuIG51bGw7XG4gIGNvbnN0IG5leHRMaW5rID0gY3VycmVudExpbmtzWzFdO1xuXG4gIGlmIChuZXh0TGluaykge1xuICAgIGNvbnN0IG5leHROYW1lID0gZXh0cmFjdExpbmtUZXh0KG5leHRMaW5rKTtcbiAgICBpZiAobmV4dE5hbWUgJiYgaXNQbGFpbk5hbWUobmV4dE5hbWUpICYmIG5leHROYW1lICE9PSBjdXJyZW50TmFtZSkge1xuICAgICAgaWYgKCFpbnB1dC5leGlzdGluZ05hbWVzLmhhcyhuZXh0TmFtZSkpIHtcbiAgICAgICAgLy8gVGhlIGRlY2xhcmVkIG5leHQgbm90ZSBkb2VzIG5vdCBleGlzdCB5ZXQgXHUyMTkyIGNyZWF0ZSBleGFjdGx5IHRoYXRcbiAgICAgICAgLy8gbm90ZSAoZml4ZXMgdGhlIGJyb2tlbi1saW5rIHdhcm5pbmcsIGhvbm91cnMgdGhlIGF1dGhvcidzIGludGVudCkuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbmV3TmFtZTogbmV4dE5hbWUsXG4gICAgICAgICAgbmV3RGVja0xpbmtzOiBbb3ZlcnZpZXdMaW5rXSxcbiAgICAgICAgICByZXdyaXRlczogW10sXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICAvLyBBIHZhbGlkIG5leHQgbm90ZSBleGlzdHMgXHUyMTkyIGluc2VydCBiZXR3ZWVuIGl0IGFuZCB0aGUgY3VycmVudCBub3RlLlxuICAgICAgY29uc3QgbmV3TmFtZSA9IHVuaXF1ZU5hbWUoYCR7Y3VycmVudE5hbWV9LW5leHRgLCBpbnB1dC5leGlzdGluZ05hbWVzKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG5ld05hbWUsXG4gICAgICAgIG5ld0RlY2tMaW5rczogW292ZXJ2aWV3TGluaywgbmV4dExpbmtdLFxuICAgICAgICByZXdyaXRlczogW3sgbmFtZTogY3VycmVudE5hbWUsIGRlY2s6IFtvdmVydmlld0xpbmssIGBbWyR7bmV3TmFtZX1dXWBdIH1dLFxuICAgICAgfTtcbiAgICB9XG4gICAgLy8gSW52YWxpZCAocGF0aC1xdWFsaWZpZWQgLyBzZWxmLXJlZmVyZW5jaW5nKSBuZXh0IGxpbmsgXHUyMTkyIGRyb3AgaXQgYW5kXG4gICAgLy8gYXBwZW5kIGEgbmV3IGxhc3Qgc2xpZGUgKGZhbGwgdGhyb3VnaCB0byB0aGUgbm8tbmV4dCBicmFuY2gpLlxuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIExhc3Qgc2xpZGUgXHUyMTkyIGFwcGVuZCBhIG5ldyBsYXN0IHNsaWRlIGFmdGVyIGl0IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCBuZXdOYW1lID0gdW5pcXVlTmFtZShgJHtjdXJyZW50TmFtZX0tbmV4dGAsIGlucHV0LmV4aXN0aW5nTmFtZXMpO1xuICByZXR1cm4ge1xuICAgIG5ld05hbWUsXG4gICAgbmV3RGVja0xpbmtzOiBbb3ZlcnZpZXdMaW5rXSxcbiAgICByZXdyaXRlczogW3sgbmFtZTogY3VycmVudE5hbWUsIGRlY2s6IFtvdmVydmlld0xpbmssIGBbWyR7bmV3TmFtZX1dXWBdIH1dLFxuICB9O1xufVxuXG4vKiogQSBuYW1lIHVzYWJsZSBhcyBhIHZhdWx0IG5vdGUgbmFtZTogbm8gcGF0aCBzZXBhcmF0b3JzLCBub24tZW1wdHkgKi9cbmZ1bmN0aW9uIGlzUGxhaW5OYW1lKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gbmFtZS5sZW5ndGggPiAwICYmICFuYW1lLmluY2x1ZGVzKFwiL1wiKSAmJiAhbmFtZS5pbmNsdWRlcyhcIlxcXFxcIik7XG59XG5cbi8qKiBGaXJzdCBmcmVlIG5hbWUgaW4gdGhlIGZhbWlseSBgYmFzZWAsIGBiYXNlLTJgLCBgYmFzZS0zYCwgXHUyMDI2ICovXG5mdW5jdGlvbiB1bmlxdWVOYW1lKGJhc2U6IHN0cmluZywgZXhpc3Rpbmc6IFNldDxzdHJpbmc+KTogc3RyaW5nIHtcbiAgaWYgKCFleGlzdGluZy5oYXMoYmFzZSkpIHJldHVybiBiYXNlO1xuICBmb3IgKGxldCBpID0gMjsgOyBpKyspIHtcbiAgICBjb25zdCBjYW5kaWRhdGUgPSBgJHtiYXNlfS0ke2l9YDtcbiAgICBpZiAoIWV4aXN0aW5nLmhhcyhjYW5kaWRhdGUpKSByZXR1cm4gY2FuZGlkYXRlO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUErREEsc0JBQStFOzs7QUNyRHhFLElBQU0saUJBQWlCO0FBeUJ2QixTQUFTLFlBQ2QsYUFDQSxVQUNpQjtBQUNqQixRQUFNLGVBQWUsU0FBUyxXQUFXO0FBQ3pDLE1BQUksYUFBYSxXQUFXLEVBQUcsUUFBTztBQUV0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
