/** Remove all children of an element */
export function clearChildren(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/**
 * Pin a scroller to the top so nothing can scroll it — neither user input
 * (covered by the CSS `overflow: hidden`) nor CodeMirror's programmatic
 * scrollIntoView (edit / drag-select), which sets `scrollTop` directly.
 * Shadows the scroll APIs; undo with unlockScroller().
 */
export function lockScroller(el: HTMLElement): void {
  const noop = (): void => {};
  // Shadow the native scroll methods CodeMirror may call.
  (el as unknown as { scrollTo?: (...a: unknown[]) => void }).scrollTo = noop;
  (el as unknown as { scrollBy?: (...a: unknown[]) => void }).scrollBy = noop;
  (el as unknown as { scrollIntoView?: (...a: unknown[]) => void }).scrollIntoView = noop;
  // Pin the scroll position accessors (direct `scrollTop = x` assignments).
  Object.defineProperty(el, "scrollTop", { get: () => 0, set: noop, configurable: true });
  Object.defineProperty(el, "scrollLeft", { get: () => 0, set: noop, configurable: true });
}

/** Undo lockScroller(): restore native scrolling on the element. */
export function unlockScroller(el: HTMLElement): void {
  const anyEl = el as unknown as Record<string, unknown>;
  delete anyEl.scrollTo;
  delete anyEl.scrollBy;
  delete anyEl.scrollIntoView;
  delete anyEl.scrollTop;
  delete anyEl.scrollLeft;
}
