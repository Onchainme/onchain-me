import type { InventoryItem, LandObject, LandSummary } from "./types";

// Placeholder strings used in dashboards before a wallet is connected.
export const MY_WALLET = "0x1A2B3C4D5E6F7890ABCDEF1234567890ABCDEF3C4D";
export const MY_SHORT = "0x1A2B…3C4D";

// Empty by default — the edit page derives placed objects from the backend
// (or from local placement state once the user drops items on tiles).
export const PLACED_OBJECTS: LandObject[] = [];

// Empty by default — the inventory hook fetches the wallet's real inventory
// from the API and populates this list.
export const INITIAL_INVENTORY: InventoryItem[] = [];

export const LAND_DIRECTORY: LandSummary[] = [
  {
    address: "0x1A2B…3C4D",
    displayName: "you.sol",
    objectsCount: 27,
    points: 2140,
    rank: 1,
    seed: 1,
    featured: true,
    rarityPct: 1,
  },
  {
    address: "0xBEEF…0001",
    objectsCount: 21,
    points: 1240,
    rank: 12,
    seed: 2,
  },
  {
    address: "0x3A77…EF02",
    objectsCount: 17,
    points: 980,
    rank: 28,
    seed: 4,
  },
  {
    address: "0x9F87…22E1",
    objectsCount: 9,
    points: 540,
    rank: 91,
    seed: 3,
    badge: "RISING",
  },
  {
    address: "0x5C5C…9A9A",
    objectsCount: 12,
    points: 710,
    rank: 47,
    seed: 7,
  },
  {
    address: "0x1111…2222",
    objectsCount: 4,
    points: 180,
    rank: 204,
    seed: 6,
  },
  {
    address: "0xDEAD…CA11",
    objectsCount: 6,
    points: 310,
    rank: 158,
    seed: 5,
  },
  {
    address: "0x4242…4242",
    objectsCount: 8,
    points: 420,
    rank: 122,
    seed: 8,
  },
];

export const LIVE_TICKER = [
  { addr: "0x3A77…EF02", action: "minted", target: "Jupiter Power User" },
  { addr: "0xBEEF…0001", action: "placed", target: "Magic Eden Minter" },
  { addr: "0x9F87…22E1", action: "reached", target: "rank #91" },
];

export const STATS = {
  protocols: 7,
  transactions: 1284,
  points: 820,
  objects: 7,
  eligible: 4,
  mintedTotal: 12483,
  today: 47,
};

export const tileLabel = (gx: number, gy: number) =>
  `${String.fromCharCode(65 + gx)}-${gy + 1}`;
