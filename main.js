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
  autoEnterSlides: false
};
var DECK_KEY = "deck";

// src/commands.ts
function registerCommands(plugin) {
  plugin.addCommand({
    id: "ns-toggle-bar",
    name: "Toggle Properties Bar",
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
      "Show \u25C0 \u25B6 buttons on the left of the bar when the note belongs to a deck (has a `deck` property)"
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
function lockScroller(el) {
  const noop = () => {
  };
  el.scrollTo = noop;
  el.scrollBy = noop;
  el.scrollIntoView = noop;
  Object.defineProperty(el, "scrollTop", { get: () => 0, set: noop, configurable: true });
  Object.defineProperty(el, "scrollLeft", { get: () => 0, set: noop, configurable: true });
}
function unlockScroller(el) {
  const anyEl = el;
  delete anyEl.scrollTo;
  delete anyEl.scrollBy;
  delete anyEl.scrollIntoView;
  delete anyEl.scrollTop;
  delete anyEl.scrollLeft;
}

// main.ts
var NativeSlidesPlugin = class extends import_obsidian5.Plugin {
  constructor() {
    super(...arguments);
    /** The properties bar DOM element */
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
    /** Last measured tab-bar height (px) — cached while the bar is hidden */
    this.tabBarHeight = 0;
    /** Editor scroller currently pinned to one screen (null when unpinned) */
    this.pinnedScroller = null;
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
    this.bar = createBar();
    document.body.appendChild(this.bar);
    this.refresh();
  }
  onunload() {
    this.bar?.remove();
    this.bar = null;
    if (this.pinnedScroller) {
      unlockScroller(this.pinnedScroller);
      this.pinnedScroller = null;
    }
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
  /**
   * Pin (or unpin) the active editor's scroller so Slides mode is exactly one
   * screen: no manual scroll and no CodeMirror programmatic scrollIntoView
   * (edit / drag-select). Unpinned when leaving Slides mode so native modes
   * scroll normally.
   */
  syncScrollerPin(slides) {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
    const scroller = slides ? view?.contentEl.querySelector(".cm-scroller") ?? null : null;
    if (scroller === this.pinnedScroller) return;
    if (this.pinnedScroller) unlockScroller(this.pinnedScroller);
    if (scroller) lockScroller(scroller);
    this.pinnedScroller = scroller;
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
  /** Decide what the bar shows, then re-render it */
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
    this.syncScrollerPin(slides);
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
    const btn = document.createElement("button");
    btn.className = "native-slides-mode-btn is-active";
    btn.textContent = "Slides: On";
    btn.title = "Exit Slides mode (back to your previous view)";
    btn.addEventListener("click", () => this.toggleSlides());
    this.bar.appendChild(btn);
    if (this.settings.showPageNumber && deck) {
      const page = document.createElement("span");
      page.className = "native-slides-page";
      page.textContent = deck.index === 0 ? "Overview" : `Page ${deck.index}`;
      this.bar.appendChild(page);
    }
    this.bar.style.display = this.bar.childElementCount === 0 ? "none" : "";
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvYmFyLnRzIiwgInNyYy9kZWJ1Zy50cyIsICJzcmMvbW9kZS50cyIsICJzcmMvdHlwZXMudHMiLCAic3JjL2NvbW1hbmRzLnRzIiwgInNyYy9kZWNrLXNlcnZpY2UudHMiLCAic3JjL2RlY2sudHMiLCAic3JjL2NyZWF0ZU5leHQudHMiLCAic3JjL3NldHRpbmdzLnRzIiwgInNyYy91dGlscy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBuYXRpdmUtc2xpZGVzIFx1MjAxNCBhIFwiU2xpZGVzIG1vZGVcIiBmb3IgT2JzaWRpYW4gZGVjayBub3Rlc1xuICpcbiAqIE9uZSByZXNlcnZlZCBmcm9udG1hdHRlciBrZXksIGBkZWNrYCAodXAgdG8gdHdvIG1hcmtkb3duIGxpbmtzKSwgZHJpdmVzXG4gKiBwcmV2L25leHQgbmF2aWdhdGlvbiBhbmQgYXV0by1jb21wdXRlZCBwYWdlIG51bWJlcnMuIEEgZGVjayBub3RlIGNhbiBiZVxuICogZW50ZXJlZCBpbnRvICoqU2xpZGVzIG1vZGUqKiBcdTIwMTQgYW4gaW1tZXJzaXZlLCBlZGl0YWJsZSAoTGl2ZSBQcmV2aWV3KSB2aWV3XG4gKiB3aXRoIGEgYm90dG9tIGJhciBzaG93aW5nIHByb3BlcnRpZXMsIG5hdmlnYXRpb24gYW5kIHRoZSBwYWdlIG51bWJlci5cbiAqXG4gKiBOYXRpdmUgT2JzaWRpYW4gbW9kZXMgKFNvdXJjZSAvIGRlZmF1bHQgTGl2ZSBQcmV2aWV3IC8gUmVhZGluZyB2aWV3KSBhcmVcbiAqIGxlZnQgY29tcGxldGVseSB1bnRvdWNoZWQ6IG5vIHN0YXR1cy1iYXIgaGlkaW5nLCBubyBib3R0b20gYmFyLCBub1xuICogZnVsbHNjcmVlbiwgbm8gc3R5bGluZy4gU2xpZGVzIG1vZGUgaXMgdGhlIHBsdWdpbidzIG9ubHkgc3VyZmFjZS5cbiAqXG4gKiBUaGlzIGZpbGUgaXMgdGhlIGVudHJ5IHBvaW50IGFuZCBhIHRoaW4gb3JjaGVzdHJhdGlvbiBsYXllcjsgdGhlIGxvZ2ljXG4gKiBsaXZlcyBpbiBgc3JjL2A6XG4gKiAgIC0gc3JjL3R5cGVzLnRzICAgICAgICBzZXR0aW5ncyBzaGFwZSArIGRlZmF1bHRzICsgcmVzZXJ2ZWQgYGRlY2tgIGtleVxuICogICAtIHNyYy9tb2RlLnRzICAgICAgICAgdmlldyBtb2RlIC8gZnJvbnRtYXR0ZXIgaGVscGVycyAocHVyZSwgYEFwcGAtYmFzZWQpXG4gKiAgIC0gc3JjL2RlY2stc2VydmljZS50cyBkZWNrIGNoYWluIHJlc29sdXRpb24gKyBcImNyZWF0ZSBuZXh0IHNsaWRlXCIgZ2x1ZVxuICogICAtIHNyYy9iYXIudHMgICAgICAgICAgYmFyIERPTSBoZWxwZXJzIChjcmVhdGUgLyBidXR0b25zIC8gdGFiLWJhciBtZWFzdXJlKVxuICogICAtIHNyYy9jb21tYW5kcy50cyAgICAgY29tbWFuZCByZWdpc3RyYXRpb24gKGRldi1nYXRlZCBkZWJ1ZyBjb21tYW5kKVxuICogICAtIHNyYy9zZXR0aW5ncy50cyAgICAgc2V0dGluZ3MgdGFiXG4gKiAgIC0gc3JjL2RlYnVnLnRzICAgICAgICB0eXBvZ3JhcGh5IG1lYXN1cmVtZW50IHRvb2xpbmcgKGRldiBidWlsZHMgb25seSlcbiAqICAgLSBzcmMvZGVjay50cyAgICAgICAgIHB1cmUgZGVjayBjb3JlICh3aXRoIHNyYy9jcmVhdGVOZXh0LnRzKVxuICovXG5cbmltcG9ydCB7IE1hcmtkb3duVmlldywgUGx1Z2luLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgY3JlYXRlQmFyLCBuYXZCdXR0b24sIHN5bmNUYWJCYXJIZWlnaHQgfSBmcm9tIFwiLi9zcmMvYmFyXCI7XG5pbXBvcnQgeyByZWdpc3RlckNvbW1hbmRzIH0gZnJvbSBcIi4vc3JjL2NvbW1hbmRzXCI7XG5pbXBvcnQgeyBEZWNrU2VydmljZSB9IGZyb20gXCIuL3NyYy9kZWNrLXNlcnZpY2VcIjtcbmltcG9ydCB7IGZvcm1hdFZhbHVlIH0gZnJvbSBcIi4vc3JjL2RlY2tcIjtcbmltcG9ydCB7IGFjdGl2ZUZyb250bWF0dGVyLCBjdXJyZW50TW9kZSwgZnJvbnRtYXR0ZXJPZiwgaXNMaXZlUHJldmlldyB9IGZyb20gXCIuL3NyYy9tb2RlXCI7XG5pbXBvcnQgeyBOYXRpdmVTbGlkZXNTZXR0aW5nVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBERUNLX0tFWSwgREVGQVVMVF9TRVRUSU5HUywgdHlwZSBOYXRpdmVTbGlkZXNTZXR0aW5ncyB9IGZyb20gXCIuL3NyYy90eXBlc1wiO1xuaW1wb3J0IHsgY2xlYXJDaGlsZHJlbiwgbG9ja1Njcm9sbGVyLCB1bmxvY2tTY3JvbGxlciB9IGZyb20gXCIuL3NyYy91dGlsc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBOYXRpdmVTbGlkZXNQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICAvKiogVGhlIHByb3BlcnRpZXMgYmFyIERPTSBlbGVtZW50ICovXG4gIGJhcjogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgLyoqIERlY2sgY2hhaW4gcmVzb2x1dGlvbiArIFwiY3JlYXRlIG5leHQgc2xpZGVcIiBnbHVlICovXG4gIGRlY2tTZXJ2aWNlITogRGVja1NlcnZpY2U7XG4gIC8qKiBQbHVnaW4gc2V0dGluZ3MgKi9cbiAgc2V0dGluZ3M6IE5hdGl2ZVNsaWRlc1NldHRpbmdzID0geyAuLi5ERUZBVUxUX1NFVFRJTkdTIH07XG5cbiAgLyoqIFdoZXRoZXIgU2xpZGVzIG1vZGUgaXMgY3VycmVudGx5IGFjdGl2ZSAoc2Vzc2lvbiBzdGF0ZSwgbm90IHBlcnNpc3RlZCkgKi9cbiAgcHJpdmF0ZSBzbGlkZXNNb2RlID0gZmFsc2U7XG4gIC8qKiBWaWV3IG1vZGUgdG8gcmVzdG9yZSB3aGVuIGxlYXZpbmcgU2xpZGVzIG1vZGUgKFwicHJldmlld1wiIHwgXCJzb3VyY2VcIikgKi9cbiAgcHJpdmF0ZSBleGl0TW9kZTogXCJwcmV2aWV3XCIgfCBcInNvdXJjZVwiID0gXCJzb3VyY2VcIjtcbiAgLyoqIFdoZXRoZXIgdGhlIGV4aXQgdmlldyB3YXMgU291cmNlIG1vZGUgKHRydWUpIHZzIExpdmUgUHJldmlldyAoZmFsc2UpICovXG4gIHByaXZhdGUgZXhpdFNvdXJjZSA9IGZhbHNlO1xuICAvKiogTGFzdCBub3RlIGF1dG8tZW50ZXJlZCBpbnRvIFNsaWRlcyBtb2RlIChwcmV2ZW50cyByZS1lbnRlcmluZyBhZnRlciBtYW51YWwgZXhpdCkgKi9cbiAgcHJpdmF0ZSBhdXRvRW50ZXJlZFBhdGggPSBcIlwiO1xuICAvKiogTGFzdCByZWZyZXNoIGtleSAoXCJwYXRofG1vZGVcIikgdG8gYXZvaWQgcG9pbnRsZXNzIHJlLXJlbmRlcnMgKi9cbiAgcHJpdmF0ZSBsYXN0S2V5ID0gXCJcIjtcbiAgLyoqIExhc3QgbWVhc3VyZWQgdGFiLWJhciBoZWlnaHQgKHB4KSBcdTIwMTQgY2FjaGVkIHdoaWxlIHRoZSBiYXIgaXMgaGlkZGVuICovXG4gIHByaXZhdGUgdGFiQmFySGVpZ2h0ID0gMDtcbiAgLyoqIEVkaXRvciBzY3JvbGxlciBjdXJyZW50bHkgcGlubmVkIHRvIG9uZSBzY3JlZW4gKG51bGwgd2hlbiB1bnBpbm5lZCkgKi9cbiAgcHJpdmF0ZSBwaW5uZWRTY3JvbGxlcjogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICBhc3luYyBvbmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcbiAgICB0aGlzLmRlY2tTZXJ2aWNlID0gbmV3IERlY2tTZXJ2aWNlKHRoaXMuYXBwKTtcbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IE5hdGl2ZVNsaWRlc1NldHRpbmdUYWIodGhpcykpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDEuIFJlZnJlc2ggb24gXCJjdXJyZW50IG5vdGUgLyB2aWV3IGNoYW5nZWRcIiBldmVudHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5tYXliZUF1dG9FbnRlclNsaWRlcygpO1xuICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICAgIH0pLFxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAoKSA9PiB0aGlzLnJlZnJlc2goKSkpO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJsYXlvdXQtY2hhbmdlXCIsICgpID0+IHRoaXMucmVmcmVzaCgpKSk7XG4gICAgLy8gUmVmcmVzaCB3aGVuIHRoZSBub3RlIGNvbnRlbnQgKGluY2x1ZGluZyBmcm9udG1hdHRlcikgY2hhbmdlcyAvIHNhdmVzXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5vbihcImNoYW5nZWRcIiwgKGZpbGU6IFRGaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlID09PSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpKSB0aGlzLnJlZnJlc2goKTtcbiAgICAgIH0pLFxuICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMi4gRmFsbGJhY2sgdGltZXI6IGVkaXRcdTIxOTRyZWFkaW5nIHRvZ2dsZXMgbWF5IGZpcmUgbm8gc3RhbmRhcmQgZXZlbnQgXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5yZWdpc3RlckludGVydmFsKFxuICAgICAgd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGNvbnN0IGtleSA9IGZpbGUgPyBgJHtmaWxlLnBhdGh9fCR7Y3VycmVudE1vZGUodGhpcy5hcHApfWAgOiBcIlwiO1xuICAgICAgICBpZiAoa2V5ICE9PSB0aGlzLmxhc3RLZXkpIHtcbiAgICAgICAgICB0aGlzLmxhc3RLZXkgPSBrZXk7XG4gICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgIH1cbiAgICAgIH0sIDUwMCksXG4gICAgKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCAzLiBDb21tYW5kcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICByZWdpc3RlckNvbW1hbmRzKHRoaXMpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDQuIENyZWF0ZSB0aGUgYmFyIGFuZCBkbyB0aGUgZmlyc3QgcmVuZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIHRoaXMuYmFyID0gY3JlYXRlQmFyKCk7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmJhcik7XG4gICAgdGhpcy5yZWZyZXNoKCk7XG4gIH1cblxuICBvbnVubG9hZCgpOiB2b2lkIHtcbiAgICB0aGlzLmJhcj8ucmVtb3ZlKCk7XG4gICAgdGhpcy5iYXIgPSBudWxsO1xuICAgIGlmICh0aGlzLnBpbm5lZFNjcm9sbGVyKSB7XG4gICAgICB1bmxvY2tTY3JvbGxlcih0aGlzLnBpbm5lZFNjcm9sbGVyKTtcbiAgICAgIHRoaXMucGlubmVkU2Nyb2xsZXIgPSBudWxsO1xuICAgIH1cbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoXCJuYXRpdmUtc2xpZGVzLW1vZGVcIik7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU2V0dGluZ3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU2xpZGVzIG1vZGUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLyoqIFdoZXRoZXIgdGhlIGFjdGl2ZSBub3RlIGlzIGEgZGVjayBub3RlIChoYXMgYSBgZGVja2AgcHJvcGVydHkpICovXG4gIHByaXZhdGUgaXNEZWNrTm90ZShmaWxlOiBURmlsZSB8IG51bGwpOiBib29sZWFuIHtcbiAgICBpZiAoIWZpbGUpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBmbSA9IGZyb250bWF0dGVyT2YodGhpcy5hcHAsIGZpbGUpO1xuICAgIHJldHVybiBmbSAhPT0gbnVsbCAmJiBERUNLX0tFWSBpbiBmbTtcbiAgfVxuXG4gIC8qKiBFbnRlciBTbGlkZXMgbW9kZTogcmVjb3JkIHRoZSBleGl0IHN0YXRlIGFuZCBmb3JjZSB0aGUgTGl2ZSBQcmV2aWV3ICovXG4gIHByaXZhdGUgYXN5bmMgZW50ZXJTbGlkZXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgaWYgKHZpZXcpIHtcbiAgICAgIGNvbnN0IHN0YXRlID0gdmlldy5nZXRTdGF0ZSgpIGFzIHsgbW9kZT86IHN0cmluZzsgc291cmNlPzogYm9vbGVhbiB9O1xuICAgICAgdGhpcy5leGl0TW9kZSA9IHN0YXRlLm1vZGUgPT09IFwicHJldmlld1wiID8gXCJwcmV2aWV3XCIgOiBcInNvdXJjZVwiO1xuICAgICAgdGhpcy5leGl0U291cmNlID0gc3RhdGUuc291cmNlID09PSB0cnVlO1xuICAgICAgLy8gU2xpZGVzIG1vZGUgaXMgYWx3YXlzIHRoZSBlZGl0YWJsZSBMaXZlIFByZXZpZXdcbiAgICAgIGNvbnN0IG5leHQgPSB2aWV3LmxlYWYuZ2V0Vmlld1N0YXRlKCk7XG4gICAgICBuZXh0LnN0YXRlID0geyAuLi5uZXh0LnN0YXRlLCBtb2RlOiBcInNvdXJjZVwiLCBzb3VyY2U6IGZhbHNlIH07XG4gICAgICBhd2FpdCB2aWV3LmxlYWYuc2V0Vmlld1N0YXRlKG5leHQsIHsgZm9jdXM6IGZhbHNlIH0pO1xuICAgIH1cbiAgICB0aGlzLnNsaWRlc01vZGUgPSB0cnVlO1xuICAgIHRoaXMucmVmcmVzaCgpO1xuICB9XG5cbiAgLyoqIEV4aXQgU2xpZGVzIG1vZGU6IHJlc3RvcmUgdGhlIHZpZXcgbW9kZSByZWNvcmRlZCBhdCBlbnRyeSAqL1xuICBwcml2YXRlIGV4aXRTbGlkZXMoKTogdm9pZCB7XG4gICAgdGhpcy5zbGlkZXNNb2RlID0gZmFsc2U7XG4gICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgaWYgKHZpZXcpIHtcbiAgICAgIGNvbnN0IHN0YXRlID0gdmlldy5sZWFmLmdldFZpZXdTdGF0ZSgpO1xuICAgICAgaWYgKHRoaXMuZXhpdE1vZGUgPT09IFwicHJldmlld1wiKSB7XG4gICAgICAgIHN0YXRlLnN0YXRlID0geyAuLi5zdGF0ZS5zdGF0ZSwgbW9kZTogXCJwcmV2aWV3XCIgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlLnN0YXRlID0geyAuLi5zdGF0ZS5zdGF0ZSwgbW9kZTogXCJzb3VyY2VcIiwgc291cmNlOiB0aGlzLmV4aXRTb3VyY2UgfTtcbiAgICAgIH1cbiAgICAgIHZvaWQgdmlldy5sZWFmLnNldFZpZXdTdGF0ZShzdGF0ZSwgeyBmb2N1czogZmFsc2UgfSk7XG4gICAgfVxuICAgIHRoaXMucmVmcmVzaCgpO1xuICB9XG5cbiAgLyoqIFRvZ2dsZSBTbGlkZXMgbW9kZSAoZGVjayBub3RlcyBvbmx5IFx1MjAxNCBlbmZvcmNlZCBieSB0aGUgY29tbWFuZCkgKi9cbiAgdG9nZ2xlU2xpZGVzKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNsaWRlc01vZGUpIHRoaXMuZXhpdFNsaWRlcygpO1xuICAgIGVsc2Ugdm9pZCB0aGlzLmVudGVyU2xpZGVzKCk7XG4gIH1cblxuICAvKiogQXV0by1lbnRlciBTbGlkZXMgbW9kZSBvbmNlIHBlciBvcGVuZWQgZGVjayBub3RlIHdoZW4gdGhlIHNldHRpbmcgaXMgb24gKi9cbiAgcHJpdmF0ZSBtYXliZUF1dG9FbnRlclNsaWRlcygpOiB2b2lkIHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICBpZiAoIWZpbGUgfHwgZmlsZS5wYXRoID09PSB0aGlzLmF1dG9FbnRlcmVkUGF0aCkgcmV0dXJuO1xuICAgIHRoaXMuYXV0b0VudGVyZWRQYXRoID0gZmlsZS5wYXRoO1xuICAgIGlmICh0aGlzLnNldHRpbmdzLmF1dG9FbnRlclNsaWRlcyAmJiB0aGlzLmlzRGVja05vdGUoZmlsZSkgJiYgIXRoaXMuc2xpZGVzTW9kZSkge1xuICAgICAgdm9pZCB0aGlzLmVudGVyU2xpZGVzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBpbiAob3IgdW5waW4pIHRoZSBhY3RpdmUgZWRpdG9yJ3Mgc2Nyb2xsZXIgc28gU2xpZGVzIG1vZGUgaXMgZXhhY3RseSBvbmVcbiAgICogc2NyZWVuOiBubyBtYW51YWwgc2Nyb2xsIGFuZCBubyBDb2RlTWlycm9yIHByb2dyYW1tYXRpYyBzY3JvbGxJbnRvVmlld1xuICAgKiAoZWRpdCAvIGRyYWctc2VsZWN0KS4gVW5waW5uZWQgd2hlbiBsZWF2aW5nIFNsaWRlcyBtb2RlIHNvIG5hdGl2ZSBtb2Rlc1xuICAgKiBzY3JvbGwgbm9ybWFsbHkuXG4gICAqL1xuICBwcml2YXRlIHN5bmNTY3JvbGxlclBpbihzbGlkZXM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBjb25zdCBzY3JvbGxlciA9IHNsaWRlc1xuICAgICAgPyAodmlldz8uY29udGVudEVsLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFwiLmNtLXNjcm9sbGVyXCIpID8/IG51bGwpXG4gICAgICA6IG51bGw7XG4gICAgaWYgKHNjcm9sbGVyID09PSB0aGlzLnBpbm5lZFNjcm9sbGVyKSByZXR1cm47XG5cbiAgICBpZiAodGhpcy5waW5uZWRTY3JvbGxlcikgdW5sb2NrU2Nyb2xsZXIodGhpcy5waW5uZWRTY3JvbGxlcik7XG4gICAgaWYgKHNjcm9sbGVyKSBsb2NrU2Nyb2xsZXIoc2Nyb2xsZXIpO1xuICAgIHRoaXMucGlubmVkU2Nyb2xsZXIgPSBzY3JvbGxlcjtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBQUFQgbmF2aWdhdGlvbiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICAvKiogTW92ZSBvbmUgc3RlcCBiYWNrL2ZvcndhcmQgYWxvbmcgdGhlIGRlY2sgY2hhaW4gKGVudGVyaW5nIFNsaWRlcyBtb2RlIGFzIG5lZWRlZCkgKi9cbiAgYXN5bmMgbmF2aWdhdGUoZGlyZWN0aW9uOiBcInByZXZcIiB8IFwibmV4dFwiKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgaWYgKCFmaWxlKSByZXR1cm47XG4gICAgY29uc3QgZGVjayA9IHRoaXMuZGVja1NlcnZpY2UuY29tcHV0ZShmaWxlKTtcbiAgICBpZiAoIWRlY2spIHJldHVybjtcbiAgICBjb25zdCB0YXJnZXQgPSBkZWNrLmNoYWluW2RpcmVjdGlvbiA9PT0gXCJwcmV2XCIgPyBkZWNrLmluZGV4IC0gMSA6IGRlY2suaW5kZXggKyAxXTtcbiAgICBpZiAoIXRhcmdldCkgcmV0dXJuO1xuICAgIGlmICghdGhpcy5zbGlkZXNNb2RlKSBhd2FpdCB0aGlzLmVudGVyU2xpZGVzKCk7XG4gICAgdm9pZCB0aGlzLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KHRhcmdldCwgZmlsZS5wYXRoKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBCYXIgcmVuZGVyaW5nIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBEZWNpZGUgd2hhdCB0aGUgYmFyIHNob3dzLCB0aGVuIHJlLXJlbmRlciBpdCAqL1xuICByZWZyZXNoKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5iYXIpIHJldHVybjtcblxuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGNvbnN0IG1vZGUgPSBjdXJyZW50TW9kZSh0aGlzLmFwcCk7XG4gICAgY29uc3QgaXNDYXJkID0gdGhpcy5pc0RlY2tOb3RlKGZpbGUpO1xuICAgIGNvbnN0IGxpdmVQcmV2aWV3Tm93ID0gbW9kZSA9PT0gXCJzb3VyY2VcIiAmJiBpc0xpdmVQcmV2aWV3KHRoaXMuYXBwKTtcblxuICAgIC8vIExlYXZpbmcgYSBkZWNrIG5vdGUsIG9yIGxlYXZpbmcgdGhlIExpdmUgUHJldmlldyAoZS5nLiBDbWQvQ3RybCtFIHRvXG4gICAgLy8gcmVhZGluZyB2aWV3KSwgZW5kcyBTbGlkZXMgbW9kZSBcdTIwMTQgb25seSB0aGUgdG9nZ2xlIGNvbW1hbmQgcmUtZW50ZXJzIGl0LlxuICAgIGlmICh0aGlzLnNsaWRlc01vZGUgJiYgKCFpc0NhcmQgfHwgIWxpdmVQcmV2aWV3Tm93KSkge1xuICAgICAgdGhpcy5zbGlkZXNNb2RlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gTWVhc3VyZSB0aGUgdGFiIGJhciB3aGlsZSBpdCBpcyBzdGlsbCB2aXNpYmxlIChTbGlkZXMgbW9kZSBoaWRlcyBpdFxuICAgIC8vIGJlbG93OyB0aGUgbGFzdCBtZWFzdXJlZCB2YWx1ZSBpcyByZXVzZWQgb25jZSBoaWRkZW4pLlxuICAgIHRoaXMudGFiQmFySGVpZ2h0ID0gc3luY1RhYkJhckhlaWdodCh0aGlzLnRhYkJhckhlaWdodCk7XG5cbiAgICAvLyBTbGlkZXMgbW9kZSBpcyBhY3RpdmUgb25seSB3aGlsZSBhY3R1YWxseSBpbiB0aGUgZWRpdGFibGUgTGl2ZSBQcmV2aWV3XG4gICAgY29uc3Qgc2xpZGVzID0gdGhpcy5zbGlkZXNNb2RlICYmIGlzQ2FyZCAmJiBsaXZlUHJldmlld05vdztcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC50b2dnbGUoXCJuYXRpdmUtc2xpZGVzLW1vZGVcIiwgc2xpZGVzKTtcbiAgICB0aGlzLnN5bmNTY3JvbGxlclBpbihzbGlkZXMpO1xuXG4gICAgY29uc3QgYmFyVmlzaWJsZSA9IHNsaWRlcyAmJiAhdGhpcy5zZXR0aW5ncy5iYXJIaWRkZW47XG4gICAgaWYgKCFiYXJWaXNpYmxlKSB7XG4gICAgICB0aGlzLmJhci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghZmlsZSkgcmV0dXJuOyAvLyBiYXJWaXNpYmxlIGltcGxpZXMgYSBmaWxlLCBidXQgbmFycm93IGZvciBUeXBlU2NyaXB0XG5cbiAgICBjb25zdCBmbSA9IGFjdGl2ZUZyb250bWF0dGVyKHRoaXMuYXBwKTtcbiAgICBjb25zdCBkZWNrID0gdGhpcy5kZWNrU2VydmljZS5jb21wdXRlKGZpbGUpO1xuICAgIGNsZWFyQ2hpbGRyZW4odGhpcy5iYXIpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIExlZnQ6IHByZXZpb3VzIC8gbmV4dCBidXR0b25zIChib3RoIGFsd2F5cyBzaG93biBpbnNpZGUgYSBkZWNrO1xuICAgIC8vICAgICAgICB0aGUgb25lIHRoYXQgY2Fubm90IG1vdmUgaXMgZGlzYWJsZWQgLyBsaWdodCBncmF5KSBcdTI1MDBcdTI1MDBcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5zaG93TmF2QnV0dG9ucyAmJiBkZWNrKSB7XG4gICAgICBjb25zdCBoYXNQcmV2ID0gZGVjay5pbmRleCA+IDA7XG4gICAgICBjb25zdCBoYXNOZXh0ID0gZGVjay5pbmRleCA8IGRlY2suY2hhaW4ubGVuZ3RoIC0gMTtcbiAgICAgIGNvbnN0IG5hdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBuYXYuY2xhc3NOYW1lID0gXCJuYXRpdmUtc2xpZGVzLW5hdlwiO1xuICAgICAgbmF2LmFwcGVuZENoaWxkKG5hdkJ1dHRvbihcIlx1MjVDMFwiLCBcIlByZXZpb3VzIHBhZ2VcIiwgKCkgPT4gdGhpcy5uYXZpZ2F0ZShcInByZXZcIiksICFoYXNQcmV2KSk7XG4gICAgICBuYXYuYXBwZW5kQ2hpbGQobmF2QnV0dG9uKFwiXHUyNUI2XCIsIFwiTmV4dCBwYWdlXCIsICgpID0+IHRoaXMubmF2aWdhdGUoXCJuZXh0XCIpLCAhaGFzTmV4dCkpO1xuICAgICAgdGhpcy5iYXIuYXBwZW5kQ2hpbGQobmF2KTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTWlkZGxlOiBjaGlwcyBmb3IgdGhlIHJlbWFpbmluZyBwcm9wZXJ0aWVzIChubyBwbGFjZWhvbGRlcikgXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgdmlzaWJsZSA9IGZtXG4gICAgICA/IE9iamVjdC5lbnRyaWVzKGZtKS5maWx0ZXIoKFtrZXldKSA9PiBrZXkgIT09IERFQ0tfS0VZICYmIGtleSAhPT0gXCJwb3NpdGlvblwiKVxuICAgICAgOiBbXTtcblxuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIHZpc2libGUpIHtcbiAgICAgIGNvbnN0IHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgIHNwYW4uY2xhc3NOYW1lID0gXCJuYXRpdmUtc2xpZGVzLWl0ZW1cIjtcbiAgICAgIGNvbnN0IGsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3Ryb25nXCIpO1xuICAgICAgay50ZXh0Q29udGVudCA9IGtleTtcbiAgICAgIHNwYW4uYXBwZW5kQ2hpbGQoayk7XG4gICAgICBzcGFuLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiOiBcIiArIGZvcm1hdFZhbHVlKHZhbHVlKSkpO1xuICAgICAgdGhpcy5iYXIuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgfVxuXG4gICAgLy8gQnJva2VuIGRlY2sgbGlua3MgXHUyMTkyIHdhcm5pbmcgY2hpcCBzbyBkZWNrIGF1dGhvcnMgc3BvdCB0eXBvc1xuICAgIGNvbnN0IGJyb2tlbiA9IGZpbGUgPyB0aGlzLmRlY2tTZXJ2aWNlLmJyb2tlbihmaWxlKSA6IFtdO1xuICAgIGlmIChicm9rZW4ubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3Qgd2FybiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgd2Fybi5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtd2FyblwiO1xuICAgICAgd2Fybi50ZXh0Q29udGVudCA9IFwiXHUyNkEwIFwiICsgYnJva2VuLmpvaW4oXCIsIFwiKTtcbiAgICAgIHdhcm4udGl0bGUgPSBcIkJyb2tlbiBkZWNrIGxpbmsocykgXHUyMDE0IHRoZSB0YXJnZXQgbm90ZSBkb2VzIG5vdCBleGlzdFwiO1xuICAgICAgdGhpcy5iYXIuYXBwZW5kQ2hpbGQod2Fybik7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEJvdHRvbS1yaWdodDogZXhpdCBTbGlkZXMgbW9kZSAoZGVjayBub3RlcyBvbmx5KSBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgIGJ0bi5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtbW9kZS1idG4gaXMtYWN0aXZlXCI7XG4gICAgYnRuLnRleHRDb250ZW50ID0gXCJTbGlkZXM6IE9uXCI7XG4gICAgYnRuLnRpdGxlID0gXCJFeGl0IFNsaWRlcyBtb2RlIChiYWNrIHRvIHlvdXIgcHJldmlvdXMgdmlldylcIjtcbiAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMudG9nZ2xlU2xpZGVzKCkpO1xuICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKGJ0bik7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQm90dG9tLXJpZ2h0OiBhdXRvLWNvbXB1dGVkIHBhZ2UgbnVtYmVyIFx1MjUwMFx1MjUwMFxuICAgIGlmICh0aGlzLnNldHRpbmdzLnNob3dQYWdlTnVtYmVyICYmIGRlY2spIHtcbiAgICAgIGNvbnN0IHBhZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgIHBhZ2UuY2xhc3NOYW1lID0gXCJuYXRpdmUtc2xpZGVzLXBhZ2VcIjtcbiAgICAgIC8vIGNoYWluWzBdIGlzIHRoZSBvdmVydmlldyBub3RlOyBzbGlkZXMgc3RhcnQgYXQgaW5kZXggMSBcdTIxOTIgXCJQYWdlIDFcIlxuICAgICAgcGFnZS50ZXh0Q29udGVudCA9IGRlY2suaW5kZXggPT09IDAgPyBcIk92ZXJ2aWV3XCIgOiBgUGFnZSAke2RlY2suaW5kZXh9YDtcbiAgICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKHBhZ2UpO1xuICAgIH1cblxuICAgIC8vIEhpZGUgdGhlIGJhciBlbnRpcmVseSB3aGVuIGl0IGhhcyBub3RoaW5nIHRvIGRpc3BsYXkgKG5vIHByb3BlcnRpZXMsXG4gICAgLy8gYW5kIG5vdCBwYXJ0IG9mIGEgZGVjaylcbiAgICB0aGlzLmJhci5zdHlsZS5kaXNwbGF5ID0gdGhpcy5iYXIuY2hpbGRFbGVtZW50Q291bnQgPT09IDAgPyBcIm5vbmVcIiA6IFwiXCI7XG4gIH1cbn1cbiIsICIvKiogQ3JlYXRlIHRoZSBiYXIgRE9NIGVsZW1lbnQgKGhpZGRlbiB1bnRpbCByZWZyZXNoKCkgc2hvd3MgaXQpICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQmFyKCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgYmFyLmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy1iYXJcIjtcbiAgYmFyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgcmV0dXJuIGJhcjtcbn1cblxuLyoqIEJ1aWxkIGEgXHUyNUMwIC8gXHUyNUI2IG5hdmlnYXRpb24gYnV0dG9uOyBgZGlzYWJsZWRgIHJlbmRlcnMgaXQgbGlnaHQgZ3JheS9pbmFjdGl2ZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdkJ1dHRvbihcbiAgbGFiZWw6IHN0cmluZyxcbiAgdGlwOiBzdHJpbmcsXG4gIG9uQ2xpY2s6ICgpID0+IHZvaWQsXG4gIGRpc2FibGVkID0gZmFsc2UsXG4pOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIGJ0bi5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtbmF2LWJ0blwiO1xuICBidG4udGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgYnRuLnRpdGxlID0gdGlwO1xuICBidG4uZGlzYWJsZWQgPSBkaXNhYmxlZDtcbiAgaWYgKCFkaXNhYmxlZCkgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvbkNsaWNrKTtcbiAgcmV0dXJuIGJ0bjtcbn1cblxuLyoqXG4gKiBNZWFzdXJlIHRoZSB0b3AgdGFiIGJhciBhbmQgZXhwb3NlIGl0cyBoZWlnaHQgYXMgdGhlIENTUyB2YXJpYWJsZVxuICogLS1uYXRpdmUtc2xpZGVzLXRhYmJhci1oZWlnaHQsIHJldHVybmluZyB0aGUgKHBvc3NpYmx5IHVwZGF0ZWQpIGNhY2hlZFxuICogdmFsdWUuIFRoZSBiYXIgaXMgaGlkZGVuIGluIFNsaWRlcyBtb2RlLCBzbyB0aGUgbGFzdCBtZWFzdXJlZFxuICogdmFsdWUgaXMgcmV1c2VkIHRoZXJlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3luY1RhYkJhckhlaWdodChjYWNoZWQ6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IHRhYkJhciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFxuICAgIFwiLndvcmtzcGFjZS10YWJzLm1vZC10b3AgLndvcmtzcGFjZS10YWItaGVhZGVyLWNvbnRhaW5lclwiLFxuICApO1xuICBpZiAodGFiQmFyICYmIHRhYkJhci5vZmZzZXRIZWlnaHQgPiAwKSBjYWNoZWQgPSB0YWJCYXIub2Zmc2V0SGVpZ2h0O1xuICBpZiAoY2FjaGVkID4gMCkge1xuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eShcIi0tbmF0aXZlLXNsaWRlcy10YWJiYXItaGVpZ2h0XCIsIGAke2NhY2hlZH1weGApO1xuICB9IGVsc2Uge1xuICAgIC8vIE5vIG1lYXN1cmVtZW50IHlldCAodGFiIGJhciBoaWRkZW4gc2luY2UgbG9hZCkgXHUyMDE0IGxldCB0aGUgQ1NTIGZhbGxiYWNrIGFwcGx5LlxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5yZW1vdmVQcm9wZXJ0eShcIi0tbmF0aXZlLXNsaWRlcy10YWJiYXItaGVpZ2h0XCIpO1xuICB9XG4gIHJldHVybiBjYWNoZWQ7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNYXJrZG93blZpZXcsIE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIE5hdGl2ZVNsaWRlc1BsdWdpbiBmcm9tIFwiLi4vbWFpblwiO1xuaW1wb3J0IHsgaXNMaXZlUHJldmlldyB9IGZyb20gXCIuL21vZGVcIjtcblxuLyoqXG4gKiBUeXBvZ3JhcGh5LW1lYXN1cmVtZW50IHRvb2xpbmcgKGRldiBidWlsZHMgb25seSkuXG4gKlxuICogVGhlIGBucy1kZWJ1Zy1zdHlsZXNgIGNvbW1hbmQgc2FtcGxlcyB0aGUgZml4ZWQgb25lLXBhZ2Ugc2FtcGxlIG5vdGVzIGluXG4gKiBlZGl0IChMaXZlIFByZXZpZXcpIGFuZCB0aGUga2l0Y2hlbi1zaW5rIG5vdGUgaW4gcmVhZGluZyB2aWV3LCBtZXJnZXMgdGhlXG4gKiByZXN1bHRzLCBjb21wdXRlcyBhbiBlZGl0LXZzLXJlYWRpbmcgZGlmZiBhbmQgd3JpdGVzIGl0IHRvXG4gKiAubmF0aXZlLXNsaWRlcy1kZWJ1Zy5qc29uIGluIHRoZSB2YXVsdCByb290LiBSZWdpc3RlcmVkIG9ubHkgd2hlbiB0aGVcbiAqIGJ1aWxkLXRpbWUgREVWX01PREUgZmxhZyBpcyB0cnVlOyByZWxlYXNlIGJ1aWxkcyB0cmVlLXNoYWtlIHRoaXMgbW9kdWxlIG91dC5cbiAqL1xuXG4vKiogRml4ZWQgb25lLXBhZ2Ugc2FtcGxlIG5vdGVzIHVzZWQgYnkgdGhlIGRlYnVnIGNvbW1hbmQgKGVkaXQgc2lkZSkgKi9cbmV4cG9ydCBjb25zdCBTQU1QTEVfTk9URV9OQU1FUyA9IFtcbiAgXCJ0eXBvZ3JhcGh5LXNhbXBsZS1oZWFkaW5nc1wiLFxuICBcInR5cG9ncmFwaHktc2FtcGxlLWxpc3RcIixcbiAgXCJ0eXBvZ3JhcGh5LXNhbXBsZS1jb2RlXCIsXG4gIFwidHlwb2dyYXBoeS1zYW1wbGUtcXVvdGVcIixcbiAgXCJ0eXBvZ3JhcGh5LXNhbXBsZS1tZWRpYVwiLFxuXTtcblxuLyoqIFN0eWxlIHNlY3Rpb25zIHNhbXBsZWQgYnkgc2FtcGxlU3R5bGVzKCkgYW5kIGNvbXBhcmVkIGJ5IGRpZmZEdW1wcygpICovXG5jb25zdCBTVFlMRV9TRUNUSU9OUyA9IFtcbiAgXCJjb250YWluZXJcIixcbiAgXCJwYXJhZ3JhcGhcIixcbiAgXCJoMVwiLFxuICBcImxpc3RJdGVtXCIsXG4gIFwiY29kZUJsb2NrXCIsXG4gIFwiYmxvY2txdW90ZVwiLFxuICBcImlubGluZUNvZGVcIixcbiAgXCJ0YWJsZVwiLFxuICBcImltYWdlXCIsXG4gIFwiaG9yaXpvbnRhbFJ1bGVcIixcbl07XG5cbi8qKiBQcm9taXNlLWJhc2VkIHNsZWVwICovXG5mdW5jdGlvbiBzbGVlcChtczogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpO1xufVxuXG4vKipcbiAqIE1lcmdlIG5vbi1taXNzaW5nIHN0eWxlIHNlY3Rpb25zIG9mIGEgZnJlc2ggc2FtcGxlIGludG8gdGhlIHRhcmdldFxuICogKGZpcnN0IG5vbi1taXNzaW5nIHZhbHVlIHdpbnMpLlxuICovXG5mdW5jdGlvbiBtZXJnZVNhbXBsZSh0YXJnZXQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBzYW1wbGU6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XG4gIGZvciAoY29uc3Qga2V5IG9mIFNUWUxFX1NFQ1RJT05TKSB7XG4gICAgY29uc3Qgc2VjdGlvbiA9IHNhbXBsZVtrZXldIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4gfCB1bmRlZmluZWQ7XG4gICAgaWYgKCFzZWN0aW9uIHx8IFwiKG1pc3NpbmcpXCIgaW4gc2VjdGlvbikgY29udGludWU7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0YXJnZXRba2V5XSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgdW5kZWZpbmVkO1xuICAgIGlmIChleGlzdGluZyAmJiAhKFwiKG1pc3NpbmcpXCIgaW4gZXhpc3RpbmcpKSBjb250aW51ZTtcbiAgICB0YXJnZXRba2V5XSA9IHNlY3Rpb247XG4gIH1cbiAgLy8gUHJvYmUgZmllbGRzIHJpZGUgYWxvbmcgKGZpcnN0IG5vbi1lbXB0eSB3aW5zKVxuICBmb3IgKGNvbnN0IGtleSBvZiBbXG4gICAgXCJsaXN0TGluZXNcIixcbiAgICBcIm1ldGFkYXRhQ29udGFpbmVyRGlzcGxheVwiLFxuICAgIFwiaDFPZmZzZXRUb3BcIixcbiAgICBcImgxVG9wSW5Db250ZW50XCIsXG4gICAgXCJjb250ZW50Q2hpbGRyZW5cIixcbiAgICBcInRvcENoYWluXCIsXG4gIF0pIHtcbiAgICBjb25zdCBwcm9iZSA9IHNhbXBsZVtrZXldO1xuICAgIGlmIChwcm9iZSA9PT0gdW5kZWZpbmVkIHx8IHByb2JlID09PSBudWxsKSBjb250aW51ZTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShwcm9iZSkgJiYgcHJvYmUubGVuZ3RoID09PSAwKSBjb250aW51ZTtcbiAgICBpZiAodHlwZW9mIHByb2JlID09PSBcIm9iamVjdFwiICYmICFBcnJheS5pc0FycmF5KHByb2JlKSAmJiBPYmplY3Qua2V5cyhwcm9iZSkubGVuZ3RoID09PSAwKVxuICAgICAgY29udGludWU7XG4gICAgaWYgKHRhcmdldFtrZXldID09PSB1bmRlZmluZWQpIHRhcmdldFtrZXldID0gcHJvYmU7XG4gIH1cbn1cblxuLyoqXG4gKiBDb21wYXJlIHRoZSBzdHlsZSBzZWN0aW9ucyBvZiBhbiBlZGl0IGR1bXAgYW5kIGEgcmVhZGluZyBkdW1wOyBvbmx5XG4gKiBrZXlzIHdob3NlIHZhbHVlcyBkaWZmZXIgYXJlIGtlcHQsIGFzIHsga2V5OiB7IGVkaXQsIHJlYWRpbmcgfSB9LlxuICovXG5mdW5jdGlvbiBkaWZmRHVtcHMoXG4gIGVkaXQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICByZWFkaW5nOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuICBmb3IgKGNvbnN0IHNlY3Rpb24gb2YgU1RZTEVfU0VDVElPTlMpIHtcbiAgICBjb25zdCBlID0gKGVkaXRbc2VjdGlvbl0gPz8ge30pIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gICAgY29uc3QgciA9IChyZWFkaW5nW3NlY3Rpb25dID8/IHt9KSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICAgIGNvbnN0IGtleXMgPSBuZXcgU2V0KFsuLi5PYmplY3Qua2V5cyhlKSwgLi4uT2JqZWN0LmtleXMocildKTtcbiAgICBjb25zdCBkaWZmczogUmVjb3JkPHN0cmluZywgeyBlZGl0OiBzdHJpbmc7IHJlYWRpbmc6IHN0cmluZyB9PiA9IHt9O1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICAgIGlmIChlW2tleV0gIT09IHJba2V5XSkge1xuICAgICAgICBkaWZmc1trZXldID0geyBlZGl0OiBlW2tleV0gPz8gXCIobWlzc2luZylcIiwgcmVhZGluZzogcltrZXldID8/IFwiKG1pc3NpbmcpXCIgfTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKE9iamVjdC5rZXlzKGRpZmZzKS5sZW5ndGggPiAwKSBvdXRbc2VjdGlvbl0gPSBkaWZmcztcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG4vKiogU2FtcGxlIHRoZSBjdXJyZW50IHZpZXcncyB0eXBvZ3JhcGh5IGNvbXB1dGVkIHN0eWxlcyArIENTUyB2YXJpYWJsZXMgKi9cbmZ1bmN0aW9uIHNhbXBsZVN0eWxlcyhhcHA6IEFwcCk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCB7XG4gIGNvbnN0IHZpZXcgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgaWYgKCF2aWV3KSByZXR1cm4gbnVsbDtcbiAgY29uc3QgaXNFZGl0ID0gdmlldy5nZXRNb2RlKCkgPT09IFwic291cmNlXCI7XG4gIGNvbnN0IGNvbnRlbnRFbCA9IHZpZXcuY29udGVudEVsO1xuICAvLyBGaXJzdCBtYXRjaGluZyBjYW5kaWRhdGUgd2lucyBcdTIwMTQgZWRpdCAoY202KSBhbmQgcmVhZGluZyB1c2VcbiAgLy8gZGlmZmVyZW50IGVsZW1lbnQgc3RydWN0dXJlcyAoZS5nLiBubyBwcmUvYmxvY2txdW90ZSBpbiBjbTYpLlxuICBjb25zdCBwaWNrID0gKHNlbHM6IHN0cmluZ1tdKTogSFRNTEVsZW1lbnQgfCBudWxsID0+IHtcbiAgICBmb3IgKGNvbnN0IHNlbCBvZiBzZWxzKSB7XG4gICAgICBjb25zdCBlbCA9IGNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihzZWwpO1xuICAgICAgaWYgKGVsKSByZXR1cm4gZWw7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9O1xuICBjb25zdCBzdHlsZSA9IChlbDogSFRNTEVsZW1lbnQgfCBudWxsLCBwcm9wczogc3RyaW5nW10pOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0+IHtcbiAgICBpZiAoIWVsKSByZXR1cm4geyBcIihtaXNzaW5nKVwiOiBcImVsZW1lbnQgbm90IGluIHRoaXMgbm90ZVwiIH07XG4gICAgY29uc3QgY3MgPSBnZXRDb21wdXRlZFN0eWxlKGVsKTtcbiAgICBjb25zdCBvdXQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IHAgb2YgcHJvcHMpIHtcbiAgICAgIGNvbnN0IHYgPSBjcy5nZXRQcm9wZXJ0eVZhbHVlKHApLnRyaW0oKTtcbiAgICAgIGlmICh2KSBvdXRbcF0gPSB2O1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9O1xuICBjb25zdCB2YXJzID0gZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5ib2R5KTtcbiAgY29uc3QgY3NzVmFyID0gKG5hbWU6IHN0cmluZyk6IHN0cmluZyA9PiB2YXJzLmdldFByb3BlcnR5VmFsdWUobmFtZSkudHJpbSgpO1xuXG4gIGNvbnN0IGNvbnRhaW5lciA9IHBpY2soW1xuICAgIGlzRWRpdFxuICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IC5jbS1jb250ZW50XCJcbiAgICAgIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXdcIixcbiAgXSk7XG4gIGNvbnN0IHBhcmEgPSBwaWNrKFtcbiAgICBpc0VkaXRcbiAgICAgID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuY20tbGluZTpub3QoLkh5cGVyTUQtaGVhZGVyKVwiXG4gICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IHBcIixcbiAgXSk7XG4gIGNvbnN0IGgxID0gcGljayhbXG4gICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuY20taGVhZGVyLTFcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyBoMVwiLFxuICAgIGlzRWRpdFxuICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IGgxXCJcbiAgICAgIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgaDFcIixcbiAgXSk7XG4gIGNvbnN0IGxpc3RJdGVtID0gcGljayhbXG4gICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuSHlwZXJNRC1saXN0LWxpbmVcIiA6IFwiLm1hcmtkb3duLXByZXZpZXctdmlldyB1bCA+IGxpXCIsXG4gICAgaXNFZGl0ID8gXCIuSHlwZXJNRC1saXN0LWxpbmVcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IHVsID4gbGlcIixcbiAgXSk7XG4gIGNvbnN0IHByZSA9IHBpY2soW1xuICAgIGlzRWRpdFxuICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IHByZVwiXG4gICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IHByZVwiLFxuICAgIGlzRWRpdCA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLmNtLWVkaXRpbmcgcHJlXCIgOiBcIi5tYXJrZG93bi1wcmV2aWV3LXZpZXcgcHJlXCIsXG4gICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuSHlwZXJNRC1jb2RlYmxvY2tcIiA6IFwiLm1hcmtkb3duLXByZXZpZXctdmlldyBwcmVcIixcbiAgXSk7XG4gIGNvbnN0IHF1b3RlID0gcGljayhbXG4gICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiBibG9ja3F1b3RlXCIgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgYmxvY2txdW90ZVwiLFxuICAgIGlzRWRpdFxuICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IC5IeXBlck1ELXF1b3RlXCJcbiAgICAgIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgYmxvY2txdW90ZVwiLFxuICBdKTtcbiAgY29uc3QgaW5saW5lQ29kZSA9IHBpY2soW1xuICAgIGlzRWRpdCA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgY29kZVwiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IGNvZGVcIixcbiAgICBpc0VkaXRcbiAgICAgID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuY20taW5saW5lLWNvZGVcIlxuICAgICAgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlldyBjb2RlXCIsXG4gIF0pO1xuICBjb25zdCB0YWJsZSA9IHBpY2soW1xuICAgIGlzRWRpdCA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgdGFibGVcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyB0YWJsZVwiLFxuICAgIGlzRWRpdCA/IFwiLmNtLWxpbmUgdGFibGVcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IHRhYmxlXCIsXG4gIF0pO1xuICBjb25zdCBpbWcgPSBwaWNrKFtcbiAgICBpc0VkaXQgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IGltZ1wiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IGltZ1wiLFxuICAgIGlzRWRpdCA/IFwiLmNtLWxpbmUgaW1nXCIgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlldyBpbWdcIixcbiAgICBcImltZ1wiLCAvLyB3aG9sZS1kb2N1bWVudCBmYWxsYmFja1xuICBdKTtcbiAgY29uc3QgaHIgPSBwaWNrKFtcbiAgICBpc0VkaXQgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IGhyXCIgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgaHJcIixcbiAgICBpc0VkaXQgPyBcIi5jbS1saW5lIGhyXCIgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlldyBoclwiLFxuICAgIGlzRWRpdCA/IFwiLmNtLWhyXCIgOiBcIi5tYXJrZG93bi1wcmV2aWV3LXZpZXcgaHJcIixcbiAgXSk7XG5cbiAgLy8gU3RydWN0dXJlIHByb2JlcyAoZWRpdCB2aWV3IG9ubHkpOiB0aGUgc291cmNlLXZpZXcgY2xhc3MgbGlzdFxuICAvLyAoY29uZmlybXMgdGhlIExpdmUgUHJldmlldyBtYXJrZXIgY2xhc3MpIGFuZCB1bmlxdWUgZWxlbWVudCB0YWdzXG4gIC8vIGluc2lkZSB0aGUgZWRpdG9yIChyZXZlYWxzIGhvdyBjbTYgcmVuZGVycyBjb2RlIGJsb2NrcyBldGMuIHdoZW5cbiAgLy8gdGhlIHVzdWFsIHNlbGVjdG9ycyBkbyBub3QgbWF0Y2gpLlxuICBjb25zdCBzb3VyY2VWaWV3Q2xhc3MgPSBjb250ZW50RWwucXVlcnlTZWxlY3RvcihcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202XCIpPy5jbGFzc05hbWUgPz8gXCJcIjtcbiAgY29uc3QgZG9tVGFnczogc3RyaW5nW10gPSBbXTtcbiAgaWYgKGlzRWRpdCkge1xuICAgIGNvbnN0IHRhZ3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb250ZW50RWxcbiAgICAgIC5xdWVyeVNlbGVjdG9yQWxsKFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgKlwiKVxuICAgICAgLmZvckVhY2goKGVsKSA9PiB0YWdzLmFkZChlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCkpKTtcbiAgICBkb21UYWdzLnB1c2goLi4udGFncyk7XG4gIH1cbiAgLy8gTGlzdC1saW5lIHByb2JlIChlZGl0IHZpZXcgb25seSk6IGNsYXNzIG5hbWVzICsgY29tcHV0ZWQgcGFkZGluZ1xuICAvLyBvZiB0aGUgZmlyc3QgbGlzdCBsaW5lcyBcdTIwMTQgbmVzdGVkIGxldmVscyBvZnRlbiB1c2UgZGlzdGluY3RcbiAgLy8gY2xhc3NlcyBvciBpbmxpbmUgcGFkZGluZ3MsIHdoaWNoIGRlY2lkZXMgd2hldGhlciBhIGxldmVsLWF3YXJlXG4gIC8vIGluZGVudCBvdmVycmlkZSBpcyBldmVuIHBvc3NpYmxlLlxuICBjb25zdCBsaXN0TGluZXM6IHsgY2xhc3NOYW1lOiBzdHJpbmc7IHBhZGRpbmdMZWZ0OiBzdHJpbmcgfVtdID0gW107XG4gIGlmIChpc0VkaXQpIHtcbiAgICBjb250ZW50RWwucXVlcnlTZWxlY3RvckFsbChcIi5IeXBlck1ELWxpc3QtbGluZVwiKS5mb3JFYWNoKChlbCwgaSkgPT4ge1xuICAgICAgaWYgKGkgPj0gNCkgcmV0dXJuO1xuICAgICAgY29uc3QgY3MgPSBnZXRDb21wdXRlZFN0eWxlKGVsKTtcbiAgICAgIGxpc3RMaW5lcy5wdXNoKHtcbiAgICAgICAgY2xhc3NOYW1lOiBlbC5jbGFzc05hbWUsXG4gICAgICAgIHBhZGRpbmdMZWZ0OiBjcy5nZXRQcm9wZXJ0eVZhbHVlKFwicGFkZGluZy1sZWZ0XCIpLnRyaW0oKSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIC8vIEZyb250bWF0dGVyIHByb2JlczogZG9lcyB0aGUgKGhpZGRlbikgcHJvcGVydGllcyBhcmVhIHN0aWxsXG4gIC8vIG9jY3VweSBzcGFjZSBpbiBMaXZlIFByZXZpZXc/IEFuZCBob3cgZmFyIGlzIHRoZSBIMSBmcm9tIHRoZVxuICAvLyB0b3Agb2YgdGhlIGNvbnRlbnQgYXJlYT8gKHJlYWRpbmcgbW9kZSBoYXMgbm8gc3VjaCBwYWRkaW5nKVxuICBjb25zdCBtZXRhZGF0YURpc3BsYXkgPSAoKCkgPT4ge1xuICAgIGNvbnN0IHNlbCA9IGlzRWRpdFxuICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2UtdmlldyAubWV0YWRhdGEtY29udGFpbmVyXCJcbiAgICAgIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tZXRhZGF0YS1jb250YWluZXJcIjtcbiAgICBjb25zdCBlbCA9IGNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihzZWwpO1xuICAgIHJldHVybiBlbCA/IGdldENvbXB1dGVkU3R5bGUoZWwpLmRpc3BsYXkgOiBcIihub3QgaW4gRE9NKVwiO1xuICB9KSgpO1xuICBjb25zdCBoMU9mZnNldFRvcCA9ICgoKSA9PiB7XG4gICAgaWYgKCFoMSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBsZXQgdG9wID0gMDtcbiAgICBsZXQgbm9kZTogSFRNTEVsZW1lbnQgfCBudWxsID0gaDE7XG4gICAgd2hpbGUgKG5vZGUgJiYgbm9kZSAhPT0gY29udGVudEVsICYmIG5vZGUgIT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgIHRvcCArPSBub2RlLm9mZnNldFRvcDtcbiAgICAgIG5vZGUgPSBub2RlLm9mZnNldFBhcmVudCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgfVxuICAgIHJldHVybiB0b3A7XG4gIH0pKCk7XG4gIC8vIFdoYXQgb2NjdXBpZXMgdGhlIHNwYWNlIGJldHdlZW4gdGhlIGNvbnRlbnQgdG9wIGFuZCB0aGUgSDE/XG4gIC8vIChlZGl0KSBmaXJzdCBjaGlsZHJlbiBvZiAuY20tY29udGVudCwgYW5kIHRoZSBuZXQgSDEgZGlzdGFuY2VcbiAgLy8gZnJvbSB0aGUgY29udGVudCBhbmNob3IgXHUyMDE0IHJlYWRpbmcgaGFzIG5vIHN1Y2ggZ2FwLlxuICBjb25zdCBhbmNob3IgPSBpc0VkaXRcbiAgICA/IGNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcIi5jbS1jb250ZW50XCIpXG4gICAgOiBjb250ZW50RWwucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXdcIik7XG4gIGNvbnN0IGgxVG9wSW5Db250ZW50ID0gKCgpID0+IHtcbiAgICBpZiAoIWgxIHx8ICFhbmNob3IpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoaDEuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wIC0gYW5jaG9yLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCk7XG4gIH0pKCk7XG4gIGNvbnN0IGNvbnRlbnRDaGlsZHJlbiA9ICgoKSA9PiB7XG4gICAgaWYgKCFhbmNob3IpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oYW5jaG9yLmNoaWxkcmVuKVxuICAgICAgLnNsaWNlKDAsIDQpXG4gICAgICAubWFwKChlbCkgPT4ge1xuICAgICAgICBjb25zdCBjcyA9IGdldENvbXB1dGVkU3R5bGUoZWwpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNsczogKGVsIGFzIEhUTUxFbGVtZW50KS5jbGFzc05hbWUgfHwgZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpLFxuICAgICAgICAgIGRpc3BsYXk6IGNzLmRpc3BsYXksXG4gICAgICAgICAgaGVpZ2h0OiBNYXRoLnJvdW5kKGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCksXG4gICAgICAgICAgbWFyZ2luVG9wOiBjcy5tYXJnaW5Ub3AsXG4gICAgICAgICAgcGFkZGluZ1RvcDogY3MucGFkZGluZ1RvcCxcbiAgICAgICAgICBtYXJnaW5Cb3R0b206IGNzLm1hcmdpbkJvdHRvbSxcbiAgICAgICAgICBwYWRkaW5nQm90dG9tOiBjcy5wYWRkaW5nQm90dG9tLFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gIH0pKCk7XG4gIC8vIENvbnRhaW5lciBjaGFpbiBwcm9iZTogZnJvbSAuY20tY29udGVudCB1cCB0byB0aGUgdmlldy1jb250ZW50LFxuICAvLyBlYWNoIHdyYXBwZXIncyBwYWRkaW5nL21hcmdpbiBcdTIwMTQgbG9jYXRlcyB0aGUgbGVmdG92ZXIgdmVydGljYWxcbiAgLy8gb2Zmc2V0IGJldHdlZW4gZWRpdCBhbmQgcmVhZGluZyBjb250ZW50IGFyZWFzLlxuICBjb25zdCB0b3BDaGFpbiA9ICgoKSA9PiB7XG4gICAgaWYgKCFhbmNob3IpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3QgcGFydHM6IHsgY2xzOiBzdHJpbmc7IHBhZFRvcDogc3RyaW5nOyBtYXJUb3A6IHN0cmluZyB9W10gPSBbXTtcbiAgICBsZXQgbm9kZTogSFRNTEVsZW1lbnQgfCBudWxsID0gYW5jaG9yO1xuICAgIHdoaWxlIChub2RlICYmIG5vZGUgIT09IGNvbnRlbnRFbCAmJiBub2RlICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICBjb25zdCBjcyA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgICBwYXJ0cy5wdXNoKHtcbiAgICAgICAgY2xzOiBub2RlLmNsYXNzTmFtZSB8fCBub2RlLnRhZ05hbWUudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgcGFkVG9wOiBjcy5wYWRkaW5nVG9wLFxuICAgICAgICBtYXJUb3A6IGNzLm1hcmdpblRvcCxcbiAgICAgIH0pO1xuICAgICAgbm9kZSA9IG5vZGUucGFyZW50RWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuIHBhcnRzO1xuICB9KSgpO1xuXG4gIGNvbnN0IGR1bXAgPSB7XG4gICAgbW9kZTogaXNFZGl0ID8gXCJlZGl0IChMaXZlIFByZXZpZXcpXCIgOiBcInJlYWRpbmdcIixcbiAgICAvLyBTbGlkZXMgc3R5bGluZyBvbmx5IGFwcGxpZXMgd2hlbiBTbGlkZXMgbW9kZSBpcyBvblxuICAgIHNsaWRlc0FjdGl2ZTogZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuY29udGFpbnMoXCJuYXRpdmUtc2xpZGVzLW1vZGVcIiksXG4gICAgZG9tVGFnczogaXNFZGl0ID8gZG9tVGFncyA6IHVuZGVmaW5lZCxcbiAgICBzb3VyY2VWaWV3Q2xhc3M6IGlzRWRpdCA/IHNvdXJjZVZpZXdDbGFzcyA6IHVuZGVmaW5lZCxcbiAgICBsaXZlUHJldmlldzogaXNFZGl0ID8gaXNMaXZlUHJldmlldyhhcHApIDogdW5kZWZpbmVkLFxuICAgIGxpc3RMaW5lczogaXNFZGl0ID8gbGlzdExpbmVzIDogdW5kZWZpbmVkLFxuICAgIG1ldGFkYXRhQ29udGFpbmVyRGlzcGxheTogbWV0YWRhdGFEaXNwbGF5LFxuICAgIGgxT2Zmc2V0VG9wOiBoMU9mZnNldFRvcCxcbiAgICBoMVRvcEluQ29udGVudDogaDFUb3BJbkNvbnRlbnQsXG4gICAgY29udGVudENoaWxkcmVuOiBjb250ZW50Q2hpbGRyZW4sXG4gICAgdG9wQ2hhaW46IHRvcENoYWluLFxuICAgIGNvbnRhaW5lcjogc3R5bGUoY29udGFpbmVyLCBbXG4gICAgICBcImZvbnQtZmFtaWx5XCIsXG4gICAgICBcImZvbnQtc2l6ZVwiLFxuICAgICAgXCJsaW5lLWhlaWdodFwiLFxuICAgICAgXCJtYXgtd2lkdGhcIixcbiAgICAgIFwid2lkdGhcIixcbiAgICAgIFwicGFkZGluZy10b3BcIixcbiAgICAgIFwicGFkZGluZy1yaWdodFwiLFxuICAgICAgXCJwYWRkaW5nLWJvdHRvbVwiLFxuICAgICAgXCJwYWRkaW5nLWxlZnRcIixcbiAgICAgIFwiY29sb3JcIixcbiAgICAgIFwidGV4dC1hbGlnblwiLFxuICAgIF0pLFxuICAgIHBhcmFncmFwaDogc3R5bGUocGFyYSwgW1xuICAgICAgXCJmb250LXNpemVcIixcbiAgICAgIFwibGluZS1oZWlnaHRcIixcbiAgICAgIFwibWFyZ2luLXRvcFwiLFxuICAgICAgXCJtYXJnaW4tYm90dG9tXCIsXG4gICAgICBcIm1hcmdpbi1sZWZ0XCIsXG4gICAgICBcIm1hcmdpbi1yaWdodFwiLFxuICAgICAgXCJ0ZXh0LWluZGVudFwiLFxuICAgICAgXCJ0ZXh0LWFsaWduXCIsXG4gICAgXSksXG4gICAgaDE6IHN0eWxlKGgxLCBbXG4gICAgICBcImZvbnQtc2l6ZVwiLFxuICAgICAgXCJsaW5lLWhlaWdodFwiLFxuICAgICAgXCJmb250LXdlaWdodFwiLFxuICAgICAgXCJtYXJnaW4tdG9wXCIsXG4gICAgICBcIm1hcmdpbi1ib3R0b21cIixcbiAgICAgIFwidGV4dC1hbGlnblwiLFxuICAgIF0pLFxuICAgIGxpc3RJdGVtOiBzdHlsZShsaXN0SXRlbSwgW1xuICAgICAgXCJwYWRkaW5nLWxlZnRcIixcbiAgICAgIFwibWFyZ2luLWxlZnRcIixcbiAgICAgIFwibWFyZ2luLXJpZ2h0XCIsXG4gICAgICBcInRleHQtaW5kZW50XCIsXG4gICAgICBcImxpbmUtaGVpZ2h0XCIsXG4gICAgICBcInRleHQtYWxpZ25cIixcbiAgICBdKSxcbiAgICBjb2RlQmxvY2s6IHN0eWxlKHByZSwgW1xuICAgICAgXCJmb250LXNpemVcIixcbiAgICAgIFwibGluZS1oZWlnaHRcIixcbiAgICAgIFwicGFkZGluZy10b3BcIixcbiAgICAgIFwicGFkZGluZy1yaWdodFwiLFxuICAgICAgXCJwYWRkaW5nLWJvdHRvbVwiLFxuICAgICAgXCJwYWRkaW5nLWxlZnRcIixcbiAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiLFxuICAgICAgXCJib3JkZXItcmFkaXVzXCIsXG4gICAgXSksXG4gICAgYmxvY2txdW90ZTogc3R5bGUocXVvdGUsIFtcbiAgICAgIFwicGFkZGluZy10b3BcIixcbiAgICAgIFwicGFkZGluZy1yaWdodFwiLFxuICAgICAgXCJwYWRkaW5nLWJvdHRvbVwiLFxuICAgICAgXCJwYWRkaW5nLWxlZnRcIixcbiAgICAgIFwibWFyZ2luLXRvcFwiLFxuICAgICAgXCJtYXJnaW4tYm90dG9tXCIsXG4gICAgICBcImJvcmRlci1sZWZ0LXdpZHRoXCIsXG4gICAgICBcImJhY2tncm91bmQtY29sb3JcIixcbiAgICBdKSxcbiAgICBpbmxpbmVDb2RlOiBzdHlsZShpbmxpbmVDb2RlLCBbXG4gICAgICBcImZvbnQtc2l6ZVwiLFxuICAgICAgXCJwYWRkaW5nLXRvcFwiLFxuICAgICAgXCJwYWRkaW5nLWJvdHRvbVwiLFxuICAgICAgXCJwYWRkaW5nLWxlZnRcIixcbiAgICAgIFwicGFkZGluZy1yaWdodFwiLFxuICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCIsXG4gICAgICBcImJvcmRlci1yYWRpdXNcIixcbiAgICBdKSxcbiAgICB0YWJsZTogc3R5bGUodGFibGUsIFtcImZvbnQtc2l6ZVwiLCBcImxpbmUtaGVpZ2h0XCIsIFwid2lkdGhcIiwgXCJib3JkZXItY29sbGFwc2VcIl0pLFxuICAgIGltYWdlOiBzdHlsZShpbWcsIFtcImRpc3BsYXlcIiwgXCJtYXJnaW4tbGVmdFwiLCBcIm1hcmdpbi1yaWdodFwiLCBcIm1heC13aWR0aFwiLCBcIndpZHRoXCJdKSxcbiAgICBob3Jpem9udGFsUnVsZTogc3R5bGUoaHIsIFtcIm1hcmdpbi10b3BcIiwgXCJtYXJnaW4tYm90dG9tXCIsIFwiYm9yZGVyLXRvcC13aWR0aFwiLCBcImhlaWdodFwiXSksXG4gICAgY3NzVmFyaWFibGVzOiB7XG4gICAgICBcIi0tZm9udC10ZXh0XCI6IGNzc1ZhcihcIi0tZm9udC10ZXh0XCIpLFxuICAgICAgXCItLWxpbmUtaGVpZ2h0LW5vcm1hbFwiOiBjc3NWYXIoXCItLWxpbmUtaGVpZ2h0LW5vcm1hbFwiKSxcbiAgICAgIFwiLS1oMS1zaXplXCI6IGNzc1ZhcihcIi0taDEtc2l6ZVwiKSxcbiAgICAgIFwiLS1oMS1saW5lLWhlaWdodFwiOiBjc3NWYXIoXCItLWgxLWxpbmUtaGVpZ2h0XCIpLFxuICAgICAgXCItLWgxLW1hcmdpbi10b3BcIjogY3NzVmFyKFwiLS1oMS1tYXJnaW4tdG9wXCIpLFxuICAgICAgXCItLWgxLW1hcmdpbi1ib3R0b21cIjogY3NzVmFyKFwiLS1oMS1tYXJnaW4tYm90dG9tXCIpLFxuICAgICAgXCItLXAtc3BhY2luZ1wiOiBjc3NWYXIoXCItLXAtc3BhY2luZ1wiKSxcbiAgICAgIFwiLS1saXN0LXNwYWNpbmdcIjogY3NzVmFyKFwiLS1saXN0LXNwYWNpbmdcIiksXG4gICAgICBcIi0tbGlzdC1pbmRlbnRcIjogY3NzVmFyKFwiLS1saXN0LWluZGVudFwiKSxcbiAgICAgIFwiLS1jb2RlLXNpemVcIjogY3NzVmFyKFwiLS1jb2RlLXNpemVcIiksXG4gICAgICBcIi0tY29kZS1wYWRkaW5nXCI6IGNzc1ZhcihcIi0tY29kZS1wYWRkaW5nXCIpLFxuICAgICAgXCItLWNvZGUtcmFkaXVzXCI6IGNzc1ZhcihcIi0tY29kZS1yYWRpdXNcIiksXG4gICAgICBcIi0tYmxvY2txdW90ZS1wYWRkaW5nXCI6IGNzc1ZhcihcIi0tYmxvY2txdW90ZS1wYWRkaW5nXCIpLFxuICAgICAgXCItLWJsb2NrcXVvdGUtYm9yZGVyLXRoaWNrbmVzc1wiOiBjc3NWYXIoXCItLWJsb2NrcXVvdGUtYm9yZGVyLXRoaWNrbmVzc1wiKSxcbiAgICAgIFwiLS1maWxlLW1hcmdpbnNcIjogY3NzVmFyKFwiLS1maWxlLW1hcmdpbnNcIiksXG4gICAgICBcIi0tZmlsZS1saW5lLXdpZHRoXCI6IGNzc1ZhcihcIi0tZmlsZS1saW5lLXdpZHRoXCIpLFxuICAgICAgXCItLW5vcm1hbC1mb250LXNpemVcIjogY3NzVmFyKFwiLS1ub3JtYWwtZm9udC1zaXplXCIpLFxuICAgICAgXCItLWZvbnQtdGV4dC1zaXplXCI6IGNzc1ZhcihcIi0tZm9udC10ZXh0LXNpemVcIiksXG4gICAgfSxcbiAgfTtcbiAgcmV0dXJuIGR1bXA7XG59XG5cbi8qKlxuICogRGVidWcgdHlwb2dyYXBoeTogc2FtcGxlcyB0aGUgZml4ZWQgb25lLXBhZ2Ugc2FtcGxlIG5vdGVzIChlYWNoXG4gKiBjb3ZlcmluZyBhIGdyb3VwIG9mIGVsZW1lbnRzIFx1MjAxNCBhbGwgdmlzaWJsZSB3aXRob3V0IHNjcm9sbGluZyksXG4gKiB0aGVuIHRoZSBraXRjaGVuLXNpbmsgbm90ZSBpbiByZWFkaW5nIHZpZXcgKG5vIHZpcnR1YWxpemF0aW9uXG4gKiB0aGVyZSksIG1lcmdlcyBldmVyeXRoaW5nLCBjb21wdXRlcyB0aGUgZWRpdC12cy1yZWFkaW5nIGRpZmYgYW5kXG4gKiB3cml0ZXMgaXQgdG8gLm5hdGl2ZS1zbGlkZXMtZGVidWcuanNvbiBpbiB0aGUgdmF1bHQgcm9vdC5cbiAqIFRoZSB1c2VyJ3Mgb3duIG5vdGUgaXMgcmVzdG9yZWQgYXQgdGhlIGVuZC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGR1bXBUeXBvZ3JhcGh5KHBsdWdpbjogTmF0aXZlU2xpZGVzUGx1Z2luKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGFwcCA9IHBsdWdpbi5hcHA7XG4gIGlmICghZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuY29udGFpbnMoXCJuYXRpdmUtc2xpZGVzLW1vZGVcIikpIHtcbiAgICBuZXcgTm90aWNlKFwiTmF0aXZlIFNsaWRlczogZW50ZXIgU2xpZGVzIG1vZGUgZmlyc3QgKE1vZCtTaGlmdCtFIG9uIGEgZGVjayBub3RlKVwiKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgdmlldyA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICBpZiAoIXZpZXcpIHtcbiAgICBuZXcgTm90aWNlKFwiTmF0aXZlIFNsaWRlczogbm8gYWN0aXZlIE1hcmtkb3duIG5vdGVcIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHN0YXJ0TW9kZSA9IHZpZXcuZ2V0TW9kZSgpO1xuICBjb25zdCBhY3RpdmVGaWxlID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gIGNvbnN0IGxlYWYgPSBhcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpO1xuXG4gIC8vIEVkaXQgc2lkZTogZWFjaCBzaG9ydCBub3RlIGtlZXBzIGV2ZXJ5IHRhcmdldCBlbGVtZW50IG9uIHNjcmVlblxuICBjb25zdCBlZGl0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuICBmb3IgKGNvbnN0IG5hbWUgb2YgU0FNUExFX05PVEVfTkFNRVMpIHtcbiAgICBjb25zdCBmID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChgJHtuYW1lfS5tZGApO1xuICAgIGlmICghKGYgaW5zdGFuY2VvZiBURmlsZSkpIGNvbnRpbnVlO1xuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZiwgeyBzdGF0ZTogeyBtb2RlOiBcInNvdXJjZVwiIH0gfSk7XG4gICAgYXdhaXQgc2xlZXAoNTAwKTtcbiAgICBjb25zdCBzID0gc2FtcGxlU3R5bGVzKGFwcCk7XG4gICAgaWYgKHMpIG1lcmdlU2FtcGxlKGVkaXQsIHMpO1xuICB9XG5cbiAgLy8gUmVhZGluZyBzaWRlOiB0aGUga2l0Y2hlbi1zaW5rIG5vdGUgcmVuZGVycyBldmVyeXRoaW5nIGF0IG9uY2VcbiAgbGV0IHJlYWRpbmc6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCA9IG51bGw7XG4gIGNvbnN0IGRlbW8gPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKFwidHlwb2dyYXBoeS1kZW1vLm1kXCIpO1xuICBpZiAoZGVtbyBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgYXdhaXQgbGVhZi5vcGVuRmlsZShkZW1vLCB7IHN0YXRlOiB7IG1vZGU6IFwicHJldmlld1wiIH0gfSk7XG4gICAgYXdhaXQgc2xlZXAoODAwKTtcbiAgICByZWFkaW5nID0gc2FtcGxlU3R5bGVzKGFwcCk7XG4gIH1cblxuICAvLyBSZXN0b3JlIHRoZSB1c2VyJ3Mgbm90ZVxuICBpZiAoYWN0aXZlRmlsZSkge1xuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoYWN0aXZlRmlsZSwgeyBzdGF0ZTogeyBtb2RlOiBzdGFydE1vZGUgfSB9KTtcbiAgICBwbHVnaW4ucmVmcmVzaCgpO1xuICB9XG4gIGlmICghcmVhZGluZykge1xuICAgIG5ldyBOb3RpY2UoXCJOYXRpdmUgU2xpZGVzOiByZWFkaW5nIHNhbXBsZSBmYWlsZWRcIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgcGF5bG9hZCA9IHsgZWRpdCwgcmVhZGluZywgZGlmZjogZGlmZkR1bXBzKGVkaXQsIHJlYWRpbmcpIH07XG4gIHRyeSB7XG4gICAgYXdhaXQgYXBwLnZhdWx0LmFkYXB0ZXIud3JpdGUoXCIubmF0aXZlLXNsaWRlcy1kZWJ1Zy5qc29uXCIsIEpTT04uc3RyaW5naWZ5KHBheWxvYWQsIG51bGwsIDIpKTtcbiAgICBuZXcgTm90aWNlKFwiVHlwb2dyYXBoeSBkdW1wIFx1MjE5MiAubmF0aXZlLXNsaWRlcy1kZWJ1Zy5qc29uICh2YXVsdCByb290KVwiKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBuZXcgTm90aWNlKGBOYXRpdmUgU2xpZGVzOiBjb3VsZCBub3Qgd3JpdGUgZGVidWcgZmlsZSAoJHtTdHJpbmcoZXJyb3IpfSlgKTtcbiAgfVxuICBjb25zb2xlLmxvZyhcIltuYXRpdmUtc2xpZGVzIGRlYnVnLXN0eWxlc11cIiwgSlNPTi5zdHJpbmdpZnkocGF5bG9hZCwgbnVsbCwgMikpO1xufVxuXG4vKiogUmVnaXN0ZXIgdGhlIGRldi1vbmx5IGRlYnVnIGNvbW1hbmQgKGNhbGxlZCBvbmx5IHdoZW4gREVWX01PREUgaXMgdHJ1ZSkuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJEZWJ1Z0NvbW1hbmQocGx1Z2luOiBOYXRpdmVTbGlkZXNQbHVnaW4pOiB2b2lkIHtcbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcIm5zLWRlYnVnLXN0eWxlc1wiLFxuICAgIG5hbWU6IFwiRGVidWc6IER1bXAgVHlwb2dyYXBoeSBTdHlsZXNcIixcbiAgICBjYWxsYmFjazogKCkgPT4gdm9pZCBkdW1wVHlwb2dyYXBoeShwbHVnaW4pLFxuICB9KTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1hcmtkb3duVmlldywgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuLyoqIE1vZGUgb2YgdGhlIGFjdGl2ZSBNYXJrZG93biB2aWV3OiAncHJldmlldyc9cmVhZGluZyAnc291cmNlJz1lZGl0aW5nICcnPW5vbmUgKi9cbmV4cG9ydCBmdW5jdGlvbiBjdXJyZW50TW9kZShhcHA6IEFwcCk6IFwicHJldmlld1wiIHwgXCJzb3VyY2VcIiB8IFwiXCIge1xuICBjb25zdCB2aWV3ID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gIHJldHVybiB2aWV3ID8gKHZpZXcuZ2V0TW9kZSgpIGFzIFwicHJldmlld1wiIHwgXCJzb3VyY2VcIikgOiBcIlwiO1xufVxuXG4vKipcbiAqIFRydWUgd2hlbiB0aGUgYWN0aXZlIGVkaXQgdmlldyBpcyBMaXZlIFByZXZpZXcgKFNsaWRlcykgXHUyMDE0IGFzXG4gKiBvcHBvc2VkIHRvIFNvdXJjZSBtb2RlLiBPYnNpZGlhbiByZXBvcnRzIGJvdGggYXMgbW9kZSBcInNvdXJjZVwiO1xuICogdGhlIHZpZXcgc3RhdGUgY2FycmllcyBhIGBzb3VyY2VgIGZsYWcgKFNvdXJjZSBtb2RlID0gdHJ1ZSksIHdpdGhcbiAqIGEgRE9NIGNsYXNzIGZhbGxiYWNrICguaXMtbGl2ZS1wcmV2aWV3KSBmb3Igc2FmZXR5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNMaXZlUHJldmlldyhhcHA6IEFwcCk6IGJvb2xlYW4ge1xuICBjb25zdCB2aWV3ID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gIGlmICghdmlldyB8fCB2aWV3LmdldE1vZGUoKSAhPT0gXCJzb3VyY2VcIikgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBzdGF0ZSA9IHZpZXcuZ2V0U3RhdGUoKSBhcyB7IHNvdXJjZT86IGJvb2xlYW4gfTtcbiAgaWYgKHN0YXRlLnNvdXJjZSA9PT0gdHJ1ZSkgcmV0dXJuIGZhbHNlO1xuICBpZiAoc3RhdGUuc291cmNlID09PSBmYWxzZSkgcmV0dXJuIHRydWU7XG4gIHJldHVybiAhIXZpZXcuY29udGVudEVsLnF1ZXJ5U2VsZWN0b3IoXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNi5pcy1saXZlLXByZXZpZXdcIik7XG59XG5cbi8qKiBGcm9udG1hdHRlciBvZiBhbnkgbm90ZSBhcyBhbiBvYmplY3QsIG9yIG51bGwgd2hlbiBhYnNlbnQgKi9cbmV4cG9ydCBmdW5jdGlvbiBmcm9udG1hdHRlck9mKGFwcDogQXBwLCBmaWxlOiBURmlsZSk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCB7XG4gIGNvbnN0IGNhY2hlID0gYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICByZXR1cm4gY2FjaGU/LmZyb250bWF0dGVyID8/IG51bGw7XG59XG5cbi8qKiBDdXJyZW50IG5vdGUncyBmcm9udG1hdHRlciBhcyBhbiBvYmplY3QsIG9yIG51bGwgd2hlbiBhYnNlbnQgKi9cbmV4cG9ydCBmdW5jdGlvbiBhY3RpdmVGcm9udG1hdHRlcihhcHA6IEFwcCk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCB7XG4gIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgcmV0dXJuIGZpbGUgPyBmcm9udG1hdHRlck9mKGFwcCwgZmlsZSkgOiBudWxsO1xufVxuIiwgIi8qKiBQbHVnaW4gc2V0dGluZ3MgKi9cbmV4cG9ydCBpbnRlcmZhY2UgTmF0aXZlU2xpZGVzU2V0dGluZ3Mge1xuICAvKiogU2hvdyBcdTI1QzAgXHUyNUI2IHByZXZpb3VzL25leHQgYnV0dG9ucyBvbiB0aGUgbGVmdCBvZiB0aGUgYmFyICovXG4gIHNob3dOYXZCdXR0b25zOiBib29sZWFuO1xuICAvKiogU2hvdyB0aGUgYXV0by1jb21wdXRlZCBwYWdlIG51bWJlciBhdCB0aGUgYm90dG9tLXJpZ2h0IG9mIHRoZSBiYXIgKi9cbiAgc2hvd1BhZ2VOdW1iZXI6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoZSB1c2VyIG1hbnVhbGx5IGhpZCB0aGUgYmFyICh0b2dnbGUgY29tbWFuZCkgKi9cbiAgYmFySGlkZGVuOiBib29sZWFuO1xuICAvKiogQXV0by1lbnRlciBTbGlkZXMgbW9kZSB3aGVuIG9wZW5pbmcgYSBkZWNrIG5vdGUgKGRlZmF1bHQgb2ZmKSAqL1xuICBhdXRvRW50ZXJTbGlkZXM6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBOYXRpdmVTbGlkZXNTZXR0aW5ncyA9IHtcbiAgc2hvd05hdkJ1dHRvbnM6IHRydWUsXG4gIHNob3dQYWdlTnVtYmVyOiB0cnVlLFxuICBiYXJIaWRkZW46IGZhbHNlLFxuICBhdXRvRW50ZXJTbGlkZXM6IGZhbHNlLFxufTtcblxuLyoqIFJlc2VydmVkIGZyb250bWF0dGVyIGtleSBkcml2aW5nIGRlY2sgbmF2aWdhdGlvbiAobmV2ZXIgcmVuZGVyZWQgYXMgYSBjaGlwKSAqL1xuZXhwb3J0IGNvbnN0IERFQ0tfS0VZID0gXCJkZWNrXCI7XG4iLCAiaW1wb3J0IHR5cGUgTmF0aXZlU2xpZGVzUGx1Z2luIGZyb20gXCIuLi9tYWluXCI7XG5pbXBvcnQgeyByZWdpc3RlckRlYnVnQ29tbWFuZCB9IGZyb20gXCIuL2RlYnVnXCI7XG5pbXBvcnQgeyBmcm9udG1hdHRlck9mIH0gZnJvbSBcIi4vbW9kZVwiO1xuaW1wb3J0IHsgREVDS19LRVkgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG4vKiogUmVnaXN0ZXIgZXZlcnkgY29tbWFuZDsgdGhlIGRlYnVnIGNvbW1hbmQgaXMgZGV2LWJ1aWxkIG9ubHkuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb21tYW5kcyhwbHVnaW46IE5hdGl2ZVNsaWRlc1BsdWdpbik6IHZvaWQge1xuICAvLyBUb2dnbGUgdGhlIHByb3BlcnRpZXMgYmFyICh3aXRoaW4gU2xpZGVzIG1vZGUpXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJucy10b2dnbGUtYmFyXCIsXG4gICAgbmFtZTogXCJUb2dnbGUgUHJvcGVydGllcyBCYXJcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgcGx1Z2luLnNldHRpbmdzLmJhckhpZGRlbiA9ICFwbHVnaW4uc2V0dGluZ3MuYmFySGlkZGVuO1xuICAgICAgYXdhaXQgcGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgcGx1Z2luLnJlZnJlc2goKTtcbiAgICB9LFxuICB9KTtcbiAgLy8gUHJldmlvdXMgLyBuZXh0IHBhZ2UgKGRlY2sgbmF2aWdhdGlvbjsgZW50ZXJpbmcgU2xpZGVzIG1vZGUgYXMgbmVlZGVkKVxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwibnMtcHJldlwiLFxuICAgIG5hbWU6IFwiUHJldmlvdXMgUGFnZVwiLFxuICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJBcnJvd0xlZnRcIiB9XSxcbiAgICBjYWxsYmFjazogKCkgPT4gcGx1Z2luLm5hdmlnYXRlKFwicHJldlwiKSxcbiAgfSk7XG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJucy1uZXh0XCIsXG4gICAgbmFtZTogXCJOZXh0IFBhZ2VcIixcbiAgICBob3RrZXlzOiBbeyBtb2RpZmllcnM6IFtcIk1vZFwiLCBcIlNoaWZ0XCJdLCBrZXk6IFwiQXJyb3dSaWdodFwiIH1dLFxuICAgIGNhbGxiYWNrOiAoKSA9PiBwbHVnaW4ubmF2aWdhdGUoXCJuZXh0XCIpLFxuICB9KTtcbiAgLy8gQ3JlYXRlIE5leHQgU2xpZGUgXHUyMDE0IG5ldyBzbGlkZSBhZnRlciB0aGUgY3VycmVudCBvbmUgKGRlY2sgbm90ZXMgb25seSlcbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcIm5zLWNyZWF0ZS1uZXh0XCIsXG4gICAgbmFtZTogXCJDcmVhdGUgTmV4dCBTbGlkZVwiLFxuICAgIC8vIEdyZXllZCBvdXQgaW4gdGhlIHBhbGV0dGUgdW5sZXNzIHRoZSBhY3RpdmUgbm90ZSBjYW4gdGFrZSBhIG5leHQgc2xpZGVcbiAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmcpID0+IHtcbiAgICAgIGNvbnN0IGZpbGUgPSBwbHVnaW4uYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICBpZiAoIWZpbGUpIHJldHVybiBmYWxzZTtcbiAgICAgIGNvbnN0IHBsYW4gPSBwbHVnaW4uZGVja1NlcnZpY2UucGxhbkNyZWF0ZU5leHQoZmlsZSk7XG4gICAgICBpZiAoIXBsYW4pIHJldHVybiBmYWxzZTtcbiAgICAgIGlmICghY2hlY2tpbmcpIHZvaWQgcGx1Z2luLmRlY2tTZXJ2aWNlLmV4ZWN1dGVDcmVhdGVOZXh0KGZpbGUsIHBsYW4pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgfSk7XG4gIC8vIFRvZ2dsZSBTbGlkZXMgbW9kZSBcdTIwMTQgdGhlIGltbWVyc2l2ZSBjYXJkIHZpZXcgKGRlY2sgbm90ZXMgb25seSlcbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcIm5zLXRvZ2dsZS1zbGlkZXNcIixcbiAgICBuYW1lOiBcIlRvZ2dsZSBTbGlkZXMgTW9kZVwiLFxuICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJFXCIgfV0sXG4gICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB7XG4gICAgICBjb25zdCBmaWxlID0gcGx1Z2luLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgICAgaWYgKCFmaWxlKSByZXR1cm4gZmFsc2U7XG4gICAgICBjb25zdCBmbSA9IGZyb250bWF0dGVyT2YocGx1Z2luLmFwcCwgZmlsZSk7XG4gICAgICBpZiAoZm0gPT09IG51bGwgfHwgIShERUNLX0tFWSBpbiBmbSkpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmICghY2hlY2tpbmcpIHBsdWdpbi50b2dnbGVTbGlkZXMoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG4gIH0pO1xuICAvLyBEZWJ1ZyB0b29saW5nIFx1MjAxNCByZWdpc3RlcmVkIG9ubHkgaW4gZGV2IGJ1aWxkcyAodHJlZS1zaGFrZW4gaW4gcmVsZWFzZSlcbiAgaWYgKERFVl9NT0RFKSByZWdpc3RlckRlYnVnQ29tbWFuZChwbHVnaW4pO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTm90aWNlLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgcGxhbkNyZWF0ZU5leHQgYXMgcGxhbiwgdHlwZSBDcmVhdGVOZXh0UmVzdWx0IH0gZnJvbSBcIi4vY3JlYXRlTmV4dFwiO1xuaW1wb3J0IHsgY29tcHV0ZURlY2ssIGV4dHJhY3RMaW5rcywgZXh0cmFjdFJhd0xpbmtzLCB0eXBlIERlY2tJbmZvIH0gZnJvbSBcIi4vZGVja1wiO1xuaW1wb3J0IHsgZnJvbnRtYXR0ZXJPZiB9IGZyb20gXCIuL21vZGVcIjtcbmltcG9ydCB7IERFQ0tfS0VZIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuLyoqIERlY2sgY2hhaW4gcmVzb2x1dGlvbiArIFwiQ3JlYXRlIE5leHQgU2xpZGVcIiBnbHVlICh3cmFwcyB0aGUgcHVyZSBjb3JlKS4gKi9cbmV4cG9ydCBjbGFzcyBEZWNrU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgYXBwOiBBcHApIHt9XG5cbiAgLyoqIFJlc29sdmUgdGhlIGN1cnJlbnQgbm90ZSdzIHBvc2l0aW9uIGluc2lkZSBpdHMgZGVjayAocGF0aC1iYXNlZCB3cmFwcGVyKSAqL1xuICBjb21wdXRlKGZpbGU6IFRGaWxlKTogRGVja0luZm8gfCBudWxsIHtcbiAgICByZXR1cm4gY29tcHV0ZURlY2soZmlsZS5wYXRoLCAocGF0aCkgPT4gdGhpcy5saW5rUGF0aHMocGF0aCkpO1xuICB9XG5cbiAgLyoqIFJlc29sdmUgdGhlIGBkZWNrYCBwcm9wZXJ0eSBvZiBhIG5vdGUgaW50byByZWFsIG5vdGUgcGF0aHMgKG1heCB0d28pICovXG4gIHByaXZhdGUgbGlua1BhdGhzKHBhdGg6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBmID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgIGlmICghKGYgaW5zdGFuY2VvZiBURmlsZSkpIHJldHVybiBbXTtcbiAgICBjb25zdCBmbSA9IGZyb250bWF0dGVyT2YodGhpcy5hcHAsIGYpO1xuICAgIGNvbnN0IG5hbWVzID0gZm0gPyBleHRyYWN0TGlua3MoZm1bREVDS19LRVldKSA6IFtdO1xuICAgIHJldHVybiBuYW1lc1xuICAgICAgLm1hcCgobmFtZSkgPT4gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChuYW1lLCBwYXRoKSlcbiAgICAgIC5maWx0ZXIoKHgpOiB4IGlzIFRGaWxlID0+ICEheClcbiAgICAgIC5tYXAoKHgpID0+IHgucGF0aCk7XG4gIH1cblxuICAvKiogTmFtZXMgaW4gdGhlIGBkZWNrYCBwcm9wZXJ0eSB0aGF0IHJlc29sdmUgdG8gbm8gbm90ZSAoYnJva2VuIGxpbmtzKSAqL1xuICBicm9rZW4oZmlsZTogVEZpbGUpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZm0gPSBmcm9udG1hdHRlck9mKHRoaXMuYXBwLCBmaWxlKTtcbiAgICBjb25zdCBuYW1lcyA9IGZtID8gZXh0cmFjdExpbmtzKGZtW0RFQ0tfS0VZXSkgOiBbXTtcbiAgICByZXR1cm4gbmFtZXMuZmlsdGVyKChuYW1lKSA9PiAhdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChuYW1lLCBmaWxlLnBhdGgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQbGFuIGEgXCJDcmVhdGUgTmV4dCBTbGlkZVwiIHJ1biBmb3IgdGhlIGFjdGl2ZSBub3RlLCBvciBudWxsIHdoZW4gdGhlXG4gICAqIG5vdGUgY2Fubm90IHRha2UgYSBuZXh0IHNsaWRlIChubyB1c2FibGUgYGRlY2tgIHByb3BlcnR5KS5cbiAgICpcbiAgICogU2xpZGVzIG9uIHRoZSBjaGFpbiBpbnNlcnQvYXBwZW5kIGFmdGVyIHRoZSBjdXJyZW50IG5vdGU7IHRoZSBvdmVydmlld1xuICAgKiBwYWdlIGluc2VydHMgYSBuZXcgZmlyc3QgcGFnZTsgYW4gb2ZmLWNoYWluIG5vdGUgd2l0aCBhIHJlc29sdmFibGVcbiAgICogb3ZlcnZpZXcgbGluayBzdGlsbCBnZXRzIGl0cyBkZWNsYXJlZCBtaXNzaW5nIG5leHQgbm90ZSBjcmVhdGVkLlxuICAgKi9cbiAgcGxhbkNyZWF0ZU5leHQoZmlsZTogVEZpbGUpOiBDcmVhdGVOZXh0UmVzdWx0IHwgbnVsbCB7XG4gICAgY29uc3QgZm0gPSBmcm9udG1hdHRlck9mKHRoaXMuYXBwLCBmaWxlKTtcbiAgICBjb25zdCByYXcgPSBmbSA/IGV4dHJhY3RSYXdMaW5rcyhmbVtERUNLX0tFWV0pIDogW107XG4gICAgaWYgKHJhdy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuXG4gICAgY29uc3QgZGVjayA9IHRoaXMuY29tcHV0ZShmaWxlKTtcbiAgICBjb25zdCBleGlzdGluZ05hbWVzID0gbmV3IFNldCh0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCkubWFwKChmKSA9PiBmLmJhc2VuYW1lKSk7XG5cbiAgICBpZiAoZGVjaykge1xuICAgICAgLy8gT3ZlcnZpZXcgaW5zZXJ0aW9uIG5lZWRzIHRoZSBvbGQgZmlyc3QgcGFnZSdzIGJhY2sgbGluayB0byB0aGVcbiAgICAgIC8vIG92ZXJ2aWV3IChpdHMgb3duIGZyb250bWF0dGVyIG9ubHkgbGlua3MgZm9yd2FyZCkuXG4gICAgICBsZXQgb3ZlcnZpZXdCYWNrTGluazogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKGRlY2suaW5kZXggPT09IDApIHtcbiAgICAgICAgY29uc3Qgb2xkRmlyc3QgPSBkZWNrLmNoYWluWzFdID8gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGRlY2suY2hhaW5bMV0pIDogbnVsbDtcbiAgICAgICAgaWYgKG9sZEZpcnN0IGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgICAgICBjb25zdCBmMiA9IGZyb250bWF0dGVyT2YodGhpcy5hcHAsIG9sZEZpcnN0KTtcbiAgICAgICAgICBvdmVydmlld0JhY2tMaW5rID0gZjIgPyBleHRyYWN0UmF3TGlua3MoZjJbREVDS19LRVldKVswXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHBsYW4oe1xuICAgICAgICBjdXJyZW50TmFtZTogZmlsZS5iYXNlbmFtZSxcbiAgICAgICAgY3VycmVudExpbmtzOiByYXcsXG4gICAgICAgIGlzT3ZlcnZpZXc6IGRlY2suaW5kZXggPT09IDAsXG4gICAgICAgIG92ZXJ2aWV3QmFja0xpbmssXG4gICAgICAgIGV4aXN0aW5nTmFtZXMsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBPZmYtY2hhaW4gbm90ZTogc3RpbGwgY3JlYXRlIGl0cyBkZWNsYXJlZCBtaXNzaW5nIG5leHQgbm90ZSB3aGVuIHRoZVxuICAgIC8vIG92ZXJ2aWV3IGxpbmsgcmVzb2x2ZXMgKHRoZSBcdTI2QTAgYnJva2VuLWxpbmsgd2FybmluZyBkaXNhcHBlYXJzKS5cbiAgICBjb25zdCBvdmVydmlld05hbWUgPSByYXcubGVuZ3RoID49IDIgPyBleHRyYWN0TGlua3MocmF3WzBdKVswXSA6IG51bGw7XG4gICAgaWYgKG92ZXJ2aWV3TmFtZSAmJiB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KG92ZXJ2aWV3TmFtZSwgZmlsZS5wYXRoKSkge1xuICAgICAgcmV0dXJuIHBsYW4oe1xuICAgICAgICBjdXJyZW50TmFtZTogZmlsZS5iYXNlbmFtZSxcbiAgICAgICAgY3VycmVudExpbmtzOiByYXcsXG4gICAgICAgIGlzT3ZlcnZpZXc6IGZhbHNlLFxuICAgICAgICBleGlzdGluZ05hbWVzLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqIEFwcGx5IGEgcGxhbjogY3JlYXRlIHRoZSBub3RlLCByZXdpcmUgYGRlY2tgIHByb3BlcnRpZXMsIG9wZW4gaXQgKi9cbiAgYXN5bmMgZXhlY3V0ZUNyZWF0ZU5leHQoZmlsZTogVEZpbGUsIHBsYW46IENyZWF0ZU5leHRSZXN1bHQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBkaXIgPSBmaWxlLnBhcmVudD8ucGF0aCA/IGZpbGUucGFyZW50LnBhdGggKyBcIi9cIiA6IFwiXCI7XG4gICAgY29uc3QgbmV3UGF0aCA9IGAke2Rpcn0ke3BsYW4ubmV3TmFtZX0ubWRgO1xuICAgIGNvbnN0IGZyb250bWF0dGVyID0gcGxhbi5uZXdEZWNrTGlua3MubWFwKChsaW5rKSA9PiBKU09OLnN0cmluZ2lmeShsaW5rKSkuam9pbihcIiwgXCIpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBgLS0tXFxuZGVjazogWyR7ZnJvbnRtYXR0ZXJ9XVxcbi0tLVxcbmA7XG5cbiAgICBsZXQgbmV3RmlsZTogVEZpbGU7XG4gICAgdHJ5IHtcbiAgICAgIG5ld0ZpbGUgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUobmV3UGF0aCwgY29udGVudCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIG5ldyBOb3RpY2UoYE5hdGl2ZSBTbGlkZXM6IGNvdWxkIG5vdCBjcmVhdGUgXCIke3BsYW4ubmV3TmFtZX0ubWRcIiAoJHtTdHJpbmcoZXJyb3IpfSlgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSZXdpcmUgdGhlIGN1cnJlbnQgbm90ZSdzIGBkZWNrYCAoa2VlcHMgYWxsIG90aGVyIHByb3BlcnRpZXMgaW50YWN0KVxuICAgIGZvciAoY29uc3QgcmV3cml0ZSBvZiBwbGFuLnJld3JpdGVzKSB7XG4gICAgICBpZiAocmV3cml0ZS5uYW1lICE9PSBmaWxlLmJhc2VuYW1lKSBjb250aW51ZTsgLy8gaW4gcHJhY3RpY2UgYWx3YXlzIHRoZSBjdXJyZW50IG5vdGVcbiAgICAgIGF3YWl0IHRoaXMuYXBwLmZpbGVNYW5hZ2VyLnByb2Nlc3NGcm9udE1hdHRlcihmaWxlLCAoZm0pID0+IHtcbiAgICAgICAgZm1bREVDS19LRVldID0gcmV3cml0ZS5kZWNrO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gT3BlbiB0aGUgbmV3IG5vdGUgaW4gdGhlIGN1cnJlbnQgcGFuZSwgZWRpdCBtb2RlIChMaXZlIFByZXZpZXcpXG4gICAgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKTtcbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKG5ld0ZpbGUsIHsgc3RhdGU6IHsgbW9kZTogXCJzb3VyY2VcIiB9IH0pO1xuICB9XG59XG4iLCAiLyoqXG4gKiBkZWNrLnRzIFx1MjAxNCBQdXJlIGRlY2stcmVzb2x1dGlvbiBjb3JlIGZvciBuYXRpdmUtc2xpZGVzLlxuICpcbiAqIEV2ZXJ5dGhpbmcgaW4gdGhpcyBtb2R1bGUgaXMgZnJlZSBvZiBPYnNpZGlhbiBydW50aW1lIGRlcGVuZGVuY2llcyBzbyBpdCBjYW5cbiAqIGJlIHVuaXQgdGVzdGVkIGRpcmVjdGx5IChzZWUgdGVzdC9kZWNrLnRlc3QudHMpLiBtYWluLnRzIGFkYXB0cyB0aGUgdmF1bHRcbiAqIChtZXRhZGF0YUNhY2hlKSB0byB0aGlzIHB1cmUgaW50ZXJmYWNlOiBpdCByZXNvbHZlcyBgZGVja2AgcHJvcGVydGllcyB0b1xuICogbm90ZSBwYXRocywgdGhlbiBoYW5kcyB0aGUgcGF0aCBncmFwaCB0byBjb21wdXRlRGVjaygpLlxuICovXG5cbi8qKiBBIGRlY2sgbGluayBsaXN0IG5ldmVyIGhvbGRzIG1vcmUgdGhhbiB0d28gZW50cmllcyAqL1xuZXhwb3J0IGNvbnN0IE1BWF9ERUNLX0xJTktTID0gMjtcblxuLyoqIFJlc3VsdCBvZiByZXNvbHZpbmcgYSBub3RlJ3MgcG9zaXRpb24gaW5zaWRlIGEgZGVjayAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWNrSW5mbyB7XG4gIC8qKiBDaGFpbiBvZiBub3RlIHBhdGhzOiBbMF0gaXMgdGhlIG92ZXJ2aWV3IG5vdGUsIHRoZW4gc2xpZGVzIGluIG9yZGVyICovXG4gIGNoYWluOiBzdHJpbmdbXTtcbiAgLyoqIEluZGV4IG9mIHRoZSBjdXJyZW50IG5vdGUgaW5zaWRlIGNoYWluICovXG4gIGluZGV4OiBudW1iZXI7XG59XG5cbi8qKlxuICogUmVzb2x2ZSBhIG5vdGUncyBwb3NpdGlvbiBpbnNpZGUgaXRzIGRlY2sgYnkgd2Fsa2luZyB0aGUgbGluayBjaGFpbi5cbiAqXG4gKiBDb252ZW50aW9uIGZvciB0aGUgc2luZ2xlIGBkZWNrYCBwcm9wZXJ0eSAodXAgdG8gdHdvIGxpbmtzKTpcbiAqICAgLSBvdmVydmlldyBub3RlOiBvbmUgbGluayBcdTIxOTIgdGhhdCBsaW5rIElTIHRoZSBmaXJzdCBwYWdlO1xuICogICAtIHNsaWRlIG5vdGU6ICAgIGZpcnN0IGxpbmsgXHUyMTkyIHRoZSBvdmVydmlldyBwYWdlLCBzZWNvbmQgbGluayBcdTIxOTIgbmV4dCBzbGlkZVxuICogICAgICAgICAgICAgICAgICAgIChubyBzZWNvbmQgbGluayBvbiB0aGUgbGFzdCBzbGlkZSkuXG4gKlxuICogYGdldExpbmtzKHBhdGgpYCBtdXN0IHJldHVybiB0aGUgcmVzb2x2ZWQgbm90ZSBwYXRocyBvZiB0aGUgYGRlY2tgIHByb3BlcnR5XG4gKiBvZiB0aGUgbm90ZSBhdCBgcGF0aGAgKGVtcHR5IHdoZW4gdGhlIG5vdGUgaGFzIG5vbmUsIG9yIGl0cyBsaW5rcyBhcmVcbiAqIGJyb2tlbiBcdTIwMTQgYSBicm9rZW4gbGluayBzaW1wbHkgZW5kcyBvciBleGNsdWRlcyB0aGUgY2hhaW4sIG5ldmVyIGNyYXNoZXMpLlxuICpcbiAqIFJldHVybnMgdGhlIGZ1bGwgY2hhaW4gKFtvdmVydmlldywgc2xpZGUgMSwgc2xpZGUgMiwgXHUyMDI2XSkgYW5kIHRoZSBjdXJyZW50XG4gKiBub3RlJ3MgaW5kZXgsIG9yIG51bGwgd2hlbiB0aGUgbm90ZSBpcyBub3QgcGFydCBvZiBhbnkgZGVjay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVEZWNrKFxuICBjdXJyZW50UGF0aDogc3RyaW5nLFxuICBnZXRMaW5rczogKHBhdGg6IHN0cmluZykgPT4gc3RyaW5nW10sXG4pOiBEZWNrSW5mbyB8IG51bGwge1xuICBjb25zdCBjdXJyZW50TGlua3MgPSBnZXRMaW5rcyhjdXJyZW50UGF0aCk7XG4gIGlmIChjdXJyZW50TGlua3MubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICBsZXQgb3ZlcnZpZXc6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgbGV0IGZpcnN0UGFnZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gIGlmIChjdXJyZW50TGlua3MubGVuZ3RoID49IDIpIHtcbiAgICAvLyBBIHNsaWRlOiBmaXJzdCBsaW5rIGlzIHRoZSBvdmVydmlldyBwYWdlXG4gICAgb3ZlcnZpZXcgPSBjdXJyZW50TGlua3NbMF07XG4gICAgZmlyc3RQYWdlID0gZ2V0TGlua3Mob3ZlcnZpZXcpWzBdO1xuICB9IGVsc2Uge1xuICAgIC8vIEEgc2luZ2xlIGxpbms6IGVpdGhlciB3ZSBBUkUgdGhlIG92ZXJ2aWV3IChsaW5rID0gZmlyc3QgcGFnZSksXG4gICAgLy8gb3Igd2UgYXJlIHRoZSBsYXN0IHNsaWRlIChsaW5rID0gb3ZlcnZpZXcgcGFnZSlcbiAgICBjb25zdCBvbmx5ID0gY3VycmVudExpbmtzWzBdO1xuICAgIGNvbnN0IG9ubHlMaW5rcyA9IGdldExpbmtzKG9ubHkpO1xuICAgIGlmIChvbmx5TGlua3NbMF0gPT09IGN1cnJlbnRQYXRoKSB7XG4gICAgICBvdmVydmlldyA9IGN1cnJlbnRQYXRoO1xuICAgICAgZmlyc3RQYWdlID0gb25seTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3ZlcnZpZXcgPSBvbmx5O1xuICAgICAgZmlyc3RQYWdlID0gb25seUxpbmtzWzBdO1xuICAgIH1cbiAgfVxuICBpZiAoIW92ZXJ2aWV3IHx8ICFmaXJzdFBhZ2UpIHJldHVybiBudWxsO1xuXG4gIC8vIFdhbGsgdGhlIGNoYWluOiBvdmVydmlldyBcdTIxOTIgZmlyc3QgcGFnZSBcdTIxOTIgbmV4dCBcdTIxOTIgbmV4dCBcdTIxOTIgXHUyMDI2XG4gIGNvbnN0IGNoYWluOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCB2aXNpdGVkID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHB1c2ggPSAocDogc3RyaW5nIHwgdW5kZWZpbmVkKTogdm9pZCA9PiB7XG4gICAgaWYgKHAgJiYgIXZpc2l0ZWQuaGFzKHApKSB7XG4gICAgICB2aXNpdGVkLmFkZChwKTtcbiAgICAgIGNoYWluLnB1c2gocCk7XG4gICAgfVxuICB9O1xuICBwdXNoKG92ZXJ2aWV3KTtcbiAgcHVzaChmaXJzdFBhZ2UpO1xuICBsZXQgY3VyID0gZmlyc3RQYWdlO1xuICB3aGlsZSAoY3VyKSB7XG4gICAgY29uc3QgbmV4dCA9IGdldExpbmtzKGN1cilbMV07XG4gICAgaWYgKCFuZXh0IHx8IHZpc2l0ZWQuaGFzKG5leHQpKSBicmVhazsgLy8gZW5kIG9mIGRlY2sgb3IgY3ljbGUgZ3VhcmRcbiAgICBwdXNoKG5leHQpO1xuICAgIGN1ciA9IG5leHQ7XG4gIH1cblxuICBjb25zdCBpbmRleCA9IGNoYWluLmluZGV4T2YoY3VycmVudFBhdGgpO1xuICBpZiAoaW5kZXggPT09IC0xKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHsgY2hhaW4sIGluZGV4IH07XG59XG5cbi8qKlxuICogRXh0cmFjdCB1cCB0byBgbWF4YCBub3RlIG5hbWVzIGZyb20gYSBgZGVja2AgcHJvcGVydHkgdmFsdWUuXG4gKiBBY2NlcHRzIGEgc2luZ2xlIHN0cmluZyBvciBhIFlBTUwgbGlzdCBvZiBzdHJpbmdzOyB1bnF1b3RlZCBbW3hdXSB2YWx1ZXMgYXJlXG4gKiBwYXJzZWQgYnkgWUFNTCBhcyBuZXN0ZWQgYXJyYXlzIGFuZCBmbGF0dGVuZWQgaGVyZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RMaW5rcyh2YWx1ZTogdW5rbm93biwgbWF4OiBudW1iZXIgPSBNQVhfREVDS19MSU5LUyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgZmxhdDogdW5rbm93bltdID0gW107XG4gIGNvbnN0IGNvbGxlY3QgPSAodjogdW5rbm93bik6IHZvaWQgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHYpKSB7XG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdikgY29sbGVjdChpdGVtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmxhdC5wdXNoKHYpO1xuICAgIH1cbiAgfTtcbiAgY29sbGVjdCh2YWx1ZSk7XG5cbiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGNvbnN0IGl0ZW0gb2YgZmxhdCkge1xuICAgIGNvbnN0IG5hbWUgPSBleHRyYWN0TGlua1RleHQoaXRlbSk7XG4gICAgaWYgKG5hbWUpIG91dC5wdXNoKG5hbWUpO1xuICAgIGlmIChvdXQubGVuZ3RoID49IG1heCkgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHVwIHRvIGBtYXhgIHJhdyBsaW5rIHN0cmluZ3MgZnJvbSBhIGBkZWNrYCBwcm9wZXJ0eSB2YWx1ZSBcdTIwMTQgdGhlXG4gKiB0cmltbWVkIHZhbHVlcyBleGFjdGx5IGFzIHdyaXR0ZW4gKGFsaWFzIC8gcGF0aCBmb3JtcyBwcmVzZXJ2ZWQpLiBTYW1lXG4gKiBmbGF0dGVuaW5nIHJ1bGVzIGFzIGV4dHJhY3RMaW5rcygpLCBidXQgd2l0aG91dCBleHRyYWN0aW5nIHRoZSB0YXJnZXQgbmFtZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RSYXdMaW5rcyh2YWx1ZTogdW5rbm93biwgbWF4OiBudW1iZXIgPSBNQVhfREVDS19MSU5LUyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgZmxhdDogdW5rbm93bltdID0gW107XG4gIGNvbnN0IGNvbGxlY3QgPSAodjogdW5rbm93bik6IHZvaWQgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHYpKSB7XG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdikgY29sbGVjdChpdGVtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmxhdC5wdXNoKHYpO1xuICAgIH1cbiAgfTtcbiAgY29sbGVjdCh2YWx1ZSk7XG5cbiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGNvbnN0IGl0ZW0gb2YgZmxhdCkge1xuICAgIGlmICh0eXBlb2YgaXRlbSAhPT0gXCJzdHJpbmdcIikgY29udGludWU7XG4gICAgY29uc3QgdHJpbW1lZCA9IGl0ZW0udHJpbSgpO1xuICAgIGlmICghdHJpbW1lZCkgY29udGludWU7XG4gICAgb3V0LnB1c2godHJpbW1lZCk7XG4gICAgaWYgKG91dC5sZW5ndGggPj0gbWF4KSBicmVhaztcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIHRhcmdldCBub3RlIG5hbWUgZnJvbSBhIG1hcmtkb3duIGxpbmsgc3RyaW5nLlxuICogSGFuZGxlcyBzZXZlcmFsIHNoYXBlczpcbiAqICAgXCJbW3NsaWRlLTJdXVwiICAgICAgICBcdTIxOTIgc2xpZGUtMlxuICogICBcIltbc2xpZGUtMnxhbGlhc11dXCIgIFx1MjE5MiBzbGlkZS0yXG4gKiAgIFwiW1tzbGlkZS0yI3NlY3Rpb25dXVwiXHUyMTkyIHNsaWRlLTJcbiAqICAgc2xpZGUtMiAgICAgICAgICAgICAgXHUyMTkyIHNsaWRlLTIgKGJhcmUgZmlsZW5hbWUpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0TGlua1RleHQodmFsdWU6IHVua25vd24pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHRyaW1tZWQgPSB2YWx1ZS50cmltKCk7XG4gIGlmICghdHJpbW1lZCkgcmV0dXJuIG51bGw7XG4gIHJldHVybiB0cmltbWVkLnJlcGxhY2UoL15cXFtcXFsvLCBcIlwiKS5yZXBsYWNlKC9cXF1cXF0kLywgXCJcIikuc3BsaXQoXCJ8XCIpWzBdLnNwbGl0KFwiI1wiKVswXS50cmltKCk7XG59XG5cbi8qKiBSZW5kZXIgYSBwcm9wZXJ0eSB2YWx1ZSBhcyByZWFkYWJsZSB0ZXh0OiBhcnJheXMvb2JqZWN0cyBcdTIxOTIgSlNPTiwgZWxzZSBTdHJpbmcgKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRWYWx1ZSh2YWx1ZTogdW5rbm93bik6IHN0cmluZyB7XG4gIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gXCJcdTIwMTRcIjtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIFN0cmluZyh2YWx1ZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBTdHJpbmcodmFsdWUpO1xufVxuIiwgIi8qKlxuICogY3JlYXRlTmV4dC50cyBcdTIwMTQgUHVyZSBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIgcGxhbm5pbmcgY29yZSBmb3IgbmF0aXZlLXNsaWRlcy5cbiAqXG4gKiBFdmVyeXRoaW5nIGluIHRoaXMgbW9kdWxlIGlzIGZyZWUgb2YgT2JzaWRpYW4gcnVudGltZSBkZXBlbmRlbmNpZXMgc28gaXQgY2FuXG4gKiBiZSB1bml0IHRlc3RlZCBkaXJlY3RseSAoc2VlIHRlc3QvY3JlYXRlTmV4dC50ZXN0LnRzKS4gbWFpbi50cyBhZGFwdHMgdGhlXG4gKiB2YXVsdCAobWV0YWRhdGFDYWNoZSwgY29tcHV0ZURlY2spIHRvIHRoaXMgcHVyZSBpbnRlcmZhY2UgYW5kIGFwcGxpZXMgdGhlXG4gKiByZXN1bHRpbmcgcGxhbiB3aXRoIHZhdWx0LmNyZWF0ZSgpICsgZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKCkuXG4gKlxuICogVGhlIHBsYW4gZGVjaWRlcywgZm9yIHRoZSBjdXJyZW50IG5vdGU6XG4gKiAgIC0gdGhlIG5hbWUgb2YgdGhlIG5ldyBzbGlkZSBmaWxlIChjb2xsaXNpb24tYXdhcmUpLFxuICogICAtIHRoZSByYXcgYGRlY2tgIGxpbmsgdGV4dHMgb2YgdGhlIG5ldyBub3RlLFxuICogICAtIHRoZSByZXdyaXRlcyBuZWVkZWQgb24gZXhpc3Rpbmcgbm90ZXMgKGluIHByYWN0aWNlIGFsd2F5cyB0aGUgY3VycmVudFxuICogICAgIG5vdGUgaXRzZWxmKS5cbiAqL1xuXG5pbXBvcnQgeyBleHRyYWN0TGlua1RleHQgfSBmcm9tIFwiLi9kZWNrXCI7XG5cbi8qKiBJbnB1dHMgZm9yIHBsYW5uaW5nIFx1MjAxNCByZXNvbHZlZCBieSB0aGUgYWRhcHRlciBpbiBtYWluLnRzICovXG5leHBvcnQgaW50ZXJmYWNlIENyZWF0ZU5leHRJbnB1dCB7XG4gIC8qKiBCYXNlbmFtZSAod2l0aG91dCBleHRlbnNpb24pIG9mIHRoZSBjdXJyZW50IG5vdGUgKi9cbiAgY3VycmVudE5hbWU6IHN0cmluZztcbiAgLyoqIFJhdyBgZGVja2AgbGluayB0ZXh0cyBvZiB0aGUgY3VycmVudCBub3RlIChleHRyYWN0ZWQsIHVwIHRvIHR3bykgKi9cbiAgY3VycmVudExpbmtzOiBzdHJpbmdbXTtcbiAgLyoqIFRydWUgd2hlbiB0aGUgY3VycmVudCBub3RlIElTIHRoZSBkZWNrJ3Mgb3ZlcnZpZXcgcGFnZSAoY2hhaW4gaW5kZXggMCkgKi9cbiAgaXNPdmVydmlldzogYm9vbGVhbjtcbiAgLyoqXG4gICAqIFJhdyBsaW5rIHRleHQgdGhlIG9sZCBmaXJzdCBwYWdlIHVzZXMgdG8gbGluayBiYWNrIHRvIHRoZSBvdmVydmlldy5cbiAgICogT25seSBtZWFuaW5nZnVsIGZvciBvdmVydmlldyBpbnNlcnRpb24gKHRoZSBvdmVydmlldyBpdHNlbGYgb25seSBsaW5rc1xuICAgKiBmb3J3YXJkLCBzbyBpdHMgb3duIGZyb250bWF0dGVyIGNvbnRhaW5zIG5vIHNlbGYtcmVmZXJlbmNlKS5cbiAgICovXG4gIG92ZXJ2aWV3QmFja0xpbms/OiBzdHJpbmc7XG4gIC8qKiBCYXNlbmFtZXMgb2YgZXZlcnkgbWFya2Rvd24gbm90ZSBpbiB0aGUgdmF1bHQgKGNvbGxpc2lvbi1mcmVlIG5hbWluZykgKi9cbiAgZXhpc3RpbmdOYW1lczogU2V0PHN0cmluZz47XG59XG5cbi8qKiBPbmUgbm90ZSB3aG9zZSBgZGVja2AgcHJvcGVydHkgbXVzdCBiZSByZXdyaXR0ZW4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVja1Jld3JpdGUge1xuICAvKiogQmFzZW5hbWUgb2YgdGhlIG5vdGUgdG8gcmV3cml0ZSAqL1xuICBuYW1lOiBzdHJpbmc7XG4gIC8qKiBUaGUgbmV3IHJhdyBgZGVja2AgbGluayB0ZXh0cyAoc2VyaWFsaXplZCBhcyBhIFlBTUwgbGlzdCkgKi9cbiAgZGVjazogc3RyaW5nW107XG59XG5cbi8qKiBUaGUgZnVsbCBwbGFuIGZvciBjcmVhdGluZyBvbmUgbmV3IHNsaWRlICovXG5leHBvcnQgaW50ZXJmYWNlIENyZWF0ZU5leHRSZXN1bHQge1xuICAvKiogQmFzZW5hbWUgKHdpdGhvdXQgZXh0ZW5zaW9uKSBvZiB0aGUgbmV3IHNsaWRlIGZpbGUgKi9cbiAgbmV3TmFtZTogc3RyaW5nO1xuICAvKiogUmF3IGBkZWNrYCBsaW5rIHRleHRzIGZvciB0aGUgbmV3IG5vdGUncyBmcm9udG1hdHRlciAqL1xuICBuZXdEZWNrTGlua3M6IHN0cmluZ1tdO1xuICAvKiogUmV3cml0ZXMgdG8gYXBwbHkgdG8gZXhpc3Rpbmcgbm90ZXMgKGluIHByYWN0aWNlIGFsd2F5cyB0aGUgY3VycmVudCBub3RlKSAqL1xuICByZXdyaXRlczogRGVja1Jld3JpdGVbXTtcbn1cblxuLyoqXG4gKiBQbGFuIHRoZSBjcmVhdGlvbiBvZiBhIG5ldyBzbGlkZSBhZnRlciB0aGUgY3VycmVudCBub3RlLlxuICpcbiAqIEJlaGF2aW9yczpcbiAqICAgLSBMYXN0IHNsaWRlIChubyBzZWNvbmQgbGluayk6IGFwcGVuZCBgPGN1cnJlbnQ+LW5leHRgIGFzIHRoZSBuZXcgbGFzdFxuICogICAgIHNsaWRlOyB0aGUgY3VycmVudCBub3RlIGdhaW5zIHRoZSBzZWNvbmQgbGluay5cbiAqICAgLSBTbGlkZSB3aXRoIGEgdmFsaWQgbmV4dDogaW5zZXJ0IGA8Y3VycmVudD4tbmV4dGAgYmV0d2VlbiB0aGVtOyB0aGUgbmV3XG4gKiAgICAgbm90ZSB0YWtlcyBvdmVyIHRoZSBvbGQgbmV4dCBsaW5rLlxuICogICAtIFNsaWRlIHdob3NlIHNlY29uZCBsaW5rIGlzIGJyb2tlbiAocGxhaW4sIG5vbi1leGlzdGluZyBuYW1lKTogY3JlYXRlXG4gKiAgICAgZXhhY3RseSB0aGUgZGVjbGFyZWQgbWlzc2luZyBub3RlIGFzIHRoZSBuZXcgbGFzdCBzbGlkZSBcdTIwMTQgdGhlIFx1MjZBMCB3YXJuaW5nXG4gKiAgICAgZGlzYXBwZWFycyBhbmQgdGhlIGF1dGhvcidzIGludGVudCBpcyBob25vdXJlZC4gQSBicm9rZW4gbGluayB0aGF0IGlzXG4gKiAgICAgbm90IGEgcGxhaW4gYmFzZW5hbWUgKHBhdGgtcXVhbGlmaWVkLCBzZWxmLXJlZmVyZW5jaW5nKSBpcyB0cmVhdGVkIGFzXG4gKiAgICAgaW52YWxpZCBhbmQgZHJvcHBlZCAoYXBwZW5kIGEgYDxjdXJyZW50Pi1uZXh0YCBsYXN0IHNsaWRlIGluc3RlYWQpLlxuICogICAtIE92ZXJ2aWV3IHBhZ2UgKHNpbmdsZSBsaW5rID0gZmlyc3QgcGFnZSk6IGluc2VydCBhIG5ldyBmaXJzdCBwYWdlOyB0aGVcbiAqICAgICBvdmVydmlldydzIGxpbmsgcG9pbnRzIHRvIGl0IGFuZCB0aGUgb2xkIGZpcnN0IHBhZ2UgaXMgcHVzaGVkIGJhY2suXG4gKlxuICogUmV0dXJucyBudWxsIHdoZW4gdGhlIG5vdGUgaGFzIG5vIHVzYWJsZSBgZGVja2AgbGlua3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwbGFuQ3JlYXRlTmV4dChpbnB1dDogQ3JlYXRlTmV4dElucHV0KTogQ3JlYXRlTmV4dFJlc3VsdCB8IG51bGwge1xuICBjb25zdCB7IGN1cnJlbnROYW1lLCBjdXJyZW50TGlua3MsIGlzT3ZlcnZpZXcgfSA9IGlucHV0O1xuICBpZiAoY3VycmVudExpbmtzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgLy8gXHUyNTAwXHUyNTAwIE92ZXJ2aWV3IHBhZ2U6IGluc2VydCBhIG5ldyBmaXJzdCBwYWdlIGFmdGVyIGl0IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBpZiAoaXNPdmVydmlldykge1xuICAgIGNvbnN0IG9sZEZpcnN0ID0gY3VycmVudExpbmtzWzBdO1xuICAgIGlmICghb2xkRmlyc3QpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IG5ld05hbWUgPSB1bmlxdWVOYW1lKGAke2N1cnJlbnROYW1lfS1uZXh0YCwgaW5wdXQuZXhpc3RpbmdOYW1lcyk7XG4gICAgY29uc3QgYmFjayA9IGlucHV0Lm92ZXJ2aWV3QmFja0xpbmsgPz8gYFtbJHtjdXJyZW50TmFtZX1dXWA7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5ld05hbWUsXG4gICAgICBuZXdEZWNrTGlua3M6IFtiYWNrLCBvbGRGaXJzdF0sXG4gICAgICByZXdyaXRlczogW3sgbmFtZTogY3VycmVudE5hbWUsIGRlY2s6IFtgW1ske25ld05hbWV9XV1gXSB9XSxcbiAgICB9O1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNsaWRlOiBmaXJzdCBsaW5rIGlzIHRoZSBvdmVydmlldyBwYWdlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCBvdmVydmlld0xpbmsgPSBjdXJyZW50TGlua3NbMF07XG4gIGlmICghb3ZlcnZpZXdMaW5rKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgbmV4dExpbmsgPSBjdXJyZW50TGlua3NbMV07XG5cbiAgaWYgKG5leHRMaW5rKSB7XG4gICAgY29uc3QgbmV4dE5hbWUgPSBleHRyYWN0TGlua1RleHQobmV4dExpbmspO1xuICAgIGlmIChuZXh0TmFtZSAmJiBpc1BsYWluTmFtZShuZXh0TmFtZSkgJiYgbmV4dE5hbWUgIT09IGN1cnJlbnROYW1lKSB7XG4gICAgICBpZiAoIWlucHV0LmV4aXN0aW5nTmFtZXMuaGFzKG5leHROYW1lKSkge1xuICAgICAgICAvLyBUaGUgZGVjbGFyZWQgbmV4dCBub3RlIGRvZXMgbm90IGV4aXN0IHlldCBcdTIxOTIgY3JlYXRlIGV4YWN0bHkgdGhhdFxuICAgICAgICAvLyBub3RlIChmaXhlcyB0aGUgYnJva2VuLWxpbmsgd2FybmluZywgaG9ub3VycyB0aGUgYXV0aG9yJ3MgaW50ZW50KS5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBuZXdOYW1lOiBuZXh0TmFtZSxcbiAgICAgICAgICBuZXdEZWNrTGlua3M6IFtvdmVydmlld0xpbmtdLFxuICAgICAgICAgIHJld3JpdGVzOiBbXSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIC8vIEEgdmFsaWQgbmV4dCBub3RlIGV4aXN0cyBcdTIxOTIgaW5zZXJ0IGJldHdlZW4gaXQgYW5kIHRoZSBjdXJyZW50IG5vdGUuXG4gICAgICBjb25zdCBuZXdOYW1lID0gdW5pcXVlTmFtZShgJHtjdXJyZW50TmFtZX0tbmV4dGAsIGlucHV0LmV4aXN0aW5nTmFtZXMpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmV3TmFtZSxcbiAgICAgICAgbmV3RGVja0xpbmtzOiBbb3ZlcnZpZXdMaW5rLCBuZXh0TGlua10sXG4gICAgICAgIHJld3JpdGVzOiBbeyBuYW1lOiBjdXJyZW50TmFtZSwgZGVjazogW292ZXJ2aWV3TGluaywgYFtbJHtuZXdOYW1lfV1dYF0gfV0sXG4gICAgICB9O1xuICAgIH1cbiAgICAvLyBJbnZhbGlkIChwYXRoLXF1YWxpZmllZCAvIHNlbGYtcmVmZXJlbmNpbmcpIG5leHQgbGluayBcdTIxOTIgZHJvcCBpdCBhbmRcbiAgICAvLyBhcHBlbmQgYSBuZXcgbGFzdCBzbGlkZSAoZmFsbCB0aHJvdWdoIHRvIHRoZSBuby1uZXh0IGJyYW5jaCkuXG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgTGFzdCBzbGlkZSBcdTIxOTIgYXBwZW5kIGEgbmV3IGxhc3Qgc2xpZGUgYWZ0ZXIgaXQgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IG5ld05hbWUgPSB1bmlxdWVOYW1lKGAke2N1cnJlbnROYW1lfS1uZXh0YCwgaW5wdXQuZXhpc3RpbmdOYW1lcyk7XG4gIHJldHVybiB7XG4gICAgbmV3TmFtZSxcbiAgICBuZXdEZWNrTGlua3M6IFtvdmVydmlld0xpbmtdLFxuICAgIHJld3JpdGVzOiBbeyBuYW1lOiBjdXJyZW50TmFtZSwgZGVjazogW292ZXJ2aWV3TGluaywgYFtbJHtuZXdOYW1lfV1dYF0gfV0sXG4gIH07XG59XG5cbi8qKiBBIG5hbWUgdXNhYmxlIGFzIGEgdmF1bHQgbm90ZSBuYW1lOiBubyBwYXRoIHNlcGFyYXRvcnMsIG5vbi1lbXB0eSAqL1xuZnVuY3Rpb24gaXNQbGFpbk5hbWUobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBuYW1lLmxlbmd0aCA+IDAgJiYgIW5hbWUuaW5jbHVkZXMoXCIvXCIpICYmICFuYW1lLmluY2x1ZGVzKFwiXFxcXFwiKTtcbn1cblxuLyoqIEZpcnN0IGZyZWUgbmFtZSBpbiB0aGUgZmFtaWx5IGBiYXNlYCwgYGJhc2UtMmAsIGBiYXNlLTNgLCBcdTIwMjYgKi9cbmZ1bmN0aW9uIHVuaXF1ZU5hbWUoYmFzZTogc3RyaW5nLCBleGlzdGluZzogU2V0PHN0cmluZz4pOiBzdHJpbmcge1xuICBpZiAoIWV4aXN0aW5nLmhhcyhiYXNlKSkgcmV0dXJuIGJhc2U7XG4gIGZvciAobGV0IGkgPSAyOyA7IGkrKykge1xuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGAke2Jhc2V9LSR7aX1gO1xuICAgIGlmICghZXhpc3RpbmcuaGFzKGNhbmRpZGF0ZSkpIHJldHVybiBjYW5kaWRhdGU7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSBOYXRpdmVTbGlkZXNQbHVnaW4gZnJvbSBcIi4uL21haW5cIjtcblxuLyoqIFNldHRpbmdzIHRhYjogdG9nZ2xlcyB0aGUgbmF2IGJ1dHRvbnMsIHBhZ2UgbnVtYmVyLCBhdXRvLWVudGVyIGFuZCBiYXIgdmlzaWJpbGl0eS4gKi9cbmV4cG9ydCBjbGFzcyBOYXRpdmVTbGlkZXNTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBOYXRpdmVTbGlkZXNQbHVnaW4pIHtcbiAgICBzdXBlcihwbHVnaW4uYXBwLCBwbHVnaW4pO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiTmF0aXZlIFNsaWRlcyBcdTAwQjcgU2V0dGluZ3NcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJTaG93IFByZXZpb3VzL05leHQgYnV0dG9uc1wiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiU2hvdyBcdTI1QzAgXHUyNUI2IGJ1dHRvbnMgb24gdGhlIGxlZnQgb2YgdGhlIGJhciB3aGVuIHRoZSBub3RlIGJlbG9uZ3MgdG8gYSBkZWNrIChoYXMgYSBgZGVja2AgcHJvcGVydHkpXCIsXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93TmF2QnV0dG9ucykub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd05hdkJ1dHRvbnMgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJTaG93IHBhZ2UgbnVtYmVyXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJBdXRvLWNvbXB1dGVkIGZyb20gdGhlIGRlY2sgY2hhaW4gKG92ZXJ2aWV3IHBhZ2Ugc2hvd3MgXHUyMDFDT3ZlcnZpZXdcdTIwMUQpOyBzaG93biBhdCB0aGUgYm90dG9tLXJpZ2h0XCIsXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93UGFnZU51bWJlcikub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1BhZ2VOdW1iZXIgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJBdXRvLWVudGVyIFNsaWRlcyBtb2RlXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJPcGVuIGRlY2sgbm90ZXMgZGlyZWN0bHkgaW4gU2xpZGVzIG1vZGUuIExlYXZlIG9mZiB0byBlbnRlciBtYW51YWxseSB3aXRoIHRoZSBUb2dnbGUgU2xpZGVzIE1vZGUgY29tbWFuZCAoTW9kK1NoaWZ0K0UpIG9yIHRoZSBwcmV2aW91cy9uZXh0IHBhZ2UgaG90a2V5cy5cIixcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9FbnRlclNsaWRlcykub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b0VudGVyU2xpZGVzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTmF2aWdhdGlvbiBob3RrZXlzXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJEZWZhdWx0OiBQcmV2aW91cyBQYWdlIE1vZCtTaGlmdCtcdTIxOTAsIE5leHQgUGFnZSBNb2QrU2hpZnQrXHUyMTkyLiBSZWJpbmQgdW5kZXIgU2V0dGluZ3MgXHUyMTkyIEhvdGtleXMuXCIsXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiT3BlbiBIb3RrZXlzIFNldHRpbmdzXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIC8vIE9wZW4gT2JzaWRpYW4ncyBob3RrZXlzIHNldHRpbmdzIHBhZ2UgKGludGVybmFsIEFQSTsgaWdub3JlIGZhaWx1cmVzKVxuICAgICAgICAgIChcbiAgICAgICAgICAgIHRoaXMuYXBwIGFzIHVua25vd24gYXMgeyBzZXR0aW5nPzogeyBvcGVuVGFiQnlJZD86IChpZDogc3RyaW5nKSA9PiB2b2lkIH0gfVxuICAgICAgICAgICkuc2V0dGluZz8ub3BlblRhYkJ5SWQ/LihcImhvdGtleXNcIik7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgfVxufVxuIiwgIi8qKiBSZW1vdmUgYWxsIGNoaWxkcmVuIG9mIGFuIGVsZW1lbnQgKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhckNoaWxkcmVuKGVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICB3aGlsZSAoZWwuZmlyc3RDaGlsZCkgZWwucmVtb3ZlQ2hpbGQoZWwuZmlyc3RDaGlsZCk7XG59XG5cbi8qKlxuICogUGluIGEgc2Nyb2xsZXIgdG8gdGhlIHRvcCBzbyBub3RoaW5nIGNhbiBzY3JvbGwgaXQgXHUyMDE0IG5laXRoZXIgdXNlciBpbnB1dFxuICogKGNvdmVyZWQgYnkgdGhlIENTUyBgb3ZlcmZsb3c6IGhpZGRlbmApIG5vciBDb2RlTWlycm9yJ3MgcHJvZ3JhbW1hdGljXG4gKiBzY3JvbGxJbnRvVmlldyAoZWRpdCAvIGRyYWctc2VsZWN0KSwgd2hpY2ggc2V0cyBgc2Nyb2xsVG9wYCBkaXJlY3RseS5cbiAqIFNoYWRvd3MgdGhlIHNjcm9sbCBBUElzOyB1bmRvIHdpdGggdW5sb2NrU2Nyb2xsZXIoKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvY2tTY3JvbGxlcihlbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3Qgbm9vcCA9ICgpOiB2b2lkID0+IHt9O1xuICAvLyBTaGFkb3cgdGhlIG5hdGl2ZSBzY3JvbGwgbWV0aG9kcyBDb2RlTWlycm9yIG1heSBjYWxsLlxuICAoZWwgYXMgdW5rbm93biBhcyB7IHNjcm9sbFRvPzogKC4uLmE6IHVua25vd25bXSkgPT4gdm9pZCB9KS5zY3JvbGxUbyA9IG5vb3A7XG4gIChlbCBhcyB1bmtub3duIGFzIHsgc2Nyb2xsQnk/OiAoLi4uYTogdW5rbm93bltdKSA9PiB2b2lkIH0pLnNjcm9sbEJ5ID0gbm9vcDtcbiAgKGVsIGFzIHVua25vd24gYXMgeyBzY3JvbGxJbnRvVmlldz86ICguLi5hOiB1bmtub3duW10pID0+IHZvaWQgfSkuc2Nyb2xsSW50b1ZpZXcgPSBub29wO1xuICAvLyBQaW4gdGhlIHNjcm9sbCBwb3NpdGlvbiBhY2Nlc3NvcnMgKGRpcmVjdCBgc2Nyb2xsVG9wID0geGAgYXNzaWdubWVudHMpLlxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWwsIFwic2Nyb2xsVG9wXCIsIHsgZ2V0OiAoKSA9PiAwLCBzZXQ6IG5vb3AsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9KTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsLCBcInNjcm9sbExlZnRcIiwgeyBnZXQ6ICgpID0+IDAsIHNldDogbm9vcCwgY29uZmlndXJhYmxlOiB0cnVlIH0pO1xufVxuXG4vKiogVW5kbyBsb2NrU2Nyb2xsZXIoKTogcmVzdG9yZSBuYXRpdmUgc2Nyb2xsaW5nIG9uIHRoZSBlbGVtZW50LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVubG9ja1Njcm9sbGVyKGVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBjb25zdCBhbnlFbCA9IGVsIGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gIGRlbGV0ZSBhbnlFbC5zY3JvbGxUbztcbiAgZGVsZXRlIGFueUVsLnNjcm9sbEJ5O1xuICBkZWxldGUgYW55RWwuc2Nyb2xsSW50b1ZpZXc7XG4gIGRlbGV0ZSBhbnlFbC5zY3JvbGxUb3A7XG4gIGRlbGV0ZSBhbnlFbC5zY3JvbGxMZWZ0O1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBd0JBLElBQUFBLG1CQUE0Qzs7O0FDdkJyQyxTQUFTLFlBQXlCO0FBQ3ZDLFFBQU0sTUFBTSxTQUFTLGNBQWMsS0FBSztBQUN4QyxNQUFJLFlBQVk7QUFDaEIsTUFBSSxNQUFNLFVBQVU7QUFDcEIsU0FBTztBQUNUO0FBR08sU0FBUyxVQUNkLE9BQ0EsS0FDQSxTQUNBLFdBQVcsT0FDUTtBQUNuQixRQUFNLE1BQU0sU0FBUyxjQUFjLFFBQVE7QUFDM0MsTUFBSSxZQUFZO0FBQ2hCLE1BQUksY0FBYztBQUNsQixNQUFJLFFBQVE7QUFDWixNQUFJLFdBQVc7QUFDZixNQUFJLENBQUMsU0FBVSxLQUFJLGlCQUFpQixTQUFTLE9BQU87QUFDcEQsU0FBTztBQUNUO0FBUU8sU0FBUyxpQkFBaUIsUUFBd0I7QUFDdkQsUUFBTSxTQUFTLFNBQVM7QUFBQSxJQUN0QjtBQUFBLEVBQ0Y7QUFDQSxNQUFJLFVBQVUsT0FBTyxlQUFlLEVBQUcsVUFBUyxPQUFPO0FBQ3ZELE1BQUksU0FBUyxHQUFHO0FBQ2QsYUFBUyxnQkFBZ0IsTUFBTSxZQUFZLGlDQUFpQyxHQUFHLE1BQU0sSUFBSTtBQUFBLEVBQzNGLE9BQU87QUFFTCxhQUFTLGdCQUFnQixNQUFNLGVBQWUsK0JBQStCO0FBQUEsRUFDL0U7QUFDQSxTQUFPO0FBQ1Q7OztBQzFDQSxJQUFBQyxtQkFBaUQ7OztBQ0FqRCxzQkFBeUM7QUFHbEMsU0FBUyxZQUFZLEtBQXFDO0FBQy9ELFFBQU0sT0FBTyxJQUFJLFVBQVUsb0JBQW9CLDRCQUFZ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aEIsVUFBSSxZQUFZLFVBQVUsVUFBSyxpQkFBaUIsTUFBTSxLQUFLLFNBQVMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDO0FBQ3RGLFVBQUksWUFBWSxVQUFVLFVBQUssYUFBYSxNQUFNLEtBQUssU0FBUyxNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFDbEYsV0FBSyxJQUFJLFlBQVksR0FBRztBQUFBLElBQzFCO0FBR0EsVUFBTSxVQUFVLEtBQ1osT0FBTyxRQUFRLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQyxHQUFHLE1BQU0sUUFBUSxZQUFZLFFBQVEsVUFBVSxJQUMzRSxDQUFDO0FBRUwsZUFBVyxDQUFDLEtBQUssS0FBSyxLQUFLLFNBQVM7QUFDbEMsWUFBTSxPQUFPLFNBQVMsY0FBYyxNQUFNO0FBQzFDLFdBQUssWUFBWTtBQUNqQixZQUFNLElBQUksU0FBUyxjQUFjLFFBQVE7QUFDekMsUUFBRSxjQUFjO0FBQ2hCLFdBQUssWUFBWSxDQUFDO0FBQ2xCLFdBQUssWUFBWSxTQUFTLGVBQWUsT0FBTyxZQUFZLEtBQUssQ0FBQyxDQUFDO0FBQ25FLFdBQUssSUFBSSxZQUFZLElBQUk7QUFBQSxJQUMzQjtBQUdBLFVBQU0sU0FBUyxPQUFPLEtBQUssWUFBWSxPQUFPLElBQUksSUFBSSxDQUFDO0FBQ3ZELFFBQUksT0FBTyxTQUFTLEdBQUc7QUFDckIsWUFBTSxPQUFPLFNBQVMsY0FBYyxNQUFNO0FBQzFDLFdBQUssWUFBWTtBQUNqQixXQUFLLGNBQWMsWUFBTyxPQUFPLEtBQUssSUFBSTtBQUMxQyxXQUFLLFFBQVE7QUFDYixXQUFLLElBQUksWUFBWSxJQUFJO0FBQUEsSUFDM0I7QUFHQSxVQUFNLE1BQU0sU0FBUyxjQUFjLFFBQVE7QUFDM0MsUUFBSSxZQUFZO0FBQ2hCLFFBQUksY0FBYztBQUNsQixRQUFJLFFBQVE7QUFDWixRQUFJLGlCQUFpQixTQUFTLE1BQU0sS0FBSyxhQUFhLENBQUM7QUFDdkQsU0FBSyxJQUFJLFlBQVksR0FBRztBQUd4QixRQUFJLEtBQUssU0FBUyxrQkFBa0IsTUFBTTtBQUN4QyxZQUFNLE9BQU8sU0FBUyxjQUFjLE1BQU07QUFDMUMsV0FBSyxZQUFZO0FBRWpCLFdBQUssY0FBYyxLQUFLLFVBQVUsSUFBSSxhQUFhLFFBQVEsS0FBSyxLQUFLO0FBQ3JFLFdBQUssSUFBSSxZQUFZLElBQUk7QUFBQSxJQUMzQjtBQUlBLFNBQUssSUFBSSxNQUFNLFVBQVUsS0FBSyxJQUFJLHNCQUFzQixJQUFJLFNBQVM7QUFBQSxFQUN2RTtBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJuZXdOYW1lIiwgImltcG9ydF9vYnNpZGlhbiJdCn0K
