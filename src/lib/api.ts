import type { LandSummary } from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export type LandsSort = "recent" | "score";

export interface ApiLand {
  wallet: string;
  ogImageUrl: string | null;
  objectsCount: number;
  score: number;
  rank: number;
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

  return (await res.json()) as LandsPage;
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

export interface InventoryClaimedApi {
  badgeId: string;
  weight: number;
  assetId: string;
}

export interface InventoryEligibleApi {
  badgeId: string;
  weight: number;
  eligibleSince: string;
  meta: Record<string, unknown>;
}

export interface InventoryResponse {
  claimed: InventoryClaimedApi[];
  eligible: InventoryEligibleApi[];
}

export async function fetchInventory(
  wallet: string,
  signal?: AbortSignal,
): Promise<InventoryResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/lands/${wallet}/inventory`, {
    credentials: "include",
    cache: "no-store",
    signal,
  });
  if (!res.ok) {
    throw new ApiError(`Failed to fetch inventory: ${res.status}`, res.status);
  }
  return (await res.json()) as InventoryResponse;
}

export async function requestMintSingle(badgeId: string): Promise<{
  transaction: string;
  badgeId: string;
  expiresAt: string;
}> {
  const res = await fetch(`${API_BASE_URL}/api/v1/mint/single`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ badgeId }),
  });
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const body = (await res.json()) as { error?: { message?: string; code?: string } };
      if (body.error) detail = `${body.error.code ?? res.status}: ${body.error.message ?? ""}`;
    } catch {}
    throw new ApiError(`mint/single failed: ${detail}`, res.status);
  }
  return (await res.json()) as { transaction: string; badgeId: string; expiresAt: string };
}

export async function confirmMint(
  signature: string,
  badgeId: string,
): Promise<{
  badgeId: string;
  mintSignature: string;
  assetId: string | null;
  alreadyClaimed: boolean;
}> {
  const res = await fetch(`${API_BASE_URL}/api/v1/mint/confirm`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signature, badgeId }),
  });
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const body = (await res.json()) as { error?: { message?: string; code?: string } };
      if (body.error) detail = `${body.error.code ?? res.status}: ${body.error.message ?? ""}`;
    } catch {}
    throw new ApiError(`mint/confirm failed: ${detail}`, res.status);
  }
  return (await res.json()) as {
    badgeId: string;
    mintSignature: string;
    assetId: string | null;
    alreadyClaimed: boolean;
  };
}

export async function seedEligibility(badgeId: string): Promise<{ created: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/dev/seed-eligibility`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ badgeId }),
  });
  if (!res.ok) {
    throw new ApiError(`seed-eligibility failed: ${res.status}`, res.status);
  }
  return (await res.json()) as { created: boolean };
}

export interface LandPlacementApi {
  badgeId: string;
  x: number;
  y: number;
}

export interface LandResponse {
  wallet: string;
  stats: {
    protocols: number;
    transactions: number;
    score: number;
    rank: number;
  };
  placements: LandPlacementApi[];
  ogImageUrl: string | null;
}

export async function fetchLand(wallet: string, signal?: AbortSignal): Promise<LandResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/lands/${wallet}`, {
    cache: "no-store",
    signal,
  });
  if (!res.ok) {
    throw new ApiError(`Failed to fetch land: ${res.status}`, res.status);
  }
  return (await res.json()) as LandResponse;
}

export async function putPlacements(
  wallet: string,
  placements: LandPlacementApi[],
): Promise<{ ok: true; count: number }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/placements/${wallet}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ placements }),
  });
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const body = (await res.json()) as { error?: { message?: string; code?: string } };
      if (body.error) detail = `${body.error.code ?? res.status}: ${body.error.message ?? ""}`;
    } catch {}
    throw new ApiError(`placements PUT failed: ${detail}`, res.status);
  }
  return (await res.json()) as { ok: true; count: number };
}

export interface ImportResult {
  imported: number;
  badgeIds: string[];
  skipped: number;
  assetsScanned: number;
  scoreDelta: number;
}

export async function importCnfts(): Promise<ImportResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/import/scan-cnfts`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const body = (await res.json()) as { error?: { message?: string; code?: string } };
      if (body.error) detail = `${body.error.code ?? res.status}: ${body.error.message ?? ""}`;
    } catch {}
    throw new ApiError(`import/scan-cnfts failed: ${detail}`, res.status);
  }
  return (await res.json()) as ImportResult;
}

export async function seedAllEligibilities(): Promise<{ badgeIds: string[]; createdCount: number }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/dev/seed-eligibilities-all`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) {
    throw new ApiError(`seed-eligibilities-all failed: ${res.status}`, res.status);
  }
  return (await res.json()) as { badgeIds: string[]; createdCount: number };
}

// ---------------------------------------------------------------------------
// Backwards-compatibility aliases — older code on the `dev` branch (e.g.
// app/my-land/page.tsx) imports these names. Forwarding to the canonical
// fetchLand/fetchInventory keeps that code working without a refactor.
// ---------------------------------------------------------------------------
export type ApiLandDetails = LandResponse;
export type ApiInventory = InventoryResponse;
export type ApiInventoryClaimedItem = InventoryClaimedApi;
export type ApiInventoryEligibleItem = InventoryEligibleApi;

export const fetchLandByWallet = (wallet: string, signal?: AbortSignal) =>
  fetchLand(wallet, signal);
export const fetchLandInventory = (wallet: string, signal?: AbortSignal) =>
  fetchInventory(wallet, signal);

// Map an API land into the dashboard's LandSummary view-model.
export function toLandSummary(item: ApiLand): LandSummary {
  return {
    address: item.wallet,
    objectsCount: item.objectsCount,
    points: item.score,
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
