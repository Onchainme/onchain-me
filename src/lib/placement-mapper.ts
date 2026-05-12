import type { BuildingType, LandObject } from "./types";
import { BADGE_CATALOG, isBadgeId } from "./badge-catalog";

/**
 * Translates an API placement (`{ badgeId, x, y }`) into the rich `LandObject`
 * shape the PixiJS scene expects. Unknown badge ids fall through a deterministic
 * hash so older or future placements still render *something* on screen.
 *
 * Pulled out of `app/my-land/page.tsx` so the landing hero preview can reuse it
 * without dragging in the whole my-land module.
 */
export function placementToLandObject(
  placement: { badgeId: string; x: number; y: number },
  index: number,
): LandObject {
  if (isBadgeId(placement.badgeId)) {
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
  const parsed = parseBadgeId(placement.badgeId);
  return {
    id: `api-${placement.badgeId}-${index}`,
    badgeId: placement.badgeId,
    gx: clampGrid(placement.x),
    gy: clampGrid(placement.y),
    hue: hueFromString(placement.badgeId),
    glyph: parsed.glyph,
    type: typeFromString(placement.badgeId),
    name: parsed.name,
    protocol: parsed.protocol,
    tile: tileLabelFromCoords(placement.x, placement.y),
    mintedAt: "API",
  };
}

const BUILDING_TYPES: BuildingType[] = [
  "tower",
  "crystal",
  "tree",
  "dome",
  "mushroom",
  "shrine",
  "lighthouse",
];

function clampGrid(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(9, Math.floor(value)));
}

function tileLabelFromCoords(gx: number, gy: number) {
  const x = clampGrid(gx);
  const y = clampGrid(gy);
  return `${String.fromCharCode(65 + x)}-${y + 1}`;
}

function parseBadgeId(badgeId: string) {
  const normalized = badgeId.replace(/[-_]/g, " ").trim();
  const parts = normalized.split(/\s+/).filter(Boolean);
  const protocol = parts[0] ? capitalize(parts[0]) : "Protocol";
  return {
    protocol,
    name: parts.map(capitalize).join(" "),
    glyph: protocol.slice(0, 1).toUpperCase() || "?",
  };
}

function capitalize(s: string) {
  if (!s) return s;
  return `${s[0].toUpperCase()}${s.slice(1).toLowerCase()}`;
}

function hueFromString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

function typeFromString(value: string): BuildingType {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 17 + value.charCodeAt(i)) | 0;
  }
  return BUILDING_TYPES[Math.abs(hash) % BUILDING_TYPES.length];
}
