/** Max simultaneous Pixi `<Application>` instances on `/home` card grid. */
export const MAX_HOME_PIXI_PREVIEWS = 2;

let activePixiPreviews = 0;

export function acquirePixiPreviewSlot(): boolean {
  if (activePixiPreviews >= MAX_HOME_PIXI_PREVIEWS) return false;
  activePixiPreviews += 1;
  return true;
}

export function releasePixiPreviewSlot(): void {
  activePixiPreviews = Math.max(0, activePixiPreviews - 1);
}

export type LandCardPreviewEngine = "pixi" | "svg";

/**
 * Whether this card size should attempt a Pixi thumbnail (desktop only).
 * Smaller slots stay on SVG — many WebGL contexts freeze scroll.
 */
export function cardSizeWantsPixi(size: "sm" | "md" | "lg" | "xl"): boolean {
  return size === "xl" || size === "lg";
}

/** Runtime capability: mobile / reduced motion / low core count → SVG only. */
export function detectPreviewEngine(): LandCardPreviewEngine {
  if (typeof window === "undefined") return "svg";
  if (process.env.NEXT_PUBLIC_PLATFORM === "mobile") return "svg";
  if (window.matchMedia("(max-width: 768px)").matches) return "svg";
  if (window.matchMedia("(pointer: coarse)").matches) return "svg";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "svg";
  const cores = navigator.hardwareConcurrency ?? 4;
  if (cores > 0 && cores < 4) return "svg";
  return "pixi";
}
