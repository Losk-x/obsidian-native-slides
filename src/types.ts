/** A built-in Slides style template (rendered as body class `native-slides-theme-<id>`) */
export interface SlidesTheme {
  id: string;
  label: string;
}

/** Built-in style templates for the Slides card + bar (all theme-adaptive) */
export const SLIDES_THEMES: readonly SlidesTheme[] = [
  { id: "jyy", label: "Lecture (jyy)" },
  { id: "dashed", label: "Dashed outline" },
  { id: "paper", label: "Paper card" },
  { id: "minimal", label: "Minimal" },
  { id: "accent", label: "Accent edge" },
  { id: "glass", label: "Frosted glass" },
];

/** Plugin settings */
export interface NativeSlidesSettings {
  /** Show ◀ ▶ previous/next buttons on the left of the slides bar */
  showNavButtons: boolean;
  /** Page number display style: "fraction" = N / Total, "current" = N, "none" = hidden */
  pageNumberStyle: "fraction" | "current" | "none";
  /** Show a thin clickable progress line at the top of the slides bar */
  showProgress: boolean;
  /** Show the entire slides bar (master toggle) */
  showSlidesBar: boolean;
  /** Whether the user manually hid the slides bar (toggle command) */
  barHidden: boolean;
  /** Auto-enter Slides mode when opening a deck note (default off) */
  autoEnterSlides: boolean;
  /** Press Escape to exit Slides mode (default on) */
  escExitsSlides: boolean;
  /** Frontmatter property shown as the card title ("" = none, "filename" = file name) */
  slidesTitle: string;
  /** Style template id from SLIDES_THEMES (card + bar appearance) */
  slidesTheme: string;
}

export const DEFAULT_SETTINGS: NativeSlidesSettings = {
  showNavButtons: true,
  pageNumberStyle: "none",
  showProgress: true,
  showSlidesBar: true,
  barHidden: false,
  autoEnterSlides: false,
  escExitsSlides: true,
  slidesTitle: "",
  slidesTheme: "jyy",
};

/** Reserved frontmatter key driving deck navigation (never rendered as a chip) */
export const DECK_KEY = "deck";
