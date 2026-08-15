import { App, MarkdownView, TFile } from "obsidian";

/** Mode of the active Markdown view: 'preview'=reading 'source'=editing ''=none */
export function currentMode(app: App): "preview" | "source" | "" {
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  return view ? (view.getMode() as "preview" | "source") : "";
}

/**
 * True when the active edit view is Live Preview (WYSIWYG) — as
 * opposed to Source mode. Obsidian reports both as mode "source";
 * the view state carries a `source` flag (Source mode = true), with
 * a DOM class fallback (.is-live-preview) for safety.
 */
export function isLivePreview(app: App): boolean {
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  if (!view || view.getMode() !== "source") return false;
  const state = view.getState() as { source?: boolean };
  if (state.source === true) return false;
  if (state.source === false) return true;
  return !!view.contentEl.querySelector(".markdown-source-view.mod-cm6.is-live-preview");
}

/** Frontmatter of any note as an object, or null when absent */
export function frontmatterOf(app: App, file: TFile): Record<string, unknown> | null {
  const cache = app.metadataCache.getFileCache(file);
  return cache?.frontmatter ?? null;
}

/** Current note's frontmatter as an object, or null when absent */
export function activeFrontmatter(app: App): Record<string, unknown> | null {
  const file = app.workspace.getActiveFile();
  return file ? frontmatterOf(app, file) : null;
}
