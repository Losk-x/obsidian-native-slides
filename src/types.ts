/** Plugin settings */
export interface NativeSlidesSettings {
  /** Show ◀ ▶ previous/next buttons on the left of the bar */
  showNavButtons: boolean;
  /** Show the auto-computed page number at the bottom-right of the bar */
  showPageNumber: boolean;
  /** Whether the user manually hid the bar (toggle command) */
  barHidden: boolean;
  /** Whether auto-fullscreen in reading view is enabled */
  autoFullscreen: boolean;
  /** WYSIWYG mode (unified edit/reading typography) — deck notes only */
  wysiwygMode: boolean;
}

export const DEFAULT_SETTINGS: NativeSlidesSettings = {
  showNavButtons: true,
  showPageNumber: true,
  barHidden: false,
  autoFullscreen: true,
  wysiwygMode: false,
};

/** Reserved frontmatter key driving deck navigation (never rendered as a chip) */
export const DECK_KEY = "deck";
