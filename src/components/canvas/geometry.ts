export const TILE_W = 38 * 2;
export const TILE_H = 15 * 2;
export const BLOCK_H = 14 * 2;
export const SIDE_LAYERS = 3;

export interface Point {
  x: number;
  y: number;
}

export function createProjection(cx: number, cy: number) {
  return (gx: number, gy: number): Point => ({
    x: cx + ((gx - gy) * TILE_W) / 2,
    y: cy + ((gx + gy) * TILE_H) / 2,
  });
}

export const TOP_PALETTE = [
  0xffe0f0, 0xffd5ba, 0xfff2b8, 0xd6f5c5, 0xc7ecf5, 0xd8d1f5, 0xf5c8e0, 0xc5e8d6,
  0xf5e8c7,
];

export const SIDE_PALETTE_L = [
  0xe6b8d1, 0xe8b99a, 0xe5d78f, 0xb7dba5, 0xa8cfe0, 0xb5ade0, 0xd8a7c4, 0xa7cfb5,
  0xdcc89b,
];

export const SIDE_PALETTE_R = [
  0xc99cb6, 0xc99a7b, 0xc4b872, 0x97bf85, 0x88b4c7, 0x968dc7, 0xb78ba4, 0x8ab296,
  0xbfa97f,
];

export const pickTop = (gx: number, gy: number) =>
  TOP_PALETTE[(gx * 3 + gy * 7 + 2) % TOP_PALETTE.length];

export const pickLeft = (gx: number, gy: number, layer: number) =>
  SIDE_PALETTE_L[(gx * 5 + gy * 2 + layer * 11) % SIDE_PALETTE_L.length];

export const pickRight = (gx: number, gy: number, layer: number) =>
  SIDE_PALETTE_R[(gx * 7 + gy * 3 + layer * 13) % SIDE_PALETTE_R.length];

/** Convert oklch-ish hue (0..360) to an RGB triad at a given lightness/chroma.
 *  Cheap approximation — good enough for pixel art, avoids pulling in a color lib. */
export function hueToRgb(hue: number, lightness = 0.78, chroma = 0.16): number {
  const h = ((hue % 360) + 360) % 360;
  const c = chroma * 2;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = lightness - c / 2;
  const rn = Math.max(0, Math.min(255, Math.round((r + m) * 255)));
  const gn = Math.max(0, Math.min(255, Math.round((g + m) * 255)));
  const bn = Math.max(0, Math.min(255, Math.round((b + m) * 255)));
  return (rn << 16) | (gn << 8) | bn;
}

export function shadeHue(hue: number, kind: "main" | "mid" | "dark" | "acc") {
  switch (kind) {
    case "main":
      return hueToRgb(hue, 0.8, 0.14);
    case "mid":
      return hueToRgb(hue, 0.62, 0.17);
    case "dark":
      return hueToRgb(hue, 0.42, 0.17);
    case "acc":
    default:
      return hueToRgb(hue, 0.92, 0.1);
  }
}