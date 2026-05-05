import type { LandSummary } from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export type LandsSort = "recent" | "score";

export interface ApiLand {
  wallet: string;
  ogImageUrl: string | null;
  objectsCount?: number;
  score?: number;
  rank?: number;
}

export interface LandsPage {
  items: ApiLand[];
  nextCursor: string | null;
}

export interface FetchLandsParams {
  sort?: LandsSort;
  cursor?: string | null;
  limit?: number;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchLands({
  sort = "recent",
  cursor,
  limit = 20,
  signal,
}: FetchLandsParams = {}): Promise<LandsPage> {
  const url = new URL(`${API_BASE_URL}/api/v1/lands`);
  url.searchParams.set("sort", sort);
  url.searchParams.set("limit", String(limit));
  if (cursor) url.searchParams.set("cursor", cursor);

  const res = await fetch(url.toString(), {
    cache: "no-store",
    signal,
  });

  if (!res.ok) {
    throw new ApiError(`Failed to fetch lands: ${res.status}`, res.status);
  }

  const json = (await res.json()) as LandsPage;
  return {
    items: json.items.map((item) => ({
      wallet: item.wallet,
      ogImageUrl: item.ogImageUrl ?? null,
      objectsCount: item.objectsCount ?? 0,
      score: item.score ?? 0,
      rank: item.rank,
    })),
    nextCursor: json.nextCursor ?? null,
  };
}

export type FeedItem =
  | {
      type: "mint";
      at: string;
      wallet: string;
      badgeId: string;
      assetId: string;
    }
  | {
      type: "placement";
      at: string;
      wallet: string;
      badgeId: string;
      x: number;
      y: number;
    };

export interface FeedPage {
  items: FeedItem[];
  nextCursor: string | null;
}

export interface FetchFeedParams {
  cursor?: string | null;
  limit?: number;
  signal?: AbortSignal;
}

export async function fetchFeed({
  cursor,
  limit = 30,
  signal,
}: FetchFeedParams = {}): Promise<FeedPage> {
  const url = new URL(`${API_BASE_URL}/api/v1/feed`);
  url.searchParams.set("limit", String(limit));
  if (cursor) url.searchParams.set("cursor", cursor);

  const res = await fetch(url.toString(), { cache: "no-store", signal });
  if (!res.ok) {
    throw new ApiError(`Failed to fetch feed: ${res.status}`, res.status);
  }
  return (await res.json()) as FeedPage;
}

export type BadgeTier = "common" | "rare" | "epic" | "legendary";

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  tier: BadgeTier;
  weight: number;
}

export async function fetchBadges(signal?: AbortSignal): Promise<Badge[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/badges`, {
    // Badges are catalog data — safe to cache briefly.
    next: { revalidate: 60 },
    signal,
  });
  if (!res.ok) {
    throw new ApiError(`Failed to fetch badges: ${res.status}`, res.status);
  }
  const json = (await res.json()) as { items: Badge[] };
  return json.items;
}

export interface ApiLandDetails {
  wallet: string;
  stats: {
    protocols: number;
    transactions: number;
    score: number;
  };
  placements: Array<{
    badgeId: string;
    x: number;
    y: number;
  }>;
  ogImageUrl: string | null;
}

export interface ApiInventoryClaimedItem {
  badgeId: string;
  weight: number;
  assetId: string;
}

export interface ApiInventoryEligibleItem {
  badgeId: string;
  weight: number;
  eligibleSince: string;
  meta?: Record<string, string>;
}

export interface ApiInventory {
  claimed: ApiInventoryClaimedItem[];
  eligible: ApiInventoryEligibleItem[];
}

export async function fetchLandByWallet(
  wallet: string,
  signal?: AbortSignal,
): Promise<ApiLandDetails> {
  const encodedWallet = encodeURIComponent(wallet);
  const res = await fetch(`${API_BASE_URL}/api/v1/lands/${encodedWallet}`, {
    cache: "no-store",
    credentials: "include",
    signal,
  });
  if (!res.ok) {
    throw new ApiError(`Failed to fetch land: ${res.status}`, res.status);
  }
  return (await res.json()) as ApiLandDetails;
}

export async function fetchLandInventory(
  wallet: string,
  signal?: AbortSignal,
): Promise<ApiInventory> {
  const encodedWallet = encodeURIComponent(wallet);
  const res = await fetch(
    `${API_BASE_URL}/api/v1/lands/${encodedWallet}/inventory`,
    {
      cache: "no-store",
      credentials: "include",
      signal,
    },
  );
  if (!res.ok) {
    throw new ApiError(`Failed to fetch land inventory: ${res.status}`, res.status);
  }
  return (await res.json()) as ApiInventory;
}

// Map an API land into the dashboard's LandSummary view-model.
export function toLandSummary(item: ApiLand): LandSummary {
  return {
    address: item.wallet,
    objectsCount: item.objectsCount ?? 0,
    points: item.score ?? 0,
    rank: item.rank,
    seed: walletSeed(item.wallet),
  };
}

// Stable numeric seed derived from the wallet so MiniIsland renders
// the same scene across reloads without leaking a real RNG.
function walletSeed(wallet: string): number {
  let h = 2166136261;
  for (let i = 0; i < wallet.length; i++) {
    h ^= wallet.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}
