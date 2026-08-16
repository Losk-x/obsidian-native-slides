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
var import_obsidian5 = require("obsidian");

// src/bar.ts
function createBar() {
  const bar = document.createElement("div");
  bar.className = "native-slides-bar";
  bar.style.display = "none";
  return bar;
}
function navButton(label, tip, onClick, disabled = false) {
  const btn = document.createElement("button");
  btn.className = "native-slides-nav-btn";
  btn.textContent = label;
  btn.title = tip;
  btn.disabled = disabled;
  if (!disabled) btn.addEventListener("click", onClick);
  return btn;
}
function syncTabBarHeight(cached) {
  const tabBar = document.querySelector(
    ".workspace-tabs.mod-top .workspace-tab-header-container"
  );
  if (tabBar && tabBar.offsetHeight > 0) cached = tabBar.offsetHeight;
  if (cached > 0) {
    document.documentElement.style.setProperty("--native-slides-tabbar-height", `${cached}px`);
  } else {
    document.documentElement.style.removeProperty("--native-slides-tabbar-height");
  }
  return cached;
}

// src/debug.ts
var import_obsidian2 = require("obsidian");

// src/mode.ts
var import_obsidian = require("obsidian");
function currentMode(app) {
  const view = app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
  return view ? view.getMode() : "";
}
function isLivePreview(app) {
  const view = app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
  if (!view || view.getMode() !== "source") return false;
  const state = view.getState();
  if (state.source === true) return false;
  if (state.source === false) return true;
  return !!view.contentEl.querySelector(".markdown-source-view.mod-cm6.is-live-preview");
}
function frontmatterOf(app, file) {
  const cache = app.metadataCache.getFileCache(file);
  return cache?.frontmatter ?? null;
}
function activeFrontmatter(app) {
  const file = app.workspace.getActiveFile();
  return file ? frontmatterOf(app, file) : null;
}

// src/debug.ts
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
    "h1LeftInContent",
    "contentChildren",
    "topChain"
  ]) {
    const probe = sample[key];
    if (probe === void 0 || probe === null) continue;
    if (Array.isArray(probe) && probe.length === 0) continue;
    if (typeof probe === "object" && !Array.isArray(probe) && Object.keys(probe).length === 0)
      continue;
    if (target[key] === void 0) target[key] = probe;
  }
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
function sampleStyles(app) {
  const view = app.workspace.getActiveViewOfType(import_obsidian2.MarkdownView);
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
  const metadataDisplay = (() => {
    const sel = isEdit ? ".markdown-source-view .metadata-container" : ".markdown-reading-view .metadata-container";
    const el = contentEl.querySelector(sel);
    return el ? getComputedStyle(el).display : "(not in DOM)";
  })();
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
  const h1LeftInContent = (() => {
    if (!h1 || !anchor) return void 0;
    return Math.round(h1.getBoundingClientRect().left - anchor.getBoundingClientRect().left);
  })();
  const contentChildren = (() => {
    if (!anchor) return void 0;
    return Array.from(anchor.children).slice(0, 4).map((el) => {
      const cs = getComputedStyle(el);
      return {
        cls: el.className || el.tagName.toLowerCase(),
        display: cs.display,
        height: Math.round(el.getBoundingClientRect().height),
        marginTop: cs.marginTop,
        paddingTop: cs.paddingTop,
        marginBottom: cs.marginBottom,
        paddingBottom: cs.paddingBottom
      };
    });
  })();
  const topChain = (() => {
    if (!anchor) return void 0;
    const parts = [];
    let node = anchor;
    while (node && node !== contentEl && node !== document.body) {
      const cs = getComputedStyle(node);
      parts.push({
        cls: node.className || node.tagName.toLowerCase(),
        padTop: cs.paddingTop,
        marTop: cs.marginTop
      });
      node = node.parentElement;
    }
    return parts;
  })();
  const dump = {
    mode: isEdit ? "edit (Live Preview)" : "reading",
    // Slides styling only applies when Slides mode is on
    slidesActive: document.body.classList.contains("native-slides-mode"),
    domTags: isEdit ? domTags : void 0,
    sourceViewClass: isEdit ? sourceViewClass : void 0,
    livePreview: isEdit ? isLivePreview(app) : void 0,
    listLines: isEdit ? listLines : void 0,
    metadataContainerDisplay: metadataDisplay,
    h1OffsetTop,
    h1TopInContent,
    h1LeftInContent,
    contentChildren,
    topChain,
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
      "font-variant",
      "color",
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
      "--h1-weight": cssVar("--h1-weight"),
      "--h1-variant": cssVar("--h1-variant"),
      "--h1-color": cssVar("--h1-color"),
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
async function dumpTypography(plugin) {
  const app = plugin.app;
  if (!document.body.classList.contains("native-slides-mode")) {
    new import_obsidian2.Notice("Native Slides: enter Slides mode first (Mod+Shift+E on a deck note)");
    return;
  }
  const view = app.workspace.getActiveViewOfType(import_obsidian2.MarkdownView);
  if (!view) {
    new import_obsidian2.Notice("Native Slides: no active Markdown note");
    return;
  }
  const startMode = view.getMode();
  const activeFile = app.workspace.getActiveFile();
  const leaf = app.workspace.getLeaf(false);
  const edit = {};
  for (const name of SAMPLE_NOTE_NAMES) {
    const f = app.vault.getAbstractFileByPath(`${name}.md`);
    if (!(f instanceof import_obsidian2.TFile)) continue;
    await leaf.openFile(f, { state: { mode: "source" } });
    await sleep(500);
    const s = sampleStyles(app);
    if (s) mergeSample(edit, s);
  }
  let reading = null;
  const demo = app.vault.getAbstractFileByPath("typography-demo.md");
  if (demo instanceof import_obsidian2.TFile) {
    await leaf.openFile(demo, { state: { mode: "preview" } });
    await sleep(800);
    reading = sampleStyles(app);
  }
  if (activeFile) {
    await leaf.openFile(activeFile, { state: { mode: startMode } });
    plugin.refresh();
  }
  if (!reading) {
    new import_obsidian2.Notice("Native Slides: reading sample failed");
    return;
  }
  const payload = { edit, reading, diff: diffDumps(edit, reading) };
  try {
    await app.vault.adapter.write(".native-slides-debug.json", JSON.stringify(payload, null, 2));
    new import_obsidian2.Notice("Typography dump \u2192 .native-slides-debug.json (vault root)");
  } catch (error) {
    new import_obsidian2.Notice(`Native Slides: could not write debug file (${String(error)})`);
  }
  console.log("[native-slides debug-styles]", JSON.stringify(payload, null, 2));
}
function registerDebugCommand(plugin) {
  plugin.addCommand({
    id: "ns-debug-styles",
    name: "Debug: Dump Typography Styles",
    callback: () => void dumpTypography(plugin)
  });
}

// src/types.ts
var DEFAULT_SETTINGS = {
  showNavButtons: true,
  showPageNumber: true,
  barHidden: false,
  autoEnterSlides: false,
  slidesTitle: ""
};
var DECK_KEY = "deck";

// src/commands.ts
function registerCommands(plugin) {
  plugin.addCommand({
    id: "ns-toggle-bar",
    name: "Toggle Slides Bar",
    callback: async () => {
      plugin.settings.barHidden = !plugin.settings.barHidden;
      await plugin.saveSettings();
      plugin.refresh();
    }
  });
  plugin.addCommand({
    id: "ns-prev",
    name: "Previous Page",
    hotkeys: [{ modifiers: ["Mod", "Shift"], key: "ArrowLeft" }],
    callback: () => plugin.navigate("prev")
  });
  plugin.addCommand({
    id: "ns-next",
    name: "Next Page",
    hotkeys: [{ modifiers: ["Mod", "Shift"], key: "ArrowRight" }],
    callback: () => plugin.navigate("next")
  });
  plugin.addCommand({
    id: "ns-create-next",
    name: "Create Next Slide",
    // Greyed out in the palette unless the active note can take a next slide
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) return false;
      const plan = plugin.deckService.planCreateNext(file);
      if (!plan) return false;
      if (!checking) void plugin.deckService.executeCreateNext(file, plan);
      return true;
    }
  });
  plugin.addCommand({
    id: "ns-toggle-slides",
    name: "Toggle Slides Mode",
    hotkeys: [{ modifiers: ["Mod", "Shift"], key: "E" }],
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) return false;
      const fm = frontmatterOf(plugin.app, file);
      if (fm === null || !(DECK_KEY in fm)) return false;
      if (!checking) plugin.toggleSlides();
      return true;
    }
  });
  if (true) registerDebugCommand(plugin);
}

// src/deck-service.ts
var import_obsidian3 = require("obsidian");

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

