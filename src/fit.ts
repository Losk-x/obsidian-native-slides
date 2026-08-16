import { App, MarkdownView } from "obsidian";

/**
 * Scale the active editor's content so it exactly fits one screen, using CSS
 * `zoom` — the same layout-affecting mechanism Obsidian's own app zoom uses,
 * so CodeMirror's caret / selection / hit-testing stay consistent. (`transform:
 * scale` would leave CodeMirror's internal coordinates unscaled and misalign
 * input.)
 *
 * A single uniform factor is applied to the whole card, so the user-tuned
 * proportions are preserved as the viewport (window size, Obsidian zoom) or the
 * content changes. The scroller's `scrollHeight` reports the full document
 * height even under CodeMirror's virtual rendering, so measuring it is reliable.
 */
export class SlidesFitter {
  private observer: ResizeObserver;
  private target: HTMLElement | null = null;

  constructor(private app: App) {
    this.observer = new ResizeObserver(() => this.apply());
  }

  /** Attach the observer to the current scroller (if changed) and fit once. */
  fit(): void {
    const scroller = this.scroller();
    if (scroller !== this.target) {
      if (this.target) this.observer.unobserve(this.target);
      this.target = scroller;
      if (scroller) this.observer.observe(scroller);
    }
    this.apply();
  }

  /** Restore the natural zoom and stop observing (leaving Slides mode). */
  reset(): void {
    if (this.target) {
      this.observer.unobserve(this.target);
      this.target = null;
    }
    this.setZoom("");
  }

  /** Re-measure the content and re-apply the fit zoom. */
  apply(): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const scroller = view?.contentEl.querySelector<HTMLElement>(".cm-scroller");
    const content = view?.contentEl.querySelector<HTMLElement>(".cm-content");
    if (!scroller || !content) return;

    // Reset zoom and min-height so we measure the natural (unscaled) size.
    content.style.zoom = "1";
    const prevMinHeight = content.style.minHeight;
    content.style.minHeight = "0";

    const contentH = scroller.scrollHeight;
    const contentW = content.offsetWidth;
    const viewportH = scroller.clientHeight;
    const viewportW = scroller.clientWidth;

    content.style.minHeight = prevMinHeight;

    if (contentH <= 0 || contentW <= 0 || viewportH <= 0 || viewportW <= 0) return;
    const scale = Math.min(viewportW / contentW, viewportH / contentH);
    content.style.zoom = String(scale);
  }

  private scroller(): HTMLElement | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    return view?.contentEl.querySelector<HTMLElement>(".cm-scroller") ?? null;
  }

  private setZoom(value: string): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const content = view?.contentEl.querySelector<HTMLElement>(".cm-content");
    if (content) content.style.zoom = value;
  }
}
