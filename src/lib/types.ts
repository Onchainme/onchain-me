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
  /**
   * Item lifecycle:
   *   placed   — minted cNFT currently on the user's island
   *   claimed  — minted cNFT not yet placed
   *   eligible — earned via scan, ready to mint (paid)
   *   locked   — catalog entry the user hasn't earned yet; visible but inert
   */
  state: "placed" | "claimed" | "eligible" | "locked";
  isNew?: boolean;
  name: string;
  /** cNFT asset id for claimed/placed items. Empty for eligible-only entries. */
  assetId?: string | null;
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
