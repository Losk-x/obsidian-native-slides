import { App, MarkdownView } from "obsidian";

/** Below this scale the content is clipped instead of shrinking further. */
const MIN_SCALE = 0.6;

/**
 * Scale the active editor's content down so the card fits one screen, using
 * CSS `zoom` (layout-affecting, so CodeMirror's caret / selection / input
 * stay consistent — the same mechanism Obsidian's own app zoom uses).
 *
 * The scale is **shrink-only**: `scale = min(1, viewport / content)`, so
 * content that fits is left at its natural size (adding text does not shrink
 * it), and content that overflows shrinks to fit, down to MIN_SCALE (below
 * that the `overflow: hidden` rule clips it).
 *
 * Obsidian's own zoom (Cmd/Ctrl+=/-) is left untouched: it scales the whole
 * app natively, so the card grows/shrinks with it. We detect "window resize"
 * vs "zoom" via `window.outerHeight/Width` (physical, unaffected by CSS zoom)
 * and only re-fit on a real resize or a content change.
 */
export class SlidesFitter {
  private observer: ResizeObserver;
  private target: HTMLElement | null = null;
  private lastOuterH = 0;
  private lastOuterW = 0;

  constructor(private app: App) {
    this.observer = new ResizeObserver(() => this.onResize());
  }

  /** Attach the observer to the current scroller (if changed) and fit. */
  fit(): void {
    const scroller = this.scroller();
    if (scroller !== this.target) {
      if (this.target) this.observer.unobserve(this.target);
      this.target = scroller;
      if (scroller) this.observer.observe(scroller);
      this.lastOuterH = window.outerHeight;
      this.lastOuterW = window.outerWidth;
    }
    this.apply();
  }

  /** Restore the natural zoom and stop observing (leaving Slides mode). */
  reset(): void {
    if (this.target) {
      this.observer.unobserve(this.target);
      this.target = null;
    }
    const content = this.elements()?.content;
    if (content) content.style.zoom = "";
  }

  /** A real window resize (not Obsidian zoom) → re-fit. */
  private onResize(): void {
    if (window.outerHeight === this.lastOuterH && window.outerWidth === this.lastOuterW) {
      return; // Obsidian zoom or internal layout — let it scale natively
    }
    this.lastOuterH = window.outerHeight;
    this.lastOuterW = window.outerWidth;
    this.apply();
  }

  /** Measure the content and apply the shrink-to-fit zoom. */
  private apply(): void {
    const els = this.elements();
    if (!els) return;
    const { scroller, content } = els;

    content.style.zoom = "1"; // measure at natural (unscaled) size
    const contentH = scroller.scrollHeight;
    const contentW = content.offsetWidth;
    const viewportH = scroller.clientHeight;
    const viewportW = scroller.clientWidth;

    if (contentH <= 0 || contentW <= 0 || viewportH <= 0 || viewportW <= 0) return;

    const needed = Math.min(viewportH / contentH, viewportW / contentW);
    const scale = Math.min(1, Math.max(MIN_SCALE, needed));
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
}
