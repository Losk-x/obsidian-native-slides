import { App, MarkdownView } from "obsidian";

/** Below this scale the content is clipped instead of shrinking further. */
const MIN_SCALE = 0.6;

/**
 * Scale the active editor's content so the card fits one screen, using CSS
 * `zoom` (layout-affecting, so CodeMirror's caret / selection / hit-testing
 * stay consistent — the same mechanism Obsidian's own app zoom uses).
 *
 * The scale is anchored to a **reference viewport** captured when Slides mode
 * is entered: `scale = refScale * (viewportH / refViewportH)`. So dragging
 * the window or changing Obsidian zoom scales the card proportionally (both
 * up and down), while adding/removing text does NOT re-scale it — unless the
 * content overflows the current scaled viewport, in which case it shrinks to
 * fit, down to MIN_SCALE (below that the `overflow: hidden` rule clips it).
 */
export class SlidesFitter {
  private observer: ResizeObserver;
  private target: HTMLElement | null = null;
  private refViewportH = 0;
  private refViewportW = 0;
  private refScale = 1;

  constructor(private app: App) {
    this.observer = new ResizeObserver(() => this.apply());
  }

  /**
   * Recalibrate on entering Slides mode: lock the reference viewport and the
   * scale that fits the current content, then fit. Called once per entry so
   * later viewport changes scale proportionally from this reference.
   */
  calibrate(): void {
    const els = this.elements();
    if (!els) return;
    const { scroller, content } = els;
    this.refViewportH = scroller.clientHeight;
    this.refViewportW = scroller.clientWidth;
    const { contentH, contentW } = this.measure(scroller, content);
    if (contentH <= 0 || contentW <= 0) return;
    const fit = Math.min(this.refViewportH / contentH, this.refViewportW / contentW);
    this.refScale = Math.min(1, Math.max(MIN_SCALE, fit));
    this.apply();
  }

  /** Attach the observer to the current scroller (if changed) and fit. */
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

  /** Re-measure and re-apply the fit zoom. */
  apply(): void {
    const els = this.elements();
    if (!els) return;
    const { scroller, content } = els;

    const { contentH, contentW } = this.measure(scroller, content);
    const viewportH = scroller.clientHeight;
    const viewportW = scroller.clientWidth;
    if (contentH <= 0 || contentW <= 0 || viewportH <= 0 || viewportW <= 0) return;
    if (this.refViewportH <= 0) this.refViewportH = viewportH;
    if (this.refViewportW <= 0) this.refViewportW = viewportW;

    // Proportional to the reference viewport (bidirectional grow/shrink).
    const vpScale = this.refScale * (viewportH / this.refViewportH);
    // Scale required so the content fits (both axes).
    const needed = Math.min(viewportH / contentH, viewportW / contentW);

    const scale = needed < vpScale ? Math.max(MIN_SCALE, needed) : vpScale;
    content.style.zoom = String(scale);
  }

  private elements(): { scroller: HTMLElement; content: HTMLElement } | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const scroller = view?.contentEl.querySelector<HTMLElement>(".cm-scroller");
    const content = view?.contentEl.querySelector<HTMLElement>(".cm-content");
    return scroller && content ? { scroller, content } : null;
  }

  private scroller(): HTMLElement | null {
    return this.elements()?.scroller ?? null;
  }

  /** Measure the natural (unscaled) content size. */
  private measure(
    scroller: HTMLElement,
    content: HTMLElement,
  ): { contentH: number; contentW: number } {
    content.style.zoom = "1";
    const prevMinHeight = content.style.minHeight;
    content.style.minHeight = "0";
    const contentH = scroller.scrollHeight;
    const contentW = content.offsetWidth;
    content.style.minHeight = prevMinHeight;
    return { contentH, contentW };
  }

  private setZoom(value: string): void {
    const content = this.elements()?.content;
    if (content) content.style.zoom = value;
  }
}
