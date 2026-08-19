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
  bar.title = "Click to park the mouse \u2014 hides the editor caret while presenting";
  bar.addEventListener("mousedown", (e) => {
    e.preventDefault();
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) active.blur();
  });
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
    "title",
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
  const titleBefore = (() => {
    if (!isEdit) return void 0;
    const content = contentEl.querySelector(".cm-content");
    if (!content || !content.hasAttribute("data-slides-title")) return void 0;
    const cs = getComputedStyle(content, "::before");
    return {
      content: cs.content,
      display: cs.display,
      position: cs.position,
      top: cs.top,
      left: cs.left,
      paddingTop: cs.paddingTop,
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      fontWeight: cs.fontWeight,
      fontVariant: cs.fontVariant,
      color: cs.color,
      letterSpacing: cs.letterSpacing,
      textTransform: cs.textTransform,
      wordSpacing: cs.wordSpacing,
      fontKerning: cs.fontKerning,
      fontFeatureSettings: cs.fontFeatureSettings,
      fontVariantNumeric: cs.fontVariantNumeric,
      fontVariantLigatures: cs.fontVariantLigatures,
      fontVariantCaps: cs.fontVariantCaps
    };
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
    title: titleBefore,
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
      "font-family",
      "font-size",
      "line-height",
      "font-weight",
      "font-variant",
      "color",
      "letter-spacing",
      "text-transform",
      "word-spacing",
      "font-kerning",
      "font-feature-settings",
      "font-variant-numeric",
      "font-variant-ligatures",
      "font-variant-caps",
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
var SLIDES_THEMES = [
  { id: "jyy", label: "Lecture (jyy)" },
  { id: "dashed", label: "Dashed outline" },
  { id: "paper", label: "Paper card" },
  { id: "minimal", label: "Minimal" },
  { id: "accent", label: "Accent edge" },
  { id: "glass", label: "Frosted glass" }
];
var DEFAULT_SETTINGS = {
  showNavButtons: true,
  pageNumberStyle: "none",
  showProgress: true,
  showSlidesBar: true,
  barHidden: false,
  autoEnterSlides: false,
  escExitsSlides: true,
  slidesTitle: "",
  slidesTheme: "jyy",
  barProperties: "",
  barPropertyWidths: ""
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
    id: "ns-toggle-pointer",
    name: "Toggle Mouse Pointer",
    hotkeys: [{ modifiers: ["Mod", "Shift"], key: "M" }],
    checkCallback: (checking) => {
      if (!document.body.classList.contains("native-slides-mode")) return false;
      if (!checking) plugin.togglePointer();
      return true;
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
    new import_obsidian4.Setting(containerEl).setName("Style template").setDesc(
      "Built-in look for the Slides card and slides bar (border, background, shadow, bar styling). Every template adapts to light and dark themes."
    ).addDropdown((dropdown) => {
      for (const t of SLIDES_THEMES) dropdown.addOption(t.id, t.label);
      dropdown.setValue(this.plugin.settings.slidesTheme).onChange(async (value) => {
        this.plugin.settings.slidesTheme = value;
        await this.plugin.saveSettings();
        this.plugin.refresh();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("Show slides bar").setDesc("Master toggle for the entire slides bar at the bottom of the window").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showSlidesBar).onChange(async (value) => {
        this.plugin.settings.showSlidesBar = value;
        await this.plugin.saveSettings();
        this.plugin.refresh();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Show Previous/Next buttons").setDesc(
      "Show \u25C0 \u25B6 buttons on the left of the slides bar when the note belongs to a deck (has a `deck` property)"
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showNavButtons).onChange(async (value) => {
        this.plugin.settings.showNavButtons = value;
        await this.plugin.saveSettings();
        this.plugin.refresh();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Page number style").setDesc(
      'Shown at the bottom-right. "N / Total": overview = page 0, content from 1, total excludes overview. "N": just the current page number. "None": hidden.'
    ).addDropdown(
      (dropdown) => dropdown.addOptions({
        fraction: "N / Total",
        current: "N",
        none: "None"
      }).setValue(this.plugin.settings.pageNumberStyle).onChange(async (value) => {
        this.plugin.settings.pageNumberStyle = value;
        await this.plugin.saveSettings();
        this.plugin.refresh();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Show progress bar").setDesc(
      "Discrete clickable segments at the top of the slides bar -- one per slide, click to jump"
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showProgress).onChange(async (value) => {
        this.plugin.settings.showProgress = value;
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
    new import_obsidian4.Setting(containerEl).setName("Escape exits Slides mode").setDesc("Press Escape to leave Slides mode and return to the previous view").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.escExitsSlides).onChange(async (value) => {
        this.plugin.settings.escExitsSlides = value;
        await this.plugin.saveSettings();
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
    new import_obsidian4.Setting(containerEl).setName("Bar properties").setDesc(
      "Comma-separated frontmatter property names to show in the slides bar (e.g. `university, short-title, date`). Each value fills an equal-width column; drag dividers to resize. Leave empty to show nothing."
    ).addText(
      (text) => text.setPlaceholder("e.g. university, date").setValue(this.plugin.settings.barProperties).onChange(async (value) => {
        this.plugin.settings.barProperties = value;
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
    /** Whether the mouse pointer is hidden for presenting (session state) */
    this.pointerHidden = false;
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
    this.registerDomEvent(document, "keydown", (evt) => {
      if (evt.key === "Escape" && this.slidesMode && this.settings.escExitsSlides) {
        this.exitSlides();
      }
    });
    this.bar = createBar();
    document.body.appendChild(this.bar);
    this.refresh();
  }
  onunload() {
    this.bar?.remove();
    this.bar = null;
    document.body.classList.remove("native-slides-mode");
    document.body.classList.remove("native-slides-pointer-hidden");
    this.removeThemeClasses();
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
  /** Remove every `native-slides-theme-*` class from <body> */
  removeThemeClasses() {
    for (const cls of Array.from(document.body.classList)) {
      if (cls.startsWith("native-slides-theme-")) document.body.classList.remove(cls);
    }
  }
  /**
   * Keep the single `native-slides-theme-<id>` body class in sync with the
   * `slidesTheme` setting — the style templates in styles.css hook off it.
   * Unknown ids (e.g. after a downgrade) fall back to the default theme.
   */
  applyThemeClass() {
    const id = SLIDES_THEMES.some((t) => t.id === this.settings.slidesTheme) ? this.settings.slidesTheme : DEFAULT_SETTINGS.slidesTheme;
    const cls = `native-slides-theme-${id}`;
    for (const c of Array.from(document.body.classList)) {
      if (c.startsWith("native-slides-theme-") && c !== cls) document.body.classList.remove(c);
    }
    document.body.classList.add(cls);
  }
  /**
   * Toggle hiding the mouse pointer window-wide for presenting. Hiding also
   * parks focus (blurs the editor, so the caret disappears); showing leaves
   * focus parked — click slide content to resume editing.
   */
  togglePointer() {
    this.pointerHidden = !this.pointerHidden;
    if (this.pointerHidden) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active !== document.body) active.blur();
    }
    this.refresh();
  }
  /**
   * Keep the `native-slides-pointer-hidden` body class in sync with the
   * presenting state — styles.css turns every cursor invisible while set.
   * Leaving Slides mode always restores the pointer.
   */
  syncPointerClass(slides) {
    document.body.classList.toggle("native-slides-pointer-hidden", slides && this.pointerHidden);
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
  /** Jump to a specific index in the deck chain (progress bar click) */
  async jumpTo(index) {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    const deck = this.deckService.compute(file);
    if (!deck || index < 0 || index >= deck.chain.length || index === deck.index) return;
    const target = deck.chain[index];
    if (!target) return;
    if (!this.slidesMode) await this.enterSlides();
    void this.app.workspace.openLinkText(target, file.path);
  }
  // ── Bar rendering ─────────────────────────────────────────────────────
  /**
   * Get column width percentages for the bar properties. Returns an array of
   * percentages (summing to 100) for each property. Loads from settings or
   * defaults to equal distribution.
   */
  getBarPropertyWidths(count) {
    try {
      const stored = JSON.parse(this.settings.barPropertyWidths || "[]");
      if (Array.isArray(stored) && stored.length === count && stored.every((n) => typeof n === "number")) {
        return stored;
      }
    } catch {
    }
    return Array(count).fill(100 / count);
  }
  /** Save column width percentages to settings */
  async saveBarPropertyWidths(widths) {
    this.settings.barPropertyWidths = JSON.stringify(widths);
    await this.saveSettings();
  }
  /** Decide what the slides bar shows, then re-render it */
  refresh() {
    if (!this.bar) return;
    this.applyThemeClass();
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
    if (!slides) this.pointerHidden = false;
    this.syncPointerClass(slides);
    this.updateInlineTitle(slides);
    const barVisible = slides && this.settings.showSlidesBar && !this.settings.barHidden;
    if (barVisible) {
      document.documentElement.style.removeProperty("--native-slides-bar-height");
    } else {
      document.documentElement.style.setProperty("--native-slides-bar-height", "0px");
    }
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
    const propNames = this.settings.barProperties.split(",").map((s) => s.trim()).filter(Boolean);
    if (propNames.length > 0 && fm) {
      const entries = [];
      for (const name of propNames) {
        if (name in fm) {
          const val = fm[name];
          if (val != null) entries.push([name, formatValue(val)]);
        }
      }
      if (entries.length > 0) {
        const container = document.createElement("div");
        container.className = "native-slides-bar-properties";
        const widths = this.getBarPropertyWidths(entries.length);
        for (let i = 0; i < entries.length; i++) {
          const [, value] = entries[i];
          const item = document.createElement("span");
          item.className = "native-slides-bar-prop-item";
          item.style.flexBasis = `calc(${widths[i]}% - ${(entries.length - 1) * 4 / entries.length}px)`;
          item.textContent = value;
          container.appendChild(item);
          if (i < entries.length - 1) {
            const divider = document.createElement("div");
            divider.className = "native-slides-bar-divider";
            divider.addEventListener("mousedown", (e) => {
              e.preventDefault();
              const startX = e.clientX;
              const containerWidth = container.clientWidth;
              const initialWidths = [...widths];
              const onMove = (ev) => {
                const delta = (ev.clientX - startX) / containerWidth * 100;
                const newLeft = Math.max(5, initialWidths[i] + delta);
                const newRight = Math.max(5, initialWidths[i + 1] - delta);
                widths[i] = newLeft;
                widths[i + 1] = newRight;
                const items = container.querySelectorAll(
                  ".native-slides-bar-prop-item"
                );
                items[i].style.flexBasis = `calc(${newLeft}% - ${(entries.length - 1) * 4 / entries.length}px)`;
                items[i + 1].style.flexBasis = `calc(${newRight}% - ${(entries.length - 1) * 4 / entries.length}px)`;
              };
              const onUp = () => {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
                void this.saveBarPropertyWidths(widths);
              };
              document.addEventListener("mousemove", onMove);
              document.addEventListener("mouseup", onUp);
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            });
            container.appendChild(divider);
          }
        }
        this.bar.appendChild(container);
      }
    }
    const broken = file ? this.deckService.broken(file) : [];
    if (broken.length > 0) {
      const warn = document.createElement("span");
      warn.className = "native-slides-warn";
      warn.textContent = "\u26A0 " + broken.join(", ");
      warn.title = "Broken deck link(s) \u2014 the target note does not exist";
      this.bar.appendChild(warn);
    }
    if (this.settings.pageNumberStyle !== "none" && deck) {
      const page = document.createElement("span");
      page.className = "native-slides-page";
      const total = deck.chain.length - 1;
      page.textContent = this.settings.pageNumberStyle === "fraction" ? `${deck.index} / ${total}` : `${deck.index}`;
      this.bar.appendChild(page);
    }
    if (this.settings.showProgress && deck && deck.chain.length > 1) {
      const progress = document.createElement("div");
      progress.className = "native-slides-progress";
      for (let i = 0; i < deck.chain.length; i++) {
        const seg = document.createElement("div");
        const state = i < deck.index ? "past" : i === deck.index ? "current" : "future";
        seg.className = `native-slides-progress-seg native-slides-progress-seg--${state}`;
        seg.addEventListener("click", () => void this.jumpTo(i));
        progress.appendChild(seg);
      }
      this.bar.appendChild(progress);
    }
    this.bar.style.display = this.bar.childElementCount === 0 ? "none" : "";
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvYmFyLnRzIiwgInNyYy9kZWJ1Zy50cyIsICJzcmMvbW9kZS50cyIsICJzcmMvdHlwZXMudHMiLCAic3JjL2NvbW1hbmRzLnRzIiwgInNyYy9kZWNrLXNlcnZpY2UudHMiLCAic3JjL2RlY2sudHMiLCAic3JjL2NyZWF0ZU5leHQudHMiLCAic3JjL3NldHRpbmdzLnRzIiwgInNyYy91dGlscy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBuYXRpdmUtc2xpZGVzIFx1MjAxNCBhIFwiU2xpZGVzIG1vZGVcIiBmb3IgT2JzaWRpYW4gZGVjayBub3Rlc1xuICpcbiAqIE9uZSByZXNlcnZlZCBmcm9udG1hdHRlciBrZXksIGBkZWNrYCAodXAgdG8gdHdvIG1hcmtkb3duIGxpbmtzKSwgZHJpdmVzXG4gKiBwcmV2L25leHQgbmF2aWdhdGlvbiBhbmQgYXV0by1jb21wdXRlZCBwYWdlIG51bWJlcnMuIEEgZGVjayBub3RlIGNhbiBiZVxuICogZW50ZXJlZCBpbnRvICoqU2xpZGVzIG1vZGUqKiBcdTIwMTQgYW4gaW1tZXJzaXZlLCBlZGl0YWJsZSAoTGl2ZSBQcmV2aWV3KSB2aWV3XG4gKiB3aXRoIGEgc2xpZGVzIGJhciBzaG93aW5nIHByb3BlcnRpZXMsIG5hdmlnYXRpb24gYW5kIHRoZSBwYWdlIG51bWJlci5cbiAqXG4gKiBOYXRpdmUgT2JzaWRpYW4gbW9kZXMgKFNvdXJjZSAvIGRlZmF1bHQgTGl2ZSBQcmV2aWV3IC8gUmVhZGluZyB2aWV3KSBhcmVcbiAqIGxlZnQgY29tcGxldGVseSB1bnRvdWNoZWQ6IG5vIHN0YXR1cy1iYXIgaGlkaW5nLCBubyBzbGlkZXMgYmFyLCBub1xuICogZnVsbHNjcmVlbiwgbm8gc3R5bGluZy4gU2xpZGVzIG1vZGUgaXMgdGhlIHBsdWdpbidzIG9ubHkgc3VyZmFjZS5cbiAqXG4gKiBUaGlzIGZpbGUgaXMgdGhlIGVudHJ5IHBvaW50IGFuZCBhIHRoaW4gb3JjaGVzdHJhdGlvbiBsYXllcjsgdGhlIGxvZ2ljXG4gKiBsaXZlcyBpbiBgc3JjL2A6XG4gKiAgIC0gc3JjL3R5cGVzLnRzICAgICAgICBzZXR0aW5ncyBzaGFwZSArIGRlZmF1bHRzICsgcmVzZXJ2ZWQgYGRlY2tgIGtleVxuICogICAtIHNyYy9tb2RlLnRzICAgICAgICAgdmlldyBtb2RlIC8gZnJvbnRtYXR0ZXIgaGVscGVycyAocHVyZSwgYEFwcGAtYmFzZWQpXG4gKiAgIC0gc3JjL2RlY2stc2VydmljZS50cyBkZWNrIGNoYWluIHJlc29sdXRpb24gKyBcImNyZWF0ZSBuZXh0IHNsaWRlXCIgZ2x1ZVxuICogICAtIHNyYy9iYXIudHMgICAgICAgICAgYmFyIERPTSBoZWxwZXJzIChjcmVhdGUgLyBidXR0b25zIC8gdGFiLWJhciBtZWFzdXJlKVxuICogICAtIHNyYy9jb21tYW5kcy50cyAgICAgY29tbWFuZCByZWdpc3RyYXRpb24gKGRldi1nYXRlZCBkZWJ1ZyBjb21tYW5kKVxuICogICAtIHNyYy9zZXR0aW5ncy50cyAgICAgc2V0dGluZ3MgdGFiXG4gKiAgIC0gc3JjL2RlYnVnLnRzICAgICAgICB0eXBvZ3JhcGh5IG1lYXN1cmVtZW50IHRvb2xpbmcgKGRldiBidWlsZHMgb25seSlcbiAqICAgLSBzcmMvZGVjay50cyAgICAgICAgIHB1cmUgZGVjayBjb3JlICh3aXRoIHNyYy9jcmVhdGVOZXh0LnRzKVxuICovXG5cbmltcG9ydCB7IE1hcmtkb3duVmlldywgUGx1Z2luLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgY3JlYXRlQmFyLCBuYXZCdXR0b24sIHN5bmNUYWJCYXJIZWlnaHQgfSBmcm9tIFwiLi9zcmMvYmFyXCI7XG5pbXBvcnQgeyByZWdpc3RlckNvbW1hbmRzIH0gZnJvbSBcIi4vc3JjL2NvbW1hbmRzXCI7XG5pbXBvcnQgeyBEZWNrU2VydmljZSB9IGZyb20gXCIuL3NyYy9kZWNrLXNlcnZpY2VcIjtcbmltcG9ydCB7IGZvcm1hdFZhbHVlIH0gZnJvbSBcIi4vc3JjL2RlY2tcIjtcbmltcG9ydCB7IGFjdGl2ZUZyb250bWF0dGVyLCBjdXJyZW50TW9kZSwgZnJvbnRtYXR0ZXJPZiwgaXNMaXZlUHJldmlldyB9IGZyb20gXCIuL3NyYy9tb2RlXCI7XG5pbXBvcnQgeyBOYXRpdmVTbGlkZXNTZXR0aW5nVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBERUNLX0tFWSwgREVGQVVMVF9TRVRUSU5HUywgU0xJREVTX1RIRU1FUywgdHlwZSBOYXRpdmVTbGlkZXNTZXR0aW5ncyB9IGZyb20gXCIuL3NyYy90eXBlc1wiO1xuaW1wb3J0IHsgY2xlYXJDaGlsZHJlbiB9IGZyb20gXCIuL3NyYy91dGlsc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBOYXRpdmVTbGlkZXNQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICAvKiogVGhlIHNsaWRlcyBiYXIgRE9NIGVsZW1lbnQgKi9cbiAgYmFyOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICAvKiogRGVjayBjaGFpbiByZXNvbHV0aW9uICsgXCJjcmVhdGUgbmV4dCBzbGlkZVwiIGdsdWUgKi9cbiAgZGVja1NlcnZpY2UhOiBEZWNrU2VydmljZTtcbiAgLyoqIFBsdWdpbiBzZXR0aW5ncyAqL1xuICBzZXR0aW5nczogTmF0aXZlU2xpZGVzU2V0dGluZ3MgPSB7IC4uLkRFRkFVTFRfU0VUVElOR1MgfTtcblxuICAvKiogV2hldGhlciBTbGlkZXMgbW9kZSBpcyBjdXJyZW50bHkgYWN0aXZlIChzZXNzaW9uIHN0YXRlLCBub3QgcGVyc2lzdGVkKSAqL1xuICBwcml2YXRlIHNsaWRlc01vZGUgPSBmYWxzZTtcbiAgLyoqIFZpZXcgbW9kZSB0byByZXN0b3JlIHdoZW4gbGVhdmluZyBTbGlkZXMgbW9kZSAoXCJwcmV2aWV3XCIgfCBcInNvdXJjZVwiKSAqL1xuICBwcml2YXRlIGV4aXRNb2RlOiBcInByZXZpZXdcIiB8IFwic291cmNlXCIgPSBcInNvdXJjZVwiO1xuICAvKiogV2hldGhlciB0aGUgZXhpdCB2aWV3IHdhcyBTb3VyY2UgbW9kZSAodHJ1ZSkgdnMgTGl2ZSBQcmV2aWV3IChmYWxzZSkgKi9cbiAgcHJpdmF0ZSBleGl0U291cmNlID0gZmFsc2U7XG4gIC8qKiBMYXN0IG5vdGUgYXV0by1lbnRlcmVkIGludG8gU2xpZGVzIG1vZGUgKHByZXZlbnRzIHJlLWVudGVyaW5nIGFmdGVyIG1hbnVhbCBleGl0KSAqL1xuICBwcml2YXRlIGF1dG9FbnRlcmVkUGF0aCA9IFwiXCI7XG4gIC8qKiBMYXN0IHJlZnJlc2gga2V5IChcInBhdGh8bW9kZVwiKSB0byBhdm9pZCBwb2ludGxlc3MgcmUtcmVuZGVycyAqL1xuICBwcml2YXRlIGxhc3RLZXkgPSBcIlwiO1xuICAvKiogTGFzdCBtZWFzdXJlZCB0YWItYmFyIGhlaWdodCAocHgpIFx1MjAxNCBjYWNoZWQgd2hpbGUgdGhlIHNsaWRlcyBiYXIgaXMgaGlkZGVuICovXG4gIHByaXZhdGUgdGFiQmFySGVpZ2h0ID0gMDtcbiAgLyoqIFdoZXRoZXIgdGhlIG1vdXNlIHBvaW50ZXIgaXMgaGlkZGVuIGZvciBwcmVzZW50aW5nIChzZXNzaW9uIHN0YXRlKSAqL1xuICBwb2ludGVySGlkZGVuID0gZmFsc2U7XG5cbiAgYXN5bmMgb25sb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG4gICAgdGhpcy5kZWNrU2VydmljZSA9IG5ldyBEZWNrU2VydmljZSh0aGlzLmFwcCk7XG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBOYXRpdmVTbGlkZXNTZXR0aW5nVGFiKHRoaXMpKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCAxLiBSZWZyZXNoIG9uIFwiY3VycmVudCBub3RlIC8gdmlldyBjaGFuZ2VkXCIgZXZlbnRzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImZpbGUtb3BlblwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMubWF5YmVBdXRvRW50ZXJTbGlkZXMoKTtcbiAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICB9KSxcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJhY3RpdmUtbGVhZi1jaGFuZ2VcIiwgKCkgPT4gdGhpcy5yZWZyZXNoKCkpKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKFwibGF5b3V0LWNoYW5nZVwiLCAoKSA9PiB0aGlzLnJlZnJlc2goKSkpO1xuICAgIC8vIFJlZnJlc2ggd2hlbiB0aGUgbm90ZSBjb250ZW50IChpbmNsdWRpbmcgZnJvbnRtYXR0ZXIpIGNoYW5nZXMgLyBzYXZlc1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUub24oXCJjaGFuZ2VkXCIsIChmaWxlOiBURmlsZSkgPT4ge1xuICAgICAgICBpZiAoZmlsZSA9PT0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKSkgdGhpcy5yZWZyZXNoKCk7XG4gICAgICB9KSxcbiAgICApO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDIuIEZhbGxiYWNrIHRpbWVyOiBlZGl0XHUyMTk0cmVhZGluZyB0b2dnbGVzIG1heSBmaXJlIG5vIHN0YW5kYXJkIGV2ZW50IFx1MjUwMFx1MjUwMFxuICAgIHRoaXMucmVnaXN0ZXJJbnRlcnZhbChcbiAgICAgIHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgICAgICBjb25zdCBrZXkgPSBmaWxlID8gYCR7ZmlsZS5wYXRofXwke2N1cnJlbnRNb2RlKHRoaXMuYXBwKX1gIDogXCJcIjtcbiAgICAgICAgaWYgKGtleSAhPT0gdGhpcy5sYXN0S2V5KSB7XG4gICAgICAgICAgdGhpcy5sYXN0S2V5ID0ga2V5O1xuICAgICAgICAgIHRoaXMucmVmcmVzaCgpO1xuICAgICAgICB9XG4gICAgICB9LCA1MDApLFxuICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMy4gQ29tbWFuZHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgcmVnaXN0ZXJDb21tYW5kcyh0aGlzKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCA0LiBQaW4gdGhlIFNsaWRlcyBlZGl0b3IgdG8gb25lIHNjcmVlbiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICAvLyBDU1MgYG92ZXJmbG93OiBoaWRkZW5gIGJsb2NrcyB0aGUgd2hlZWwsIGJ1dCBuYXRpdmUgZHJhZy1zZWxlY3RcbiAgICAvLyBhdXRvc2Nyb2xsIGFuZCBDb2RlTWlycm9yJ3MgcHJvZ3JhbW1hdGljIHNjcm9sbEludG9WaWV3IHN0aWxsIG1vdmUgdGhlXG4gICAgLy8gc2Nyb2xsZXIuIFRoaXMgY2FwdHVyZS1waGFzZSBsaXN0ZW5lciByZXNldHMgYW55IHNjcm9sbCBpbnNpZGUgdGhlXG4gICAgLy8gYWN0aXZlIG1hcmtkb3duIHZpZXcgYmFjayB0byB0aGUgdG9wIHdoaWxlIFNsaWRlcyBtb2RlIGlzIGFjdGl2ZS5cbiAgICB0aGlzLnJlZ2lzdGVyRG9tRXZlbnQoXG4gICAgICBkb2N1bWVudCxcbiAgICAgIFwic2Nyb2xsXCIsXG4gICAgICAoZXZ0KSA9PiB7XG4gICAgICAgIGlmICghZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuY29udGFpbnMoXCJuYXRpdmUtc2xpZGVzLW1vZGVcIikpIHJldHVybjtcbiAgICAgICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgICAgIGlmICghdmlldykgcmV0dXJuO1xuICAgICAgICBjb25zdCBlbCA9IGV2dC50YXJnZXQ7XG4gICAgICAgIGlmIChlbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICYmIHZpZXcuY29udGVudEVsLmNvbnRhaW5zKGVsKSkge1xuICAgICAgICAgIGlmIChlbC5zY3JvbGxUb3AgIT09IDApIGVsLnNjcm9sbFRvcCA9IDA7XG4gICAgICAgICAgaWYgKGVsLnNjcm9sbExlZnQgIT09IDApIGVsLnNjcm9sbExlZnQgPSAwO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgeyBjYXB0dXJlOiB0cnVlIH0sXG4gICAgKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCA1LiBFc2NhcGUga2V5IGV4aXRzIFNsaWRlcyBtb2RlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIHRoaXMucmVnaXN0ZXJEb21FdmVudChkb2N1bWVudCwgXCJrZXlkb3duXCIsIChldnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICAgIGlmIChldnQua2V5ID09PSBcIkVzY2FwZVwiICYmIHRoaXMuc2xpZGVzTW9kZSAmJiB0aGlzLnNldHRpbmdzLmVzY0V4aXRzU2xpZGVzKSB7XG4gICAgICAgIHRoaXMuZXhpdFNsaWRlcygpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDYuIENyZWF0ZSB0aGUgc2xpZGVzIGJhciBhbmQgZG8gdGhlIGZpcnN0IHJlbmRlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICB0aGlzLmJhciA9IGNyZWF0ZUJhcigpO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5iYXIpO1xuICAgIHRoaXMucmVmcmVzaCgpO1xuICB9XG5cbiAgb251bmxvYWQoKTogdm9pZCB7XG4gICAgdGhpcy5iYXI/LnJlbW92ZSgpO1xuICAgIHRoaXMuYmFyID0gbnVsbDtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoXCJuYXRpdmUtc2xpZGVzLW1vZGVcIik7XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKFwibmF0aXZlLXNsaWRlcy1wb2ludGVyLWhpZGRlblwiKTtcbiAgICB0aGlzLnJlbW92ZVRoZW1lQ2xhc3NlcygpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNldHRpbmdzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNsaWRlcyBtb2RlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBXaGV0aGVyIHRoZSBhY3RpdmUgbm90ZSBpcyBhIGRlY2sgbm90ZSAoaGFzIGEgYGRlY2tgIHByb3BlcnR5KSAqL1xuICBwcml2YXRlIGlzRGVja05vdGUoZmlsZTogVEZpbGUgfCBudWxsKTogYm9vbGVhbiB7XG4gICAgaWYgKCFmaWxlKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgZm0gPSBmcm9udG1hdHRlck9mKHRoaXMuYXBwLCBmaWxlKTtcbiAgICByZXR1cm4gZm0gIT09IG51bGwgJiYgREVDS19LRVkgaW4gZm07XG4gIH1cblxuICAvKiogUmVtb3ZlIGV2ZXJ5IGBuYXRpdmUtc2xpZGVzLXRoZW1lLSpgIGNsYXNzIGZyb20gPGJvZHk+ICovXG4gIHByaXZhdGUgcmVtb3ZlVGhlbWVDbGFzc2VzKCk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgY2xzIG9mIEFycmF5LmZyb20oZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QpKSB7XG4gICAgICBpZiAoY2xzLnN0YXJ0c1dpdGgoXCJuYXRpdmUtc2xpZGVzLXRoZW1lLVwiKSkgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKGNscyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEtlZXAgdGhlIHNpbmdsZSBgbmF0aXZlLXNsaWRlcy10aGVtZS08aWQ+YCBib2R5IGNsYXNzIGluIHN5bmMgd2l0aCB0aGVcbiAgICogYHNsaWRlc1RoZW1lYCBzZXR0aW5nIFx1MjAxNCB0aGUgc3R5bGUgdGVtcGxhdGVzIGluIHN0eWxlcy5jc3MgaG9vayBvZmYgaXQuXG4gICAqIFVua25vd24gaWRzIChlLmcuIGFmdGVyIGEgZG93bmdyYWRlKSBmYWxsIGJhY2sgdG8gdGhlIGRlZmF1bHQgdGhlbWUuXG4gICAqL1xuICBwcml2YXRlIGFwcGx5VGhlbWVDbGFzcygpOiB2b2lkIHtcbiAgICBjb25zdCBpZCA9IFNMSURFU19USEVNRVMuc29tZSgodCkgPT4gdC5pZCA9PT0gdGhpcy5zZXR0aW5ncy5zbGlkZXNUaGVtZSlcbiAgICAgID8gdGhpcy5zZXR0aW5ncy5zbGlkZXNUaGVtZVxuICAgICAgOiBERUZBVUxUX1NFVFRJTkdTLnNsaWRlc1RoZW1lO1xuICAgIGNvbnN0IGNscyA9IGBuYXRpdmUtc2xpZGVzLXRoZW1lLSR7aWR9YDtcbiAgICBmb3IgKGNvbnN0IGMgb2YgQXJyYXkuZnJvbShkb2N1bWVudC5ib2R5LmNsYXNzTGlzdCkpIHtcbiAgICAgIGlmIChjLnN0YXJ0c1dpdGgoXCJuYXRpdmUtc2xpZGVzLXRoZW1lLVwiKSAmJiBjICE9PSBjbHMpIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShjKTtcbiAgICB9XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKGNscyk7XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlIGhpZGluZyB0aGUgbW91c2UgcG9pbnRlciB3aW5kb3ctd2lkZSBmb3IgcHJlc2VudGluZy4gSGlkaW5nIGFsc29cbiAgICogcGFya3MgZm9jdXMgKGJsdXJzIHRoZSBlZGl0b3IsIHNvIHRoZSBjYXJldCBkaXNhcHBlYXJzKTsgc2hvd2luZyBsZWF2ZXNcbiAgICogZm9jdXMgcGFya2VkIFx1MjAxNCBjbGljayBzbGlkZSBjb250ZW50IHRvIHJlc3VtZSBlZGl0aW5nLlxuICAgKi9cbiAgdG9nZ2xlUG9pbnRlcigpOiB2b2lkIHtcbiAgICB0aGlzLnBvaW50ZXJIaWRkZW4gPSAhdGhpcy5wb2ludGVySGlkZGVuO1xuICAgIGlmICh0aGlzLnBvaW50ZXJIaWRkZW4pIHtcbiAgICAgIGNvbnN0IGFjdGl2ZSA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgICBpZiAoYWN0aXZlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgJiYgYWN0aXZlICE9PSBkb2N1bWVudC5ib2R5KSBhY3RpdmUuYmx1cigpO1xuICAgIH1cbiAgICB0aGlzLnJlZnJlc2goKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBLZWVwIHRoZSBgbmF0aXZlLXNsaWRlcy1wb2ludGVyLWhpZGRlbmAgYm9keSBjbGFzcyBpbiBzeW5jIHdpdGggdGhlXG4gICAqIHByZXNlbnRpbmcgc3RhdGUgXHUyMDE0IHN0eWxlcy5jc3MgdHVybnMgZXZlcnkgY3Vyc29yIGludmlzaWJsZSB3aGlsZSBzZXQuXG4gICAqIExlYXZpbmcgU2xpZGVzIG1vZGUgYWx3YXlzIHJlc3RvcmVzIHRoZSBwb2ludGVyLlxuICAgKi9cbiAgcHJpdmF0ZSBzeW5jUG9pbnRlckNsYXNzKHNsaWRlczogYm9vbGVhbik6IHZvaWQge1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnRvZ2dsZShcIm5hdGl2ZS1zbGlkZXMtcG9pbnRlci1oaWRkZW5cIiwgc2xpZGVzICYmIHRoaXMucG9pbnRlckhpZGRlbik7XG4gIH1cblxuICAvKipcbiAgICogUmVuZGVyIHRoZSBjYXJkIHRpdGxlIChhbiBIMSBpbnNpZGUgdGhlIGNhcmQpIHBlciB0aGUgYHNsaWRlc1RpdGxlYFxuICAgKiBzZXR0aW5nLCB2aWEgdGhlIGAuY20tY29udGVudGAgZGF0YS1zbGlkZXMtdGl0bGUgYXR0cmlidXRlIFx1MjAxNCB0aGUgQ1NTXG4gICAqIDo6YmVmb3JlIHBzZXVkby1lbGVtZW50IHJlbmRlcnMgaXQuIFwiXCIgKGRlZmF1bHQpIHNob3dzIG5vdGhpbmc7XG4gICAqIFwiZmlsZW5hbWVcIiB1c2VzIHRoZSBmaWxlIG5hbWU7IGFueSBvdGhlciB2YWx1ZSBuYW1lcyBhIGZyb250bWF0dGVyXG4gICAqIHByb3BlcnR5LiBUaGUgZmlsZSBuYW1lIChpbmxpbmUgdGl0bGUpIG91dHNpZGUgdGhlIGNhcmQgaXMgYWx3YXlzIGhpZGRlblxuICAgKiBieSBDU1MgaW4gU2xpZGVzIG1vZGUuXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZUlubGluZVRpdGxlKHNsaWRlczogYm9vbGVhbik6IHZvaWQge1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSB2aWV3Py5jb250ZW50RWwucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCIuY20tY29udGVudFwiKTtcbiAgICBpZiAoIWNvbnRlbnQgfHwgIWZpbGUpIHJldHVybjtcblxuICAgIGxldCB0ZXh0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICBpZiAoc2xpZGVzKSB7XG4gICAgICBjb25zdCBzcmMgPSB0aGlzLnNldHRpbmdzLnNsaWRlc1RpdGxlLnRyaW0oKTtcbiAgICAgIGlmIChzcmMgPT09IFwiZmlsZW5hbWVcIikge1xuICAgICAgICB0ZXh0ID0gZmlsZS5iYXNlbmFtZTtcbiAgICAgIH0gZWxzZSBpZiAoc3JjKSB7XG4gICAgICAgIGNvbnN0IGZtID0gZnJvbnRtYXR0ZXJPZih0aGlzLmFwcCwgZmlsZSk7XG4gICAgICAgIGNvbnN0IHYgPSBmbT8uW3NyY107XG4gICAgICAgIGlmICh2ICE9IG51bGwpIHtcbiAgICAgICAgICB0ZXh0ID0gdHlwZW9mIHYgPT09IFwic3RyaW5nXCIgPyB2IDogQXJyYXkuaXNBcnJheSh2KSA/IHYuam9pbihcIiwgXCIpIDogU3RyaW5nKHYpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRleHQpIGNvbnRlbnQuc2V0QXR0cmlidXRlKFwiZGF0YS1zbGlkZXMtdGl0bGVcIiwgdGV4dCk7XG4gICAgZWxzZSBjb250ZW50LnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtc2xpZGVzLXRpdGxlXCIpO1xuICB9XG5cbiAgLyoqIEVudGVyIFNsaWRlcyBtb2RlOiByZWNvcmQgdGhlIGV4aXQgc3RhdGUgYW5kIGZvcmNlIHRoZSBMaXZlIFByZXZpZXcgKi9cbiAgcHJpdmF0ZSBhc3luYyBlbnRlclNsaWRlcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAodmlldykge1xuICAgICAgY29uc3Qgc3RhdGUgPSB2aWV3LmdldFN0YXRlKCkgYXMgeyBtb2RlPzogc3RyaW5nOyBzb3VyY2U/OiBib29sZWFuIH07XG4gICAgICB0aGlzLmV4aXRNb2RlID0gc3RhdGUubW9kZSA9PT0gXCJwcmV2aWV3XCIgPyBcInByZXZpZXdcIiA6IFwic291cmNlXCI7XG4gICAgICB0aGlzLmV4aXRTb3VyY2UgPSBzdGF0ZS5zb3VyY2UgPT09IHRydWU7XG4gICAgICAvLyBTbGlkZXMgbW9kZSBpcyBhbHdheXMgdGhlIGVkaXRhYmxlIExpdmUgUHJldmlld1xuICAgICAgY29uc3QgbmV4dCA9IHZpZXcubGVhZi5nZXRWaWV3U3RhdGUoKTtcbiAgICAgIG5leHQuc3RhdGUgPSB7IC4uLm5leHQuc3RhdGUsIG1vZGU6IFwic291cmNlXCIsIHNvdXJjZTogZmFsc2UgfTtcbiAgICAgIGF3YWl0IHZpZXcubGVhZi5zZXRWaWV3U3RhdGUobmV4dCwgeyBmb2N1czogZmFsc2UgfSk7XG4gICAgfVxuICAgIHRoaXMuc2xpZGVzTW9kZSA9IHRydWU7XG4gICAgdGhpcy5yZWZyZXNoKCk7XG4gIH1cblxuICAvKiogRXhpdCBTbGlkZXMgbW9kZTogcmVzdG9yZSB0aGUgdmlldyBtb2RlIHJlY29yZGVkIGF0IGVudHJ5ICovXG4gIHByaXZhdGUgZXhpdFNsaWRlcygpOiB2b2lkIHtcbiAgICB0aGlzLnNsaWRlc01vZGUgPSBmYWxzZTtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAodmlldykge1xuICAgICAgY29uc3Qgc3RhdGUgPSB2aWV3LmxlYWYuZ2V0Vmlld1N0YXRlKCk7XG4gICAgICBpZiAodGhpcy5leGl0TW9kZSA9PT0gXCJwcmV2aWV3XCIpIHtcbiAgICAgICAgc3RhdGUuc3RhdGUgPSB7IC4uLnN0YXRlLnN0YXRlLCBtb2RlOiBcInByZXZpZXdcIiB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGUuc3RhdGUgPSB7IC4uLnN0YXRlLnN0YXRlLCBtb2RlOiBcInNvdXJjZVwiLCBzb3VyY2U6IHRoaXMuZXhpdFNvdXJjZSB9O1xuICAgICAgfVxuICAgICAgdm9pZCB2aWV3LmxlYWYuc2V0Vmlld1N0YXRlKHN0YXRlLCB7IGZvY3VzOiBmYWxzZSB9KTtcbiAgICB9XG4gICAgdGhpcy5yZWZyZXNoKCk7XG4gIH1cblxuICAvKiogVG9nZ2xlIFNsaWRlcyBtb2RlIChkZWNrIG5vdGVzIG9ubHkgXHUyMDE0IGVuZm9yY2VkIGJ5IHRoZSBjb21tYW5kKSAqL1xuICB0b2dnbGVTbGlkZXMoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2xpZGVzTW9kZSkgdGhpcy5leGl0U2xpZGVzKCk7XG4gICAgZWxzZSB2b2lkIHRoaXMuZW50ZXJTbGlkZXMoKTtcbiAgfVxuXG4gIC8qKiBBdXRvLWVudGVyIFNsaWRlcyBtb2RlIG9uY2UgcGVyIG9wZW5lZCBkZWNrIG5vdGUgd2hlbiB0aGUgc2V0dGluZyBpcyBvbiAqL1xuICBwcml2YXRlIG1heWJlQXV0b0VudGVyU2xpZGVzKCk6IHZvaWQge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGlmICghZmlsZSB8fCBmaWxlLnBhdGggPT09IHRoaXMuYXV0b0VudGVyZWRQYXRoKSByZXR1cm47XG4gICAgdGhpcy5hdXRvRW50ZXJlZFBhdGggPSBmaWxlLnBhdGg7XG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuYXV0b0VudGVyU2xpZGVzICYmIHRoaXMuaXNEZWNrTm90ZShmaWxlKSAmJiAhdGhpcy5zbGlkZXNNb2RlKSB7XG4gICAgICB2b2lkIHRoaXMuZW50ZXJTbGlkZXMoKTtcbiAgICB9XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgUFBUIG5hdmlnYXRpb24gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLyoqIE1vdmUgb25lIHN0ZXAgYmFjay9mb3J3YXJkIGFsb25nIHRoZSBkZWNrIGNoYWluIChlbnRlcmluZyBTbGlkZXMgbW9kZSBhcyBuZWVkZWQpICovXG4gIGFzeW5jIG5hdmlnYXRlKGRpcmVjdGlvbjogXCJwcmV2XCIgfCBcIm5leHRcIik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGlmICghZmlsZSkgcmV0dXJuO1xuICAgIGNvbnN0IGRlY2sgPSB0aGlzLmRlY2tTZXJ2aWNlLmNvbXB1dGUoZmlsZSk7XG4gICAgaWYgKCFkZWNrKSByZXR1cm47XG4gICAgY29uc3QgdGFyZ2V0ID0gZGVjay5jaGFpbltkaXJlY3Rpb24gPT09IFwicHJldlwiID8gZGVjay5pbmRleCAtIDEgOiBkZWNrLmluZGV4ICsgMV07XG4gICAgaWYgKCF0YXJnZXQpIHJldHVybjtcbiAgICBpZiAoIXRoaXMuc2xpZGVzTW9kZSkgYXdhaXQgdGhpcy5lbnRlclNsaWRlcygpO1xuICAgIHZvaWQgdGhpcy5hcHAud29ya3NwYWNlLm9wZW5MaW5rVGV4dCh0YXJnZXQsIGZpbGUucGF0aCk7XG4gIH1cblxuICAvKiogSnVtcCB0byBhIHNwZWNpZmljIGluZGV4IGluIHRoZSBkZWNrIGNoYWluIChwcm9ncmVzcyBiYXIgY2xpY2spICovXG4gIGFzeW5jIGp1bXBUbyhpbmRleDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgaWYgKCFmaWxlKSByZXR1cm47XG4gICAgY29uc3QgZGVjayA9IHRoaXMuZGVja1NlcnZpY2UuY29tcHV0ZShmaWxlKTtcbiAgICBpZiAoIWRlY2sgfHwgaW5kZXggPCAwIHx8IGluZGV4ID49IGRlY2suY2hhaW4ubGVuZ3RoIHx8IGluZGV4ID09PSBkZWNrLmluZGV4KSByZXR1cm47XG4gICAgY29uc3QgdGFyZ2V0ID0gZGVjay5jaGFpbltpbmRleF07XG4gICAgaWYgKCF0YXJnZXQpIHJldHVybjtcbiAgICBpZiAoIXRoaXMuc2xpZGVzTW9kZSkgYXdhaXQgdGhpcy5lbnRlclNsaWRlcygpO1xuICAgIHZvaWQgdGhpcy5hcHAud29ya3NwYWNlLm9wZW5MaW5rVGV4dCh0YXJnZXQsIGZpbGUucGF0aCk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgQmFyIHJlbmRlcmluZyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICAvKipcbiAgICogR2V0IGNvbHVtbiB3aWR0aCBwZXJjZW50YWdlcyBmb3IgdGhlIGJhciBwcm9wZXJ0aWVzLiBSZXR1cm5zIGFuIGFycmF5IG9mXG4gICAqIHBlcmNlbnRhZ2VzIChzdW1taW5nIHRvIDEwMCkgZm9yIGVhY2ggcHJvcGVydHkuIExvYWRzIGZyb20gc2V0dGluZ3Mgb3JcbiAgICogZGVmYXVsdHMgdG8gZXF1YWwgZGlzdHJpYnV0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBnZXRCYXJQcm9wZXJ0eVdpZHRocyhjb3VudDogbnVtYmVyKTogbnVtYmVyW10ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzdG9yZWQgPSBKU09OLnBhcnNlKHRoaXMuc2V0dGluZ3MuYmFyUHJvcGVydHlXaWR0aHMgfHwgXCJbXVwiKTtcbiAgICAgIGlmIChcbiAgICAgICAgQXJyYXkuaXNBcnJheShzdG9yZWQpICYmXG4gICAgICAgIHN0b3JlZC5sZW5ndGggPT09IGNvdW50ICYmXG4gICAgICAgIHN0b3JlZC5ldmVyeSgobikgPT4gdHlwZW9mIG4gPT09IFwibnVtYmVyXCIpXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHN0b3JlZDtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIGlnbm9yZVxuICAgIH1cbiAgICByZXR1cm4gQXJyYXkoY291bnQpLmZpbGwoMTAwIC8gY291bnQpO1xuICB9XG5cbiAgLyoqIFNhdmUgY29sdW1uIHdpZHRoIHBlcmNlbnRhZ2VzIHRvIHNldHRpbmdzICovXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUJhclByb3BlcnR5V2lkdGhzKHdpZHRoczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnNldHRpbmdzLmJhclByb3BlcnR5V2lkdGhzID0gSlNPTi5zdHJpbmdpZnkod2lkdGhzKTtcbiAgICBhd2FpdCB0aGlzLnNhdmVTZXR0aW5ncygpO1xuICB9XG5cbiAgLyoqIERlY2lkZSB3aGF0IHRoZSBzbGlkZXMgYmFyIHNob3dzLCB0aGVuIHJlLXJlbmRlciBpdCAqL1xuICByZWZyZXNoKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5iYXIpIHJldHVybjtcbiAgICB0aGlzLmFwcGx5VGhlbWVDbGFzcygpO1xuXG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgY29uc3QgbW9kZSA9IGN1cnJlbnRNb2RlKHRoaXMuYXBwKTtcbiAgICBjb25zdCBpc0NhcmQgPSB0aGlzLmlzRGVja05vdGUoZmlsZSk7XG4gICAgY29uc3QgbGl2ZVByZXZpZXdOb3cgPSBtb2RlID09PSBcInNvdXJjZVwiICYmIGlzTGl2ZVByZXZpZXcodGhpcy5hcHApO1xuXG4gICAgLy8gTGVhdmluZyBhIGRlY2sgbm90ZSwgb3IgbGVhdmluZyB0aGUgTGl2ZSBQcmV2aWV3IChlLmcuIENtZC9DdHJsK0UgdG9cbiAgICAvLyByZWFkaW5nIHZpZXcpLCBlbmRzIFNsaWRlcyBtb2RlIFx1MjAxNCBvbmx5IHRoZSB0b2dnbGUgY29tbWFuZCByZS1lbnRlcnMgaXQuXG4gICAgaWYgKHRoaXMuc2xpZGVzTW9kZSAmJiAoIWlzQ2FyZCB8fCAhbGl2ZVByZXZpZXdOb3cpKSB7XG4gICAgICB0aGlzLnNsaWRlc01vZGUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBNZWFzdXJlIHRoZSB0YWIgYmFyIHdoaWxlIGl0IGlzIHN0aWxsIHZpc2libGUgKFNsaWRlcyBtb2RlIGhpZGVzIGl0XG4gICAgLy8gYmVsb3c7IHRoZSBsYXN0IG1lYXN1cmVkIHZhbHVlIGlzIHJldXNlZCBvbmNlIGhpZGRlbikuXG4gICAgdGhpcy50YWJCYXJIZWlnaHQgPSBzeW5jVGFiQmFySGVpZ2h0KHRoaXMudGFiQmFySGVpZ2h0KTtcblxuICAgIC8vIFNsaWRlcyBtb2RlIGlzIGFjdGl2ZSBvbmx5IHdoaWxlIGFjdHVhbGx5IGluIHRoZSBlZGl0YWJsZSBMaXZlIFByZXZpZXdcbiAgICBjb25zdCBzbGlkZXMgPSB0aGlzLnNsaWRlc01vZGUgJiYgaXNDYXJkICYmIGxpdmVQcmV2aWV3Tm93O1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnRvZ2dsZShcIm5hdGl2ZS1zbGlkZXMtbW9kZVwiLCBzbGlkZXMpO1xuICAgIGlmICghc2xpZGVzKSB0aGlzLnBvaW50ZXJIaWRkZW4gPSBmYWxzZTsgLy8gbGVhdmluZyBTbGlkZXMgcmVzdG9yZXMgdGhlIHBvaW50ZXJcbiAgICB0aGlzLnN5bmNQb2ludGVyQ2xhc3Moc2xpZGVzKTtcbiAgICB0aGlzLnVwZGF0ZUlubGluZVRpdGxlKHNsaWRlcyk7XG5cbiAgICBjb25zdCBiYXJWaXNpYmxlID0gc2xpZGVzICYmIHRoaXMuc2V0dGluZ3Muc2hvd1NsaWRlc0JhciAmJiAhdGhpcy5zZXR0aW5ncy5iYXJIaWRkZW47XG4gICAgLy8gV2hlbiBiYXIgaXMgaGlkZGVuLCBzZXQgYm90dG9tIHBhZGRpbmcgdG8gMCBzbyB0aGUgY2FyZCBmaWxscyB0aGUgZnVsbFxuICAgIC8vIHdpbmRvdyBoZWlnaHQuIFdoZW4gdmlzaWJsZSwgcmVtb3ZlIHRoZSBvdmVycmlkZSBzbyBDU1MgZmFsbHMgYmFjayB0b1xuICAgIC8vIC0tbmF0aXZlLXNsaWRlcy10YWJiYXItaGVpZ2h0IChjbGVhcnMgdGhlIGJhciBhcyBiZWZvcmUpLlxuICAgIGlmIChiYXJWaXNpYmxlKSB7XG4gICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUucmVtb3ZlUHJvcGVydHkoXCItLW5hdGl2ZS1zbGlkZXMtYmFyLWhlaWdodFwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KFwiLS1uYXRpdmUtc2xpZGVzLWJhci1oZWlnaHRcIiwgXCIwcHhcIik7XG4gICAgfVxuICAgIGlmICghYmFyVmlzaWJsZSkge1xuICAgICAgdGhpcy5iYXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIWZpbGUpIHJldHVybjsgLy8gYmFyVmlzaWJsZSBpbXBsaWVzIGEgZmlsZSwgYnV0IG5hcnJvdyBmb3IgVHlwZVNjcmlwdFxuXG4gICAgY29uc3QgZm0gPSBhY3RpdmVGcm9udG1hdHRlcih0aGlzLmFwcCk7XG4gICAgY29uc3QgZGVjayA9IHRoaXMuZGVja1NlcnZpY2UuY29tcHV0ZShmaWxlKTtcbiAgICBjbGVhckNoaWxkcmVuKHRoaXMuYmFyKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBMZWZ0OiBwcmV2aW91cyAvIG5leHQgYnV0dG9ucyAoYm90aCBhbHdheXMgc2hvd24gaW5zaWRlIGEgZGVjaztcbiAgICAvLyAgICAgICAgdGhlIG9uZSB0aGF0IGNhbm5vdCBtb3ZlIGlzIGRpc2FibGVkIC8gbGlnaHQgZ3JheSkgXHUyNTAwXHUyNTAwXG4gICAgaWYgKHRoaXMuc2V0dGluZ3Muc2hvd05hdkJ1dHRvbnMgJiYgZGVjaykge1xuICAgICAgY29uc3QgaGFzUHJldiA9IGRlY2suaW5kZXggPiAwO1xuICAgICAgY29uc3QgaGFzTmV4dCA9IGRlY2suaW5kZXggPCBkZWNrLmNoYWluLmxlbmd0aCAtIDE7XG4gICAgICBjb25zdCBuYXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgbmF2LmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy1uYXZcIjtcbiAgICAgIG5hdi5hcHBlbmRDaGlsZChuYXZCdXR0b24oXCJcdTI1QzBcIiwgXCJQcmV2aW91cyBwYWdlXCIsICgpID0+IHRoaXMubmF2aWdhdGUoXCJwcmV2XCIpLCAhaGFzUHJldikpO1xuICAgICAgbmF2LmFwcGVuZENoaWxkKG5hdkJ1dHRvbihcIlx1MjVCNlwiLCBcIk5leHQgcGFnZVwiLCAoKSA9PiB0aGlzLm5hdmlnYXRlKFwibmV4dFwiKSwgIWhhc05leHQpKTtcbiAgICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKG5hdik7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE1pZGRsZTogY29uZmlndXJlZCBwcm9wZXJ0eSBjb2x1bW5zIHdpdGggZHJhZ2dhYmxlIGRpdmlkZXJzIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IHByb3BOYW1lcyA9IHRoaXMuc2V0dGluZ3MuYmFyUHJvcGVydGllc1xuICAgICAgLnNwbGl0KFwiLFwiKVxuICAgICAgLm1hcCgocykgPT4gcy50cmltKCkpXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgaWYgKHByb3BOYW1lcy5sZW5ndGggPiAwICYmIGZtKSB7XG4gICAgICBjb25zdCBlbnRyaWVzOiBbc3RyaW5nLCBzdHJpbmddW10gPSBbXTtcbiAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBwcm9wTmFtZXMpIHtcbiAgICAgICAgaWYgKG5hbWUgaW4gZm0pIHtcbiAgICAgICAgICBjb25zdCB2YWwgPSBmbVtuYW1lXTtcbiAgICAgICAgICBpZiAodmFsICE9IG51bGwpIGVudHJpZXMucHVzaChbbmFtZSwgZm9ybWF0VmFsdWUodmFsKV0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnRyaWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgY29udGFpbmVyLmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy1iYXItcHJvcGVydGllc1wiO1xuXG4gICAgICAgIGNvbnN0IHdpZHRocyA9IHRoaXMuZ2V0QmFyUHJvcGVydHlXaWR0aHMoZW50cmllcy5sZW5ndGgpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZW50cmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IFssIHZhbHVlXSA9IGVudHJpZXNbaV07XG4gICAgICAgICAgY29uc3QgaXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgIGl0ZW0uY2xhc3NOYW1lID0gXCJuYXRpdmUtc2xpZGVzLWJhci1wcm9wLWl0ZW1cIjtcbiAgICAgICAgICBpdGVtLnN0eWxlLmZsZXhCYXNpcyA9IGBjYWxjKCR7d2lkdGhzW2ldfSUgLSAkeygoZW50cmllcy5sZW5ndGggLSAxKSAqIDQpIC8gZW50cmllcy5sZW5ndGh9cHgpYDtcbiAgICAgICAgICBpdGVtLnRleHRDb250ZW50ID0gdmFsdWU7XG4gICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGl0ZW0pO1xuXG4gICAgICAgICAgaWYgKGkgPCBlbnRyaWVzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGRpdmlkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgZGl2aWRlci5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtYmFyLWRpdmlkZXJcIjtcbiAgICAgICAgICAgIGRpdmlkZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAoZSkgPT4ge1xuICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIGNvbnN0IHN0YXJ0WCA9IGUuY2xpZW50WDtcbiAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyV2lkdGggPSBjb250YWluZXIuY2xpZW50V2lkdGg7XG4gICAgICAgICAgICAgIGNvbnN0IGluaXRpYWxXaWR0aHMgPSBbLi4ud2lkdGhzXTtcbiAgICAgICAgICAgICAgY29uc3Qgb25Nb3ZlID0gKGV2OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVsdGEgPSAoKGV2LmNsaWVudFggLSBzdGFydFgpIC8gY29udGFpbmVyV2lkdGgpICogMTAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld0xlZnQgPSBNYXRoLm1heCg1LCBpbml0aWFsV2lkdGhzW2ldICsgZGVsdGEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1JpZ2h0ID0gTWF0aC5tYXgoNSwgaW5pdGlhbFdpZHRoc1tpICsgMV0gLSBkZWx0YSk7XG4gICAgICAgICAgICAgICAgd2lkdGhzW2ldID0gbmV3TGVmdDtcbiAgICAgICAgICAgICAgICB3aWR0aHNbaSArIDFdID0gbmV3UmlnaHQ7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbXMgPSBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXG4gICAgICAgICAgICAgICAgICBcIi5uYXRpdmUtc2xpZGVzLWJhci1wcm9wLWl0ZW1cIixcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGl0ZW1zW2ldLnN0eWxlLmZsZXhCYXNpcyA9XG4gICAgICAgICAgICAgICAgICBgY2FsYygke25ld0xlZnR9JSAtICR7KChlbnRyaWVzLmxlbmd0aCAtIDEpICogNCkgLyBlbnRyaWVzLmxlbmd0aH1weClgO1xuICAgICAgICAgICAgICAgIGl0ZW1zW2kgKyAxXS5zdHlsZS5mbGV4QmFzaXMgPVxuICAgICAgICAgICAgICAgICAgYGNhbGMoJHtuZXdSaWdodH0lIC0gJHsoKGVudHJpZXMubGVuZ3RoIC0gMSkgKiA0KSAvIGVudHJpZXMubGVuZ3RofXB4KWA7XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIGNvbnN0IG9uVXAgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBvbk1vdmUpO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIG9uVXApO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJcIjtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnVzZXJTZWxlY3QgPSBcIlwiO1xuICAgICAgICAgICAgICAgIHZvaWQgdGhpcy5zYXZlQmFyUHJvcGVydHlXaWR0aHMod2lkdGhzKTtcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBvbk1vdmUpO1xuICAgICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBvblVwKTtcbiAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcImNvbC1yZXNpemVcIjtcbiAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS51c2VyU2VsZWN0ID0gXCJub25lXCI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChkaXZpZGVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEJyb2tlbiBkZWNrIGxpbmtzIFx1MjE5MiB3YXJuaW5nIGNoaXAgc28gZGVjayBhdXRob3JzIHNwb3QgdHlwb3NcbiAgICBjb25zdCBicm9rZW4gPSBmaWxlID8gdGhpcy5kZWNrU2VydmljZS5icm9rZW4oZmlsZSkgOiBbXTtcbiAgICBpZiAoYnJva2VuLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHdhcm4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgIHdhcm4uY2xhc3NOYW1lID0gXCJuYXRpdmUtc2xpZGVzLXdhcm5cIjtcbiAgICAgIHdhcm4udGV4dENvbnRlbnQgPSBcIlx1MjZBMCBcIiArIGJyb2tlbi5qb2luKFwiLCBcIik7XG4gICAgICB3YXJuLnRpdGxlID0gXCJCcm9rZW4gZGVjayBsaW5rKHMpIFx1MjAxNCB0aGUgdGFyZ2V0IG5vdGUgZG9lcyBub3QgZXhpc3RcIjtcbiAgICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKHdhcm4pO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBCb3R0b20tcmlnaHQ6IGF1dG8tY29tcHV0ZWQgcGFnZSBudW1iZXIgXHUyNTAwXHUyNTAwXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MucGFnZU51bWJlclN0eWxlICE9PSBcIm5vbmVcIiAmJiBkZWNrKSB7XG4gICAgICBjb25zdCBwYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICBwYWdlLmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy1wYWdlXCI7XG4gICAgICAvLyBjaGFpblswXSBpcyB0aGUgb3ZlcnZpZXcgKHBhZ2UgMCk7IGNvbnRlbnQgc2xpZGVzIHN0YXJ0IGF0IGluZGV4IDEuXG4gICAgICAvLyBUb3RhbCA9IGNvbnRlbnQgcGFnZXMgb25seSAoZXhjbHVkZXMgb3ZlcnZpZXcpLlxuICAgICAgY29uc3QgdG90YWwgPSBkZWNrLmNoYWluLmxlbmd0aCAtIDE7XG4gICAgICBwYWdlLnRleHRDb250ZW50ID1cbiAgICAgICAgdGhpcy5zZXR0aW5ncy5wYWdlTnVtYmVyU3R5bGUgPT09IFwiZnJhY3Rpb25cIiA/IGAke2RlY2suaW5kZXh9IC8gJHt0b3RhbH1gIDogYCR7ZGVjay5pbmRleH1gO1xuICAgICAgdGhpcy5iYXIuYXBwZW5kQ2hpbGQocGFnZSk7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIFByb2dyZXNzIGluZGljYXRvcjogZGlzY3JldGUgY2xpY2thYmxlIHNlZ21lbnRzIGF0IGJhciB0b3AgXHUyNTAwXHUyNTAwXG4gICAgaWYgKHRoaXMuc2V0dGluZ3Muc2hvd1Byb2dyZXNzICYmIGRlY2sgJiYgZGVjay5jaGFpbi5sZW5ndGggPiAxKSB7XG4gICAgICBjb25zdCBwcm9ncmVzcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBwcm9ncmVzcy5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtcHJvZ3Jlc3NcIjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVjay5jaGFpbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBzZWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBjb25zdCBzdGF0ZSA9IGkgPCBkZWNrLmluZGV4ID8gXCJwYXN0XCIgOiBpID09PSBkZWNrLmluZGV4ID8gXCJjdXJyZW50XCIgOiBcImZ1dHVyZVwiO1xuICAgICAgICBzZWcuY2xhc3NOYW1lID0gYG5hdGl2ZS1zbGlkZXMtcHJvZ3Jlc3Mtc2VnIG5hdGl2ZS1zbGlkZXMtcHJvZ3Jlc3Mtc2VnLS0ke3N0YXRlfWA7XG4gICAgICAgIHNlZy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdm9pZCB0aGlzLmp1bXBUbyhpKSk7XG4gICAgICAgIHByb2dyZXNzLmFwcGVuZENoaWxkKHNlZyk7XG4gICAgICB9XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChwcm9ncmVzcyk7XG4gICAgfVxuXG4gICAgLy8gSGlkZSB0aGUgc2xpZGVzIGJhciBlbnRpcmVseSB3aGVuIGl0IGhhcyBub3RoaW5nIHRvIGRpc3BsYXkgKG5vIHByb3BlcnRpZXMsXG4gICAgLy8gYW5kIG5vdCBwYXJ0IG9mIGEgZGVjaylcbiAgICB0aGlzLmJhci5zdHlsZS5kaXNwbGF5ID0gdGhpcy5iYXIuY2hpbGRFbGVtZW50Q291bnQgPT09IDAgPyBcIm5vbmVcIiA6IFwiXCI7XG4gIH1cbn1cbiIsICIvKiogQ3JlYXRlIHRoZSBzbGlkZXMgYmFyIERPTSBlbGVtZW50IChoaWRkZW4gdW50aWwgcmVmcmVzaCgpIHNob3dzIGl0KSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUJhcigpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGJhci5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtYmFyXCI7XG4gIGJhci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIGJhci50aXRsZSA9IFwiQ2xpY2sgdG8gcGFyayB0aGUgbW91c2UgXHUyMDE0IGhpZGVzIHRoZSBlZGl0b3IgY2FyZXQgd2hpbGUgcHJlc2VudGluZ1wiO1xuICAvLyBQcmVzZW50YXRpb24gcGFya2luZzogY2xpY2tpbmcgdGhlIGJhciBrZWVwcyBmb2N1cyBvdXQgb2YgdGhlIGVkaXRvciBzb1xuICAvLyB0aGUgYmxpbmtpbmcgY2FyZXQgZGlzYXBwZWFycy4gcHJldmVudERlZmF1bHQgc3RvcHMgdGhlIGNsaWNrIGZyb20gbW92aW5nXG4gIC8vIGZvY3VzIG9yIHN0YXJ0aW5nIGEgdGV4dCBzZWxlY3Rpb247IGJ1dHRvbnMgc3RpbGwgcmVjZWl2ZSB0aGVpciBjbGljayBldmVudC5cbiAgYmFyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgYWN0aXZlID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgICBpZiAoYWN0aXZlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgJiYgYWN0aXZlICE9PSBkb2N1bWVudC5ib2R5KSBhY3RpdmUuYmx1cigpO1xuICB9KTtcbiAgcmV0dXJuIGJhcjtcbn1cblxuLyoqIEJ1aWxkIGEgXHUyNUMwIC8gXHUyNUI2IG5hdmlnYXRpb24gYnV0dG9uOyBgZGlzYWJsZWRgIHJlbmRlcnMgaXQgbGlnaHQgZ3JheS9pbmFjdGl2ZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdkJ1dHRvbihcbiAgbGFiZWw6IHN0cmluZyxcbiAgdGlwOiBzdHJpbmcsXG4gIG9uQ2xpY2s6ICgpID0+IHZvaWQsXG4gIGRpc2FibGVkID0gZmFsc2UsXG4pOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIGJ0bi5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtbmF2LWJ0blwiO1xuICBidG4udGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgYnRuLnRpdGxlID0gdGlwO1xuICBidG4uZGlzYWJsZWQgPSBkaXNhYmxlZDtcbiAgaWYgKCFkaXNhYmxlZCkgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvbkNsaWNrKTtcbiAgcmV0dXJuIGJ0bjtcbn1cblxuLyoqXG4gKiBNZWFzdXJlIHRoZSB0b3AgdGFiIGJhciBhbmQgZXhwb3NlIGl0cyBoZWlnaHQgYXMgdGhlIENTUyB2YXJpYWJsZVxuICogLS1uYXRpdmUtc2xpZGVzLXRhYmJhci1oZWlnaHQsIHJldHVybmluZyB0aGUgKHBvc3NpYmx5IHVwZGF0ZWQpIGNhY2hlZFxuICogdmFsdWUuIFRoZSBzbGlkZXMgYmFyIGlzIGhpZGRlbiBpbiBTbGlkZXMgbW9kZSwgc28gdGhlIGxhc3QgbWVhc3VyZWRcbiAqIHZhbHVlIGlzIHJldXNlZCB0aGVyZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN5bmNUYWJCYXJIZWlnaHQoY2FjaGVkOiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCB0YWJCYXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcbiAgICBcIi53b3Jrc3BhY2UtdGFicy5tb2QtdG9wIC53b3Jrc3BhY2UtdGFiLWhlYWRlci1jb250YWluZXJcIixcbiAgKTtcbiAgaWYgKHRhYkJhciAmJiB0YWJCYXIub2Zmc2V0SGVpZ2h0ID4gMCkgY2FjaGVkID0gdGFiQmFyLm9mZnNldEhlaWdodDtcbiAgaWYgKGNhY2hlZCA+IDApIHtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoXCItLW5hdGl2ZS1zbGlkZXMtdGFiYmFyLWhlaWdodFwiLCBgJHtjYWNoZWR9cHhgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBObyBtZWFzdXJlbWVudCB5ZXQgKHRhYiBiYXIgaGlkZGVuIHNpbmNlIGxvYWQpIFx1MjAxNCBsZXQgdGhlIENTUyBmYWxsYmFjayBhcHBseS5cbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUucmVtb3ZlUHJvcGVydHkoXCItLW5hdGl2ZS1zbGlkZXMtdGFiYmFyLWhlaWdodFwiKTtcbiAgfVxuICByZXR1cm4gY2FjaGVkO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTWFya2Rvd25WaWV3LCBOb3RpY2UsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSBOYXRpdmVTbGlkZXNQbHVnaW4gZnJvbSBcIi4uL21haW5cIjtcbmltcG9ydCB7IGlzTGl2ZVByZXZpZXcgfSBmcm9tIFwiLi9tb2RlXCI7XG5cbi8qKlxuICogVHlwb2dyYXBoeS1tZWFzdXJlbWVudCB0b29saW5nIChkZXYgYnVpbGRzIG9ubHkpLlxuICpcbiAqIFRoZSBgbnMtZGVidWctc3R5bGVzYCBjb21tYW5kIHNhbXBsZXMgdGhlIGZpeGVkIG9uZS1wYWdlIHNhbXBsZSBub3RlcyBpblxuICogZWRpdCAoTGl2ZSBQcmV2aWV3KSBhbmQgdGhlIGtpdGNoZW4tc2luayBub3RlIGluIHJlYWRpbmcgdmlldywgbWVyZ2VzIHRoZVxuICogcmVzdWx0cywgY29tcHV0ZXMgYW4gZWRpdC12cy1yZWFkaW5nIGRpZmYgYW5kIHdyaXRlcyBpdCB0b1xuICogLm5hdGl2ZS1zbGlkZXMtZGVidWcuanNvbiBpbiB0aGUgdmF1bHQgcm9vdC4gUmVnaXN0ZXJlZCBvbmx5IHdoZW4gdGhlXG4gKiBidWlsZC10aW1lIERFVl9NT0RFIGZsYWcgaXMgdHJ1ZTsgcmVsZWFzZSBidWlsZHMgdHJlZS1zaGFrZSB0aGlzIG1vZHVsZSBvdXQuXG4gKi9cblxuLyoqIEZpeGVkIG9uZS1wYWdlIHNhbXBsZSBub3RlcyB1c2VkIGJ5IHRoZSBkZWJ1ZyBjb21tYW5kIChlZGl0IHNpZGUpICovXG5leHBvcnQgY29uc3QgU0FNUExFX05PVEVfTkFNRVMgPSBbXG4gIFwidHlwb2dyYXBoeS1zYW1wbGUtaGVhZGluZ3NcIixcbiAgXCJ0eXBvZ3JhcGh5LXNhbXBsZS1saXN0XCIsXG4gIFwidHlwb2dyYXBoeS1zYW1wbGUtY29kZVwiLFxuICBcInR5cG9ncmFwaHktc2FtcGxlLXF1b3RlXCIsXG4gIFwidHlwb2dyYXBoeS1zYW1wbGUtbWVkaWFcIixcbl07XG5cbi8qKiBTdHlsZSBzZWN0aW9ucyBzYW1wbGVkIGJ5IHNhbXBsZVN0eWxlcygpIGFuZCBjb21wYXJlZCBieSBkaWZmRHVtcHMoKSAqL1xuY29uc3QgU1RZTEVfU0VDVElPTlMgPSBbXG4gIFwiY29udGFpbmVyXCIsXG4gIFwicGFyYWdyYXBoXCIsXG4gIFwiaDFcIixcbiAgXCJsaXN0SXRlbVwiLFxuICBcImNvZGVCbG9ja1wiLFxuICBcImJsb2NrcXVvdGVcIixcbiAgXCJpbmxpbmVDb2RlXCIsXG4gIFwidGFibGVcIixcbiAgXCJpbWFnZVwiLFxuICBcImhvcml6b250YWxSdWxlXCIsXG5dO1xuXG4vKiogUHJvbWlzZS1iYXNlZCBzbGVlcCAqL1xuZnVuY3Rpb24gc2xlZXAobXM6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbn1cblxuLyoqXG4gKiBNZXJnZSBub24tbWlzc2luZyBzdHlsZSBzZWN0aW9ucyBvZiBhIGZyZXNoIHNhbXBsZSBpbnRvIHRoZSB0YXJnZXRcbiAqIChmaXJzdCBub24tbWlzc2luZyB2YWx1ZSB3aW5zKS5cbiAqL1xuZnVuY3Rpb24gbWVyZ2VTYW1wbGUodGFyZ2V0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgc2FtcGxlOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQge1xuICBmb3IgKGNvbnN0IGtleSBvZiBTVFlMRV9TRUNUSU9OUykge1xuICAgIGNvbnN0IHNlY3Rpb24gPSBzYW1wbGVba2V5XSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgdW5kZWZpbmVkO1xuICAgIGlmICghc2VjdGlvbiB8fCBcIihtaXNzaW5nKVwiIGluIHNlY3Rpb24pIGNvbnRpbnVlO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGFyZ2V0W2tleV0gYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IHVuZGVmaW5lZDtcbiAgICBpZiAoZXhpc3RpbmcgJiYgIShcIihtaXNzaW5nKVwiIGluIGV4aXN0aW5nKSkgY29udGludWU7XG4gICAgdGFyZ2V0W2tleV0gPSBzZWN0aW9uO1xuICB9XG4gIC8vIFByb2JlIGZpZWxkcyByaWRlIGFsb25nIChmaXJzdCBub24tZW1wdHkgd2lucylcbiAgZm9yIChjb25zdCBrZXkgb2YgW1xuICAgIFwibGlzdExpbmVzXCIsXG4gICAgXCJtZXRhZGF0YUNvbnRhaW5lckRpc3BsYXlcIixcbiAgICBcImgxT2Zmc2V0VG9wXCIsXG4gICAgXCJoMVRvcEluQ29udGVudFwiLFxuICAgIFwiaDFMZWZ0SW5Db250ZW50XCIsXG4gICAgXCJ0aXRsZVwiLFxuICAgIFwiY29udGVudENoaWxkcmVuXCIsXG4gICAgXCJ0b3BDaGFpblwiLFxuICBdKSB7XG4gICAgY29uc3QgcHJvYmUgPSBzYW1wbGVba2V5XTtcbiAgICBpZiAocHJvYmUgPT09IHVuZGVmaW5lZCB8fCBwcm9iZSA9PT0gbnVsbCkgY29udGludWU7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocHJvYmUpICYmIHByb2JlLmxlbmd0aCA9PT0gMCkgY29udGludWU7XG4gICAgaWYgKHR5cGVvZiBwcm9iZSA9PT0gXCJvYmplY3RcIiAmJiAhQXJyYXkuaXNBcnJheShwcm9iZSkgJiYgT2JqZWN0LmtleXMocHJvYmUpLmxlbmd0aCA9PT0gMClcbiAgICAgIGNvbnRpbnVlO1xuICAgIGlmICh0YXJnZXRba2V5XSA9PT0gdW5kZWZpbmVkKSB0YXJnZXRba2V5XSA9IHByb2JlO1xuICB9XG59XG5cbi8qKlxuICogQ29tcGFyZSB0aGUgc3R5bGUgc2VjdGlvbnMgb2YgYW4gZWRpdCBkdW1wIGFuZCBhIHJlYWRpbmcgZHVtcDsgb25seVxuICoga2V5cyB3aG9zZSB2YWx1ZXMgZGlmZmVyIGFyZSBrZXB0LCBhcyB7IGtleTogeyBlZGl0LCByZWFkaW5nIH0gfS5cbiAqL1xuZnVuY3Rpb24gZGlmZkR1bXBzKFxuICBlZGl0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgcmVhZGluZzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcbiAgZm9yIChjb25zdCBzZWN0aW9uIG9mIFNUWUxFX1NFQ1RJT05TKSB7XG4gICAgY29uc3QgZSA9IChlZGl0W3NlY3Rpb25dID8/IHt9KSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICAgIGNvbnN0IHIgPSAocmVhZGluZ1tzZWN0aW9uXSA/PyB7fSkgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgICBjb25zdCBrZXlzID0gbmV3IFNldChbLi4uT2JqZWN0LmtleXMoZSksIC4uLk9iamVjdC5rZXlzKHIpXSk7XG4gICAgY29uc3QgZGlmZnM6IFJlY29yZDxzdHJpbmcsIHsgZWRpdDogc3RyaW5nOyByZWFkaW5nOiBzdHJpbmcgfT4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgICBpZiAoZVtrZXldICE9PSByW2tleV0pIHtcbiAgICAgICAgZGlmZnNba2V5XSA9IHsgZWRpdDogZVtrZXldID8/IFwiKG1pc3NpbmcpXCIsIHJlYWRpbmc6IHJba2V5XSA/PyBcIihtaXNzaW5nKVwiIH07XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChPYmplY3Qua2V5cyhkaWZmcykubGVuZ3RoID4gMCkgb3V0W3NlY3Rpb25dID0gZGlmZnM7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuLyoqIFNhbXBsZSB0aGUgY3VycmVudCB2aWV3J3MgdHlwb2dyYXBoeSBjb21wdXRlZCBzdHlsZXMgKyBDU1MgdmFyaWFibGVzICovXG5mdW5jdGlvbiBzYW1wbGVTdHlsZXMoYXBwOiBBcHApOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICBjb25zdCB2aWV3ID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gIGlmICghdmlldykgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGlzRWRpdCA9IHZpZXcuZ2V0TW9kZSgpID09PSBcInNvdXJjZVwiO1xuICBjb25zdCBjb250ZW50RWwgPSB2aWV3LmNvbnRlbnRFbDtcbiAgLy8gRmlyc3QgbWF0Y2hpbmcgY2FuZGlkYXRlIHdpbnMgXHUyMDE0IGVkaXQgKGNtNikgYW5kIHJlYWRpbmcgdXNlXG4gIC8vIGRpZmZlcmVudCBlbGVtZW50IHN0cnVjdHVyZXMgKGUuZy4gbm8gcHJlL2Jsb2NrcXVvdGUgaW4gY202KS5cbiAgY29uc3QgcGljayA9IChzZWxzOiBzdHJpbmdbXSk6IEhUTUxFbGVtZW50IHwgbnVsbCA9PiB7XG4gICAgZm9yIChjb25zdCBzZWwgb2Ygc2Vscykge1xuICAgICAgY29uc3QgZWwgPSBjb250ZW50RWwucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oc2VsKTtcbiAgICAgIGlmIChlbCkgcmV0dXJuIGVsO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcbiAgY29uc3Qgc3R5bGUgPSAoZWw6IEhUTUxFbGVtZW50IHwgbnVsbCwgcHJvcHM6IHN0cmluZ1tdKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9PiB7XG4gICAgaWYgKCFlbCkgcmV0dXJuIHsgXCIobWlzc2luZylcIjogXCJlbGVtZW50IG5vdCBpbiB0aGlzIG5vdGVcIiB9O1xuICAgIGNvbnN0IGNzID0gZ2V0Q29tcHV0ZWRTdHlsZShlbCk7XG4gICAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gICAgZm9yIChjb25zdCBwIG9mIHByb3BzKSB7XG4gICAgICBjb25zdCB2ID0gY3MuZ2V0UHJvcGVydHlWYWx1ZShwKS50cmltKCk7XG4gICAgICBpZiAodikgb3V0W3BdID0gdjtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbiAgfTtcbiAgY29uc3QgdmFycyA9IGdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSk7XG4gIGNvbnN0IGNzc1ZhciA9IChuYW1lOiBzdHJpbmcpOiBzdHJpbmcgPT4gdmFycy5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpLnRyaW0oKTtcblxuICBjb25zdCBjb250YWluZXIgPSBwaWNrKFtcbiAgICBpc0VkaXRcbiAgICAgID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuY20tY29udGVudFwiXG4gICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3XCIsXG4gIF0pO1xuICBjb25zdCBwYXJhID0gcGljayhbXG4gICAgaXNFZGl0XG4gICAgICA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLmNtLWxpbmU6bm90KC5IeXBlck1ELWhlYWRlcilcIlxuICAgICAgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlldyBwXCIsXG4gIF0pO1xuICBjb25zdCBoMSA9IHBpY2soW1xuICAgIGlzRWRpdCA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLmNtLWhlYWRlci0xXCIgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgaDFcIixcbiAgICBpc0VkaXRcbiAgICAgID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiBoMVwiXG4gICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IGgxXCIsXG4gIF0pO1xuICBjb25zdCBsaXN0SXRlbSA9IHBpY2soW1xuICAgIGlzRWRpdCA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLkh5cGVyTUQtbGlzdC1saW5lXCIgOiBcIi5tYXJrZG93bi1wcmV2aWV3LXZpZXcgdWwgPiBsaVwiLFxuICAgIGlzRWRpdCA/IFwiLkh5cGVyTUQtbGlzdC1saW5lXCIgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlldyB1bCA+IGxpXCIsXG4gIF0pO1xuICBjb25zdCBwcmUgPSBwaWNrKFtcbiAgICBpc0VkaXRcbiAgICAgID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiBwcmVcIlxuICAgICAgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlldyBwcmVcIixcbiAgICBpc0VkaXQgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IC5jbS1lZGl0aW5nIHByZVwiIDogXCIubWFya2Rvd24tcHJldmlldy12aWV3IHByZVwiLFxuICAgIGlzRWRpdCA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLkh5cGVyTUQtY29kZWJsb2NrXCIgOiBcIi5tYXJrZG93bi1wcmV2aWV3LXZpZXcgcHJlXCIsXG4gIF0pO1xuICBjb25zdCBxdW90ZSA9IHBpY2soW1xuICAgIGlzRWRpdCA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgYmxvY2txdW90ZVwiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IGJsb2NrcXVvdGVcIixcbiAgICBpc0VkaXRcbiAgICAgID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuSHlwZXJNRC1xdW90ZVwiXG4gICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IGJsb2NrcXVvdGVcIixcbiAgXSk7XG4gIGNvbnN0IGlubGluZUNvZGUgPSBwaWNrKFtcbiAgICBpc0VkaXQgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IGNvZGVcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyBjb2RlXCIsXG4gICAgaXNFZGl0XG4gICAgICA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLmNtLWlubGluZS1jb2RlXCJcbiAgICAgIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgY29kZVwiLFxuICBdKTtcbiAgY29uc3QgdGFibGUgPSBwaWNrKFtcbiAgICBpc0VkaXQgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IHRhYmxlXCIgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgdGFibGVcIixcbiAgICBpc0VkaXQgPyBcIi5jbS1saW5lIHRhYmxlXCIgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlldyB0YWJsZVwiLFxuICBdKTtcbiAgY29uc3QgaW1nID0gcGljayhbXG4gICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiBpbWdcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyBpbWdcIixcbiAgICBpc0VkaXQgPyBcIi5jbS1saW5lIGltZ1wiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgaW1nXCIsXG4gICAgXCJpbWdcIiwgLy8gd2hvbGUtZG9jdW1lbnQgZmFsbGJhY2tcbiAgXSk7XG4gIGNvbnN0IGhyID0gcGljayhbXG4gICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiBoclwiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IGhyXCIsXG4gICAgaXNFZGl0ID8gXCIuY20tbGluZSBoclwiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgaHJcIixcbiAgICBpc0VkaXQgPyBcIi5jbS1oclwiIDogXCIubWFya2Rvd24tcHJldmlldy12aWV3IGhyXCIsXG4gIF0pO1xuXG4gIC8vIFN0cnVjdHVyZSBwcm9iZXMgKGVkaXQgdmlldyBvbmx5KTogdGhlIHNvdXJjZS12aWV3IGNsYXNzIGxpc3RcbiAgLy8gKGNvbmZpcm1zIHRoZSBMaXZlIFByZXZpZXcgbWFya2VyIGNsYXNzKSBhbmQgdW5pcXVlIGVsZW1lbnQgdGFnc1xuICAvLyBpbnNpZGUgdGhlIGVkaXRvciAocmV2ZWFscyBob3cgY202IHJlbmRlcnMgY29kZSBibG9ja3MgZXRjLiB3aGVuXG4gIC8vIHRoZSB1c3VhbCBzZWxlY3RvcnMgZG8gbm90IG1hdGNoKS5cbiAgY29uc3Qgc291cmNlVmlld0NsYXNzID0gY29udGVudEVsLnF1ZXJ5U2VsZWN0b3IoXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNlwiKT8uY2xhc3NOYW1lID8/IFwiXCI7XG4gIGNvbnN0IGRvbVRhZ3M6IHN0cmluZ1tdID0gW107XG4gIGlmIChpc0VkaXQpIHtcbiAgICBjb25zdCB0YWdzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgY29udGVudEVsXG4gICAgICAucXVlcnlTZWxlY3RvckFsbChcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202ICpcIilcbiAgICAgIC5mb3JFYWNoKChlbCkgPT4gdGFncy5hZGQoZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpKSk7XG4gICAgZG9tVGFncy5wdXNoKC4uLnRhZ3MpO1xuICB9XG4gIC8vIExpc3QtbGluZSBwcm9iZSAoZWRpdCB2aWV3IG9ubHkpOiBjbGFzcyBuYW1lcyArIGNvbXB1dGVkIHBhZGRpbmdcbiAgLy8gb2YgdGhlIGZpcnN0IGxpc3QgbGluZXMgXHUyMDE0IG5lc3RlZCBsZXZlbHMgb2Z0ZW4gdXNlIGRpc3RpbmN0XG4gIC8vIGNsYXNzZXMgb3IgaW5saW5lIHBhZGRpbmdzLCB3aGljaCBkZWNpZGVzIHdoZXRoZXIgYSBsZXZlbC1hd2FyZVxuICAvLyBpbmRlbnQgb3ZlcnJpZGUgaXMgZXZlbiBwb3NzaWJsZS5cbiAgY29uc3QgbGlzdExpbmVzOiB7IGNsYXNzTmFtZTogc3RyaW5nOyBwYWRkaW5nTGVmdDogc3RyaW5nIH1bXSA9IFtdO1xuICBpZiAoaXNFZGl0KSB7XG4gICAgY29udGVudEVsLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuSHlwZXJNRC1saXN0LWxpbmVcIikuZm9yRWFjaCgoZWwsIGkpID0+IHtcbiAgICAgIGlmIChpID49IDQpIHJldHVybjtcbiAgICAgIGNvbnN0IGNzID0gZ2V0Q29tcHV0ZWRTdHlsZShlbCk7XG4gICAgICBsaXN0TGluZXMucHVzaCh7XG4gICAgICAgIGNsYXNzTmFtZTogZWwuY2xhc3NOYW1lLFxuICAgICAgICBwYWRkaW5nTGVmdDogY3MuZ2V0UHJvcGVydHlWYWx1ZShcInBhZGRpbmctbGVmdFwiKS50cmltKCksXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICAvLyBGcm9udG1hdHRlciBwcm9iZXM6IGRvZXMgdGhlIChoaWRkZW4pIHByb3BlcnRpZXMgYXJlYSBzdGlsbFxuICAvLyBvY2N1cHkgc3BhY2UgaW4gTGl2ZSBQcmV2aWV3PyBBbmQgaG93IGZhciBpcyB0aGUgSDEgZnJvbSB0aGVcbiAgLy8gdG9wIG9mIHRoZSBjb250ZW50IGFyZWE/IChyZWFkaW5nIG1vZGUgaGFzIG5vIHN1Y2ggcGFkZGluZylcbiAgY29uc3QgbWV0YWRhdGFEaXNwbGF5ID0gKCgpID0+IHtcbiAgICBjb25zdCBzZWwgPSBpc0VkaXRcbiAgICAgID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcgLm1ldGFkYXRhLWNvbnRhaW5lclwiXG4gICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWV0YWRhdGEtY29udGFpbmVyXCI7XG4gICAgY29uc3QgZWwgPSBjb250ZW50RWwucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oc2VsKTtcbiAgICByZXR1cm4gZWwgPyBnZXRDb21wdXRlZFN0eWxlKGVsKS5kaXNwbGF5IDogXCIobm90IGluIERPTSlcIjtcbiAgfSkoKTtcbiAgY29uc3QgaDFPZmZzZXRUb3AgPSAoKCkgPT4ge1xuICAgIGlmICghaDEpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgbGV0IHRvcCA9IDA7XG4gICAgbGV0IG5vZGU6IEhUTUxFbGVtZW50IHwgbnVsbCA9IGgxO1xuICAgIHdoaWxlIChub2RlICYmIG5vZGUgIT09IGNvbnRlbnRFbCAmJiBub2RlICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICB0b3AgKz0gbm9kZS5vZmZzZXRUb3A7XG4gICAgICBub2RlID0gbm9kZS5vZmZzZXRQYXJlbnQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gdG9wO1xuICB9KSgpO1xuICAvLyBXaGF0IG9jY3VwaWVzIHRoZSBzcGFjZSBiZXR3ZWVuIHRoZSBjb250ZW50IHRvcCBhbmQgdGhlIEgxP1xuICAvLyAoZWRpdCkgZmlyc3QgY2hpbGRyZW4gb2YgLmNtLWNvbnRlbnQsIGFuZCB0aGUgbmV0IEgxIGRpc3RhbmNlXG4gIC8vIGZyb20gdGhlIGNvbnRlbnQgYW5jaG9yIFx1MjAxNCByZWFkaW5nIGhhcyBubyBzdWNoIGdhcC5cbiAgY29uc3QgYW5jaG9yID0gaXNFZGl0XG4gICAgPyBjb250ZW50RWwucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCIuY20tY29udGVudFwiKVxuICAgIDogY29udGVudEVsLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3XCIpO1xuICBjb25zdCBoMVRvcEluQ29udGVudCA9ICgoKSA9PiB7XG4gICAgaWYgKCFoMSB8fCAhYW5jaG9yKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIHJldHVybiBNYXRoLnJvdW5kKGgxLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCAtIGFuY2hvci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3ApO1xuICB9KSgpO1xuICBjb25zdCBoMUxlZnRJbkNvbnRlbnQgPSAoKCkgPT4ge1xuICAgIGlmICghaDEgfHwgIWFuY2hvcikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChoMS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0IC0gYW5jaG9yLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQpO1xuICB9KSgpO1xuICBjb25zdCBjb250ZW50Q2hpbGRyZW4gPSAoKCkgPT4ge1xuICAgIGlmICghYW5jaG9yKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIHJldHVybiBBcnJheS5mcm9tKGFuY2hvci5jaGlsZHJlbilcbiAgICAgIC5zbGljZSgwLCA0KVxuICAgICAgLm1hcCgoZWwpID0+IHtcbiAgICAgICAgY29uc3QgY3MgPSBnZXRDb21wdXRlZFN0eWxlKGVsKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjbHM6IChlbCBhcyBIVE1MRWxlbWVudCkuY2xhc3NOYW1lIHx8IGVsLnRhZ05hbWUudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgICBkaXNwbGF5OiBjcy5kaXNwbGF5LFxuICAgICAgICAgIGhlaWdodDogTWF0aC5yb3VuZChlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQpLFxuICAgICAgICAgIG1hcmdpblRvcDogY3MubWFyZ2luVG9wLFxuICAgICAgICAgIHBhZGRpbmdUb3A6IGNzLnBhZGRpbmdUb3AsXG4gICAgICAgICAgbWFyZ2luQm90dG9tOiBjcy5tYXJnaW5Cb3R0b20sXG4gICAgICAgICAgcGFkZGluZ0JvdHRvbTogY3MucGFkZGluZ0JvdHRvbSxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICB9KSgpO1xuICAvLyBDb250YWluZXIgY2hhaW4gcHJvYmU6IGZyb20gLmNtLWNvbnRlbnQgdXAgdG8gdGhlIHZpZXctY29udGVudCxcbiAgLy8gZWFjaCB3cmFwcGVyJ3MgcGFkZGluZy9tYXJnaW4gXHUyMDE0IGxvY2F0ZXMgdGhlIGxlZnRvdmVyIHZlcnRpY2FsXG4gIC8vIG9mZnNldCBiZXR3ZWVuIGVkaXQgYW5kIHJlYWRpbmcgY29udGVudCBhcmVhcy5cbiAgY29uc3QgdG9wQ2hhaW4gPSAoKCkgPT4ge1xuICAgIGlmICghYW5jaG9yKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGNvbnN0IHBhcnRzOiB7IGNsczogc3RyaW5nOyBwYWRUb3A6IHN0cmluZzsgbWFyVG9wOiBzdHJpbmcgfVtdID0gW107XG4gICAgbGV0IG5vZGU6IEhUTUxFbGVtZW50IHwgbnVsbCA9IGFuY2hvcjtcbiAgICB3aGlsZSAobm9kZSAmJiBub2RlICE9PSBjb250ZW50RWwgJiYgbm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgY29uc3QgY3MgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgICAgcGFydHMucHVzaCh7XG4gICAgICAgIGNsczogbm9kZS5jbGFzc05hbWUgfHwgbm9kZS50YWdOYW1lLnRvTG93ZXJDYXNlKCksXG4gICAgICAgIHBhZFRvcDogY3MucGFkZGluZ1RvcCxcbiAgICAgICAgbWFyVG9wOiBjcy5tYXJnaW5Ub3AsXG4gICAgICB9KTtcbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudEVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiBwYXJ0cztcbiAgfSkoKTtcblxuICAvLyBUaXRsZSBwcm9iZTogdGhlIGdlbmVyYXRlZCA6OmJlZm9yZSBpbiBTbGlkZXMgbW9kZSAod2hlbiBhIHRpdGxlIGlzXG4gIC8vIGNvbmZpZ3VyZWQpLiBDYXB0dXJlcyBpdHMgY29tcHV0ZWQgc3R5bGUgc28gd2UgY2FuIGRpZmYgaXQgYWdhaW5zdCB0aGVcbiAgLy8gYm9keSBIMSAoLmNtLWhlYWRlci0xKSBhbmQgYWxpZ24gdGhlbSBleGFjdGx5LlxuICBjb25zdCB0aXRsZUJlZm9yZSA9ICgoKSA9PiB7XG4gICAgaWYgKCFpc0VkaXQpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3QgY29udGVudCA9IGNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcIi5jbS1jb250ZW50XCIpO1xuICAgIGlmICghY29udGVudCB8fCAhY29udGVudC5oYXNBdHRyaWJ1dGUoXCJkYXRhLXNsaWRlcy10aXRsZVwiKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBjb25zdCBjcyA9IGdldENvbXB1dGVkU3R5bGUoY29udGVudCwgXCI6OmJlZm9yZVwiKTtcbiAgICByZXR1cm4ge1xuICAgICAgY29udGVudDogY3MuY29udGVudCxcbiAgICAgIGRpc3BsYXk6IGNzLmRpc3BsYXksXG4gICAgICBwb3NpdGlvbjogY3MucG9zaXRpb24sXG4gICAgICB0b3A6IGNzLnRvcCxcbiAgICAgIGxlZnQ6IGNzLmxlZnQsXG4gICAgICBwYWRkaW5nVG9wOiBjcy5wYWRkaW5nVG9wLFxuICAgICAgZm9udEZhbWlseTogY3MuZm9udEZhbWlseSxcbiAgICAgIGZvbnRTaXplOiBjcy5mb250U2l6ZSxcbiAgICAgIGxpbmVIZWlnaHQ6IGNzLmxpbmVIZWlnaHQsXG4gICAgICBmb250V2VpZ2h0OiBjcy5mb250V2VpZ2h0LFxuICAgICAgZm9udFZhcmlhbnQ6IGNzLmZvbnRWYXJpYW50LFxuICAgICAgY29sb3I6IGNzLmNvbG9yLFxuICAgICAgbGV0dGVyU3BhY2luZzogY3MubGV0dGVyU3BhY2luZyxcbiAgICAgIHRleHRUcmFuc2Zvcm06IGNzLnRleHRUcmFuc2Zvcm0sXG4gICAgICB3b3JkU3BhY2luZzogY3Mud29yZFNwYWNpbmcsXG4gICAgICBmb250S2VybmluZzogY3MuZm9udEtlcm5pbmcsXG4gICAgICBmb250RmVhdHVyZVNldHRpbmdzOiBjcy5mb250RmVhdHVyZVNldHRpbmdzLFxuICAgICAgZm9udFZhcmlhbnROdW1lcmljOiBjcy5mb250VmFyaWFudE51bWVyaWMsXG4gICAgICBmb250VmFyaWFudExpZ2F0dXJlczogY3MuZm9udFZhcmlhbnRMaWdhdHVyZXMsXG4gICAgICBmb250VmFyaWFudENhcHM6IGNzLmZvbnRWYXJpYW50Q2FwcyxcbiAgICB9O1xuICB9KSgpO1xuXG4gIGNvbnN0IGR1bXAgPSB7XG4gICAgbW9kZTogaXNFZGl0ID8gXCJlZGl0IChMaXZlIFByZXZpZXcpXCIgOiBcInJlYWRpbmdcIixcbiAgICAvLyBTbGlkZXMgc3R5bGluZyBvbmx5IGFwcGxpZXMgd2hlbiBTbGlkZXMgbW9kZSBpcyBvblxuICAgIHNsaWRlc0FjdGl2ZTogZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuY29udGFpbnMoXCJuYXRpdmUtc2xpZGVzLW1vZGVcIiksXG4gICAgZG9tVGFnczogaXNFZGl0ID8gZG9tVGFncyA6IHVuZGVmaW5lZCxcbiAgICBzb3VyY2VWaWV3Q2xhc3M6IGlzRWRpdCA/IHNvdXJjZVZpZXdDbGFzcyA6IHVuZGVmaW5lZCxcbiAgICBsaXZlUHJldmlldzogaXNFZGl0ID8gaXNMaXZlUHJldmlldyhhcHApIDogdW5kZWZpbmVkLFxuICAgIGxpc3RMaW5lczogaXNFZGl0ID8gbGlzdExpbmVzIDogdW5kZWZpbmVkLFxuICAgIG1ldGFkYXRhQ29udGFpbmVyRGlzcGxheTogbWV0YWRhdGFEaXNwbGF5LFxuICAgIGgxT2Zmc2V0VG9wOiBoMU9mZnNldFRvcCxcbiAgICBoMVRvcEluQ29udGVudDogaDFUb3BJbkNvbnRlbnQsXG4gICAgaDFMZWZ0SW5Db250ZW50OiBoMUxlZnRJbkNvbnRlbnQsXG4gICAgY29udGVudENoaWxkcmVuOiBjb250ZW50Q2hpbGRyZW4sXG4gICAgdG9wQ2hhaW46IHRvcENoYWluLFxuICAgIHRpdGxlOiB0aXRsZUJlZm9yZSxcbiAgICBjb250YWluZXI6IHN0eWxlKGNvbnRhaW5lciwgW1xuICAgICAgXCJmb250LWZhbWlseVwiLFxuICAgICAgXCJmb250LXNpemVcIixcbiAgICAgIFwibGluZS1oZWlnaHRcIixcbiAgICAgIFwibWF4LXdpZHRoXCIsXG4gICAgICBcIndpZHRoXCIsXG4gICAgICBcInBhZGRpbmctdG9wXCIsXG4gICAgICBcInBhZGRpbmctcmlnaHRcIixcbiAgICAgIFwicGFkZGluZy1ib3R0b21cIixcbiAgICAgIFwicGFkZGluZy1sZWZ0XCIsXG4gICAgICBcImNvbG9yXCIsXG4gICAgICBcInRleHQtYWxpZ25cIixcbiAgICBdKSxcbiAgICBwYXJhZ3JhcGg6IHN0eWxlKHBhcmEsIFtcbiAgICAgIFwiZm9udC1zaXplXCIsXG4gICAgICBcImxpbmUtaGVpZ2h0XCIsXG4gICAgICBcIm1hcmdpbi10b3BcIixcbiAgICAgIFwibWFyZ2luLWJvdHRvbVwiLFxuICAgICAgXCJtYXJnaW4tbGVmdFwiLFxuICAgICAgXCJtYXJnaW4tcmlnaHRcIixcbiAgICAgIFwidGV4dC1pbmRlbnRcIixcbiAgICAgIFwidGV4dC1hbGlnblwiLFxuICAgIF0pLFxuICAgIGgxOiBzdHlsZShoMSwgW1xuICAgICAgXCJmb250LWZhbWlseVwiLFxuICAgICAgXCJmb250LXNpemVcIixcbiAgICAgIFwibGluZS1oZWlnaHRcIixcbiAgICAgIFwiZm9udC13ZWlnaHRcIixcbiAgICAgIFwiZm9udC12YXJpYW50XCIsXG4gICAgICBcImNvbG9yXCIsXG4gICAgICBcImxldHRlci1zcGFjaW5nXCIsXG4gICAgICBcInRleHQtdHJhbnNmb3JtXCIsXG4gICAgICBcIndvcmQtc3BhY2luZ1wiLFxuICAgICAgXCJmb250LWtlcm5pbmdcIixcbiAgICAgIFwiZm9udC1mZWF0dXJlLXNldHRpbmdzXCIsXG4gICAgICBcImZvbnQtdmFyaWFudC1udW1lcmljXCIsXG4gICAgICBcImZvbnQtdmFyaWFudC1saWdhdHVyZXNcIixcbiAgICAgIFwiZm9udC12YXJpYW50LWNhcHNcIixcbiAgICAgIFwibWFyZ2luLXRvcFwiLFxuICAgICAgXCJtYXJnaW4tYm90dG9tXCIsXG4gICAgICBcInRleHQtYWxpZ25cIixcbiAgICBdKSxcbiAgICBsaXN0SXRlbTogc3R5bGUobGlzdEl0ZW0sIFtcbiAgICAgIFwicGFkZGluZy1sZWZ0XCIsXG4gICAgICBcIm1hcmdpbi1sZWZ0XCIsXG4gICAgICBcIm1hcmdpbi1yaWdodFwiLFxuICAgICAgXCJ0ZXh0LWluZGVudFwiLFxuICAgICAgXCJsaW5lLWhlaWdodFwiLFxuICAgICAgXCJ0ZXh0LWFsaWduXCIsXG4gICAgXSksXG4gICAgY29kZUJsb2NrOiBzdHlsZShwcmUsIFtcbiAgICAgIFwiZm9udC1zaXplXCIsXG4gICAgICBcImxpbmUtaGVpZ2h0XCIsXG4gICAgICBcInBhZGRpbmctdG9wXCIsXG4gICAgICBcInBhZGRpbmctcmlnaHRcIixcbiAgICAgIFwicGFkZGluZy1ib3R0b21cIixcbiAgICAgIFwicGFkZGluZy1sZWZ0XCIsXG4gICAgICBcImJhY2tncm91bmQtY29sb3JcIixcbiAgICAgIFwiYm9yZGVyLXJhZGl1c1wiLFxuICAgIF0pLFxuICAgIGJsb2NrcXVvdGU6IHN0eWxlKHF1b3RlLCBbXG4gICAgICBcInBhZGRpbmctdG9wXCIsXG4gICAgICBcInBhZGRpbmctcmlnaHRcIixcbiAgICAgIFwicGFkZGluZy1ib3R0b21cIixcbiAgICAgIFwicGFkZGluZy1sZWZ0XCIsXG4gICAgICBcIm1hcmdpbi10b3BcIixcbiAgICAgIFwibWFyZ2luLWJvdHRvbVwiLFxuICAgICAgXCJib3JkZXItbGVmdC13aWR0aFwiLFxuICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCIsXG4gICAgXSksXG4gICAgaW5saW5lQ29kZTogc3R5bGUoaW5saW5lQ29kZSwgW1xuICAgICAgXCJmb250LXNpemVcIixcbiAgICAgIFwicGFkZGluZy10b3BcIixcbiAgICAgIFwicGFkZGluZy1ib3R0b21cIixcbiAgICAgIFwicGFkZGluZy1sZWZ0XCIsXG4gICAgICBcInBhZGRpbmctcmlnaHRcIixcbiAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiLFxuICAgICAgXCJib3JkZXItcmFkaXVzXCIsXG4gICAgXSksXG4gICAgdGFibGU6IHN0eWxlKHRhYmxlLCBbXCJmb250LXNpemVcIiwgXCJsaW5lLWhlaWdodFwiLCBcIndpZHRoXCIsIFwiYm9yZGVyLWNvbGxhcHNlXCJdKSxcbiAgICBpbWFnZTogc3R5bGUoaW1nLCBbXCJkaXNwbGF5XCIsIFwibWFyZ2luLWxlZnRcIiwgXCJtYXJnaW4tcmlnaHRcIiwgXCJtYXgtd2lkdGhcIiwgXCJ3aWR0aFwiXSksXG4gICAgaG9yaXpvbnRhbFJ1bGU6IHN0eWxlKGhyLCBbXCJtYXJnaW4tdG9wXCIsIFwibWFyZ2luLWJvdHRvbVwiLCBcImJvcmRlci10b3Atd2lkdGhcIiwgXCJoZWlnaHRcIl0pLFxuICAgIGNzc1ZhcmlhYmxlczoge1xuICAgICAgXCItLWZvbnQtdGV4dFwiOiBjc3NWYXIoXCItLWZvbnQtdGV4dFwiKSxcbiAgICAgIFwiLS1saW5lLWhlaWdodC1ub3JtYWxcIjogY3NzVmFyKFwiLS1saW5lLWhlaWdodC1ub3JtYWxcIiksXG4gICAgICBcIi0taDEtc2l6ZVwiOiBjc3NWYXIoXCItLWgxLXNpemVcIiksXG4gICAgICBcIi0taDEtbGluZS1oZWlnaHRcIjogY3NzVmFyKFwiLS1oMS1saW5lLWhlaWdodFwiKSxcbiAgICAgIFwiLS1oMS13ZWlnaHRcIjogY3NzVmFyKFwiLS1oMS13ZWlnaHRcIiksXG4gICAgICBcIi0taDEtdmFyaWFudFwiOiBjc3NWYXIoXCItLWgxLXZhcmlhbnRcIiksXG4gICAgICBcIi0taDEtY29sb3JcIjogY3NzVmFyKFwiLS1oMS1jb2xvclwiKSxcbiAgICAgIFwiLS1oMS1tYXJnaW4tdG9wXCI6IGNzc1ZhcihcIi0taDEtbWFyZ2luLXRvcFwiKSxcbiAgICAgIFwiLS1oMS1tYXJnaW4tYm90dG9tXCI6IGNzc1ZhcihcIi0taDEtbWFyZ2luLWJvdHRvbVwiKSxcbiAgICAgIFwiLS1wLXNwYWNpbmdcIjogY3NzVmFyKFwiLS1wLXNwYWNpbmdcIiksXG4gICAgICBcIi0tbGlzdC1zcGFjaW5nXCI6IGNzc1ZhcihcIi0tbGlzdC1zcGFjaW5nXCIpLFxuICAgICAgXCItLWxpc3QtaW5kZW50XCI6IGNzc1ZhcihcIi0tbGlzdC1pbmRlbnRcIiksXG4gICAgICBcIi0tY29kZS1zaXplXCI6IGNzc1ZhcihcIi0tY29kZS1zaXplXCIpLFxuICAgICAgXCItLWNvZGUtcGFkZGluZ1wiOiBjc3NWYXIoXCItLWNvZGUtcGFkZGluZ1wiKSxcbiAgICAgIFwiLS1jb2RlLXJhZGl1c1wiOiBjc3NWYXIoXCItLWNvZGUtcmFkaXVzXCIpLFxuICAgICAgXCItLWJsb2NrcXVvdGUtcGFkZGluZ1wiOiBjc3NWYXIoXCItLWJsb2NrcXVvdGUtcGFkZGluZ1wiKSxcbiAgICAgIFwiLS1ibG9ja3F1b3RlLWJvcmRlci10aGlja25lc3NcIjogY3NzVmFyKFwiLS1ibG9ja3F1b3RlLWJvcmRlci10aGlja25lc3NcIiksXG4gICAgICBcIi0tZmlsZS1tYXJnaW5zXCI6IGNzc1ZhcihcIi0tZmlsZS1tYXJnaW5zXCIpLFxuICAgICAgXCItLWZpbGUtbGluZS13aWR0aFwiOiBjc3NWYXIoXCItLWZpbGUtbGluZS13aWR0aFwiKSxcbiAgICAgIFwiLS1ub3JtYWwtZm9udC1zaXplXCI6IGNzc1ZhcihcIi0tbm9ybWFsLWZvbnQtc2l6ZVwiKSxcbiAgICAgIFwiLS1mb250LXRleHQtc2l6ZVwiOiBjc3NWYXIoXCItLWZvbnQtdGV4dC1zaXplXCIpLFxuICAgIH0sXG4gIH07XG4gIHJldHVybiBkdW1wO1xufVxuXG4vKipcbiAqIERlYnVnIHR5cG9ncmFwaHk6IHNhbXBsZXMgdGhlIGZpeGVkIG9uZS1wYWdlIHNhbXBsZSBub3RlcyAoZWFjaFxuICogY292ZXJpbmcgYSBncm91cCBvZiBlbGVtZW50cyBcdTIwMTQgYWxsIHZpc2libGUgd2l0aG91dCBzY3JvbGxpbmcpLFxuICogdGhlbiB0aGUga2l0Y2hlbi1zaW5rIG5vdGUgaW4gcmVhZGluZyB2aWV3IChubyB2aXJ0dWFsaXphdGlvblxuICogdGhlcmUpLCBtZXJnZXMgZXZlcnl0aGluZywgY29tcHV0ZXMgdGhlIGVkaXQtdnMtcmVhZGluZyBkaWZmIGFuZFxuICogd3JpdGVzIGl0IHRvIC5uYXRpdmUtc2xpZGVzLWRlYnVnLmpzb24gaW4gdGhlIHZhdWx0IHJvb3QuXG4gKiBUaGUgdXNlcidzIG93biBub3RlIGlzIHJlc3RvcmVkIGF0IHRoZSBlbmQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkdW1wVHlwb2dyYXBoeShwbHVnaW46IE5hdGl2ZVNsaWRlc1BsdWdpbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBhcHAgPSBwbHVnaW4uYXBwO1xuICBpZiAoIWRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmNvbnRhaW5zKFwibmF0aXZlLXNsaWRlcy1tb2RlXCIpKSB7XG4gICAgbmV3IE5vdGljZShcIk5hdGl2ZSBTbGlkZXM6IGVudGVyIFNsaWRlcyBtb2RlIGZpcnN0IChNb2QrU2hpZnQrRSBvbiBhIGRlY2sgbm90ZSlcIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHZpZXcgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgaWYgKCF2aWV3KSB7XG4gICAgbmV3IE5vdGljZShcIk5hdGl2ZSBTbGlkZXM6IG5vIGFjdGl2ZSBNYXJrZG93biBub3RlXCIpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBzdGFydE1vZGUgPSB2aWV3LmdldE1vZGUoKTtcbiAgY29uc3QgYWN0aXZlRmlsZSA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICBjb25zdCBsZWFmID0gYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKTtcblxuICAvLyBFZGl0IHNpZGU6IGVhY2ggc2hvcnQgbm90ZSBrZWVwcyBldmVyeSB0YXJnZXQgZWxlbWVudCBvbiBzY3JlZW5cbiAgY29uc3QgZWRpdDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcbiAgZm9yIChjb25zdCBuYW1lIG9mIFNBTVBMRV9OT1RFX05BTUVTKSB7XG4gICAgY29uc3QgZiA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoYCR7bmFtZX0ubWRgKTtcbiAgICBpZiAoIShmIGluc3RhbmNlb2YgVEZpbGUpKSBjb250aW51ZTtcbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGYsIHsgc3RhdGU6IHsgbW9kZTogXCJzb3VyY2VcIiB9IH0pO1xuICAgIGF3YWl0IHNsZWVwKDUwMCk7XG4gICAgY29uc3QgcyA9IHNhbXBsZVN0eWxlcyhhcHApO1xuICAgIGlmIChzKSBtZXJnZVNhbXBsZShlZGl0LCBzKTtcbiAgfVxuXG4gIC8vIFJlYWRpbmcgc2lkZTogdGhlIGtpdGNoZW4tc2luayBub3RlIHJlbmRlcnMgZXZlcnl0aGluZyBhdCBvbmNlXG4gIGxldCByZWFkaW5nOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwgPSBudWxsO1xuICBjb25zdCBkZW1vID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChcInR5cG9ncmFwaHktZGVtby5tZFwiKTtcbiAgaWYgKGRlbW8gaW5zdGFuY2VvZiBURmlsZSkge1xuICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZGVtbywgeyBzdGF0ZTogeyBtb2RlOiBcInByZXZpZXdcIiB9IH0pO1xuICAgIGF3YWl0IHNsZWVwKDgwMCk7XG4gICAgcmVhZGluZyA9IHNhbXBsZVN0eWxlcyhhcHApO1xuICB9XG5cbiAgLy8gUmVzdG9yZSB0aGUgdXNlcidzIG5vdGVcbiAgaWYgKGFjdGl2ZUZpbGUpIHtcbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGFjdGl2ZUZpbGUsIHsgc3RhdGU6IHsgbW9kZTogc3RhcnRNb2RlIH0gfSk7XG4gICAgcGx1Z2luLnJlZnJlc2goKTtcbiAgfVxuICBpZiAoIXJlYWRpbmcpIHtcbiAgICBuZXcgTm90aWNlKFwiTmF0aXZlIFNsaWRlczogcmVhZGluZyBzYW1wbGUgZmFpbGVkXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHBheWxvYWQgPSB7IGVkaXQsIHJlYWRpbmcsIGRpZmY6IGRpZmZEdW1wcyhlZGl0LCByZWFkaW5nKSB9O1xuICB0cnkge1xuICAgIGF3YWl0IGFwcC52YXVsdC5hZGFwdGVyLndyaXRlKFwiLm5hdGl2ZS1zbGlkZXMtZGVidWcuanNvblwiLCBKU09OLnN0cmluZ2lmeShwYXlsb2FkLCBudWxsLCAyKSk7XG4gICAgbmV3IE5vdGljZShcIlR5cG9ncmFwaHkgZHVtcCBcdTIxOTIgLm5hdGl2ZS1zbGlkZXMtZGVidWcuanNvbiAodmF1bHQgcm9vdClcIik7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbmV3IE5vdGljZShgTmF0aXZlIFNsaWRlczogY291bGQgbm90IHdyaXRlIGRlYnVnIGZpbGUgKCR7U3RyaW5nKGVycm9yKX0pYCk7XG4gIH1cbiAgY29uc29sZS5sb2coXCJbbmF0aXZlLXNsaWRlcyBkZWJ1Zy1zdHlsZXNdXCIsIEpTT04uc3RyaW5naWZ5KHBheWxvYWQsIG51bGwsIDIpKTtcbn1cblxuLyoqIFJlZ2lzdGVyIHRoZSBkZXYtb25seSBkZWJ1ZyBjb21tYW5kIChjYWxsZWQgb25seSB3aGVuIERFVl9NT0RFIGlzIHRydWUpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyRGVidWdDb21tYW5kKHBsdWdpbjogTmF0aXZlU2xpZGVzUGx1Z2luKTogdm9pZCB7XG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJucy1kZWJ1Zy1zdHlsZXNcIixcbiAgICBuYW1lOiBcIkRlYnVnOiBEdW1wIFR5cG9ncmFwaHkgU3R5bGVzXCIsXG4gICAgY2FsbGJhY2s6ICgpID0+IHZvaWQgZHVtcFR5cG9ncmFwaHkocGx1Z2luKSxcbiAgfSk7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNYXJrZG93blZpZXcsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbi8qKiBNb2RlIG9mIHRoZSBhY3RpdmUgTWFya2Rvd24gdmlldzogJ3ByZXZpZXcnPXJlYWRpbmcgJ3NvdXJjZSc9ZWRpdGluZyAnJz1ub25lICovXG5leHBvcnQgZnVuY3Rpb24gY3VycmVudE1vZGUoYXBwOiBBcHApOiBcInByZXZpZXdcIiB8IFwic291cmNlXCIgfCBcIlwiIHtcbiAgY29uc3QgdmlldyA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICByZXR1cm4gdmlldyA/ICh2aWV3LmdldE1vZGUoKSBhcyBcInByZXZpZXdcIiB8IFwic291cmNlXCIpIDogXCJcIjtcbn1cblxuLyoqXG4gKiBUcnVlIHdoZW4gdGhlIGFjdGl2ZSBlZGl0IHZpZXcgaXMgTGl2ZSBQcmV2aWV3IChTbGlkZXMpIFx1MjAxNCBhc1xuICogb3Bwb3NlZCB0byBTb3VyY2UgbW9kZS4gT2JzaWRpYW4gcmVwb3J0cyBib3RoIGFzIG1vZGUgXCJzb3VyY2VcIjtcbiAqIHRoZSB2aWV3IHN0YXRlIGNhcnJpZXMgYSBgc291cmNlYCBmbGFnIChTb3VyY2UgbW9kZSA9IHRydWUpLCB3aXRoXG4gKiBhIERPTSBjbGFzcyBmYWxsYmFjayAoLmlzLWxpdmUtcHJldmlldykgZm9yIHNhZmV0eS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTGl2ZVByZXZpZXcoYXBwOiBBcHApOiBib29sZWFuIHtcbiAgY29uc3QgdmlldyA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICBpZiAoIXZpZXcgfHwgdmlldy5nZXRNb2RlKCkgIT09IFwic291cmNlXCIpIHJldHVybiBmYWxzZTtcbiAgY29uc3Qgc3RhdGUgPSB2aWV3LmdldFN0YXRlKCkgYXMgeyBzb3VyY2U/OiBib29sZWFuIH07XG4gIGlmIChzdGF0ZS5zb3VyY2UgPT09IHRydWUpIHJldHVybiBmYWxzZTtcbiAgaWYgKHN0YXRlLnNvdXJjZSA9PT0gZmFsc2UpIHJldHVybiB0cnVlO1xuICByZXR1cm4gISF2aWV3LmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYuaXMtbGl2ZS1wcmV2aWV3XCIpO1xufVxuXG4vKiogRnJvbnRtYXR0ZXIgb2YgYW55IG5vdGUgYXMgYW4gb2JqZWN0LCBvciBudWxsIHdoZW4gYWJzZW50ICovXG5leHBvcnQgZnVuY3Rpb24gZnJvbnRtYXR0ZXJPZihhcHA6IEFwcCwgZmlsZTogVEZpbGUpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICBjb25zdCBjYWNoZSA9IGFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgcmV0dXJuIGNhY2hlPy5mcm9udG1hdHRlciA/PyBudWxsO1xufVxuXG4vKiogQ3VycmVudCBub3RlJ3MgZnJvbnRtYXR0ZXIgYXMgYW4gb2JqZWN0LCBvciBudWxsIHdoZW4gYWJzZW50ICovXG5leHBvcnQgZnVuY3Rpb24gYWN0aXZlRnJvbnRtYXR0ZXIoYXBwOiBBcHApOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICBjb25zdCBmaWxlID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gIHJldHVybiBmaWxlID8gZnJvbnRtYXR0ZXJPZihhcHAsIGZpbGUpIDogbnVsbDtcbn1cbiIsICIvKiogQSBidWlsdC1pbiBTbGlkZXMgc3R5bGUgdGVtcGxhdGUgKHJlbmRlcmVkIGFzIGJvZHkgY2xhc3MgYG5hdGl2ZS1zbGlkZXMtdGhlbWUtPGlkPmApICovXG5leHBvcnQgaW50ZXJmYWNlIFNsaWRlc1RoZW1lIHtcbiAgaWQ6IHN0cmluZztcbiAgbGFiZWw6IHN0cmluZztcbn1cblxuLyoqIEJ1aWx0LWluIHN0eWxlIHRlbXBsYXRlcyBmb3IgdGhlIFNsaWRlcyBjYXJkICsgYmFyIChhbGwgdGhlbWUtYWRhcHRpdmUpICovXG5leHBvcnQgY29uc3QgU0xJREVTX1RIRU1FUzogcmVhZG9ubHkgU2xpZGVzVGhlbWVbXSA9IFtcbiAgeyBpZDogXCJqeXlcIiwgbGFiZWw6IFwiTGVjdHVyZSAoanl5KVwiIH0sXG4gIHsgaWQ6IFwiZGFzaGVkXCIsIGxhYmVsOiBcIkRhc2hlZCBvdXRsaW5lXCIgfSxcbiAgeyBpZDogXCJwYXBlclwiLCBsYWJlbDogXCJQYXBlciBjYXJkXCIgfSxcbiAgeyBpZDogXCJtaW5pbWFsXCIsIGxhYmVsOiBcIk1pbmltYWxcIiB9LFxuICB7IGlkOiBcImFjY2VudFwiLCBsYWJlbDogXCJBY2NlbnQgZWRnZVwiIH0sXG4gIHsgaWQ6IFwiZ2xhc3NcIiwgbGFiZWw6IFwiRnJvc3RlZCBnbGFzc1wiIH0sXG5dO1xuXG4vKiogUGx1Z2luIHNldHRpbmdzICovXG5leHBvcnQgaW50ZXJmYWNlIE5hdGl2ZVNsaWRlc1NldHRpbmdzIHtcbiAgLyoqIFNob3cgXHUyNUMwIFx1MjVCNiBwcmV2aW91cy9uZXh0IGJ1dHRvbnMgb24gdGhlIGxlZnQgb2YgdGhlIHNsaWRlcyBiYXIgKi9cbiAgc2hvd05hdkJ1dHRvbnM6IGJvb2xlYW47XG4gIC8qKiBQYWdlIG51bWJlciBkaXNwbGF5IHN0eWxlOiBcImZyYWN0aW9uXCIgPSBOIC8gVG90YWwsIFwiY3VycmVudFwiID0gTiwgXCJub25lXCIgPSBoaWRkZW4gKi9cbiAgcGFnZU51bWJlclN0eWxlOiBcImZyYWN0aW9uXCIgfCBcImN1cnJlbnRcIiB8IFwibm9uZVwiO1xuICAvKiogU2hvdyBhIHRoaW4gY2xpY2thYmxlIHByb2dyZXNzIGxpbmUgYXQgdGhlIHRvcCBvZiB0aGUgc2xpZGVzIGJhciAqL1xuICBzaG93UHJvZ3Jlc3M6IGJvb2xlYW47XG4gIC8qKiBTaG93IHRoZSBlbnRpcmUgc2xpZGVzIGJhciAobWFzdGVyIHRvZ2dsZSkgKi9cbiAgc2hvd1NsaWRlc0JhcjogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgdGhlIHVzZXIgbWFudWFsbHkgaGlkIHRoZSBzbGlkZXMgYmFyICh0b2dnbGUgY29tbWFuZCkgKi9cbiAgYmFySGlkZGVuOiBib29sZWFuO1xuICAvKiogQXV0by1lbnRlciBTbGlkZXMgbW9kZSB3aGVuIG9wZW5pbmcgYSBkZWNrIG5vdGUgKGRlZmF1bHQgb2ZmKSAqL1xuICBhdXRvRW50ZXJTbGlkZXM6IGJvb2xlYW47XG4gIC8qKiBQcmVzcyBFc2NhcGUgdG8gZXhpdCBTbGlkZXMgbW9kZSAoZGVmYXVsdCBvbikgKi9cbiAgZXNjRXhpdHNTbGlkZXM6IGJvb2xlYW47XG4gIC8qKiBGcm9udG1hdHRlciBwcm9wZXJ0eSBzaG93biBhcyB0aGUgY2FyZCB0aXRsZSAoXCJcIiA9IG5vbmUsIFwiZmlsZW5hbWVcIiA9IGZpbGUgbmFtZSkgKi9cbiAgc2xpZGVzVGl0bGU6IHN0cmluZztcbiAgLyoqIFN0eWxlIHRlbXBsYXRlIGlkIGZyb20gU0xJREVTX1RIRU1FUyAoY2FyZCArIGJhciBhcHBlYXJhbmNlKSAqL1xuICBzbGlkZXNUaGVtZTogc3RyaW5nO1xuICAvKiogQ29tbWEtc2VwYXJhdGVkIGZyb250bWF0dGVyIHByb3BlcnR5IG5hbWVzIGZvciB0aGUgc2xpZGVzIGJhciAoZW1wdHkgPSBub25lKSAqL1xuICBiYXJQcm9wZXJ0aWVzOiBzdHJpbmc7XG4gIC8qKiBKU09OIGFycmF5IG9mIGNvbHVtbiB3aWR0aCBwZXJjZW50YWdlcyBmb3IgYmFyIHByb3BlcnRpZXMgKGRyYWdnYWJsZSBkaXZpZGVycykgKi9cbiAgYmFyUHJvcGVydHlXaWR0aHM6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IE5hdGl2ZVNsaWRlc1NldHRpbmdzID0ge1xuICBzaG93TmF2QnV0dG9uczogdHJ1ZSxcbiAgcGFnZU51bWJlclN0eWxlOiBcIm5vbmVcIixcbiAgc2hvd1Byb2dyZXNzOiB0cnVlLFxuICBzaG93U2xpZGVzQmFyOiB0cnVlLFxuICBiYXJIaWRkZW46IGZhbHNlLFxuICBhdXRvRW50ZXJTbGlkZXM6IGZhbHNlLFxuICBlc2NFeGl0c1NsaWRlczogdHJ1ZSxcbiAgc2xpZGVzVGl0bGU6IFwiXCIsXG4gIHNsaWRlc1RoZW1lOiBcImp5eVwiLFxuICBiYXJQcm9wZXJ0aWVzOiBcIlwiLFxuICBiYXJQcm9wZXJ0eVdpZHRoczogXCJcIixcbn07XG5cbi8qKiBSZXNlcnZlZCBmcm9udG1hdHRlciBrZXkgZHJpdmluZyBkZWNrIG5hdmlnYXRpb24gKG5ldmVyIHJlbmRlcmVkIGFzIGEgY2hpcCkgKi9cbmV4cG9ydCBjb25zdCBERUNLX0tFWSA9IFwiZGVja1wiO1xuIiwgImltcG9ydCB0eXBlIE5hdGl2ZVNsaWRlc1BsdWdpbiBmcm9tIFwiLi4vbWFpblwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJEZWJ1Z0NvbW1hbmQgfSBmcm9tIFwiLi9kZWJ1Z1wiO1xuaW1wb3J0IHsgZnJvbnRtYXR0ZXJPZiB9IGZyb20gXCIuL21vZGVcIjtcbmltcG9ydCB7IERFQ0tfS0VZIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuLyoqIFJlZ2lzdGVyIGV2ZXJ5IGNvbW1hbmQ7IHRoZSBkZWJ1ZyBjb21tYW5kIGlzIGRldi1idWlsZCBvbmx5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29tbWFuZHMocGx1Z2luOiBOYXRpdmVTbGlkZXNQbHVnaW4pOiB2b2lkIHtcbiAgLy8gVG9nZ2xlIHRoZSBzbGlkZXMgYmFyICh3aXRoaW4gU2xpZGVzIG1vZGUpXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJucy10b2dnbGUtYmFyXCIsXG4gICAgbmFtZTogXCJUb2dnbGUgU2xpZGVzIEJhclwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBwbHVnaW4uc2V0dGluZ3MuYmFySGlkZGVuID0gIXBsdWdpbi5zZXR0aW5ncy5iYXJIaWRkZW47XG4gICAgICBhd2FpdCBwbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICBwbHVnaW4ucmVmcmVzaCgpO1xuICAgIH0sXG4gIH0pO1xuICAvLyBIaWRlIC8gc2hvdyB0aGUgbW91c2UgcG9pbnRlciB3aW5kb3ctd2lkZSAocHJlc2VudGluZzsgU2xpZGVzIG1vZGUgb25seSlcbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcIm5zLXRvZ2dsZS1wb2ludGVyXCIsXG4gICAgbmFtZTogXCJUb2dnbGUgTW91c2UgUG9pbnRlclwiLFxuICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJNXCIgfV0sXG4gICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB7XG4gICAgICBpZiAoIWRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmNvbnRhaW5zKFwibmF0aXZlLXNsaWRlcy1tb2RlXCIpKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoIWNoZWNraW5nKSBwbHVnaW4udG9nZ2xlUG9pbnRlcigpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgfSk7XG4gIC8vIFByZXZpb3VzIC8gbmV4dCBwYWdlIChkZWNrIG5hdmlnYXRpb247IGVudGVyaW5nIFNsaWRlcyBtb2RlIGFzIG5lZWRlZClcbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcIm5zLXByZXZcIixcbiAgICBuYW1lOiBcIlByZXZpb3VzIFBhZ2VcIixcbiAgICBob3RrZXlzOiBbeyBtb2RpZmllcnM6IFtcIk1vZFwiLCBcIlNoaWZ0XCJdLCBrZXk6IFwiQXJyb3dMZWZ0XCIgfV0sXG4gICAgY2FsbGJhY2s6ICgpID0+IHBsdWdpbi5uYXZpZ2F0ZShcInByZXZcIiksXG4gIH0pO1xuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwibnMtbmV4dFwiLFxuICAgIG5hbWU6IFwiTmV4dCBQYWdlXCIsXG4gICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIiwgXCJTaGlmdFwiXSwga2V5OiBcIkFycm93UmlnaHRcIiB9XSxcbiAgICBjYWxsYmFjazogKCkgPT4gcGx1Z2luLm5hdmlnYXRlKFwibmV4dFwiKSxcbiAgfSk7XG4gIC8vIENyZWF0ZSBOZXh0IFNsaWRlIFx1MjAxNCBuZXcgc2xpZGUgYWZ0ZXIgdGhlIGN1cnJlbnQgb25lIChkZWNrIG5vdGVzIG9ubHkpXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJucy1jcmVhdGUtbmV4dFwiLFxuICAgIG5hbWU6IFwiQ3JlYXRlIE5leHQgU2xpZGVcIixcbiAgICAvLyBHcmV5ZWQgb3V0IGluIHRoZSBwYWxldHRlIHVubGVzcyB0aGUgYWN0aXZlIG5vdGUgY2FuIHRha2UgYSBuZXh0IHNsaWRlXG4gICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB7XG4gICAgICBjb25zdCBmaWxlID0gcGx1Z2luLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgICAgaWYgKCFmaWxlKSByZXR1cm4gZmFsc2U7XG4gICAgICBjb25zdCBwbGFuID0gcGx1Z2luLmRlY2tTZXJ2aWNlLnBsYW5DcmVhdGVOZXh0KGZpbGUpO1xuICAgICAgaWYgKCFwbGFuKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoIWNoZWNraW5nKSB2b2lkIHBsdWdpbi5kZWNrU2VydmljZS5leGVjdXRlQ3JlYXRlTmV4dChmaWxlLCBwbGFuKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG4gIH0pO1xuICAvLyBUb2dnbGUgU2xpZGVzIG1vZGUgXHUyMDE0IHRoZSBpbW1lcnNpdmUgY2FyZCB2aWV3IChkZWNrIG5vdGVzIG9ubHkpXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJucy10b2dnbGUtc2xpZGVzXCIsXG4gICAgbmFtZTogXCJUb2dnbGUgU2xpZGVzIE1vZGVcIixcbiAgICBob3RrZXlzOiBbeyBtb2RpZmllcnM6IFtcIk1vZFwiLCBcIlNoaWZ0XCJdLCBrZXk6IFwiRVwiIH1dLFxuICAgIGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZykgPT4ge1xuICAgICAgY29uc3QgZmlsZSA9IHBsdWdpbi5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICAgIGlmICghZmlsZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgY29uc3QgZm0gPSBmcm9udG1hdHRlck9mKHBsdWdpbi5hcHAsIGZpbGUpO1xuICAgICAgaWYgKGZtID09PSBudWxsIHx8ICEoREVDS19LRVkgaW4gZm0pKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoIWNoZWNraW5nKSBwbHVnaW4udG9nZ2xlU2xpZGVzKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuICB9KTtcbiAgLy8gRGVidWcgdG9vbGluZyBcdTIwMTQgcmVnaXN0ZXJlZCBvbmx5IGluIGRldiBidWlsZHMgKHRyZWUtc2hha2VuIGluIHJlbGVhc2UpXG4gIGlmIChERVZfTU9ERSkgcmVnaXN0ZXJEZWJ1Z0NvbW1hbmQocGx1Z2luKTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IHBsYW5DcmVhdGVOZXh0IGFzIHBsYW4sIHR5cGUgQ3JlYXRlTmV4dFJlc3VsdCB9IGZyb20gXCIuL2NyZWF0ZU5leHRcIjtcbmltcG9ydCB7IGNvbXB1dGVEZWNrLCBleHRyYWN0TGlua3MsIGV4dHJhY3RSYXdMaW5rcywgdHlwZSBEZWNrSW5mbyB9IGZyb20gXCIuL2RlY2tcIjtcbmltcG9ydCB7IGZyb250bWF0dGVyT2YgfSBmcm9tIFwiLi9tb2RlXCI7XG5pbXBvcnQgeyBERUNLX0tFWSB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbi8qKiBEZWNrIGNoYWluIHJlc29sdXRpb24gKyBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIgZ2x1ZSAod3JhcHMgdGhlIHB1cmUgY29yZSkuICovXG5leHBvcnQgY2xhc3MgRGVja1NlcnZpY2Uge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwKSB7fVxuXG4gIC8qKiBSZXNvbHZlIHRoZSBjdXJyZW50IG5vdGUncyBwb3NpdGlvbiBpbnNpZGUgaXRzIGRlY2sgKHBhdGgtYmFzZWQgd3JhcHBlcikgKi9cbiAgY29tcHV0ZShmaWxlOiBURmlsZSk6IERlY2tJbmZvIHwgbnVsbCB7XG4gICAgcmV0dXJuIGNvbXB1dGVEZWNrKGZpbGUucGF0aCwgKHBhdGgpID0+IHRoaXMubGlua1BhdGhzKHBhdGgpKTtcbiAgfVxuXG4gIC8qKiBSZXNvbHZlIHRoZSBgZGVja2AgcHJvcGVydHkgb2YgYSBub3RlIGludG8gcmVhbCBub3RlIHBhdGhzIChtYXggdHdvKSAqL1xuICBwcml2YXRlIGxpbmtQYXRocyhwYXRoOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZiA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcbiAgICBpZiAoIShmIGluc3RhbmNlb2YgVEZpbGUpKSByZXR1cm4gW107XG4gICAgY29uc3QgZm0gPSBmcm9udG1hdHRlck9mKHRoaXMuYXBwLCBmKTtcbiAgICBjb25zdCBuYW1lcyA9IGZtID8gZXh0cmFjdExpbmtzKGZtW0RFQ0tfS0VZXSkgOiBbXTtcbiAgICByZXR1cm4gbmFtZXNcbiAgICAgIC5tYXAoKG5hbWUpID0+IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3QobmFtZSwgcGF0aCkpXG4gICAgICAuZmlsdGVyKCh4KTogeCBpcyBURmlsZSA9PiAhIXgpXG4gICAgICAubWFwKCh4KSA9PiB4LnBhdGgpO1xuICB9XG5cbiAgLyoqIE5hbWVzIGluIHRoZSBgZGVja2AgcHJvcGVydHkgdGhhdCByZXNvbHZlIHRvIG5vIG5vdGUgKGJyb2tlbiBsaW5rcykgKi9cbiAgYnJva2VuKGZpbGU6IFRGaWxlKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGZtID0gZnJvbnRtYXR0ZXJPZih0aGlzLmFwcCwgZmlsZSk7XG4gICAgY29uc3QgbmFtZXMgPSBmbSA/IGV4dHJhY3RMaW5rcyhmbVtERUNLX0tFWV0pIDogW107XG4gICAgcmV0dXJuIG5hbWVzLmZpbHRlcigobmFtZSkgPT4gIXRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3QobmFtZSwgZmlsZS5wYXRoKSk7XG4gIH1cblxuICAvKipcbiAgICogUGxhbiBhIFwiQ3JlYXRlIE5leHQgU2xpZGVcIiBydW4gZm9yIHRoZSBhY3RpdmUgbm90ZSwgb3IgbnVsbCB3aGVuIHRoZVxuICAgKiBub3RlIGNhbm5vdCB0YWtlIGEgbmV4dCBzbGlkZSAobm8gdXNhYmxlIGBkZWNrYCBwcm9wZXJ0eSkuXG4gICAqXG4gICAqIFNsaWRlcyBvbiB0aGUgY2hhaW4gaW5zZXJ0L2FwcGVuZCBhZnRlciB0aGUgY3VycmVudCBub3RlOyB0aGUgb3ZlcnZpZXdcbiAgICogcGFnZSBpbnNlcnRzIGEgbmV3IGZpcnN0IHBhZ2U7IGFuIG9mZi1jaGFpbiBub3RlIHdpdGggYSByZXNvbHZhYmxlXG4gICAqIG92ZXJ2aWV3IGxpbmsgc3RpbGwgZ2V0cyBpdHMgZGVjbGFyZWQgbWlzc2luZyBuZXh0IG5vdGUgY3JlYXRlZC5cbiAgICovXG4gIHBsYW5DcmVhdGVOZXh0KGZpbGU6IFRGaWxlKTogQ3JlYXRlTmV4dFJlc3VsdCB8IG51bGwge1xuICAgIGNvbnN0IGZtID0gZnJvbnRtYXR0ZXJPZih0aGlzLmFwcCwgZmlsZSk7XG4gICAgY29uc3QgcmF3ID0gZm0gPyBleHRyYWN0UmF3TGlua3MoZm1bREVDS19LRVldKSA6IFtdO1xuICAgIGlmIChyYXcubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICAgIGNvbnN0IGRlY2sgPSB0aGlzLmNvbXB1dGUoZmlsZSk7XG4gICAgY29uc3QgZXhpc3RpbmdOYW1lcyA9IG5ldyBTZXQodGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpLm1hcCgoZikgPT4gZi5iYXNlbmFtZSkpO1xuXG4gICAgaWYgKGRlY2spIHtcbiAgICAgIC8vIE92ZXJ2aWV3IGluc2VydGlvbiBuZWVkcyB0aGUgb2xkIGZpcnN0IHBhZ2UncyBiYWNrIGxpbmsgdG8gdGhlXG4gICAgICAvLyBvdmVydmlldyAoaXRzIG93biBmcm9udG1hdHRlciBvbmx5IGxpbmtzIGZvcndhcmQpLlxuICAgICAgbGV0IG92ZXJ2aWV3QmFja0xpbms6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChkZWNrLmluZGV4ID09PSAwKSB7XG4gICAgICAgIGNvbnN0IG9sZEZpcnN0ID0gZGVjay5jaGFpblsxXSA/IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChkZWNrLmNoYWluWzFdKSA6IG51bGw7XG4gICAgICAgIGlmIChvbGRGaXJzdCBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICAgICAgY29uc3QgZjIgPSBmcm9udG1hdHRlck9mKHRoaXMuYXBwLCBvbGRGaXJzdCk7XG4gICAgICAgICAgb3ZlcnZpZXdCYWNrTGluayA9IGYyID8gZXh0cmFjdFJhd0xpbmtzKGYyW0RFQ0tfS0VZXSlbMF0gOiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBwbGFuKHtcbiAgICAgICAgY3VycmVudE5hbWU6IGZpbGUuYmFzZW5hbWUsXG4gICAgICAgIGN1cnJlbnRMaW5rczogcmF3LFxuICAgICAgICBpc092ZXJ2aWV3OiBkZWNrLmluZGV4ID09PSAwLFxuICAgICAgICBvdmVydmlld0JhY2tMaW5rLFxuICAgICAgICBleGlzdGluZ05hbWVzLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gT2ZmLWNoYWluIG5vdGU6IHN0aWxsIGNyZWF0ZSBpdHMgZGVjbGFyZWQgbWlzc2luZyBuZXh0IG5vdGUgd2hlbiB0aGVcbiAgICAvLyBvdmVydmlldyBsaW5rIHJlc29sdmVzICh0aGUgXHUyNkEwIGJyb2tlbi1saW5rIHdhcm5pbmcgZGlzYXBwZWFycykuXG4gICAgY29uc3Qgb3ZlcnZpZXdOYW1lID0gcmF3Lmxlbmd0aCA+PSAyID8gZXh0cmFjdExpbmtzKHJhd1swXSlbMF0gOiBudWxsO1xuICAgIGlmIChvdmVydmlld05hbWUgJiYgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChvdmVydmlld05hbWUsIGZpbGUucGF0aCkpIHtcbiAgICAgIHJldHVybiBwbGFuKHtcbiAgICAgICAgY3VycmVudE5hbWU6IGZpbGUuYmFzZW5hbWUsXG4gICAgICAgIGN1cnJlbnRMaW5rczogcmF3LFxuICAgICAgICBpc092ZXJ2aWV3OiBmYWxzZSxcbiAgICAgICAgZXhpc3RpbmdOYW1lcyxcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKiBBcHBseSBhIHBsYW46IGNyZWF0ZSB0aGUgbm90ZSwgcmV3aXJlIGBkZWNrYCBwcm9wZXJ0aWVzLCBvcGVuIGl0ICovXG4gIGFzeW5jIGV4ZWN1dGVDcmVhdGVOZXh0KGZpbGU6IFRGaWxlLCBwbGFuOiBDcmVhdGVOZXh0UmVzdWx0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZGlyID0gZmlsZS5wYXJlbnQ/LnBhdGggPyBmaWxlLnBhcmVudC5wYXRoICsgXCIvXCIgOiBcIlwiO1xuICAgIGNvbnN0IG5ld1BhdGggPSBgJHtkaXJ9JHtwbGFuLm5ld05hbWV9Lm1kYDtcbiAgICBjb25zdCBmcm9udG1hdHRlciA9IHBsYW4ubmV3RGVja0xpbmtzLm1hcCgobGluaykgPT4gSlNPTi5zdHJpbmdpZnkobGluaykpLmpvaW4oXCIsIFwiKTtcbiAgICBjb25zdCBjb250ZW50ID0gYC0tLVxcbmRlY2s6IFske2Zyb250bWF0dGVyfV1cXG4tLS1cXG5gO1xuXG4gICAgbGV0IG5ld0ZpbGU6IFRGaWxlO1xuICAgIHRyeSB7XG4gICAgICBuZXdGaWxlID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKG5ld1BhdGgsIGNvbnRlbnQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBuZXcgTm90aWNlKGBOYXRpdmUgU2xpZGVzOiBjb3VsZCBub3QgY3JlYXRlIFwiJHtwbGFuLm5ld05hbWV9Lm1kXCIgKCR7U3RyaW5nKGVycm9yKX0pYCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmV3aXJlIHRoZSBjdXJyZW50IG5vdGUncyBgZGVja2AgKGtlZXBzIGFsbCBvdGhlciBwcm9wZXJ0aWVzIGludGFjdClcbiAgICBmb3IgKGNvbnN0IHJld3JpdGUgb2YgcGxhbi5yZXdyaXRlcykge1xuICAgICAgaWYgKHJld3JpdGUubmFtZSAhPT0gZmlsZS5iYXNlbmFtZSkgY29udGludWU7IC8vIGluIHByYWN0aWNlIGFsd2F5cyB0aGUgY3VycmVudCBub3RlXG4gICAgICBhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5wcm9jZXNzRnJvbnRNYXR0ZXIoZmlsZSwgKGZtKSA9PiB7XG4gICAgICAgIGZtW0RFQ0tfS0VZXSA9IHJld3JpdGUuZGVjaztcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIE9wZW4gdGhlIG5ldyBub3RlIGluIHRoZSBjdXJyZW50IHBhbmUsIGVkaXQgbW9kZSAoTGl2ZSBQcmV2aWV3KVxuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSk7XG4gICAgYXdhaXQgbGVhZi5vcGVuRmlsZShuZXdGaWxlLCB7IHN0YXRlOiB7IG1vZGU6IFwic291cmNlXCIgfSB9KTtcbiAgfVxufVxuIiwgIi8qKlxuICogZGVjay50cyBcdTIwMTQgUHVyZSBkZWNrLXJlc29sdXRpb24gY29yZSBmb3IgbmF0aXZlLXNsaWRlcy5cbiAqXG4gKiBFdmVyeXRoaW5nIGluIHRoaXMgbW9kdWxlIGlzIGZyZWUgb2YgT2JzaWRpYW4gcnVudGltZSBkZXBlbmRlbmNpZXMgc28gaXQgY2FuXG4gKiBiZSB1bml0IHRlc3RlZCBkaXJlY3RseSAoc2VlIHRlc3QvZGVjay50ZXN0LnRzKS4gbWFpbi50cyBhZGFwdHMgdGhlIHZhdWx0XG4gKiAobWV0YWRhdGFDYWNoZSkgdG8gdGhpcyBwdXJlIGludGVyZmFjZTogaXQgcmVzb2x2ZXMgYGRlY2tgIHByb3BlcnRpZXMgdG9cbiAqIG5vdGUgcGF0aHMsIHRoZW4gaGFuZHMgdGhlIHBhdGggZ3JhcGggdG8gY29tcHV0ZURlY2soKS5cbiAqL1xuXG4vKiogQSBkZWNrIGxpbmsgbGlzdCBuZXZlciBob2xkcyBtb3JlIHRoYW4gdHdvIGVudHJpZXMgKi9cbmV4cG9ydCBjb25zdCBNQVhfREVDS19MSU5LUyA9IDI7XG5cbi8qKiBSZXN1bHQgb2YgcmVzb2x2aW5nIGEgbm90ZSdzIHBvc2l0aW9uIGluc2lkZSBhIGRlY2sgKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVja0luZm8ge1xuICAvKiogQ2hhaW4gb2Ygbm90ZSBwYXRoczogWzBdIGlzIHRoZSBvdmVydmlldyBub3RlLCB0aGVuIHNsaWRlcyBpbiBvcmRlciAqL1xuICBjaGFpbjogc3RyaW5nW107XG4gIC8qKiBJbmRleCBvZiB0aGUgY3VycmVudCBub3RlIGluc2lkZSBjaGFpbiAqL1xuICBpbmRleDogbnVtYmVyO1xufVxuXG4vKipcbiAqIFJlc29sdmUgYSBub3RlJ3MgcG9zaXRpb24gaW5zaWRlIGl0cyBkZWNrIGJ5IHdhbGtpbmcgdGhlIGxpbmsgY2hhaW4uXG4gKlxuICogQ29udmVudGlvbiBmb3IgdGhlIHNpbmdsZSBgZGVja2AgcHJvcGVydHkgKHVwIHRvIHR3byBsaW5rcyk6XG4gKiAgIC0gb3ZlcnZpZXcgbm90ZTogb25lIGxpbmsgXHUyMTkyIHRoYXQgbGluayBJUyB0aGUgZmlyc3QgcGFnZTtcbiAqICAgLSBzbGlkZSBub3RlOiAgICBmaXJzdCBsaW5rIFx1MjE5MiB0aGUgb3ZlcnZpZXcgcGFnZSwgc2Vjb25kIGxpbmsgXHUyMTkyIG5leHQgc2xpZGVcbiAqICAgICAgICAgICAgICAgICAgICAobm8gc2Vjb25kIGxpbmsgb24gdGhlIGxhc3Qgc2xpZGUpLlxuICpcbiAqIGBnZXRMaW5rcyhwYXRoKWAgbXVzdCByZXR1cm4gdGhlIHJlc29sdmVkIG5vdGUgcGF0aHMgb2YgdGhlIGBkZWNrYCBwcm9wZXJ0eVxuICogb2YgdGhlIG5vdGUgYXQgYHBhdGhgIChlbXB0eSB3aGVuIHRoZSBub3RlIGhhcyBub25lLCBvciBpdHMgbGlua3MgYXJlXG4gKiBicm9rZW4gXHUyMDE0IGEgYnJva2VuIGxpbmsgc2ltcGx5IGVuZHMgb3IgZXhjbHVkZXMgdGhlIGNoYWluLCBuZXZlciBjcmFzaGVzKS5cbiAqXG4gKiBSZXR1cm5zIHRoZSBmdWxsIGNoYWluIChbb3ZlcnZpZXcsIHNsaWRlIDEsIHNsaWRlIDIsIFx1MjAyNl0pIGFuZCB0aGUgY3VycmVudFxuICogbm90ZSdzIGluZGV4LCBvciBudWxsIHdoZW4gdGhlIG5vdGUgaXMgbm90IHBhcnQgb2YgYW55IGRlY2suXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlRGVjayhcbiAgY3VycmVudFBhdGg6IHN0cmluZyxcbiAgZ2V0TGlua3M6IChwYXRoOiBzdHJpbmcpID0+IHN0cmluZ1tdLFxuKTogRGVja0luZm8gfCBudWxsIHtcbiAgY29uc3QgY3VycmVudExpbmtzID0gZ2V0TGlua3MoY3VycmVudFBhdGgpO1xuICBpZiAoY3VycmVudExpbmtzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgbGV0IG92ZXJ2aWV3OiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGxldCBmaXJzdFBhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICBpZiAoY3VycmVudExpbmtzLmxlbmd0aCA+PSAyKSB7XG4gICAgLy8gQSBzbGlkZTogZmlyc3QgbGluayBpcyB0aGUgb3ZlcnZpZXcgcGFnZVxuICAgIG92ZXJ2aWV3ID0gY3VycmVudExpbmtzWzBdO1xuICAgIGZpcnN0UGFnZSA9IGdldExpbmtzKG92ZXJ2aWV3KVswXTtcbiAgfSBlbHNlIHtcbiAgICAvLyBBIHNpbmdsZSBsaW5rOiBlaXRoZXIgd2UgQVJFIHRoZSBvdmVydmlldyAobGluayA9IGZpcnN0IHBhZ2UpLFxuICAgIC8vIG9yIHdlIGFyZSB0aGUgbGFzdCBzbGlkZSAobGluayA9IG92ZXJ2aWV3IHBhZ2UpXG4gICAgY29uc3Qgb25seSA9IGN1cnJlbnRMaW5rc1swXTtcbiAgICBjb25zdCBvbmx5TGlua3MgPSBnZXRMaW5rcyhvbmx5KTtcbiAgICBpZiAob25seUxpbmtzWzBdID09PSBjdXJyZW50UGF0aCkge1xuICAgICAgb3ZlcnZpZXcgPSBjdXJyZW50UGF0aDtcbiAgICAgIGZpcnN0UGFnZSA9IG9ubHk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG92ZXJ2aWV3ID0gb25seTtcbiAgICAgIGZpcnN0UGFnZSA9IG9ubHlMaW5rc1swXTtcbiAgICB9XG4gIH1cbiAgaWYgKCFvdmVydmlldyB8fCAhZmlyc3RQYWdlKSByZXR1cm4gbnVsbDtcblxuICAvLyBXYWxrIHRoZSBjaGFpbjogb3ZlcnZpZXcgXHUyMTkyIGZpcnN0IHBhZ2UgXHUyMTkyIG5leHQgXHUyMTkyIG5leHQgXHUyMTkyIFx1MjAyNlxuICBjb25zdCBjaGFpbjogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgdmlzaXRlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBwdXNoID0gKHA6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHZvaWQgPT4ge1xuICAgIGlmIChwICYmICF2aXNpdGVkLmhhcyhwKSkge1xuICAgICAgdmlzaXRlZC5hZGQocCk7XG4gICAgICBjaGFpbi5wdXNoKHApO1xuICAgIH1cbiAgfTtcbiAgcHVzaChvdmVydmlldyk7XG4gIHB1c2goZmlyc3RQYWdlKTtcbiAgbGV0IGN1ciA9IGZpcnN0UGFnZTtcbiAgd2hpbGUgKGN1cikge1xuICAgIGNvbnN0IG5leHQgPSBnZXRMaW5rcyhjdXIpWzFdO1xuICAgIGlmICghbmV4dCB8fCB2aXNpdGVkLmhhcyhuZXh0KSkgYnJlYWs7IC8vIGVuZCBvZiBkZWNrIG9yIGN5Y2xlIGd1YXJkXG4gICAgcHVzaChuZXh0KTtcbiAgICBjdXIgPSBuZXh0O1xuICB9XG5cbiAgY29uc3QgaW5kZXggPSBjaGFpbi5pbmRleE9mKGN1cnJlbnRQYXRoKTtcbiAgaWYgKGluZGV4ID09PSAtMSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiB7IGNoYWluLCBpbmRleCB9O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdXAgdG8gYG1heGAgbm90ZSBuYW1lcyBmcm9tIGEgYGRlY2tgIHByb3BlcnR5IHZhbHVlLlxuICogQWNjZXB0cyBhIHNpbmdsZSBzdHJpbmcgb3IgYSBZQU1MIGxpc3Qgb2Ygc3RyaW5nczsgdW5xdW90ZWQgW1t4XV0gdmFsdWVzIGFyZVxuICogcGFyc2VkIGJ5IFlBTUwgYXMgbmVzdGVkIGFycmF5cyBhbmQgZmxhdHRlbmVkIGhlcmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0TGlua3ModmFsdWU6IHVua25vd24sIG1heDogbnVtYmVyID0gTUFYX0RFQ0tfTElOS1MpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGZsYXQ6IHVua25vd25bXSA9IFtdO1xuICBjb25zdCBjb2xsZWN0ID0gKHY6IHVua25vd24pOiB2b2lkID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHYpIGNvbGxlY3QoaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZsYXQucHVzaCh2KTtcbiAgICB9XG4gIH07XG4gIGNvbGxlY3QodmFsdWUpO1xuXG4gIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBpdGVtIG9mIGZsYXQpIHtcbiAgICBjb25zdCBuYW1lID0gZXh0cmFjdExpbmtUZXh0KGl0ZW0pO1xuICAgIGlmIChuYW1lKSBvdXQucHVzaChuYW1lKTtcbiAgICBpZiAob3V0Lmxlbmd0aCA+PSBtYXgpIGJyZWFrO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogRXh0cmFjdCB1cCB0byBgbWF4YCByYXcgbGluayBzdHJpbmdzIGZyb20gYSBgZGVja2AgcHJvcGVydHkgdmFsdWUgXHUyMDE0IHRoZVxuICogdHJpbW1lZCB2YWx1ZXMgZXhhY3RseSBhcyB3cml0dGVuIChhbGlhcyAvIHBhdGggZm9ybXMgcHJlc2VydmVkKS4gU2FtZVxuICogZmxhdHRlbmluZyBydWxlcyBhcyBleHRyYWN0TGlua3MoKSwgYnV0IHdpdGhvdXQgZXh0cmFjdGluZyB0aGUgdGFyZ2V0IG5hbWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0UmF3TGlua3ModmFsdWU6IHVua25vd24sIG1heDogbnVtYmVyID0gTUFYX0RFQ0tfTElOS1MpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGZsYXQ6IHVua25vd25bXSA9IFtdO1xuICBjb25zdCBjb2xsZWN0ID0gKHY6IHVua25vd24pOiB2b2lkID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHYpIGNvbGxlY3QoaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZsYXQucHVzaCh2KTtcbiAgICB9XG4gIH07XG4gIGNvbGxlY3QodmFsdWUpO1xuXG4gIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBpdGVtIG9mIGZsYXQpIHtcbiAgICBpZiAodHlwZW9mIGl0ZW0gIT09IFwic3RyaW5nXCIpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHRyaW1tZWQgPSBpdGVtLnRyaW0oKTtcbiAgICBpZiAoIXRyaW1tZWQpIGNvbnRpbnVlO1xuICAgIG91dC5wdXNoKHRyaW1tZWQpO1xuICAgIGlmIChvdXQubGVuZ3RoID49IG1heCkgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRoZSB0YXJnZXQgbm90ZSBuYW1lIGZyb20gYSBtYXJrZG93biBsaW5rIHN0cmluZy5cbiAqIEhhbmRsZXMgc2V2ZXJhbCBzaGFwZXM6XG4gKiAgIFwiW1tzbGlkZS0yXV1cIiAgICAgICAgXHUyMTkyIHNsaWRlLTJcbiAqICAgXCJbW3NsaWRlLTJ8YWxpYXNdXVwiICBcdTIxOTIgc2xpZGUtMlxuICogICBcIltbc2xpZGUtMiNzZWN0aW9uXV1cIlx1MjE5MiBzbGlkZS0yXG4gKiAgIHNsaWRlLTIgICAgICAgICAgICAgIFx1MjE5MiBzbGlkZS0yIChiYXJlIGZpbGVuYW1lKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdExpbmtUZXh0KHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHJldHVybiBudWxsO1xuICBjb25zdCB0cmltbWVkID0gdmFsdWUudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHJldHVybiBudWxsO1xuICByZXR1cm4gdHJpbW1lZC5yZXBsYWNlKC9eXFxbXFxbLywgXCJcIikucmVwbGFjZSgvXFxdXFxdJC8sIFwiXCIpLnNwbGl0KFwifFwiKVswXS5zcGxpdChcIiNcIilbMF0udHJpbSgpO1xufVxuXG4vKiogUmVuZGVyIGEgcHJvcGVydHkgdmFsdWUgYXMgcmVhZGFibGUgdGV4dDogYXJyYXlzL29iamVjdHMgXHUyMTkyIEpTT04sIGVsc2UgU3RyaW5nICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0VmFsdWUodmFsdWU6IHVua25vd24pOiBzdHJpbmcge1xuICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFwiXHUyMDE0XCI7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBTdHJpbmcodmFsdWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbn1cbiIsICIvKipcbiAqIGNyZWF0ZU5leHQudHMgXHUyMDE0IFB1cmUgXCJDcmVhdGUgTmV4dCBTbGlkZVwiIHBsYW5uaW5nIGNvcmUgZm9yIG5hdGl2ZS1zbGlkZXMuXG4gKlxuICogRXZlcnl0aGluZyBpbiB0aGlzIG1vZHVsZSBpcyBmcmVlIG9mIE9ic2lkaWFuIHJ1bnRpbWUgZGVwZW5kZW5jaWVzIHNvIGl0IGNhblxuICogYmUgdW5pdCB0ZXN0ZWQgZGlyZWN0bHkgKHNlZSB0ZXN0L2NyZWF0ZU5leHQudGVzdC50cykuIG1haW4udHMgYWRhcHRzIHRoZVxuICogdmF1bHQgKG1ldGFkYXRhQ2FjaGUsIGNvbXB1dGVEZWNrKSB0byB0aGlzIHB1cmUgaW50ZXJmYWNlIGFuZCBhcHBsaWVzIHRoZVxuICogcmVzdWx0aW5nIHBsYW4gd2l0aCB2YXVsdC5jcmVhdGUoKSArIGZpbGVNYW5hZ2VyLnByb2Nlc3NGcm9udE1hdHRlcigpLlxuICpcbiAqIFRoZSBwbGFuIGRlY2lkZXMsIGZvciB0aGUgY3VycmVudCBub3RlOlxuICogICAtIHRoZSBuYW1lIG9mIHRoZSBuZXcgc2xpZGUgZmlsZSAoY29sbGlzaW9uLWF3YXJlKSxcbiAqICAgLSB0aGUgcmF3IGBkZWNrYCBsaW5rIHRleHRzIG9mIHRoZSBuZXcgbm90ZSxcbiAqICAgLSB0aGUgcmV3cml0ZXMgbmVlZGVkIG9uIGV4aXN0aW5nIG5vdGVzIChpbiBwcmFjdGljZSBhbHdheXMgdGhlIGN1cnJlbnRcbiAqICAgICBub3RlIGl0c2VsZikuXG4gKi9cblxuaW1wb3J0IHsgZXh0cmFjdExpbmtUZXh0IH0gZnJvbSBcIi4vZGVja1wiO1xuXG4vKiogSW5wdXRzIGZvciBwbGFubmluZyBcdTIwMTQgcmVzb2x2ZWQgYnkgdGhlIGFkYXB0ZXIgaW4gbWFpbi50cyAqL1xuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVOZXh0SW5wdXQge1xuICAvKiogQmFzZW5hbWUgKHdpdGhvdXQgZXh0ZW5zaW9uKSBvZiB0aGUgY3VycmVudCBub3RlICovXG4gIGN1cnJlbnROYW1lOiBzdHJpbmc7XG4gIC8qKiBSYXcgYGRlY2tgIGxpbmsgdGV4dHMgb2YgdGhlIGN1cnJlbnQgbm90ZSAoZXh0cmFjdGVkLCB1cCB0byB0d28pICovXG4gIGN1cnJlbnRMaW5rczogc3RyaW5nW107XG4gIC8qKiBUcnVlIHdoZW4gdGhlIGN1cnJlbnQgbm90ZSBJUyB0aGUgZGVjaydzIG92ZXJ2aWV3IHBhZ2UgKGNoYWluIGluZGV4IDApICovXG4gIGlzT3ZlcnZpZXc6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBSYXcgbGluayB0ZXh0IHRoZSBvbGQgZmlyc3QgcGFnZSB1c2VzIHRvIGxpbmsgYmFjayB0byB0aGUgb3ZlcnZpZXcuXG4gICAqIE9ubHkgbWVhbmluZ2Z1bCBmb3Igb3ZlcnZpZXcgaW5zZXJ0aW9uICh0aGUgb3ZlcnZpZXcgaXRzZWxmIG9ubHkgbGlua3NcbiAgICogZm9yd2FyZCwgc28gaXRzIG93biBmcm9udG1hdHRlciBjb250YWlucyBubyBzZWxmLXJlZmVyZW5jZSkuXG4gICAqL1xuICBvdmVydmlld0JhY2tMaW5rPzogc3RyaW5nO1xuICAvKiogQmFzZW5hbWVzIG9mIGV2ZXJ5IG1hcmtkb3duIG5vdGUgaW4gdGhlIHZhdWx0IChjb2xsaXNpb24tZnJlZSBuYW1pbmcpICovXG4gIGV4aXN0aW5nTmFtZXM6IFNldDxzdHJpbmc+O1xufVxuXG4vKiogT25lIG5vdGUgd2hvc2UgYGRlY2tgIHByb3BlcnR5IG11c3QgYmUgcmV3cml0dGVuICovXG5leHBvcnQgaW50ZXJmYWNlIERlY2tSZXdyaXRlIHtcbiAgLyoqIEJhc2VuYW1lIG9mIHRoZSBub3RlIHRvIHJld3JpdGUgKi9cbiAgbmFtZTogc3RyaW5nO1xuICAvKiogVGhlIG5ldyByYXcgYGRlY2tgIGxpbmsgdGV4dHMgKHNlcmlhbGl6ZWQgYXMgYSBZQU1MIGxpc3QpICovXG4gIGRlY2s6IHN0cmluZ1tdO1xufVxuXG4vKiogVGhlIGZ1bGwgcGxhbiBmb3IgY3JlYXRpbmcgb25lIG5ldyBzbGlkZSAqL1xuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVOZXh0UmVzdWx0IHtcbiAgLyoqIEJhc2VuYW1lICh3aXRob3V0IGV4dGVuc2lvbikgb2YgdGhlIG5ldyBzbGlkZSBmaWxlICovXG4gIG5ld05hbWU6IHN0cmluZztcbiAgLyoqIFJhdyBgZGVja2AgbGluayB0ZXh0cyBmb3IgdGhlIG5ldyBub3RlJ3MgZnJvbnRtYXR0ZXIgKi9cbiAgbmV3RGVja0xpbmtzOiBzdHJpbmdbXTtcbiAgLyoqIFJld3JpdGVzIHRvIGFwcGx5IHRvIGV4aXN0aW5nIG5vdGVzIChpbiBwcmFjdGljZSBhbHdheXMgdGhlIGN1cnJlbnQgbm90ZSkgKi9cbiAgcmV3cml0ZXM6IERlY2tSZXdyaXRlW107XG59XG5cbi8qKlxuICogUGxhbiB0aGUgY3JlYXRpb24gb2YgYSBuZXcgc2xpZGUgYWZ0ZXIgdGhlIGN1cnJlbnQgbm90ZS5cbiAqXG4gKiBCZWhhdmlvcnM6XG4gKiAgIC0gTGFzdCBzbGlkZSAobm8gc2Vjb25kIGxpbmspOiBhcHBlbmQgYDxjdXJyZW50Pi1uZXh0YCBhcyB0aGUgbmV3IGxhc3RcbiAqICAgICBzbGlkZTsgdGhlIGN1cnJlbnQgbm90ZSBnYWlucyB0aGUgc2Vjb25kIGxpbmsuXG4gKiAgIC0gU2xpZGUgd2l0aCBhIHZhbGlkIG5leHQ6IGluc2VydCBgPGN1cnJlbnQ+LW5leHRgIGJldHdlZW4gdGhlbTsgdGhlIG5ld1xuICogICAgIG5vdGUgdGFrZXMgb3ZlciB0aGUgb2xkIG5leHQgbGluay5cbiAqICAgLSBTbGlkZSB3aG9zZSBzZWNvbmQgbGluayBpcyBicm9rZW4gKHBsYWluLCBub24tZXhpc3RpbmcgbmFtZSk6IGNyZWF0ZVxuICogICAgIGV4YWN0bHkgdGhlIGRlY2xhcmVkIG1pc3Npbmcgbm90ZSBhcyB0aGUgbmV3IGxhc3Qgc2xpZGUgXHUyMDE0IHRoZSBcdTI2QTAgd2FybmluZ1xuICogICAgIGRpc2FwcGVhcnMgYW5kIHRoZSBhdXRob3IncyBpbnRlbnQgaXMgaG9ub3VyZWQuIEEgYnJva2VuIGxpbmsgdGhhdCBpc1xuICogICAgIG5vdCBhIHBsYWluIGJhc2VuYW1lIChwYXRoLXF1YWxpZmllZCwgc2VsZi1yZWZlcmVuY2luZykgaXMgdHJlYXRlZCBhc1xuICogICAgIGludmFsaWQgYW5kIGRyb3BwZWQgKGFwcGVuZCBhIGA8Y3VycmVudD4tbmV4dGAgbGFzdCBzbGlkZSBpbnN0ZWFkKS5cbiAqICAgLSBPdmVydmlldyBwYWdlIChzaW5nbGUgbGluayA9IGZpcnN0IHBhZ2UpOiBpbnNlcnQgYSBuZXcgZmlyc3QgcGFnZTsgdGhlXG4gKiAgICAgb3ZlcnZpZXcncyBsaW5rIHBvaW50cyB0byBpdCBhbmQgdGhlIG9sZCBmaXJzdCBwYWdlIGlzIHB1c2hlZCBiYWNrLlxuICpcbiAqIFJldHVybnMgbnVsbCB3aGVuIHRoZSBub3RlIGhhcyBubyB1c2FibGUgYGRlY2tgIGxpbmtzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGxhbkNyZWF0ZU5leHQoaW5wdXQ6IENyZWF0ZU5leHRJbnB1dCk6IENyZWF0ZU5leHRSZXN1bHQgfCBudWxsIHtcbiAgY29uc3QgeyBjdXJyZW50TmFtZSwgY3VycmVudExpbmtzLCBpc092ZXJ2aWV3IH0gPSBpbnB1dDtcbiAgaWYgKGN1cnJlbnRMaW5rcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBPdmVydmlldyBwYWdlOiBpbnNlcnQgYSBuZXcgZmlyc3QgcGFnZSBhZnRlciBpdCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgaWYgKGlzT3ZlcnZpZXcpIHtcbiAgICBjb25zdCBvbGRGaXJzdCA9IGN1cnJlbnRMaW5rc1swXTtcbiAgICBpZiAoIW9sZEZpcnN0KSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBuZXdOYW1lID0gdW5pcXVlTmFtZShgJHtjdXJyZW50TmFtZX0tbmV4dGAsIGlucHV0LmV4aXN0aW5nTmFtZXMpO1xuICAgIGNvbnN0IGJhY2sgPSBpbnB1dC5vdmVydmlld0JhY2tMaW5rID8/IGBbWyR7Y3VycmVudE5hbWV9XV1gO1xuICAgIHJldHVybiB7XG4gICAgICBuZXdOYW1lLFxuICAgICAgbmV3RGVja0xpbmtzOiBbYmFjaywgb2xkRmlyc3RdLFxuICAgICAgcmV3cml0ZXM6IFt7IG5hbWU6IGN1cnJlbnROYW1lLCBkZWNrOiBbYFtbJHtuZXdOYW1lfV1dYF0gfV0sXG4gICAgfTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTbGlkZTogZmlyc3QgbGluayBpcyB0aGUgb3ZlcnZpZXcgcGFnZSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3Qgb3ZlcnZpZXdMaW5rID0gY3VycmVudExpbmtzWzBdO1xuICBpZiAoIW92ZXJ2aWV3TGluaykgcmV0dXJuIG51bGw7XG4gIGNvbnN0IG5leHRMaW5rID0gY3VycmVudExpbmtzWzFdO1xuXG4gIGlmIChuZXh0TGluaykge1xuICAgIGNvbnN0IG5leHROYW1lID0gZXh0cmFjdExpbmtUZXh0KG5leHRMaW5rKTtcbiAgICBpZiAobmV4dE5hbWUgJiYgaXNQbGFpbk5hbWUobmV4dE5hbWUpICYmIG5leHROYW1lICE9PSBjdXJyZW50TmFtZSkge1xuICAgICAgaWYgKCFpbnB1dC5leGlzdGluZ05hbWVzLmhhcyhuZXh0TmFtZSkpIHtcbiAgICAgICAgLy8gVGhlIGRlY2xhcmVkIG5leHQgbm90ZSBkb2VzIG5vdCBleGlzdCB5ZXQgXHUyMTkyIGNyZWF0ZSBleGFjdGx5IHRoYXRcbiAgICAgICAgLy8gbm90ZSAoZml4ZXMgdGhlIGJyb2tlbi1saW5rIHdhcm5pbmcsIGhvbm91cnMgdGhlIGF1dGhvcidzIGludGVudCkuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbmV3TmFtZTogbmV4dE5hbWUsXG4gICAgICAgICAgbmV3RGVja0xpbmtzOiBbb3ZlcnZpZXdMaW5rXSxcbiAgICAgICAgICByZXdyaXRlczogW10sXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICAvLyBBIHZhbGlkIG5leHQgbm90ZSBleGlzdHMgXHUyMTkyIGluc2VydCBiZXR3ZWVuIGl0IGFuZCB0aGUgY3VycmVudCBub3RlLlxuICAgICAgY29uc3QgbmV3TmFtZSA9IHVuaXF1ZU5hbWUoYCR7Y3VycmVudE5hbWV9LW5leHRgLCBpbnB1dC5leGlzdGluZ05hbWVzKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG5ld05hbWUsXG4gICAgICAgIG5ld0RlY2tMaW5rczogW292ZXJ2aWV3TGluaywgbmV4dExpbmtdLFxuICAgICAgICByZXdyaXRlczogW3sgbmFtZTogY3VycmVudE5hbWUsIGRlY2s6IFtvdmVydmlld0xpbmssIGBbWyR7bmV3TmFtZX1dXWBdIH1dLFxuICAgICAgfTtcbiAgICB9XG4gICAgLy8gSW52YWxpZCAocGF0aC1xdWFsaWZpZWQgLyBzZWxmLXJlZmVyZW5jaW5nKSBuZXh0IGxpbmsgXHUyMTkyIGRyb3AgaXQgYW5kXG4gICAgLy8gYXBwZW5kIGEgbmV3IGxhc3Qgc2xpZGUgKGZhbGwgdGhyb3VnaCB0byB0aGUgbm8tbmV4dCBicmFuY2gpLlxuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIExhc3Qgc2xpZGUgXHUyMTkyIGFwcGVuZCBhIG5ldyBsYXN0IHNsaWRlIGFmdGVyIGl0IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCBuZXdOYW1lID0gdW5pcXVlTmFtZShgJHtjdXJyZW50TmFtZX0tbmV4dGAsIGlucHV0LmV4aXN0aW5nTmFtZXMpO1xuICByZXR1cm4ge1xuICAgIG5ld05hbWUsXG4gICAgbmV3RGVja0xpbmtzOiBbb3ZlcnZpZXdMaW5rXSxcbiAgICByZXdyaXRlczogW3sgbmFtZTogY3VycmVudE5hbWUsIGRlY2s6IFtvdmVydmlld0xpbmssIGBbWyR7bmV3TmFtZX1dXWBdIH1dLFxuICB9O1xufVxuXG4vKiogQSBuYW1lIHVzYWJsZSBhcyBhIHZhdWx0IG5vdGUgbmFtZTogbm8gcGF0aCBzZXBhcmF0b3JzLCBub24tZW1wdHkgKi9cbmZ1bmN0aW9uIGlzUGxhaW5OYW1lKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gbmFtZS5sZW5ndGggPiAwICYmICFuYW1lLmluY2x1ZGVzKFwiL1wiKSAmJiAhbmFtZS5pbmNsdWRlcyhcIlxcXFxcIik7XG59XG5cbi8qKiBGaXJzdCBmcmVlIG5hbWUgaW4gdGhlIGZhbWlseSBgYmFzZWAsIGBiYXNlLTJgLCBgYmFzZS0zYCwgXHUyMDI2ICovXG5mdW5jdGlvbiB1bmlxdWVOYW1lKGJhc2U6IHN0cmluZywgZXhpc3Rpbmc6IFNldDxzdHJpbmc+KTogc3RyaW5nIHtcbiAgaWYgKCFleGlzdGluZy5oYXMoYmFzZSkpIHJldHVybiBiYXNlO1xuICBmb3IgKGxldCBpID0gMjsgOyBpKyspIHtcbiAgICBjb25zdCBjYW5kaWRhdGUgPSBgJHtiYXNlfS0ke2l9YDtcbiAgICBpZiAoIWV4aXN0aW5nLmhhcyhjYW5kaWRhdGUpKSByZXR1cm4gY2FuZGlkYXRlO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgTmF0aXZlU2xpZGVzUGx1Z2luIGZyb20gXCIuLi9tYWluXCI7XG5pbXBvcnQgeyBTTElERVNfVEhFTUVTIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuLyoqIFNldHRpbmdzIHRhYjogdG9nZ2xlcyB0aGUgbmF2IGJ1dHRvbnMsIHBhZ2UgbnVtYmVyLCBhdXRvLWVudGVyIGFuZCBiYXIgdmlzaWJpbGl0eS4gKi9cbmV4cG9ydCBjbGFzcyBOYXRpdmVTbGlkZXNTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBOYXRpdmVTbGlkZXNQbHVnaW4pIHtcbiAgICBzdXBlcihwbHVnaW4uYXBwLCBwbHVnaW4pO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiTmF0aXZlIFNsaWRlcyBcdTAwQjcgU2V0dGluZ3NcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJTdHlsZSB0ZW1wbGF0ZVwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiQnVpbHQtaW4gbG9vayBmb3IgdGhlIFNsaWRlcyBjYXJkIGFuZCBzbGlkZXMgYmFyIChib3JkZXIsIGJhY2tncm91bmQsIHNoYWRvdywgYmFyIHN0eWxpbmcpLiBFdmVyeSB0ZW1wbGF0ZSBhZGFwdHMgdG8gbGlnaHQgYW5kIGRhcmsgdGhlbWVzLlwiLFxuICAgICAgKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IHQgb2YgU0xJREVTX1RIRU1FUykgZHJvcGRvd24uYWRkT3B0aW9uKHQuaWQsIHQubGFiZWwpO1xuICAgICAgICBkcm9wZG93bi5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zbGlkZXNUaGVtZSkub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2xpZGVzVGhlbWUgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBzbGlkZXMgYmFyXCIpXG4gICAgICAuc2V0RGVzYyhcIk1hc3RlciB0b2dnbGUgZm9yIHRoZSBlbnRpcmUgc2xpZGVzIGJhciBhdCB0aGUgYm90dG9tIG9mIHRoZSB3aW5kb3dcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dTbGlkZXNCYXIpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dTbGlkZXNCYXIgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJTaG93IFByZXZpb3VzL05leHQgYnV0dG9uc1wiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiU2hvdyBcdTI1QzAgXHUyNUI2IGJ1dHRvbnMgb24gdGhlIGxlZnQgb2YgdGhlIHNsaWRlcyBiYXIgd2hlbiB0aGUgbm90ZSBiZWxvbmdzIHRvIGEgZGVjayAoaGFzIGEgYGRlY2tgIHByb3BlcnR5KVwiLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd05hdkJ1dHRvbnMpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dOYXZCdXR0b25zID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiUGFnZSBudW1iZXIgc3R5bGVcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICAnU2hvd24gYXQgdGhlIGJvdHRvbS1yaWdodC4gXCJOIC8gVG90YWxcIjogb3ZlcnZpZXcgPSBwYWdlIDAsIGNvbnRlbnQgZnJvbSAxLCB0b3RhbCBleGNsdWRlcyBvdmVydmlldy4gXCJOXCI6IGp1c3QgdGhlIGN1cnJlbnQgcGFnZSBudW1iZXIuIFwiTm9uZVwiOiBoaWRkZW4uJyxcbiAgICAgIClcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+XG4gICAgICAgIGRyb3Bkb3duXG4gICAgICAgICAgLmFkZE9wdGlvbnMoe1xuICAgICAgICAgICAgZnJhY3Rpb246IFwiTiAvIFRvdGFsXCIsXG4gICAgICAgICAgICBjdXJyZW50OiBcIk5cIixcbiAgICAgICAgICAgIG5vbmU6IFwiTm9uZVwiLFxuICAgICAgICAgIH0pXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnBhZ2VOdW1iZXJTdHlsZSlcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYWdlTnVtYmVyU3R5bGUgPSB2YWx1ZSBhcyBcImZyYWN0aW9uXCIgfCBcImN1cnJlbnRcIiB8IFwibm9uZVwiO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlNob3cgcHJvZ3Jlc3MgYmFyXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJEaXNjcmV0ZSBjbGlja2FibGUgc2VnbWVudHMgYXQgdGhlIHRvcCBvZiB0aGUgc2xpZGVzIGJhciAtLSBvbmUgcGVyIHNsaWRlLCBjbGljayB0byBqdW1wXCIsXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93UHJvZ3Jlc3MpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dQcm9ncmVzcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMucGx1Z2luLnJlZnJlc2goKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkF1dG8tZW50ZXIgU2xpZGVzIG1vZGVcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIk9wZW4gZGVjayBub3RlcyBkaXJlY3RseSBpbiBTbGlkZXMgbW9kZS4gTGVhdmUgb2ZmIHRvIGVudGVyIG1hbnVhbGx5IHdpdGggdGhlIFRvZ2dsZSBTbGlkZXMgTW9kZSBjb21tYW5kIChNb2QrU2hpZnQrRSkgb3IgdGhlIHByZXZpb3VzL25leHQgcGFnZSBob3RrZXlzLlwiLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b0VudGVyU2xpZGVzKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvRW50ZXJTbGlkZXMgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJFc2NhcGUgZXhpdHMgU2xpZGVzIG1vZGVcIilcbiAgICAgIC5zZXREZXNjKFwiUHJlc3MgRXNjYXBlIHRvIGxlYXZlIFNsaWRlcyBtb2RlIGFuZCByZXR1cm4gdG8gdGhlIHByZXZpb3VzIHZpZXdcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVzY0V4aXRzU2xpZGVzKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lc2NFeGl0c1NsaWRlcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU2xpZGVzIHRpdGxlXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJGcm9udG1hdHRlciBwcm9wZXJ0eSB0byBzaG93IGFzIHRoZSBjYXJkIHRpdGxlIChIMSkuIExlYXZlIGVtcHR5IGZvciBub25lOyB0eXBlIGBmaWxlbmFtZWAgdG8gdXNlIHRoZSBmaWxlIG5hbWUuXCIsXG4gICAgICApXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcImUuZy4gdGl0bGVcIilcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2xpZGVzVGl0bGUpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2xpZGVzVGl0bGUgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4ucmVmcmVzaCgpO1xuICAgICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJCYXIgcHJvcGVydGllc1wiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiQ29tbWEtc2VwYXJhdGVkIGZyb250bWF0dGVyIHByb3BlcnR5IG5hbWVzIHRvIHNob3cgaW4gdGhlIHNsaWRlcyBiYXIgKGUuZy4gYHVuaXZlcnNpdHksIHNob3J0LXRpdGxlLCBkYXRlYCkuIEVhY2ggdmFsdWUgZmlsbHMgYW4gZXF1YWwtd2lkdGggY29sdW1uOyBkcmFnIGRpdmlkZXJzIHRvIHJlc2l6ZS4gTGVhdmUgZW1wdHkgdG8gc2hvdyBub3RoaW5nLlwiLFxuICAgICAgKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJlLmcuIHVuaXZlcnNpdHksIGRhdGVcIilcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFyUHJvcGVydGllcylcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYXJQcm9wZXJ0aWVzID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnJlZnJlc2goKTtcbiAgICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTmF2aWdhdGlvbiBob3RrZXlzXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJEZWZhdWx0OiBQcmV2aW91cyBQYWdlIE1vZCtTaGlmdCtcdTIxOTAsIE5leHQgUGFnZSBNb2QrU2hpZnQrXHUyMTkyLiBSZWJpbmQgdW5kZXIgU2V0dGluZ3MgXHUyMTkyIEhvdGtleXMuXCIsXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+XG4gICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiT3BlbiBIb3RrZXlzIFNldHRpbmdzXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIC8vIE9wZW4gT2JzaWRpYW4ncyBob3RrZXlzIHNldHRpbmdzIHBhZ2UgKGludGVybmFsIEFQSTsgaWdub3JlIGZhaWx1cmVzKVxuICAgICAgICAgIChcbiAgICAgICAgICAgIHRoaXMuYXBwIGFzIHVua25vd24gYXMgeyBzZXR0aW5nPzogeyBvcGVuVGFiQnlJZD86IChpZDogc3RyaW5nKSA9PiB2b2lkIH0gfVxuICAgICAgICAgICkuc2V0dGluZz8ub3BlblRhYkJ5SWQ/LihcImhvdGtleXNcIik7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgfVxufVxuIiwgIi8qKiBSZW1vdmUgYWxsIGNoaWxkcmVuIG9mIGFuIGVsZW1lbnQgKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhckNoaWxkcmVuKGVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICB3aGlsZSAoZWwuZmlyc3RDaGlsZCkgZWwucmVtb3ZlQ2hpbGQoZWwuZmlyc3RDaGlsZCk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUF3QkEsSUFBQUEsbUJBQTRDOzs7QUN2QnJDLFNBQVMsWUFBeUI7QUFDdkMsUUFBTSxNQUFNLFNBQVMsY0FBYyxLQUFLO0FBQ3hDLE1BQUksWUFBWTtBQUNoQixNQUFJLE1BQU0sVUFBVTtBQUNwQixNQUFJLFFBQVE7QUFJWixNQUFJLGlCQUFpQixhQUFhLENBQUMsTUFBTTtBQUN2QyxNQUFFLGVBQWU7QUFDakIsVUFBTSxTQUFTLFNBQVM7QUFDeEIsUUFBSSxrQkFBa0IsZUFBZSxXQUFXLFNBQVMsS0FBTSxRQUFPLEtBQUs7QUFBQSxFQUM3RSxDQUFDO0FBQ0QsU0FBTztBQUNUO0FBR08sU0FBUyxVQUNkLE9BQ0EsS0FDQSxTQUNBLFdBQVcsT0FDUTtBQUNuQixRQUFNLE1BQU0sU0FBUyxjQUFjLFFBQVE7QUFDM0MsTUFBSSxZQUFZO0FBQ2hCLE1BQUksY0FBYztBQUNsQixNQUFJLFFBQVE7QUFDWixNQUFJLFdBQVc7QUFDZixNQUFJLENBQUMsU0FBVSxLQUFJLGlCQUFpQixTQUFTLE9BQU87QUFD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O0FBQUEsSUFDQTtBQUFBLElBQ0EsT0FBTztBQUFBLElBQ1AsV0FBVyxNQUFNLFdBQVc7QUFBQSxNQUMxQjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNELFdBQVcsTUFBTSxNQUFNO0FBQUEsTUFDckI7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxJQUFJLE1BQU0sSUFBSTtBQUFBLE1BQ1o7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxVQUFVLE1BQU0sVUFBVTtBQUFBLE1BQ3hCO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNELFdBQVcsTUFBTSxLQUFLO0FBQUEsTUFDcEI7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxZQUFZLE1BQU0sT0FBTztBQUFBLE1BQ3ZCO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0YsQ0FBQztBQUFBLElBQ0QsWUFBWSxNQUFNLFlBQVk7QUFBQSxNQUM1QjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0YsQ0FBQztBQUFBLElBQ0QsT0FBTyxNQUFNLE9BQU8sQ0FBQyxhQUFhLGVBQWUsU0FBUyxpQkFBaUIsQ0FBQztBQUFBLElBQzVFLE9BQU8sTUFBTSxLQUFLLENBQUMsV0FBVyxlQUFlLGdCQUFnQixhQUFhLE9BQU8sQ0FBQztBQUFBLElBQ2xGLGdCQUFnQixNQUFNLElBQUksQ0FBQyxjQUFjLGlCQUFpQixvQkFBb0IsUUFBUSxDQUFDO0FBQUEsSUFDdkYsY0FBYztBQUFBLE1BQ1osZUFBZSxPQUFPLGFBQWE7QUFBQSxNQUNuQyx3QkFBd0IsT0FBTyxzQkFBc0I7QUFBQSxNQUNyRCxhQUFhLE9BQU8sV0FBVztBQUFBLE1BQy9CLG9CQUFvQixPQUFPLGtCQUFrQjtBQUFBLE1BQzdDLGVBQWUsT0FBTyxhQUFhO0FBQUEsTUFDbkMsZ0JBQWdCLE9BQU8sY0FBYztBQUFBLE1BQ3JDLGNBQWMsT0FBTyxZQUFZO0FBQUEsTUFDakMsbUJBQW1CLE9BQU8saUJBQWlCO0FBQUEsTUFDM0Msc0JBQXNCLE9BQU8sb0JBQW9CO0FBQUEsTUFDakQsZUFBZSxPQUFPLGFBQWE7QUFBQSxNQUNuQyxrQkFBa0IsT0FBTyxnQkFBZ0I7QUFBQSxNQUN6QyxpQkFBaUIsT0FBTyxlQUFlO0FBQUEsTUFDdkMsZUFBZSxPQUFPLGFBQWE7QUFBQSxNQUNuQyxrQkFBa0IsT0FBTyxnQkFBZ0I7QUFBQSxNQUN6QyxpQkFBaUIsT0FBTyxlQUFlO0FBQUEsTUFDdkMsd0JBQXdCLE9BQU8sc0JBQXNCO0FBQUEsTUFDckQsaUNBQWlDLE9BQU8sK0JBQStCO0FBQUEsTUFDdkUsa0JBQWtCLE9BQU8sZ0JBQWdCO0FBQUEsTUFDekMscUJBQXFCLE9BQU8sbUJBQW1CO0FBQUEsTUFDL0Msc0JBQXNCLE9BQU8sb0JBQW9CO0FBQUEsTUFDakQsb0JBQW9CLE9BQU8sa0JBQWtCO0FBQUEsSUFDL0M7QUFBQSxFQUNGO0FBQ0EsU0FBTztBQUNUO0FBVUEsZUFBc0IsZUFBZSxRQUEyQztBQUM5RSxRQUFNLE1BQU0sT0FBTztBQUNuQixNQUFJLENBQUMsU0FBUyxLQUFLLFVBQVUsU0FBUyxvQkFBb0IsR0FBRztBQUMzRCxRQUFJLHdCQUFPLHFFQUFxRTtBQUNoRjtBQUFBLEVBQ0Y7QUFDQSxRQUFNLE9BQU8sSUFBSSxVQUFVLG9CQUFvQiw2QkFBWTtBQUMzRCxNQUFJLENBQUMsTUFBTTtBQUNULFFBQUksd0JBQU8sd0NBQXdDO0FBQ25EO0FBQUEsRUFDRjtBQUNBLFFBQU0sWUFBWSxLQUFLLFFBQVE7QUFDL0IsUUFBTSxhQUFhLElBQUksVUFBVSxjQUFjO0FBQy9DLFFBQU0sT0FBTyxJQUFJLFVBQVUsUUFBUSxLQUFLO0FBR3hDLFFBQU0sT0FBZ0MsQ0FBQztBQUN2QyxhQUFXLFFBQVEsbUJBQW1CO0FBQ3BDLFVBQU0sSUFBSSxJQUFJLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxLQUFLO0FBQ3RELFFBQUksRUFBRSxhQUFhLHdCQUFRO0FBQzNCLFVBQU0sS0FBSyxTQUFTLEdBQUcsRUFBRSxPQUFPLEVBQUUsTUFBTSxTQUFTLEVBQUUsQ0FBQztBQUNwRCxVQUFNLE1BQU0sR0FBRztBQUNmLFVBQU0sSUFBSSxhQUFhLEdBQUc7QUFDMUIsUUFBSSxFQUFHLGFBQVksTUFBTSxDQUFDO0FBQUEsRUFDNUI7QUFHQSxNQUFJLFVBQTBDO0FBQzlDLFFBQU0sT0FBTyxJQUFJLE1BQU0sc0JBQXNCLG9CQUFvQjtBQUNqRSxNQUFJLGdCQUFnQix3QkFBTztBQUN6QixVQUFNLEtBQUssU0FBUyxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sVUFBVSxFQUFFLENBQUM7QUFDeEQsVUFBTSxNQUFNLEdBQUc7QUFDZixjQUFVLGFBQWEsR0FBRztBQUFBLEVBQzVCO0FBR0EsTUFBSSxZQUFZO0FBQ2QsVUFBTSxLQUFLLFNBQVMsWUFBWSxFQUFFLE9BQU8sRUFBRSxNQUFNLFVBQVUsRUFBRSxDQUFDO0FBQzlELFdBQU8sUUFBUTtBQUFBLEVBQ2pCO0FBQ0EsTUFBSSxDQUFDLFNBQVM7QUFDWixRQUFJLHdCQUFPLHNDQUFzQztBQUNqRDtBQUFBLEVBQ0Y7QUFFQSxRQUFNLFVBQVUsRUFBRSxNQUFNLFNBQVMsTUFBTSxVQUFVLE1BQU0sT0FBTyxFQUFFO0FBQ2hFLE1BQUk7QUFDRixVQUFNLElBQUksTUFBTSxRQUFRLE1BQU0sNkJBQTZCLEtBQUssVUFBVSxTQUFTLE1BQU0sQ0FBQyxDQUFDO0FBQzNGLFFBQUksd0JBQU8sK0RBQTBEO0FBQUEsRUFDdkUsU0FBUyxPQUFPO0FBQ2QsUUFBSSx3QkFBTyw4Q0FBOEMsT0FBTyxLQUFLLENBQUMsR0FBRztBQUFBLEVBQzNFO0FBQ0EsVUFBUSxJQUFJLGdDQUFnQyxLQUFLLFVBQVUsU0FBUyxNQUFNLENBQUMsQ0FBQztBQUM5RTtBQUdPLFNBQVMscUJBQXFCLFFBQWtDO0FBQ3JFLFNBQU8sV0FBVztBQUFBLElBQ2hCLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLFVBQVUsTUFBTSxLQUFLLGVBQWUsTUFBTTtBQUFBLEVBQzVDLENBQUM7QUFDSDs7O0FFamZPLElBQU0sZ0JBQXdDO0FBQUEsRUFDbkQsRUFBRSxJQUFJLE9BQU8sT0FBTyxnQkFBZ0I7QUFBQSxFQUNwQyxFQUFFLElBQUksVUFBVSxPQUFPLGlCQUFpQjtBQUFBLEVBQ3hDLEVBQUUsSUFBSSxTQUFTLE9BQU8sYUFBYTtBQUFBLEVBQ25DLEVBQUUsSUFBSSxXQUFXLE9BQU8sVUFBVTtBQUFBLEVBQ2xDLEVBQUUsSUFBSSxVQUFVLE9BQU8sY0FBYztBQUFBLEVBQ3JDLEVBQUUsSUFBSSxTQUFTLE9BQU8sZ0JBQWdCO0FBQ3hDO0FBNEJPLElBQU0sbUJBQXlDO0FBQUEsRUFDcEQsZ0JBQWdCO0FBQUEsRUFDaEIsaUJBQWlCO0FBQUEsRUFDakIsY0FBYztBQUFBLEVBQ2QsZUFBZTtBQUFBLEVBQ2YsV0FBVztBQUFBLEVBQ1gsaUJBQWlCO0FBQUEsRUFDakIsZ0JBQWdCO0FBQUEsRUFDaEIsYUFBYTtBQUFBLEVBQ2IsYUFBYTtBQUFBLEVBQ2IsZUFBZTtBQUFBLEVBQ2YsbUJBQW1CO0FBQ3JCO0FBR08sSUFBTSxXQUFXOzs7QUNuRGpCLFNBQVMsaUJBQWlCLFFBQWtDO0FBRWpFLFNBQU8sV0FBVztBQUFBLElBQ2hCLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLFVBQVUsWUFBWTtBQUNwQixhQUFPLFNBQVMsWUFBWSxDQUFDLE9BQU8sU0FBUztBQUM3QyxZQUFNLE9BQU8sYUFBYTtBQUMxQixhQUFPLFFBQVE7QUFBQSxJQUNqQjtBQUFBLEVBQ0YsQ0FBQztBQUVELFNBQU8sV0FBVztBQUFBLElBQ2hCLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLFNBQVMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxPQUFPLE9BQU8sR0FBRyxLQUFLLElBQUksQ0FBQztBQUFBLElBQ25ELGVBQWUsQ0FBQyxhQUFhO0FBQzNCLFVBQUksQ0FBQyxTQUFTLEtBQUssVUFBVSxTQUFTLG9CQUFvQixFQUFHLFFBQU87QUFDcEUsVUFBSSxDQUFDLFNBQVUsUUFBTyxjQUFjO0FBQ3BDLGFBQU87QUFBQSxJQUNUO0FBQUEsRUFDRixDQUFDO0FBRUQsU0FBTyxXQUFXO0FBQUEsSUFDaEIsSUFBSTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sU0FBUyxDQUFDLEVBQUUsV0FBVyxDQUFDLE9BQU8sT0FBTyxHQUFHLEtBQUssWUFBWSxDQUFDO0FBQUEsSUFDM0QsVUFBVSxNQUFNLE9BQU8sU0FBUyxNQUFNO0FBQUEsRUFDeEMsQ0FBQztBQUNELFNBQU8sV0FBVztBQUFBLElBQ2hCLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLFNBQVMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxPQUFPLE9BQU8sR0FBRyxLQUFLLGFBQWEsQ0FBQztBQUFBLElBQzVELFVBQVUsTUFBTSxPQUFPLFNBQVMsTUFBTTtBQUFBLEVBQ3hDLENBQUM7QUFFRCxTQUFPLFdBQVc7QUFBQSxJQUNoQixJQUFJO0FBQUEsSUFDSixNQUFNO0FBQUE7QUFBQSxJQUVOLGVBQWUsQ0FBQyxhQUFhO0FBQzNCLFlBQU0sT0FBTyxPQUFPLElBQUksVUFBVSxjQUFjO0FBQ2hELFVBQUksQ0FBQyxLQUFNLFFBQU87QUFDbEIsWUFBTSxPQUFPLE9BQU8sWUFBWSxlQUFlLElBQUk7QUFDbkQsVUFBSSxDQUFDLEtBQU0sUUFBTztBQUNsQixVQUFJLENBQUMsU0FBVSxNQUFLLE9BQU8sWUFBWSxrQkFBa0IsTUFBTSxJQUFJO0FBQ25FLGFBQU87QUFBQSxJQUNUO0FBQUEsRUFDRixDQUFDO0FBRUQsU0FBTyxXQUFXO0FBQUEsSUFDaEIsSUFBSTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sU0FBUyxDQUFDLEVBQUUsV0FBVyxDQUFDLE9BQU8sT0FBTyxHQUFHLEtBQUssSUFBSSxDQUFDO0FBQUEsSUFDbkQsZUFBZSxDQUFDLGFBQWE7QUFDM0IsWUFBTSxPQUFPLE9BQU8sSUFBSSxVQUFVLGNBQWM7QUFDaEQsVUFBSSxDQUFDLEtBQU0sUUFBTztBQUNsQixZQUFNLEtBQUssY0FBYyxPQUFPLEtBQUssSUFBSTtBQUN6QyxVQUFJLE9BQU8sUUFBUSxFQUFFLFlBQVksSUFBSyxRQUFPO0FBQzdDLFVBQUksQ0FBQyxTQUFVLFFBQU8sYUFBYTtBQUNuQyxhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0YsQ0FBQztBQUVELE1BQUksS0FBVSxzQkFBcUIsTUFBTTtBQUMzQzs7O0FDdkVBLElBQUFDLG1CQUFtQzs7O0FDVTVCLElBQU0saUJBQWlCO0FBeUJ2QixTQUFTLFlBQ2QsYUFDQSxVQUNpQjtBQUNqQixRQUFNLGVBQWUsU0FBUyxXQUFXO0FBQ3pDLE1BQUksYUFBYSxXQUFXLEVBQUcsUUFBTztBQUV0QyxNQUFJO0FBQ0osTUFBSTtBQUVKLE1BQUksYUFBYSxVQUFVLEdBQUc7QUFFNUIsZUFBVyxhQUFhLENBQUM7QUFDekIsZ0JBQVksU0FBUyxRQUFRLEVBQUUsQ0FBQztBQUFBLEVBQ2xDLE9BQU87QUFHTCxVQUFNLE9BQU8sYUFBYSxDQUFDO0FBQzNCLFVBQU0sWUFBWSxTQUFTLElBQUk7QUFDL0IsUUFBSSxVQUFVLENBQUMsTUFBTSxhQUFhO0FBQ2hDLGlCQUFXO0FBQ1gsa0JBQVk7QUFBQSxJQUNkLE9BQU87QUFDTCxpQkFBVztBQUNYLGtCQUFZLFVBQVUsQ0FBQztBQUFBLElBQ3pCO0FBQUEsRUFDRjtBQUNBLE1BQUksQ0FBQyxZQUFZLENBQUMsVUFBVyxRQUFPO0FBR3BDLFFBQU0sUUFBa0IsQ0FBQztBQUN6QixRQUFNLFVBQVUsb0JBQUksSUFBWTtBQUNoQyxRQUFNLE9BQU8sQ0FBQyxNQUFnQztBQUM1QyxRQUFJLEtBQUssQ0FBQyxRQUFRLElBQUksQ0FBQyxHQUFHO0FBQ3hCLGNBQVEsSUFBSSxDQUFDO0FBQ2IsWUFBTSxLQUFLLENBQUM7QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUNBLE9BQUssUUFBUTtBQUNiLE9BQUssU0FBUztBQUNkLE1BQUksTUFBTTtBQUNWLFNBQU8sS0FBSztBQUNWLFVBQU0sT0FBTyxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBQzVCLFFBQUksQ0FBQyxRQUFRLFFBQVEsSUFBSSxJQUFJLEVBQUc7QUFDaEMsU0FBSyxJQUFJO0FBQ1QsVUFBTTtBQUFBLEVBQ1I7QUFFQSxRQUFNLFFBQVEsTUFBTSxRQUFRLFdBQVc7QUFDdkMsTUFBSSxVQUFVLEdBQUksUUFBTztBQUN6QixTQUFPLEVBQUUsT0FBTyxNQUFNO0FBQ3hCO0FBT08sU0FBUyxhQUFhLE9BQWdCLE1BQWMsZ0JBQTBCO0FBQ25GLFFBQU0sT0FBa0IsQ0FBQztBQUN6QixRQUFNLFVBQVUsQ0FBQyxNQUFxQjtBQUNwQyxRQUFJLE1BQU0sUUFBUSxDQUFDLEdBQUc7QUFDcEIsaUJBQVcsUUFBUSxFQUFHLFNBQVEsSUFBSTtBQUFBLElBQ3BDLE9BQU87QUFDTCxXQUFLLEtBQUssQ0FBQztBQUFBLElBQ2I7QUFBQSxFQUNGO0FBQ0EsVUFBUSxLQUFLO0FBRWIsUUFBTSxNQUFnQixDQUFDO0FBQ3ZCLGFBQVcsUUFBUSxNQUFNO0FBQ3ZCLFVBQU0sT0FBTyxnQkFBZ0IsSUFBSTtBQUNqQyxRQUFJLEtBQU0sS0FBSSxLQUFLLElBQUk7QUFDdkIsUUFBSSxJQUFJLFVBQVUsSUFBSztBQUFBLEVBQ3pCO0FBQ0EsU0FBTztBQUNUO0FBT08sU0FBUyxnQkFBZ0IsT0FBZ0IsTUFBYyxnQkFBMEI7QUFDdEYsUUFBTSxPQUFrQixDQUFDO0FBQ3pCLFFBQU0sVUFBVSxDQUFDLE1BQXFCO0FBQ3BDLFFBQUksTUFBTSxRQUFRLENBQUMsR0FBRztBQUNwQixpQkFBVyxRQUFRLEVBQUcsU0FBUSxJQUFJO0FBQUEsSUFDcEMsT0FBTztBQUNMLFdBQUssS0FBSyxDQUFDO0FBQUEsSUFDYjtBQUFBLEVBQ0Y7QUFDQSxVQUFRLEtBQUs7QUFFYixRQUFNLE1BQWdCLENBQUM7QUFDdkIsYUFBVyxRQUFRLE1BQU07QUFDdkIsUUFBSSxPQUFPLFNBQVMsU0FBVTtBQUM5QixVQUFNLFVBQVUsS0FBSyxLQUFLO0FBQzFCLFFBQUksQ0FBQyxRQUFTO0FBQ2QsUUFBSSxLQUFLLE9BQU87QUFDaEIsUUFBSSxJQUFJLFVBQVUsSUFBSztBQUFBLEVBQ3pCO0FBQ0EsU0FBTztBQUNUO0FBVU8sU0FBUyxnQkFBZ0IsT0FBK0I7QUFDN0QsTUFBSSxPQUFPLFVBQVUsU0FBVSxRQUFPO0FBQ3RDLFFBQU0sVUFBVSxNQUFNLEtBQUs7QUFDM0IsTUFBSSxDQUFDLFFBQVMsUUFBTztBQUNyQixTQUFPLFFBQVEsUUFBUSxTQUFTLEVBQUUsRUFBRSxRQUFRLFNBQVMsRUFBRSxFQUFFLE1BQU0sR0FBRyxFQUFFLENBQUMsRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDLEVBQUUsS0FBSztBQUM1RjtBQUdPLFNBQVMsWUFBWSxPQUF3QjtBQUNsRCxNQUFJLFVBQVUsUUFBUSxVQUFVLE9BQVcsUUFBTztBQUNsRCxNQUFJLE9BQU8sVUFBVSxVQUFVO0FBQzdCLFFBQUk7QUFDRixhQUFPLEtBQUssVUFBVSxLQUFLO0FBQUEsSUFDN0IsUUFBUTtBQUNOLGFBQU8sT0FBTyxLQUFLO0FBQUEsSUFDckI7QUFBQSxFQUNGO0FBQ0EsU0FBTyxPQUFPLEtBQUs7QUFDckI7OztBQy9GTyxTQUFTLGVBQWUsT0FBaUQ7QUFDOUUsUUFBTSxFQUFFLGFBQWEsY0FBYyxXQUFXLElBQUk7QUFDbEQsTUFBSSxhQUFhLFdBQVcsRUFBRyxRQUFPO0FBR3RDLE1BQUksWUFBWTtBQUNkLFVBQU0sV0FBVyxhQUFhLENBQUM7QUFDL0IsUUFBSSxDQUFDLFNBQVUsUUFBTztBQUN0QixVQUFNQyxXQUFVLFdBQVcsR0FBRyxXQUFXLFNBQVMsTUFBTSxhQUFhO0FBQ3JFLFVBQU0sT0FBTyxNQUFNLG9CQUFvQixLQUFLLFdBQVc7QUFDdkQsV0FBTztBQUFBLE1BQ0wsU0FBQUE7QUFBQSxNQUNBLGNBQWMsQ0FBQyxNQUFNLFFBQVE7QUFBQSxNQUM3QixVQUFVLENBQUMsRUFBRSxNQUFNLGFBQWEsTUFBTSxDQUFDLEtBQUtBLFFBQU8sSUFBSSxFQUFFLENBQUM7QUFBQSxJQUM1RDtBQUFBLEVBQ0Y7QUFHQSxRQUFNLGVBQWUsYUFBYSxDQUFDO0FBQ25DLE1BQUksQ0FBQyxhQUFjLFFBQU87QUFDMUIsUUFBTSxXQUFXLGFBQWEsQ0FBQztBQUUvQixNQUFJLFVBQVU7QUFDWixVQUFNLFdBQVcsZ0JBQWdCLFFBQVE7QUFDekMsUUFBSSxZQUFZLFlBQVksUUFBUSxLQUFLLGFBQWEsYUFBYTtBQUNqRSxVQUFJLENBQUMsTUFBTSxjQUFjLElBQUksUUFBUSxHQUFHO0FBR3RDLGVBQU87QUFBQSxVQUNMLFNBQVM7QUFBQSxVQUNULGNBQWMsQ0FBQyxZQUFZO0FBQUEsVUFDM0IsVUFBVSxDQUFDO0FBQUEsUUFDYjtBQUFBLE1BQ0Y7QUFFQSxZQUFNQSxXQUFVLFdBQVcsR0FBRyxXQUFXLFNBQVMsTUFBTSxhQUFhO0FBQ3JFLGFBQU87QUFBQSxRQUNMLFNBQUFBO0FBQUEsUUFDQSxjQUFjLENBQUMsY0FBYyxRQUFRO0FBQUEsUUFDckMsVUFBVSxDQUFDLEVBQUUsTUFBTSxhQUFhLE1BQU0sQ0FBQyxjQUFjLEtBQUtBLFFBQU8sSUFBSSxFQUFFLENBQUM7QUFBQSxNQUMxRTtBQUFBLElBQ0Y7QUFBQSxFQUdGO0FBR0EsUUFBTSxVQUFVLFdBQVcsR0FBRyxXQUFXLFNBQVMsTUFBTSxhQUFhO0FBQ3JFLFNBQU87QUFBQSxJQUNMO0FBQUEsSUFDQSxjQUFjLENBQUMsWUFBWTtBQUFBLElBQzNCLFVBQVUsQ0FBQyxFQUFFLE1BQU0sYUFBYSxNQUFNLENBQUMsY0FBYyxLQUFLLE9BQU8sSUFBSSxFQUFFLENBQUM7QUFBQSxFQUMxRTtBQUNGO0FBR0EsU0FBUyxZQUFZLE1BQXVCO0FBQzFDLFNBQU8sS0FBSyxTQUFTLEtBQUssQ0FBQyxLQUFLLFNBQVMsR0FBRyxLQUFLLENBQUMsS0FBSyxTQUFTLElBQUk7QUFDdEU7QUFHQSxTQUFTLFdBQVcsTUFBYyxVQUErQjtBQUMvRCxNQUFJLENBQUMsU0FBUyxJQUFJLElBQUksRUFBRyxRQUFPO0FBQ2hDLFdBQVMsSUFBSSxLQUFLLEtBQUs7QUFDckIsVUFBTSxZQUFZLEdBQUcsSUFBSSxJQUFJLENBQUM7QUFDOUIsUUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLEVBQUcsUUFBTztBQUFBLEVBQ3ZDO0FBQ0Y7OztBRm5JTyxJQUFNLGNBQU4sTUFBa0I7QUFBQSxFQUN2QixZQUFvQixLQUFVO0FBQVY7QUFBQSxFQUFXO0FBQUE7QUFBQSxFQUcvQixRQUFRLE1BQThCO0FBQ3BDLFdBQU8sWUFBWSxLQUFLLE1BQU0sQ0FBQyxTQUFTLEtBQUssVUFBVSxJQUFJLENBQUM7QUFBQSxFQUM5RDtBQUFBO0FBQUEsRUFHUSxVQUFVLE1BQXdCO0FBQ3hDLFVBQU0sSUFBSSxLQUFLLElBQUksTUFBTSxzQkFBc0IsSUFBSTtBQUNuRCxRQUFJLEVBQUUsYUFBYSx3QkFBUSxRQUFPLENBQUM7QUFDbkMsVUFBTSxLQUFLLGNBQWMsS0FBSyxLQUFLLENBQUM7QUFDcEMsVUFBTSxRQUFRLEtBQUssYUFBYSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7QUFDakQsV0FBTyxNQUNKLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxjQUFjLHFCQUFxQixNQUFNLElBQUksQ0FBQyxFQUNyRSxPQUFPLENBQUMsTUFBa0IsQ0FBQyxDQUFDLENBQUMsRUFDN0IsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJO0FBQUEsRUFDdEI7QUFBQTtBQUFBLEVBR0EsT0FBTyxNQUF1QjtBQUM1QixVQUFNLEtBQUssY0FBYyxLQUFLLEtBQUssSUFBSTtBQUN2QyxVQUFNLFFBQVEsS0FBSyxhQUFhLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQztBQUNqRCxXQUFPLE1BQU0sT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLElBQUksY0FBYyxxQkFBcUIsTUFBTSxLQUFLLElBQUksQ0FBQztBQUFBLEVBQzdGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsZUFBZSxNQUFzQztBQUNuRCxVQUFNLEtBQUssY0FBYyxLQUFLLEtBQUssSUFBSTtBQUN2QyxVQUFNLE1BQU0sS0FBSyxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDO0FBQ2xELFFBQUksSUFBSSxXQUFXLEVBQUcsUUFBTztBQUU3QixVQUFNLE9BQU8sS0FBSyxRQUFRLElBQUk7QUFDOUIsVUFBTSxnQkFBZ0IsSUFBSSxJQUFJLEtBQUssSUFBSSxNQUFNLGlCQUFpQixFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDO0FBRXRGLFFBQUksTUFBTTtBQUdSLFVBQUk7QUFDSixVQUFJLEtBQUssVUFBVSxHQUFHO0FBQ3BCLGNBQU0sV0FBVyxLQUFLLE1BQU0sQ0FBQyxJQUFJLEtBQUssSUFBSSxNQUFNLHNCQUFzQixLQUFLLE1BQU0sQ0FBQyxDQUFDLElBQUk7QUFDdkYsWUFBSSxvQkFBb0Isd0JBQU87QUFDN0IsZ0JBQU0sS0FBSyxjQUFjLEtBQUssS0FBSyxRQUFRO0FBQzNDLDZCQUFtQixLQUFLLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSTtBQUFBLFFBQzdEO0FBQUEsTUFDRjtBQUNBLGFBQU8sZUFBSztBQUFBLFFBQ1YsYUFBYSxLQUFLO0FBQUEsUUFDbEIsY0FBYztBQUFBLFFBQ2QsWUFBWSxLQUFLLFVBQVU7QUFBQSxRQUMzQjtBQUFBLFFBQ0E7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBSUEsVUFBTSxlQUFlLElBQUksVUFBVSxJQUFJLGFBQWEsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUk7QUFDakUsUUFBSSxnQkFBZ0IsS0FBSyxJQUFJLGNBQWMscUJBQXFCLGNBQWMsS0FBSyxJQUFJLEdBQUc7QUFDeEYsYUFBTyxlQUFLO0FBQUEsUUFDVixhQUFhLEtBQUs7QUFBQSxRQUNsQixjQUFjO0FBQUEsUUFDZCxZQUFZO0FBQUEsUUFDWjtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUEsRUFHQSxNQUFNLGtCQUFrQixNQUFhLE1BQXVDO0FBQzFFLFVBQU0sTUFBTSxLQUFLLFFBQVEsT0FBTyxLQUFLLE9BQU8sT0FBTyxNQUFNO0FBQ3pELFVBQU0sVUFBVSxHQUFHLEdBQUcsR0FBRyxLQUFLLE9BQU87QUFDckMsVUFBTSxjQUFjLEtBQUssYUFBYSxJQUFJLENBQUMsU0FBUyxLQUFLLFVBQVUsSUFBSSxDQUFDLEVBQUUsS0FBSyxJQUFJO0FBQ25GLFVBQU0sVUFBVTtBQUFBLFNBQWUsV0FBVztBQUFBO0FBQUE7QUFFMUMsUUFBSTtBQUNKLFFBQUk7QUFDRixnQkFBVSxNQUFNLEtBQUssSUFBSSxNQUFNLE9BQU8sU0FBUyxPQUFPO0FBQUEsSUFDeEQsU0FBUyxPQUFPO0FBQ2QsVUFBSSx3QkFBTyxvQ0FBb0MsS0FBSyxPQUFPLFNBQVMsT0FBTyxLQUFLLENBQUMsR0FBRztBQUNwRjtBQUFBLElBQ0Y7QUFHQSxlQUFXLFdBQVcsS0FBSyxVQUFVO0FBQ25DLFVBQUksUUFBUSxTQUFTLEtBQUssU0FBVTtBQUNwQyxZQUFNLEtBQUssSUFBSSxZQUFZLG1CQUFtQixNQUFNLENBQUMsT0FBTztBQUMxRCxXQUFHLFFBQVEsSUFBSSxRQUFRO0FBQUEsTUFDekIsQ0FBQztBQUFBLElBQ0g7QUFHQSxVQUFNLE9BQU8sS0FBSyxJQUFJLFVBQVUsUUFBUSxLQUFLO0FBQzdDLFVBQU0sS0FBSyxTQUFTLFNBQVMsRUFBRSxPQUFPLEVBQUUsTUFBTSxTQUFTLEVBQUUsQ0FBQztBQUFBLEVBQzVEO0FBQ0Y7OztBRy9HQSxJQUFBQyxtQkFBMEM7QUFLbkMsSUFBTSx5QkFBTixjQUFxQyxrQ0FBaUI7QUFBQSxFQUMzRCxZQUFvQixRQUE0QjtBQUM5QyxVQUFNLE9BQU8sS0FBSyxNQUFNO0FBRE47QUFBQSxFQUVwQjtBQUFBLEVBRUEsVUFBZ0I7QUFDZCxVQUFNLEVBQUUsWUFBWSxJQUFJO0FBQ3hCLGdCQUFZLE1BQU07QUFDbEIsZ0JBQVksU0FBUyxNQUFNLEVBQUUsTUFBTSw4QkFBMkIsQ0FBQztBQUUvRCxRQUFJLHlCQUFRLFdBQVcsRUFDcEIsUUFBUSxnQkFBZ0IsRUFDeEI7QUFBQSxNQUNDO0FBQUEsSUFDRixFQUNDLFlBQVksQ0FBQyxhQUFhO0FBQ3pCLGlCQUFXLEtBQUssY0FBZSxVQUFTLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSztBQUMvRCxlQUFTLFNBQVMsS0FBSyxPQUFPLFNBQVMsV0FBVyxFQUFFLFNBQVMsT0FBTyxVQUFVO0FBQzVFLGFBQUssT0FBTyxTQUFTLGNBQWM7QUFDbkMsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUMvQixhQUFLLE9BQU8sUUFBUTtBQUFBLE1BQ3RCLENBQUM7QUFBQSxJQUNILENBQUM7QUFFSCxRQUFJLHlCQUFRLFdBQVcsRUFDcEIsUUFBUSxpQkFBaUIsRUFDekIsUUFBUSxxRUFBcUUsRUFDN0U7QUFBQSxNQUFVLENBQUMsV0FDVixPQUFPLFNBQVMsS0FBSyxPQUFPLFNBQVMsYUFBYSxFQUFFLFNBQVMsT0FBTyxVQUFVO0FBQzVFLGFBQUssT0FBTyxTQUFTLGdCQUFnQjtBQUNyQyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQy9CLGFBQUssT0FBTyxRQUFRO0FBQUEsTUFDdEIsQ0FBQztBQUFBLElBQ0g7QUFFRixRQUFJLHlCQUFRLFdBQVcsRUFDcEIsUUFBUSw0QkFBNEIsRUFDcEM7QUFBQSxNQUNDO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFBVSxDQUFDLFdBQ1YsT0FBTyxTQUFTLEtBQUssT0FBTyxTQUFTLGNBQWMsRUFBRSxTQUFTLE9BQU8sVUFBVTtBQUM3RSxhQUFLLE9BQU8sU0FBUyxpQkFBaUI7QUFDdEMsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUMvQixhQUFLLE9BQU8sUUFBUTtBQUFBLE1BQ3RCLENBQUM7QUFBQSxJQUNIO0FBRUYsUUFBSSx5QkFBUSxXQUFXLEVBQ3BCLFFBQVEsbUJBQW1CLEVBQzNCO0FBQUEsTUFDQztBQUFBLElBQ0YsRUFDQztBQUFBLE1BQVksQ0FBQyxhQUNaLFNBQ0csV0FBVztBQUFBLFFBQ1YsVUFBVTtBQUFBLFFBQ1YsU0FBUztBQUFBLFFBQ1QsTUFBTTtBQUFBLE1BQ1IsQ0FBQyxFQUNBLFNBQVMsS0FBSyxPQUFPLFNBQVMsZUFBZSxFQUM3QyxTQUFTLE9BQU8sVUFBVTtBQUN6QixhQUFLLE9BQU8sU0FBUyxrQkFBa0I7QUFDdkMsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUMvQixhQUFLLE9BQU8sUUFBUTtBQUFBLE1BQ3RCLENBQUM7QUFBQSxJQUNMO0FBRUYsUUFBSSx5QkFBUSxXQUFXLEVBQ3BCLFFBQVEsbUJBQW1CLEVBQzNCO0FBQUEsTUFDQztBQUFBLElBQ0YsRUFDQztBQUFBLE1BQVUsQ0FBQyxXQUNWLE9BQU8sU0FBUyxLQUFLLE9BQU8sU0FBUyxZQUFZLEVBQUUsU0FBUyxPQUFPLFVBQVU7QUFDM0UsYUFBSyxPQUFPLFNBQVMsZUFBZTtBQUNwQyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQy9CLGFBQUssT0FBTyxRQUFRO0FBQUEsTUFDdEIsQ0FBQztBQUFBLElBQ0g7QUFFRixRQUFJLHlCQUFRLFdBQVcsRUFDcEIsUUFBUSx3QkFBd0IsRUFDaEM7QUFBQSxNQUNDO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFBVSxDQUFDLFdBQ1YsT0FBTyxTQUFTLEtBQUssT0FBTyxTQUFTLGVBQWUsRUFBRSxTQUFTLE9BQU8sVUFBVTtBQUM5RSxhQUFLLE9BQU8sU0FBUyxrQkFBa0I7QUFDdkMsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUMvQixhQUFLLE9BQU8sUUFBUTtBQUFBLE1BQ3RCLENBQUM7QUFBQSxJQUNIO0FBRUYsUUFBSSx5QkFBUSxXQUFXLEVBQ3BCLFFBQVEsMEJBQTBCLEVBQ2xDLFFBQVEsbUVBQW1FLEVBQzNFO0FBQUEsTUFBVSxDQUFDLFdBQ1YsT0FBTyxTQUFTLEtBQUssT0FBTyxTQUFTLGNBQWMsRUFBRSxTQUFTLE9BQU8sVUFBVTtBQUM3RSxhQUFLLE9BQU8sU0FBUyxpQkFBaUI7QUFDdEMsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQ2pDLENBQUM7QUFBQSxJQUNIO0FBRUYsUUFBSSx5QkFBUSxXQUFXLEVBQ3BCLFFBQVEsY0FBYyxFQUN0QjtBQUFBLE1BQ0M7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUFRLENBQUMsU0FDUixLQUNHLGVBQWUsWUFBWSxFQUMzQixTQUFTLEtBQUssT0FBTyxTQUFTLFdBQVcsRUFDekMsU0FBUyxPQUFPLFVBQVU7QUFDekIsYUFBSyxPQUFPLFNBQVMsY0FBYztBQUNuQyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQy9CLGFBQUssT0FBTyxRQUFRO0FBQUEsTUFDdEIsQ0FBQztBQUFBLElBQ0w7QUFFRixRQUFJLHlCQUFRLFdBQVcsRUFDcEIsUUFBUSxnQkFBZ0IsRUFDeEI7QUFBQSxNQUNDO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFBUSxDQUFDLFNBQ1IsS0FDRyxlQUFlLHVCQUF1QixFQUN0QyxTQUFTLEtBQUssT0FBTyxTQUFTLGFBQWEsRUFDM0MsU0FBUyxPQUFPLFVBQVU7QUFDekIsYUFBSyxPQUFPLFNBQVMsZ0JBQWdCO0FBQ3JDLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFDL0IsYUFBSyxPQUFPLFFBQVE7QUFBQSxNQUN0QixDQUFDO0FBQUEsSUFDTDtBQUVGLFFBQUkseUJBQVEsV0FBVyxFQUNwQixRQUFRLG9CQUFvQixFQUM1QjtBQUFBLE1BQ0M7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUFVLENBQUMsV0FDVixPQUFPLGNBQWMsdUJBQXVCLEVBQUUsUUFBUSxNQUFNO0FBRTFELFFBQ0UsS0FBSyxJQUNMLFNBQVMsY0FBYyxTQUFTO0FBQUEsTUFDcEMsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNKO0FBQ0Y7OztBQzFKTyxTQUFTLGNBQWMsSUFBdUI7QUFDbkQsU0FBTyxHQUFHLFdBQVksSUFBRyxZQUFZLEdBQUcsVUFBVTtBQUNwRDs7O0FWK0JBLElBQXFCLHFCQUFyQixjQUFnRCx3QkFBTztBQUFBLEVBQXZEO0FBQUE7QUFFRTtBQUFBLGVBQTBCO0FBSTFCO0FBQUEsb0JBQWlDLEVBQUUsR0FBRyxpQkFBaUI7QUFHdkQ7QUFBQSxTQUFRLGFBQWE7QUFFckI7QUFBQSxTQUFRLFdBQWlDO0FBRXpDO0FBQUEsU0FBUSxhQUFhO0FBRXJCO0FBQUEsU0FBUSxrQkFBa0I7QUFFMUI7QUFBQSxTQUFRLFVBQVU7QUFFbEI7QUFBQSxTQUFRLGVBQWU7QUFFdkI7QUFBQSx5QkFBZ0I7QUFBQTtBQUFBLEVBRWhCLE1BQU0sU0FBd0I7QUFDNUIsVUFBTSxLQUFLLGFBQWE7QUFDeEIsU0FBSyxjQUFjLElBQUksWUFBWSxLQUFLLEdBQUc7QUFDM0MsU0FBSyxjQUFjLElBQUksdUJBQXVCLElBQUksQ0FBQztBQUduRCxTQUFLO0FBQUEsTUFDSCxLQUFLLElBQUksVUFBVSxHQUFHLGFBQWEsTUFBTTtBQUN2QyxhQUFLLHFCQUFxQjtBQUMxQixhQUFLLFFBQVE7QUFBQSxNQUNmLENBQUM7QUFBQSxJQUNIO0FBQ0EsU0FBSyxjQUFjLEtBQUssSUFBSSxVQUFVLEdBQUcsc0JBQXNCLE1BQU0sS0FBSyxRQUFRLENBQUMsQ0FBQztBQUNwRixTQUFLLGNBQWMsS0FBSyxJQUFJLFVBQVUsR0FBRyxpQkFBaUIsTUFBTSxLQUFLLFFBQVEsQ0FBQyxDQUFDO0FBRS9FLFNBQUs7QUFBQSxNQUNILEtBQUssSUFBSSxjQUFjLEdBQUcsV0FBVyxDQUFDLFNBQWdCO0FBQ3BELFlBQUksU0FBUyxLQUFLLElBQUksVUFBVSxjQUFjLEVBQUcsTUFBSyxRQUFRO0FBQUEsTUFDaEUsQ0FBQztBQUFBLElBQ0g7QUFHQSxTQUFLO0FBQUEsTUFDSCxPQUFPLFlBQVksTUFBTTtBQUN2QixjQUFNLE9BQU8sS0FBSyxJQUFJLFVBQVUsY0FBYztBQUM5QyxjQUFNLE1BQU0sT0FBTyxHQUFHLEtBQUssSUFBSSxJQUFJLFlBQVksS0FBSyxHQUFHLENBQUMsS0FBSztBQUM3RCxZQUFJLFFBQVEsS0FBSyxTQUFTO0FBQ3hCLGVBQUssVUFBVTtBQUNmLGVBQUssUUFBUTtBQUFBLFFBQ2Y7QUFBQSxNQUNGLEdBQUcsR0FBRztBQUFBLElBQ1I7QUFHQSxxQkFBaUIsSUFBSTtBQU9yQixTQUFLO0FBQUEsTUFDSDtBQUFBLE1BQ0E7QUFBQSxNQUNBLENBQUMsUUFBUTtBQUNQLFlBQUksQ0FBQyxTQUFTLEtBQUssVUFBVSxTQUFTLG9CQUFvQixFQUFHO0FBQzdELGNBQU0sT0FBTyxLQUFLLElBQUksVUFBVSxvQkFBb0IsNkJBQVk7QUFDaEUsWUFBSSxDQUFDLEtBQU07QUFDWCxjQUFNLEtBQUssSUFBSTtBQUNmLFlBQUksY0FBYyxlQUFlLEtBQUssVUFBVSxTQUFTLEVBQUUsR0FBRztBQUM1RCxjQUFJLEdBQUcsY0FBYyxFQUFHLElBQUcsWUFBWTtBQUN2QyxjQUFJLEdBQUcsZUFBZSxFQUFHLElBQUcsYUFBYTtBQUFBLFFBQzNDO0FBQUEsTUFDRjtBQUFBLE1BQ0EsRUFBRSxTQUFTLEtBQUs7QUFBQSxJQUNsQjtBQUdBLFNBQUssaUJBQWlCLFVBQVUsV0FBVyxDQUFDLFFBQXVCO0FBQ2pFLFVBQUksSUFBSSxRQUFRLFlBQVksS0FBSyxjQUFjLEtBQUssU0FBUyxnQkFBZ0I7QUFDM0UsYUFBSyxXQUFXO0FBQUEsTUFDbEI7QUFBQSxJQUNGLENBQUM7QUFHRCxTQUFLLE1BQU0sVUFBVTtBQUNyQixhQUFTLEtBQUssWUFBWSxLQUFLLEdBQUc7QUFDbEMsU0FBSyxRQUFRO0FBQUEsRUFDZjtBQUFBLEVBRUEsV0FBaUI7QUFDZixTQUFLLEtBQUssT0FBTztBQUNqQixTQUFLLE1BQU07QUFDWCxhQUFTLEtBQUssVUFBVSxPQUFPLG9CQUFvQjtBQUNuRCxhQUFTLEtBQUssVUFBVSxPQUFPLDhCQUE4QjtBQUM3RCxTQUFLLG1CQUFtQjtBQUFBLEVBQzFCO0FBQUE7QUFBQSxFQUlBLE1BQU0sZUFBOEI7QUFDbEMsU0FBSyxXQUFXLE9BQU8sT0FBTyxDQUFDLEdBQUcsa0JBQWtCLE1BQU0sS0FBSyxTQUFTLENBQUM7QUFBQSxFQUMzRTtBQUFBLEVBRUEsTUFBTSxlQUE4QjtBQUNsQyxVQUFNLEtBQUssU0FBUyxLQUFLLFFBQVE7QUFBQSxFQUNuQztBQUFBO0FBQUE7QUFBQSxFQUtRLFdBQVcsTUFBNkI7QUFDOUMsUUFBSSxDQUFDLEtBQU0sUUFBTztBQUNsQixVQUFNLEtBQUssY0FBYyxLQUFLLEtBQUssSUFBSTtBQUN2QyxXQUFPLE9BQU8sUUFBUSxZQUFZO0FBQUEsRUFDcEM7QUFBQTtBQUFBLEVBR1EscUJBQTJCO0FBQ2pDLGVBQVcsT0FBTyxNQUFNLEtBQUssU0FBUyxLQUFLLFNBQVMsR0FBRztBQUNyRCxVQUFJLElBQUksV0FBVyxzQkFBc0IsRUFBRyxVQUFTLEtBQUssVUFBVSxPQUFPLEdBQUc7QUFBQSxJQUNoRjtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPUSxrQkFBd0I7QUFDOUIsVUFBTSxLQUFLLGNBQWMsS0FBSyxDQUFDLE1BQU0sRUFBRSxPQUFPLEtBQUssU0FBUyxXQUFXLElBQ25FLEtBQUssU0FBUyxjQUNkLGlCQUFpQjtBQUNyQixVQUFNLE1BQU0sdUJBQXVCLEVBQUU7QUFDckMsZUFBVyxLQUFLLE1BQU0sS0FBSyxTQUFTLEtBQUssU0FBUyxHQUFHO0FBQ25ELFVBQUksRUFBRSxXQUFXLHNCQUFzQixLQUFLLE1BQU0sSUFBSyxVQUFTLEtBQUssVUFBVSxPQUFPLENBQUM7QUFBQSxJQUN6RjtBQUNBLGFBQVMsS0FBSyxVQUFVLElBQUksR0FBRztBQUFBLEVBQ2pDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsZ0JBQXNCO0FBQ3BCLFNBQUssZ0JBQWdCLENBQUMsS0FBSztBQUMzQixRQUFJLEtBQUssZUFBZTtBQUN0QixZQUFNLFNBQVMsU0FBUztBQUN4QixVQUFJLGtCQUFrQixlQUFlLFdBQVcsU0FBUyxLQUFNLFFBQU8sS0FBSztBQUFBLElBQzdFO0FBQ0EsU0FBSyxRQUFRO0FBQUEsRUFDZjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9RLGlCQUFpQixRQUF1QjtBQUM5QyxhQUFTLEtBQUssVUFBVSxPQUFPLGdDQUFnQyxVQUFVLEtBQUssYUFBYTtBQUFBLEVBQzdGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVVEsa0JBQWtCLFFBQXVCO0FBQy9DLFVBQU0sT0FBTyxLQUFLLElBQUksVUFBVSxvQkFBb0IsNkJBQVk7QUFDaEUsVUFBTSxPQUFPLEtBQUssSUFBSSxVQUFVLGNBQWM7QUFDOUMsVUFBTSxVQUFVLE1BQU0sVUFBVSxjQUEyQixhQUFhO0FBQ3hFLFFBQUksQ0FBQyxXQUFXLENBQUMsS0FBTTtBQUV2QixRQUFJLE9BQXNCO0FBQzFCLFFBQUksUUFBUTtBQUNWLFlBQU0sTUFBTSxLQUFLLFNBQVMsWUFBWSxLQUFLO0FBQzNDLFVBQUksUUFBUSxZQUFZO0FBQ3RCLGVBQU8sS0FBSztBQUFBLE1BQ2QsV0FBVyxLQUFLO0FBQ2QsY0FBTSxLQUFLLGNBQWMsS0FBSyxLQUFLLElBQUk7QUFDdkMsY0FBTSxJQUFJLEtBQUssR0FBRztBQUNsQixZQUFJLEtBQUssTUFBTTtBQUNiLGlCQUFPLE9BQU8sTUFBTSxXQUFXLElBQUksTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssSUFBSSxJQUFJLE9BQU8sQ0FBQztBQUFBLFFBQy9FO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFQSxRQUFJLEtBQU0sU0FBUSxhQUFhLHFCQUFxQixJQUFJO0FBQUEsUUFDbkQsU0FBUSxnQkFBZ0IsbUJBQW1CO0FBQUEsRUFDbEQ7QUFBQTtBQUFBLEVBR0EsTUFBYyxjQUE2QjtBQUN6QyxVQUFNLE9BQU8sS0FBSyxJQUFJLFVBQVUsb0JBQW9CLDZCQUFZO0FBQ2hFLFFBQUksTUFBTTtBQUNSLFlBQU0sUUFBUSxLQUFLLFNBQVM7QUFDNUIsV0FBSyxXQUFXLE1BQU0sU0FBUyxZQUFZLFlBQVk7QUFDdkQsV0FBSyxhQUFhLE1BQU0sV0FBVztBQUVuQyxZQUFNLE9BQU8sS0FBSyxLQUFLLGFBQWE7QUFDcEMsV0FBSyxRQUFRLEVBQUUsR0FBRyxLQUFLLE9BQU8sTUFBTSxVQUFVLFFBQVEsTUFBTTtBQUM1RCxZQUFNLEtBQUssS0FBSyxhQUFhLE1BQU0sRUFBRSxPQUFPLE1BQU0sQ0FBQztBQUFBLElBQ3JEO0FBQ0EsU0FBSyxhQUFhO0FBQ2xCLFNBQUssUUFBUTtBQUFBLEVBQ2Y7QUFBQTtBQUFBLEVBR1EsYUFBbUI7QUFDekIsU0FBSyxhQUFhO0FBQ2xCLFVBQU0sT0FBTyxLQUFLLElBQUksVUFBVSxvQkFBb0IsNkJBQVk7QUFDaEUsUUFBSSxNQUFNO0FBQ1IsWUFBTSxRQUFRLEtBQUssS0FBSyxhQUFhO0FBQ3JDLFVBQUksS0FBSyxhQUFhLFdBQVc7QUFDL0IsY0FBTSxRQUFRLEVBQUUsR0FBRyxNQUFNLE9BQU8sTUFBTSxVQUFVO0FBQUEsTUFDbEQsT0FBTztBQUNMLGNBQU0sUUFBUSxFQUFFLEdBQUcsTUFBTSxPQUFPLE1BQU0sVUFBVSxRQUFRLEtBQUssV0FBVztBQUFBLE1BQzFFO0FBQ0EsV0FBSyxLQUFLLEtBQUssYUFBYSxPQUFPLEVBQUUsT0FBTyxNQUFNLENBQUM7QUFBQSxJQUNyRDtBQUNBLFNBQUssUUFBUTtBQUFBLEVBQ2Y7QUFBQTtBQUFBLEVBR0EsZUFBcUI7QUFDbkIsUUFBSSxLQUFLLFdBQVksTUFBSyxXQUFXO0FBQUEsUUFDaEMsTUFBSyxLQUFLLFlBQVk7QUFBQSxFQUM3QjtBQUFBO0FBQUEsRUFHUSx1QkFBNkI7QUFDbkMsVUFBTSxPQUFPLEtBQUssSUFBSSxVQUFVLGNBQWM7QUFDOUMsUUFBSSxDQUFDLFFBQVEsS0FBSyxTQUFTLEtBQUssZ0JBQWlCO0FBQ2pELFNBQUssa0JBQWtCLEtBQUs7QUFDNUIsUUFBSSxLQUFLLFNBQVMsbUJBQW1CLEtBQUssV0FBVyxJQUFJLEtBQUssQ0FBQyxLQUFLLFlBQVk7QUFDOUUsV0FBSyxLQUFLLFlBQVk7QUFBQSxJQUN4QjtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLFNBQVMsV0FBMkM7QUFDeEQsVUFBTSxPQUFPLEtBQUssSUFBSSxVQUFVLGNBQWM7QUFDOUMsUUFBSSxDQUFDLEtBQU07QUFDWCxVQUFNLE9BQU8sS0FBSyxZQUFZLFFBQVEsSUFBSTtBQUMxQyxRQUFJLENBQUMsS0FBTTtBQUNYLFVBQU0sU0FBUyxLQUFLLE1BQU0sY0FBYyxTQUFTLEtBQUssUUFBUSxJQUFJLEtBQUssUUFBUSxDQUFDO0FBQ2hGLFFBQUksQ0FBQyxPQUFRO0FBQ2IsUUFBSSxDQUFDLEtBQUssV0FBWSxPQUFNLEtBQUssWUFBWTtBQUM3QyxTQUFLLEtBQUssSUFBSSxVQUFVLGFBQWEsUUFBUSxLQUFLLElBQUk7QUFBQSxFQUN4RDtBQUFBO0FBQUEsRUFHQSxNQUFNLE9BQU8sT0FBOEI7QUFDekMsVUFBTSxPQUFPLEtBQUssSUFBSSxVQUFVLGNBQWM7QUFDOUMsUUFBSSxDQUFDLEtBQU07QUFDWCxVQUFNLE9BQU8sS0FBSyxZQUFZLFFBQVEsSUFBSTtBQUMxQyxRQUFJLENBQUMsUUFBUSxRQUFRLEtBQUssU0FBUyxLQUFLLE1BQU0sVUFBVSxVQUFVLEtBQUssTUFBTztBQUM5RSxVQUFNLFNBQVMsS0FBSyxNQUFNLEtBQUs7QUFDL0IsUUFBSSxDQUFDLE9BQVE7QUFDYixRQUFJLENBQUMsS0FBSyxXQUFZLE9BQU0sS0FBSyxZQUFZO0FBQzdDLFNBQUssS0FBSyxJQUFJLFVBQVUsYUFBYSxRQUFRLEtBQUssSUFBSTtBQUFBLEVBQ3hEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTUSxxQkFBcUIsT0FBeUI7QUFDcEQsUUFBSTtBQUNGLFlBQU0sU0FBUyxLQUFLLE1BQU0sS0FBSyxTQUFTLHFCQUFxQixJQUFJO0FBQ2pFLFVBQ0UsTUFBTSxRQUFRLE1BQU0sS0FDcEIsT0FBTyxXQUFXLFNBQ2xCLE9BQU8sTUFBTSxDQUFDLE1BQU0sT0FBTyxNQUFNLFFBQVEsR0FDekM7QUFDQSxlQUFPO0FBQUEsTUFDVDtBQUFBLElBQ0YsUUFBUTtBQUFBLElBRVI7QUFDQSxXQUFPLE1BQU0sS0FBSyxFQUFFLEtBQUssTUFBTSxLQUFLO0FBQUEsRUFDdEM7QUFBQTtBQUFBLEVBR0EsTUFBYyxzQkFBc0IsUUFBaUM7QUFDbkUsU0FBSyxTQUFTLG9CQUFvQixLQUFLLFVBQVUsTUFBTTtBQUN2RCxVQUFNLEtBQUssYUFBYTtBQUFBLEVBQzFCO0FBQUE7QUFBQSxFQUdBLFVBQWdCO0FBQ2QsUUFBSSxDQUFDLEtBQUssSUFBSztBQUNmLFNBQUssZ0JBQWdCO0FBRXJCLFVBQU0sT0FBTyxLQUFLLElBQUksVUFBVSxjQUFjO0FBQzlDLFVBQU0sT0FBTyxZQUFZLEtBQUssR0FBRztBQUNqQyxVQUFNLFNBQVMsS0FBSyxXQUFXLElBQUk7QUFDbkMsVUFBTSxpQkFBaUIsU0FBUyxZQUFZLGNBQWMsS0FBSyxHQUFHO0FBSWxFLFFBQUksS0FBSyxlQUFlLENBQUMsVUFBVSxDQUFDLGlCQUFpQjtBQUNuRCxXQUFLLGFBQWE7QUFBQSxJQUNwQjtBQUlBLFNBQUssZUFBZSxpQkFBaUIsS0FBSyxZQUFZO0FBR3RELFVBQU0sU0FBUyxLQUFLLGNBQWMsVUFBVTtBQUM1QyxhQUFTLEtBQUssVUFBVSxPQUFPLHNCQUFzQixNQUFNO0FBQzNELFFBQUksQ0FBQyxPQUFRLE1BQUssZ0JBQWdCO0FBQ2xDLFNBQUssaUJBQWlCLE1BQU07QUFDNUIsU0FBSyxrQkFBa0IsTUFBTTtBQUU3QixVQUFNLGFBQWEsVUFBVSxLQUFLLFNBQVMsaUJBQWlCLENBQUMsS0FBSyxTQUFTO0FBSTNFLFFBQUksWUFBWTtBQUNkLGVBQVMsZ0JBQWdCLE1BQU0sZUFBZSw0QkFBNEI7QUFBQSxJQUM1RSxPQUFPO0FBQ0wsZUFBUyxnQkFBZ0IsTUFBTSxZQUFZLDhCQUE4QixLQUFLO0FBQUEsSUFDaEY7QUFDQSxRQUFJLENBQUMsWUFBWTtBQUNmLFdBQUssSUFBSSxNQUFNLFVBQVU7QUFDekI7QUFBQSxJQUNGO0FBQ0EsUUFBSSxDQUFDLEtBQU07QUFFWCxVQUFNLEtBQUssa0JBQWtCLEtBQUssR0FBRztBQUNyQyxVQUFNLE9BQU8sS0FBSyxZQUFZLFFBQVEsSUFBSTtBQUMxQyxrQkFBYyxLQUFLLEdBQUc7QUFJdEIsUUFBSSxLQUFLLFNBQVMsa0JBQWtCLE1BQU07QUFDeEMsWUFBTSxVQUFVLEtBQUssUUFBUTtBQUM3QixZQUFNLFVBQVUsS0FBSyxRQUFRLEtBQUssTUFBTSxTQUFTO0FBQ2pELFlBQU0sTUFBTSxTQUFTLGNBQWMsS0FBSztBQUN4QyxVQUFJLFlBQVk7QUFDaEIsVUFBSSxZQUFZLFVBQVUsVUFBSyxpQkFBaUIsTUFBTSxLQUFLLFNBQVMsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDO0FBQ3RGLFVBQUksWUFBWSxVQUFVLFVBQUssYUFBYSxNQUFNLEtBQUssU0FBUyxNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFDbEYsV0FBSyxJQUFJLFlBQVksR0FBRztBQUFBLElBQzFCO0FBR0EsVUFBTSxZQUFZLEtBQUssU0FBUyxjQUM3QixNQUFNLEdBQUcsRUFDVCxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUNuQixPQUFPLE9BQU87QUFFakIsUUFBSSxVQUFVLFNBQVMsS0FBSyxJQUFJO0FBQzlCLFlBQU0sVUFBOEIsQ0FBQztBQUNyQyxpQkFBVyxRQUFRLFdBQVc7QUFDNUIsWUFBSSxRQUFRLElBQUk7QUFDZCxnQkFBTSxNQUFNLEdBQUcsSUFBSTtBQUNuQixjQUFJLE9BQU8sS0FBTSxTQUFRLEtBQUssQ0FBQyxNQUFNLFlBQVksR0FBRyxDQUFDLENBQUM7QUFBQSxRQUN4RDtBQUFBLE1BQ0Y7QUFFQSxVQUFJLFFBQVEsU0FBUyxHQUFHO0FBQ3RCLGNBQU0sWUFBWSxTQUFTLGNBQWMsS0FBSztBQUM5QyxrQkFBVSxZQUFZO0FBRXRCLGNBQU0sU0FBUyxLQUFLLHFCQUFxQixRQUFRLE1BQU07QUFFdkQsaUJBQVMsSUFBSSxHQUFHLElBQUksUUFBUSxRQUFRLEtBQUs7QUFDdkMsZ0JBQU0sQ0FBQyxFQUFFLEtBQUssSUFBSSxRQUFRLENBQUM7QUFDM0IsZ0JBQU0sT0FBTyxTQUFTLGNBQWMsTUFBTTtBQUMxQyxlQUFLLFlBQVk7QUFDakIsZUFBSyxNQUFNLFlBQVksUUFBUSxPQUFPLENBQUMsQ0FBQyxRQUFTLFFBQVEsU0FBUyxLQUFLLElBQUssUUFBUSxNQUFNO0FBQzFGLGVBQUssY0FBYztBQUNuQixvQkFBVSxZQUFZLElBQUk7QUFFMUIsY0FBSSxJQUFJLFFBQVEsU0FBUyxHQUFHO0FBQzFCLGtCQUFNLFVBQVUsU0FBUyxjQUFjLEtBQUs7QUFDNUMsb0JBQVEsWUFBWTtBQUNwQixvQkFBUSxpQkFBaUIsYUFBYSxDQUFDLE1BQU07QUFDM0MsZ0JBQUUsZUFBZTtBQUNqQixvQkFBTSxTQUFTLEVBQUU7QUFDakIsb0JBQU0saUJBQWlCLFVBQVU7QUFDakMsb0JBQU0sZ0JBQWdCLENBQUMsR0FBRyxNQUFNO0FBQ2hDLG9CQUFNLFNBQVMsQ0FBQyxPQUFtQjtBQUNqQyxzQkFBTSxTQUFVLEdBQUcsVUFBVSxVQUFVLGlCQUFrQjtBQUN6RCxzQkFBTSxVQUFVLEtBQUssSUFBSSxHQUFHLGNBQWMsQ0FBQyxJQUFJLEtBQUs7QUFDcEQsc0JBQU0sV0FBVyxLQUFLLElBQUksR0FBRyxjQUFjLElBQUksQ0FBQyxJQUFJLEtBQUs7QUFDekQsdUJBQU8sQ0FBQyxJQUFJO0FBQ1osdUJBQU8sSUFBSSxDQUFDLElBQUk7QUFDaEIsc0JBQU0sUUFBUSxVQUFVO0FBQUEsa0JBQ3RCO0FBQUEsZ0JBQ0Y7QUFDQSxzQkFBTSxDQUFDLEVBQUUsTUFBTSxZQUNiLFFBQVEsT0FBTyxRQUFTLFFBQVEsU0FBUyxLQUFLLElBQUssUUFBUSxNQUFNO0FBQ25FLHNCQUFNLElBQUksQ0FBQyxFQUFFLE1BQU0sWUFDakIsUUFBUSxRQUFRLFFBQVMsUUFBUSxTQUFTLEtBQUssSUFBSyxRQUFRLE1BQU07QUFBQSxjQUN0RTtBQUNBLG9CQUFNLE9BQU8sTUFBTTtBQUNqQix5QkFBUyxvQkFBb0IsYUFBYSxNQUFNO0FBQ2hELHlCQUFTLG9CQUFvQixXQUFXLElBQUk7QUFDNUMseUJBQVMsS0FBSyxNQUFNLFNBQVM7QUFDN0IseUJBQVMsS0FBSyxNQUFNLGFBQWE7QUFDakMscUJBQUssS0FBSyxzQkFBc0IsTUFBTTtBQUFBLGNBQ3hDO0FBQ0EsdUJBQVMsaUJBQWlCLGFBQWEsTUFBTTtBQUM3Qyx1QkFBUyxpQkFBaUIsV0FBVyxJQUFJO0FBQ3pDLHVCQUFTLEtBQUssTUFBTSxTQUFTO0FBQzdCLHVCQUFTLEtBQUssTUFBTSxhQUFhO0FBQUEsWUFDbkMsQ0FBQztBQUNELHNCQUFVLFlBQVksT0FBTztBQUFBLFVBQy9CO0FBQUEsUUFDRjtBQUVBLGFBQUssSUFBSSxZQUFZLFNBQVM7QUFBQSxNQUNoQztBQUFBLElBQ0Y7QUFHQSxVQUFNLFNBQVMsT0FBTyxLQUFLLFlBQVksT0FBTyxJQUFJLElBQUksQ0FBQztBQUN2RCxRQUFJLE9BQU8sU0FBUyxHQUFHO0FBQ3JCLFlBQU0sT0FBTyxTQUFTLGNBQWMsTUFBTTtBQUMxQyxXQUFLLFlBQVk7QUFDakIsV0FBSyxjQUFjLFlBQU8sT0FBTyxLQUFLLElBQUk7QUFDMUMsV0FBSyxRQUFRO0FBQ2IsV0FBSyxJQUFJLFlBQVksSUFBSTtBQUFBLElBQzNCO0FBR0EsUUFBSSxLQUFLLFNBQVMsb0JBQW9CLFVBQVUsTUFBTTtBQUNwRCxZQUFNLE9BQU8sU0FBUyxjQUFjLE1BQU07QUFDMUMsV0FBSyxZQUFZO0FBR2pCLFlBQU0sUUFBUSxLQUFLLE1BQU0sU0FBUztBQUNsQyxXQUFLLGNBQ0gsS0FBSyxTQUFTLG9CQUFvQixhQUFhLEdBQUcsS0FBSyxLQUFLLE1BQU0sS0FBSyxLQUFLLEdBQUcsS0FBSyxLQUFLO0FBQzNGLFdBQUssSUFBSSxZQUFZLElBQUk7QUFBQSxJQUMzQjtBQUdBLFFBQUksS0FBSyxTQUFTLGdCQUFnQixRQUFRLEtBQUssTUFBTSxTQUFTLEdBQUc7QUFDL0QsWUFBTSxXQUFXLFNBQVMsY0FBYyxLQUFLO0FBQzdDLGVBQVMsWUFBWTtBQUNyQixlQUFTLElBQUksR0FBRyxJQUFJLEtBQUssTUFBTSxRQUFRLEtBQUs7QUFDMUMsY0FBTSxNQUFNLFNBQVMsY0FBYyxLQUFLO0FBQ3hDLGNBQU0sUUFBUSxJQUFJLEtBQUssUUFBUSxTQUFTLE1BQU0sS0FBSyxRQUFRLFlBQVk7QUFDdkUsWUFBSSxZQUFZLDBEQUEwRCxLQUFLO0FBQy9FLFlBQUksaUJBQWlCLFNBQVMsTUFBTSxLQUFLLEtBQUssT0FBTyxDQUFDLENBQUM7QUFDdkQsaUJBQVMsWUFBWSxHQUFHO0FBQUEsTUFDMUI7QUFDQSxXQUFLLElBQUksWUFBWSxRQUFRO0FBQUEsSUFDL0I7QUFJQSxTQUFLLElBQUksTUFBTSxVQUFVLEtBQUssSUFBSSxzQkFBc0IsSUFBSSxTQUFTO0FBQUEsRUFDdkU7QUFDRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAibmV3TmFtZSIsICJpbXBvcnRfb2JzaWRpYW4iXQp9Cg==
