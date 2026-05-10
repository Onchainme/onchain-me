import type { BuildingType, InventoryItem } from "./types";

/**
 * 13 protocol-tiered badges. Mirrors `packages/shared/src/badges/registry.ts`
 * on the backend; keep ids and tier values in sync.
 *
 *   • Jupiter / Pump.fun: cumulative USD swap volume (bronze $1k, silver $10k,
 *     original $100k)
 *   • Orca / Meteora: current LP position USD (same thresholds)
 *   • Seeker: holds the Seeker Genesis NFT (single tier)
 */

export type BadgeId =
  | "jupiter_volume_bronze"
  | "jupiter_volume_silver"
  | "jupiter_volume_original"
  | "pumpfun_volume_bronze"
  | "pumpfun_volume_silver"
  | "pumpfun_volume_original"
  | "orca_position_bronze"
  | "orca_position_silver"
  | "orca_position_original"
  | "meteora_position_bronze"
  | "meteora_position_silver"
  | "meteora_position_original"
  | "seeker_genesis";

export type BadgeProtocol = "jupiter" | "pumpfun" | "orca" | "meteora" | "seeker";
export type BadgeTier = "bronze" | "silver" | "original" | "single";

export interface BadgeCatalogEntry {
  badgeId: BadgeId;
  protocol: BadgeProtocol;
  tier: BadgeTier;
  /** Short label used in the inventory grid (e.g. "Jupiter"). */
  label: string;
  /** Tier-aware full display name (e.g. "Jupiter $10k"). */
  name: string;
  /** Single-glyph shorthand used for the legacy GlyphTile fallback. */
  glyph: string;
  /** OKLCH hue used by the legacy GlyphTile fallback. */
  hue: number;
  /** Old isometric island building type used as a placement fallback. */
  type: BuildingType;
  /** USD threshold (null for single-tier badges like Seeker). */
  thresholdUsd: number | null;
  /** Static first-frame preview filename (served by api at /badges/<file>). */
  previewFile: string;
  /** Animated filename (GIF/APNG) served at /badges/<file>. */
  animationFile: string;
}

const TIER_HUE: Record<BadgeTier, number> = {
  bronze: 28,
  silver: 200,
  original: 50,
  single: 280,
};

const PROTOCOL_BUILDING: Record<BadgeProtocol, BuildingType> = {
  jupiter: "tower",
  pumpfun: "mushroom",
  orca: "dome",
  meteora: "shrine",
  seeker: "lighthouse",
};

const PROTOCOL_GLYPH: Record<BadgeProtocol, string> = {
  jupiter: "J",
  pumpfun: "P",
  orca: "O",
  meteora: "M",
  seeker: "S",
};

const PROTOCOL_LABEL: Record<BadgeProtocol, string> = {
  jupiter: "Jupiter",
  pumpfun: "Pump.fun",
  orca: "Orca",
  meteora: "Meteora",
  seeker: "Seeker",
};

function entry(
  badgeId: BadgeId,
  protocol: BadgeProtocol,
  tier: BadgeTier,
  thresholdUsd: number | null,
  files: { previewFile: string; animationFile: string },
  displayName?: string,
): BadgeCatalogEntry {
  const proto = PROTOCOL_LABEL[protocol];
  const name =
    displayName ??
    (thresholdUsd
      ? `${proto} $${thresholdUsd >= 1000 ? `${thresholdUsd / 1000}k` : thresholdUsd}`
      : proto);
  return {
    badgeId,
    protocol,
    tier,
    label: proto,
    name,
    glyph: PROTOCOL_GLYPH[protocol],
    hue: TIER_HUE[tier],
    type: PROTOCOL_BUILDING[protocol],
    thresholdUsd,
    previewFile: files.previewFile,
    animationFile: files.animationFile,
  };
}

