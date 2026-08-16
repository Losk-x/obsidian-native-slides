/** Plugin settings */
export interface NativeSlidesSettings {
  /** Show ◀ ▶ previous/next buttons on the left of the bar */
  showNavButtons: boolean;
  /** Show the auto-computed page number at the bottom-right of the bar */
  showPageNumber: boolean;
  /** Whether the user manually hid the bar (toggle command) */
  barHidden: boolean;
  /** Auto-enter Slides mode when opening a deck note (default off) */
  autoEnterSlides: boolean;
  /** Auto-enter OS fullscreen when entering Slides mode (default on) */
  autoFullscreen: boolean;
}

export const DEFAULT_SETTINGS: NativeSlidesSettings = {
  showNavButtons: true,
  showPageNumber: true,
  barHidden: false,
  autoEnterSlides: false,
  autoFullscreen: true,
};

/** Reserved frontmatter key driving deck navigation (never rendered as a chip) */
export const DECK_KEY = "deck";
