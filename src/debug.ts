import { App, MarkdownView, Notice, TFile } from "obsidian";
import type NativeSlidesPlugin from "../main";
import { isLivePreview } from "./mode";

/**
 * Typography-measurement tooling (dev builds only).
 *
 * The `ns-debug-styles` command samples the fixed one-page sample notes in
 * edit (Live Preview) and the kitchen-sink note in reading view, merges the
 * results, computes an edit-vs-reading diff and writes it to
 * .native-slides-debug.json in the vault root. Registered only when the
 * build-time DEV_MODE flag is true; release builds tree-shake this module out.
 */

/** Fixed one-page sample notes used by the debug command (edit side) */
export const SAMPLE_NOTE_NAMES = [
  "typography-sample-headings",
  "typography-sample-list",
  "typography-sample-code",
  "typography-sample-quote",
  "typography-sample-media",
];

/** Style sections sampled by sampleStyles() and compared by diffDumps() */
const STYLE_SECTIONS = [
  "container",
  "paragraph",
  "h1",
  "listItem",
  "codeBlock",
  "blockquote",
  "inlineCode",
  "table",
  "image",
  "horizontalRule",
];

/** Promise-based sleep */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Merge non-missing style sections of a fresh sample into the target
 * (first non-missing value wins).
 */
function mergeSample(target: Record<string, unknown>, sample: Record<string, unknown>): void {
  for (const key of STYLE_SECTIONS) {
    const section = sample[key] as Record<string, string> | undefined;
    if (!section || "(missing)" in section) continue;
    const existing = target[key] as Record<string, string> | undefined;
    if (existing && !("(missing)" in existing)) continue;
    target[key] = section;
  }
  // Probe fields ride along (first non-empty wins)
  for (const key of [
    "listLines",
    "metadataContainerDisplay",
    "h1OffsetTop",
    "h1TopInContent",
    "contentChildren",
    "topChain",
  ]) {
    const probe = sample[key];
    if (probe === undefined || probe === null) continue;
    if (Array.isArray(probe) && probe.length === 0) continue;
    if (typeof probe === "object" && !Array.isArray(probe) && Object.keys(probe).length === 0)
      continue;
    if (target[key] === undefined) target[key] = probe;
  }
}

/**
 * Compare the style sections of an edit dump and a reading dump; only
 * keys whose values differ are kept, as { key: { edit, reading } }.
 */
function diffDumps(
  edit: Record<string, unknown>,
  reading: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const section of STYLE_SECTIONS) {
    const e = (edit[section] ?? {}) as Record<string, string>;
    const r = (reading[section] ?? {}) as Record<string, string>;
    const keys = new Set([...Object.keys(e), ...Object.keys(r)]);
    const diffs: Record<string, { edit: string; reading: string }> = {};
    for (const key of keys) {
      if (e[key] !== r[key]) {
        diffs[key] = { edit: e[key] ?? "(missing)", reading: r[key] ?? "(missing)" };
      }
    }
    if (Object.keys(diffs).length > 0) out[section] = diffs;
  }
  return out;
}

