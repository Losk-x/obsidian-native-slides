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
  { id: "dashed", label: "Dashed outline" },
  { id: "paper", label: "Paper card" },
  { id: "minimal", label: "Minimal" },
  { id: "accent", label: "Accent edge" },
  { id: "glass", label: "Frosted glass" },
  { id: "lecture", label: "Lecture (wiki)" }
];
var DEFAULT_SETTINGS = {
  showNavButtons: true,
  showPageNumber: true,
  barHidden: false,
  autoEnterSlides: false,
  slidesTitle: "",
  slidesTheme: "dashed"
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
  // ── Bar rendering ─────────────────────────────────────────────────────
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvYmFyLnRzIiwgInNyYy9kZWJ1Zy50cyIsICJzcmMvbW9kZS50cyIsICJzcmMvdHlwZXMudHMiLCAic3JjL2NvbW1hbmRzLnRzIiwgInNyYy9kZWNrLXNlcnZpY2UudHMiLCAic3JjL2RlY2sudHMiLCAic3JjL2NyZWF0ZU5leHQudHMiLCAic3JjL3NldHRpbmdzLnRzIiwgInNyYy91dGlscy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBuYXRpdmUtc2xpZGVzIFx1MjAxNCBhIFwiU2xpZGVzIG1vZGVcIiBmb3IgT2JzaWRpYW4gZGVjayBub3Rlc1xuICpcbiAqIE9uZSByZXNlcnZlZCBmcm9udG1hdHRlciBrZXksIGBkZWNrYCAodXAgdG8gdHdvIG1hcmtkb3duIGxpbmtzKSwgZHJpdmVzXG4gKiBwcmV2L25leHQgbmF2aWdhdGlvbiBhbmQgYXV0by1jb21wdXRlZCBwYWdlIG51bWJlcnMuIEEgZGVjayBub3RlIGNhbiBiZVxuICogZW50ZXJlZCBpbnRvICoqU2xpZGVzIG1vZGUqKiBcdTIwMTQgYW4gaW1tZXJzaXZlLCBlZGl0YWJsZSAoTGl2ZSBQcmV2aWV3KSB2aWV3XG4gKiB3aXRoIGEgc2xpZGVzIGJhciBzaG93aW5nIHByb3BlcnRpZXMsIG5hdmlnYXRpb24gYW5kIHRoZSBwYWdlIG51bWJlci5cbiAqXG4gKiBOYXRpdmUgT2JzaWRpYW4gbW9kZXMgKFNvdXJjZSAvIGRlZmF1bHQgTGl2ZSBQcmV2aWV3IC8gUmVhZGluZyB2aWV3KSBhcmVcbiAqIGxlZnQgY29tcGxldGVseSB1bnRvdWNoZWQ6IG5vIHN0YXR1cy1iYXIgaGlkaW5nLCBubyBzbGlkZXMgYmFyLCBub1xuICogZnVsbHNjcmVlbiwgbm8gc3R5bGluZy4gU2xpZGVzIG1vZGUgaXMgdGhlIHBsdWdpbidzIG9ubHkgc3VyZmFjZS5cbiAqXG4gKiBUaGlzIGZpbGUgaXMgdGhlIGVudHJ5IHBvaW50IGFuZCBhIHRoaW4gb3JjaGVzdHJhdGlvbiBsYXllcjsgdGhlIGxvZ2ljXG4gKiBsaXZlcyBpbiBgc3JjL2A6XG4gKiAgIC0gc3JjL3R5cGVzLnRzICAgICAgICBzZXR0aW5ncyBzaGFwZSArIGRlZmF1bHRzICsgcmVzZXJ2ZWQgYGRlY2tgIGtleVxuICogICAtIHNyYy9tb2RlLnRzICAgICAgICAgdmlldyBtb2RlIC8gZnJvbnRtYXR0ZXIgaGVscGVycyAocHVyZSwgYEFwcGAtYmFzZWQpXG4gKiAgIC0gc3JjL2RlY2stc2VydmljZS50cyBkZWNrIGNoYWluIHJlc29sdXRpb24gKyBcImNyZWF0ZSBuZXh0IHNsaWRlXCIgZ2x1ZVxuICogICAtIHNyYy9iYXIudHMgICAgICAgICAgYmFyIERPTSBoZWxwZXJzIChjcmVhdGUgLyBidXR0b25zIC8gdGFiLWJhciBtZWFzdXJlKVxuICogICAtIHNyYy9jb21tYW5kcy50cyAgICAgY29tbWFuZCByZWdpc3RyYXRpb24gKGRldi1nYXRlZCBkZWJ1ZyBjb21tYW5kKVxuICogICAtIHNyYy9zZXR0aW5ncy50cyAgICAgc2V0dGluZ3MgdGFiXG4gKiAgIC0gc3JjL2RlYnVnLnRzICAgICAgICB0eXBvZ3JhcGh5IG1lYXN1cmVtZW50IHRvb2xpbmcgKGRldiBidWlsZHMgb25seSlcbiAqICAgLSBzcmMvZGVjay50cyAgICAgICAgIHB1cmUgZGVjayBjb3JlICh3aXRoIHNyYy9jcmVhdGVOZXh0LnRzKVxuICovXG5cbmltcG9ydCB7IE1hcmtkb3duVmlldywgUGx1Z2luLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgY3JlYXRlQmFyLCBuYXZCdXR0b24sIHN5bmNUYWJCYXJIZWlnaHQgfSBmcm9tIFwiLi9zcmMvYmFyXCI7XG5pbXBvcnQgeyByZWdpc3RlckNvbW1hbmRzIH0gZnJvbSBcIi4vc3JjL2NvbW1hbmRzXCI7XG5pbXBvcnQgeyBEZWNrU2VydmljZSB9IGZyb20gXCIuL3NyYy9kZWNrLXNlcnZpY2VcIjtcbmltcG9ydCB7IGZvcm1hdFZhbHVlIH0gZnJvbSBcIi4vc3JjL2RlY2tcIjtcbmltcG9ydCB7IGFjdGl2ZUZyb250bWF0dGVyLCBjdXJyZW50TW9kZSwgZnJvbnRtYXR0ZXJPZiwgaXNMaXZlUHJldmlldyB9IGZyb20gXCIuL3NyYy9tb2RlXCI7XG5pbXBvcnQgeyBOYXRpdmVTbGlkZXNTZXR0aW5nVGFiIH0gZnJvbSBcIi4vc3JjL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBERUNLX0tFWSwgREVGQVVMVF9TRVRUSU5HUywgU0xJREVTX1RIRU1FUywgdHlwZSBOYXRpdmVTbGlkZXNTZXR0aW5ncyB9IGZyb20gXCIuL3NyYy90eXBlc1wiO1xuaW1wb3J0IHsgY2xlYXJDaGlsZHJlbiB9IGZyb20gXCIuL3NyYy91dGlsc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBOYXRpdmVTbGlkZXNQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICAvKiogVGhlIHNsaWRlcyBiYXIgRE9NIGVsZW1lbnQgKi9cbiAgYmFyOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICAvKiogRGVjayBjaGFpbiByZXNvbHV0aW9uICsgXCJjcmVhdGUgbmV4dCBzbGlkZVwiIGdsdWUgKi9cbiAgZGVja1NlcnZpY2UhOiBEZWNrU2VydmljZTtcbiAgLyoqIFBsdWdpbiBzZXR0aW5ncyAqL1xuICBzZXR0aW5nczogTmF0aXZlU2xpZGVzU2V0dGluZ3MgPSB7IC4uLkRFRkFVTFRfU0VUVElOR1MgfTtcblxuICAvKiogV2hldGhlciBTbGlkZXMgbW9kZSBpcyBjdXJyZW50bHkgYWN0aXZlIChzZXNzaW9uIHN0YXRlLCBub3QgcGVyc2lzdGVkKSAqL1xuICBwcml2YXRlIHNsaWRlc01vZGUgPSBmYWxzZTtcbiAgLyoqIFZpZXcgbW9kZSB0byByZXN0b3JlIHdoZW4gbGVhdmluZyBTbGlkZXMgbW9kZSAoXCJwcmV2aWV3XCIgfCBcInNvdXJjZVwiKSAqL1xuICBwcml2YXRlIGV4aXRNb2RlOiBcInByZXZpZXdcIiB8IFwic291cmNlXCIgPSBcInNvdXJjZVwiO1xuICAvKiogV2hldGhlciB0aGUgZXhpdCB2aWV3IHdhcyBTb3VyY2UgbW9kZSAodHJ1ZSkgdnMgTGl2ZSBQcmV2aWV3IChmYWxzZSkgKi9cbiAgcHJpdmF0ZSBleGl0U291cmNlID0gZmFsc2U7XG4gIC8qKiBMYXN0IG5vdGUgYXV0by1lbnRlcmVkIGludG8gU2xpZGVzIG1vZGUgKHByZXZlbnRzIHJlLWVudGVyaW5nIGFmdGVyIG1hbnVhbCBleGl0KSAqL1xuICBwcml2YXRlIGF1dG9FbnRlcmVkUGF0aCA9IFwiXCI7XG4gIC8qKiBMYXN0IHJlZnJlc2gga2V5IChcInBhdGh8bW9kZVwiKSB0byBhdm9pZCBwb2ludGxlc3MgcmUtcmVuZGVycyAqL1xuICBwcml2YXRlIGxhc3RLZXkgPSBcIlwiO1xuICAvKiogTGFzdCBtZWFzdXJlZCB0YWItYmFyIGhlaWdodCAocHgpIFx1MjAxNCBjYWNoZWQgd2hpbGUgdGhlIHNsaWRlcyBiYXIgaXMgaGlkZGVuICovXG4gIHByaXZhdGUgdGFiQmFySGVpZ2h0ID0gMDtcbiAgLyoqIFdoZXRoZXIgdGhlIG1vdXNlIHBvaW50ZXIgaXMgaGlkZGVuIGZvciBwcmVzZW50aW5nIChzZXNzaW9uIHN0YXRlKSAqL1xuICBwb2ludGVySGlkZGVuID0gZmFsc2U7XG5cbiAgYXN5bmMgb25sb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG4gICAgdGhpcy5kZWNrU2VydmljZSA9IG5ldyBEZWNrU2VydmljZSh0aGlzLmFwcCk7XG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBOYXRpdmVTbGlkZXNTZXR0aW5nVGFiKHRoaXMpKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCAxLiBSZWZyZXNoIG9uIFwiY3VycmVudCBub3RlIC8gdmlldyBjaGFuZ2VkXCIgZXZlbnRzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImZpbGUtb3BlblwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMubWF5YmVBdXRvRW50ZXJTbGlkZXMoKTtcbiAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICB9KSxcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJhY3RpdmUtbGVhZi1jaGFuZ2VcIiwgKCkgPT4gdGhpcy5yZWZyZXNoKCkpKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKFwibGF5b3V0LWNoYW5nZVwiLCAoKSA9PiB0aGlzLnJlZnJlc2goKSkpO1xuICAgIC8vIFJlZnJlc2ggd2hlbiB0aGUgbm90ZSBjb250ZW50IChpbmNsdWRpbmcgZnJvbnRtYXR0ZXIpIGNoYW5nZXMgLyBzYXZlc1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUub24oXCJjaGFuZ2VkXCIsIChmaWxlOiBURmlsZSkgPT4ge1xuICAgICAgICBpZiAoZmlsZSA9PT0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKSkgdGhpcy5yZWZyZXNoKCk7XG4gICAgICB9KSxcbiAgICApO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIDIuIEZhbGxiYWNrIHRpbWVyOiBlZGl0XHUyMTk0cmVhZGluZyB0b2dnbGVzIG1heSBmaXJlIG5vIHN0YW5kYXJkIGV2ZW50IFx1MjUwMFx1MjUwMFxuICAgIHRoaXMucmVnaXN0ZXJJbnRlcnZhbChcbiAgICAgIHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgICAgICBjb25zdCBrZXkgPSBmaWxlID8gYCR7ZmlsZS5wYXRofXwke2N1cnJlbnRNb2RlKHRoaXMuYXBwKX1gIDogXCJcIjtcbiAgICAgICAgaWYgKGtleSAhPT0gdGhpcy5sYXN0S2V5KSB7XG4gICAgICAgICAgdGhpcy5sYXN0S2V5ID0ga2V5O1xuICAgICAgICAgIHRoaXMucmVmcmVzaCgpO1xuICAgICAgICB9XG4gICAgICB9LCA1MDApLFxuICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgMy4gQ29tbWFuZHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgcmVnaXN0ZXJDb21tYW5kcyh0aGlzKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCA0LiBQaW4gdGhlIFNsaWRlcyBlZGl0b3IgdG8gb25lIHNjcmVlbiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICAvLyBDU1MgYG92ZXJmbG93OiBoaWRkZW5gIGJsb2NrcyB0aGUgd2hlZWwsIGJ1dCBuYXRpdmUgZHJhZy1zZWxlY3RcbiAgICAvLyBhdXRvc2Nyb2xsIGFuZCBDb2RlTWlycm9yJ3MgcHJvZ3JhbW1hdGljIHNjcm9sbEludG9WaWV3IHN0aWxsIG1vdmUgdGhlXG4gICAgLy8gc2Nyb2xsZXIuIFRoaXMgY2FwdHVyZS1waGFzZSBsaXN0ZW5lciByZXNldHMgYW55IHNjcm9sbCBpbnNpZGUgdGhlXG4gICAgLy8gYWN0aXZlIG1hcmtkb3duIHZpZXcgYmFjayB0byB0aGUgdG9wIHdoaWxlIFNsaWRlcyBtb2RlIGlzIGFjdGl2ZS5cbiAgICB0aGlzLnJlZ2lzdGVyRG9tRXZlbnQoXG4gICAgICBkb2N1bWVudCxcbiAgICAgIFwic2Nyb2xsXCIsXG4gICAgICAoZXZ0KSA9PiB7XG4gICAgICAgIGlmICghZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuY29udGFpbnMoXCJuYXRpdmUtc2xpZGVzLW1vZGVcIikpIHJldHVybjtcbiAgICAgICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgICAgIGlmICghdmlldykgcmV0dXJuO1xuICAgICAgICBjb25zdCBlbCA9IGV2dC50YXJnZXQ7XG4gICAgICAgIGlmIChlbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICYmIHZpZXcuY29udGVudEVsLmNvbnRhaW5zKGVsKSkge1xuICAgICAgICAgIGlmIChlbC5zY3JvbGxUb3AgIT09IDApIGVsLnNjcm9sbFRvcCA9IDA7XG4gICAgICAgICAgaWYgKGVsLnNjcm9sbExlZnQgIT09IDApIGVsLnNjcm9sbExlZnQgPSAwO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgeyBjYXB0dXJlOiB0cnVlIH0sXG4gICAgKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCA1LiBDcmVhdGUgdGhlIHNsaWRlcyBiYXIgYW5kIGRvIHRoZSBmaXJzdCByZW5kZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5iYXIgPSBjcmVhdGVCYXIoKTtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuYmFyKTtcbiAgICB0aGlzLnJlZnJlc2goKTtcbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuYmFyPy5yZW1vdmUoKTtcbiAgICB0aGlzLmJhciA9IG51bGw7XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKFwibmF0aXZlLXNsaWRlcy1tb2RlXCIpO1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShcIm5hdGl2ZS1zbGlkZXMtcG9pbnRlci1oaWRkZW5cIik7XG4gICAgdGhpcy5yZW1vdmVUaGVtZUNsYXNzZXMoKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTZXR0aW5ncyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTbGlkZXMgbW9kZSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICAvKiogV2hldGhlciB0aGUgYWN0aXZlIG5vdGUgaXMgYSBkZWNrIG5vdGUgKGhhcyBhIGBkZWNrYCBwcm9wZXJ0eSkgKi9cbiAgcHJpdmF0ZSBpc0RlY2tOb3RlKGZpbGU6IFRGaWxlIHwgbnVsbCk6IGJvb2xlYW4ge1xuICAgIGlmICghZmlsZSkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGZtID0gZnJvbnRtYXR0ZXJPZih0aGlzLmFwcCwgZmlsZSk7XG4gICAgcmV0dXJuIGZtICE9PSBudWxsICYmIERFQ0tfS0VZIGluIGZtO1xuICB9XG5cbiAgLyoqIFJlbW92ZSBldmVyeSBgbmF0aXZlLXNsaWRlcy10aGVtZS0qYCBjbGFzcyBmcm9tIDxib2R5PiAqL1xuICBwcml2YXRlIHJlbW92ZVRoZW1lQ2xhc3NlcygpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IGNscyBvZiBBcnJheS5mcm9tKGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0KSkge1xuICAgICAgaWYgKGNscy5zdGFydHNXaXRoKFwibmF0aXZlLXNsaWRlcy10aGVtZS1cIikpIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShjbHMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBLZWVwIHRoZSBzaW5nbGUgYG5hdGl2ZS1zbGlkZXMtdGhlbWUtPGlkPmAgYm9keSBjbGFzcyBpbiBzeW5jIHdpdGggdGhlXG4gICAqIGBzbGlkZXNUaGVtZWAgc2V0dGluZyBcdTIwMTQgdGhlIHN0eWxlIHRlbXBsYXRlcyBpbiBzdHlsZXMuY3NzIGhvb2sgb2ZmIGl0LlxuICAgKiBVbmtub3duIGlkcyAoZS5nLiBhZnRlciBhIGRvd25ncmFkZSkgZmFsbCBiYWNrIHRvIHRoZSBkZWZhdWx0IHRoZW1lLlxuICAgKi9cbiAgcHJpdmF0ZSBhcHBseVRoZW1lQ2xhc3MoKTogdm9pZCB7XG4gICAgY29uc3QgaWQgPSBTTElERVNfVEhFTUVTLnNvbWUoKHQpID0+IHQuaWQgPT09IHRoaXMuc2V0dGluZ3Muc2xpZGVzVGhlbWUpXG4gICAgICA/IHRoaXMuc2V0dGluZ3Muc2xpZGVzVGhlbWVcbiAgICAgIDogREVGQVVMVF9TRVRUSU5HUy5zbGlkZXNUaGVtZTtcbiAgICBjb25zdCBjbHMgPSBgbmF0aXZlLXNsaWRlcy10aGVtZS0ke2lkfWA7XG4gICAgZm9yIChjb25zdCBjIG9mIEFycmF5LmZyb20oZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QpKSB7XG4gICAgICBpZiAoYy5zdGFydHNXaXRoKFwibmF0aXZlLXNsaWRlcy10aGVtZS1cIikgJiYgYyAhPT0gY2xzKSBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoYyk7XG4gICAgfVxuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZChjbHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZSBoaWRpbmcgdGhlIG1vdXNlIHBvaW50ZXIgd2luZG93LXdpZGUgZm9yIHByZXNlbnRpbmcuIEhpZGluZyBhbHNvXG4gICAqIHBhcmtzIGZvY3VzIChibHVycyB0aGUgZWRpdG9yLCBzbyB0aGUgY2FyZXQgZGlzYXBwZWFycyk7IHNob3dpbmcgbGVhdmVzXG4gICAqIGZvY3VzIHBhcmtlZCBcdTIwMTQgY2xpY2sgc2xpZGUgY29udGVudCB0byByZXN1bWUgZWRpdGluZy5cbiAgICovXG4gIHRvZ2dsZVBvaW50ZXIoKTogdm9pZCB7XG4gICAgdGhpcy5wb2ludGVySGlkZGVuID0gIXRoaXMucG9pbnRlckhpZGRlbjtcbiAgICBpZiAodGhpcy5wb2ludGVySGlkZGVuKSB7XG4gICAgICBjb25zdCBhY3RpdmUgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgICAgaWYgKGFjdGl2ZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICYmIGFjdGl2ZSAhPT0gZG9jdW1lbnQuYm9keSkgYWN0aXZlLmJsdXIoKTtcbiAgICB9XG4gICAgdGhpcy5yZWZyZXNoKCk7XG4gIH1cblxuICAvKipcbiAgICogS2VlcCB0aGUgYG5hdGl2ZS1zbGlkZXMtcG9pbnRlci1oaWRkZW5gIGJvZHkgY2xhc3MgaW4gc3luYyB3aXRoIHRoZVxuICAgKiBwcmVzZW50aW5nIHN0YXRlIFx1MjAxNCBzdHlsZXMuY3NzIHR1cm5zIGV2ZXJ5IGN1cnNvciBpbnZpc2libGUgd2hpbGUgc2V0LlxuICAgKiBMZWF2aW5nIFNsaWRlcyBtb2RlIGFsd2F5cyByZXN0b3JlcyB0aGUgcG9pbnRlci5cbiAgICovXG4gIHByaXZhdGUgc3luY1BvaW50ZXJDbGFzcyhzbGlkZXM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC50b2dnbGUoXCJuYXRpdmUtc2xpZGVzLXBvaW50ZXItaGlkZGVuXCIsIHNsaWRlcyAmJiB0aGlzLnBvaW50ZXJIaWRkZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbmRlciB0aGUgY2FyZCB0aXRsZSAoYW4gSDEgaW5zaWRlIHRoZSBjYXJkKSBwZXIgdGhlIGBzbGlkZXNUaXRsZWBcbiAgICogc2V0dGluZywgdmlhIHRoZSBgLmNtLWNvbnRlbnRgIGRhdGEtc2xpZGVzLXRpdGxlIGF0dHJpYnV0ZSBcdTIwMTQgdGhlIENTU1xuICAgKiA6OmJlZm9yZSBwc2V1ZG8tZWxlbWVudCByZW5kZXJzIGl0LiBcIlwiIChkZWZhdWx0KSBzaG93cyBub3RoaW5nO1xuICAgKiBcImZpbGVuYW1lXCIgdXNlcyB0aGUgZmlsZSBuYW1lOyBhbnkgb3RoZXIgdmFsdWUgbmFtZXMgYSBmcm9udG1hdHRlclxuICAgKiBwcm9wZXJ0eS4gVGhlIGZpbGUgbmFtZSAoaW5saW5lIHRpdGxlKSBvdXRzaWRlIHRoZSBjYXJkIGlzIGFsd2F5cyBoaWRkZW5cbiAgICogYnkgQ1NTIGluIFNsaWRlcyBtb2RlLlxuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVJbmxpbmVUaXRsZShzbGlkZXM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICBjb25zdCBjb250ZW50ID0gdmlldz8uY29udGVudEVsLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFwiLmNtLWNvbnRlbnRcIik7XG4gICAgaWYgKCFjb250ZW50IHx8ICFmaWxlKSByZXR1cm47XG5cbiAgICBsZXQgdGV4dDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgaWYgKHNsaWRlcykge1xuICAgICAgY29uc3Qgc3JjID0gdGhpcy5zZXR0aW5ncy5zbGlkZXNUaXRsZS50cmltKCk7XG4gICAgICBpZiAoc3JjID09PSBcImZpbGVuYW1lXCIpIHtcbiAgICAgICAgdGV4dCA9IGZpbGUuYmFzZW5hbWU7XG4gICAgICB9IGVsc2UgaWYgKHNyYykge1xuICAgICAgICBjb25zdCBmbSA9IGZyb250bWF0dGVyT2YodGhpcy5hcHAsIGZpbGUpO1xuICAgICAgICBjb25zdCB2ID0gZm0/LltzcmNdO1xuICAgICAgICBpZiAodiAhPSBudWxsKSB7XG4gICAgICAgICAgdGV4dCA9IHR5cGVvZiB2ID09PSBcInN0cmluZ1wiID8gdiA6IEFycmF5LmlzQXJyYXkodikgPyB2LmpvaW4oXCIsIFwiKSA6IFN0cmluZyh2KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0ZXh0KSBjb250ZW50LnNldEF0dHJpYnV0ZShcImRhdGEtc2xpZGVzLXRpdGxlXCIsIHRleHQpO1xuICAgIGVsc2UgY29udGVudC5yZW1vdmVBdHRyaWJ1dGUoXCJkYXRhLXNsaWRlcy10aXRsZVwiKTtcbiAgfVxuXG4gIC8qKiBFbnRlciBTbGlkZXMgbW9kZTogcmVjb3JkIHRoZSBleGl0IHN0YXRlIGFuZCBmb3JjZSB0aGUgTGl2ZSBQcmV2aWV3ICovXG4gIHByaXZhdGUgYXN5bmMgZW50ZXJTbGlkZXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgaWYgKHZpZXcpIHtcbiAgICAgIGNvbnN0IHN0YXRlID0gdmlldy5nZXRTdGF0ZSgpIGFzIHsgbW9kZT86IHN0cmluZzsgc291cmNlPzogYm9vbGVhbiB9O1xuICAgICAgdGhpcy5leGl0TW9kZSA9IHN0YXRlLm1vZGUgPT09IFwicHJldmlld1wiID8gXCJwcmV2aWV3XCIgOiBcInNvdXJjZVwiO1xuICAgICAgdGhpcy5leGl0U291cmNlID0gc3RhdGUuc291cmNlID09PSB0cnVlO1xuICAgICAgLy8gU2xpZGVzIG1vZGUgaXMgYWx3YXlzIHRoZSBlZGl0YWJsZSBMaXZlIFByZXZpZXdcbiAgICAgIGNvbnN0IG5leHQgPSB2aWV3LmxlYWYuZ2V0Vmlld1N0YXRlKCk7XG4gICAgICBuZXh0LnN0YXRlID0geyAuLi5uZXh0LnN0YXRlLCBtb2RlOiBcInNvdXJjZVwiLCBzb3VyY2U6IGZhbHNlIH07XG4gICAgICBhd2FpdCB2aWV3LmxlYWYuc2V0Vmlld1N0YXRlKG5leHQsIHsgZm9jdXM6IGZhbHNlIH0pO1xuICAgIH1cbiAgICB0aGlzLnNsaWRlc01vZGUgPSB0cnVlO1xuICAgIHRoaXMucmVmcmVzaCgpO1xuICB9XG5cbiAgLyoqIEV4aXQgU2xpZGVzIG1vZGU6IHJlc3RvcmUgdGhlIHZpZXcgbW9kZSByZWNvcmRlZCBhdCBlbnRyeSAqL1xuICBwcml2YXRlIGV4aXRTbGlkZXMoKTogdm9pZCB7XG4gICAgdGhpcy5zbGlkZXNNb2RlID0gZmFsc2U7XG4gICAgY29uc3QgdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgaWYgKHZpZXcpIHtcbiAgICAgIGNvbnN0IHN0YXRlID0gdmlldy5sZWFmLmdldFZpZXdTdGF0ZSgpO1xuICAgICAgaWYgKHRoaXMuZXhpdE1vZGUgPT09IFwicHJldmlld1wiKSB7XG4gICAgICAgIHN0YXRlLnN0YXRlID0geyAuLi5zdGF0ZS5zdGF0ZSwgbW9kZTogXCJwcmV2aWV3XCIgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlLnN0YXRlID0geyAuLi5zdGF0ZS5zdGF0ZSwgbW9kZTogXCJzb3VyY2VcIiwgc291cmNlOiB0aGlzLmV4aXRTb3VyY2UgfTtcbiAgICAgIH1cbiAgICAgIHZvaWQgdmlldy5sZWFmLnNldFZpZXdTdGF0ZShzdGF0ZSwgeyBmb2N1czogZmFsc2UgfSk7XG4gICAgfVxuICAgIHRoaXMucmVmcmVzaCgpO1xuICB9XG5cbiAgLyoqIFRvZ2dsZSBTbGlkZXMgbW9kZSAoZGVjayBub3RlcyBvbmx5IFx1MjAxNCBlbmZvcmNlZCBieSB0aGUgY29tbWFuZCkgKi9cbiAgdG9nZ2xlU2xpZGVzKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNsaWRlc01vZGUpIHRoaXMuZXhpdFNsaWRlcygpO1xuICAgIGVsc2Ugdm9pZCB0aGlzLmVudGVyU2xpZGVzKCk7XG4gIH1cblxuICAvKiogQXV0by1lbnRlciBTbGlkZXMgbW9kZSBvbmNlIHBlciBvcGVuZWQgZGVjayBub3RlIHdoZW4gdGhlIHNldHRpbmcgaXMgb24gKi9cbiAgcHJpdmF0ZSBtYXliZUF1dG9FbnRlclNsaWRlcygpOiB2b2lkIHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICBpZiAoIWZpbGUgfHwgZmlsZS5wYXRoID09PSB0aGlzLmF1dG9FbnRlcmVkUGF0aCkgcmV0dXJuO1xuICAgIHRoaXMuYXV0b0VudGVyZWRQYXRoID0gZmlsZS5wYXRoO1xuICAgIGlmICh0aGlzLnNldHRpbmdzLmF1dG9FbnRlclNsaWRlcyAmJiB0aGlzLmlzRGVja05vdGUoZmlsZSkgJiYgIXRoaXMuc2xpZGVzTW9kZSkge1xuICAgICAgdm9pZCB0aGlzLmVudGVyU2xpZGVzKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFBQVCBuYXZpZ2F0aW9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBNb3ZlIG9uZSBzdGVwIGJhY2svZm9yd2FyZCBhbG9uZyB0aGUgZGVjayBjaGFpbiAoZW50ZXJpbmcgU2xpZGVzIG1vZGUgYXMgbmVlZGVkKSAqL1xuICBhc3luYyBuYXZpZ2F0ZShkaXJlY3Rpb246IFwicHJldlwiIHwgXCJuZXh0XCIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICBpZiAoIWZpbGUpIHJldHVybjtcbiAgICBjb25zdCBkZWNrID0gdGhpcy5kZWNrU2VydmljZS5jb21wdXRlKGZpbGUpO1xuICAgIGlmICghZGVjaykgcmV0dXJuO1xuICAgIGNvbnN0IHRhcmdldCA9IGRlY2suY2hhaW5bZGlyZWN0aW9uID09PSBcInByZXZcIiA/IGRlY2suaW5kZXggLSAxIDogZGVjay5pbmRleCArIDFdO1xuICAgIGlmICghdGFyZ2V0KSByZXR1cm47XG4gICAgaWYgKCF0aGlzLnNsaWRlc01vZGUpIGF3YWl0IHRoaXMuZW50ZXJTbGlkZXMoKTtcbiAgICB2b2lkIHRoaXMuYXBwLndvcmtzcGFjZS5vcGVuTGlua1RleHQodGFyZ2V0LCBmaWxlLnBhdGgpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEJhciByZW5kZXJpbmcgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgLyoqIERlY2lkZSB3aGF0IHRoZSBzbGlkZXMgYmFyIHNob3dzLCB0aGVuIHJlLXJlbmRlciBpdCAqL1xuICByZWZyZXNoKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5iYXIpIHJldHVybjtcbiAgICB0aGlzLmFwcGx5VGhlbWVDbGFzcygpO1xuXG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgY29uc3QgbW9kZSA9IGN1cnJlbnRNb2RlKHRoaXMuYXBwKTtcbiAgICBjb25zdCBpc0NhcmQgPSB0aGlzLmlzRGVja05vdGUoZmlsZSk7XG4gICAgY29uc3QgbGl2ZVByZXZpZXdOb3cgPSBtb2RlID09PSBcInNvdXJjZVwiICYmIGlzTGl2ZVByZXZpZXcodGhpcy5hcHApO1xuXG4gICAgLy8gTGVhdmluZyBhIGRlY2sgbm90ZSwgb3IgbGVhdmluZyB0aGUgTGl2ZSBQcmV2aWV3IChlLmcuIENtZC9DdHJsK0UgdG9cbiAgICAvLyByZWFkaW5nIHZpZXcpLCBlbmRzIFNsaWRlcyBtb2RlIFx1MjAxNCBvbmx5IHRoZSB0b2dnbGUgY29tbWFuZCByZS1lbnRlcnMgaXQuXG4gICAgaWYgKHRoaXMuc2xpZGVzTW9kZSAmJiAoIWlzQ2FyZCB8fCAhbGl2ZVByZXZpZXdOb3cpKSB7XG4gICAgICB0aGlzLnNsaWRlc01vZGUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBNZWFzdXJlIHRoZSB0YWIgYmFyIHdoaWxlIGl0IGlzIHN0aWxsIHZpc2libGUgKFNsaWRlcyBtb2RlIGhpZGVzIGl0XG4gICAgLy8gYmVsb3c7IHRoZSBsYXN0IG1lYXN1cmVkIHZhbHVlIGlzIHJldXNlZCBvbmNlIGhpZGRlbikuXG4gICAgdGhpcy50YWJCYXJIZWlnaHQgPSBzeW5jVGFiQmFySGVpZ2h0KHRoaXMudGFiQmFySGVpZ2h0KTtcblxuICAgIC8vIFNsaWRlcyBtb2RlIGlzIGFjdGl2ZSBvbmx5IHdoaWxlIGFjdHVhbGx5IGluIHRoZSBlZGl0YWJsZSBMaXZlIFByZXZpZXdcbiAgICBjb25zdCBzbGlkZXMgPSB0aGlzLnNsaWRlc01vZGUgJiYgaXNDYXJkICYmIGxpdmVQcmV2aWV3Tm93O1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnRvZ2dsZShcIm5hdGl2ZS1zbGlkZXMtbW9kZVwiLCBzbGlkZXMpO1xuICAgIGlmICghc2xpZGVzKSB0aGlzLnBvaW50ZXJIaWRkZW4gPSBmYWxzZTsgLy8gbGVhdmluZyBTbGlkZXMgcmVzdG9yZXMgdGhlIHBvaW50ZXJcbiAgICB0aGlzLnN5bmNQb2ludGVyQ2xhc3Moc2xpZGVzKTtcbiAgICB0aGlzLnVwZGF0ZUlubGluZVRpdGxlKHNsaWRlcyk7XG5cbiAgICBjb25zdCBiYXJWaXNpYmxlID0gc2xpZGVzICYmICF0aGlzLnNldHRpbmdzLmJhckhpZGRlbjtcbiAgICBpZiAoIWJhclZpc2libGUpIHtcbiAgICAgIHRoaXMuYmFyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFmaWxlKSByZXR1cm47IC8vIGJhclZpc2libGUgaW1wbGllcyBhIGZpbGUsIGJ1dCBuYXJyb3cgZm9yIFR5cGVTY3JpcHRcblxuICAgIGNvbnN0IGZtID0gYWN0aXZlRnJvbnRtYXR0ZXIodGhpcy5hcHApO1xuICAgIGNvbnN0IGRlY2sgPSB0aGlzLmRlY2tTZXJ2aWNlLmNvbXB1dGUoZmlsZSk7XG4gICAgY2xlYXJDaGlsZHJlbih0aGlzLmJhcik7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTGVmdDogcHJldmlvdXMgLyBuZXh0IGJ1dHRvbnMgKGJvdGggYWx3YXlzIHNob3duIGluc2lkZSBhIGRlY2s7XG4gICAgLy8gICAgICAgIHRoZSBvbmUgdGhhdCBjYW5ub3QgbW92ZSBpcyBkaXNhYmxlZCAvIGxpZ2h0IGdyYXkpIFx1MjUwMFx1MjUwMFxuICAgIGlmICh0aGlzLnNldHRpbmdzLnNob3dOYXZCdXR0b25zICYmIGRlY2spIHtcbiAgICAgIGNvbnN0IGhhc1ByZXYgPSBkZWNrLmluZGV4ID4gMDtcbiAgICAgIGNvbnN0IGhhc05leHQgPSBkZWNrLmluZGV4IDwgZGVjay5jaGFpbi5sZW5ndGggLSAxO1xuICAgICAgY29uc3QgbmF2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIG5hdi5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtbmF2XCI7XG4gICAgICBuYXYuYXBwZW5kQ2hpbGQobmF2QnV0dG9uKFwiXHUyNUMwXCIsIFwiUHJldmlvdXMgcGFnZVwiLCAoKSA9PiB0aGlzLm5hdmlnYXRlKFwicHJldlwiKSwgIWhhc1ByZXYpKTtcbiAgICAgIG5hdi5hcHBlbmRDaGlsZChuYXZCdXR0b24oXCJcdTI1QjZcIiwgXCJOZXh0IHBhZ2VcIiwgKCkgPT4gdGhpcy5uYXZpZ2F0ZShcIm5leHRcIiksICFoYXNOZXh0KSk7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChuYXYpO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBNaWRkbGU6IGNoaXBzIGZvciB0aGUgcmVtYWluaW5nIHByb3BlcnRpZXMgKG5vIHBsYWNlaG9sZGVyKSBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCB2aXNpYmxlID0gZm1cbiAgICAgID8gT2JqZWN0LmVudHJpZXMoZm0pLmZpbHRlcigoW2tleV0pID0+IGtleSAhPT0gREVDS19LRVkgJiYga2V5ICE9PSBcInBvc2l0aW9uXCIpXG4gICAgICA6IFtdO1xuXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgdmlzaWJsZSkge1xuICAgICAgY29uc3Qgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgc3Bhbi5jbGFzc05hbWUgPSBcIm5hdGl2ZS1zbGlkZXMtaXRlbVwiO1xuICAgICAgY29uc3QgayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHJvbmdcIik7XG4gICAgICBrLnRleHRDb250ZW50ID0ga2V5O1xuICAgICAgc3Bhbi5hcHBlbmRDaGlsZChrKTtcbiAgICAgIHNwYW4uYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCI6IFwiICsgZm9ybWF0VmFsdWUodmFsdWUpKSk7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICB9XG5cbiAgICAvLyBCcm9rZW4gZGVjayBsaW5rcyBcdTIxOTIgd2FybmluZyBjaGlwIHNvIGRlY2sgYXV0aG9ycyBzcG90IHR5cG9zXG4gICAgY29uc3QgYnJva2VuID0gZmlsZSA/IHRoaXMuZGVja1NlcnZpY2UuYnJva2VuKGZpbGUpIDogW107XG4gICAgaWYgKGJyb2tlbi5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB3YXJuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICB3YXJuLmNsYXNzTmFtZSA9IFwibmF0aXZlLXNsaWRlcy13YXJuXCI7XG4gICAgICB3YXJuLnRleHRDb250ZW50ID0gXCJcdTI2QTAgXCIgKyBicm9rZW4uam9pbihcIiwgXCIpO1xuICAgICAgd2Fybi50aXRsZSA9IFwiQnJva2VuIGRlY2sgbGluayhzKSBcdTIwMTQgdGhlIHRhcmdldCBub3RlIGRvZXMgbm90IGV4aXN0XCI7XG4gICAgICB0aGlzLmJhci5hcHBlbmRDaGlsZCh3YXJuKTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQm90dG9tLXJpZ2h0OiBhdXRvLWNvbXB1dGVkIHBhZ2UgbnVtYmVyIFx1MjUwMFx1MjUwMFxuICAgIGlmICh0aGlzLnNldHRpbmdzLnNob3dQYWdlTnVtYmVyICYmIGRlY2spIHtcbiAgICAgIGNvbnN0IHBhZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgIHBhZ2UuY2xhc3NOYW1lID0gXCJuYXRpdmUtc2xpZGVzLXBhZ2VcIjtcbiAgICAgIC8vIGNoYWluWzBdIGlzIHRoZSBvdmVydmlldyBub3RlOyBzbGlkZXMgc3RhcnQgYXQgaW5kZXggMSBcdTIxOTIgXCJQYWdlIDFcIlxuICAgICAgcGFnZS50ZXh0Q29udGVudCA9IGRlY2suaW5kZXggPT09IDAgPyBcIk92ZXJ2aWV3XCIgOiBgUGFnZSAke2RlY2suaW5kZXh9YDtcbiAgICAgIHRoaXMuYmFyLmFwcGVuZENoaWxkKHBhZ2UpO1xuICAgIH1cblxuICAgIC8vIEhpZGUgdGhlIHNsaWRlcyBiYXIgZW50aXJlbHkgd2hlbiBpdCBoYXMgbm90aGluZyB0byBkaXNwbGF5IChubyBwcm9wZXJ0aWVzLFxuICAgIC8vIGFuZCBub3QgcGFydCBvZiBhIGRlY2spXG4gICAgdGhpcy5iYXIuc3R5bGUuZGlzcGxheSA9IHRoaXMuYmFyLmNoaWxkRWxlbWVudENvdW50ID09PSAwID8gXCJub25lXCIgOiBcIlwiO1xuICB9XG59XG4iLCAiLyoqIENyZWF0ZSB0aGUgc2xpZGVzIGJhciBET00gZWxlbWVudCAoaGlkZGVuIHVudGlsIHJlZnJlc2goKSBzaG93cyBpdCkgKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVCYXIoKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBiYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBiYXIuY2xhc3NOYW1lID0gXCJuYXRpdmUtc2xpZGVzLWJhclwiO1xuICBiYXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICBiYXIudGl0bGUgPSBcIkNsaWNrIHRvIHBhcmsgdGhlIG1vdXNlIFx1MjAxNCBoaWRlcyB0aGUgZWRpdG9yIGNhcmV0IHdoaWxlIHByZXNlbnRpbmdcIjtcbiAgLy8gUHJlc2VudGF0aW9uIHBhcmtpbmc6IGNsaWNraW5nIHRoZSBiYXIga2VlcHMgZm9jdXMgb3V0IG9mIHRoZSBlZGl0b3Igc29cbiAgLy8gdGhlIGJsaW5raW5nIGNhcmV0IGRpc2FwcGVhcnMuIHByZXZlbnREZWZhdWx0IHN0b3BzIHRoZSBjbGljayBmcm9tIG1vdmluZ1xuICAvLyBmb2N1cyBvciBzdGFydGluZyBhIHRleHQgc2VsZWN0aW9uOyBidXR0b25zIHN0aWxsIHJlY2VpdmUgdGhlaXIgY2xpY2sgZXZlbnQuXG4gIGJhci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IGFjdGl2ZSA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKGFjdGl2ZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICYmIGFjdGl2ZSAhPT0gZG9jdW1lbnQuYm9keSkgYWN0aXZlLmJsdXIoKTtcbiAgfSk7XG4gIHJldHVybiBiYXI7XG59XG5cbi8qKiBCdWlsZCBhIFx1MjVDMCAvIFx1MjVCNiBuYXZpZ2F0aW9uIGJ1dHRvbjsgYGRpc2FibGVkYCByZW5kZXJzIGl0IGxpZ2h0IGdyYXkvaW5hY3RpdmUgKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXZCdXR0b24oXG4gIGxhYmVsOiBzdHJpbmcsXG4gIHRpcDogc3RyaW5nLFxuICBvbkNsaWNrOiAoKSA9PiB2b2lkLFxuICBkaXNhYmxlZCA9IGZhbHNlLFxuKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICBidG4uY2xhc3NOYW1lID0gXCJuYXRpdmUtc2xpZGVzLW5hdi1idG5cIjtcbiAgYnRuLnRleHRDb250ZW50ID0gbGFiZWw7XG4gIGJ0bi50aXRsZSA9IHRpcDtcbiAgYnRuLmRpc2FibGVkID0gZGlzYWJsZWQ7XG4gIGlmICghZGlzYWJsZWQpIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25DbGljayk7XG4gIHJldHVybiBidG47XG59XG5cbi8qKlxuICogTWVhc3VyZSB0aGUgdG9wIHRhYiBiYXIgYW5kIGV4cG9zZSBpdHMgaGVpZ2h0IGFzIHRoZSBDU1MgdmFyaWFibGVcbiAqIC0tbmF0aXZlLXNsaWRlcy10YWJiYXItaGVpZ2h0LCByZXR1cm5pbmcgdGhlIChwb3NzaWJseSB1cGRhdGVkKSBjYWNoZWRcbiAqIHZhbHVlLiBUaGUgc2xpZGVzIGJhciBpcyBoaWRkZW4gaW4gU2xpZGVzIG1vZGUsIHNvIHRoZSBsYXN0IG1lYXN1cmVkXG4gKiB2YWx1ZSBpcyByZXVzZWQgdGhlcmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzeW5jVGFiQmFySGVpZ2h0KGNhY2hlZDogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgdGFiQmFyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXG4gICAgXCIud29ya3NwYWNlLXRhYnMubW9kLXRvcCAud29ya3NwYWNlLXRhYi1oZWFkZXItY29udGFpbmVyXCIsXG4gICk7XG4gIGlmICh0YWJCYXIgJiYgdGFiQmFyLm9mZnNldEhlaWdodCA+IDApIGNhY2hlZCA9IHRhYkJhci5vZmZzZXRIZWlnaHQ7XG4gIGlmIChjYWNoZWQgPiAwKSB7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KFwiLS1uYXRpdmUtc2xpZGVzLXRhYmJhci1oZWlnaHRcIiwgYCR7Y2FjaGVkfXB4YCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTm8gbWVhc3VyZW1lbnQgeWV0ICh0YWIgYmFyIGhpZGRlbiBzaW5jZSBsb2FkKSBcdTIwMTQgbGV0IHRoZSBDU1MgZmFsbGJhY2sgYXBwbHkuXG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnJlbW92ZVByb3BlcnR5KFwiLS1uYXRpdmUtc2xpZGVzLXRhYmJhci1oZWlnaHRcIik7XG4gIH1cbiAgcmV0dXJuIGNhY2hlZDtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1hcmtkb3duVmlldywgTm90aWNlLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgTmF0aXZlU2xpZGVzUGx1Z2luIGZyb20gXCIuLi9tYWluXCI7XG5pbXBvcnQgeyBpc0xpdmVQcmV2aWV3IH0gZnJvbSBcIi4vbW9kZVwiO1xuXG4vKipcbiAqIFR5cG9ncmFwaHktbWVhc3VyZW1lbnQgdG9vbGluZyAoZGV2IGJ1aWxkcyBvbmx5KS5cbiAqXG4gKiBUaGUgYG5zLWRlYnVnLXN0eWxlc2AgY29tbWFuZCBzYW1wbGVzIHRoZSBmaXhlZCBvbmUtcGFnZSBzYW1wbGUgbm90ZXMgaW5cbiAqIGVkaXQgKExpdmUgUHJldmlldykgYW5kIHRoZSBraXRjaGVuLXNpbmsgbm90ZSBpbiByZWFkaW5nIHZpZXcsIG1lcmdlcyB0aGVcbiAqIHJlc3VsdHMsIGNvbXB1dGVzIGFuIGVkaXQtdnMtcmVhZGluZyBkaWZmIGFuZCB3cml0ZXMgaXQgdG9cbiAqIC5uYXRpdmUtc2xpZGVzLWRlYnVnLmpzb24gaW4gdGhlIHZhdWx0IHJvb3QuIFJlZ2lzdGVyZWQgb25seSB3aGVuIHRoZVxuICogYnVpbGQtdGltZSBERVZfTU9ERSBmbGFnIGlzIHRydWU7IHJlbGVhc2UgYnVpbGRzIHRyZWUtc2hha2UgdGhpcyBtb2R1bGUgb3V0LlxuICovXG5cbi8qKiBGaXhlZCBvbmUtcGFnZSBzYW1wbGUgbm90ZXMgdXNlZCBieSB0aGUgZGVidWcgY29tbWFuZCAoZWRpdCBzaWRlKSAqL1xuZXhwb3J0IGNvbnN0IFNBTVBMRV9OT1RFX05BTUVTID0gW1xuICBcInR5cG9ncmFwaHktc2FtcGxlLWhlYWRpbmdzXCIsXG4gIFwidHlwb2dyYXBoeS1zYW1wbGUtbGlzdFwiLFxuICBcInR5cG9ncmFwaHktc2FtcGxlLWNvZGVcIixcbiAgXCJ0eXBvZ3JhcGh5LXNhbXBsZS1xdW90ZVwiLFxuICBcInR5cG9ncmFwaHktc2FtcGxlLW1lZGlhXCIsXG5dO1xuXG4vKiogU3R5bGUgc2VjdGlvbnMgc2FtcGxlZCBieSBzYW1wbGVTdHlsZXMoKSBhbmQgY29tcGFyZWQgYnkgZGlmZkR1bXBzKCkgKi9cbmNvbnN0IFNUWUxFX1NFQ1RJT05TID0gW1xuICBcImNvbnRhaW5lclwiLFxuICBcInBhcmFncmFwaFwiLFxuICBcImgxXCIsXG4gIFwibGlzdEl0ZW1cIixcbiAgXCJjb2RlQmxvY2tcIixcbiAgXCJibG9ja3F1b3RlXCIsXG4gIFwiaW5saW5lQ29kZVwiLFxuICBcInRhYmxlXCIsXG4gIFwiaW1hZ2VcIixcbiAgXCJob3Jpem9udGFsUnVsZVwiLFxuXTtcblxuLyoqIFByb21pc2UtYmFzZWQgc2xlZXAgKi9cbmZ1bmN0aW9uIHNsZWVwKG1zOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XG59XG5cbi8qKlxuICogTWVyZ2Ugbm9uLW1pc3Npbmcgc3R5bGUgc2VjdGlvbnMgb2YgYSBmcmVzaCBzYW1wbGUgaW50byB0aGUgdGFyZ2V0XG4gKiAoZmlyc3Qgbm9uLW1pc3NpbmcgdmFsdWUgd2lucykuXG4gKi9cbmZ1bmN0aW9uIG1lcmdlU2FtcGxlKHRhcmdldDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIHNhbXBsZTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiB2b2lkIHtcbiAgZm9yIChjb25zdCBrZXkgb2YgU1RZTEVfU0VDVElPTlMpIHtcbiAgICBjb25zdCBzZWN0aW9uID0gc2FtcGxlW2tleV0gYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IHVuZGVmaW5lZDtcbiAgICBpZiAoIXNlY3Rpb24gfHwgXCIobWlzc2luZylcIiBpbiBzZWN0aW9uKSBjb250aW51ZTtcbiAgICBjb25zdCBleGlzdGluZyA9IHRhcmdldFtrZXldIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4gfCB1bmRlZmluZWQ7XG4gICAgaWYgKGV4aXN0aW5nICYmICEoXCIobWlzc2luZylcIiBpbiBleGlzdGluZykpIGNvbnRpbnVlO1xuICAgIHRhcmdldFtrZXldID0gc2VjdGlvbjtcbiAgfVxuICAvLyBQcm9iZSBmaWVsZHMgcmlkZSBhbG9uZyAoZmlyc3Qgbm9uLWVtcHR5IHdpbnMpXG4gIGZvciAoY29uc3Qga2V5IG9mIFtcbiAgICBcImxpc3RMaW5lc1wiLFxuICAgIFwibWV0YWRhdGFDb250YWluZXJEaXNwbGF5XCIsXG4gICAgXCJoMU9mZnNldFRvcFwiLFxuICAgIFwiaDFUb3BJbkNvbnRlbnRcIixcbiAgICBcImgxTGVmdEluQ29udGVudFwiLFxuICAgIFwidGl0bGVcIixcbiAgICBcImNvbnRlbnRDaGlsZHJlblwiLFxuICAgIFwidG9wQ2hhaW5cIixcbiAgXSkge1xuICAgIGNvbnN0IHByb2JlID0gc2FtcGxlW2tleV07XG4gICAgaWYgKHByb2JlID09PSB1bmRlZmluZWQgfHwgcHJvYmUgPT09IG51bGwpIGNvbnRpbnVlO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHByb2JlKSAmJiBwcm9iZS5sZW5ndGggPT09IDApIGNvbnRpbnVlO1xuICAgIGlmICh0eXBlb2YgcHJvYmUgPT09IFwib2JqZWN0XCIgJiYgIUFycmF5LmlzQXJyYXkocHJvYmUpICYmIE9iamVjdC5rZXlzKHByb2JlKS5sZW5ndGggPT09IDApXG4gICAgICBjb250aW51ZTtcbiAgICBpZiAodGFyZ2V0W2tleV0gPT09IHVuZGVmaW5lZCkgdGFyZ2V0W2tleV0gPSBwcm9iZTtcbiAgfVxufVxuXG4vKipcbiAqIENvbXBhcmUgdGhlIHN0eWxlIHNlY3Rpb25zIG9mIGFuIGVkaXQgZHVtcCBhbmQgYSByZWFkaW5nIGR1bXA7IG9ubHlcbiAqIGtleXMgd2hvc2UgdmFsdWVzIGRpZmZlciBhcmUga2VwdCwgYXMgeyBrZXk6IHsgZWRpdCwgcmVhZGluZyB9IH0uXG4gKi9cbmZ1bmN0aW9uIGRpZmZEdW1wcyhcbiAgZWRpdDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gIHJlYWRpbmc6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICBjb25zdCBvdXQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG4gIGZvciAoY29uc3Qgc2VjdGlvbiBvZiBTVFlMRV9TRUNUSU9OUykge1xuICAgIGNvbnN0IGUgPSAoZWRpdFtzZWN0aW9uXSA/PyB7fSkgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgICBjb25zdCByID0gKHJlYWRpbmdbc2VjdGlvbl0gPz8ge30pIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gICAgY29uc3Qga2V5cyA9IG5ldyBTZXQoWy4uLk9iamVjdC5rZXlzKGUpLCAuLi5PYmplY3Qua2V5cyhyKV0pO1xuICAgIGNvbnN0IGRpZmZzOiBSZWNvcmQ8c3RyaW5nLCB7IGVkaXQ6IHN0cmluZzsgcmVhZGluZzogc3RyaW5nIH0+ID0ge307XG4gICAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgICAgaWYgKGVba2V5XSAhPT0gcltrZXldKSB7XG4gICAgICAgIGRpZmZzW2tleV0gPSB7IGVkaXQ6IGVba2V5XSA/PyBcIihtaXNzaW5nKVwiLCByZWFkaW5nOiByW2tleV0gPz8gXCIobWlzc2luZylcIiB9O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoT2JqZWN0LmtleXMoZGlmZnMpLmxlbmd0aCA+IDApIG91dFtzZWN0aW9uXSA9IGRpZmZzO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKiBTYW1wbGUgdGhlIGN1cnJlbnQgdmlldydzIHR5cG9ncmFwaHkgY29tcHV0ZWQgc3R5bGVzICsgQ1NTIHZhcmlhYmxlcyAqL1xuZnVuY3Rpb24gc2FtcGxlU3R5bGVzKGFwcDogQXBwKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsIHtcbiAgY29uc3QgdmlldyA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICBpZiAoIXZpZXcpIHJldHVybiBudWxsO1xuICBjb25zdCBpc0VkaXQgPSB2aWV3LmdldE1vZGUoKSA9PT0gXCJzb3VyY2VcIjtcbiAgY29uc3QgY29udGVudEVsID0gdmlldy5jb250ZW50RWw7XG4gIC8vIEZpcnN0IG1hdGNoaW5nIGNhbmRpZGF0ZSB3aW5zIFx1MjAxNCBlZGl0IChjbTYpIGFuZCByZWFkaW5nIHVzZVxuICAvLyBkaWZmZXJlbnQgZWxlbWVudCBzdHJ1Y3R1cmVzIChlLmcuIG5vIHByZS9ibG9ja3F1b3RlIGluIGNtNikuXG4gIGNvbnN0IHBpY2sgPSAoc2Vsczogc3RyaW5nW10pOiBIVE1MRWxlbWVudCB8IG51bGwgPT4ge1xuICAgIGZvciAoY29uc3Qgc2VsIG9mIHNlbHMpIHtcbiAgICAgIGNvbnN0IGVsID0gY29udGVudEVsLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KHNlbCk7XG4gICAgICBpZiAoZWwpIHJldHVybiBlbDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH07XG4gIGNvbnN0IHN0eWxlID0gKGVsOiBIVE1MRWxlbWVudCB8IG51bGwsIHByb3BzOiBzdHJpbmdbXSk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPT4ge1xuICAgIGlmICghZWwpIHJldHVybiB7IFwiKG1pc3NpbmcpXCI6IFwiZWxlbWVudCBub3QgaW4gdGhpcyBub3RlXCIgfTtcbiAgICBjb25zdCBjcyA9IGdldENvbXB1dGVkU3R5bGUoZWwpO1xuICAgIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgIGZvciAoY29uc3QgcCBvZiBwcm9wcykge1xuICAgICAgY29uc3QgdiA9IGNzLmdldFByb3BlcnR5VmFsdWUocCkudHJpbSgpO1xuICAgICAgaWYgKHYpIG91dFtwXSA9IHY7XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG4gIH07XG4gIGNvbnN0IHZhcnMgPSBnZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmJvZHkpO1xuICBjb25zdCBjc3NWYXIgPSAobmFtZTogc3RyaW5nKTogc3RyaW5nID0+IHZhcnMuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKS50cmltKCk7XG5cbiAgY29uc3QgY29udGFpbmVyID0gcGljayhbXG4gICAgaXNFZGl0XG4gICAgICA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLmNtLWNvbnRlbnRcIlxuICAgICAgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlld1wiLFxuICBdKTtcbiAgY29uc3QgcGFyYSA9IHBpY2soW1xuICAgIGlzRWRpdFxuICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IC5jbS1saW5lOm5vdCguSHlwZXJNRC1oZWFkZXIpXCJcbiAgICAgIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgcFwiLFxuICBdKTtcbiAgY29uc3QgaDEgPSBwaWNrKFtcbiAgICBpc0VkaXQgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IC5jbS1oZWFkZXItMVwiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IGgxXCIsXG4gICAgaXNFZGl0XG4gICAgICA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgaDFcIlxuICAgICAgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlldyBoMVwiLFxuICBdKTtcbiAgY29uc3QgbGlzdEl0ZW0gPSBwaWNrKFtcbiAgICBpc0VkaXQgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IC5IeXBlck1ELWxpc3QtbGluZVwiIDogXCIubWFya2Rvd24tcHJldmlldy12aWV3IHVsID4gbGlcIixcbiAgICBpc0VkaXQgPyBcIi5IeXBlck1ELWxpc3QtbGluZVwiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgdWwgPiBsaVwiLFxuICBdKTtcbiAgY29uc3QgcHJlID0gcGljayhbXG4gICAgaXNFZGl0XG4gICAgICA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgcHJlXCJcbiAgICAgIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgcHJlXCIsXG4gICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAuY20tZWRpdGluZyBwcmVcIiA6IFwiLm1hcmtkb3duLXByZXZpZXctdmlldyBwcmVcIixcbiAgICBpc0VkaXQgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IC5IeXBlck1ELWNvZGVibG9ja1wiIDogXCIubWFya2Rvd24tcHJldmlldy12aWV3IHByZVwiLFxuICBdKTtcbiAgY29uc3QgcXVvdGUgPSBwaWNrKFtcbiAgICBpc0VkaXQgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IGJsb2NrcXVvdGVcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyBibG9ja3F1b3RlXCIsXG4gICAgaXNFZGl0XG4gICAgICA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgLkh5cGVyTUQtcXVvdGVcIlxuICAgICAgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlldyBibG9ja3F1b3RlXCIsXG4gIF0pO1xuICBjb25zdCBpbmxpbmVDb2RlID0gcGljayhbXG4gICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiBjb2RlXCIgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgY29kZVwiLFxuICAgIGlzRWRpdFxuICAgICAgPyBcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202IC5jbS1pbmxpbmUtY29kZVwiXG4gICAgICA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IGNvZGVcIixcbiAgXSk7XG4gIGNvbnN0IHRhYmxlID0gcGljayhbXG4gICAgaXNFZGl0ID8gXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiB0YWJsZVwiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IHRhYmxlXCIsXG4gICAgaXNFZGl0ID8gXCIuY20tbGluZSB0YWJsZVwiIDogXCIubWFya2Rvd24tcmVhZGluZy12aWV3IC5tYXJrZG93bi1wcmV2aWV3LXZpZXcgdGFibGVcIixcbiAgXSk7XG4gIGNvbnN0IGltZyA9IHBpY2soW1xuICAgIGlzRWRpdCA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgaW1nXCIgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgaW1nXCIsXG4gICAgaXNFZGl0ID8gXCIuY20tbGluZSBpbWdcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IGltZ1wiLFxuICAgIFwiaW1nXCIsIC8vIHdob2xlLWRvY3VtZW50IGZhbGxiYWNrXG4gIF0pO1xuICBjb25zdCBociA9IHBpY2soW1xuICAgIGlzRWRpdCA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTYgaHJcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyBoclwiLFxuICAgIGlzRWRpdCA/IFwiLmNtLWxpbmUgaHJcIiA6IFwiLm1hcmtkb3duLXJlYWRpbmctdmlldyAubWFya2Rvd24tcHJldmlldy12aWV3IGhyXCIsXG4gICAgaXNFZGl0ID8gXCIuY20taHJcIiA6IFwiLm1hcmtkb3duLXByZXZpZXctdmlldyBoclwiLFxuICBdKTtcblxuICAvLyBTdHJ1Y3R1cmUgcHJvYmVzIChlZGl0IHZpZXcgb25seSk6IHRoZSBzb3VyY2UtdmlldyBjbGFzcyBsaXN0XG4gIC8vIChjb25maXJtcyB0aGUgTGl2ZSBQcmV2aWV3IG1hcmtlciBjbGFzcykgYW5kIHVuaXF1ZSBlbGVtZW50IHRhZ3NcbiAgLy8gaW5zaWRlIHRoZSBlZGl0b3IgKHJldmVhbHMgaG93IGNtNiByZW5kZXJzIGNvZGUgYmxvY2tzIGV0Yy4gd2hlblxuICAvLyB0aGUgdXN1YWwgc2VsZWN0b3JzIGRvIG5vdCBtYXRjaCkuXG4gIGNvbnN0IHNvdXJjZVZpZXdDbGFzcyA9IGNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFwiLm1hcmtkb3duLXNvdXJjZS12aWV3Lm1vZC1jbTZcIik/LmNsYXNzTmFtZSA/PyBcIlwiO1xuICBjb25zdCBkb21UYWdzOiBzdHJpbmdbXSA9IFtdO1xuICBpZiAoaXNFZGl0KSB7XG4gICAgY29uc3QgdGFncyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGNvbnRlbnRFbFxuICAgICAgLnF1ZXJ5U2VsZWN0b3JBbGwoXCIubWFya2Rvd24tc291cmNlLXZpZXcubW9kLWNtNiAqXCIpXG4gICAgICAuZm9yRWFjaCgoZWwpID0+IHRhZ3MuYWRkKGVsLnRhZ05hbWUudG9Mb3dlckNhc2UoKSkpO1xuICAgIGRvbVRhZ3MucHVzaCguLi50YWdzKTtcbiAgfVxuICAvLyBMaXN0LWxpbmUgcHJvYmUgKGVkaXQgdmlldyBvbmx5KTogY2xhc3MgbmFtZXMgKyBjb21wdXRlZCBwYWRkaW5nXG4gIC8vIG9mIHRoZSBmaXJzdCBsaXN0IGxpbmVzIFx1MjAxNCBuZXN0ZWQgbGV2ZWxzIG9mdGVuIHVzZSBkaXN0aW5jdFxuICAvLyBjbGFzc2VzIG9yIGlubGluZSBwYWRkaW5ncywgd2hpY2ggZGVjaWRlcyB3aGV0aGVyIGEgbGV2ZWwtYXdhcmVcbiAgLy8gaW5kZW50IG92ZXJyaWRlIGlzIGV2ZW4gcG9zc2libGUuXG4gIGNvbnN0IGxpc3RMaW5lczogeyBjbGFzc05hbWU6IHN0cmluZzsgcGFkZGluZ0xlZnQ6IHN0cmluZyB9W10gPSBbXTtcbiAgaWYgKGlzRWRpdCkge1xuICAgIGNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yQWxsKFwiLkh5cGVyTUQtbGlzdC1saW5lXCIpLmZvckVhY2goKGVsLCBpKSA9PiB7XG4gICAgICBpZiAoaSA+PSA0KSByZXR1cm47XG4gICAgICBjb25zdCBjcyA9IGdldENvbXB1dGVkU3R5bGUoZWwpO1xuICAgICAgbGlzdExpbmVzLnB1c2goe1xuICAgICAgICBjbGFzc05hbWU6IGVsLmNsYXNzTmFtZSxcbiAgICAgICAgcGFkZGluZ0xlZnQ6IGNzLmdldFByb3BlcnR5VmFsdWUoXCJwYWRkaW5nLWxlZnRcIikudHJpbSgpLFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgLy8gRnJvbnRtYXR0ZXIgcHJvYmVzOiBkb2VzIHRoZSAoaGlkZGVuKSBwcm9wZXJ0aWVzIGFyZWEgc3RpbGxcbiAgLy8gb2NjdXB5IHNwYWNlIGluIExpdmUgUHJldmlldz8gQW5kIGhvdyBmYXIgaXMgdGhlIEgxIGZyb20gdGhlXG4gIC8vIHRvcCBvZiB0aGUgY29udGVudCBhcmVhPyAocmVhZGluZyBtb2RlIGhhcyBubyBzdWNoIHBhZGRpbmcpXG4gIGNvbnN0IG1ldGFkYXRhRGlzcGxheSA9ICgoKSA9PiB7XG4gICAgY29uc3Qgc2VsID0gaXNFZGl0XG4gICAgICA/IFwiLm1hcmtkb3duLXNvdXJjZS12aWV3IC5tZXRhZGF0YS1jb250YWluZXJcIlxuICAgICAgOiBcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1ldGFkYXRhLWNvbnRhaW5lclwiO1xuICAgIGNvbnN0IGVsID0gY29udGVudEVsLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KHNlbCk7XG4gICAgcmV0dXJuIGVsID8gZ2V0Q29tcHV0ZWRTdHlsZShlbCkuZGlzcGxheSA6IFwiKG5vdCBpbiBET00pXCI7XG4gIH0pKCk7XG4gIGNvbnN0IGgxT2Zmc2V0VG9wID0gKCgpID0+IHtcbiAgICBpZiAoIWgxKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGxldCB0b3AgPSAwO1xuICAgIGxldCBub2RlOiBIVE1MRWxlbWVudCB8IG51bGwgPSBoMTtcbiAgICB3aGlsZSAobm9kZSAmJiBub2RlICE9PSBjb250ZW50RWwgJiYgbm9kZSAhPT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgdG9wICs9IG5vZGUub2Zmc2V0VG9wO1xuICAgICAgbm9kZSA9IG5vZGUub2Zmc2V0UGFyZW50IGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHRvcDtcbiAgfSkoKTtcbiAgLy8gV2hhdCBvY2N1cGllcyB0aGUgc3BhY2UgYmV0d2VlbiB0aGUgY29udGVudCB0b3AgYW5kIHRoZSBIMT9cbiAgLy8gKGVkaXQpIGZpcnN0IGNoaWxkcmVuIG9mIC5jbS1jb250ZW50LCBhbmQgdGhlIG5ldCBIMSBkaXN0YW5jZVxuICAvLyBmcm9tIHRoZSBjb250ZW50IGFuY2hvciBcdTIwMTQgcmVhZGluZyBoYXMgbm8gc3VjaCBnYXAuXG4gIGNvbnN0IGFuY2hvciA9IGlzRWRpdFxuICAgID8gY29udGVudEVsLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFwiLmNtLWNvbnRlbnRcIilcbiAgICA6IGNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcIi5tYXJrZG93bi1yZWFkaW5nLXZpZXcgLm1hcmtkb3duLXByZXZpZXctdmlld1wiKTtcbiAgY29uc3QgaDFUb3BJbkNvbnRlbnQgPSAoKCkgPT4ge1xuICAgIGlmICghaDEgfHwgIWFuY2hvcikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChoMS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgLSBhbmNob3IuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wKTtcbiAgfSkoKTtcbiAgY29uc3QgaDFMZWZ0SW5Db250ZW50ID0gKCgpID0+IHtcbiAgICBpZiAoIWgxIHx8ICFhbmNob3IpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoaDEuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCAtIGFuY2hvci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0KTtcbiAgfSkoKTtcbiAgY29uc3QgY29udGVudENoaWxkcmVuID0gKCgpID0+IHtcbiAgICBpZiAoIWFuY2hvcikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShhbmNob3IuY2hpbGRyZW4pXG4gICAgICAuc2xpY2UoMCwgNClcbiAgICAgIC5tYXAoKGVsKSA9PiB7XG4gICAgICAgIGNvbnN0IGNzID0gZ2V0Q29tcHV0ZWRTdHlsZShlbCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY2xzOiAoZWwgYXMgSFRNTEVsZW1lbnQpLmNsYXNzTmFtZSB8fCBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCksXG4gICAgICAgICAgZGlzcGxheTogY3MuZGlzcGxheSxcbiAgICAgICAgICBoZWlnaHQ6IE1hdGgucm91bmQoZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0KSxcbiAgICAgICAgICBtYXJnaW5Ub3A6IGNzLm1hcmdpblRvcCxcbiAgICAgICAgICBwYWRkaW5nVG9wOiBjcy5wYWRkaW5nVG9wLFxuICAgICAgICAgIG1hcmdpbkJvdHRvbTogY3MubWFyZ2luQm90dG9tLFxuICAgICAgICAgIHBhZGRpbmdCb3R0b206IGNzLnBhZGRpbmdCb3R0b20sXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgfSkoKTtcbiAgLy8gQ29udGFpbmVyIGNoYWluIHByb2JlOiBmcm9tIC5jbS1jb250ZW50IHVwIHRvIHRoZSB2aWV3LWNvbnRlbnQsXG4gIC8vIGVhY2ggd3JhcHBlcidzIHBhZGRpbmcvbWFyZ2luIFx1MjAxNCBsb2NhdGVzIHRoZSBsZWZ0b3ZlciB2ZXJ0aWNhbFxuICAvLyBvZmZzZXQgYmV0d2VlbiBlZGl0IGFuZCByZWFkaW5nIGNvbnRlbnQgYXJlYXMuXG4gIGNvbnN0IHRvcENoYWluID0gKCgpID0+IHtcbiAgICBpZiAoIWFuY2hvcikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBjb25zdCBwYXJ0czogeyBjbHM6IHN0cmluZzsgcGFkVG9wOiBzdHJpbmc7IG1hclRvcDogc3RyaW5nIH1bXSA9IFtdO1xuICAgIGxldCBub2RlOiBIVE1MRWxlbWVudCB8IG51bGwgPSBhbmNob3I7XG4gICAgd2hpbGUgKG5vZGUgJiYgbm9kZSAhPT0gY29udGVudEVsICYmIG5vZGUgIT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgIGNvbnN0IGNzID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICAgIHBhcnRzLnB1c2goe1xuICAgICAgICBjbHM6IG5vZGUuY2xhc3NOYW1lIHx8IG5vZGUudGFnTmFtZS50b0xvd2VyQ2FzZSgpLFxuICAgICAgICBwYWRUb3A6IGNzLnBhZGRpbmdUb3AsXG4gICAgICAgIG1hclRvcDogY3MubWFyZ2luVG9wLFxuICAgICAgfSk7XG4gICAgICBub2RlID0gbm9kZS5wYXJlbnRFbGVtZW50O1xuICAgIH1cbiAgICByZXR1cm4gcGFydHM7XG4gIH0pKCk7XG5cbiAgLy8gVGl0bGUgcHJvYmU6IHRoZSBnZW5lcmF0ZWQgOjpiZWZvcmUgaW4gU2xpZGVzIG1vZGUgKHdoZW4gYSB0aXRsZSBpc1xuICAvLyBjb25maWd1cmVkKS4gQ2FwdHVyZXMgaXRzIGNvbXB1dGVkIHN0eWxlIHNvIHdlIGNhbiBkaWZmIGl0IGFnYWluc3QgdGhlXG4gIC8vIGJvZHkgSDEgKC5jbS1oZWFkZXItMSkgYW5kIGFsaWduIHRoZW0gZXhhY3RseS5cbiAgY29uc3QgdGl0bGVCZWZvcmUgPSAoKCkgPT4ge1xuICAgIGlmICghaXNFZGl0KSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBjb250ZW50RWwucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCIuY20tY29udGVudFwiKTtcbiAgICBpZiAoIWNvbnRlbnQgfHwgIWNvbnRlbnQuaGFzQXR0cmlidXRlKFwiZGF0YS1zbGlkZXMtdGl0bGVcIikpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3QgY3MgPSBnZXRDb21wdXRlZFN0eWxlKGNvbnRlbnQsIFwiOjpiZWZvcmVcIik7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnQ6IGNzLmNvbnRlbnQsXG4gICAgICBkaXNwbGF5OiBjcy5kaXNwbGF5LFxuICAgICAgcG9zaXRpb246IGNzLnBvc2l0aW9uLFxuICAgICAgdG9wOiBjcy50b3AsXG4gICAgICBsZWZ0OiBjcy5sZWZ0LFxuICAgICAgcGFkZGluZ1RvcDogY3MucGFkZGluZ1RvcCxcbiAgICAgIGZvbnRGYW1pbHk6IGNzLmZvbnRGYW1pbHksXG4gICAgICBmb250U2l6ZTogY3MuZm9udFNpemUsXG4gICAgICBsaW5lSGVpZ2h0OiBjcy5saW5lSGVpZ2h0LFxuICAgICAgZm9udFdlaWdodDogY3MuZm9udFdlaWdodCxcbiAgICAgIGZvbnRWYXJpYW50OiBjcy5mb250VmFyaWFudCxcbiAgICAgIGNvbG9yOiBjcy5jb2xvcixcbiAgICAgIGxldHRlclNwYWNpbmc6IGNzLmxldHRlclNwYWNpbmcsXG4gICAgICB0ZXh0VHJhbnNmb3JtOiBjcy50ZXh0VHJhbnNmb3JtLFxuICAgICAgd29yZFNwYWNpbmc6IGNzLndvcmRTcGFjaW5nLFxuICAgICAgZm9udEtlcm5pbmc6IGNzLmZvbnRLZXJuaW5nLFxuICAgICAgZm9udEZlYXR1cmVTZXR0aW5nczogY3MuZm9udEZlYXR1cmVTZXR0aW5ncyxcbiAgICAgIGZvbnRWYXJpYW50TnVtZXJpYzogY3MuZm9udFZhcmlhbnROdW1lcmljLFxuICAgICAgZm9udFZhcmlhbnRMaWdhdHVyZXM6IGNzLmZvbnRWYXJpYW50TGlnYXR1cmVzLFxuICAgICAgZm9udFZhcmlhbnRDYXBzOiBjcy5mb250VmFyaWFudENhcHMsXG4gICAgfTtcbiAgfSkoKTtcblxuICBjb25zdCBkdW1wID0ge1xuICAgIG1vZGU6IGlzRWRpdCA/IFwiZWRpdCAoTGl2ZSBQcmV2aWV3KVwiIDogXCJyZWFkaW5nXCIsXG4gICAgLy8gU2xpZGVzIHN0eWxpbmcgb25seSBhcHBsaWVzIHdoZW4gU2xpZGVzIG1vZGUgaXMgb25cbiAgICBzbGlkZXNBY3RpdmU6IGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmNvbnRhaW5zKFwibmF0aXZlLXNsaWRlcy1tb2RlXCIpLFxuICAgIGRvbVRhZ3M6IGlzRWRpdCA/IGRvbVRhZ3MgOiB1bmRlZmluZWQsXG4gICAgc291cmNlVmlld0NsYXNzOiBpc0VkaXQgPyBzb3VyY2VWaWV3Q2xhc3MgOiB1bmRlZmluZWQsXG4gICAgbGl2ZVByZXZpZXc6IGlzRWRpdCA/IGlzTGl2ZVByZXZpZXcoYXBwKSA6IHVuZGVmaW5lZCxcbiAgICBsaXN0TGluZXM6IGlzRWRpdCA/IGxpc3RMaW5lcyA6IHVuZGVmaW5lZCxcbiAgICBtZXRhZGF0YUNvbnRhaW5lckRpc3BsYXk6IG1ldGFkYXRhRGlzcGxheSxcbiAgICBoMU9mZnNldFRvcDogaDFPZmZzZXRUb3AsXG4gICAgaDFUb3BJbkNvbnRlbnQ6IGgxVG9wSW5Db250ZW50LFxuICAgIGgxTGVmdEluQ29udGVudDogaDFMZWZ0SW5Db250ZW50LFxuICAgIGNvbnRlbnRDaGlsZHJlbjogY29udGVudENoaWxkcmVuLFxuICAgIHRvcENoYWluOiB0b3BDaGFpbixcbiAgICB0aXRsZTogdGl0bGVCZWZvcmUsXG4gICAgY29udGFpbmVyOiBzdHlsZShjb250YWluZXIsIFtcbiAgICAgIFwiZm9udC1mYW1pbHlcIixcbiAgICAgIFwiZm9udC1zaXplXCIsXG4gICAgICBcImxpbmUtaGVpZ2h0XCIsXG4gICAgICBcIm1heC13aWR0aFwiLFxuICAgICAgXCJ3aWR0aFwiLFxuICAgICAgXCJwYWRkaW5nLXRvcFwiLFxuICAgICAgXCJwYWRkaW5nLXJpZ2h0XCIsXG4gICAgICBcInBhZGRpbmctYm90dG9tXCIsXG4gICAgICBcInBhZGRpbmctbGVmdFwiLFxuICAgICAgXCJjb2xvclwiLFxuICAgICAgXCJ0ZXh0LWFsaWduXCIsXG4gICAgXSksXG4gICAgcGFyYWdyYXBoOiBzdHlsZShwYXJhLCBbXG4gICAgICBcImZvbnQtc2l6ZVwiLFxuICAgICAgXCJsaW5lLWhlaWdodFwiLFxuICAgICAgXCJtYXJnaW4tdG9wXCIsXG4gICAgICBcIm1hcmdpbi1ib3R0b21cIixcbiAgICAgIFwibWFyZ2luLWxlZnRcIixcbiAgICAgIFwibWFyZ2luLXJpZ2h0XCIsXG4gICAgICBcInRleHQtaW5kZW50XCIsXG4gICAgICBcInRleHQtYWxpZ25cIixcbiAgICBdKSxcbiAgICBoMTogc3R5bGUoaDEsIFtcbiAgICAgIFwiZm9udC1mYW1pbHlcIixcbiAgICAgIFwiZm9udC1zaXplXCIsXG4gICAgICBcImxpbmUtaGVpZ2h0XCIsXG4gICAgICBcImZvbnQtd2VpZ2h0XCIsXG4gICAgICBcImZvbnQtdmFyaWFudFwiLFxuICAgICAgXCJjb2xvclwiLFxuICAgICAgXCJsZXR0ZXItc3BhY2luZ1wiLFxuICAgICAgXCJ0ZXh0LXRyYW5zZm9ybVwiLFxuICAgICAgXCJ3b3JkLXNwYWNpbmdcIixcbiAgICAgIFwiZm9udC1rZXJuaW5nXCIsXG4gICAgICBcImZvbnQtZmVhdHVyZS1zZXR0aW5nc1wiLFxuICAgICAgXCJmb250LXZhcmlhbnQtbnVtZXJpY1wiLFxuICAgICAgXCJmb250LXZhcmlhbnQtbGlnYXR1cmVzXCIsXG4gICAgICBcImZvbnQtdmFyaWFudC1jYXBzXCIsXG4gICAgICBcIm1hcmdpbi10b3BcIixcbiAgICAgIFwibWFyZ2luLWJvdHRvbVwiLFxuICAgICAgXCJ0ZXh0LWFsaWduXCIsXG4gICAgXSksXG4gICAgbGlzdEl0ZW06IHN0eWxlKGxpc3RJdGVtLCBbXG4gICAgICBcInBhZGRpbmctbGVmdFwiLFxuICAgICAgXCJtYXJnaW4tbGVmdFwiLFxuICAgICAgXCJtYXJnaW4tcmlnaHRcIixcbiAgICAgIFwidGV4dC1pbmRlbnRcIixcbiAgICAgIFwibGluZS1oZWlnaHRcIixcbiAgICAgIFwidGV4dC1hbGlnblwiLFxuICAgIF0pLFxuICAgIGNvZGVCbG9jazogc3R5bGUocHJlLCBbXG4gICAgICBcImZvbnQtc2l6ZVwiLFxuICAgICAgXCJsaW5lLWhlaWdodFwiLFxuICAgICAgXCJwYWRkaW5nLXRvcFwiLFxuICAgICAgXCJwYWRkaW5nLXJpZ2h0XCIsXG4gICAgICBcInBhZGRpbmctYm90dG9tXCIsXG4gICAgICBcInBhZGRpbmctbGVmdFwiLFxuICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCIsXG4gICAgICBcImJvcmRlci1yYWRpdXNcIixcbiAgICBdKSxcbiAgICBibG9ja3F1b3RlOiBzdHlsZShxdW90ZSwgW1xuICAgICAgXCJwYWRkaW5nLXRvcFwiLFxuICAgICAgXCJwYWRkaW5nLXJpZ2h0XCIsXG4gICAgICBcInBhZGRpbmctYm90dG9tXCIsXG4gICAgICBcInBhZGRpbmctbGVmdFwiLFxuICAgICAgXCJtYXJnaW4tdG9wXCIsXG4gICAgICBcIm1hcmdpbi1ib3R0b21cIixcbiAgICAgIFwiYm9yZGVyLWxlZnQtd2lkdGhcIixcbiAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiLFxuICAgIF0pLFxuICAgIGlubGluZUNvZGU6IHN0eWxlKGlubGluZUNvZGUsIFtcbiAgICAgIFwiZm9udC1zaXplXCIsXG4gICAgICBcInBhZGRpbmctdG9wXCIsXG4gICAgICBcInBhZGRpbmctYm90dG9tXCIsXG4gICAgICBcInBhZGRpbmctbGVmdFwiLFxuICAgICAgXCJwYWRkaW5nLXJpZ2h0XCIsXG4gICAgICBcImJhY2tncm91bmQtY29sb3JcIixcbiAgICAgIFwiYm9yZGVyLXJhZGl1c1wiLFxuICAgIF0pLFxuICAgIHRhYmxlOiBzdHlsZSh0YWJsZSwgW1wiZm9udC1zaXplXCIsIFwibGluZS1oZWlnaHRcIiwgXCJ3aWR0aFwiLCBcImJvcmRlci1jb2xsYXBzZVwiXSksXG4gICAgaW1hZ2U6IHN0eWxlKGltZywgW1wiZGlzcGxheVwiLCBcIm1hcmdpbi1sZWZ0XCIsIFwibWFyZ2luLXJpZ2h0XCIsIFwibWF4LXdpZHRoXCIsIFwid2lkdGhcIl0pLFxuICAgIGhvcml6b250YWxSdWxlOiBzdHlsZShociwgW1wibWFyZ2luLXRvcFwiLCBcIm1hcmdpbi1ib3R0b21cIiwgXCJib3JkZXItdG9wLXdpZHRoXCIsIFwiaGVpZ2h0XCJdKSxcbiAgICBjc3NWYXJpYWJsZXM6IHtcbiAgICAgIFwiLS1mb250LXRleHRcIjogY3NzVmFyKFwiLS1mb250LXRleHRcIiksXG4gICAgICBcIi0tbGluZS1oZWlnaHQtbm9ybWFsXCI6IGNzc1ZhcihcIi0tbGluZS1oZWlnaHQtbm9ybWFsXCIpLFxuICAgICAgXCItLWgxLXNpemVcIjogY3NzVmFyKFwiLS1oMS1zaXplXCIpLFxuICAgICAgXCItLWgxLWxpbmUtaGVpZ2h0XCI6IGNzc1ZhcihcIi0taDEtbGluZS1oZWlnaHRcIiksXG4gICAgICBcIi0taDEtd2VpZ2h0XCI6IGNzc1ZhcihcIi0taDEtd2VpZ2h0XCIpLFxuICAgICAgXCItLWgxLXZhcmlhbnRcIjogY3NzVmFyKFwiLS1oMS12YXJpYW50XCIpLFxuICAgICAgXCItLWgxLWNvbG9yXCI6IGNzc1ZhcihcIi0taDEtY29sb3JcIiksXG4gICAgICBcIi0taDEtbWFyZ2luLXRvcFwiOiBjc3NWYXIoXCItLWgxLW1hcmdpbi10b3BcIiksXG4gICAgICBcIi0taDEtbWFyZ2luLWJvdHRvbVwiOiBjc3NWYXIoXCItLWgxLW1hcmdpbi1ib3R0b21cIiksXG4gICAgICBcIi0tcC1zcGFjaW5nXCI6IGNzc1ZhcihcIi0tcC1zcGFjaW5nXCIpLFxuICAgICAgXCItLWxpc3Qtc3BhY2luZ1wiOiBjc3NWYXIoXCItLWxpc3Qtc3BhY2luZ1wiKSxcbiAgICAgIFwiLS1saXN0LWluZGVudFwiOiBjc3NWYXIoXCItLWxpc3QtaW5kZW50XCIpLFxuICAgICAgXCItLWNvZGUtc2l6ZVwiOiBjc3NWYXIoXCItLWNvZGUtc2l6ZVwiKSxcbiAgICAgIFwiLS1jb2RlLXBhZGRpbmdcIjogY3NzVmFyKFwiLS1jb2RlLXBhZGRpbmdcIiksXG4gICAgICBcIi0tY29kZS1yYWRpdXNcIjogY3NzVmFyKFwiLS1jb2RlLXJhZGl1c1wiKSxcbiAgICAgIFwiLS1ibG9ja3F1b3RlLXBhZGRpbmdcIjogY3NzVmFyKFwiLS1ibG9ja3F1b3RlLXBhZGRpbmdcIiksXG4gICAgICBcIi0tYmxvY2txdW90ZS1ib3JkZXItdGhpY2tuZXNzXCI6IGNzc1ZhcihcIi0tYmxvY2txdW90ZS1ib3JkZXItdGhpY2tuZXNzXCIpLFxuICAgICAgXCItLWZpbGUtbWFyZ2luc1wiOiBjc3NWYXIoXCItLWZpbGUtbWFyZ2luc1wiKSxcbiAgICAgIFwiLS1maWxlLWxpbmUtd2lkdGhcIjogY3NzVmFyKFwiLS1maWxlLWxpbmUtd2lkdGhcIiksXG4gICAgICBcIi0tbm9ybWFsLWZvbnQtc2l6ZVwiOiBjc3NWYXIoXCItLW5vcm1hbC1mb250LXNpemVcIiksXG4gICAgICBcIi0tZm9udC10ZXh0LXNpemVcIjogY3NzVmFyKFwiLS1mb250LXRleHQtc2l6ZVwiKSxcbiAgICB9LFxuICB9O1xuICByZXR1cm4gZHVtcDtcbn1cblxuLyoqXG4gKiBEZWJ1ZyB0eXBvZ3JhcGh5OiBzYW1wbGVzIHRoZSBmaXhlZCBvbmUtcGFnZSBzYW1wbGUgbm90ZXMgKGVhY2hcbiAqIGNvdmVyaW5nIGEgZ3JvdXAgb2YgZWxlbWVudHMgXHUyMDE0IGFsbCB2aXNpYmxlIHdpdGhvdXQgc2Nyb2xsaW5nKSxcbiAqIHRoZW4gdGhlIGtpdGNoZW4tc2luayBub3RlIGluIHJlYWRpbmcgdmlldyAobm8gdmlydHVhbGl6YXRpb25cbiAqIHRoZXJlKSwgbWVyZ2VzIGV2ZXJ5dGhpbmcsIGNvbXB1dGVzIHRoZSBlZGl0LXZzLXJlYWRpbmcgZGlmZiBhbmRcbiAqIHdyaXRlcyBpdCB0byAubmF0aXZlLXNsaWRlcy1kZWJ1Zy5qc29uIGluIHRoZSB2YXVsdCByb290LlxuICogVGhlIHVzZXIncyBvd24gbm90ZSBpcyByZXN0b3JlZCBhdCB0aGUgZW5kLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZHVtcFR5cG9ncmFwaHkocGx1Z2luOiBOYXRpdmVTbGlkZXNQbHVnaW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgYXBwID0gcGx1Z2luLmFwcDtcbiAgaWYgKCFkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5jb250YWlucyhcIm5hdGl2ZS1zbGlkZXMtbW9kZVwiKSkge1xuICAgIG5ldyBOb3RpY2UoXCJOYXRpdmUgU2xpZGVzOiBlbnRlciBTbGlkZXMgbW9kZSBmaXJzdCAoTW9kK1NoaWZ0K0Ugb24gYSBkZWNrIG5vdGUpXCIpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB2aWV3ID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gIGlmICghdmlldykge1xuICAgIG5ldyBOb3RpY2UoXCJOYXRpdmUgU2xpZGVzOiBubyBhY3RpdmUgTWFya2Rvd24gbm90ZVwiKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3Qgc3RhcnRNb2RlID0gdmlldy5nZXRNb2RlKCk7XG4gIGNvbnN0IGFjdGl2ZUZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgY29uc3QgbGVhZiA9IGFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSk7XG5cbiAgLy8gRWRpdCBzaWRlOiBlYWNoIHNob3J0IG5vdGUga2VlcHMgZXZlcnkgdGFyZ2V0IGVsZW1lbnQgb24gc2NyZWVuXG4gIGNvbnN0IGVkaXQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG4gIGZvciAoY29uc3QgbmFtZSBvZiBTQU1QTEVfTk9URV9OQU1FUykge1xuICAgIGNvbnN0IGYgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGAke25hbWV9Lm1kYCk7XG4gICAgaWYgKCEoZiBpbnN0YW5jZW9mIFRGaWxlKSkgY29udGludWU7XG4gICAgYXdhaXQgbGVhZi5vcGVuRmlsZShmLCB7IHN0YXRlOiB7IG1vZGU6IFwic291cmNlXCIgfSB9KTtcbiAgICBhd2FpdCBzbGVlcCg1MDApO1xuICAgIGNvbnN0IHMgPSBzYW1wbGVTdHlsZXMoYXBwKTtcbiAgICBpZiAocykgbWVyZ2VTYW1wbGUoZWRpdCwgcyk7XG4gIH1cblxuICAvLyBSZWFkaW5nIHNpZGU6IHRoZSBraXRjaGVuLXNpbmsgbm90ZSByZW5kZXJzIGV2ZXJ5dGhpbmcgYXQgb25jZVxuICBsZXQgcmVhZGluZzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsID0gbnVsbDtcbiAgY29uc3QgZGVtbyA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoXCJ0eXBvZ3JhcGh5LWRlbW8ubWRcIik7XG4gIGlmIChkZW1vIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGRlbW8sIHsgc3RhdGU6IHsgbW9kZTogXCJwcmV2aWV3XCIgfSB9KTtcbiAgICBhd2FpdCBzbGVlcCg4MDApO1xuICAgIHJlYWRpbmcgPSBzYW1wbGVTdHlsZXMoYXBwKTtcbiAgfVxuXG4gIC8vIFJlc3RvcmUgdGhlIHVzZXIncyBub3RlXG4gIGlmIChhY3RpdmVGaWxlKSB7XG4gICAgYXdhaXQgbGVhZi5vcGVuRmlsZShhY3RpdmVGaWxlLCB7IHN0YXRlOiB7IG1vZGU6IHN0YXJ0TW9kZSB9IH0pO1xuICAgIHBsdWdpbi5yZWZyZXNoKCk7XG4gIH1cbiAgaWYgKCFyZWFkaW5nKSB7XG4gICAgbmV3IE5vdGljZShcIk5hdGl2ZSBTbGlkZXM6IHJlYWRpbmcgc2FtcGxlIGZhaWxlZFwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBwYXlsb2FkID0geyBlZGl0LCByZWFkaW5nLCBkaWZmOiBkaWZmRHVtcHMoZWRpdCwgcmVhZGluZykgfTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBhcHAudmF1bHQuYWRhcHRlci53cml0ZShcIi5uYXRpdmUtc2xpZGVzLWRlYnVnLmpzb25cIiwgSlNPTi5zdHJpbmdpZnkocGF5bG9hZCwgbnVsbCwgMikpO1xuICAgIG5ldyBOb3RpY2UoXCJUeXBvZ3JhcGh5IGR1bXAgXHUyMTkyIC5uYXRpdmUtc2xpZGVzLWRlYnVnLmpzb24gKHZhdWx0IHJvb3QpXCIpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIG5ldyBOb3RpY2UoYE5hdGl2ZSBTbGlkZXM6IGNvdWxkIG5vdCB3cml0ZSBkZWJ1ZyBmaWxlICgke1N0cmluZyhlcnJvcil9KWApO1xuICB9XG4gIGNvbnNvbGUubG9nKFwiW25hdGl2ZS1zbGlkZXMgZGVidWctc3R5bGVzXVwiLCBKU09OLnN0cmluZ2lmeShwYXlsb2FkLCBudWxsLCAyKSk7XG59XG5cbi8qKiBSZWdpc3RlciB0aGUgZGV2LW9ubHkgZGVidWcgY29tbWFuZCAoY2FsbGVkIG9ubHkgd2hlbiBERVZfTU9ERSBpcyB0cnVlKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckRlYnVnQ29tbWFuZChwbHVnaW46IE5hdGl2ZVNsaWRlc1BsdWdpbik6IHZvaWQge1xuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwibnMtZGVidWctc3R5bGVzXCIsXG4gICAgbmFtZTogXCJEZWJ1ZzogRHVtcCBUeXBvZ3JhcGh5IFN0eWxlc1wiLFxuICAgIGNhbGxiYWNrOiAoKSA9PiB2b2lkIGR1bXBUeXBvZ3JhcGh5KHBsdWdpbiksXG4gIH0pO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTWFya2Rvd25WaWV3LCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG4vKiogTW9kZSBvZiB0aGUgYWN0aXZlIE1hcmtkb3duIHZpZXc6ICdwcmV2aWV3Jz1yZWFkaW5nICdzb3VyY2UnPWVkaXRpbmcgJyc9bm9uZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGN1cnJlbnRNb2RlKGFwcDogQXBwKTogXCJwcmV2aWV3XCIgfCBcInNvdXJjZVwiIHwgXCJcIiB7XG4gIGNvbnN0IHZpZXcgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgcmV0dXJuIHZpZXcgPyAodmlldy5nZXRNb2RlKCkgYXMgXCJwcmV2aWV3XCIgfCBcInNvdXJjZVwiKSA6IFwiXCI7XG59XG5cbi8qKlxuICogVHJ1ZSB3aGVuIHRoZSBhY3RpdmUgZWRpdCB2aWV3IGlzIExpdmUgUHJldmlldyAoU2xpZGVzKSBcdTIwMTQgYXNcbiAqIG9wcG9zZWQgdG8gU291cmNlIG1vZGUuIE9ic2lkaWFuIHJlcG9ydHMgYm90aCBhcyBtb2RlIFwic291cmNlXCI7XG4gKiB0aGUgdmlldyBzdGF0ZSBjYXJyaWVzIGEgYHNvdXJjZWAgZmxhZyAoU291cmNlIG1vZGUgPSB0cnVlKSwgd2l0aFxuICogYSBET00gY2xhc3MgZmFsbGJhY2sgKC5pcy1saXZlLXByZXZpZXcpIGZvciBzYWZldHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0xpdmVQcmV2aWV3KGFwcDogQXBwKTogYm9vbGVhbiB7XG4gIGNvbnN0IHZpZXcgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgaWYgKCF2aWV3IHx8IHZpZXcuZ2V0TW9kZSgpICE9PSBcInNvdXJjZVwiKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IHN0YXRlID0gdmlldy5nZXRTdGF0ZSgpIGFzIHsgc291cmNlPzogYm9vbGVhbiB9O1xuICBpZiAoc3RhdGUuc291cmNlID09PSB0cnVlKSByZXR1cm4gZmFsc2U7XG4gIGlmIChzdGF0ZS5zb3VyY2UgPT09IGZhbHNlKSByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuICEhdmlldy5jb250ZW50RWwucXVlcnlTZWxlY3RvcihcIi5tYXJrZG93bi1zb3VyY2Utdmlldy5tb2QtY202LmlzLWxpdmUtcHJldmlld1wiKTtcbn1cblxuLyoqIEZyb250bWF0dGVyIG9mIGFueSBub3RlIGFzIGFuIG9iamVjdCwgb3IgbnVsbCB3aGVuIGFic2VudCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZyb250bWF0dGVyT2YoYXBwOiBBcHAsIGZpbGU6IFRGaWxlKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsIHtcbiAgY29uc3QgY2FjaGUgPSBhcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG4gIHJldHVybiBjYWNoZT8uZnJvbnRtYXR0ZXIgPz8gbnVsbDtcbn1cblxuLyoqIEN1cnJlbnQgbm90ZSdzIGZyb250bWF0dGVyIGFzIGFuIG9iamVjdCwgb3IgbnVsbCB3aGVuIGFic2VudCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFjdGl2ZUZyb250bWF0dGVyKGFwcDogQXBwKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsIHtcbiAgY29uc3QgZmlsZSA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICByZXR1cm4gZmlsZSA/IGZyb250bWF0dGVyT2YoYXBwLCBmaWxlKSA6IG51bGw7XG59XG4iLCAiLyoqIEEgYnVpbHQtaW4gU2xpZGVzIHN0eWxlIHRlbXBsYXRlIChyZW5kZXJlZCBhcyBib2R5IGNsYXNzIGBuYXRpdmUtc2xpZGVzLXRoZW1lLTxpZD5gKSAqL1xuZXhwb3J0IGludGVyZmFjZSBTbGlkZXNUaGVtZSB7XG4gIGlkOiBzdHJpbmc7XG4gIGxhYmVsOiBzdHJpbmc7XG59XG5cbi8qKiBCdWlsdC1pbiBzdHlsZSB0ZW1wbGF0ZXMgZm9yIHRoZSBTbGlkZXMgY2FyZCArIGJhciAoYWxsIHRoZW1lLWFkYXB0aXZlKSAqL1xuZXhwb3J0IGNvbnN0IFNMSURFU19USEVNRVM6IHJlYWRvbmx5IFNsaWRlc1RoZW1lW10gPSBbXG4gIHsgaWQ6IFwiZGFzaGVkXCIsIGxhYmVsOiBcIkRhc2hlZCBvdXRsaW5lXCIgfSxcbiAgeyBpZDogXCJwYXBlclwiLCBsYWJlbDogXCJQYXBlciBjYXJkXCIgfSxcbiAgeyBpZDogXCJtaW5pbWFsXCIsIGxhYmVsOiBcIk1pbmltYWxcIiB9LFxuICB7IGlkOiBcImFjY2VudFwiLCBsYWJlbDogXCJBY2NlbnQgZWRnZVwiIH0sXG4gIHsgaWQ6IFwiZ2xhc3NcIiwgbGFiZWw6IFwiRnJvc3RlZCBnbGFzc1wiIH0sXG4gIHsgaWQ6IFwibGVjdHVyZVwiLCBsYWJlbDogXCJMZWN0dXJlICh3aWtpKVwiIH0sXG5dO1xuXG4vKiogUGx1Z2luIHNldHRpbmdzICovXG5leHBvcnQgaW50ZXJmYWNlIE5hdGl2ZVNsaWRlc1NldHRpbmdzIHtcbiAgLyoqIFNob3cgXHUyNUMwIFx1MjVCNiBwcmV2aW91cy9uZXh0IGJ1dHRvbnMgb24gdGhlIGxlZnQgb2YgdGhlIHNsaWRlcyBiYXIgKi9cbiAgc2hvd05hdkJ1dHRvbnM6IGJvb2xlYW47XG4gIC8qKiBTaG93IHRoZSBhdXRvLWNvbXB1dGVkIHBhZ2UgbnVtYmVyIGF0IHRoZSBib3R0b20tcmlnaHQgb2YgdGhlIHNsaWRlcyBiYXIgKi9cbiAgc2hvd1BhZ2VOdW1iZXI6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoZSB1c2VyIG1hbnVhbGx5IGhpZCB0aGUgc2xpZGVzIGJhciAodG9nZ2xlIGNvbW1hbmQpICovXG4gIGJhckhpZGRlbjogYm9vbGVhbjtcbiAgLyoqIEF1dG8tZW50ZXIgU2xpZGVzIG1vZGUgd2hlbiBvcGVuaW5nIGEgZGVjayBub3RlIChkZWZhdWx0IG9mZikgKi9cbiAgYXV0b0VudGVyU2xpZGVzOiBib29sZWFuO1xuICAvKiogRnJvbnRtYXR0ZXIgcHJvcGVydHkgc2hvd24gYXMgdGhlIGNhcmQgdGl0bGUgKFwiXCIgPSBub25lLCBcImZpbGVuYW1lXCIgPSBmaWxlIG5hbWUpICovXG4gIHNsaWRlc1RpdGxlOiBzdHJpbmc7XG4gIC8qKiBTdHlsZSB0ZW1wbGF0ZSBpZCBmcm9tIFNMSURFU19USEVNRVMgKGNhcmQgKyBiYXIgYXBwZWFyYW5jZSkgKi9cbiAgc2xpZGVzVGhlbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IE5hdGl2ZVNsaWRlc1NldHRpbmdzID0ge1xuICBzaG93TmF2QnV0dG9uczogdHJ1ZSxcbiAgc2hvd1BhZ2VOdW1iZXI6IHRydWUsXG4gIGJhckhpZGRlbjogZmFsc2UsXG4gIGF1dG9FbnRlclNsaWRlczogZmFsc2UsXG4gIHNsaWRlc1RpdGxlOiBcIlwiLFxuICBzbGlkZXNUaGVtZTogXCJkYXNoZWRcIixcbn07XG5cbi8qKiBSZXNlcnZlZCBmcm9udG1hdHRlciBrZXkgZHJpdmluZyBkZWNrIG5hdmlnYXRpb24gKG5ldmVyIHJlbmRlcmVkIGFzIGEgY2hpcCkgKi9cbmV4cG9ydCBjb25zdCBERUNLX0tFWSA9IFwiZGVja1wiO1xuIiwgImltcG9ydCB0eXBlIE5hdGl2ZVNsaWRlc1BsdWdpbiBmcm9tIFwiLi4vbWFpblwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJEZWJ1Z0NvbW1hbmQgfSBmcm9tIFwiLi9kZWJ1Z1wiO1xuaW1wb3J0IHsgZnJvbnRtYXR0ZXJPZiB9IGZyb20gXCIuL21vZGVcIjtcbmltcG9ydCB7IERFQ0tfS0VZIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuLyoqIFJlZ2lzdGVyIGV2ZXJ5IGNvbW1hbmQ7IHRoZSBkZWJ1ZyBjb21tYW5kIGlzIGRldi1idWlsZCBvbmx5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29tbWFuZHMocGx1Z2luOiBOYXRpdmVTbGlkZXNQbHVnaW4pOiB2b2lkIHtcbiAgLy8gVG9nZ2xlIHRoZSBzbGlkZXMgYmFyICh3aXRoaW4gU2xpZGVzIG1vZGUpXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJucy10b2dnbGUtYmFyXCIsXG4gICAgbmFtZTogXCJUb2dnbGUgU2xpZGVzIEJhclwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBwbHVnaW4uc2V0dGluZ3MuYmFySGlkZGVuID0gIXBsdWdpbi5zZXR0aW5ncy5iYXJIaWRkZW47XG4gICAgICBhd2FpdCBwbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICBwbHVnaW4ucmVmcmVzaCgpO1xuICAgIH0sXG4gIH0pO1xuICAvLyBIaWRlIC8gc2hvdyB0aGUgbW91c2UgcG9pbnRlciB3aW5kb3ctd2lkZSAocHJlc2VudGluZzsgU2xpZGVzIG1vZGUgb25seSlcbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcIm5zLXRvZ2dsZS1wb2ludGVyXCIsXG4gICAgbmFtZTogXCJUb2dnbGUgTW91c2UgUG9pbnRlclwiLFxuICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJNXCIgfV0sXG4gICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB7XG4gICAgICBpZiAoIWRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmNvbnRhaW5zKFwibmF0aXZlLXNsaWRlcy1tb2RlXCIpKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoIWNoZWNraW5nKSBwbHVnaW4udG9nZ2xlUG9pbnRlcigpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgfSk7XG4gIC8vIFByZXZpb3VzIC8gbmV4dCBwYWdlIChkZWNrIG5hdmlnYXRpb247IGVudGVyaW5nIFNsaWRlcyBtb2RlIGFzIG5lZWRlZClcbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcIm5zLXByZXZcIixcbiAgICBuYW1lOiBcIlByZXZpb3VzIFBhZ2VcIixcbiAgICBob3RrZXlzOiBbeyBtb2RpZmllcnM6IFtcIk1vZFwiLCBcIlNoaWZ0XCJdLCBrZXk6IFwiQXJyb3dMZWZ0XCIgfV0sXG4gICAgY2FsbGJhY2s6ICgpID0+IHBsdWdpbi5uYXZpZ2F0ZShcInByZXZcIiksXG4gIH0pO1xuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwibnMtbmV4dFwiLFxuICAgIG5hbWU6IFwiTmV4dCBQYWdlXCIsXG4gICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIiwgXCJTaGlmdFwiXSwga2V5OiBcIkFycm93UmlnaHRcIiB9XSxcbiAgICBjYWxsYmFjazogKCkgPT4gcGx1Z2luLm5hdmlnYXRlKFwibmV4dFwiKSxcbiAgfSk7XG4gIC8vIENyZWF0ZSBOZXh0IFNsaWRlIFx1MjAxNCBuZXcgc2xpZGUgYWZ0ZXIgdGhlIGN1cnJlbnQgb25lIChkZWNrIG5vdGVzIG9ubHkpXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJucy1jcmVhdGUtbmV4dFwiLFxuICAgIG5hbWU6IFwiQ3JlYXRlIE5leHQgU2xpZGVcIixcbiAgICAvLyBHcmV5ZWQgb3V0IGluIHRoZSBwYWxldHRlIHVubGVzcyB0aGUgYWN0aXZlIG5vdGUgY2FuIHRha2UgYSBuZXh0IHNsaWRlXG4gICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB7XG4gICAgICBjb25zdCBmaWxlID0gcGx1Z2luLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgICAgaWYgKCFmaWxlKSByZXR1cm4gZmFsc2U7XG4gICAgICBjb25zdCBwbGFuID0gcGx1Z2luLmRlY2tTZXJ2aWNlLnBsYW5DcmVhdGVOZXh0KGZpbGUpO1xuICAgICAgaWYgKCFwbGFuKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoIWNoZWNraW5nKSB2b2lkIHBsdWdpbi5kZWNrU2VydmljZS5leGVjdXRlQ3JlYXRlTmV4dChmaWxlLCBwbGFuKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG4gIH0pO1xuICAvLyBUb2dnbGUgU2xpZGVzIG1vZGUgXHUyMDE0IHRoZSBpbW1lcnNpdmUgY2FyZCB2aWV3IChkZWNrIG5vdGVzIG9ubHkpXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJucy10b2dnbGUtc2xpZGVzXCIsXG4gICAgbmFtZTogXCJUb2dnbGUgU2xpZGVzIE1vZGVcIixcbiAgICBob3RrZXlzOiBbeyBtb2RpZmllcnM6IFtcIk1vZFwiLCBcIlNoaWZ0XCJdLCBrZXk6IFwiRVwiIH1dLFxuICAgIGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZykgPT4ge1xuICAgICAgY29uc3QgZmlsZSA9IHBsdWdpbi5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICAgIGlmICghZmlsZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgY29uc3QgZm0gPSBmcm9udG1hdHRlck9mKHBsdWdpbi5hcHAsIGZpbGUpO1xuICAgICAgaWYgKGZtID09PSBudWxsIHx8ICEoREVDS19LRVkgaW4gZm0pKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoIWNoZWNraW5nKSBwbHVnaW4udG9nZ2xlU2xpZGVzKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuICB9KTtcbiAgLy8gRGVidWcgdG9vbGluZyBcdTIwMTQgcmVnaXN0ZXJlZCBvbmx5IGluIGRldiBidWlsZHMgKHRyZWUtc2hha2VuIGluIHJlbGVhc2UpXG4gIGlmIChERVZfTU9ERSkgcmVnaXN0ZXJEZWJ1Z0NvbW1hbmQocGx1Z2luKTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IHBsYW5DcmVhdGVOZXh0IGFzIHBsYW4sIHR5cGUgQ3JlYXRlTmV4dFJlc3VsdCB9IGZyb20gXCIuL2NyZWF0ZU5leHRcIjtcbmltcG9ydCB7IGNvbXB1dGVEZWNrLCBleHRyYWN0TGlua3MsIGV4dHJhY3RSYXdMaW5rcywgdHlwZSBEZWNrSW5mbyB9IGZyb20gXCIuL2RlY2tcIjtcbmltcG9ydCB7IGZyb250bWF0dGVyT2YgfSBmcm9tIFwiLi9tb2RlXCI7XG5pbXBvcnQgeyBERUNLX0tFWSB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbi8qKiBEZWNrIGNoYWluIHJlc29sdXRpb24gKyBcIkNyZWF0ZSBOZXh0IFNsaWRlXCIgZ2x1ZSAod3JhcHMgdGhlIHB1cmUgY29yZSkuICovXG5leHBvcnQgY2xhc3MgRGVja1NlcnZpY2Uge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwKSB7fVxuXG4gIC8qKiBSZXNvbHZlIHRoZSBjdXJyZW50IG5vdGUncyBwb3NpdGlvbiBpbnNpZGUgaXRzIGRlY2sgKHBhdGgtYmFzZWQgd3JhcHBlcikgKi9cbiAgY29tcHV0ZShmaWxlOiBURmlsZSk6IERlY2tJbmZvIHwgbnVsbCB7XG4gICAgcmV0dXJuIGNvbXB1dGVEZWNrKGZpbGUucGF0aCwgKHBhdGgpID0+IHRoaXMubGlua1BhdGhzKHBhdGgpKTtcbiAgfVxuXG4gIC8qKiBSZXNvbHZlIHRoZSBgZGVja2AgcHJvcGVydHkgb2YgYSBub3RlIGludG8gcmVhbCBub3RlIHBhdGhzIChtYXggdHdvKSAqL1xuICBwcml2YXRlIGxpbmtQYXRocyhwYXRoOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZiA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcbiAgICBpZiAoIShmIGluc3RhbmNlb2YgVEZpbGUpKSByZXR1cm4gW107XG4gICAgY29uc3QgZm0gPSBmcm9udG1hdHRlck9mKHRoaXMuYXBwLCBmKTtcbiAgICBjb25zdCBuYW1lcyA9IGZtID8gZXh0cmFjdExpbmtzKGZtW0RFQ0tfS0VZXSkgOiBbXTtcbiAgICByZXR1cm4gbmFtZXNcbiAgICAgIC5tYXAoKG5hbWUpID0+IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3QobmFtZSwgcGF0aCkpXG4gICAgICAuZmlsdGVyKCh4KTogeCBpcyBURmlsZSA9PiAhIXgpXG4gICAgICAubWFwKCh4KSA9PiB4LnBhdGgpO1xuICB9XG5cbiAgLyoqIE5hbWVzIGluIHRoZSBgZGVja2AgcHJvcGVydHkgdGhhdCByZXNvbHZlIHRvIG5vIG5vdGUgKGJyb2tlbiBsaW5rcykgKi9cbiAgYnJva2VuKGZpbGU6IFRGaWxlKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGZtID0gZnJvbnRtYXR0ZXJPZih0aGlzLmFwcCwgZmlsZSk7XG4gICAgY29uc3QgbmFtZXMgPSBmbSA/IGV4dHJhY3RMaW5rcyhmbVtERUNLX0tFWV0pIDogW107XG4gICAgcmV0dXJuIG5hbWVzLmZpbHRlcigobmFtZSkgPT4gIXRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3QobmFtZSwgZmlsZS5wYXRoKSk7XG4gIH1cblxuICAvKipcbiAgICogUGxhbiBhIFwiQ3JlYXRlIE5leHQgU2xpZGVcIiBydW4gZm9yIHRoZSBhY3RpdmUgbm90ZSwgb3IgbnVsbCB3aGVuIHRoZVxuICAgKiBub3RlIGNhbm5vdCB0YWtlIGEgbmV4dCBzbGlkZSAobm8gdXNhYmxlIGBkZWNrYCBwcm9wZXJ0eSkuXG4gICAqXG4gICAqIFNsaWRlcyBvbiB0aGUgY2hhaW4gaW5zZXJ0L2FwcGVuZCBhZnRlciB0aGUgY3VycmVudCBub3RlOyB0aGUgb3ZlcnZpZXdcbiAgICogcGFnZSBpbnNlcnRzIGEgbmV3IGZpcnN0IHBhZ2U7IGFuIG9mZi1jaGFpbiBub3RlIHdpdGggYSByZXNvbHZhYmxlXG4gICAqIG92ZXJ2aWV3IGxpbmsgc3RpbGwgZ2V0cyBpdHMgZGVjbGFyZWQgbWlzc2luZyBuZXh0IG5vdGUgY3JlYXRlZC5cbiAgICovXG4gIHBsYW5DcmVhdGVOZXh0KGZpbGU6IFRGaWxlKTogQ3JlYXRlTmV4dFJlc3VsdCB8IG51bGwge1xuICAgIGNvbnN0IGZtID0gZnJvbnRtYXR0ZXJPZih0aGlzLmFwcCwgZmlsZSk7XG4gICAgY29uc3QgcmF3ID0gZm0gPyBleHRyYWN0UmF3TGlua3MoZm1bREVDS19LRVldKSA6IFtdO1xuICAgIGlmIChyYXcubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICAgIGNvbnN0IGRlY2sgPSB0aGlzLmNvbXB1dGUoZmlsZSk7XG4gICAgY29uc3QgZXhpc3RpbmdOYW1lcyA9IG5ldyBTZXQodGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpLm1hcCgoZikgPT4gZi5iYXNlbmFtZSkpO1xuXG4gICAgaWYgKGRlY2spIHtcbiAgICAgIC8vIE92ZXJ2aWV3IGluc2VydGlvbiBuZWVkcyB0aGUgb2xkIGZpcnN0IHBhZ2UncyBiYWNrIGxpbmsgdG8gdGhlXG4gICAgICAvLyBvdmVydmlldyAoaXRzIG93biBmcm9udG1hdHRlciBvbmx5IGxpbmtzIGZvcndhcmQpLlxuICAgICAgbGV0IG92ZXJ2aWV3QmFja0xpbms6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChkZWNrLmluZGV4ID09PSAwKSB7XG4gICAgICAgIGNvbnN0IG9sZEZpcnN0ID0gZGVjay5jaGFpblsxXSA/IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChkZWNrLmNoYWluWzFdKSA6IG51bGw7XG4gICAgICAgIGlmIChvbGRGaXJzdCBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICAgICAgY29uc3QgZjIgPSBmcm9udG1hdHRlck9mKHRoaXMuYXBwLCBvbGRGaXJzdCk7XG4gICAgICAgICAgb3ZlcnZpZXdCYWNrTGluayA9IGYyID8gZXh0cmFjdFJhd0xpbmtzKGYyW0RFQ0tfS0VZXSlbMF0gOiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBwbGFuKHtcbiAgICAgICAgY3VycmVudE5hbWU6IGZpbGUuYmFzZW5hbWUsXG4gICAgICAgIGN1cnJlbnRMaW5rczogcmF3LFxuICAgICAgICBpc092ZXJ2aWV3OiBkZWNrLmluZGV4ID09PSAwLFxuICAgICAgICBvdmVydmlld0JhY2tMaW5rLFxuICAgICAgICBleGlzdGluZ05hbWVzLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gT2ZmLWNoYWluIG5vdGU6IHN0aWxsIGNyZWF0ZSBpdHMgZGVjbGFyZWQgbWlzc2luZyBuZXh0IG5vdGUgd2hlbiB0aGVcbiAgICAvLyBvdmVydmlldyBsaW5rIHJlc29sdmVzICh0aGUgXHUyNkEwIGJyb2tlbi1saW5rIHdhcm5pbmcgZGlzYXBwZWFycykuXG4gICAgY29uc3Qgb3ZlcnZpZXdOYW1lID0gcmF3Lmxlbmd0aCA+PSAyID8gZXh0cmFjdExpbmtzKHJhd1swXSlbMF0gOiBudWxsO1xuICAgIGlmIChvdmVydmlld05hbWUgJiYgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChvdmVydmlld05hbWUsIGZpbGUucGF0aCkpIHtcbiAgICAgIHJldHVybiBwbGFuKHtcbiAgICAgICAgY3VycmVudE5hbWU6IGZpbGUuYmFzZW5hbWUsXG4gICAgICAgIGN1cnJlbnRMaW5rczogcmF3LFxuICAgICAgICBpc092ZXJ2aWV3OiBmYWxzZSxcbiAgICAgICAgZXhpc3RpbmdOYW1lcyxcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKiBBcHBseSBhIHBsYW46IGNyZWF0ZSB0aGUgbm90ZSwgcmV3aXJlIGBkZWNrYCBwcm9wZXJ0aWVzLCBvcGVuIGl0ICovXG4gIGFzeW5jIGV4ZWN1dGVDcmVhdGVOZXh0KGZpbGU6IFRGaWxlLCBwbGFuOiBDcmVhdGVOZXh0UmVzdWx0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZGlyID0gZmlsZS5wYXJlbnQ/LnBhdGggPyBmaWxlLnBhcmVudC5wYXRoICsgXCIvXCIgOiBcIlwiO1xuICAgIGNvbnN0IG5ld1BhdGggPSBgJHtkaXJ9JHtwbGFuLm5ld05hbWV9Lm1kYDtcbiAgICBjb25zdCBmcm9udG1hdHRlciA9IHBsYW4ubmV3RGVja0xpbmtzLm1hcCgobGluaykgPT4gSlNPTi5zdHJpbmdpZnkobGluaykpLmpvaW4oXCIsIFwiKTtcbiAgICBjb25zdCBjb250ZW50ID0gYC0tLVxcbmRlY2s6IFske2Zyb250bWF0dGVyfV1cXG4tLS1cXG5gO1xuXG4gICAgbGV0IG5ld0ZpbGU6IFRGaWxlO1xuICAgIHRyeSB7XG4gICAgICBuZXdGaWxlID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKG5ld1BhdGgsIGNvbnRlbnQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBuZXcgTm90aWNlKGBOYXRpdmUgU2xpZGVzOiBjb3VsZCBub3QgY3JlYXRlIFwiJHtwbGFuLm5ld05hbWV9Lm1kXCIgKCR7U3RyaW5nKGVycm9yKX0pYCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmV3aXJlIHRoZSBjdXJyZW50IG5vdGUncyBgZGVja2AgKGtlZXBzIGFsbCBvdGhlciBwcm9wZXJ0aWVzIGludGFjdClcbiAgICBmb3IgKGNvbnN0IHJld3JpdGUgb2YgcGxhbi5yZXdyaXRlcykge1xuICAgICAgaWYgKHJld3JpdGUubmFtZSAhPT0gZmlsZS5iYXNlbmFtZSkgY29udGludWU7IC8vIGluIHByYWN0aWNlIGFsd2F5cyB0aGUgY3VycmVudCBub3RlXG4gICAgICBhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5wcm9jZXNzRnJvbnRNYXR0ZXIoZmlsZSwgKGZtKSA9PiB7XG4gICAgICAgIGZtW0RFQ0tfS0VZXSA9IHJld3JpdGUuZGVjaztcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIE9wZW4gdGhlIG5ldyBub3RlIGluIHRoZSBjdXJyZW50IHBhbmUsIGVkaXQgbW9kZSAoTGl2ZSBQcmV2aWV3KVxuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSk7XG4gICAgYXdhaXQgbGVhZi5vcGVuRmlsZShuZXdGaWxlLCB7IHN0YXRlOiB7IG1vZGU6IFwic291cmNlXCIgfSB9KTtcbiAgfVxufVxuIiwgIi8qKlxuICogZGVjay50cyBcdTIwMTQgUHVyZSBkZWNrLXJlc29sdXRpb24gY29yZSBmb3IgbmF0aXZlLXNsaWRlcy5cbiAqXG4gKiBFdmVyeXRoaW5nIGluIHRoaXMgbW9kdWxlIGlzIGZyZWUgb2YgT2JzaWRpYW4gcnVudGltZSBkZXBlbmRlbmNpZXMgc28gaXQgY2FuXG4gKiBiZSB1bml0IHRlc3RlZCBkaXJlY3RseSAoc2VlIHRlc3QvZGVjay50ZXN0LnRzKS4gbWFpbi50cyBhZGFwdHMgdGhlIHZhdWx0XG4gKiAobWV0YWRhdGFDYWNoZSkgdG8gdGhpcyBwdXJlIGludGVyZmFjZTogaXQgcmVzb2x2ZXMgYGRlY2tgIHByb3BlcnRpZXMgdG9cbiAqIG5vdGUgcGF0aHMsIHRoZW4gaGFuZHMgdGhlIHBhdGggZ3JhcGggdG8gY29tcHV0ZURlY2soKS5cbiAqL1xuXG4vKiogQSBkZWNrIGxpbmsgbGlzdCBuZXZlciBob2xkcyBtb3JlIHRoYW4gdHdvIGVudHJpZXMgKi9cbmV4cG9ydCBjb25zdCBNQVhfREVDS19MSU5LUyA9IDI7XG5cbi8qKiBSZXN1bHQgb2YgcmVzb2x2aW5nIGEgbm90ZSdzIHBvc2l0aW9uIGluc2lkZSBhIGRlY2sgKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVja0luZm8ge1xuICAvKiogQ2hhaW4gb2Ygbm90ZSBwYXRoczogWzBdIGlzIHRoZSBvdmVydmlldyBub3RlLCB0aGVuIHNsaWRlcyBpbiBvcmRlciAqL1xuICBjaGFpbjogc3RyaW5nW107XG4gIC8qKiBJbmRleCBvZiB0aGUgY3VycmVudCBub3RlIGluc2lkZSBjaGFpbiAqL1xuICBpbmRleDogbnVtYmVyO1xufVxuXG4vKipcbiAqIFJlc29sdmUgYSBub3RlJ3MgcG9zaXRpb24gaW5zaWRlIGl0cyBkZWNrIGJ5IHdhbGtpbmcgdGhlIGxpbmsgY2hhaW4uXG4gKlxuICogQ29udmVudGlvbiBmb3IgdGhlIHNpbmdsZSBgZGVja2AgcHJvcGVydHkgKHVwIHRvIHR3byBsaW5rcyk6XG4gKiAgIC0gb3ZlcnZpZXcgbm90ZTogb25lIGxpbmsgXHUyMTkyIHRoYXQgbGluayBJUyB0aGUgZmlyc3QgcGFnZTtcbiAqICAgLSBzbGlkZSBub3RlOiAgICBmaXJzdCBsaW5rIFx1MjE5MiB0aGUgb3ZlcnZpZXcgcGFnZSwgc2Vjb25kIGxpbmsgXHUyMTkyIG5leHQgc2xpZGVcbiAqICAgICAgICAgICAgICAgICAgICAobm8gc2Vjb25kIGxpbmsgb24gdGhlIGxhc3Qgc2xpZGUpLlxuICpcbiAqIGBnZXRMaW5rcyhwYXRoKWAgbXVzdCByZXR1cm4gdGhlIHJlc29sdmVkIG5vdGUgcGF0aHMgb2YgdGhlIGBkZWNrYCBwcm9wZXJ0eVxuICogb2YgdGhlIG5vdGUgYXQgYHBhdGhgIChlbXB0eSB3aGVuIHRoZSBub3RlIGhhcyBub25lLCBvciBpdHMgbGlua3MgYXJlXG4gKiBicm9rZW4gXHUyMDE0IGEgYnJva2VuIGxpbmsgc2ltcGx5IGVuZHMgb3IgZXhjbHVkZXMgdGhlIGNoYWluLCBuZXZlciBjcmFzaGVzKS5cbiAqXG4gKiBSZXR1cm5zIHRoZSBmdWxsIGNoYWluIChbb3ZlcnZpZXcsIHNsaWRlIDEsIHNsaWRlIDIsIFx1MjAyNl0pIGFuZCB0aGUgY3VycmVudFxuICogbm90ZSdzIGluZGV4LCBvciBudWxsIHdoZW4gdGhlIG5vdGUgaXMgbm90IHBhcnQgb2YgYW55IGRlY2suXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlRGVjayhcbiAgY3VycmVudFBhdGg6IHN0cmluZyxcbiAgZ2V0TGlua3M6IChwYXRoOiBzdHJpbmcpID0+IHN0cmluZ1tdLFxuKTogRGVja0luZm8gfCBudWxsIHtcbiAgY29uc3QgY3VycmVudExpbmtzID0gZ2V0TGlua3MoY3VycmVudFBhdGgpO1xuICBpZiAoY3VycmVudExpbmtzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgbGV0IG92ZXJ2aWV3OiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGxldCBmaXJzdFBhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICBpZiAoY3VycmVudExpbmtzLmxlbmd0aCA+PSAyKSB7XG4gICAgLy8gQSBzbGlkZTogZmlyc3QgbGluayBpcyB0aGUgb3ZlcnZpZXcgcGFnZVxuICAgIG92ZXJ2aWV3ID0gY3VycmVudExpbmtzWzBdO1xuICAgIGZpcnN0UGFnZSA9IGdldExpbmtzKG92ZXJ2aWV3KVswXTtcbiAgfSBlbHNlIHtcbiAgICAvLyBBIHNpbmdsZSBsaW5rOiBlaXRoZXIgd2UgQVJFIHRoZSBvdmVydmlldyAobGluayA9IGZpcnN0IHBhZ2UpLFxuICAgIC8vIG9yIHdlIGFyZSB0aGUgbGFzdCBzbGlkZSAobGluayA9IG92ZXJ2aWV3IHBhZ2UpXG4gICAgY29uc3Qgb25seSA9IGN1cnJlbnRMaW5rc1swXTtcbiAgICBjb25zdCBvbmx5TGlua3MgPSBnZXRMaW5rcyhvbmx5KTtcbiAgICBpZiAob25seUxpbmtzWzBdID09PSBjdXJyZW50UGF0aCkge1xuICAgICAgb3ZlcnZpZXcgPSBjdXJyZW50UGF0aDtcbiAgICAgIGZpcnN0UGFnZSA9IG9ubHk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG92ZXJ2aWV3ID0gb25seTtcbiAgICAgIGZpcnN0UGFnZSA9IG9ubHlMaW5rc1swXTtcbiAgICB9XG4gIH1cbiAgaWYgKCFvdmVydmlldyB8fCAhZmlyc3RQYWdlKSByZXR1cm4gbnVsbDtcblxuICAvLyBXYWxrIHRoZSBjaGFpbjogb3ZlcnZpZXcgXHUyMTkyIGZpcnN0IHBhZ2UgXHUyMTkyIG5leHQgXHUyMTkyIG5leHQgXHUyMTkyIFx1MjAyNlxuICBjb25zdCBjaGFpbjogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgdmlzaXRlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBwdXNoID0gKHA6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHZvaWQgPT4ge1xuICAgIGlmIChwICYmICF2aXNpdGVkLmhhcyhwKSkge1xuICAgICAgdmlzaXRlZC5hZGQocCk7XG4gICAgICBjaGFpbi5wdXNoKHApO1xuICAgIH1cbiAgfTtcbiAgcHVzaChvdmVydmlldyk7XG4gIHB1c2goZmlyc3RQYWdlKTtcbiAgbGV0IGN1ciA9IGZpcnN0UGFnZTtcbiAgd2hpbGUgKGN1cikge1xuICAgIGNvbnN0IG5leHQgPSBnZXRMaW5rcyhjdXIpWzFdO1xuICAgIGlmICghbmV4dCB8fCB2aXNpdGVkLmhhcyhuZXh0KSkgYnJlYWs7IC8vIGVuZCBvZiBkZWNrIG9yIGN5Y2xlIGd1YXJkXG4gICAgcHVzaChuZXh0KTtcbiAgICBjdXIgPSBuZXh0O1xuICB9XG5cbiAgY29uc3QgaW5kZXggPSBjaGFpbi5pbmRleE9mKGN1cnJlbnRQYXRoKTtcbiAgaWYgKGluZGV4ID09PSAtMSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiB7IGNoYWluLCBpbmRleCB9O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdXAgdG8gYG1heGAgbm90ZSBuYW1lcyBmcm9tIGEgYGRlY2tgIHByb3BlcnR5IHZhbHVlLlxuICogQWNjZXB0cyBhIHNpbmdsZSBzdHJpbmcgb3IgYSBZQU1MIGxpc3Qgb2Ygc3RyaW5nczsgdW5xdW90ZWQgW1t4XV0gdmFsdWVzIGFyZVxuICogcGFyc2VkIGJ5IFlBTUwgYXMgbmVzdGVkIGFycmF5cyBhbmQgZmxhdHRlbmVkIGhlcmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0TGlua3ModmFsdWU6IHVua25vd24sIG1heDogbnVtYmVyID0gTUFYX0RFQ0tfTElOS1MpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGZsYXQ6IHVua25vd25bXSA9IFtdO1xuICBjb25zdCBjb2xsZWN0ID0gKHY6IHVua25vd24pOiB2b2lkID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHYpIGNvbGxlY3QoaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZsYXQucHVzaCh2KTtcbiAgICB9XG4gIH07XG4gIGNvbGxlY3QodmFsdWUpO1xuXG4gIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBpdGVtIG9mIGZsYXQpIHtcbiAgICBjb25zdCBuYW1lID0gZXh0cmFjdExpbmtUZXh0KGl0ZW0pO1xuICAgIGlmIChuYW1lKSBvdXQucHVzaChuYW1lKTtcbiAgICBpZiAob3V0Lmxlbmd0aCA+PSBtYXgpIGJyZWFrO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogRXh0cmFjdCB1cCB0byBgbWF4YCByYXcgbGluayBzdHJpbmdzIGZyb20gYSBgZGVja2AgcHJvcGVydHkgdmFsdWUgXHUyMDE0IHRoZVxuICogdHJpbW1lZCB2YWx1ZXMgZXhhY3RseSBhcyB3cml0dGVuIChhbGlhcyAvIHBhdGggZm9ybXMgcHJlc2VydmVkKS4gU2FtZVxuICogZmxhdHRlbmluZyBydWxlcyBhcyBleHRyYWN0TGlua3MoKSwgYnV0IHdpdGhvdXQgZXh0cmFjdGluZyB0aGUgdGFyZ2V0IG5hbWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0UmF3TGlua3ModmFsdWU6IHVua25vd24sIG1heDogbnVtYmVyID0gTUFYX0RFQ0tfTElOS1MpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGZsYXQ6IHVua25vd25bXSA9IFtdO1xuICBjb25zdCBjb2xsZWN0ID0gKHY6IHVua25vd24pOiB2b2lkID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHYpIGNvbGxlY3QoaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZsYXQucHVzaCh2KTtcbiAgICB9XG4gIH07XG4gIGNvbGxlY3QodmFsdWUpO1xuXG4gIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBpdGVtIG9mIGZsYXQpIHtcbiAgICBpZiAodHlwZW9mIGl0ZW0gIT09IFwic3RyaW5nXCIpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHRyaW1tZWQgPSBpdGVtLnRyaW0oKTtcbiAgICBpZiAoIXRyaW1tZWQpIGNvbnRpbnVlO1xuICAgIG91dC5wdXNoKHRyaW1tZWQpO1xuICAgIGlmIChvdXQubGVuZ3RoID49IG1heCkgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRoZSB0YXJnZXQgbm90ZSBuYW1lIGZyb20gYSBtYXJrZG93biBsaW5rIHN0cmluZy5cbiAqIEhhbmRsZXMgc2V2ZXJhbCBzaGFwZXM6XG4gKiAgIFwiW1tzbGlkZS0yXV1cIiAgICAgICAgXHUyMTkyIHNsaWRlLTJcbiAqICAgXCJbW3NsaWRlLTJ8YWxpYXNdXVwiICBcdTIxOTIgc2xpZGUtMlxuICogICBcIltbc2xpZGUtMiNzZWN0aW9uXV1cIlx1MjE5MiBzbGlkZS0yXG4gKiAgIHNsaWRlLTIgICAgICAgICAgICAgIFx1MjE5MiBzbGlkZS0yIChiYXJlIGZpbGVuYW1lKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdExpbmtUZXh0KHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHJldHVybiBudWxsO1xuICBjb25zdCB0cmltbWVkID0gdmFsdWUudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQpIHJldHVybiBudWxsO1xuICByZXR1cm4gdHJpbW1lZC5yZXBsYWNlKC9eXFxbXFxbLywgXCJcIikucmVwbGFjZSgvXFxdXFxdJC8sIFwiXCIpLnNwbGl0KFwifFwiKVswXS5zcGxpdChcIiNcIilbMF0udHJpbSgpO1xufVxuXG4vKiogUmVuZGVyIGEgcHJvcGVydHkgdmFsdWUgYXMgcmVhZGFibGUgdGV4dDogYXJyYXlzL29iamVjdHMgXHUyMTkyIEpTT04sIGVsc2UgU3RyaW5nICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0VmFsdWUodmFsdWU6IHVua25vd24pOiBzdHJpbmcge1xuICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFwiXHUyMDE0XCI7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBTdHJpbmcodmFsdWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbn1cbiIsICIvKipcbiAqIGNyZWF0ZU5leHQudHMgXHUyMDE0IFB1cmUgXCJDcmVhdGUgTmV4dCBTbGlkZVwiIHBsYW5uaW5nIGNvcmUgZm9yIG5hdGl2ZS1zbGlkZXMuXG4gKlxuICogRXZlcnl0aGluZyBpbiB0aGlzIG1vZHVsZSBpcyBmcmVlIG9mIE9ic2lkaWFuIHJ1bnRpbWUgZGVwZW5kZW5jaWVzIHNvIGl0IGNhblxuICogYmUgdW5pdCB0ZXN0ZWQgZGlyZWN0bHkgKHNlZSB0ZXN0L2NyZWF0ZU5leHQudGVzdC50cykuIG1haW4udHMgYWRhcHRzIHRoZVxuICogdmF1bHQgKG1ldGFkYXRhQ2FjaGUsIGNvbXB1dGVEZWNrKSB0byB0aGlzIHB1cmUgaW50ZXJmYWNlIGFuZCBhcHBsaWVzIHRoZVxuICogcmVzdWx0aW5nIHBsYW4gd2l0aCB2YXVsdC5jcmVhdGUoKSArIGZpbGVNYW5hZ2VyLnByb2Nlc3NGcm9udE1hdHRlcigpLlxuICpcbiAqIFRoZSBwbGFuIGRlY2lkZXMsIGZvciB0aGUgY3VycmVudCBub3RlOlxuICogICAtIHRoZSBuYW1lIG9mIHRoZSBuZXcgc2xpZGUgZmlsZSAoY29sbGlzaW9uLWF3YXJlKSxcbiAqICAgLSB0aGUgcmF3IGBkZWNrYCBsaW5rIHRleHRzIG9mIHRoZSBuZXcgbm90ZSxcbiAqICAgLSB0aGUgcmV3cml0ZXMgbmVlZGVkIG9uIGV4aXN0aW5nIG5vdGVzIChpbiBwcmFjdGljZSBhbHdheXMgdGhlIGN1cnJlbnRcbiAqICAgICBub3RlIGl0c2VsZikuXG4gKi9cblxuaW1wb3J0IHsgZXh0cmFjdExpbmtUZXh0IH0gZnJvbSBcIi4vZGVja1wiO1xuXG4vKiogSW5wdXRzIGZvciBwbGFubmluZyBcdTIwMTQgcmVzb2x2ZWQgYnkgdGhlIGFkYXB0ZXIgaW4gbWFpbi50cyAqL1xuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVOZXh0SW5wdXQge1xuICAvKiogQmFzZW5hbWUgKHdpdGhvdXQgZXh0ZW5zaW9uKSBvZiB0aGUgY3VycmVudCBub3RlICovXG4gIGN1cnJlbnROYW1lOiBzdHJpbmc7XG4gIC8qKiBSYXcgYGRlY2tgIGxpbmsgdGV4dHMgb2YgdGhlIGN1cnJlbnQgbm90ZSAoZXh0cmFjdGVkLCB1cCB0byB0d28pICovXG4gIGN1cnJlbnRMaW5rczogc3RyaW5nW107XG4gIC8qKiBUcnVlIHdoZW4gdGhlIGN1cnJlbnQgbm90ZSBJUyB0aGUgZGVjaydzIG92ZXJ2aWV3IHBhZ2UgKGNoYWluIGluZGV4IDApICovXG4gIGlzT3ZlcnZpZXc6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBSYXcgbGluayB0ZXh0IHRoZSBvbGQgZmlyc3QgcGFnZSB1c2VzIHRvIGxpbmsgYmFjayB0byB0aGUgb3ZlcnZpZXcuXG4gICAqIE9ubHkgbWVhbmluZ2Z1bCBmb3Igb3ZlcnZpZXcgaW5zZXJ0aW9uICh0aGUgb3ZlcnZpZXcgaXRzZWxmIG9ubHkgbGlua3NcbiAgICogZm9yd2FyZCwgc28gaXRzIG93biBmcm9udG1hdHRlciBjb250YWlucyBubyBzZWxmLXJlZmVyZW5jZSkuXG4gICAqL1xuICBvdmVydmlld0JhY2tMaW5rPzogc3RyaW5nO1xuICAvKiogQmFzZW5hbWVzIG9mIGV2ZXJ5IG1hcmtkb3duIG5vdGUgaW4gdGhlIHZhdWx0IChjb2xsaXNpb24tZnJlZSBuYW1pbmcpICovXG4gIGV4aXN0aW5nTmFtZXM6IFNldDxzdHJpbmc+O1xufVxuXG4vKiogT25lIG5vdGUgd2hvc2UgYGRlY2tgIHByb3BlcnR5IG11c3QgYmUgcmV3cml0dGVuICovXG5leHBvcnQgaW50ZXJmYWNlIERlY2tSZXdyaXRlIHtcbiAgLyoqIEJhc2VuYW1lIG9mIHRoZSBub3RlIHRvIHJld3JpdGUgKi9cbiAgbmFtZTogc3RyaW5nO1xuICAvKiogVGhlIG5ldyByYXcgYGRlY2tgIGxpbmsgdGV4dHMgKHNlcmlhbGl6ZWQgYXMgYSBZQU1MIGxpc3QpICovXG4gIGRlY2s6IHN0cmluZ1tdO1xufVxuXG4vKiogVGhlIGZ1bGwgcGxhbiBmb3IgY3JlYXRpbmcgb25lIG5ldyBzbGlkZSAqL1xuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVOZXh0UmVzdWx0IHtcbiAgLyoqIEJhc2VuYW1lICh3aXRob3V0IGV4dGVuc2lvbikgb2YgdGhlIG5ldyBzbGlkZSBmaWxlICovXG4gIG5ld05hbWU6IHN0cmluZztcbiAgLyoqIFJhdyBgZGVja2AgbGluayB0ZXh0cyBmb3IgdGhlIG5ldyBub3RlJ3MgZnJvbnRtYXR0ZXIgKi9cbiAgbmV3RGVja0xpbmtzOiBzdHJpbmdbXTtcbiAgLyoqIFJld3JpdGVzIHRvIGFwcGx5IHRvIGV4aXN0aW5nIG5vdGVzIChpbiBwcmFjdGljZSBhbHdheXMgdGhlIGN1cnJlbnQgbm90ZSkgKi9cbiAgcmV3cml0ZXM6IERlY2tSZXdyaXRlW107XG59XG5cbi8qKlxuICogUGxhbiB0aGUgY3JlYXRpb24gb2YgYSBuZXcgc2xpZGUgYWZ0ZXIgdGhlIGN1cnJlbnQgbm90ZS5cbiAqXG4gKiBCZWhhdmlvcnM6XG4gKiAgIC0gTGFzdCBzbGlkZSAobm8gc2Vjb25kIGxpbmspOiBhcHBlbmQgYDxjdXJyZW50Pi1uZXh0YCBhcyB0aGUgbmV3IGxhc3RcbiAqICAgICBzbGlkZTsgdGhlIGN1cnJlbnQgbm90ZSBnYWlucyB0aGUgc2Vjb25kIGxpbmsuXG4gKiAgIC0gU2xpZGUgd2l0aCBhIHZhbGlkIG5leHQ6IGluc2VydCBgPGN1cnJlbnQ+LW5leHRgIGJldHdlZW4gdGhlbTsgdGhlIG5ld1xuICogICAgIG5vdGUgdGFrZXMgb3ZlciB0aGUgb2xkIG5leHQgbGluay5cbiAqICAgLSBTbGlkZSB3aG9zZSBzZWNvbmQgbGluayBpcyBicm9rZW4gKHBsYWluLCBub24tZXhpc3RpbmcgbmFtZSk6IGNyZWF0ZVxuICogICAgIGV4YWN0bHkgdGhlIGRlY2xhcmVkIG1pc3Npbmcgbm90ZSBhcyB0aGUgbmV3IGxhc3Qgc2xpZGUgXHUyMDE0IHRoZSBcdTI2QTAgd2FybmluZ1xuICogICAgIGRpc2FwcGVhcnMgYW5kIHRoZSBhdXRob3IncyBpbnRlbnQgaXMgaG9ub3VyZWQuIEEgYnJva2VuIGxpbmsgdGhhdCBpc1xuICogICAgIG5vdCBhIHBsYWluIGJhc2VuYW1lIChwYXRoLXF1YWxpZmllZCwgc2VsZi1yZWZlcmVuY2luZykgaXMgdHJlYXRlZCBhc1xuICogICAgIGludmFsaWQgYW5kIGRyb3BwZWQgKGFwcGVuZCBhIGA8Y3VycmVudD4tbmV4dGAgbGFzdCBzbGlkZSBpbnN0ZWFkKS5cbiAqICAgLSBPdmVydmlldyBwYWdlIChzaW5nbGUgbGluayA9IGZpcnN0IHBhZ2UpOiBpbnNlcnQgYSBuZXcgZmlyc3QgcGFnZTsgdGhlXG4gKiAgICAgb3ZlcnZpZXcncyBsaW5rIHBvaW50cyB0byBpdCBhbmQgdGhlIG9sZCBmaXJzdCBwYWdlIGlzIHB1c2hlZCBiYWNrLlxuICpcbiAqIFJldHVybnMgbnVsbCB3aGVuIHRoZSBub3RlIGhhcyBubyB1c2FibGUgYGRlY2tgIGxpbmtzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGxhbkNyZWF0ZU5leHQoaW5wdXQ6IENyZWF0ZU5leHRJbnB1dCk6IENyZWF0ZU5leHRSZXN1bHQgfCBudWxsIHtcbiAgY29uc3QgeyBjdXJyZW50TmFtZSwgY3VycmVudExpbmtzLCBpc092ZXJ2aWV3IH0gPSBpbnB1dDtcbiAgaWYgKGN1cnJlbnRMaW5rcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBPdmVydmlldyBwYWdlOiBpbnNlcnQgYSBuZXcgZmlyc3QgcGFnZSBhZnRlciBpdCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgaWYgKGlzT3ZlcnZpZXcpIHtcbiAgICBjb25zdCBvbGRGaXJzdCA9IGN1cnJlbnRMaW5rc1swXTtcbiAgICBpZiAoIW9sZEZpcnN0KSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBuZXdOYW1lID0gdW5pcXVlTmFtZShgJHtjdXJyZW50TmFtZX0tbmV4dGAsIGlucHV0LmV4aXN0aW5nTmFtZXMpO1xuICAgIGNvbnN0IGJhY2sgPSBpbnB1dC5vdmVydmlld0JhY2tMaW5rID8/IGBbWyR7Y3VycmVudE5hbWV9XV1gO1xuICAgIHJldHVybiB7XG4gICAgICBuZXdOYW1lLFxuICAgICAgbmV3RGVja0xpbmtzOiBbYmFjaywgb2xkRmlyc3RdLFxuICAgICAgcmV3cml0ZXM6IFt7IG5hbWU6IGN1cnJlbnROYW1lLCBkZWNrOiBbYFtbJHtuZXdOYW1lfV1dYF0gfV0sXG4gICAgfTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTbGlkZTogZmlyc3QgbGluayBpcyB0aGUgb3ZlcnZpZXcgcGFnZSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3Qgb3ZlcnZpZXdMaW5rID0gY3VycmVudExpbmtzWzBdO1xuICBpZiAoIW92ZXJ2aWV3TGluaykgcmV0dXJuIG51bGw7XG4gIGNvbnN0IG5leHRMaW5rID0gY3VycmVudExpbmtzWzFdO1xuXG4gIGlmIChuZXh0TGluaykge1xuICAgIGNvbnN0IG5leHROYW1lID0gZXh0cmFjdExpbmtUZXh0KG5leHRMaW5rKTtcbiAgICBpZiAobmV4dE5hbWUgJiYgaXNQbGFpbk5hbWUobmV4dE5hbWUpICYmIG5leHROYW1lICE9PSBjdXJyZW50TmFtZSkge1xuICAgICAgaWYgKCFpbnB1dC5leGlzdGluZ05hbWVzLmhhcyhuZXh0TmFtZSkpIHtcbiAgICAgICAgLy8gVGhlIGRlY2xhcmVkIG5leHQgbm90ZSBkb2VzIG5vdCBleGlzdCB5ZXQgXHUyMTkyIGNyZWF0ZSBleGFjdGx5IHRoYXRcbiAgICAgICAgLy8gbm90ZSAoZml4ZXMgdGhlIGJyb2tlbi1saW5rIHdhcm5pbmcsIGhvbm91cnMgdGhlIGF1dGhvcidzIGludGVudCkuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbmV3TmFtZTogbmV4dE5hbWUsXG4gICAgICAgICAgbmV3RGVja0xpbmtzOiBbb3ZlcnZpZXdMaW5rXSxcbiAgICAgICAgICByZXdyaXRlczogW10sXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICAvLyBBIHZhbGlkIG5leHQgbm90ZSBleGlzdHMgXHUyMTkyIGluc2VydCBiZXR3ZWVuIGl0IGFuZCB0aGUgY3VycmVudCBub3RlLlxuICAgICAgY29uc3QgbmV3TmFtZSA9IHVuaXF1ZU5hbWUoYCR7Y3VycmVudE5hbWV9LW5leHRgLCBpbnB1dC5leGlzdGluZ05hbWVzKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG5ld05hbWUsXG4gICAgICAgIG5ld0RlY2tMaW5rczogW292ZXJ2aWV3TGluaywgbmV4dExpbmtdLFxuICAgICAgICByZXdyaXRlczogW3sgbmFtZTogY3VycmVudE5hbWUsIGRlY2s6IFtvdmVydmlld0xpbmssIGBbWyR7bmV3TmFtZX1dXWBdIH1dLFxuICAgICAgfTtcbiAgICB9XG4gICAgLy8gSW52YWxpZCAocGF0aC1xdWFsaWZpZWQgLyBzZWxmLXJlZmVyZW5jaW5nKSBuZXh0IGxpbmsgXHUyMTkyIGRyb3AgaXQgYW5kXG4gICAgLy8gYXBwZW5kIGEgbmV3IGxhc3Qgc2xpZGUgKGZhbGwgdGhyb3VnaCB0byB0aGUgbm8tbmV4dCBicmFuY2gpLlxuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIExhc3Qgc2xpZGUgXHUyMTkyIGFwcGVuZCBhIG5ldyBsYXN0IHNsaWRlIGFmdGVyIGl0IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCBuZXdOYW1lID0gdW5pcXVlTmFtZShgJHtjdXJyZW50TmFtZX0tbmV4dGAsIGlucHV0LmV4aXN0aW5nTmFtZXMpO1xuICByZXR1cm4ge1xuICAgIG5ld05hbWUsXG4gICAgbmV3RGVja0xpbmtzOiBbb3ZlcnZpZXdMaW5rXSxcbiAgICByZXdyaXRlczogW3sgbmFtZTogY3VycmVudE5hbWUsIGRlY2s6IFtvdmVydmlld0xpbmssIGBbWyR7bmV3TmFtZX1dXWBdIH1dLFxuICB9O1xufVxuXG4vKiogQSBuYW1lIHVzYWJsZSBhcyBhIHZhdWx0IG5vdGUgbmFtZTogbm8gcGF0aCBzZXBhcmF0b3JzLCBub24tZW1wdHkgKi9cbmZ1bmN0aW9uIGlzUGxhaW5OYW1lKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gbmFtZS5sZW5ndGggPiAwICYmICFuYW1lLmluY2x1ZGVzKFwiL1wiKSAmJiAhbmFtZS5pbmNsdWRlcyhcIlxcXFxcIik7XG59XG5cbi8qKiBGaXJzdCBmcmVlIG5hbWUgaW4gdGhlIGZhbWlseSBgYmFzZWAsIGBiYXNlLTJgLCBgYmFzZS0zYCwgXHUyMDI2ICovXG5mdW5jdGlvbiB1bmlxdWVOYW1lKGJhc2U6IHN0cmluZywgZXhpc3Rpbmc6IFNldDxzdHJpbmc+KTogc3RyaW5nIHtcbiAgaWYgKCFleGlzdGluZy5oYXMoYmFzZSkpIHJldHVybiBiYXNlO1xuICBmb3IgKGxldCBpID0gMjsgOyBpKyspIHtcbiAgICBjb25zdCBjYW5kaWRhdGUgPSBgJHtiYXNlfS0ke2l9YDtcbiAgICBpZiAoIWV4aXN0aW5nLmhhcyhjYW5kaWRhdGUpKSByZXR1cm4gY2FuZGlkYXRlO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgTmF0aXZlU2xpZGVzUGx1Z2luIGZyb20gXCIuLi9tYWluXCI7XG5pbXBvcnQgeyBTTElERVNfVEhFTUVTIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuLyoqIFNldHRpbmdzIHRhYjogdG9nZ2xlcyB0aGUgbmF2IGJ1dHRvbnMsIHBhZ2UgbnVtYmVyLCBhdXRvLWVudGVyIGFuZCBiYXIgdmlzaWJpbGl0eS4gKi9cbmV4cG9ydCBjbGFzcyBOYXRpdmVTbGlkZXNTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBOYXRpdmVTbGlkZXNQbHVnaW4pIHtcbiAgICBzdXBlcihwbHVnaW4uYXBwLCBwbHVnaW4pO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiTmF0aXZlIFNsaWRlcyBcdTAwQjcgU2V0dGluZ3NcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJTdHlsZSB0ZW1wbGF0ZVwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiQnVpbHQtaW4gbG9vayBmb3IgdGhlIFNsaWRlcyBjYXJkIGFuZCBzbGlkZXMgYmFyIChib3JkZXIsIGJhY2tncm91bmQsIHNoYWRvdywgYmFyIHN0eWxpbmcpLiBFdmVyeSB0ZW1wbGF0ZSBhZGFwdHMgdG8gbGlnaHQgYW5kIGRhcmsgdGhlbWVzLlwiLFxuICAgICAgKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IHQgb2YgU0xJREVTX1RIRU1FUykgZHJvcGRvd24uYWRkT3B0aW9uKHQuaWQsIHQubGFiZWwpO1xuICAgICAgICBkcm9wZG93bi5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zbGlkZXNUaGVtZSkub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2xpZGVzVGhlbWUgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBQcmV2aW91cy9OZXh0IGJ1dHRvbnNcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIlNob3cgXHUyNUMwIFx1MjVCNiBidXR0b25zIG9uIHRoZSBsZWZ0IG9mIHRoZSBzbGlkZXMgYmFyIHdoZW4gdGhlIG5vdGUgYmVsb25ncyB0byBhIGRlY2sgKGhhcyBhIGBkZWNrYCBwcm9wZXJ0eSlcIixcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dOYXZCdXR0b25zKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93TmF2QnV0dG9ucyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMucGx1Z2luLnJlZnJlc2goKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlNob3cgcGFnZSBudW1iZXJcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkF1dG8tY29tcHV0ZWQgZnJvbSB0aGUgZGVjayBjaGFpbiAob3ZlcnZpZXcgcGFnZSBzaG93cyBcdTIwMUNPdmVydmlld1x1MjAxRCk7IHNob3duIGF0IHRoZSBib3R0b20tcmlnaHRcIixcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dQYWdlTnVtYmVyKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93UGFnZU51bWJlciA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMucGx1Z2luLnJlZnJlc2goKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkF1dG8tZW50ZXIgU2xpZGVzIG1vZGVcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIk9wZW4gZGVjayBub3RlcyBkaXJlY3RseSBpbiBTbGlkZXMgbW9kZS4gTGVhdmUgb2ZmIHRvIGVudGVyIG1hbnVhbGx5IHdpdGggdGhlIFRvZ2dsZSBTbGlkZXMgTW9kZSBjb21tYW5kIChNb2QrU2hpZnQrRSkgb3IgdGhlIHByZXZpb3VzL25leHQgcGFnZSBob3RrZXlzLlwiLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b0VudGVyU2xpZGVzKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvRW50ZXJTbGlkZXMgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJTbGlkZXMgdGl0bGVcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkZyb250bWF0dGVyIHByb3BlcnR5IHRvIHNob3cgYXMgdGhlIGNhcmQgdGl0bGUgKEgxKS4gTGVhdmUgZW1wdHkgZm9yIG5vbmU7IHR5cGUgYGZpbGVuYW1lYCB0byB1c2UgdGhlIGZpbGUgbmFtZS5cIixcbiAgICAgIClcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiZS5nLiB0aXRsZVwiKVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zbGlkZXNUaXRsZSlcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zbGlkZXNUaXRsZSA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoKCk7XG4gICAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk5hdmlnYXRpb24gaG90a2V5c1wiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiRGVmYXVsdDogUHJldmlvdXMgUGFnZSBNb2QrU2hpZnQrXHUyMTkwLCBOZXh0IFBhZ2UgTW9kK1NoaWZ0K1x1MjE5Mi4gUmViaW5kIHVuZGVyIFNldHRpbmdzIFx1MjE5MiBIb3RrZXlzLlwiLFxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIk9wZW4gSG90a2V5cyBTZXR0aW5nc1wiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICAvLyBPcGVuIE9ic2lkaWFuJ3MgaG90a2V5cyBzZXR0aW5ncyBwYWdlIChpbnRlcm5hbCBBUEk7IGlnbm9yZSBmYWlsdXJlcylcbiAgICAgICAgICAoXG4gICAgICAgICAgICB0aGlzLmFwcCBhcyB1bmtub3duIGFzIHsgc2V0dGluZz86IHsgb3BlblRhYkJ5SWQ/OiAoaWQ6IHN0cmluZykgPT4gdm9pZCB9IH1cbiAgICAgICAgICApLnNldHRpbmc/Lm9wZW5UYWJCeUlkPy4oXCJob3RrZXlzXCIpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cbn1cbiIsICIvKiogUmVtb3ZlIGFsbCBjaGlsZHJlbiBvZiBhbiBlbGVtZW50ICovXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJDaGlsZHJlbihlbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgd2hpbGUgKGVsLmZpcnN0Q2hpbGQpIGVsLnJlbW92ZUNoaWxkKGVsLmZpcnN0Q2hpbGQpO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBd0JBLElBQUFBLG1CQUE0Qzs7O0FDdkJyQyxTQUFTLFlBQXlCO0FBQ3ZDLFFBQU0sTUFBTSxTQUFTLGNBQWMsS0FBSztB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SUFBSSxDQUFDO0FBQ3ZELFFBQUksT0FBTyxTQUFTLEdBQUc7QUFDckIsWUFBTSxPQUFPLFNBQVMsY0FBYyxNQUFNO0FBQzFDLFdBQUssWUFBWTtBQUNqQixXQUFLLGNBQWMsWUFBTyxPQUFPLEtBQUssSUFBSTtBQUMxQyxXQUFLLFFBQVE7QUFDYixXQUFLLElBQUksWUFBWSxJQUFJO0FBQUEsSUFDM0I7QUFHQSxRQUFJLEtBQUssU0FBUyxrQkFBa0IsTUFBTTtBQUN4QyxZQUFNLE9BQU8sU0FBUyxjQUFjLE1BQU07QUFDMUMsV0FBSyxZQUFZO0FBRWpCLFdBQUssY0FBYyxLQUFLLFVBQVUsSUFBSSxhQUFhLFFBQVEsS0FBSyxLQUFLO0FBQ3JFLFdBQUssSUFBSSxZQUFZLElBQUk7QUFBQSxJQUMzQjtBQUlBLFNBQUssSUFBSSxNQUFNLFVBQVUsS0FBSyxJQUFJLHNCQUFzQixJQUFJLFNBQVM7QUFBQSxFQUN2RTtBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJuZXdOYW1lIiwgImltcG9ydF9vYnNpZGlhbiJdCn0K
