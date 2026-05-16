export const UI_TEXT = {
  textTitle: "font-px text-[16px] 2xl:text-[20px] uppercase tracking-[0.06em]",
  mainText: "font-pixel-body text-[16px] 2xl:text-[20px] leading-snug",
  labelText: "font-silk text-[12px] 2xl:text-[16px] uppercase tracking-[0.12em]",
  labelTextSm: "font-silk text-[8px] 2xl:text-[12px] uppercase",
  valueText: "font-px text-[12px] 2xl:text-[16px]",
} as const;

/** Shared Pixi canvas resolution for full-page island views (edit / my-land / public). */
export const ISLAND_CANVAS = {
  width: 900,
  height: 680,
  /** Visual island scale inside the canvas (sky stays full-bleed). */
  scale: 1.8,
} as const;

/** MapFrame inner viewport — keep min-heights aligned across island routes. */
export const ISLAND_VIEWPORT = {
  minHeight: "min-h-[360px] sm:min-h-[720px]",
  container: "relative flex items-center justify-center w-full",
} as const;

export const UI_LAYOUT = {
  /** Marketing + in-app list pages (`/home`). */
  pageShell: "max-w-[1280px] mx-auto px-3 pt-4 pb-8 sm:px-12 sm:pt-6 sm:pb-10",
  pageShellStack: "flex flex-col gap-3.5",
  /** Island editor / owner / public land routes. */
  pageContainer: "max-w-[1400px] mx-auto px-3 sm:px-6",
  pageGrid: "max-w-[1400px] mx-auto grid gap-3 p-3 sm:gap-6 sm:p-6",
  /** Sidebar + map column (edit, my-land, public land). */
  twoColumn:
    "grid-cols-1 sm:grid-cols-[minmax(0,300px)_1fr] md:grid-cols-[minmax(0,340px)_1fr]",
  sidebar: "flex flex-col gap-3 w-full min-w-0",
  /** Public `/land` — map left, objects list right on md+. */
  twoColumnMapFirst:
    "grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]",
} as const;

/** Shown on landing + Edit / mint modals. */
export const MINT_COST_LABEL = "Mint cost ~$0.005/badge";