/** Sample the current view's typography computed styles + CSS variables */
function sampleStyles(app: App): Record<string, unknown> | null {
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  if (!view) return null;
  const isEdit = view.getMode() === "source";
  const contentEl = view.contentEl;
  // First matching candidate wins — edit (cm6) and reading use
  // different element structures (e.g. no pre/blockquote in cm6).
  const pick = (sels: string[]): HTMLElement | null => {
    for (const sel of sels) {
      const el = contentEl.querySelector<HTMLElement>(sel);
      if (el) return el;
    }
    return null;
  };
  const style = (el: HTMLElement | null, props: string[]): Record<string, string> => {
    if (!el) return { "(missing)": "element not in this note" };
    const cs = getComputedStyle(el);
    const out: Record<string, string> = {};
    for (const p of props) {
      const v = cs.getPropertyValue(p).trim();
      if (v) out[p] = v;
    }
    return out;
  };
  const vars = getComputedStyle(document.body);
  const cssVar = (name: string): string => vars.getPropertyValue(name).trim();

  const container = pick([
    isEdit
      ? ".markdown-source-view.mod-cm6 .cm-content"
      : ".markdown-reading-view .markdown-preview-view",
  ]);
  const para = pick([
    isEdit
      ? ".markdown-source-view.mod-cm6 .cm-line:not(.HyperMD-header)"
      : ".markdown-reading-view .markdown-preview-view p",
  ]);
  const h1 = pick([
    isEdit ? ".markdown-source-view.mod-cm6 .cm-header-1" : ".markdown-reading-view h1",
    isEdit
      ? ".markdown-source-view.mod-cm6 h1"
      : ".markdown-reading-view .markdown-preview-view h1",
  ]);
  const listItem = pick([
    isEdit ? ".markdown-source-view.mod-cm6 .HyperMD-list-line" : ".markdown-preview-view ul > li",
    isEdit ? ".HyperMD-list-line" : ".markdown-reading-view .markdown-preview-view ul > li",
  ]);
  const pre = pick([
    isEdit
      ? ".markdown-source-view.mod-cm6 pre"
      : ".markdown-reading-view .markdown-preview-view pre",
    isEdit ? ".markdown-source-view.mod-cm6 .cm-editing pre" : ".markdown-preview-view pre",
    isEdit ? ".markdown-source-view.mod-cm6 .HyperMD-codeblock" : ".markdown-preview-view pre",
  ]);
  const quote = pick([
    isEdit ? ".markdown-source-view.mod-cm6 blockquote" : ".markdown-reading-view blockquote",
    isEdit
      ? ".markdown-source-view.mod-cm6 .HyperMD-quote"
      : ".markdown-reading-view .markdown-preview-view blockquote",
  ]);
  const inlineCode = pick([
    isEdit ? ".markdown-source-view.mod-cm6 code" : ".markdown-reading-view code",
    isEdit
      ? ".markdown-source-view.mod-cm6 .cm-inline-code"
      : ".markdown-reading-view .markdown-preview-view code",
  ]);
  const table = pick([
    isEdit ? ".markdown-source-view.mod-cm6 table" : ".markdown-reading-view table",
    isEdit ? ".cm-line table" : ".markdown-reading-view .markdown-preview-view table",
  ]);
  const img = pick([
    isEdit ? ".markdown-source-view.mod-cm6 img" : ".markdown-reading-view img",
    isEdit ? ".cm-line img" : ".markdown-reading-view .markdown-preview-view img",
    "img", // whole-document fallback
  ]);
  const hr = pick([
    isEdit ? ".markdown-source-view.mod-cm6 hr" : ".markdown-reading-view hr",
    isEdit ? ".cm-line hr" : ".markdown-reading-view .markdown-preview-view hr",
    isEdit ? ".cm-hr" : ".markdown-preview-view hr",
  ]);

  // Structure probes (edit view only): the source-view class list
  // (confirms the Live Preview marker class) and unique element tags
  // inside the editor (reveals how cm6 renders code blocks etc. when
  // the usual selectors do not match).
  const sourceViewClass = contentEl.querySelector(".markdown-source-view.mod-cm6")?.className ?? "";
  const domTags: string[] = [];
  if (isEdit) {
    const tags = new Set<string>();
    contentEl
      .querySelectorAll(".markdown-source-view.mod-cm6 *")
      .forEach((el) => tags.add(el.tagName.toLowerCase()));
    domTags.push(...tags);
  }
  // List-line probe (edit view only): class names + computed padding
  // of the first list lines — nested levels often use distinct
  // classes or inline paddings, which decides whether a level-aware
  // indent override is even possible.
  const listLines: { className: string; paddingLeft: string }[] = [];
  if (isEdit) {
    contentEl.querySelectorAll(".HyperMD-list-line").forEach((el, i) => {
      if (i >= 4) return;
      const cs = getComputedStyle(el);
      listLines.push({
        className: el.className,
        paddingLeft: cs.getPropertyValue("padding-left").trim(),
      });
    });
  }
  // Frontmatter probes: does the (hidden) properties area still
  // occupy space in Live Preview? And how far is the H1 from the
  // top of the content area? (reading mode has no such padding)
  const metadataDisplay = (() => {
    const sel = isEdit
      ? ".markdown-source-view .metadata-container"
      : ".markdown-reading-view .metadata-container";
    const el = contentEl.querySelector<HTMLElement>(sel);
    return el ? getComputedStyle(el).display : "(not in DOM)";
  })();
  const h1OffsetTop = (() => {
    if (!h1) return undefined;
    let top = 0;
    let node: HTMLElement | null = h1;
    while (node && node !== contentEl && node !== document.body) {
      top += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return top;
  })();
  // What occupies the space between the content top and the H1?
  // (edit) first children of .cm-content, and the net H1 distance
  // from the content anchor — reading has no such gap.
  const anchor = isEdit
    ? contentEl.querySelector<HTMLElement>(".cm-content")
    : contentEl.querySelector<HTMLElement>(".markdown-reading-view .markdown-preview-view");
  const h1TopInContent = (() => {
    if (!h1 || !anchor) return undefined;
    return Math.round(h1.getBoundingClientRect().top - anchor.getBoundingClientRect().top);
  })();
  const contentChildren = (() => {
    if (!anchor) return undefined;
    return Array.from(anchor.children)
      .slice(0, 4)
      .map((el) => {
        const cs = getComputedStyle(el);
        return {
          cls: (el as HTMLElement).className || el.tagName.toLowerCase(),
          display: cs.display,
          height: Math.round(el.getBoundingClientRect().height),
          marginTop: cs.marginTop,
          paddingTop: cs.paddingTop,
          marginBottom: cs.marginBottom,
          paddingBottom: cs.paddingBottom,
        };
      });
  })();
  // Container chain probe: from .cm-content up to the view-content,
  // each wrapper's padding/margin — locates the leftover vertical
  // offset between edit and reading content areas.
  const topChain = (() => {
    if (!anchor) return undefined;
    const parts: { cls: string; padTop: string; marTop: string }[] = [];
    let node: HTMLElement | null = anchor;
    while (node && node !== contentEl && node !== document.body) {
      const cs = getComputedStyle(node);
      parts.push({
        cls: node.className || node.tagName.toLowerCase(),
        padTop: cs.paddingTop,
        marTop: cs.marginTop,
      });
      node = node.parentElement;
    }
    return parts;
  })();

  const dump = {
    mode: isEdit ? "edit (Live Preview)" : "reading",
    // Slides styling only applies when Slides mode is on
    slidesActive: document.body.classList.contains("native-slides-mode"),
    domTags: isEdit ? domTags : undefined,
    sourceViewClass: isEdit ? sourceViewClass : undefined,
    livePreview: isEdit ? isLivePreview(app) : undefined,
    listLines: isEdit ? listLines : undefined,
    metadataContainerDisplay: metadataDisplay,
    h1OffsetTop: h1OffsetTop,
    h1TopInContent: h1TopInContent,
    contentChildren: contentChildren,
    topChain: topChain,
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
      "text-align",
    ]),
    paragraph: style(para, [
      "font-size",
      "line-height",
      "margin-top",
      "margin-bottom",
      "margin-left",
      "margin-right",
      "text-indent",
      "text-align",
    ]),
    h1: style(h1, [
      "font-size",
      "line-height",
      "font-weight",
      "margin-top",
      "margin-bottom",
      "text-align",
    ]),
    listItem: style(listItem, [
      "padding-left",
      "margin-left",
      "margin-right",
      "text-indent",
      "line-height",
      "text-align",
    ]),
    codeBlock: style(pre, [
      "font-size",
      "line-height",
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left",
      "background-color",
      "border-radius",
    ]),
    blockquote: style(quote, [
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left",
      "margin-top",
      "margin-bottom",
      "border-left-width",
      "background-color",
    ]),
    inlineCode: style(inlineCode, [
      "font-size",
      "padding-top",
      "padding-bottom",
      "padding-left",
      "padding-right",
      "background-color",
      "border-radius",
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
      "--font-text-size": cssVar("--font-text-size"),
    },
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
export async function dumpTypography(plugin: NativeSlidesPlugin): Promise<void> {
  const app = plugin.app;
  if (!document.body.classList.contains("native-slides-mode")) {
    new Notice("Native Slides: enter Slides mode first (Mod+Shift+E on a deck note)");
    return;
  }
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  if (!view) {
    new Notice("Native Slides: no active Markdown note");
    return;
  }
  const startMode = view.getMode();
  const activeFile = app.workspace.getActiveFile();
  const leaf = app.workspace.getLeaf(false);

  // Edit side: each short note keeps every target element on screen
  const edit: Record<string, unknown> = {};
  for (const name of SAMPLE_NOTE_NAMES) {
    const f = app.vault.getAbstractFileByPath(`${name}.md`);
    if (!(f instanceof TFile)) continue;
    await leaf.openFile(f, { state: { mode: "source" } });
    await sleep(500);
    const s = sampleStyles(app);
    if (s) mergeSample(edit, s);
  }

  // Reading side: the kitchen-sink note renders everything at once
  let reading: Record<string, unknown> | null = null;
  const demo = app.vault.getAbstractFileByPath("typography-demo.md");
  if (demo instanceof TFile) {
    await leaf.openFile(demo, { state: { mode: "preview" } });
    await sleep(800);
    reading = sampleStyles(app);
  }

  // Restore the user's note
  if (activeFile) {
    await leaf.openFile(activeFile, { state: { mode: startMode } });
    plugin.refresh();
  }
  if (!reading) {
    new Notice("Native Slides: reading sample failed");
    return;
  }

  const payload = { edit, reading, diff: diffDumps(edit, reading) };
  try {
    await app.vault.adapter.write(".native-slides-debug.json", JSON.stringify(payload, null, 2));
    new Notice("Typography dump → .native-slides-debug.json (vault root)");
  } catch (error) {
    new Notice(`Native Slides: could not write debug file (${String(error)})`);
  }
  console.log("[native-slides debug-styles]", JSON.stringify(payload, null, 2));
}

/** Register the dev-only debug command (called only when DEV_MODE is true). */
export function registerDebugCommand(plugin: NativeSlidesPlugin): void {
  plugin.addCommand({
    id: "ns-debug-styles",
    name: "Debug: Dump Typography Styles",
    callback: () => void dumpTypography(plugin),
  });
}
