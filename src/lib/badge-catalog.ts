import type { BuildingType, InventoryItem } from "./types";

export type BadgeId =
  | "first_swap"
  | "jupiter_explorer"
  | "jupiter_power_user"
  | "swap_centurion"
  | "first_nft"
  | "nft_collector"
  | "nft_flipper"
  | "multi_protocol"
  | "early_adopter"
  | "active_trader";

export interface BadgeCatalogEntry {
  badgeId: BadgeId;
  glyph: string;
  label: string;
  protocol: string;
  name: string;
  hue: number;
  type: BuildingType;
}

export const BADGE_CATALOG: Record<BadgeId, BadgeCatalogEntry> = {
  first_swap: { badgeId: "first_swap", glyph: "J", label: "Jupiter", protocol: "Jupiter", name: "First Swap", hue: 30, type: "tower" },
  jupiter_explorer: { badgeId: "jupiter_explorer", glyph: "J", label: "Jupiter", protocol: "Jupiter", name: "Jupiter Explorer", hue: 35, type: "tower" },
  jupiter_power_user: { badgeId: "jupiter_power_user", glyph: "J", label: "Jupiter", protocol: "Jupiter", name: "Jupiter Power User", hue: 25, type: "tower" },
  swap_centurion: { badgeId: "swap_centurion", glyph: "J", label: "Jupiter", protocol: "Jupiter", name: "Swap Centurion", hue: 50, type: "shrine" },
  first_nft: { badgeId: "first_nft", glyph: "M", label: "Magic Eden", protocol: "Magic Eden", name: "First NFT", hue: 320, type: "mushroom" },
  nft_collector: { badgeId: "nft_collector", glyph: "M", label: "Magic Eden", protocol: "Magic Eden", name: "NFT Collector", hue: 300, type: "dome" },
  nft_flipper: { badgeId: "nft_flipper", glyph: "M", label: "Magic Eden", protocol: "Magic Eden", name: "NFT Flipper", hue: 280, type: "mushroom" },
  multi_protocol: { badgeId: "multi_protocol", glyph: "X", label: "Cross", protocol: "Multi-Protocol", name: "Multi-Protocol", hue: 200, type: "crystal" },
  early_adopter: { badgeId: "early_adopter", glyph: "O", label: "Solana", protocol: "Solana", name: "Early Adopter", hue: 180, type: "lighthouse" },
  active_trader: { badgeId: "active_trader", glyph: "T", label: "Trader", protocol: "On-chain", name: "Active Trader", hue: 140, type: "tree" },
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
    protocol: def.protocol,
    name: def.name,
    hue: def.hue,
    type: def.type,
    state,
    isNew,
  };
}
