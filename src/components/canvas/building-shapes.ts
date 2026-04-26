import type { BuildingType } from "@/lib/types";

export interface Pixel {
  x: number;
  y: number;
  w: number;
  h: number;
  shade: "main" | "mid" | "dark" | "acc" | "trunk" | "trunk-d" | "highlight" | "berry" | "lamp";
}

/**
 * Each building fits in an 18×28 pixel canvas. Coordinates are given relative to that grid.
 * Anchor: (x=9, y=27) = base-center. The consumer projects pixel (px, py) -> screen
 * coordinates using a 2× scale via (cx + (px - 9) * 2, cy + (py - 27) * 2).
 */
const SHAPES: Record<BuildingType, Pixel[]> = {
  tower: [
    { x: 8, y: 3, w: 2, h: 2, shade: "main" },
    { x: 6, y: 5, w: 6, h: 2, shade: "dark" },
    { x: 7, y: 7, w: 4, h: 5, shade: "main" },
    { x: 10, y: 7, w: 1, h: 5, shade: "mid" },
    { x: 4, y: 12, w: 10, h: 2, shade: "dark" },
    { x: 6, y: 14, w: 6, h: 6, shade: "main" },
    { x: 11, y: 14, w: 1, h: 6, shade: "mid" },
    { x: 8, y: 16, w: 2, h: 2, shade: "acc" },
    { x: 3, y: 20, w: 12, h: 2, shade: "dark" },
    { x: 5, y: 22, w: 8, h: 6, shade: "main" },
    { x: 12, y: 22, w: 1, h: 6, shade: "mid" },
    { x: 7, y: 24, w: 2, h: 3, shade: "dark" },
    { x: 10, y: 24, w: 2, h: 2, shade: "acc" },
  ],
  crystal: [
    { x: 6, y: 26, w: 6, h: 2, shade: "dark" },
    { x: 5, y: 25, w: 8, h: 1, shade: "mid" },
    { x: 8, y: 10, w: 2, h: 1, shade: "acc" },
    { x: 7, y: 11, w: 4, h: 2, shade: "main" },
    { x: 6, y: 13, w: 6, h: 2, shade: "main" },
    { x: 5, y: 15, w: 8, h: 4, shade: "main" },
    { x: 6, y: 19, w: 6, h: 3, shade: "main" },
    { x: 7, y: 22, w: 4, h: 2, shade: "main" },
    { x: 8, y: 24, w: 2, h: 1, shade: "main" },
    { x: 10, y: 13, w: 1, h: 2, shade: "mid" },
    { x: 11, y: 15, w: 1, h: 4, shade: "mid" },
    { x: 10, y: 19, w: 1, h: 3, shade: "mid" },
    { x: 9, y: 22, w: 1, h: 2, shade: "mid" },
    { x: 6, y: 15, w: 1, h: 4, shade: "acc" },
    { x: 7, y: 19, w: 1, h: 3, shade: "acc" },
  ],
  tree: [
    { x: 8, y: 22, w: 2, h: 5, shade: "trunk" },
    { x: 9, y: 22, w: 1, h: 5, shade: "trunk-d" },
    { x: 7, y: 12, w: 4, h: 2, shade: "main" },
    { x: 5, y: 14, w: 8, h: 2, shade: "main" },
    { x: 4, y: 16, w: 10, h: 4, shade: "main" },
    { x: 5, y: 20, w: 8, h: 2, shade: "main" },
    { x: 5, y: 14, w: 3, h: 2, shade: "acc" },
    { x: 4, y: 16, w: 2, h: 2, shade: "acc" },
    { x: 12, y: 16, w: 2, h: 4, shade: "mid" },
    { x: 11, y: 20, w: 2, h: 2, shade: "mid" },
    { x: 10, y: 12, w: 1, h: 2, shade: "mid" },
    { x: 7, y: 17, w: 1, h: 1, shade: "berry" },
    { x: 9, y: 18, w: 1, h: 1, shade: "berry" },
  ],
  dome: [
    { x: 4, y: 24, w: 10, h: 3, shade: "dark" },
    { x: 5, y: 23, w: 8, h: 1, shade: "mid" },
    { x: 8, y: 10, w: 2, h: 2, shade: "main" },
    { x: 7, y: 12, w: 4, h: 2, shade: "main" },
    { x: 6, y: 14, w: 6, h: 2, shade: "main" },
    { x: 5, y: 16, w: 8, h: 3, shade: "main" },
    { x: 4, y: 19, w: 10, h: 4, shade: "main" },
    { x: 5, y: 13, w: 2, h: 2, shade: "acc" },
    { x: 4, y: 16, w: 2, h: 2, shade: "acc" },
    { x: 11, y: 13, w: 1, h: 2, shade: "mid" },
    { x: 11, y: 16, w: 2, h: 3, shade: "mid" },
    { x: 12, y: 19, w: 2, h: 4, shade: "mid" },
    { x: 8, y: 21, w: 2, h: 2, shade: "dark" },
    { x: 8, y: 8, w: 2, h: 2, shade: "lamp" },
    { x: 9, y: 6, w: 1, h: 2, shade: "acc" },
  ],
  mushroom: [
    { x: 7, y: 18, w: 4, h: 9, shade: "highlight" },
    { x: 10, y: 18, w: 1, h: 9, shade: "mid" },
    { x: 7, y: 24, w: 4, h: 3, shade: "mid" },
    { x: 8, y: 22, w: 2, h: 3, shade: "dark" },
    { x: 8, y: 19, w: 2, h: 2, shade: "acc" },
    { x: 5, y: 13, w: 6, h: 1, shade: "main" },
    { x: 6, y: 14, w: 8, h: 4, shade: "main" },
    { x: 4, y: 16, w: 12, h: 3, shade: "main" },
    { x: 6, y: 14, w: 3, h: 2, shade: "acc" },
    { x: 4, y: 16, w: 3, h: 2, shade: "acc" },
    { x: 12, y: 14, w: 2, h: 2, shade: "mid" },
    { x: 13, y: 16, w: 2, h: 3, shade: "mid" },
    { x: 9, y: 15, w: 1, h: 1, shade: "lamp" },
    { x: 11, y: 16, w: 1, h: 1, shade: "lamp" },
    { x: 5, y: 17, w: 1, h: 1, shade: "lamp" },
  ],
  shrine: [
    { x: 4, y: 14, w: 2, h: 13, shade: "main" },
    { x: 12, y: 14, w: 2, h: 13, shade: "main" },
    { x: 5, y: 14, w: 1, h: 13, shade: "mid" },
    { x: 13, y: 14, w: 1, h: 13, shade: "mid" },
    { x: 3, y: 26, w: 4, h: 2, shade: "dark" },
    { x: 11, y: 26, w: 4, h: 2, shade: "dark" },
    { x: 4, y: 9, w: 10, h: 2, shade: "main" },
    { x: 2, y: 11, w: 14, h: 3, shade: "main" },
    { x: 3, y: 10, w: 12, h: 1, shade: "dark" },
    { x: 2, y: 14, w: 14, h: 1, shade: "mid" },
    { x: 5, y: 7, w: 8, h: 2, shade: "dark" },
    { x: 7, y: 5, w: 4, h: 2, shade: "main" },
    { x: 8, y: 12, w: 2, h: 2, shade: "acc" },
  ],
  lighthouse: [
    { x: 5, y: 24, w: 8, h: 3, shade: "dark" },
    { x: 6, y: 22, w: 6, h: 2, shade: "mid" },
    { x: 7, y: 10, w: 4, h: 12, shade: "main" },
    { x: 10, y: 10, w: 1, h: 12, shade: "mid" },
    { x: 7, y: 12, w: 4, h: 2, shade: "acc" },
    { x: 7, y: 16, w: 4, h: 2, shade: "acc" },
    { x: 7, y: 20, w: 4, h: 2, shade: "acc" },
    { x: 6, y: 7, w: 6, h: 3, shade: "lamp" },
    { x: 7, y: 5, w: 4, h: 2, shade: "dark" },
    { x: 8, y: 3, w: 2, h: 2, shade: "main" },
  ],
};

export function getBuildingShape(type: BuildingType): Pixel[] {
  return SHAPES[type] ?? SHAPES.tower;
}