// src/deck-service.ts
var DeckService = class {
  constructor(app) {
    this.app = app;
  }
  /** Resolve the current note's position inside its deck (path-based wrapper) */
  compute(file) {
    return computeDeck(file.path, (path) => this.linkPaths(path));
  }
  /** Resolve the `deck` property of a note into real note paths (max two) */
  linkPaths(path) {
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof import_obsidian3.TFile)) return [];
    const fm = frontmatterOf(this.app, f);
    const names = fm ? extractLinks(fm[DECK_KEY]) : [];
    return names.map((name) => this.app.metadataCache.getFirstLinkpathDest(name, path)).filter((x) => !!x).map((x) => x.path);
  }
  /** Names in the `deck` property that resolve to no note (broken links) */
  broken(file) {
    const fm = frontmatterOf(this.app, file);
    const names = fm ? extractLinks(fm[DECK_KEY]) : [];
    return names.filter((name) => !this.app.metadataCache.getFirstLinkpathDest(name, file.path));
  }
  /**
   * Plan a "Create Next Slide" run for the active note, or null when the
   * note cannot take a next slide (no usable `deck` property).
   *
   * Slides on the chain insert/append after the current note; the overview
   * page inserts a new first page; an off-chain note with a resolvable
   * overview link still gets its declared missing next note created.
   */
  planCreateNext(file) {
    const fm = frontmatterOf(this.app, file);
    const raw = fm ? extractRawLinks(fm[DECK_KEY]) : [];
    if (raw.length === 0) return null;
    const deck = this.compute(file);
    const existingNames = new Set(this.app.vault.getMarkdownFiles().map((f) => f.basename));
    if (deck) {
      let overviewBackLink;
      if (deck.index === 0) {
        const oldFirst = deck.chain[1] ? this.app.vault.getAbstractFileByPath(deck.chain[1]) : null;
        if (oldFirst instanceof import_obsidian3.TFile) {
          const f2 = frontmatterOf(this.app, oldFirst);
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
      new import_obsidian3.Notice(`Native Slides: could not create "${plan.newName}.md" (${String(error)})`);
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
};

// src/settings.ts
var import_obsidian4 = require("obsidian");
var NativeSlidesSettingTab = class extends import_obsidian4.PluginSettingTab {
  constructor(plugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Native Slides \xB7 Settings" });
    new import_obsidian4.Setting(containerEl).setName("Show Previous/Next buttons").setDesc(
      "Show \u25C0 \u25B6 buttons on the left of the slides bar when the note belongs to a deck (has a `deck` property)"
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showNavButtons).onChange(async (value) => {
        this.plugin.settings.showNavButtons = value;
        await this.plugin.saveSettings();
        this.plugin.refresh();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Show page number").setDesc(
      "Auto-computed from the deck chain (overview page shows \u201COverview\u201D); shown at the bottom-right"
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showPageNumber).onChange(async (value) => {
        this.plugin.settings.showPageNumber = value;
        await this.plugin.saveSettings();
        this.plugin.refresh();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Auto-enter Slides mode").setDesc(
      "Open deck notes directly in Slides mode. Leave off to enter manually with the Toggle Slides Mode command (Mod+Shift+E) or the previous/next page hotkeys."
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoEnterSlides).onChange(async (value) => {
        this.plugin.settings.autoEnterSlides = value;
        await this.plugin.saveSettings();
        this.plugin.refresh();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Slides title").setDesc(
      "Frontmatter property to show as the card title (H1). Leave empty for none; type `filename` to use the file name."
    ).addText(
      (text) => text.setPlaceholder("e.g. title").setValue(this.plugin.settings.slidesTitle).onChange(async (value) => {
        this.plugin.settings.slidesTitle = value;
        await this.plugin.saveSettings();
        this.plugin.refresh();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Navigation hotkeys").setDesc(
      "Default: Previous Page Mod+Shift+\u2190, Next Page Mod+Shift+\u2192. Rebind under Settings \u2192 Hotkeys."
    ).addButton(
      (button) => button.setButtonText("Open Hotkeys Settings").onClick(() => {
        this.app.setting?.openTabById?.("hotkeys");
      })
    );
  }
};

// src/utils.ts
function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

// main.ts
var NativeSlidesPlugin = class extends import_obsidian5.Plugin {
  constructor() {
    super(...arguments);
    /** The slides bar DOM element */
    this.bar = null;
    /** Plugin settings */
    this.settings = { ...DEFAULT_SETTINGS };
    /** Whether Slides mode is currently active (session state, not persisted) */
    this.slidesMode = false;
    /** View mode to restore when leaving Slides mode ("preview" | "source") */
    this.exitMode = "source";
    /** Whether the exit view was Source mode (true) vs Live Preview (false) */
    this.exitSource = false;
    /** Last note auto-entered into Slides mode (prevents re-entering after manual exit) */
    this.autoEnteredPath = "";
    /** Last refresh key ("path|mode") to avoid pointless re-renders */
    this.lastKey = "";
    /** Last measured tab-bar height (px) — cached while the slides bar is hidden */
    this.tabBarHeight = 0;
  }
  async onload() {
    await this.loadSettings();
    this.deckService = new DeckService(this.app);
    this.addSettingTab(new NativeSlidesSettingTab(this));
    this.registerEvent(
      this.app.workspace.on("file-open", () => {
        this.maybeAutoEnterSlides();
        this.refresh();
      })
    );
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
        const key = file ? `${file.path}|${currentMode(this.app)}` : "";
        if (key !== this.lastKey) {
          this.lastKey = key;
          this.refresh();
        }
      }, 500)
    );
    registerCommands(this);
    this.registerDomEvent(
      document,
      "scroll",
      (evt) => {
        if (!document.body.classList.contains("native-slides-mode")) return;
        const view = this.app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
        if (!view) return;
        const el = evt.target;
        if (el instanceof HTMLElement && view.contentEl.contains(el)) {
          if (el.scrollTop !== 0) el.scrollTop = 0;
          if (el.scrollLeft !== 0) el.scrollLeft = 0;
        }
      },
      { capture: true }
    );
    this.bar = createBar();
    document.body.appendChild(this.bar);
    this.refresh();
  }
  onunload() {
    this.bar?.remove();
    this.bar = null;
    document.body.classList.remove("native-slides-mode");
  }
  // ── Settings ──────────────────────────────────────────────────────────
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  // ── Slides mode ───────────────────────────────────────────────────────
  /** Whether the active note is a deck note (has a `deck` property) */
  isDeckNote(file) {
    if (!file) return false;
    const fm = frontmatterOf(this.app, file);
    return fm !== null && DECK_KEY in fm;
  }
  /**
   * Render the card title (an H1 inside the card) per the `slidesTitle`
   * setting, via the `.cm-content` data-slides-title attribute — the CSS
   * ::before pseudo-element renders it. "" (default) shows nothing;
   * "filename" uses the file name; any other value names a frontmatter
   * property. The file name (inline title) outside the card is always hidden
   * by CSS in Slides mode.
   */
  updateInlineTitle(slides) {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
    const file = this.app.workspace.getActiveFile();
    const content = view?.contentEl.querySelector(".cm-content");
    if (!content || !file) return;
    let text = null;
    if (slides) {
      const src = this.settings.slidesTitle.trim();
      if (src === "filename") {
        text = file.basename;
      } else if (src) {
        const fm = frontmatterOf(this.app, file);
        const v = fm?.[src];
        if (v != null) {
          text = typeof v === "string" ? v : Array.isArray(v) ? v.join(", ") : String(v);
        }
      }
    }
    if (text) content.setAttribute("data-slides-title", text);
    else content.removeAttribute("data-slides-title");
  }
  /** Enter Slides mode: record the exit state and force the Live Preview */
  async enterSlides() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
    if (view) {
      const state = view.getState();
      this.exitMode = state.mode === "preview" ? "preview" : "source";
      this.exitSource = state.source === true;
      const next = view.leaf.getViewState();
      next.state = { ...next.state, mode: "source", source: false };
      await view.leaf.setViewState(next, { focus: false });
    }
    this.slidesMode = true;
    this.refresh();
  }
  /** Exit Slides mode: restore the view mode recorded at entry */
  exitSlides() {
    this.slidesMode = false;
    const view = this.app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
    if (view) {
      const state = view.leaf.getViewState();
      if (this.exitMode === "preview") {
        state.state = { ...state.state, mode: "preview" };
      } else {
        state.state = { ...state.state, mode: "source", source: this.exitSource };
      }
      void view.leaf.setViewState(state, { focus: false });
    }
    this.refresh();
  }
  /** Toggle Slides mode (deck notes only — enforced by the command) */
  toggleSlides() {
    if (this.slidesMode) this.exitSlides();
    else void this.enterSlides();
  }
  /** Auto-enter Slides mode once per opened deck note when the setting is on */
  maybeAutoEnterSlides() {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.path === this.autoEnteredPath) return;
    this.autoEnteredPath = file.path;
    if (this.settings.autoEnterSlides && this.isDeckNote(file) && !this.slidesMode) {
      void this.enterSlides();
    }
  }
  // ── PPT navigation ────────────────────────────────────────────────────
  /** Move one step back/forward along the deck chain (entering Slides mode as needed) */
  async navigate(direction) {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    const deck = this.deckService.compute(file);
    if (!deck) return;
    const target = deck.chain[direction === "prev" ? deck.index - 1 : deck.index + 1];
    if (!target) return;
    if (!this.slidesMode) await this.enterSlides();
    void this.app.workspace.openLinkText(target, file.path);
  }
  // ── Bar rendering ─────────────────────────────────────────────────────
  /** Decide what the slides bar shows, then re-render it */
  refresh() {
    if (!this.bar) return;
    const file = this.app.workspace.getActiveFile();
    const mode = currentMode(this.app);
    const isCard = this.isDeckNote(file);
    const livePreviewNow = mode === "source" && isLivePreview(this.app);
    if (this.slidesMode && (!isCard || !livePreviewNow)) {
      this.slidesMode = false;
    }
    this.tabBarHeight = syncTabBarHeight(this.tabBarHeight);
    const slides = this.slidesMode && isCard && livePreviewNow;
    document.body.classList.toggle("native-slides-mode", slides);
    this.updateInlineTitle(slides);
    const barVisible = slides && !this.settings.barHidden;
    if (!barVisible) {
      this.bar.style.display = "none";
      return;
    }
    if (!file) return;
    const fm = activeFrontmatter(this.app);
    const deck = this.deckService.compute(file);
    clearChildren(this.bar);
    if (this.settings.showNavButtons && deck) {
      const hasPrev = deck.index > 0;
      const hasNext = deck.index < deck.chain.length - 1;
      const nav = document.createElement("div");
      nav.className = "native-slides-nav";
      nav.appendChild(navButton("\u25C0", "Previous page", () => this.navigate("prev"), !hasPrev));
      nav.appendChild(navButton("\u25B6", "Next page", () => this.navigate("next"), !hasNext));
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
    const broken = file ? this.deckService.broken(file) : [];
    if (broken.length > 0) {
      const warn = document.createElement("span");
      warn.className = "native-slides-warn";
      warn.textContent = "\u26A0 " + broken.join(", ");
      warn.title = "Broken deck link(s) \u2014 the target note does not exist";
      this.bar.appendChild(warn);
    }
    if (this.settings.showPageNumber && deck) {
      const page = document.createElement("span");
      page.className = "native-slides-page";
      page.textContent = deck.index === 0 ? "Overview" : `Page ${deck.index}`;
      this.bar.appendChild(page);
    }
    this.bar.style.display = this.bar.childElementCount === 0 ? "none" : "";
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvYmFyLnRzIiwgInNyYy9kZWJ1Zy50cyIsICJzcmMvbW9kZS50cyIsICJzcmMvdHlwZXMudHMiLCAic3JjL2NvbW1hbmRzLnRzIiwgInNyYy9kZWNrLXNlcnZpY2UudHMiLCAic3JjL2RlY2sudHMiLCAic3JjL2NyZWF0ZU5leHQudHMiLCAic3JjL3NldHRpbmdzLnRzIiwgInNyYy91dGlscy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBuYXRpdmUtc2xpZGVzIFx1MjAxNCBhIFwiU2xpZGVzIG1vZGVcIiBmb3IgT2JzaWRpYW4gZGVjayBub3Rlc1xuICpcbiAqIE9uZSByZXNlcnZlZCBmcm9udG1hdHRlciBrZXksIGBkZWNrYCAodXAgdG8gdHdvIG1hcmtkb3duIGxpbmtzKSwgZHJpdmVzXG4gKiBwcmV2L25leHQgbmF2aWdhdGlvbiBhbmQgYXV0by1jb21wdXRlZCBwYWdlIG51bWJlcnMuIEEgZGVjayBub3RlIGNhbiBiZVxuICogZW50ZXJlZCBpbnRvICoqU2xpZGVzIG1vZGUqKiBcdTIwMTQgYW4gaW1tZXJzaXZlLCBlZGl0YWJsZSAoTGl2ZSBQcmV2aWV3KSB2aWV3XG4gKiB3aXRoIGEgc2xpZGVzIGJhciBzaG93aW5nIHByb3BlcnRpZXMsIG5hdmlnYXRpb24gYW5kIHRoZSBwYWdlIG51bWJlci5cbiAqXG4gKiBOYXRpdmUgT2JzaWRpYW4gbW9kZXMgKFNvdXJjZSAvIGRlZmF1bHQgTGl2ZSBQcmV2aWV3IC8gUmVhZGluZyB2aWV3KSBhcmVcbiAqIGxlZnQgY29tcGxldGVseSB1bnRvdWNoZWQ6IG5vIHN0YXR1cy1iYXIgaGlkaW5nLCBubyBzbGlkZXMgYmFyLCBub1xuICogZnVsbHNjcmVlbiwgbm8gc3R5bGluZy4gU2xpZGVzIG1vZGUgaXMgdGhlIHBsdWdpbidzIG9ubHkgc3VyZmFjZS5cbiAqXG4gKiBUaGlzIGZpbGUgaXMgdGhlIGVudHJ5IHBvaW50IGFuZCBhIHRoaW4gb3JjaGVzdHJhdGlvbiBsYXllcjsgdGhlIGxvZ2ljXG4gKiBsaXZlcyBpbiBgc3JjL2A6XG4gKiAgIC0gc3JjL3R5cGVzLnRzICAgICAgICBzZXR0aW5ncyBzaGFwZSArIGRlZmF1bHRzICsgcmVzZXJ2ZWQgYGRlY2tgIGtleVxuICogICAtIHNyYy9tb2RlLnRzICAgICAgICAgdmlldyBtb2RlIC8gZnJvbnRtYXR0ZXIgaGVscGVycyAocHVyZSwgYEFwcGAtYmFzZWQpXG4gKiAgIC0gc3JjL2RlY2stc2VydmljZS50cyBkZWNrIGNoYWluIHJlc29sdXRpb24gKyBcImNyZWF0ZSBuZXh0IHNsaWRlXCIgZ2x1ZVxuICogICAtIHNyYy9iYXIudHMgICAgICAgICAgYmFyIERPTSBoZWxwZXJzIChjcmVhdGUgLyBidXR0b25zIC8gdGFiLWJhciBtZWFzdXJlKVxuICogICAtIHNyYy9jb21tYW5kcy50cyAgICAgY29tbWFuZCByZWdpc3RyYXRpb24gKGRldi1nYXRlZCBkZWJ1ZyBjb21tYW5kKVxuICogICAtIHNyYy9zZXR0aW5ncy50cyAgICAgc2V0dGluZ3MgdGFiXG4gKiAgIC0gc3JjL2RlYnVnLnRzICAgICAgICB0eXBvZ3JhcGh5IG1lYXN1cmVtZW50IHRvb2xpbmcgKGRldiBidWlsZHMgb25seSlcbiAqICAgLSBzcmMvZGVjay50cyAgICAgICAgIHB1cmUgZGVjayBjb3JlICh3aXRoIHNyYy9jcmVhdGVOZXh0LnRzKVxuICovXG5cbmltcG9ydCB7IE1hcmtkb3duVmlldywgUGx1Z2luLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgY3JlYXRlQmFyLCBuYXZCdXR0b24sIHN5bmNUYWJCYXJIZWlnaHQgfSBmcm9tIFwiLi9zcmMvYmFyXCI7XG5pbXBvcnQgeyByZWdpc3RlckNvbW1hbmRzIH0gZnJvbSBcIi4vc3JjL2NvbW1hbmRzXCI7XG5pbXBvcnQgeyBEZWNrU2VydmljZSB9IGZyb20gXCIuL3NyYy9kZWNrLXNlcnZpY2VcIjtcbmltcG9ydCB7IGZvcm1hdFZhbHVlIH0gZnJvbSBcIi4vc3JjL2RlY2tcIjtcbmltcG9ydCB7IGFjdGl2ZUZyb250bWF0dGVyLCBjdXJyZW50TW9kZSwgZnJvbnRtYXR0ZXJPZiwgaXNMaXZlUHJldmlldyB9IGZyb20gXCIuL3NyYy9tb2RlXCI7XG5pbXBvcnQgeyBOYXRpdmVTbGlkZXNTZXR0aW5nVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBERUNLX0tFWSwgREVGQVVMVF9TRVRUSU5HUywgdHlwZSBOYXRpdmVTbGlkZXNTZXR0aW5ncyB9IGZyb20gXCIuL3NyYy90eXBlc1wiO1xuaW1wb3J0IHsgY2xlYXJDaGlsZHJlbiB9IGZyb20gXCIuL3NyYy91dGlsc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBOYXRpdmVTbGlkZXNQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICAvKiogVGhlIHNsaWRlcyBiYXIgRE9NIGVsZW1lbnQgKi9cbiAgYmFyOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICAvKiogRGVjayBjaGFpbiByZXNvbHV0aW9uICsgXCJjcmVhdGUgbmV4dCBzbGlkZVwiIGdsdWUgKi9cbiAgZGVja1NlcnZpY2UhOiBEZWNrU2VydmljZTtcbiAgLyoqIFBsdWdpbiBzZXR0aW5ncyAqL1xuICBzZXR0aW5nczogTmF0aXZlU2xpZGVzU2V0dGluZ3MgPSB7IC4uLkRFRkFVTFRfU0VUVElOR1MgfTtcblxuICAvKiogV2hldGhlciBTbGlkZXMgbW9kZSBpcyBjdXJyZW50bHkgYWN0aXZlIChzZXNzaW9uIHN0YXRlLCBub3QgcGVyc2lzdGVkKSAqL1xuICBwcml2YXRlIHNsaWRlc01vZGUgPSBmYWxzZTtcbiAgLyoqIFZpZXcgbW9kZSB0byByZXN0b3JlIHdoZW4gbGVhdmluZyBTbGlkZXMgbW9kZSAoXCJwcmV2aWV3XCIgfCBcInNvdXJjZVwiKSAqL1xuICBwcml2YXRlIGV4aXRNb2RlOiBcInByZXZpZXdcIiB8IFwic291cmNlXCIgPSBcInNvdXJjZVwiO1xuICAvKiogV2hldGhlciB0aGUgZXhpdCB2aWV3IHdhcyBTb3VyY2UgbW9kZSAodHJ1ZSkgdnMgTGl2ZSBQcmV2aWV3IChmYWxzZSkgKi9cbiAgcHJpdmF0ZSBleGl0U291cmNlID0gZmFsc2U7XG4gIC8qKiBMYXN0IG5vdGUgYXV0by1lbnRlcmVkIGludG8gU2xpZGVzIG1vZGUgKHByZXZlbnRzIHJlLWVudGVyaW5nIGFmdGVyIG1hbnVhbCBleGl0KSAqL1xuICBwcml2YXRlIGF1dG9FbnRlcmVkUGF0aCA9IFwiXCI7XG4gIC8qKiBMYXN0IHJlZnJlc2gga2V5IChcInBhdGh8bW9kZVwiKSB0byBhdm9pZCBwb2ludGxlc3MgcmUtcmVuZGVycyAqL1xuICBwcml2YXRlIGxhc3RLZXkgPSBcIlwiO1xuICAvKiogTGFzdCBtZWFzdXJlZCB0YWItYmFyIGhlaWdodCAocHgpIFx1MjAxNCBjYWNoZWQgd2hpbGUgdGhlIHNsaWRlcyBiYXIgaXMgaGlkZGVuICovXG4gIHByaXZhdGUgdGFiQmFySGVpZ2h0ID0gMDtcblxuICBhc3luYyBvbmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcbiAgICB0aGlzLmRlY2tTZXJ2aWNlID0gbmV3IERlY2tTZXJ2aWNlKHRoaXMuYXBwKTtcbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IE5hdGl2ZVNsaWRlc1NldHRpbmdUYWIodGhpcykpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDEuIFJlZnJlc2ggb24gXCJjdXJyZW50IG5vdGUgLyB2aWV3IGNoYW5nZWRcIiBldmVudHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5tYXliZUF1dG9FbnRlclNsaWRlcygpO1xuICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICAgIH0pLFxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAoKSA9PiB0aGlzLnJlZnJlc2goKSkpO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJsYXlvdXQtY2hhbmdlXCIsICgpID0+IHRoaXMucmVmcmVzaCgpKSk7XG4gICAgLy8gUmVmcmVzaCB3aGVuIHRoZSBub3RlIGNvbnRlbnQgKGluY2x1ZGluZyBmcm9udG1hdHRlcikgY2hhbmdlcyAvIHNhdmVzXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5vbihcImNoYW5nZWRcIiwgKGZpbGU6IFRGaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlID09PSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpKSB0aGlzLnJlZnJlc2goKTtcbiAgICAgIH0pLFxuICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMi4gRmFsbGJhY2sgdGltZXI6IGVkaXRcdTIxOTRyZWFkaW5nIHRvZ2dsZXMgbWF5IGZpcmUgbm8gc3RhbmRhcmQgZXZlbnQgXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5yZWdpc3RlckludGVydmFsKFxuICAgICAgd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGNvbnN0IGtleSA9IGZpbGUgPyBgJHtmaWxlLnBhdGh9fCR7Y3VycmVudE1vZGUodGhpcy5hcHApfWAgOiBcIlwiO1xuICAgICAgICBpZiAoa2V5ICE9PSB0aGlzLmxhc3RLZXkpIHtcbiAgICAgICAgICB0aGlzLmxhc3RLZXkgPSBrZXk7XG4gICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgIH1cbiAgICAgIH0sIDUwMCksXG4gICAgKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCAzLiBDb21tYW5kcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICByZWdpc3RlckNvbW1hbmRzKHRoaXMpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDQuIFBpbiB0aGUgU2xpZGVzIGVkaXRvciB0byBvbmUgc2NyZWVuIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIC8vIENTUyBgb3ZlcmZsb3c6IGhpZGRlbmAgYmxvY2tzIHRoZSB3aGVlbCwgYnV0IG5hdGl2ZSBkcmFnLXNlbGVjdFxuICAgIC8vIGF1dG9zY3JvbGwgYW5kIENvZGVNaXJyb3IncyBwcm9ncmFtbWF0aWMgc2Nyb2xsSW50b1ZpZXcgc3RpbGwgbW92ZSB0aGVcbiAgICAvLyBzY3JvbGxlci4gVGhpcyBjYXB0dXJlLXBoYXNlIGxpc3RlbmVyIHJlc2V0cyBhbnkgc2Nyb2xsIGluc2lkZSB0aGVcbiAgICAvLyBhY3RpdmUgbWFya2Rvd24gdmlldyBiYWNrIHRvIHRoZSB0b3Agd2hpbGUgU2xpZGVzIG1vZGUgaXMgYWN0aXZlLlxuICAgIHRoaXMucmVnaXN0ZXJEb21FdmVudChcbiAgICAgIGRvY3VtZW50LFxuICAgICAgXCJzY3JvbGxcIixcbiAgICAgIChldnQpID0+IHtcbiAgICAgICAgaWYgKCFkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5jb250YWlucyhcIm5hdGl2ZS1zbGlkZXMtbW9kZVwiKSkgcmV0dXJuO1xuICAgICAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICAgICAgaWYgKCF2aWV3KSByZXR1cm47XG4gICAgICAgIGNvbnN0IGVsID0gZXZ0LnRhcmdldDtcbiAgICAgICAgaWYgKGVsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgJiYgdmlldy5jb250ZW50RWwuY29udGFpbnMoZWwpKSB7XG4gICAgICAgICAgaWYgKGVsLnNjcm9sbFRvcCAhPT0gMCkgZWwuc2Nyb2xsVG9wID0gMDtcbiAgICAgICAgICBpZiAoZWwuc2Nyb2xsTGVmdCAhPT0gMCkgZWwuc2Nyb2xsTGVmdCA9IDA7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7IGNhcHR1cmU6IHRydWUgfSxcbiAgICApO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDUuIENyZWF0ZSB0aGUgc2xpZGVzIGJhciBhbmQgZG8gdGhlIGZpcnN0IHJlbmRlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICB0aGlzLmJhciA9IGNyZWF0ZUJhcigpO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5iYXIpO1xuICAgIHRoaXMucmVmcmVzaCgpO1xuICB9XG5cbiAgb251bmxvYWQoKTogdm9pZCB7XG4gICAgdGhpcy5iYXI/LnJlbW92ZSgpO1xuICAgIHRoaXMuYmFyID0gbnVsbDtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoXCJuYXRpdmUtc2xpZGVzLW1vZGVcIik7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU2V0dGluZ3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU2xpZGVzIG1vZGUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLyoqIFdoZXRoZXIgdGhlIGFjdGl2ZSBub3RlIGlzIGEgZGVjayBub3RlIChoYXMgYSBgZGVja2AgcHJvcGVydHkpICovXG4gIHByaXZhdGUgaXNEZWNrTm90ZShmaWxlOiBURmlsZSB8IG51bGwpOiBib29sZWFuIHtcbiAgICBpZiAoIWZpbGUpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBmbSA9IGZyb250bWF0dGVyT2YodGhpcy5hcHAsIGZpbGUpO1xuICAgIHJldHVybiBmbSAhPT0gbnVsbCAmJiBERUNLX0tFWSBpbiBmbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5kZXIgdGhlIGNhcmQgdGl0bGUgKGFuIEgxIGluc2lkZSB0aGUgY2FyZCkgcGVyIHRoZSBgc2xpZGVzVGl0bGVgXG4gICAqIHNldHRpbmcsIHZpYSB0aGUgYC5jbS1jb250ZW50YCBkYXRhLXNsaWRlcy10aXRsZSBhdHRyaWJ1dGUgXHUyMDE0IHRoZSBDU1NcbiAgICogOjpiZWZvcmUgcHNldWRvLWVsZW1lbnQgcmVuZGVycyBpdC4gXCJcIiAoZGVmYXVsdCkgc2hvd3Mgbm90aGluZztcbiAgICogXCJmaWxlbmFtZVwiIHVzZXMgdGhlIGZpbGUgbmFtZTsgYW55IG90aGVyIHZhbHVlIG5hbWVzIGEgZnJvbnRtYXR0ZXJcbiAgICogcHJvcGVydHkuIFRoZSBmaWxlIG5hbWUgKGlubGluZSB0aXRsZSkgb3V0c2lkZSB0aGUgY2FyZCBpcyBhbHdheXMgaGlkZGVuXG4gICAqIGJ5IENTUyBpbiBTbGlkZXMgbW9kZS5cbiAgICovXG4gIHByaXZhdGUgdXBkYXRlSW5saW5lVGl0bGUoc2xpZGVzOiBib29sZWFuKTogdm9pZCB7XG4gICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgY29uc3QgY29udGVudCA9IHZpZXc/LmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcIi5jbS1jb250ZW50XCIpO1xuICAgIGlmICghY29udGVudCB8fCAhZmlsZSkgcmV0dXJuO1xuXG4gICAgbGV0IHRleHQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgIGlmIChzbGlkZXMpIHtcbiAgICAgIGNvbnN0IHNyYyA9IHRoaXMuc2V0dGluZ3Muc2xpZGVzVGl0bGUudHJpbSgpO1xuICAgICAgaWYgKHNyYyA9PT0gXCJmaWxlbmFtZVwiKSB7XG4gICAgICAgIHRleHQgPSBmaWxlLmJhc2VuYW1lO1xuICAgICAgfSBlbHNlIGlmIChzcmMpIHtcbiAgICAgICAgY29uc3QgZm0gPSBmcm9udG1hdHRlck9mKHRoaXMuYXBwLCBmaWxlKTtcbiAgICAgICAgY29uc3QgdiA9IGZtPy5bc3JjXTtcbiAgICAgICAgaWYgKHYgIT0gbnVsbCkge1xuICAgICAgICAgIHRleHQgPSB0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIiA/IHYgOiBBcnJheS5pc0FycmF5KHYpID8gdi5qb2luKFwiLCBcIikgOiBTdHJpbmcodik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGV4dCkgY29udGVudC5zZXRBdHRyaWJ1dGUoXCJkYXRhLXNsaWRlcy10aXRsZVwiLCB0ZXh0KTtcbiAgICBlbHNlIGNvbnRlbnQucmVtb3ZlQXR0cmlidXRlKFwiZGF0YS1zbGlkZXMtdGl0bGVcIik7XG4gIH1cblxuICAvKiogRW50ZXIgU2xpZGVzIG1vZGU6IHJlY29yZCB0aGUgZXhpdCBzdGF0ZSBhbmQgZm9yY2UgdGhlIExpdmUgUHJldmlldyAqL1xuICBwcml2YXRlIGFzeW5jIGVudGVyU2xpZGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICh2aWV3KSB7XG4gICAgICBjb25zdCBzdGF0ZSA9IHZpZXcuZ2V0U3RhdGUoKSBhcyB7IG1vZGU/OiBzdHJpbmc7IHNvdXJjZT86IGJvb2xlYW4gfTtcbiAgICAgIHRoaXMuZXhpdE1vZGUgPSBzdGF0ZS5tb2RlID09PSBcInByZXZpZXdcIiA/IFwicHJldmlld1wiIDogXCJzb3VyY2VcIjtcbiAgICAgIHRoaXMuZXhpdFNvdXJjZSA9IHN0YXRlLnNvdXJjZSA9PT0gdHJ1ZTtcbiAgICAgIC8vIFNsaWRlcyBtb2RlIGlzIGFsd2F5cyB0aGUgZWRpdGFibGUgTGl2ZSBQcmV2aWV3XG4gICAgICBjb25zdCBuZXh0ID0gdmlldy5sZWFmLmdldFZpZXdTdGF0ZSgpO1xuICAgICAgbmV4dC5zdGF0ZSA9IHsgLi4ubmV4dC5zdGF0ZSwgbW9kZTogXCJzb3VyY2VcIiwgc291cmNlOiBmYWxzZSB9O1xuICAgICAgYXdhaXQgdmlldy5sZWFmLnNldFZpZXdTdGF0ZShuZXh0LCB7IGZvY3VzOiBmYWxzZSB9KTtcbiAgICB9XG4gICAgdGhpcy5zbGlkZXNNb2RlID0gdHJ1ZTtcbiAgICB0aGlzLnJlZnJlc2goKTtcbiAgfVxuXG4gIC8qKiBFeGl0IFNsaWRlcyBtb2RlOiByZXN0b3JlIHRoZSB2aWV3IG1vZGUgcmVjb3JkZWQgYXQgZW50cnkgKi9cbiAgcHJpdmF0ZSBleGl0U2xpZGVzKCk6IHZvaWQge1xuICAgIHRoaXMuc2xpZGVzTW9kZSA9IGZhbHNlO1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGlmICh2aWV3KSB7XG4gICAgICBjb25zdCBzdGF0ZSA9IHZpZXcubGVhZi5nZXRWaWV3U3RhdGUoKTtcbiAgICAgIGlmICh0aGlzLmV4aXRNb2RlID09PSBcInByZXZpZXdcIikge1xuICAgICAgICBzdGF0ZS5zdGF0ZSA9IHsgLi4uc3RhdGUuc3RhdGUsIG1vZGU6IFwicHJldmlld1wiIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZS5zdGF0ZSA9IHsgLi4uc3RhdGUuc3RhdGUsIG1vZGU6IFwic291cmNlXCIsIHNvdXJjZTogdGhpcy5leGl0U291cmNlIH07XG4gICAgICB9XG4gICAgICB2b2lkIHZpZXcubGVhZi5zZXRWaWV3U3RhdGUoc3RhdGUsIHsgZm9jdXM6IGZhbHNlIH0pO1xuICAgIH1cbiAgICB0aGlzLnJlZnJlc2goKTtcbiAgfVxuXG4gIC8qKiBUb2dnbGUgU2xpZGVzIG1vZGUgKGRlY2sgbm90ZXMgb25seSBcdTIwMTQgZW5mb3JjZWQgYnkgdGhlIGNvbW1hbmQpICovXG4gIHRvZ2dsZVNsaWRlcygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zbGlkZXNNb2RlKSB0aGlzLmV4aXRTbGlkZXMoKTtcbiAgICBlbHNlIHZvaWQgdGhpcy5lbnRlclNsaWRlcygpO1xuICB9XG5cbiAgLyoqIEF1dG8tZW50ZXIgU2xpZGVzIG1vZGUgb25jZSBwZXIgb3BlbmVkIGRlY2sgbm90ZSB3aGVuIHRoZSBzZXR0aW5nIGlzIG9uICovXG4gIHByaXZhdGUgbWF5YmVBdXRvRW50ZXJTbGlkZXMoKTogdm9pZCB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgaWYgKCFmaWxlIHx8IGZpbGUucGF0aCA9PT0gdGhpcy5hdXRvRW50ZXJlZFBhdGgpIHJldHVybjtcbiAgICB0aGlzLmF1dG9FbnRlcmVkUGF0aCA9IGZpbGUucGF0aDtcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5hdXRvRW50ZXJTbGlkZXMgJiYgdGhpcy5pc0RlY2tOb3RlKGZpbGUpICYmICF0aGlzLnNsaWRlc01vZGUpIHtcbiAgICAgIHZvaWQgdGhpcy5lbnRlclNsaWRlcygpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBQUFQgbmF2aWdhdGlvbiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICAvKiogTW92ZSBvbmUgc3RlcCBiYWNrL2ZvcndhcmQgYWxvbmcgdGhlIGRlY2sgY2hhaW4gKGVudGVyaW5nIFNsaWRlcyBtb2RlIGFzIG5lZWRlZCkgKi9cbiAgYXN5bmMgbmF2aWdhdGUoZGlyZWN0aW9uOiBcInByZXZcIiB8IFwibmV4dFwiKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgaWYgKCFmaWxlKSByZXR1cm47XG4gICAgY29uc3QgZGVjayA9IHRoaXMuZGVja1NlcnZpY2UuY29tcHV0ZShmaWxlKTtcbiAgICBpZiAoIWRlY2spIHJldHVybjtcbiAgICBjb25zdCB0YXJnZXQgPSBkZWNrLmNoYWluW2RpcmVjdGlvbiA9PT0gXCJwcmV2XCIgPyBkZWNrLmluZGV4IC0gMSA6IGRlY2suaW5kZXggKyAxXTtcbiAgICBpZiAoIXRhcmdldCkgcmV0dXJuO1xuICAgIGlmICghdGhpcy5zbGlkZXNNb2RlKSBhd2FpdCB0aGlzLmVudGVyU2xpZGVzKCk7XG4gICAgdm9pZCB0aGlzLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KHRhcmdldCwgZmlsZS5wYXRoKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBCYXIgcmVuZGVyaW5nIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBEZWNpZGUgd2hhdCB0aGUgc2xpZGVzIGJhciBzaG93cywgdGhlbiByZS1yZW5kZXIgaXQgKi9cbiAgcmVmcmVzaCgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuYmFyKSByZXR1cm47XG5cbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICBjb25zdCBtb2RlID0gY3VycmVudE1vZGUodGhpcy5hcHApO1xuICAgIGNvbnN0IGlzQ2FyZCA9IHRoaXMuaXNEZWNrTm90ZShmaWxlKTtcbiAgICBjb25zdCBsaXZlUHJldmlld05vdyA9IG1vZGUgPT09IFwic291cmNlXCIgJiYgaXNMaXZlUHJldmlldyh0aGlzLmFwcCk7XG5cbiAgICAvLyBMZWF2aW5nIGEgZGVjayBub3RlLCBvciBsZWF2aW5nIHRoZSBMaXZlIFByZXZpZXcgKGUuZy4gQ21kL0N0cmwrRSB0b1xuICAgIC8vIHJlYWRpbmcgdmlldyksIGVuZHMgU2xpZGVzIG1vZGUgXHUyMDE0IG9ubHkgdGhlIHRvZ2dsZSBjb21tYW5kIHJlLWVudGVycyBpdC5cbiAgICBpZiAodGhpcy5zbGlkZXNNb2RlICYmICghaXNDYXJkIHx8ICFsaXZlUHJldmlld05vdykpIHtcbiAgICAgIHRoaXMuc2xpZGVzTW9kZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIE1lYXN1cmUgdGhlIHRhYiBiYXIgd2hpbGUgaXQgaXMgc3RpbGwgdmlzaWJsZSAoU2xpZGVzIG1vZGUgaGlkZXMgaXRcbiAgICAvLyBiZWxvdzsgdGhlIGxhc3QgbWVhc3VyZWQgdmFsdWUgaXMgcmV1c2VkIG9uY2UgaGlkZGVuKS5cbiAgICB0aGlzLnRhYkJhckhlaWdodCA9IHN5bmNUYWJCYXJIZWlnaHQodGhpcy50YWJCYXJIZWlnaHQpO1xuXG4gICAgLy8gU2xpZGVzIG1vZGUgaXMgYWN0aXZlIG9ubHkgd2hpbGUgYWN0dWFsbHkgaW4gdGhlIGVkaXRhYmxlIExpdmUgUHJldmlld1xuICAgIGNvbnN0IHNsaWRlcyA9IHRoaXMuc2xpZGVzTW9kZSAmJiBpc0NhcmQgJiYgbGl2ZVByZXZpZXdOb3c7XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QudG9nZ2xlKFwibmF0aXZlLXNsaWRlcy1tb2RlXCIsIHNsaWRlcyk7XG4gICAgdGhpcy51cGRhdGVJbmxpbmVUaXRsZShzbGlkZXMpO1xuXG4gICAgY29uc3QgYmFyVmlzaWJsZSA9IHNsaWRlcyAmJiAhdGhpcy5zZXR0aW5ncy5iYXJIaWRkZW47XG4gICAgaWYgKCFiYXJWaXNpYmxlKSB7XG4gICAgICB0aGlzLmJhci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghZmlsZSkgcmV0dXJuOyAvLyBiYXJWaXNpYmxlIGltcGxpZXMgYSBmaWxlLCBidXQgbmFycm93IGZvciBUeXBlU2NyaXB0XG5cbiAgICBjb25zdCBmbSA9IGFjdGl2ZUZyb250bWF0dGVyKHRoaXMuYXBwKTtcbiAgICBjb25zdCBkZWNrID0gdGhpcy5kZWNrU2VydmljZS5jb21wdXRlKGZpbGUpO1xuICAgIGNsZWFyQ2hpbGRyZW4odGhpcy5iYXIpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIExlZnQ6IHByZXZpb3VzIC8gbmV4dCBidXR0b25zIChib3RoIGFsd2F5cyBzaG93biBpbnNpZGUgYSBkZWNrO1xuICAgIC8vICAgICAgICB0aGUgb25lIHRoYXQgY2Fubm90IG1vdmUgaXMgZGlzYWJsZWQgLyBsaWdodCBncmF5KSBcdTI1MDBcdTI1MDBcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5zaG93TmF2QnV0dG9ucyAmJiBkZWNrKSB7XG4gICAgICBjb25zdCBoYXNQcmV2ID0gZGVjay5pbmRleCA+IDA7XG4gICAgICBjb25zdCBoYXNOZXh0ID0gZGVjay5pbmRleCA8IGRlY2suY2hhaW4ubGVuZ3RoIC0gMTtcbiAgICAgIGNvbnN0IG5hdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBuYXYuY2xhc3NOYW1lID0gXCJuYXRpdmUtc2xpZGVzLW5hdlwiO1xuICAgICAgbmF2LmFwcGVuZENoaWxkKG5hdkJ1dHRvbihcIlx1MjVDMFwiLCBcIlByZXZpb3VzIHBhZ2VcIiwgKCkgPT4gdGhpcy5uYXZpZ2F0ZShcInByZXZcIiksICFoYXNQcmV2KSk7XG4gICAgICBuYXYuYXBwZW5kQ2hpbGQobmF2QnV0dG9uKFwiXHUyNUI2XCIsIFwiTmV4dCBwYWdlXCIsICgpID0+IHRoaXMubmF2aWdhdGUoXCJuZXh0XCIpLCAhaGFzTmV4dCkpO1xuICAgICAgdGhpcy5iYXIuYXBwZW5kQ2hpbGQobmF2KTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTWlkZGxlOiBjaGlwcyBmb3IgdGhlIHJlbWFpbmluZyBwcm9wZXJ0aWVzIChubyBwbGFjZWhvbGRlcikgXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgdmlzaWJsZSA9IGZtXG4gICAgICA/IE9iamVjdC5lbnRyaWVzKGZtKS5maWx0ZXIoKFtrZXldKSA9PiBrZXkgIT09IERFQ0tfS0VZICYmIGtleSAhPT0gXCJwb3NpdGlvblwiKVxuICAgICAgOiBbXTtcblxuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIHZpc2libGUpIHtcbiAgICAgIGNvbnN0IHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgIHNwYW4uY2xhc3NOYW1lID0gXCJuYXRpdmUtc2xpZGVzLWl0ZW1cIjtcbiAgICAgIGNvbnN0IGsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3Ryb25nXCIpO1xuICAgICAgay50ZXh0Q29udGVudCA9IGtleTtcbiAgICAgIHNwYW4uYXBwZW5kQ2hpbGQoayk7XG4gICAgICBzcGFuLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiOiBcIiArIGZvcm1hdFZhbHVlKHZhbHVlKSkpO1xuICAgICAgdGhpcy5iYXIuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgfVxuXG4gICAgLy8gQnJva2VuIGRlY2sgbGlua3MgXHUyMTkyIHdhcm5pbmcgY2hpcCBzbyBkZWNrIGF1dGhvcnMgc3BvdCB0eXBvc1xuICAgIGNvbnN0IGJyb2tlbiA9IGZpbGUgPyB0aGlzLmRlY2tTZXJ2aWNlLmJyb2tlbihmaWxlKSA6IFtdO1xuICAgIGlmIChicm9rZW4ubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3Qgd2FybiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgd2Fybi5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtd2FyblwiO1xuICAgICAgd2Fybi50ZXh0Q29udGVudCA9IFwiXHUyNkEwIFwiICsgYnJva2VuLmpvaW4oXCIsIFwiKTtcbiAgICAgIHdhcm4udGl0bGUgPSBcIkJyb2tlbiBkZWNrIGxpbmsocykgXHUyMDE0IHRoZSB0YXJnZXQgbm90ZSBkb2VzIG5vdCBleGlzdFwiO1xuICAgICAgdGhpcy5iYXIuYXBwZW5kQ2hpbGQod2Fybik7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEJvdHRvbS1yaWdodDogYXV0by1jb21wdXRlZCBwYWdlIG51bWJlciBcdTI1MDBcdTI1MDBcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5zaG93UGFnZU51bWJlciAmJiBkZWNrKSB7XG4gICAgICBjb25zdCBwYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICBwYWdlLmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy1wYWdlXCI7XG4gICAgICAvLyBjaGFpblswXSBpcyB0aGUgb3ZlcnZpZXcgbm90ZTsgc2xpZGVzIHN0YXJ0IGF0IGluZGV4IDEgXHUyMTkyIFwiUGFnZSAxXCJcbiAgICAgIHBhZ2UudGV4dENvbnRlbnQgPSBkZWNrLmluZGV4ID09PSAwID8gXCJPdmVydmlld1wiIDogYFBhZ2UgJHtkZWNrLmluZGV4fWA7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChwYWdlKTtcbiAgICB9XG5cbiAgICAvLyBIaWRlIHRoZSBzbGlkZXMgYmFyIGVudGlyZWx5IHdoZW4gaXQgaGFzIG5vdGhpbmcgdG8gZGlzcGxheSAobm8gcHJvcGVydGllcyxcbiAgICAvLyBhbmQgbm90IHBhcnQgb2YgYSBkZWNrKVxuICAgIHRoaXMuYmFyLnN0eWxlLmRpc3BsYXkgPSB0aGlzLmJhci5jaGlsZEVsZW1lbnRDb3VudCA9PT0gMCA/IFwibm9uZVwiIDogXCJcIjtcbiAgfVxufVxuIiwgIi8qKiBDcmVhdGUgdGhlIHNsaWRlcyBiYXIgRE9NIGVsZW1lbnQgKGhpZGRlbiB1bnRpbCByZWZyZXNoKCkgc2hvd3MgaXQpICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQmFyKCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgYmFyLmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy1iYXJcIjtcbiAgYmFyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgcmV0dXJuIGJhcjtcbn1cblxuLyoqIEJ1aWxkIGEgXHUyNUMwIC8gXHUyNUI2IG5hdmlnYXRpb24gYnV0dG9uOyBgZGlzYWJsZWRgIHJlbmRlcnMgaXQgbGlnaHQgZ3JheS9pbmFjdGl2ZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdkJ1dHRvbihcbiAgbGFiZWw6IHN0cmluZyxcbiAgdGlwOiBzdHJpbmcsXG4gIG9uQ2xpY2s6ICgpID0+IHZvaWQsXG4gIGRpc2FibGVkID0gZmFsc2UsXG4pOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIGJ0bi5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtbmF2LWJ0blwiO1xuICBidG4udGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgYnRuLnRpdGxlID0gdGlwO1xuICBidG4uZGlzYWJsZWQgPSBkaXNhYmxlZDtcbiAgaWYgKCFkaXNhYmxlZCkgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvbkNsaWNrKTtcbiAgcmV0dXJuIGJ0bjtcbn1cblxuLyoqXG4gKiBNZWFzdXJlIHRoZSB0b3AgdGFiIGJhciBhbmQgZXhwb3NlIGl0cyBoZWlnaHQgYXMgdGhlIENTUyB2YXJpYWJsZVxuICogLS1uYXRpdmUtc2xpZGVzLXRhYmJhci1oZWlnaHQsIHJldHVybmluZyB0aGUgKHBvc3NpYmx5IHVwZGF0ZWQpIGNhY2hlZFxuICogdmFsdWUuIFRoZSBzbGlkZXMgYmFyIGlzIGhpZGRlbiBpbiBTbGlkZXMgbW9kZSwgc28gdGhlIGxhc3QgbWVhc3VyZWRcbiAqIHZhbHVlIGlzIHJldXNlZCB0aGVyZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN5bmNUYWJCYXJIZWlnaHQoY2FjaGVkOiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCB0YWJCYXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcbiAgICBcIi53b3Jrc3BhY2UtdGFicy5tb2QtdG9wIC53b3Jrc3BhY2UtdGFiLWhlYWRlci1jb250YWluZXJcIixcbiAgKTtcbiAgaWYgKHRhYkJhciAmJiB0YWJCYXIub2Zmc2V0SGVpZ2h0ID4gMCkgY2FjaGVkID0gdGFiQmFyLm9mZnNldEhlaWdodDtcbiAgaWYgKGNhY2hlZCA+IDApIHtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoXCItLW5hdGl2ZS1zbGlkZXMtdGFiYmFyLWhlaWdodFwiLCBgJHtjYWNoZWR9cHhgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBObyBtZWFzdXJlbWVudCB5ZXQgKHRhYiBiYXIgaGlkZGVuIHNpbmNlIGxvYWQpIFx1MjAxNCBsZXQgdGhlIENTUyBmYWxsYmFjayBhcHBseS5cbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUucmVtb3ZlUHJvcGVydHkoXCItLW5hdGl2ZS1zbGlkZXMtdGFiYmFyLWhlaWdodFwiKTtcbiAgfVxuICByZXR1cm4gY2FjaGVkO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTWFya2Rvd25WaWV3LCBOb3RpY2UsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSBOYXRpdmVTbGlkZXNQbHVnaW4gZnJvbSBcIi4uL21haW5cIjtcbmltcG9ydCB7IGlzTGl2ZVByZXZpZXcgfSBmcm9tIFwiLi9tb2RlXCI7XG5cbi8qKlxuICogVHlwb2dyYXBoeS1tZWFzdXJlbWVudCB0b29saW5nIChkZXYgYnVpbGRzIG9ubHkpLlxuICpcbiAqIFRoZSBgbnMtZGVidWctc3R5bGVzYCBjb21tYW5kIHNhbXBsZXMgdGhlIGZpeGVkIG9uZS1wYWdlIHNhbXBsZSBub3RlcyBpblxuICogZWRpdCAoTGl2ZSBQcmV2aWV3KSBhbmQgdGhlIGtpdGNoZW4tc2luayBub3RlIGluIHJlYWRpbmcgdmlldywgbWVyZ2VzIHRoZVxuICogcmVzdWx0cywgY29tcHV0ZXMgYW4gZWRpdC12cy1yZWFkaW5nIGRpZmYgYW5kIHdyaXRlcyBpdCB0b1xuICogLm5hdGl2ZS1zbGlkZXMtZGVidWcuanNvbiBpbiB0aGUgdmF1bHQgcm9vdC4gUmVnaXN0ZXJlZCBvbmx5IHdoZW4gdGhlXG4gKiBidWlsZC10aW1lIERFVl9NT0RFIGZsYWcgaXMgdHJ1ZTsgcmVsZWFzZSBidWlsZHMgdHJlZS1zaGFrZSB0aGlzIG1vZHVsZSBvdXQuXG4gKi9cblxuLyoqIEZpeGVkIG9uZS1wYWdlIHNhbXBsZSBub3RlcyB1c2VkIGJ5IHRoZSBkZWJ1ZyBjb21tYW5kIChlZGl0IHNpZGUpICovXG5leHBvcnQgY29uc3QgU0FNUExFX05PVEVfTkFNRVMgPSBbXG4gIFwidHlwb2dyYXBoeS1zYW1wbGUtaGVhZGluZ3NcIixcbiAgXCJ0eXBvZ3JhcGh5LXNhbXBsZS1saXN0XCIsXG4gIFwidHlwb2dyYXBoeS1zYW1wbGUtY29kZVwiLFxuICBcInR5cG9ncmFwaHktc2FtcGxlLXF1b3RlXCIsXG4gIFwidHlwb2dyYXBoeS1zYW1wbGUtbWVkaWFcIixcbl07XG5cbi8qKiBTdHlsZSBzZWN0aW9ucyBzYW1wbGVkIGJ5IHNhbXBsZVN0eWxlcygpIGFuZCBjb21wYXJlZCBieSBkaWZmRHVtcHMoKSAqL1xuY29uc3QgU1RZTEVfU0VDVElPTlMgPSBbXG4gIFwiY29udGFpbmVyXCIsXG4gIFwicGFyYWdyYXBoXCIsXG4gIFwiaDFcIixcbiAgXCJsaXN0SXRlbVwiLFxuICBcImNvZGVCbG9ja1wiLFxuICBcImJsb2NrcXVvdGVcIixcbiAgXCJpbmxpbmVDb2RlXCIsXG4gIFwidGFibGVcIixcbiAgXCJpbWFnZVwiLFxuICBcImhvcml6b250YWxSdWxlXCIsXG5dO1xuXG4vKiogUHJvbWlzZS1iYXNlZCBzbGVlcCAqL1xuZnVuY3Rpb24gc2xlZXAobXM6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbn1cblxuLyoqXG4gKiBNZXJnZSBub24tbWlzc2luZyBzdHlsZSBzZWN0aW9ucyBvZiBhIGZyZXNoIHNhbXBsZSBpbnRvIHRoZSB0YXJnZXRcbiAqIChmaXJzdCBub24tbWlzc2luZyB2YWx1ZSB3aW5zKS5cbiAqL1xuZnVuY3Rpb24gbWVyZ2VTYW1wbGUodGFyZ2V0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgc2FtcGxlOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQge1xuICBmb3IgKGNvbnN0IGtleSBvZiBTVFlMRV9TRUNUSU9OUykge1xuICAgIGNvbnN0IHNlY3Rpb24gPSBzYW1wbGVba2V5XSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgdW5kZWZpbmVkO1xuICAgIGlmICghc2VjdGlvbiB8fCBcIihtaXNzaW5nKVwiIGluIHNlY3Rpb24pIGNvbnRpbnVlO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGFyZ2V0W2tleV0gYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IHVuZGVmaW5lZDtcbiAgICBpZiAoZXhpc3RpbmcgJiYgIShcIihtaXNzaW5nKVwiIGluIGV4aXN0aW5nKSkgY29udGludWU7XG4gICAgdGFyZ2V0W2tleV0gPSBzZWN0aW9uO1xuICB9XG4gIC8vIFByb2JlIGZpZWxkcyByaWRlIGFsb25nIChmaXJzdCBub24tZW1wdHkgd2lucylcbiAgZm9yIChjb25zdCBrZXkgb2YgW1xuICAgIFwibGlzdExpbmVzXCIsXG4gICAgXCJtZXRhZGF0YUNvbnRhaW5lckRpc3BsYXlcIixcbiAgICBcImgxT2Zmc2V0VG9wXCIsXG4gICAgXCJoMVRvcEluQ29udGVudFwiLFxuICAgIFwiaDFMZWZ0SW5Db250ZW50XCIsXG4gICAgXCJjb250ZW50Q2hpbGRyZW5cIixcbiAgICBcInRvcENoYWluXCIsXG4gIF0pIHtcbiAgICBjb25zdCBwcm9iZSA9IHNhbXBsZVtrZXldO1xuICAgIGlmIChwcm9iZSA9PT0gdW5kZWZpbmVkIHx8IHByb2JlID09PSBudWxsKSBjb250aW51ZTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShwcm9iZSkgJiYgcHJvYmUubGVuZ3RoID09PSAwKSBjb250aW51ZTtcbiAgICBpZiAodHlwZW9mIHByb2JlID09PSBcIm9iamVjdFwiICYmICFBcnJheS5pc0FycmF5KHByb2JlKSAmJiBPYmplY3Qua2V5cyhwcm9iZSkubGVuZ3RoID09PSAwKVxuICAgICAgY29udGludWU7XG4gICAgaWYgKHRhcmdldFtrZXldID09PSB1bmRlZmluZWQpIHRhcmdldFtrZXldID0gcHJvYmU7XG4gIH1cbn1cblxuLyoqXG4gKiBDb21wYXJlIHRoZSBzdHlsZSBzZWN0aW9ucyBvZiBhbiBlZGl0IGR1bXAgYW5kIGEgcmVhZGluZyBkdW1wOyBvbmx5XG4gKiBrZXlzIHdob3NlIHZhbHVlcyBkaWZmZXIgYXJlIGtlcHQsIGFzIHsga2V5OiB7IGVkaXQsIHJlYWRpbmcgfSB9LlxuICovXG5mdW5jdGlvbiBkaWZmRHVtcHMoXG4gIGVkaXQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICByZWFkaW5nOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuICBmb3IgKGNvbnN0IHNlY3Rpb24gb2YgU1RZTEVfU0VDVElPTlMpIHtcbiAgICBjb25zdCBlID0gKGVkaXRbc2VjdGlvbl0gPz8ge30pIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gICAgY29uc3QgciA9IChyZWFkaW5nW3NlY3Rpb25dID8/IHt9KSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICAgIGNvbnN0IGtleXMgPSBuZXcgU2V0KFsuLi5PYmplY3Qua2V5cyhlKSwgLi4uT2JqZWN0LmtleXMocildKTtcbiAgICBjb25zdCBkaWZmczogUmVjb3JkPHN0cmluZywgeyBlZGl0OiBzdHJpbmc7IHJlYWRpbmc6IHN0cmluZyB9PiA9IHt9O1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICAgIGlmIChlW2tleV0gIT09IHJba2V5XSkge1xuICAgICAgICBkaWZmc1trZXldID0geyBlZGl0OiBlW2tleV0gPz8gXCIobWlzc2luZylcIiwgcmVhZGluZzogcltrZXldID8/IFwiKG1pc3NpbmcpXCIgfTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKE9iamVjdC5rZXlzKGRpZmZzKS5sZW5ndGggPiAwKSBvdXRbc2VjdGlvbl0gPSBkaWZmcztcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG4vKiogU2FtcGxlIHRoZSBjdXJyZW50IHZpZXcncyB0eXBvZ3JhcGh5IGNvbXB1dGVkIHN0eWxlcyArIENTUyB2YXJpYWJsZXMgKi9cbmZ1bmN0aW9uIHNhbXBsZVN0eWxlcyhhcHA6IEFwcCk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCB7XG4gIGNvbnN0IHZpZXcgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgaWYgKCF2aWV3KSByZXR1cm4gbnVsbDtcbiAgY29uc3QgaXNFZGl0ID0gdmlldy5nZXRNb2RlKCkgPT09IFwic291cmNlXCI7XG4gIGNvbnN0IGNvbnRlbnRFbCA9IHZpZXcuY29udGVudEVsO1xuICAvLyBGaXJzdCBtYXRjaGluZyBjYW5kaWRhdGUgd2lucyBcdTIwMTQgZWRpdCAoY202KSBhbmQgcmVhZGluZyB1c2VcbiAgLy8gZGlmZmVyZW50IGVsZW1lbnQgc3RydWN0dXJlcyAoZS5nLiBubyBwcmUvYmxvY2txdW90ZSBpbiBjbTYpLlxuICBjb25zdCBwaWNrID0gKHNlbHM6IHN0cmluZ1tdKTogSFRNTEVsZW1lbnQgfCBudWxsID0+IHtcbiAgICBmb3IgKGNvbnN0IHNlbCBvZiBzZWxzKSB7XG4gICAgICBjb25zdCBlbCA9IGNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihzZWwpO1xuICAgICAgaWYgKGVsKSByZXR1cm4gZWw7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9O1xuICBjb25zdCBzdHlsZSA9IChlbDogSFRNTEVsZW1lbnQgfCBudWxsLCBwcm9wczogc3RyaW5nW10pOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0+IHtcbiAgICBpZiAoIWVsKSByZXR1cm4geyBcIihtaXNzaW5nKVwiOiBcImVsZW1lbnQgbm90IGluIHRoaXMgbm90ZVwiIH07XG4gICAgY29uc3QgY3MgPSBnZXRDb21wdXRlZFN0eWxlKGVsKTtcbiAgICBjb25zdCBvdXQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IHAgb2YgcHJvcHMpIHtcbiAgICAgIGNvbnN0IHYgPSBjcy5nZXRQcm9wZXJ0eVZhbHVlKHApLnRyaW0oKTtcbiAgICAgIGlmICh2KSBvdXRbcF0gPSB2O1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9O1xuICBjb25zdCB2YXJzID0gZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5ib2R5KTtcbiAgY29uc3QgY3NzVmFyID0gKG5hbWU6IHN0cmluZyk6IHN0cmluZyA9PiB2YXJzLmdldFByb3BlcnR5VmFsdWUobmFtZSkudHJpbSgpO1xuXG4gIGNvbnN0IGNvbnRhaW5lciA9IHBpY2soW1xuICAgIGlzRWRpdFxuICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IC5jbS1jb250ZW50XCJcbiAgICAgIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXdcIixcbiAgXSk7XG4gIGNvbnN0IHBhcmEgPSBwaWNrKFtcbiAgICBpc0VkaXRcbiAgICAgID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuY20tbGluZTpub3QoLkh5cGVyTUQtaGVhZGVyKVwiXG4gICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IHBcIixcbiAgXSk7XG4gIGNvbnN0IGgxID0gcGljayhbXG4gICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuY20taGVhZGVyLTFcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyBoMVwiLFxuICAgIGlzRWRpdFxuICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IGgxXCJcbiAgICAgIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgaDFcIixcbiAgXSk7XG4gIGNvbnN0IGxpc3RJdGVtID0gcGljayhbXG4gICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuSHlwZXJNRC1saXN0LWxpbmVcIiA6IFwiLm1hcmtkb3duLXByZXZpZXctdmlldyB1bCA+IGxpXCIsXG4gICAgaXNFZGl0ID8gXCIuSHlwZXJNRC1saXN0LWxpbmVcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IHVsID4gbGlcIixcbiAgXSk7XG4gIGNvbnN0IHByZSA9IHBpY2soW1xuICAgIGlzRWRpdFxuICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IHByZVwiXG4gICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IHByZVwiLFxuICAgIGlzRWRpdCA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLmNtLWVkaXRpbmcgcHJlXCIgOiBcIi5tYXJrZG93bi1wcmV2aWV3LXZpZXcgcHJlXCIsXG4gICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuSHlwZXJNRC1jb2RlYmxvY2tcIiA6IFwiLm1hcmtkb3duLXByZXZpZXctdmlldyBwcmVcIixcbiAgXSk7XG4gIGNvbnN0IHF1b3RlID0gcGljayhbXG4gICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiBibG9ja3F1b3RlXCIgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgYmxvY2txdW90ZVwiLFxuICAgIGlzRWRpdFxuICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IC5IeXBlck1ELXF1b3RlXCJcbiAgICAgIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgYmxvY2txdW90ZVwiLFxuICBdKTtcbiAgY29uc3QgaW5saW5lQ29kZSA9IHBpY2soW1xuICAgIGlzRWRpdCA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgY29kZVwiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IGNvZGVcIixcbiAgICBpc0VkaXRcbiAgICAgID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuY20taW5saW5lLWNvZGVcIlxuICAgICAgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlldyBjb2RlXCIsXG4gIF0pO1xuICBjb25zdCB0YWJsZSA9IHBpY2soW1xuICAgIGlzRWRpdCA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgdGFibGVcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyB0YWJsZVwiLFxuICAgIGlzRWRpdCA/IFwiLmNtLWxpbmUgdGFibGVcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IHRhYmxlXCIsXG4gIF0pO1xuICBjb25zdCBpbWcgPSBwaWNrKFtcbiAgICBpc0VkaXQgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IGltZ1wiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IGltZ1wiLFxuICAgIGlzRWRpdCA/IFwiLmNtLWxpbmUgaW1nXCIgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlldyBpbWdcIixcbiAgICBcImltZ1wiLCAvLyB3aG9sZS1kb2N1bWVudCBmYWxsYmFja1xuICBdKTtcbiAgY29uc3QgaHIgPSBwaWNrKFtcbiAgICBpc0VkaXQgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IGhyXCIgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgaHJcIixcbiAgICBpc0VkaXQgPyBcIi5jbS1saW5lIGhyXCIgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlldyBoclwiLFxuICAgIGlzRWRpdCA/IFwiLmNtLWhyXCIgOiBcIi5tYXJrZG93bi1wcmV2aWV3LXZpZXcgaHJcIixcbiAgXSk7XG5cbiAgLy8gU3RydWN0dXJlIHByb2JlcyAoZWRpdCB2aWV3IG9ubHkpOiB0aGUgc291cmNlLXZpZXcgY2xhc3MgbGlzdFxuICAvLyAoY29uZmlybXMgdGhlIExpdmUgUHJldmlldyBtYXJrZXIgY2xhc3MpIGFuZCB1bmlxdWUgZWxlbWVudCB0YWdzXG4gIC8vIGluc2lkZSB0aGUgZWRpdG9yIChyZXZlYWxzIGhvdyBjbTYgcmVuZGVycyBjb2RlIGJsb2NrcyBldGMuIHdoZW5cbiAgLy8gdGhlIHVzdWFsIHNlbGVjdG9ycyBkbyBub3QgbWF0Y2gpLlxuICBjb25zdCBzb3VyY2VWaWV3Q2xhc3MgPSBjb250ZW50RWwucXVlcnlTZWxlY3RvcihcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202XCIpPy5jbGFzc05hbWUgPz8gXCJcIjtcbiAgY29uc3QgZG9tVGFnczogc3RyaW5nW10gPSBbXTtcbiAgaWYgKGlzRWRpdCkge1xuICAgIGNvbnN0IHRhZ3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb250ZW50RWxcbiAgICAgIC5xdWVyeVNlbGVjdG9yQWxsKFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgKlwiKVxuICAgICAgLmZvckVhY2goKGVsKSA9PiB0YWdzLmFkZChlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCkpKTtcbiAgICBkb21UYWdzLnB1c2goLi4udGFncyk7XG4gIH1cbiAgLy8gTGlzdC1saW5lIHByb2JlIChlZGl0IHZpZXcgb25seSk6IGNsYXNzIG5hbWVzICsgY29tcHV0ZWQgcGFkZGluZ1xuICAvLyBvZiB0aGUgZmlyc3QgbGlzdCBsaW5lcyBcdTIwMTQgbmVzdGVkIGxldmVscyBvZnRlbiB1c2UgZGlzdGluY3RcbiAgLy8gY2xhc3NlcyBvciBpbmxpbmUgcGFkZGluZ3MsIHdoaWNoIGRlY2lkZXMgd2hldGhlciBhIGxldmVsLWF3YXJlXG4gIC8vIGluZGVudCBvdmVycmlkZSBpcyBldmVuIHBvc3NpYmxlLlxuICBjb25zdCBsaXN0TGluZXM6IHsgY2xhc3NOYW1lOiBzdHJpbmc7IHBhZGRpbmdMZWZ0OiBzdHJpbmcgfVtdID0gW107XG4gIGlmIChpc0VkaXQpIHtcbiAgICBjb250ZW50RWwucXVlcnlTZWxlY3RvckFsbChcIi5IeXBlck1ELWxpc3QtbGluZVwiKS5mb3JFYWNoKChlbCwgaSkgPT4ge1xuICAgICAgaWYgKGkgPj0gNCkgcmV0dXJuO1xuICAgICAgY29uc3QgY3MgPSBnZXRDb21wdXRlZFN0eWxlKGVsKTtcbiAgICAgIGxpc3RMaW5lcy5wdXNoKHtcbiAgICAgICAgY2xhc3NOYW1lOiBlbC5jbGFzc05hbWUsXG4gICAgICAgIHBhZGRpbmdMZWZ0OiBjcy5nZXRQcm9wZXJ0eVZhbHVlKFwicGFkZGluZy1sZWZ0XCIpLnRyaW0oKSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIC8vIEZyb250bWF0dGVyIHByb2JlczogZG9lcyB0aGUgKGhpZGRlbikgcHJvcGVydGllcyBhcmVhIHN0aWxsXG4gIC8vIG9jY3VweSBzcGFjZSBpbiBMaXZlIFByZXZpZXc/IEFuZCBob3cgZmFyIGlzIHRoZSBIMSBmcm9tIHRoZVxuICAvLyB0b3Agb2YgdGhlIGNvbnRlbnQgYXJlYT8gKHJlYWRpbmcgbW9kZSBoYXMgbm8gc3VjaCBwYWRkaW5nKVxuICBjb25zdCBtZXRhZGF0YURpc3BsYXkgPSAoKCkgPT4ge1xuICAgIGNvbnN0IHNlbCA9IGlzRWRpdFxuICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2UtdmlldyAubWV0YWRhdGEtY29udGFpbmVyXCJcbiAgICAgIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tZXRhZGF0YS1jb250YWluZXJcIjtcbiAgICBjb25zdCBlbCA9IGNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihzZWwpO1xuICAgIHJldHVybiBlbCA/IGdldENvbXB1dGVkU3R5bGUoZWwpLmRpc3BsYXkgOiBcIihub3QgaW4gRE9NKVwiO1xuICB9KSgpO1xuICBjb25zdCBoMU9mZnNldFRvcCA9ICgoKSA9PiB7XG4gICAgaWYgKCFoMSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBsZXQgdG9wID0gMDtcbiAgICBsZXQgbm9kZTogSFRNTEVsZW1lbnQgfCBudWxsID0gaDE7XG4gICAgd2hpbGUgKG5vZGUgJiYgbm9kZSAhPT0gY29udGVudEVsICYmIG5vZGUgIT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgIHRvcCArPSBub2RlLm9mZnNldFRvcDtcbiAgICAgIG5vZGUgPSBub2RlLm9mZnNldFBhcmVudCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgfVxuICAgIHJldHVybiB0b3A7XG4gIH0pKCk7XG4gIC8vIFdoYXQgb2NjdXBpZXMgdGhlIHNwYWNlIGJldHdlZW4gdGhlIGNvbnRlbnQgdG9wIGFuZCB0aGUgSDE/XG4gIC8vIChlZGl0KSBmaXJzdCBjaGlsZHJlbiBvZiAuY20tY29udGVudCwgYW5kIHRoZSBuZXQgSDEgZGlzdGFuY2VcbiAgLy8gZnJvbSB0aGUgY29udGVudCBhbmNob3IgXHUyMDE0IHJlYWRpbmcgaGFzIG5vIHN1Y2ggZ2FwLlxuICBjb25zdCBhbmNob3IgPSBpc0VkaXRcbiAgICA/IGNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcIi5jbS1jb250ZW50XCIpXG4gICAgOiBjb250ZW50RWwucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXdcIik7XG4gIGNvbnN0IGgxVG9wSW5Db250ZW50ID0gKCgpID0+IHtcbiAgICBpZiAoIWgxIHx8ICFhbmNob3IpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoaDEuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wIC0gYW5jaG9yLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCk7XG4gIH0pKCk7XG4gIGNvbnN0IGgxTGVmdEluQ29udGVudCA9ICgoKSA9PiB7XG4gICAgaWYgKCFoMSB8fCAhYW5jaG9yKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIHJldHVybiBNYXRoLnJvdW5kKGgxLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgLSBhbmNob3IuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCk7XG4gIH0pKCk7XG4gIGNvbnN0IGNvbnRlbnRDaGlsZHJlbiA9ICgoKSA9PiB7XG4gICAgaWYgKCFhbmNob3IpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oYW5jaG9yLmNoaWxkcmVuKVxuICAgICAgLnNsaWNlKDAsIDQpXG4gICAgICAubWFwKChlbCkgPT4ge1xuICAgICAgICBjb25zdCBjcyA9IGdldENvbXB1dGVkU3R5bGUoZWwpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNsczogKGVsIGFzIEhUTUxFbGVtZW50KS5jbGFzc05hbWUgfHwgZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpLFxuICAgICAgICAgIGRpc3BsYXk6IGNzLmRpc3BsYXksXG4gICAgICAgICAgaGVpZ2h0OiBNYXRoLnJvdW5kKGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCksXG4gICAgICAgICAgbWFyZ2luVG9wOiBjcy5tYXJnaW5Ub3AsXG4gICAgICAgICAgcGFkZGluZ1RvcDogY3MucGFkZGluZ1RvcCxcbiAgICAgICAgICBtYXJnaW5Cb3R0b206IGNzLm1hcmdpbkJvdHRvbSxcbiAgICAgICAgICBwYWRkaW5nQm90dG9tOiBjcy5wYWRkaW5nQm90dG9tLFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gIH0pKCk7XG4gIC8vIENvbnRhaW5lciBjaGFpbiBwcm9iZTogZnJvbSAuY20tY29udGVudCB1cCB0byB0aGUgdmlldy1jb250ZW50LFxuICAvLyBlYWNoIHdyYXBwZXIncyBwYWRkaW5nL21hcmdpbiBcdTIwMTQgbG9jYXRlcyB0aGUgbGVmdG92ZXIgdmVydGljYWxcbiAgLy8gb2Zmc2V0IGJldHdlZW4gZWRpdCBhbmQgcmVhZGluZyBjb250ZW50IGFyZWFzLlxuICBjb25zdCB0b3BDaGFpbiA9ICgoKSA9PiB7XG4gICAgaWYgKCFhbmNob3IpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3QgcGFydHM6IHsgY2xzOiBzdHJpbmc7IHBhZFRvcDogc3RyaW5nOyBtYXJUb3A6IHN0cmluZyB9W10gPSBbXTtcbiAgICBsZXQgbm9kZTogSFRNTEVsZW1lbnQgfCBudWxsID0gYW5jaG9yO1xuICAgIHdoaWxlIChub2RlICYmIG5vZGUgIT09IGNvbnRlbnRFbCAmJiBub2RlICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICBjb25zdCBjcyA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgICBwYXJ0cy5wdXNoKHtcbiAgICAgICAgY2xzOiBub2RlLmNsYXNzTmFtZSB8fCBub2RlLnRhZ05hbWUudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgcGFkVG9wOiBjcy5wYWRkaW5nVG9wLFxuICAgICAgICBtYXJUb3A6IGNzLm1hcmdpblRvcCxcbiAgICAgIH0pO1xuICAgICAgbm9kZSA9IG5vZGUucGFyZW50RWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuIHBhcnRzO1xuICB9KSgpO1xuXG4gIGNvbnN0IGR1bXAgPSB7XG4gICAgbW9kZTogaXNFZGl0ID8gXCJlZGl0IChMaXZlIFByZXZpZXcpXCIgOiBcInJlYWRpbmdcIixcbiAgICAvLyBTbGlkZXMgc3R5bGluZyBvbmx5IGFwcGxpZXMgd2hlbiBTbGlkZXMgbW9kZSBpcyBvblxuICAgIHNsaWRlc0FjdGl2ZTogZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuY29udGFpbnMoXCJuYXRpdmUtc2xpZGVzLW1vZGVcIiksXG4gICAgZG9tVGFnczogaXNFZGl0ID8gZG9tVGFncyA6IHVuZGVmaW5lZCxcbiAgICBzb3VyY2VWaWV3Q2xhc3M6IGlzRWRpdCA/IHNvdXJjZVZpZXdDbGFzcyA6IHVuZGVmaW5lZCxcbiAgICBsaXZlUHJldmlldzogaXNFZGl0ID8gaXNMaXZlUHJldmlldyhhcHApIDogdW5kZWZpbmVkLFxuICAgIGxpc3RMaW5lczogaXNFZGl0ID8gbGlzdExpbmVzIDogdW5kZWZpbmVkLFxuICAgIG1ldGFkYXRhQ29udGFpbmVyRGlzcGxheTogbWV0YWRhdGFEaXNwbGF5LFxuICAgIGgxT2Zmc2V0VG9wOiBoMU9mZnNldFRvcCxcbiAgICBoMVRvcEluQ29udGVudDogaDFUb3BJbkNvbnRlbnQsXG4gICAgaDFMZWZ0SW5Db250ZW50OiBoMUxlZnRJbkNvbnRlbnQsXG4gICAgY29udGVudENoaWxkcmVuOiBjb250ZW50Q2hpbGRyZW4sXG4gICAgdG9wQ2hhaW46IHRvcENoYWluLFxuICAgIGNvbnRhaW5lcjogc3R5bGUoY29udGFpbmVyLCBbXG4gICAgICBcImZvbnQtZmFtaWx5XCIsXG4gICAgICBcImZvbnQtc2l6ZVwiLFxuICAgICAgXCJsaW5lLWhlaWdodFwiLFxuICAgICAgXCJtYXgtd2lkdGhcIixcbiAgICAgIFwid2lkdGhcIixcbiAgICAgIFwicGFkZGluZy10b3BcIixcbiAgICAgIFwicGFkZGluZy1yaWdodFwiLFxuICAgICAgXCJwYWRkaW5nLWJvdHRvbVwiLFxuICAgICAgXCJwYWRkaW5nLWxlZnRcIixcbiAgICAgIFwiY29sb3JcIixcbiAgICAgIFwidGV4dC1hbGlnblwiLFxuICAgIF0pLFxuICAgIHBhcmFncmFwaDogc3R5bGUocGFyYSwgW1xuICAgICAgXCJmb250LXNpemVcIixcbiAgICAgIFwibGluZS1oZWlnaHRcIixcbiAgICAgIFwibWFyZ2luLXRvcFwiLFxuICAgICAgXCJtYXJnaW4tYm90dG9tXCIsXG4gICAgICBcIm1hcmdpbi1sZWZ0XCIsXG4gICAgICBcIm1hcmdpbi1yaWdodFwiLFxuICAgICAgXCJ0ZXh0LWluZGVudFwiLFxuICAgICAgXCJ0ZXh0LWFsaWduXCIsXG4gICAgXSksXG4gICAgaDE6IHN0eWxlKGgxLCBbXG4gICAgICBcImZvbnQtc2l6ZVwiLFxuICAgICAgXCJsaW5lLWhlaWdodFwiLFxuICAgICAgXCJmb250LXdlaWdodFwiLFxuICAgICAgXCJmb250LXZhcmlhbnRcIixcbiAgICAgIFwiY29sb3JcIixcbiAgICAgIFwibWFyZ2luLXRvcFwiLFxuICAgICAgXCJtYXJnaW4tYm90dG9tXCIsXG4gICAgICBcInRleHQtYWxpZ25cIixcbiAgICBdKSxcbiAgICBsaXN0SXRlbTogc3R5bGUobGlzdEl0ZW0sIFtcbiAgICAgIFwicGFkZGluZy1sZWZ0XCIsXG4gICAgICBcIm1hcmdpbi1sZWZ0XCIsXG4gICAgICBcIm1hcmdpbi1yaWdodFwiLFxuICAgICAgXCJ0ZXh0LWluZGVudFwiLFxuICAgICAgXCJsaW5lLWhlaWdodFwiLFxuICAgICAgXCJ0ZXh0LWFsaWduXCIsXG4gICAgXSksXG4gICAgY29kZUJsb2NrOiBzdHlsZShwcmUsIFtcbiAgICAgIFwiZm9udC1zaXplXCIsXG4gICAgICBcImxpbmUtaGVpZ2h0XCIsXG4gICAgICBcInBhZGRpbmctdG9wXCIsXG4gICAgICBcInBhZGRpbmctcmlnaHRcIixcbiAgICAgIFwicGFkZGluZy1ib3R0b21cIixcbiAgICAgIFwicGFkZGluZy1sZWZ0XCIsXG4gICAgICBcImJhY2tncm91bmQtY29sb3JcIixcbiAgICAgIFwiYm9yZGVyLXJhZGl1c1wiLFxuICAgIF0pLFxuICAgIGJsb2NrcXVvdGU6IHN0eWxlKHF1b3RlLCBbXG4gICAgICBcInBhZGRpbmctdG9wXCIsXG4gICAgICBcInBhZGRpbmctcmlnaHRcIixcbiAgICAgIFwicGFkZGluZy1ib3R0b21cIixcbiAgICAgIFwicGFkZGluZy1sZWZ0XCIsXG4gICAgICBcIm1hcmdpbi10b3BcIixcbiAgICAgIFwibWFyZ2luLWJvdHRvbVwiLFxuICAgICAgXCJib3JkZXItbGVmdC13aWR0aFwiLFxuICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCIsXG4gICAgXSksXG4gICAgaW5saW5lQ29kZTogc3R5bGUoaW5saW5lQ29kZSwgW1xuICAgICAgXCJmb250LXNpemVcIixcbiAgICAgIFwicGFkZGluZy10b3BcIixcbiAgICAgIFwicGFkZGluZy1ib3R0b21cIixcbiAgICAgIFwicGFkZGluZy1sZWZ0XCIsXG4gICAgICBcInBhZGRpbmctcmlnaHRcIixcbiAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiLFxuICAgICAgXCJib3JkZXItcmFkaXVzXCIsXG4gICAgXSksXG4gICAgdGFibGU6IHN0eWxlKHRhYmxlLCBbXCJmb250LXNpemVcIiwgXCJsaW5lLWhlaWdodFwiLCBcIndpZHRoXCIsIFwiYm9yZGVyLWNvbGxhcHNlXCJdKSxcbiAgICBpbWFnZTogc3R5bGUoaW1nLCBbXCJkaXNwbGF5XCIsIFwibWFyZ2luLWxlZnRcIiwgXCJtYXJnaW4tcmlnaHRcIiwgXCJtYXgtd2lkdGhcIiwgXCJ3aWR0aFwiXSksXG4gICAgaG9yaXpvbnRhbFJ1bGU6IHN0eWxlKGhyLCBbXCJtYXJnaW4tdG9wXCIsIFwibWFyZ2luLWJvdHRvbVwiLCBcImJvcmRlci10b3Atd2lkdGhcIiwgXCJoZWlnaHRcIl0pLFxuICAgIGNzc1ZhcmlhYmxlczoge1xuICAgICAgXCItLWZvbnQtdGV4dFwiOiBjc3NWYXIoXCItLWZvbnQtdGV4dFwiKSxcbiAgICAgIFwiLS1saW5lLWhlaWdodC1ub3JtYWxcIjogY3NzVmFyKFwiLS1saW5lLWhlaWdodC1ub3JtYWxcIiksXG4gICAgICBcIi0taDEtc2l6ZVwiOiBjc3NWYXIoXCItLWgxLXNpemVcIiksXG4gICAgICBcIi0taDEtbGluZS1oZWlnaHRcIjogY3NzVmFyKFwiLS1oMS1saW5lLWhlaWdodFwiKSxcbiAgICAgIFwiLS1oMS13ZWlnaHRcIjogY3NzVmFyKFwiLS1oMS13ZWlnaHRcIiksXG4gICAgICBcIi0taDEtdmFyaWFudFwiOiBjc3NWYXIoXCItLWgxLXZhcmlhbnRcIiksXG4gICAgICBcIi0taDEtY29sb3JcIjogY3NzVmFyKFwiLS1oMS1jb2xvclwiKSxcbiAgICAgIFwiLS1oMS1tYXJnaW4tdG9wXCI6IGNzc1ZhcihcIi0taDEtbWFyZ2luLXRvcFwiKSxcbiAgICAgIFwiLS1oMS1tYXJnaW4tYm90dG9tXCI6IGNzc1ZhcihcIi0taDEtbWFyZ2luLWJvdHRvbVwiKSxcbiAgICAgIFwiLS1wLXNwYWNpbmdcIjogY3NzVmFyKFwiLS1wLXNwYWNpbmdcIiksXG4gICAgICBcIi0tbGlzdC1zcGFjaW5nXCI6IGNzc1ZhcihcIi0tbGlzdC1zcGFjaW5nXCIpLFxuICAgICAgXCItLWxpc3QtaW5kZW50XCI6IGNzc1ZhcihcIi0tbGlzdC1pbmRlbnRcIiksXG4gICAgICBcIi0tY29kZS1zaXplXCI6IGNzc1ZhcihcIi0tY29kZS1zaXplXCIpLFxuICAgICAgXCItLWNvZGUtcGFkZGluZ1wiOiBjc3NWYXIoXCItLWNvZGUtcGFkZGluZ1wiKSxcbiAgICAgIFwiLS1jb2RlLXJhZGl1c1wiOiBjc3NWYXIoXCItLWNvZGUtcmFkaXVzXCIpLFxuICAgICAgXCItLWJsb2NrcXVvdGUtcGFkZGluZ1wiOiBjc3NWYXIoXCItLWJsb2NrcXVvdGUtcGFkZGluZ1wiKSxcbiAgICAgIFwiLS1ibG9ja3F1b3RlLWJvcmRlci10aGlja25lc3NcIjogY3NzVmFyKFwiLS1ibG9ja3F1b3RlLWJvcmRlci10aGlja25lc3NcIiksXG4gICAgICBcIi0tZmlsZS1tYXJnaW5zXCI6IGNzc1ZhcihcIi0tZmlsZS1tYXJnaW5zXCIpLFxuICAgICAgXCItLWZpbGUtbGluZS13aWR0aFwiOiBjc3NWYXIoXCItLWZpbGUtbGluZS13aWR0aFwiKSxcbiAgICAgIFwiLS1ub3JtYWwtZm9udC1zaXplXCI6IGNzc1ZhcihcIi0tbm9ybWFsLWZvbnQtc2l6ZVwiKSxcbiAgICAgIFwiLS1mb250LXRleHQtc2l6ZVwiOiBjc3NWYXIoXCItLWZvbnQtdGV4dC1zaXplXCIpLFxuICAgIH0sXG4gIH07XG4gIHJldHVybiBkdW1wO1xufVxuXG4vKipcbiAqIERlYnVnIHR5cG9ncmFwaHk6IHNhbXBsZXMgdGhlIGZpeGVkIG9uZS1wYWdlIHNhbXBsZSBub3RlcyAoZWFjaFxuICogY292ZXJpbmcgYSBncm91cCBvZiBlbGVtZW50cyBcdTIwMTQgYWxsIHZpc2libGUgd2l0aG91dCBzY3JvbGxpbmcpLFxuICogdGhlbiB0aGUga2l0Y2hlbi1zaW5rIG5vdGUgaW4gcmVhZGluZyB2aWV3IChubyB2aXJ0dWFsaXphdGlvblxuICogdGhlcmUpLCBtZXJnZXMgZXZlcnl0aGluZywgY29tcHV0ZXMgdGhlIGVkaXQtdnMtcmVhZGluZyBkaWZmIGFuZFxuICogd3JpdGVzIGl0IHRvIC5uYXRpdmUtc2xpZGVzLWRlYnVnLmpzb24gaW4gdGhlIHZhdWx0IHJvb3QuXG4gKiBUaGUgdXNlcidzIG93biBub3RlIGlzIHJlc3RvcmVkIGF0IHRoZSBlbmQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkdW1wVHlwb2dyYXBoeShwbHVnaW46IE5hdGl2ZVNsaWRlc1BsdWdpbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBhcHAgPSBwbHVnaW4uYXBwO1xuICBpZiAoIWRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmNvbnRhaW5zKFwibmF0aXZlLXNsaWRlcy1tb2RlXCIpKSB7XG4gICAgbmV3IE5vdGljZShcIk5hdGl2ZSBTbGlkZXM6IGVudGVyIFNsaWRlcyBtb2RlIGZpcnN0IChNb2QrU2hpZnQrRSBvbiBhIGRlY2sgbm90ZSlcIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHZpZXcgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgaWYgKCF2aWV3KSB7XG4gICAgbmV3IE5vdGljZShcIk5hdGl2ZSBTbGlkZXM6IG5vIGFjdGl2ZSBNYXJrZG93biBub3RlXCIpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBzdGFydE1vZGUgPSB2aWV3LmdldE1vZGUoKTtcbiAgY29uc3QgYWN0aXZlRmlsZSA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICBjb25zdCBsZWFmID0gYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKTtcblxuICAvLyBFZGl0IHNpZGU6IGVhY2ggc2hvcnQgbm90ZSBrZWVwcyBldmVyeSB0YXJnZXQgZWxlbWVudCBvbiBzY3JlZW5cbiAgY29uc3QgZWRpdDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcbiAgZm9yIChjb25zdCBuYW1lIG9mIFNBTVBMRV9OT1RFX05BTUVTKSB7XG4gICAgY29uc3QgZiA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoYCR7bmFtZX0ubWRgKTtcbiAgICBpZiAoIShmIGluc3RhbmNlb2YgVEZpbGUpKSBjb250aW51ZTtcbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGYsIHsgc3RhdGU6IHsgbW9kZTogXCJzb3VyY2VcIiB9IH0pO1xuICAgIGF3YWl0IHNsZWVwKDUwMCk7XG4gICAgY29uc3QgcyA9IHNhbXBsZVN0eWxlcyhhcHApO1xuICAgIGlmIChzKSBtZXJnZVNhbXBsZShlZGl0LCBzKTtcbiAgfVxuXG4gIC8vIFJlYWRpbmcgc2lkZTogdGhlIGtpdGNoZW4tc2luayBub3RlIHJlbmRlcnMgZXZlcnl0aGluZyBhdCBvbmNlXG4gIGxldCByZWFkaW5nOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwgPSBudWxsO1xuICBjb25zdCBkZW1vID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChcInR5cG9ncmFwaHktZGVtby5tZFwiKTtcbiAgaWYgKGRlbW8gaW5zdGFuY2VvZiBURmlsZSkge1xuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZGVtbywgeyBzdGF0ZTogeyBtb2RlOiBcInByZXZpZXdcIiB9IH0pO1xuICAgIGF3YWl0IHNsZWVwKDgwMCk7XG4gICAgcmVhZGluZyA9IHNhbXBsZVN0eWxlcyhhcHApO1xuICB9XG5cbiAgLy8gUmVzdG9yZSB0aGUgdXNlcidzIG5vdGVcbiAgaWYgKGFjdGl2ZUZpbGUpIHtcbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGFjdGl2ZUZpbGUsIHsgc3RhdGU6IHsgbW9kZTogc3RhcnRNb2RlIH0gfSk7XG4gICAgcGx1Z2luLnJlZnJlc2goKTtcbiAgfVxuICBpZiAoIXJlYWRpbmcpIHtcbiAgICBuZXcgTm90aWNlKFwiTmF0aXZlIFNsaWRlczogcmVhZGluZyBzYW1wbGUgZmFpbGVkXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHBheWxvYWQgPSB7IGVkaXQsIHJlYWRpbmcsIGRpZmY6IGRpZmZEdW1wcyhlZGl0LCByZWFkaW5nKSB9O1xuICB0cnkge1xuICAgIGF3YWl0IGFwcC52YXVsdC5hZGFwdGVyLndyaXRlKFwiLm5hdGl2ZS1zbGlkZXMtZGVidWcuanNvblwiLCBKU09OLnN0cmluZ2lmeShwYXlsb2FkLCBudWxsLCAyKSk7XG4gICAgbmV3IE5vdGljZShcIlR5cG9ncmFwaHkgZHVtcCBcdTIxOTIgLm5hdGl2ZS1zbGlkZXMtZGVidWcuanNvbiAodmF1bHQgcm9vdClcIik7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbmV3IE5vdGljZShgTmF0aXZlIFNsaWRlczogY291bGQgbm90IHdyaXRlIGRlYnVnIGZpbGUgKCR7U3RyaW5nKGVycm9yKX0pYCk7XG4gIH1cbiAgY29uc29sZS5sb2coXCJbbmF0aXZlLXNsaWRlcyBkZWJ1Zy1zdHlsZXNdXCIsIEpTT04uc3RyaW5naWZ5KHBheWxvYWQsIG51bGwsIDIpKTtcbn1cblxuLyoqIFJlZ2lzdGVyIHRoZSBkZXYtb25seSBkZWJ1ZyBjb21tYW5kIChjYWxsZWQgb25seSB3aGVuIERFVl9NT0RFIGlzIHRydWUpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyRGVidWdDb21tYW5kKHBsdWdpbjogTmF0aXZlU2xpZGVzUGx1Z2luKTogdm9pZCB7XG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJucy1kZWJ1Zy1zdHlsZXNcIixcbiAgICBuYW1lOiBcIkRlYnVnOiBEdW1wIFR5cG9ncmFwaHkgU3R5bGVzXCIsXG4gICAgY2FsbGJhY2s6ICgpID0+IHZvaWQgZHVtcFR5cG9ncmFwaHkocGx1Z2luKSxcbiAgfSk7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNYXJrZG93blZpZXcsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbi8qKiBNb2RlIG9mIHRoZSBhY3RpdmUgTWFya2Rvd24gdmlldzogJ3ByZXZpZXcnPXJlYWRpbmcgJ3NvdXJjZSc9ZWRpdGluZyAnJz1ub25lICovXG5leHBvcnQgZnVuY3Rpb24gY3VycmVudE1vZGUoYXBwOiBBcHApOiBcInByZXZpZXdcIiB8IFwic291cmNlXCIgfCBcIlwiIHtcbiAgY29uc3QgdmlldyA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICByZXR1cm4gdmlldyA/ICh2aWV3LmdldE1vZGUoKSBhcyBcInByZXZpZXdcIiB8IFwic291cmNlXCIpIDogXCJcIjtcbn1cblxuLyoqXG4gKiBUcnVlIHdoZW4gdGhlIGFjdGl2ZSBlZGl0IHZpZXcgaXMgTGl2ZSBQcmV2aWV3IChTbGlkZXMpIFx1MjAxNCBhc1xuICogb3Bwb3NlZCB0byBTb3VyY2UgbW9kZS4gT2JzaWRpYW4gcmVwb3J0cyBib3RoIGFzIG1vZGUgXCJzb3VyY2VcIjtcbiAqIHRoZSB2aWV3IHN0YXRlIGNhcnJpZXMgYSBgc291cmNlYCBmbGFnIChTb3VyY2UgbW9kZSA9IHRydWUpLCB3aXRoXG4gKiBhIERPTSBjbGFzcyBmYWxsYmFjayAoLmlzLWxpdmUtcHJldmlldykgZm9yIHNhZmV0eS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTGl2ZVByZXZpZXcoYXBwOiBBcHApOiBib29sZWFuIHtcbiAgY29uc3QgdmlldyA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICBpZiAoIXZpZXcgfHwgdmlldy5nZXRNb2RlKCkgIT09IFwic291cmNlXCIpIHJldHVybiBmYWxzZTtcbiAgY29uc3Qgc3RhdGUgPSB2aWV3LmdldFN0YXRlKCkgYXMgeyBzb3VyY2U/OiBib29sZWFuIH07XG4gIGlmIChzdGF0ZS5zb3VyY2UgPT09IHRydWUpIHJldHVybiBmYWxzZTtcbiAgaWYgKHN0YXRlLnNvdXJjZSA9PT0gZmFsc2UpIHJldHVybiB0cnVlO1xuICByZXR1cm4gISF2aWV3LmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYuaXMtbGl2ZS1wcmV2aWV3XCIpO1xufVxuXG4vKiogRnJvbnRtYXR0ZXIgb2YgYW55IG5vdGUgYXMgYW4gb2JqZWN0LCBvciBudWxsIHdoZW4gYWJzZW50ICovXG5leHBvcnQgZnVuY3Rpb24gZnJvbnRtYXR0ZXJPZihhcHA6IEFwcCwgZmlsZTogVEZpbGUpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICBjb25zdCBjYWNoZSA9IGFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgcmV0dXJuIGNhY2hlPy5mcm9udG1hdHRlciA/PyBudWxsO1xufVxuXG4vKiogQ3VycmVudCBub3RlJ3MgZnJvbnRtYXR0ZXIgYXMgYW4gb2JqZWN0LCBvciBudWxsIHdoZW4gYWJzZW50ICovXG5leHBvcnQgZnVuY3Rpb24gYWN0aXZlRnJvbnRtYXR0ZXIoYXBwOiBBcHApOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICBjb25zdCBmaWxlID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gIHJldHVybiBmaWxlID8gZnJvbnRtYXR0ZXJPZihhcHAsIGZpbGUpIDogbnVsbDtcbn1cbiIsICIvKiogUGx1Z2luIHNldHRpbmdzICovXG5leHBvcnQgaW50ZXJmYWNlIE5hdGl2ZVNsaWRlc1NldHRpbmdzIHtcbiAgLyoqIFNob3cgXHUyNUMwIFx1MjVCNiBwcmV2aW91cy9uZXh0IGJ1dHRvbnMgb24gdGhlIGxlZnQgb2YgdGhlIHNsaWRlcyBiYXIgKi9cbiAgc2hvd05hdkJ1dHRvbnM6IGJvb2xlYW47XG4gIC8qKiBTaG93IHRoZSBhdXRvLWNvbXB1dGVkIHBhZ2UgbnVtYmVyIGF0IHRoZSBib3R0b20tcmlnaHQgb2YgdGhlIHNsaWRlcyBiYXIgKi9cbiAgc2hvd1BhZ2VOdW1iZXI6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoZSB1c2VyIG1hbnVhbGx5IGhpZCB0aGUgc2xpZGVzIGJhciAodG9nZ2xlIGNvbW1hbmQpICovXG4gIGJhckhpZGRlbjogYm9vbGVhbjtcbiAgLyoqIEF1dG8tZW50ZXIgU2xpZGVzIG1vZGUgd2hlbiBvcGVuaW5nIGEgZGVjayBub3RlIChkZWZhdWx0IG9mZikgKi9cbiAgYXV0b0VudGVyU2xpZGVzOiBib29sZWFuO1xuICAvKiogRnJvbnRtYXR0ZXIgcHJvcGVydHkgc2hvd24gYXMgdGhlIGNhcmQgdGl0bGUgKFwiXCIgPSBub25lLCBcImZpbGVuYW1lXCIgPSBmaWxlIG5hbWUpICovXG4gIHNsaWRlc1RpdGxlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBOYXRpdmVTbGlkZXNTZXR0aW5ncyA9IHtcbiAgc2hvd05hdkJ1dHRvbnM6IHRydWUsXG4gIHNob3dQYWdlTnVtYmVyOiB0cnVlLFxuICBiYXJIaWRkZW46IGZhbHNlLFxuICBhdXRvRW50ZXJTbGlkZXM6IGZhbHNlLFxuICBzbGlkZXNUaXRsZTogXCJcIixcbn07XG5cbi8qKiBSZXNlcnZlZCBmcm9udG1hdHRlciBrZXkgZHJpdmluZyBkZWNrIG5hdmlnYXRpb24gKG5ldmVyIHJlbmRlcmVkIGFzIGEgY2hpcCkgKi9cbmV4cG9ydCBjb25zdCBERUNLX0tFWSA9IFwiZGVja1wiO1xuIiwgImltcG9ydCB0eXBlIE5hdGl2ZVNsaWRlc1BsdWdpbiBmcm9tIFwiLi4vbWFpblwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJEZWJ1Z0NvbW1hbmQgfSBmcm9tIFwiLi9kZWJ1Z1wiO1xuaW1wb3J0IHsgZnJvbnRtYXR0ZXJPZiB9IGZyb20gXCIuL21vZGVcIjtcbmltcG9ydCB7IERFQ0tfS0VZIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuLyoqIFJlZ2lzdGVyIGV2ZXJ5IGNvbW1hbmQ7IHRoZSBkZWJ1ZyBjb21tYW5kIGlzIGRldi1idWlsZCBvbmx5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29tbWFuZHMocGx1Z2luOiBOYXRpdmVTbGlkZXNQbHVnaW4pOiB2b2lkIHtcbiAgLy8gVG9nZ2xlIHRoZSBzbGlkZXMgYmFyICh3aXRoaW4gU2xpZGVzIG1vZGUpXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJucy10b2dnbGUtYmFyXCIsXG4gICAgbmFtZTogXCJUb2dnbGUgU2xpZGVzIEJhclwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBwbHVnaW4uc2V0dGluZ3MuYmFySGlkZGVuID0gIXBsdWdpbi5zZXR0aW5ncy5iYXJIaWRkZW47XG4gICAgICBhd2FpdCBwbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICBwbHVnaW4ucmVmcmVzaCgpO1xuICAgIH0sXG4gIH0pO1xuICAvLyBQcmV2aW91cyAvIG5leHQgcGFnZSAoZGVjayBuYXZpZ2F0aW9uOyBlbnRlcmluZyBTbGlkZXMgbW9kZSBhcyBuZWVkZWQpXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJucy1wcmV2XCIsXG4gICAgbmFtZTogXCJQcmV2aW91cyBQYWdlXCIsXG4gICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIiwgXCJTaGlmdFwiXSwga2V5OiBcIkFycm93TGVmdFwiIH1dLFxuICAgIGNhbGxiYWNrOiAoKSA9PiBwbHVnaW4ubmF2aWdhdGUoXCJwcmV2XCIpLFxuICB9KTtcbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcIm5zLW5leHRcIixcbiAgICBuYW1lOiBcIk5leHQgUGFnZVwiLFxuICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJBcnJvd1JpZ2h0XCIgfV0sXG4gICAgY2FsbGJhY2s6ICgpID0+IHBsdWdpbi5uYXZpZ2F0ZShcIm5leHRcIiksXG4gIH0pO1xuICAvLyBDcmVhdGUgTmV4dCBTbGlkZSBcdTIwMTQgbmV3IHNsaWRlIGFmdGVyIHRoZSBjdXJyZW50IG9uZSAoZGVjayBub3RlcyBvbmx5KVxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwibnMtY3JlYXRlLW5leHRcIixcbiAgICBuYW1lOiBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIsXG4gICAgLy8gR3JleWVkIG91dCBpbiB0aGUgcGFsZXR0ZSB1bmxlc3MgdGhlIGFjdGl2ZSBub3RlIGNhbiB0YWtlIGEgbmV4dCBzbGlkZVxuICAgIGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZykgPT4ge1xuICAgICAgY29uc3QgZmlsZSA9IHBsdWdpbi5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICAgIGlmICghZmlsZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgY29uc3QgcGxhbiA9IHBsdWdpbi5kZWNrU2VydmljZS5wbGFuQ3JlYXRlTmV4dChmaWxlKTtcbiAgICAgIGlmICghcGxhbikgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKCFjaGVja2luZykgdm9pZCBwbHVnaW4uZGVja1NlcnZpY2UuZXhlY3V0ZUNyZWF0ZU5leHQoZmlsZSwgcGxhbik7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuICB9KTtcbiAgLy8gVG9nZ2xlIFNsaWRlcyBtb2RlIFx1MjAxNCB0aGUgaW1tZXJzaXZlIGNhcmQgdmlldyAoZGVjayBub3RlcyBvbmx5KVxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwibnMtdG9nZ2xlLXNsaWRlc1wiLFxuICAgIG5hbWU6IFwiVG9nZ2xlIFNsaWRlcyBNb2RlXCIsXG4gICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIiwgXCJTaGlmdFwiXSwga2V5OiBcIkVcIiB9XSxcbiAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmcpID0+IHtcbiAgICAgIGNvbnN0IGZpbGUgPSBwbHVnaW4uYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICBpZiAoIWZpbGUpIHJldHVybiBmYWxzZTtcbiAgICAgIGNvbnN0IGZtID0gZnJvbnRtYXR0ZXJPZihwbHVnaW4uYXBwLCBmaWxlKTtcbiAgICAgIGlmIChmbSA9PT0gbnVsbCB8fCAhKERFQ0tfS0VZIGluIGZtKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKCFjaGVja2luZykgcGx1Z2luLnRvZ2dsZVNsaWRlcygpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgfSk7XG4gIC8vIERlYnVnIHRvb2xpbmcgXHUyMDE0IHJlZ2lzdGVyZWQgb25seSBpbiBkZXYgYnVpbGRzICh0cmVlLXNoYWtlbiBpbiByZWxlYXNlKVxuICBpZiAoREVWX01PREUpIHJlZ2lzdGVyRGVidWdDb21tYW5kKHBsdWdpbik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBwbGFuQ3JlYXRlTmV4dCBhcyBwbGFuLCB0eXBlIENyZWF0ZU5leHRSZXN1bHQgfSBmcm9tIFwiLi9jcmVhdGVOZXh0XCI7XG5pbXBvcnQgeyBjb21wdXRlRGVjaywgZXh0cmFjdExpbmtzLCBleHRyYWN0UmF3TGlua3MsIHR5cGUgRGVja0luZm8gfSBmcm9tIFwiLi9kZWNrXCI7XG5pbXBvcnQgeyBmcm9udG1hdHRlck9mIH0gZnJvbSBcIi4vbW9kZVwiO1xuaW1wb3J0IHsgREVDS19LRVkgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG4vKiogRGVjayBjaGFpbiByZXNvbHV0aW9uICsgXCJDcmVhdGUgTmV4dCBTbGlkZVwiIGdsdWUgKHdyYXBzIHRoZSBwdXJlIGNvcmUpLiAqL1xuZXhwb3J0IGNsYXNzIERlY2tTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcCkge31cblxuICAvKiogUmVzb2x2ZSB0aGUgY3VycmVudCBub3RlJ3MgcG9zaXRpb24gaW5zaWRlIGl0cyBkZWNrIChwYXRoLWJhc2VkIHdyYXBwZXIpICovXG4gIGNvbXB1dGUoZmlsZTogVEZpbGUpOiBEZWNrSW5mbyB8IG51bGwge1xuICAgIHJldHVybiBjb21wdXRlRGVjayhmaWxlLnBhdGgsIChwYXRoKSA9PiB0aGlzLmxpbmtQYXRocyhwYXRoKSk7XG4gIH1cblxuICAvKiogUmVzb2x2ZSB0aGUgYGRlY2tgIHByb3BlcnR5IG9mIGEgbm90ZSBpbnRvIHJlYWwgbm90ZSBwYXRocyAobWF4IHR3bykgKi9cbiAgcHJpdmF0ZSBsaW5rUGF0aHMocGF0aDogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGYgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCk7XG4gICAgaWYgKCEoZiBpbnN0YW5jZW9mIFRGaWxlKSkgcmV0dXJuIFtdO1xuICAgIGNvbnN0IGZtID0gZnJvbnRtYXR0ZXJPZih0aGlzLmFwcCwgZik7XG4gICAgY29uc3QgbmFtZXMgPSBmbSA/IGV4dHJhY3RMaW5rcyhmbVtERUNLX0tFWV0pIDogW107XG4gICAgcmV0dXJuIG5hbWVzXG4gICAgICAubWFwKChuYW1lKSA9PiB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KG5hbWUsIHBhdGgpKVxuICAgICAgLmZpbHRlcigoeCk6IHggaXMgVEZpbGUgPT4gISF4KVxuICAgICAgLm1hcCgoeCkgPT4geC5wYXRoKTtcbiAgfVxuXG4gIC8qKiBOYW1lcyBpbiB0aGUgYGRlY2tgIHByb3BlcnR5IHRoYXQgcmVzb2x2ZSB0byBubyBub3RlIChicm9rZW4gbGlua3MpICovXG4gIGJyb2tlbihmaWxlOiBURmlsZSk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBmbSA9IGZyb250bWF0dGVyT2YodGhpcy5hcHAsIGZpbGUpO1xuICAgIGNvbnN0IG5hbWVzID0gZm0gPyBleHRyYWN0TGlua3MoZm1bREVDS19LRVldKSA6IFtdO1xuICAgIHJldHVybiBuYW1lcy5maWx0ZXIoKG5hbWUpID0+ICF0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KG5hbWUsIGZpbGUucGF0aCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBsYW4gYSBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIgcnVuIGZvciB0aGUgYWN0aXZlIG5vdGUsIG9yIG51bGwgd2hlbiB0aGVcbiAgICogbm90ZSBjYW5ub3QgdGFrZSBhIG5leHQgc2xpZGUgKG5vIHVzYWJsZSBgZGVja2AgcHJvcGVydHkpLlxuICAgKlxuICAgKiBTbGlkZXMgb24gdGhlIGNoYWluIGluc2VydC9hcHBlbmQgYWZ0ZXIgdGhlIGN1cnJlbnQgbm90ZTsgdGhlIG92ZXJ2aWV3XG4gICAqIHBhZ2UgaW5zZXJ0cyBhIG5ldyBmaXJzdCBwYWdlOyBhbiBvZmYtY2hhaW4gbm90ZSB3aXRoIGEgcmVzb2x2YWJsZVxuICAgKiBvdmVydmlldyBsaW5rIHN0aWxsIGdldHMgaXRzIGRlY2xhcmVkIG1pc3NpbmcgbmV4dCBub3RlIGNyZWF0ZWQuXG4gICAqL1xuICBwbGFuQ3JlYXRlTmV4dChmaWxlOiBURmlsZSk6IENyZWF0ZU5leHRSZXN1bHQgfCBudWxsIHtcbiAgICBjb25zdCBmbSA9IGZyb250bWF0dGVyT2YodGhpcy5hcHAsIGZpbGUpO1xuICAgIGNvbnN0IHJhdyA9IGZtID8gZXh0cmFjdFJhd0xpbmtzKGZtW0RFQ0tfS0VZXSkgOiBbXTtcbiAgICBpZiAocmF3Lmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgICBjb25zdCBkZWNrID0gdGhpcy5jb21wdXRlKGZpbGUpO1xuICAgIGNvbnN0IGV4aXN0aW5nTmFtZXMgPSBuZXcgU2V0KHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKS5tYXAoKGYpID0+IGYuYmFzZW5hbWUpKTtcblxuICAgIGlmIChkZWNrKSB7XG4gICAgICAvLyBPdmVydmlldyBpbnNlcnRpb24gbmVlZHMgdGhlIG9sZCBmaXJzdCBwYWdlJ3MgYmFjayBsaW5rIHRvIHRoZVxuICAgICAgLy8gb3ZlcnZpZXcgKGl0cyBvd24gZnJvbnRtYXR0ZXIgb25seSBsaW5rcyBmb3J3YXJkKS5cbiAgICAgIGxldCBvdmVydmlld0JhY2tMaW5rOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICBpZiAoZGVjay5pbmRleCA9PT0gMCkge1xuICAgICAgICBjb25zdCBvbGRGaXJzdCA9IGRlY2suY2hhaW5bMV0gPyB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZGVjay5jaGFpblsxXSkgOiBudWxsO1xuICAgICAgICBpZiAob2xkRmlyc3QgaW5zdGFuY2VvZiBURmlsZSkge1xuICAgICAgICAgIGNvbnN0IGYyID0gZnJvbnRtYXR0ZXJPZih0aGlzLmFwcCwgb2xkRmlyc3QpO1xuICAgICAgICAgIG92ZXJ2aWV3QmFja0xpbmsgPSBmMiA/IGV4dHJhY3RSYXdMaW5rcyhmMltERUNLX0tFWV0pWzBdIDogdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcGxhbih7XG4gICAgICAgIGN1cnJlbnROYW1lOiBmaWxlLmJhc2VuYW1lLFxuICAgICAgICBjdXJyZW50TGlua3M6IHJhdyxcbiAgICAgICAgaXNPdmVydmlldzogZGVjay5pbmRleCA9PT0gMCxcbiAgICAgICAgb3ZlcnZpZXdCYWNrTGluayxcbiAgICAgICAgZXhpc3RpbmdOYW1lcyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIE9mZi1jaGFpbiBub3RlOiBzdGlsbCBjcmVhdGUgaXRzIGRlY2xhcmVkIG1pc3NpbmcgbmV4dCBub3RlIHdoZW4gdGhlXG4gICAgLy8gb3ZlcnZpZXcgbGluayByZXNvbHZlcyAodGhlIFx1MjZBMCBicm9rZW4tbGluayB3YXJuaW5nIGRpc2FwcGVhcnMpLlxuICAgIGNvbnN0IG92ZXJ2aWV3TmFtZSA9IHJhdy5sZW5ndGggPj0gMiA/IGV4dHJhY3RMaW5rcyhyYXdbMF0pWzBdIDogbnVsbDtcbiAgICBpZiAob3ZlcnZpZXdOYW1lICYmIHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3Qob3ZlcnZpZXdOYW1lLCBmaWxlLnBhdGgpKSB7XG4gICAgICByZXR1cm4gcGxhbih7XG4gICAgICAgIGN1cnJlbnROYW1lOiBmaWxlLmJhc2VuYW1lLFxuICAgICAgICBjdXJyZW50TGlua3M6IHJhdyxcbiAgICAgICAgaXNPdmVydmlldzogZmFsc2UsXG4gICAgICAgIGV4aXN0aW5nTmFtZXMsXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKiogQXBwbHkgYSBwbGFuOiBjcmVhdGUgdGhlIG5vdGUsIHJld2lyZSBgZGVja2AgcHJvcGVydGllcywgb3BlbiBpdCAqL1xuICBhc3luYyBleGVjdXRlQ3JlYXRlTmV4dChmaWxlOiBURmlsZSwgcGxhbjogQ3JlYXRlTmV4dFJlc3VsdCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGRpciA9IGZpbGUucGFyZW50Py5wYXRoID8gZmlsZS5wYXJlbnQucGF0aCArIFwiL1wiIDogXCJcIjtcbiAgICBjb25zdCBuZXdQYXRoID0gYCR7ZGlyfSR7cGxhbi5uZXdOYW1lfS5tZGA7XG4gICAgY29uc3QgZnJvbnRtYXR0ZXIgPSBwbGFuLm5ld0RlY2tMaW5rcy5tYXAoKGxpbmspID0+IEpTT04uc3RyaW5naWZ5KGxpbmspKS5qb2luKFwiLCBcIik7XG4gICAgY29uc3QgY29udGVudCA9IGAtLS1cXG5kZWNrOiBbJHtmcm9udG1hdHRlcn1dXFxuLS0tXFxuYDtcblxuICAgIGxldCBuZXdGaWxlOiBURmlsZTtcbiAgICB0cnkge1xuICAgICAgbmV3RmlsZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShuZXdQYXRoLCBjb250ZW50KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgbmV3IE5vdGljZShgTmF0aXZlIFNsaWRlczogY291bGQgbm90IGNyZWF0ZSBcIiR7cGxhbi5uZXdOYW1lfS5tZFwiICgke1N0cmluZyhlcnJvcil9KWApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJld2lyZSB0aGUgY3VycmVudCBub3RlJ3MgYGRlY2tgIChrZWVwcyBhbGwgb3RoZXIgcHJvcGVydGllcyBpbnRhY3QpXG4gICAgZm9yIChjb25zdCByZXdyaXRlIG9mIHBsYW4ucmV3cml0ZXMpIHtcbiAgICAgIGlmIChyZXdyaXRlLm5hbWUgIT09IGZpbGUuYmFzZW5hbWUpIGNvbnRpbnVlOyAvLyBpbiBwcmFjdGljZSBhbHdheXMgdGhlIGN1cnJlbnQgbm90ZVxuICAgICAgYXdhaXQgdGhpcy5hcHAuZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKGZpbGUsIChmbSkgPT4ge1xuICAgICAgICBmbVtERUNLX0tFWV0gPSByZXdyaXRlLmRlY2s7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBPcGVuIHRoZSBuZXcgbm90ZSBpbiB0aGUgY3VycmVudCBwYW5lLCBlZGl0IG1vZGUgKExpdmUgUHJldmlldylcbiAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpO1xuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUobmV3RmlsZSwgeyBzdGF0ZTogeyBtb2RlOiBcInNvdXJjZVwiIH0gfSk7XG4gIH1cbn1cbiIsICIvKipcbiAqIGRlY2sudHMgXHUyMDE0IFB1cmUgZGVjay1yZXNvbHV0aW9uIGNvcmUgZm9yIG5hdGl2ZS1zbGlkZXMuXG4gKlxuICogRXZlcnl0aGluZyBpbiB0aGlzIG1vZHVsZSBpcyBmcmVlIG9mIE9ic2lkaWFuIHJ1bnRpbWUgZGVwZW5kZW5jaWVzIHNvIGl0IGNhblxuICogYmUgdW5pdCB0ZXN0ZWQgZGlyZWN0bHkgKHNlZSB0ZXN0L2RlY2sudGVzdC50cykuIG1haW4udHMgYWRhcHRzIHRoZSB2YXVsdFxuICogKG1ldGFkYXRhQ2FjaGUpIHRvIHRoaXMgcHVyZSBpbnRlcmZhY2U6IGl0IHJlc29sdmVzIGBkZWNrYCBwcm9wZXJ0aWVzIHRvXG4gKiBub3RlIHBhdGhzLCB0aGVuIGhhbmRzIHRoZSBwYXRoIGdyYXBoIHRvIGNvbXB1dGVEZWNrKCkuXG4gKi9cblxuLyoqIEEgZGVjayBsaW5rIGxpc3QgbmV2ZXIgaG9sZHMgbW9yZSB0aGFuIHR3byBlbnRyaWVzICovXG5leHBvcnQgY29uc3QgTUFYX0RFQ0tfTElOS1MgPSAyO1xuXG4vKiogUmVzdWx0IG9mIHJlc29sdmluZyBhIG5vdGUncyBwb3NpdGlvbiBpbnNpZGUgYSBkZWNrICovXG5leHBvcnQgaW50ZXJmYWNlIERlY2tJbmZvIHtcbiAgLyoqIENoYWluIG9mIG5vdGUgcGF0aHM6IFswXSBpcyB0aGUgb3ZlcnZpZXcgbm90ZSwgdGhlbiBzbGlkZXMgaW4gb3JkZXIgKi9cbiAgY2hhaW46IHN0cmluZ1tdO1xuICAvKiogSW5kZXggb2YgdGhlIGN1cnJlbnQgbm90ZSBpbnNpZGUgY2hhaW4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBSZXNvbHZlIGEgbm90ZSdzIHBvc2l0aW9uIGluc2lkZSBpdHMgZGVjayBieSB3YWxraW5nIHRoZSBsaW5rIGNoYWluLlxuICpcbiAqIENvbnZlbnRpb24gZm9yIHRoZSBzaW5nbGUgYGRlY2tgIHByb3BlcnR5ICh1cCB0byB0d28gbGlua3MpOlxuICogICAtIG92ZXJ2aWV3IG5vdGU6IG9uZSBsaW5rIFx1MjE5MiB0aGF0IGxpbmsgSVMgdGhlIGZpcnN0IHBhZ2U7XG4gKiAgIC0gc2xpZGUgbm90ZTogICAgZmlyc3QgbGluayBcdTIxOTIgdGhlIG92ZXJ2aWV3IHBhZ2UsIHNlY29uZCBsaW5rIFx1MjE5MiBuZXh0IHNsaWRlXG4gKiAgICAgICAgICAgICAgICAgICAgKG5vIHNlY29uZCBsaW5rIG9uIHRoZSBsYXN0IHNsaWRlKS5cbiAqXG4gKiBgZ2V0TGlua3MocGF0aClgIG11c3QgcmV0dXJuIHRoZSByZXNvbHZlZCBub3RlIHBhdGhzIG9mIHRoZSBgZGVja2AgcHJvcGVydHlcbiAqIG9mIHRoZSBub3RlIGF0IGBwYXRoYCAoZW1wdHkgd2hlbiB0aGUgbm90ZSBoYXMgbm9uZSwgb3IgaXRzIGxpbmtzIGFyZVxuICogYnJva2VuIFx1MjAxNCBhIGJyb2tlbiBsaW5rIHNpbXBseSBlbmRzIG9yIGV4Y2x1ZGVzIHRoZSBjaGFpbiwgbmV2ZXIgY3Jhc2hlcykuXG4gKlxuICogUmV0dXJucyB0aGUgZnVsbCBjaGFpbiAoW292ZXJ2aWV3LCBzbGlkZSAxLCBzbGlkZSAyLCBcdTIwMjZdKSBhbmQgdGhlIGN1cnJlbnRcbiAqIG5vdGUncyBpbmRleCwgb3IgbnVsbCB3aGVuIHRoZSBub3RlIGlzIG5vdCBwYXJ0IG9mIGFueSBkZWNrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZURlY2soXG4gIGN1cnJlbnRQYXRoOiBzdHJpbmcsXG4gIGdldExpbmtzOiAocGF0aDogc3RyaW5nKSA9PiBzdHJpbmdbXSxcbik6IERlY2tJbmZvIHwgbnVsbCB7XG4gIGNvbnN0IGN1cnJlbnRMaW5rcyA9IGdldExpbmtzKGN1cnJlbnRQYXRoKTtcbiAgaWYgKGN1cnJlbnRMaW5rcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuXG4gIGxldCBvdmVydmlldzogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBsZXQgZmlyc3RQYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbiAgaWYgKGN1cnJlbnRMaW5rcy5sZW5ndGggPj0gMikge1xuICAgIC8vIEEgc2xpZGU6IGZpcnN0IGxpbmsgaXMgdGhlIG92ZXJ2aWV3IHBhZ2VcbiAgICBvdmVydmlldyA9IGN1cnJlbnRMaW5rc1swXTtcbiAgICBmaXJzdFBhZ2UgPSBnZXRMaW5rcyhvdmVydmlldylbMF07XG4gIH0gZWxzZSB7XG4gICAgLy8gQSBzaW5nbGUgbGluazogZWl0aGVyIHdlIEFSRSB0aGUgb3ZlcnZpZXcgKGxpbmsgPSBmaXJzdCBwYWdlKSxcbiAgICAvLyBvciB3ZSBhcmUgdGhlIGxhc3Qgc2xpZGUgKGxpbmsgPSBvdmVydmlldyBwYWdlKVxuICAgIGNvbnN0IG9ubHkgPSBjdXJyZW50TGlua3NbMF07XG4gICAgY29uc3Qgb25seUxpbmtzID0gZ2V0TGlua3Mob25seSk7XG4gICAgaWYgKG9ubHlMaW5rc1swXSA9PT0gY3VycmVudFBhdGgpIHtcbiAgICAgIG92ZXJ2aWV3ID0gY3VycmVudFBhdGg7XG4gICAgICBmaXJzdFBhZ2UgPSBvbmx5O1xuICAgIH0gZWxzZSB7XG4gICAgICBvdmVydmlldyA9IG9ubHk7XG4gICAgICBmaXJzdFBhZ2UgPSBvbmx5TGlua3NbMF07XG4gICAgfVxuICB9XG4gIGlmICghb3ZlcnZpZXcgfHwgIWZpcnN0UGFnZSkgcmV0dXJuIG51bGw7XG5cbiAgLy8gV2FsayB0aGUgY2hhaW46IG92ZXJ2aWV3IFx1MjE5MiBmaXJzdCBwYWdlIFx1MjE5MiBuZXh0IFx1MjE5MiBuZXh0IFx1MjE5MiBcdTIwMjZcbiAgY29uc3QgY2hhaW46IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHZpc2l0ZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgcHVzaCA9IChwOiBzdHJpbmcgfCB1bmRlZmluZWQpOiB2b2lkID0+IHtcbiAgICBpZiAocCAmJiAhdmlzaXRlZC5oYXMocCkpIHtcbiAgICAgIHZpc2l0ZWQuYWRkKHApO1xuICAgICAgY2hhaW4ucHVzaChwKTtcbiAgICB9XG4gIH07XG4gIHB1c2gob3ZlcnZpZXcpO1xuICBwdXNoKGZpcnN0UGFnZSk7XG4gIGxldCBjdXIgPSBmaXJzdFBhZ2U7XG4gIHdoaWxlIChjdXIpIHtcbiAgICBjb25zdCBuZXh0ID0gZ2V0TGlua3MoY3VyKVsxXTtcbiAgICBpZiAoIW5leHQgfHwgdmlzaXRlZC5oYXMobmV4dCkpIGJyZWFrOyAvLyBlbmQgb2YgZGVjayBvciBjeWNsZSBndWFyZFxuICAgIHB1c2gobmV4dCk7XG4gICAgY3VyID0gbmV4dDtcbiAgfVxuXG4gIGNvbnN0IGluZGV4ID0gY2hhaW4uaW5kZXhPZihjdXJyZW50UGF0aCk7XG4gIGlmIChpbmRleCA9PT0gLTEpIHJldHVybiBudWxsO1xuICByZXR1cm4geyBjaGFpbiwgaW5kZXggfTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHVwIHRvIGBtYXhgIG5vdGUgbmFtZXMgZnJvbSBhIGBkZWNrYCBwcm9wZXJ0eSB2YWx1ZS5cbiAqIEFjY2VwdHMgYSBzaW5nbGUgc3RyaW5nIG9yIGEgWUFNTCBsaXN0IG9mIHN0cmluZ3M7IHVucXVvdGVkIFtbeF1dIHZhbHVlcyBhcmVcbiAqIHBhcnNlZCBieSBZQU1MIGFzIG5lc3RlZCBhcnJheXMgYW5kIGZsYXR0ZW5lZCBoZXJlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdExpbmtzKHZhbHVlOiB1bmtub3duLCBtYXg6IG51bWJlciA9IE1BWF9ERUNLX0xJTktTKTogc3RyaW5nW10ge1xuICBjb25zdCBmbGF0OiB1bmtub3duW10gPSBbXTtcbiAgY29uc3QgY29sbGVjdCA9ICh2OiB1bmtub3duKTogdm9pZCA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB2KSBjb2xsZWN0KGl0ZW0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBmbGF0LnB1c2godik7XG4gICAgfVxuICB9O1xuICBjb2xsZWN0KHZhbHVlKTtcblxuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIGZvciAoY29uc3QgaXRlbSBvZiBmbGF0KSB7XG4gICAgY29uc3QgbmFtZSA9IGV4dHJhY3RMaW5rVGV4dChpdGVtKTtcbiAgICBpZiAobmFtZSkgb3V0LnB1c2gobmFtZSk7XG4gICAgaWYgKG91dC5sZW5ndGggPj0gbWF4KSBicmVhaztcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdXAgdG8gYG1heGAgcmF3IGxpbmsgc3RyaW5ncyBmcm9tIGEgYGRlY2tgIHByb3BlcnR5IHZhbHVlIFx1MjAxNCB0aGVcbiAqIHRyaW1tZWQgdmFsdWVzIGV4YWN0bHkgYXMgd3JpdHRlbiAoYWxpYXMgLyBwYXRoIGZvcm1zIHByZXNlcnZlZCkuIFNhbWVcbiAqIGZsYXR0ZW5pbmcgcnVsZXMgYXMgZXh0cmFjdExpbmtzKCksIGJ1dCB3aXRob3V0IGV4dHJhY3RpbmcgdGhlIHRhcmdldCBuYW1lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFJhd0xpbmtzKHZhbHVlOiB1bmtub3duLCBtYXg6IG51bWJlciA9IE1BWF9ERUNLX0xJTktTKTogc3RyaW5nW10ge1xuICBjb25zdCBmbGF0OiB1bmtub3duW10gPSBbXTtcbiAgY29uc3QgY29sbGVjdCA9ICh2OiB1bmtub3duKTogdm9pZCA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB2KSBjb2xsZWN0KGl0ZW0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBmbGF0LnB1c2godik7XG4gICAgfVxuICB9O1xuICBjb2xsZWN0KHZhbHVlKTtcblxuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIGZvciAoY29uc3QgaXRlbSBvZiBmbGF0KSB7XG4gICAgaWYgKHR5cGVvZiBpdGVtICE9PSBcInN0cmluZ1wiKSBjb250aW51ZTtcbiAgICBjb25zdCB0cmltbWVkID0gaXRlbS50cmltKCk7XG4gICAgaWYgKCF0cmltbWVkKSBjb250aW51ZTtcbiAgICBvdXQucHVzaCh0cmltbWVkKTtcbiAgICBpZiAob3V0Lmxlbmd0aCA+PSBtYXgpIGJyZWFrO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgdGFyZ2V0IG5vdGUgbmFtZSBmcm9tIGEgbWFya2Rvd24gbGluayBzdHJpbmcuXG4gKiBIYW5kbGVzIHNldmVyYWwgc2hhcGVzOlxuICogICBcIltbc2xpZGUtMl1dXCIgICAgICAgIFx1MjE5MiBzbGlkZS0yXG4gKiAgIFwiW1tzbGlkZS0yfGFsaWFzXV1cIiAgXHUyMTkyIHNsaWRlLTJcbiAqICAgXCJbW3NsaWRlLTIjc2VjdGlvbl1dXCJcdTIxOTIgc2xpZGUtMlxuICogICBzbGlkZS0yICAgICAgICAgICAgICBcdTIxOTIgc2xpZGUtMiAoYmFyZSBmaWxlbmFtZSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RMaW5rVGV4dCh2YWx1ZTogdW5rbm93bik6IHN0cmluZyB8IG51bGwge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgdHJpbW1lZCA9IHZhbHVlLnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHRyaW1tZWQucmVwbGFjZSgvXlxcW1xcWy8sIFwiXCIpLnJlcGxhY2UoL1xcXVxcXSQvLCBcIlwiKS5zcGxpdChcInxcIilbMF0uc3BsaXQoXCIjXCIpWzBdLnRyaW0oKTtcbn1cblxuLyoqIFJlbmRlciBhIHByb3BlcnR5IHZhbHVlIGFzIHJlYWRhYmxlIHRleHQ6IGFycmF5cy9vYmplY3RzIFx1MjE5MiBKU09OLCBlbHNlIFN0cmluZyAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFZhbHVlKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybiBcIlx1MjAxNFwiO1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSk7XG59XG4iLCAiLyoqXG4gKiBjcmVhdGVOZXh0LnRzIFx1MjAxNCBQdXJlIFwiQ3JlYXRlIE5leHQgU2xpZGVcIiBwbGFubmluZyBjb3JlIGZvciBuYXRpdmUtc2xpZGVzLlxuICpcbiAqIEV2ZXJ5dGhpbmcgaW4gdGhpcyBtb2R1bGUgaXMgZnJlZSBvZiBPYnNpZGlhbiBydW50aW1lIGRlcGVuZGVuY2llcyBzbyBpdCBjYW5cbiAqIGJlIHVuaXQgdGVzdGVkIGRpcmVjdGx5IChzZWUgdGVzdC9jcmVhdGVOZXh0LnRlc3QudHMpLiBtYWluLnRzIGFkYXB0cyB0aGVcbiAqIHZhdWx0IChtZXRhZGF0YUNhY2hlLCBjb21wdXRlRGVjaykgdG8gdGhpcyBwdXJlIGludGVyZmFjZSBhbmQgYXBwbGllcyB0aGVcbiAqIHJlc3VsdGluZyBwbGFuIHdpdGggdmF1bHQuY3JlYXRlKCkgKyBmaWxlTWFuYWdlci5wcm9jZXNzRnJvbnRNYXR0ZXIoKS5cbiAqXG4gKiBUaGUgcGxhbiBkZWNpZGVzLCBmb3IgdGhlIGN1cnJlbnQgbm90ZTpcbiAqICAgLSB0aGUgbmFtZSBvZiB0aGUgbmV3IHNsaWRlIGZpbGUgKGNvbGxpc2lvbi1hd2FyZSksXG4gKiAgIC0gdGhlIHJhdyBgZGVja2AgbGluayB0ZXh0cyBvZiB0aGUgbmV3IG5vdGUsXG4gKiAgIC0gdGhlIHJld3JpdGVzIG5lZWRlZCBvbiBleGlzdGluZyBub3RlcyAoaW4gcHJhY3RpY2UgYWx3YXlzIHRoZSBjdXJyZW50XG4gKiAgICAgbm90ZSBpdHNlbGYpLlxuICovXG5cbmltcG9ydCB7IGV4dHJhY3RMaW5rVGV4dCB9IGZyb20gXCIuL2RlY2tcIjtcblxuLyoqIElucHV0cyBmb3IgcGxhbm5pbmcgXHUyMDE0IHJlc29sdmVkIGJ5IHRoZSBhZGFwdGVyIGluIG1haW4udHMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlTmV4dElucHV0IHtcbiAgLyoqIEJhc2VuYW1lICh3aXRob3V0IGV4dGVuc2lvbikgb2YgdGhlIGN1cnJlbnQgbm90ZSAqL1xuICBjdXJyZW50TmFtZTogc3RyaW5nO1xuICAvKiogUmF3IGBkZWNrYCBsaW5rIHRleHRzIG9mIHRoZSBjdXJyZW50IG5vdGUgKGV4dHJhY3RlZCwgdXAgdG8gdHdvKSAqL1xuICBjdXJyZW50TGlua3M6IHN0cmluZ1tdO1xuICAvKiogVHJ1ZSB3aGVuIHRoZSBjdXJyZW50IG5vdGUgSVMgdGhlIGRlY2sncyBvdmVydmlldyBwYWdlIChjaGFpbiBpbmRleCAwKSAqL1xuICBpc092ZXJ2aWV3OiBib29sZWFuO1xuICAvKipcbiAgICogUmF3IGxpbmsgdGV4dCB0aGUgb2xkIGZpcnN0IHBhZ2UgdXNlcyB0byBsaW5rIGJhY2sgdG8gdGhlIG92ZXJ2aWV3LlxuICAgKiBPbmx5IG1lYW5pbmdmdWwgZm9yIG92ZXJ2aWV3IGluc2VydGlvbiAodGhlIG92ZXJ2aWV3IGl0c2VsZiBvbmx5IGxpbmtzXG4gICAqIGZvcndhcmQsIHNvIGl0cyBvd24gZnJvbnRtYXR0ZXIgY29udGFpbnMgbm8gc2VsZi1yZWZlcmVuY2UpLlxuICAgKi9cbiAgb3ZlcnZpZXdCYWNrTGluaz86IHN0cmluZztcbiAgLyoqIEJhc2VuYW1lcyBvZiBldmVyeSBtYXJrZG93biBub3RlIGluIHRoZSB2YXVsdCAoY29sbGlzaW9uLWZyZWUgbmFtaW5nKSAqL1xuICBleGlzdGluZ05hbWVzOiBTZXQ8c3RyaW5nPjtcbn1cblxuLyoqIE9uZSBub3RlIHdob3NlIGBkZWNrYCBwcm9wZXJ0eSBtdXN0IGJlIHJld3JpdHRlbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWNrUmV3cml0ZSB7XG4gIC8qKiBCYXNlbmFtZSBvZiB0aGUgbm90ZSB0byByZXdyaXRlICovXG4gIG5hbWU6IHN0cmluZztcbiAgLyoqIFRoZSBuZXcgcmF3IGBkZWNrYCBsaW5rIHRleHRzIChzZXJpYWxpemVkIGFzIGEgWUFNTCBsaXN0KSAqL1xuICBkZWNrOiBzdHJpbmdbXTtcbn1cblxuLyoqIFRoZSBmdWxsIHBsYW4gZm9yIGNyZWF0aW5nIG9uZSBuZXcgc2xpZGUgKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlTmV4dFJlc3VsdCB7XG4gIC8qKiBCYXNlbmFtZSAod2l0aG91dCBleHRlbnNpb24pIG9mIHRoZSBuZXcgc2xpZGUgZmlsZSAqL1xuICBuZXdOYW1lOiBzdHJpbmc7XG4gIC8qKiBSYXcgYGRlY2tgIGxpbmsgdGV4dHMgZm9yIHRoZSBuZXcgbm90ZSdzIGZyb250bWF0dGVyICovXG4gIG5ld0RlY2tMaW5rczogc3RyaW5nW107XG4gIC8qKiBSZXdyaXRlcyB0byBhcHBseSB0byBleGlzdGluZyBub3RlcyAoaW4gcHJhY3RpY2UgYWx3YXlzIHRoZSBjdXJyZW50IG5vdGUpICovXG4gIHJld3JpdGVzOiBEZWNrUmV3cml0ZVtdO1xufVxuXG4vKipcbiAqIFBsYW4gdGhlIGNyZWF0aW9uIG9mIGEgbmV3IHNsaWRlIGFmdGVyIHRoZSBjdXJyZW50IG5vdGUuXG4gKlxuICogQmVoYXZpb3JzOlxuICogICAtIExhc3Qgc2xpZGUgKG5vIHNlY29uZCBsaW5rKTogYXBwZW5kIGA8Y3VycmVudD4tbmV4dGAgYXMgdGhlIG5ldyBsYXN0XG4gKiAgICAgc2xpZGU7IHRoZSBjdXJyZW50IG5vdGUgZ2FpbnMgdGhlIHNlY29uZCBsaW5rLlxuICogICAtIFNsaWRlIHdpdGggYSB2YWxpZCBuZXh0OiBpbnNlcnQgYDxjdXJyZW50Pi1uZXh0YCBiZXR3ZWVuIHRoZW07IHRoZSBuZXdcbiAqICAgICBub3RlIHRha2VzIG92ZXIgdGhlIG9sZCBuZXh0IGxpbmsuXG4gKiAgIC0gU2xpZGUgd2hvc2Ugc2Vjb25kIGxpbmsgaXMgYnJva2VuIChwbGFpbiwgbm9uLWV4aXN0aW5nIG5hbWUpOiBjcmVhdGVcbiAqICAgICBleGFjdGx5IHRoZSBkZWNsYXJlZCBtaXNzaW5nIG5vdGUgYXMgdGhlIG5ldyBsYXN0IHNsaWRlIFx1MjAxNCB0aGUgXHUyNkEwIHdhcm5pbmdcbiAqICAgICBkaXNhcHBlYXJzIGFuZCB0aGUgYXV0aG9yJ3MgaW50ZW50IGlzIGhvbm91cmVkLiBBIGJyb2tlbiBsaW5rIHRoYXQgaXNcbiAqICAgICBub3QgYSBwbGFpbiBiYXNlbmFtZSAocGF0aC1xdWFsaWZpZWQsIHNlbGYtcmVmZXJlbmNpbmcpIGlzIHRyZWF0ZWQgYXNcbiAqICAgICBpbnZhbGlkIGFuZCBkcm9wcGVkIChhcHBlbmQgYSBgPGN1cnJlbnQ+LW5leHRgIGxhc3Qgc2xpZGUgaW5zdGVhZCkuXG4gKiAgIC0gT3ZlcnZpZXcgcGFnZSAoc2luZ2xlIGxpbmsgPSBmaXJzdCBwYWdlKTogaW5zZXJ0IGEgbmV3IGZpcnN0IHBhZ2U7IHRoZVxuICogICAgIG92ZXJ2aWV3J3MgbGluayBwb2ludHMgdG8gaXQgYW5kIHRoZSBvbGQgZmlyc3QgcGFnZSBpcyBwdXNoZWQgYmFjay5cbiAqXG4gKiBSZXR1cm5zIG51bGwgd2hlbiB0aGUgbm90ZSBoYXMgbm8gdXNhYmxlIGBkZWNrYCBsaW5rcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBsYW5DcmVhdGVOZXh0KGlucHV0OiBDcmVhdGVOZXh0SW5wdXQpOiBDcmVhdGVOZXh0UmVzdWx0IHwgbnVsbCB7XG4gIGNvbnN0IHsgY3VycmVudE5hbWUsIGN1cnJlbnRMaW5rcywgaXNPdmVydmlldyB9ID0gaW5wdXQ7XG4gIGlmIChjdXJyZW50TGlua3MubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICAvLyBcdTI1MDBcdTI1MDAgT3ZlcnZpZXcgcGFnZTogaW5zZXJ0IGEgbmV3IGZpcnN0IHBhZ2UgYWZ0ZXIgaXQgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGlmIChpc092ZXJ2aWV3KSB7XG4gICAgY29uc3Qgb2xkRmlyc3QgPSBjdXJyZW50TGlua3NbMF07XG4gICAgaWYgKCFvbGRGaXJzdCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgbmV3TmFtZSA9IHVuaXF1ZU5hbWUoYCR7Y3VycmVudE5hbWV9LW5leHRgLCBpbnB1dC5leGlzdGluZ05hbWVzKTtcbiAgICBjb25zdCBiYWNrID0gaW5wdXQub3ZlcnZpZXdCYWNrTGluayA/PyBgW1ske2N1cnJlbnROYW1lfV1dYDtcbiAgICByZXR1cm4ge1xuICAgICAgbmV3TmFtZSxcbiAgICAgIG5ld0RlY2tMaW5rczogW2JhY2ssIG9sZEZpcnN0XSxcbiAgICAgIHJld3JpdGVzOiBbeyBuYW1lOiBjdXJyZW50TmFtZSwgZGVjazogW2BbWyR7bmV3TmFtZX1dXWBdIH1dLFxuICAgIH07XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU2xpZGU6IGZpcnN0IGxpbmsgaXMgdGhlIG92ZXJ2aWV3IHBhZ2UgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IG92ZXJ2aWV3TGluayA9IGN1cnJlbnRMaW5rc1swXTtcbiAgaWYgKCFvdmVydmlld0xpbmspIHJldHVybiBudWxsO1xuICBjb25zdCBuZXh0TGluayA9IGN1cnJlbnRMaW5rc1sxXTtcblxuICBpZiAobmV4dExpbmspIHtcbiAgICBjb25zdCBuZXh0TmFtZSA9IGV4dHJhY3RMaW5rVGV4dChuZXh0TGluayk7XG4gICAgaWYgKG5leHROYW1lICYmIGlzUGxhaW5OYW1lKG5leHROYW1lKSAmJiBuZXh0TmFtZSAhPT0gY3VycmVudE5hbWUpIHtcbiAgICAgIGlmICghaW5wdXQuZXhpc3RpbmdOYW1lcy5oYXMobmV4dE5hbWUpKSB7XG4gICAgICAgIC8vIFRoZSBkZWNsYXJlZCBuZXh0IG5vdGUgZG9lcyBub3QgZXhpc3QgeWV0IFx1MjE5MiBjcmVhdGUgZXhhY3RseSB0aGF0XG4gICAgICAgIC8vIG5vdGUgKGZpeGVzIHRoZSBicm9rZW4tbGluayB3YXJuaW5nLCBob25vdXJzIHRoZSBhdXRob3IncyBpbnRlbnQpLlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5ld05hbWU6IG5leHROYW1lLFxuICAgICAgICAgIG5ld0RlY2tMaW5rczogW292ZXJ2aWV3TGlua10sXG4gICAgICAgICAgcmV3cml0ZXM6IFtdLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgLy8gQSB2YWxpZCBuZXh0IG5vdGUgZXhpc3RzIFx1MjE5MiBpbnNlcnQgYmV0d2VlbiBpdCBhbmQgdGhlIGN1cnJlbnQgbm90ZS5cbiAgICAgIGNvbnN0IG5ld05hbWUgPSB1bmlxdWVOYW1lKGAke2N1cnJlbnROYW1lfS1uZXh0YCwgaW5wdXQuZXhpc3RpbmdOYW1lcyk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBuZXdOYW1lLFxuICAgICAgICBuZXdEZWNrTGlua3M6IFtvdmVydmlld0xpbmssIG5leHRMaW5rXSxcbiAgICAgICAgcmV3cml0ZXM6IFt7IG5hbWU6IGN1cnJlbnROYW1lLCBkZWNrOiBbb3ZlcnZpZXdMaW5rLCBgW1ske25ld05hbWV9XV1gXSB9XSxcbiAgICAgIH07XG4gICAgfVxuICAgIC8vIEludmFsaWQgKHBhdGgtcXVhbGlmaWVkIC8gc2VsZi1yZWZlcmVuY2luZykgbmV4dCBsaW5rIFx1MjE5MiBkcm9wIGl0IGFuZFxuICAgIC8vIGFwcGVuZCBhIG5ldyBsYXN0IHNsaWRlIChmYWxsIHRocm91Z2ggdG8gdGhlIG5vLW5leHQgYnJhbmNoKS5cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBMYXN0IHNsaWRlIFx1MjE5MiBhcHBlbmQgYSBuZXcgbGFzdCBzbGlkZSBhZnRlciBpdCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3QgbmV3TmFtZSA9IHVuaXF1ZU5hbWUoYCR7Y3VycmVudE5hbWV9LW5leHRgLCBpbnB1dC5leGlzdGluZ05hbWVzKTtcbiAgcmV0dXJuIHtcbiAgICBuZXdOYW1lLFxuICAgIG5ld0RlY2tMaW5rczogW292ZXJ2aWV3TGlua10sXG4gICAgcmV3cml0ZXM6IFt7IG5hbWU6IGN1cnJlbnROYW1lLCBkZWNrOiBbb3ZlcnZpZXdMaW5rLCBgW1ske25ld05hbWV9XV1gXSB9XSxcbiAgfTtcbn1cblxuLyoqIEEgbmFtZSB1c2FibGUgYXMgYSB2YXVsdCBub3RlIG5hbWU6IG5vIHBhdGggc2VwYXJhdG9ycywgbm9uLWVtcHR5ICovXG5mdW5jdGlvbiBpc1BsYWluTmFtZShuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIG5hbWUubGVuZ3RoID4gMCAmJiAhbmFtZS5pbmNsdWRlcyhcIi9cIikgJiYgIW5hbWUuaW5jbHVkZXMoXCJcXFxcXCIpO1xufVxuXG4vKiogRmlyc3QgZnJlZSBuYW1lIGluIHRoZSBmYW1pbHkgYGJhc2VgLCBgYmFzZS0yYCwgYGJhc2UtM2AsIFx1MjAyNiAqL1xuZnVuY3Rpb24gdW5pcXVlTmFtZShiYXNlOiBzdHJpbmcsIGV4aXN0aW5nOiBTZXQ8c3RyaW5nPik6IHN0cmluZyB7XG4gIGlmICghZXhpc3RpbmcuaGFzKGJhc2UpKSByZXR1cm4gYmFzZTtcbiAgZm9yIChsZXQgaSA9IDI7IDsgaSsrKSB7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gYCR7YmFzZX0tJHtpfWA7XG4gICAgaWYgKCFleGlzdGluZy5oYXMoY2FuZGlkYXRlKSkgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgfVxufVxuIiwgImltcG9ydCB7IFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIE5hdGl2ZVNsaWRlc1BsdWdpbiBmcm9tIFwiLi4vbWFpblwiO1xuXG4vKiogU2V0dGluZ3MgdGFiOiB0b2dnbGVzIHRoZSBuYXYgYnV0dG9ucywgcGFnZSBudW1iZXIsIGF1dG8tZW50ZXIgYW5kIGJhciB2aXNpYmlsaXR5LiAqL1xuZXhwb3J0IGNsYXNzIE5hdGl2ZVNsaWRlc1NldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBwbHVnaW46IE5hdGl2ZVNsaWRlc1BsdWdpbikge1xuICAgIHN1cGVyKHBsdWdpbi5hcHAsIHBsdWdpbik7XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJOYXRpdmUgU2xpZGVzIFx1MDBCNyBTZXR0aW5nc1wiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlNob3cgUHJldmlvdXMvTmV4dCBidXR0b25zXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJTaG93IFx1MjVDMCBcdTI1QjYgYnV0dG9ucyBvbiB0aGUgbGVmdCBvZiB0aGUgc2xpZGVzIGJhciB3aGVuIHRoZSBub3RlIGJlbG9uZ3MgdG8gYSBkZWNrIChoYXMgYSBgZGVja2AgcHJvcGVydHkpXCIsXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93TmF2QnV0dG9ucykub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd05hdkJ1dHRvbnMgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJTaG93IHBhZ2UgbnVtYmVyXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJBdXRvLWNvbXB1dGVkIGZyb20gdGhlIGRlY2sgY2hhaW4gKG92ZXJ2aWV3IHBhZ2Ugc2hvd3MgXHUyMDFDT3ZlcnZpZXdcdTIwMUQpOyBzaG93biBhdCB0aGUgYm90dG9tLXJpZ2h0XCIsXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93UGFnZU51bWJlcikub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1BhZ2VOdW1iZXIgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJBdXRvLWVudGVyIFNsaWRlcyBtb2RlXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJPcGVuIGRlY2sgbm90ZXMgZGlyZWN0bHkgaW4gU2xpZGVzIG1vZGUuIExlYXZlIG9mZiB0byBlbnRlciBtYW51YWxseSB3aXRoIHRoZSBUb2dnbGUgU2xpZGVzIE1vZGUgY29tbWFuZCAoTW9kK1NoaWZ0K0UpIG9yIHRoZSBwcmV2aW91cy9uZXh0IHBhZ2UgaG90a2V5cy5cIixcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9FbnRlclNsaWRlcykub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b0VudGVyU2xpZGVzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU2xpZGVzIHRpdGxlXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJGcm9udG1hdHRlciBwcm9wZXJ0eSB0byBzaG93IGFzIHRoZSBjYXJkIHRpdGxlIChIMSkuIExlYXZlIGVtcHR5IGZvciBub25lOyB0eXBlIGBmaWxlbmFtZWAgdG8gdXNlIHRoZSBmaWxlIG5hbWUuXCIsXG4gICAgICApXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcImUuZy4gdGl0bGVcIilcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2xpZGVzVGl0bGUpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2xpZGVzVGl0bGUgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJOYXZpZ2F0aW9uIGhvdGtleXNcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkRlZmF1bHQ6IFByZXZpb3VzIFBhZ2UgTW9kK1NoaWZ0K1x1MjE5MCwgTmV4dCBQYWdlIE1vZCtTaGlmdCtcdTIxOTIuIFJlYmluZCB1bmRlciBTZXR0aW5ncyBcdTIxOTIgSG90a2V5cy5cIixcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoXCJPcGVuIEhvdGtleXMgU2V0dGluZ3NcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgLy8gT3BlbiBPYnNpZGlhbidzIGhvdGtleXMgc2V0dGluZ3MgcGFnZSAoaW50ZXJuYWwgQVBJOyBpZ25vcmUgZmFpbHVyZXMpXG4gICAgICAgICAgKFxuICAgICAgICAgICAgdGhpcy5hcHAgYXMgdW5rbm93biBhcyB7IHNldHRpbmc/OiB7IG9wZW5UYWJCeUlkPzogKGlkOiBzdHJpbmcpID0+IHZvaWQgfSB9XG4gICAgICAgICAgKS5zZXR0aW5nPy5vcGVuVGFiQnlJZD8uKFwiaG90a2V5c1wiKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICB9XG59XG4iLCAiLyoqIFJlbW92ZSBhbGwgY2hpbGRyZW4gb2YgYW4gZWxlbWVudCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyQ2hpbGRyZW4oZWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIHdoaWxlIChlbC5maXJzdENoaWxkKSBlbC5yZW1vdmVDaGlsZChlbC5maXJzdENoaWxkKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQXdCQSxJQUFBQSxtQkFBNEM7OztBQ3ZCckMsU0FBUyxZQUF5QjtBQUN2QyxRQUFNLE1BQU0sU0FBUyxjQUFjLEtBQUs7QUFDeEMsTUFBSSxZQUFZO0FBQ2hCLE1BQUksTUFBTSxVQUFVO0FBQ3BCLFNBQU87QUFDVDtBQUdPLFNBQVMsVUFDZCxPQUNBLEtBQ0EsU0FDQSxXQUFXLE9BQ1E7QUFDbkIsUUFBTSxNQUFNLFNBQVMsY0FBYyxRQUFRO0FBQzNDLE1BQUksWUFBWTtBQUNoQixNQUFJLGNBQWM7QUFDbEIsTUFBSSxRQUFRO0FBQ1osTUFBSSxXQUFXO0FBQ2YsTUFBSSxDQUFDLFNBQVUsS0FBSSxpQkFBaUIsU0FBUyxPQUFPO0FBQ3BELFNBQU87QUFDVDtBQVFPLFNBQVMsaUJBQWlCLFFBQXdCO0FBQ3ZELFFBQU0sU0FBUyxTQUFTO0FBQUEsSUFDdEI7QUFBQSxFQUNGO0FBQ0EsTUFBSSxVQUFVLE9BQU8sZUFBZSxFQUFHLFVBQVMsT0FBTztBQUN2RCxNQUFJLFNBQVMsR0FBRztBQUNkLGFBQVMsZ0JBQWdCLE1BQU0sWUFBWSxpQ0FBaUMsR0FBRyxNQUFNLElBQUk7QUFBQSxFQUMzRixPQUFPO0FBRUwsYUFBUyxnQkFBZ0IsTUFBTSxlQUFlLCtCQUErQjtBQUFBLEVBQy9FO0FBQ0EsU0FBTztBQUNUOzs7QUMxQ0EsSUFBQUMsbUJBQWlEOzs7QUNBakQsc0JBQXlDO0FBR2xDLFNBQVMsWUFBWSxLQUFxQztBQUMvRCxRQUFNLE9BQU8sSUFBSSxVQUFVLG9CQUFvQiw0QkFBWTtBQUMzRCxTQUFPLE9BQVEsS0FBSyxRQUFRLElBQTZCO0FBQzNEO0FBUU8sU0FBUyxjQUFjLEtBQW1CO0FBQy9DLFFBQU0sT0FBTyxJQUFJLFVBQVUsb0JBQW9CLDRCQUFZO0FBQzNE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QVUsSUFDM0UsQ0FBQztBQUVMLGVBQVcsQ0FBQyxLQUFLLEtBQUssS0FBSyxTQUFTO0FBQ2xDLFlBQU0sT0FBTyxTQUFTLGNBQWMsTUFBTTtBQUMxQyxXQUFLLFlBQVk7QUFDakIsWUFBTSxJQUFJLFNBQVMsY0FBYyxRQUFRO0FBQ3pDLFFBQUUsY0FBYztBQUNoQixXQUFLLFlBQVksQ0FBQztBQUNsQixXQUFLLFlBQVksU0FBUyxlQUFlLE9BQU8sWUFBWSxLQUFLLENBQUMsQ0FBQztBQUNuRSxXQUFLLElBQUksWUFBWSxJQUFJO0FBQUEsSUFDM0I7QUFHQSxVQUFNLFNBQVMsT0FBTyxLQUFLLFlBQVksT0FBTyxJQUFJLElBQUksQ0FBQztBQUN2RCxRQUFJLE9BQU8sU0FBUyxHQUFHO0FBQ3JCLFlBQU0sT0FBTyxTQUFTLGNBQWMsTUFBTTtBQUMxQyxXQUFLLFlBQVk7QUFDakIsV0FBSyxjQUFjLFlBQU8sT0FBTyxLQUFLLElBQUk7QUFDMUMsV0FBSyxRQUFRO0FBQ2IsV0FBSyxJQUFJLFlBQVksSUFBSTtBQUFBLElBQzNCO0FBR0EsUUFBSSxLQUFLLFNBQVMsa0JBQWtCLE1BQU07QUFDeEMsWUFBTSxPQUFPLFNBQVMsY0FBYyxNQUFNO0FBQzFDLFdBQUssWUFBWTtBQUVqQixXQUFLLGNBQWMsS0FBSyxVQUFVLElBQUksYUFBYSxRQUFRLEtBQUssS0FBSztBQUNyRSxXQUFLLElBQUksWUFBWSxJQUFJO0FBQUEsSUFDM0I7QUFJQSxTQUFLLElBQUksTUFBTSxVQUFVLEtBQUssSUFBSSxzQkFBc0IsSUFBSSxTQUFTO0FBQUEsRUFDdkU7QUFDRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAibmV3TmFtZSIsICJpbXBvcnRfb2JzaWRpYW4iXQp9Cg==
