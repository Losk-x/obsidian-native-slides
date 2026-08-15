/** Create the bar DOM element (hidden until refresh() shows it) */
export function createBar(): HTMLElement {
  const bar = document.createElement("div");
  bar.className = "native-slides-bar";
  bar.style.display = "none";
  return bar;
}

/** Build a ◀ / ▶ navigation button; `disabled` renders it light gray/inactive */
export function navButton(
  label: string,
  tip: string,
  onClick: () => void,
  disabled = false,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "native-slides-nav-btn";
  btn.textContent = label;
  btn.title = tip;
  btn.disabled = disabled;
  if (!disabled) btn.addEventListener("click", onClick);
  return btn;
}

/**
 * Measure the top tab bar and expose its height as the CSS variable
 * --native-slides-tabbar-height, returning the (possibly updated) cached
 * value. The bar is hidden in WYSIWYG reading view, so the last measured
 * value is reused there.
 */
export function syncTabBarHeight(cached: number): number {
  const tabBar = document.querySelector<HTMLElement>(
    ".workspace-tabs.mod-top .workspace-tab-header-container",
  );
  if (tabBar && tabBar.offsetHeight > 0) cached = tabBar.offsetHeight;
  if (cached > 0) {
    document.documentElement.style.setProperty("--native-slides-tabbar-height", `${cached}px`);
  } else {
    // No measurement yet (tab bar hidden since load) — let the CSS fallback apply.
    document.documentElement.style.removeProperty("--native-slides-tabbar-height");
  }
  return cached;
}