export const BADGE_CATALOG: Record<BadgeId, BadgeCatalogEntry> = {
  jupiter_volume_bronze: entry("jupiter_volume_bronze", "jupiter", "bronze", 1_000, {
    previewFile: "bronze-cat.png",
    animationFile: "bronze-cat.gif",
  }),
  jupiter_volume_silver: entry("jupiter_volume_silver", "jupiter", "silver", 10_000, {
    previewFile: "silver-cat.png",
    animationFile: "silver-cat.gif",
  }),
  jupiter_volume_original: entry("jupiter_volume_original", "jupiter", "original", 100_000, {
    previewFile: "cat.png",
    animationFile: "cat.gif",
  }),
  pumpfun_volume_bronze: entry("pumpfun_volume_bronze", "pumpfun", "bronze", 1_000, {
    previewFile: "bronze-pill.png",
    animationFile: "bronze-pill.gif",
  }),
  pumpfun_volume_silver: entry("pumpfun_volume_silver", "pumpfun", "silver", 10_000, {
    previewFile: "silver-pill.png",
    animationFile: "silver-pill.gif",
  }),
  pumpfun_volume_original: entry("pumpfun_volume_original", "pumpfun", "original", 100_000, {
    previewFile: "pill.png",
    animationFile: "pill.gif",
  }),
  orca_position_bronze: entry("orca_position_bronze", "orca", "bronze", 1_000, {
    previewFile: "bronze-orca.png",
    animationFile: "bronze-orca.gif",
  }),
  orca_position_silver: entry("orca_position_silver", "orca", "silver", 10_000, {
    previewFile: "silver-orca.png",
    animationFile: "silver-orca.gif",
  }),
  orca_position_original: entry("orca_position_original", "orca", "original", 100_000, {
    previewFile: "orca.png",
    animationFile: "orca.gif",
  }),
  meteora_position_bronze: entry("meteora_position_bronze", "meteora", "bronze", 1_000, {
    previewFile: "bronze-meteor.png",
    animationFile: "bronze-meteor.gif",
  }),
  meteora_position_silver: entry("meteora_position_silver", "meteora", "silver", 10_000, {
    previewFile: "silver-meteor.png",
    animationFile: "silver-meteor.gif",
  }),
  meteora_position_original: entry("meteora_position_original", "meteora", "original", 100_000, {
    previewFile: "meteor.png",
    animationFile: "meteor.gif",
  }),
  seeker_genesis: entry(
    "seeker_genesis",
    "seeker",
    "single",
    null,
    { previewFile: "seeker.png", animationFile: "seeker.gif" },
    "Seeker Genesis",
  ),
};

export const BADGE_IDS = Object.keys(BADGE_CATALOG) as BadgeId[];

export function isBadgeId(id: string): id is BadgeId {
  return id in BADGE_CATALOG;
}

export function inventoryItemFromBadge(
  badgeId: string,
  state: InventoryItem["state"],
  isNew?: boolean,
): InventoryItem | null {
  if (!isBadgeId(badgeId)) return null;
  const def = BADGE_CATALOG[badgeId];
  return {
    id: `inv-${badgeId}`,
    badgeId,
    glyph: def.glyph,
    label: def.label,
    protocol: def.label,
    name: def.name,
    hue: def.hue,
    type: def.type,
    state,
    isNew,
  };
}

/**
 * Build the full URL for a badge's animated GIF. `API_BASE_URL` is the
 * NEXT_PUBLIC_API_BASE_URL the frontend was built with.
 */
export function badgeAnimationUrl(
  apiBaseUrl: string,
  badgeId: BadgeId | string,
): string | null {
  if (!isBadgeId(badgeId)) return null;
  const def = BADGE_CATALOG[badgeId];
  return `${apiBaseUrl}/badges/${def.animationFile}`;
}

export function badgePreviewUrl(
  apiBaseUrl: string,
  badgeId: BadgeId | string,
): string | null {
  if (!isBadgeId(badgeId)) return null;
  const def = BADGE_CATALOG[badgeId];
  return `${apiBaseUrl}/badges/${def.previewFile}`;
}
