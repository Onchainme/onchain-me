import type { LandObject } from "./types";
import { BADGE_CATALOG, isBadgeId } from "./badge-catalog";

/**
 * Map API placements to scene objects. Skips unknown badge ids so we never
 * render procedural placeholder buildings for stale or future catalog entries.
 */
export function placementsToLandObjects(
  placements: Array<{ badgeId: string; x: number; y: number }>,
): LandObject[] {
  const out: LandObject[] = [];
  for (let i = 0; i < placements.length; i++) {
    const obj = placementToLandObject(placements[i], i);
    if (obj) out.push(obj);
  }
  return out;
}

/**
 * Translates a known-catalog placement into the rich `LandObject` shape the
 * PixiJS / SVG scenes expect. Returns null for ids outside {@link BADGE_CATALOG}.
 */
export function placementToLandObject(
  placement: { badgeId: string; x: number; y: number },
  index: number,
): LandObject | null {
  if (!isBadgeId(placement.badgeId)) return null;
  const def = BADGE_CATALOG[placement.badgeId];
  return {
    id: `api-${placement.badgeId}-${index}`,
    badgeId: placement.badgeId,
    gx: clampGrid(placement.x),
    gy: clampGrid(placement.y),
    hue: def.hue,
    glyph: def.glyph,
    type: def.type,
    name: def.name,
    protocol: def.label,
    tile: tileLabelFromCoords(placement.x, placement.y),
    mintedAt: "API",
  };
}

function clampGrid(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(9, Math.floor(value)));
}

function tileLabelFromCoords(gx: number, gy: number) {
  const x = clampGrid(gx);
  const y = clampGrid(gy);
  return `${String.fromCharCode(65 + x)}-${y + 1}`;
}

