export type BuildingType =
  | "tower"
  | "crystal"
  | "tree"
  | "dome"
  | "mushroom"
  | "shrine"
  | "lighthouse";

export interface LandObject {
  id: string;
  badgeId?: string;
  gx: number;
  gy: number;
  hue: number;
  glyph: string;
  type: BuildingType;
  name: string;
  protocol: string;
  tile: string;
  mintedAt: string;
}

export interface InventoryItem {
  id: string;
  badgeId: string;
  glyph: string;
  label: string;
  protocol: string;
  hue: number;
  type: BuildingType;
  state: "placed" | "claimed" | "eligible";
  isNew?: boolean;
  name: string;
}

export interface LandSummary {
  address: string;
  displayName?: string;
  objectsCount: number;
  points: number;
  rank?: number;
  seed: number;
  featured?: boolean;
  badge?: string;
  rarityPct?: number;
}

export interface Wallet {
  address: string;
  shortAddress: string;
}
