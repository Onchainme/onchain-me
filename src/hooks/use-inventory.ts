"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Connection, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import type { InventoryItem, LandObject } from "@/lib/types";
import { tileLabel } from "@/lib/mock-data";
import { BADGE_CATALOG, isBadgeId } from "@/lib/badge-catalog";
import {
  ApiError,
  confirmMint,
  fetchInventory,
  fetchLand,
  fetchMintConfig,
  importCnfts,
  putPlacements,
  requestMintSingle,
  runScan,
  seedAllEligibilities,
  type InventoryResponse,
  type LandPlacementApi,
  type MintConfig,
} from "@/lib/api";
import { useWallet } from "@/hooks/wallet";

interface UseInventoryResult {
  inventory: InventoryItem[];
  placed: LandObject[];
  activeItemId: string | null;
  setActiveItem: (id: string | null) => void;
  placeAt: (gx: number, gy: number) => boolean;
  removeObject: (placedId: string) => void;
  mintItem: (inventoryId: string) => Promise<void>;
  mintAll: () => Promise<void>;
  rescan: () => Promise<void>;
  seedAll: () => Promise<void>;
  eligibleCount: number;
  claimedCount: number;
  loading: boolean;
  error: string | null;
  busyBadgeId: string | null;
  /** ISO timestamp of the most recent wallet scan, null if never scanned. */
  lastScanAt: string | null;
  /** Per-mint price in lamports + creator destination. null while loading. */
  mintConfig: MintConfig | null;
}

const PLACED_PREFIX = "placed:";
// Default to mainnet public RPC. Local dev with `NEXT_PUBLIC_SOLANA_CLUSTER=devnet`
// can opt into devnet via NEXT_PUBLIC_SOLANA_RPC_URL. Falling back to devnet
// here caused mainnet mints to fail with "Blockhash not found" because the
// backend builds tx on mainnet but frontend submitted to the wrong cluster.
const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com");

function placedIdFor(inventoryId: string) {
  return `${PLACED_PREFIX}${inventoryId}:${Date.now()}`;
}

function inventoryIdFromPlaced(placedId: string): string | null {
  if (!placedId.startsWith(PLACED_PREFIX)) return null;
  const withoutPrefix = placedId.slice(PLACED_PREFIX.length);
  const sep = withoutPrefix.lastIndexOf(":");
  return sep === -1 ? withoutPrefix : withoutPrefix.slice(0, sep);
}

function buildInventoryFromApi(
  api: InventoryResponse,
  placedBadgeIds: Set<string>,
): InventoryItem[] {
  const out: InventoryItem[] = [];
  for (const claim of api.claimed) {
    if (!isBadgeId(claim.badgeId)) continue;
    const def = BADGE_CATALOG[claim.badgeId];
    const assetId = claim.assetId && claim.assetId !== "unknown" ? claim.assetId : null;
    out.push({
      id: `inv-${claim.badgeId}`,
      badgeId: claim.badgeId,
      glyph: def.glyph,
      label: def.label,
      protocol: def.protocol,
      name: def.name,
      hue: def.hue,
      type: def.type,
      state: placedBadgeIds.has(claim.badgeId) ? "placed" : "claimed",
      assetId,
    });
  }
  for (const elig of api.eligible) {
    if (!isBadgeId(elig.badgeId)) continue;
    const def = BADGE_CATALOG[elig.badgeId];
    out.push({
      id: `inv-${elig.badgeId}`,
      badgeId: elig.badgeId,
      glyph: def.glyph,
      label: def.label,
      protocol: def.protocol,
      name: def.name,
      hue: def.hue,
      type: def.type,
      state: "eligible",
      isNew: true,
    });
  }
  return out;
}

function buildPlacedFromApi(placements: LandPlacementApi[]): LandObject[] {
  const out: LandObject[] = [];
  for (const p of placements) {
    if (!isBadgeId(p.badgeId)) continue;
    const def = BADGE_CATALOG[p.badgeId];
    out.push({
      id: `placed:inv-${p.badgeId}:${p.x}:${p.y}`,
      badgeId: p.badgeId,
      gx: p.x,
      gy: p.y,
      hue: def.hue,
      glyph: def.glyph,
      type: def.type,
      name: def.name,
      protocol: def.protocol,
      tile: tileLabel(p.x, p.y),
      mintedAt: new Date().toISOString().slice(0, 10),
    });
  }
  return out;
}

function decodeBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function useInventory(): UseInventoryResult {
  const { wallet, signTransaction } = useWallet();
  const walletAddress = wallet?.address ?? null;

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [placed, setPlaced] = useState<LandObject[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyBadgeId, setBusyBadgeId] = useState<string | null>(null);
  const [lastScanAt, setLastScanAt] = useState<string | null>(null);
  const [mintConfig, setMintConfig] = useState<MintConfig | null>(null);

  // Backend's mint price + creator address are deploy-time config; pull once
  // per session so every mint modal can render the actual cost. Cached on the
  // server, so this is one ~50ms request on first inventory mount.
  useEffect(() => {
    const ac = new AbortController();
    fetchMintConfig(ac.signal)
      .then(setMintConfig)
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.warn("[mint] failed to fetch mint config:", err);
        }
      });
    return () => ac.abort();
  }, []);

  const connectionRef = useRef<Connection | null>(null);
  if (!connectionRef.current) {
    connectionRef.current = new Connection(SOLANA_RPC_URL, "confirmed");
  }
  // Track per-wallet whether we've already run on-chain import this session,
  // so we don't hammer DAS on every refresh.
  const importedForWalletRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setInventory([]);
      setPlaced([]);
      setLastScanAt(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // First time we see this wallet in the session, scan its on-chain
      // cNFTs and import any minted-but-not-tracked badges. Idempotent on the
      // backend, but skipping the round-trip on subsequent refreshes is nicer.
      if (importedForWalletRef.current !== walletAddress) {
        try {
          const r = await importCnfts();
          if (r.imported > 0) {
            console.log(
              `[import] backfilled ${r.imported} on-chain cNFTs (+${r.scoreDelta} pts): ${r.badgeIds.join(", ")}`,
            );
          }
          importedForWalletRef.current = walletAddress;
        } catch (err) {
          // Non-fatal: just log. The user can still mint; they may end up with
          // duplicates if the import is unavailable.
          console.warn("[import] failed", err);
        }
      }

      // Fetch inventory + land in parallel. Land may 404 if user has no
      // placements + no claims yet — treat as "empty placements".
      const [invApi, landApi] = await Promise.all([
        fetchInventory(walletAddress),
        fetchLand(walletAddress).catch((err) => {
          if (err instanceof ApiError && err.status === 404) return null;
          throw err;
        }),
      ]);
      const placements = landApi?.placements ?? [];
      const placedBadgeIds = new Set(placements.map((p) => p.badgeId));
      setInventory(buildInventoryFromApi(invApi, placedBadgeIds));
      setPlaced(buildPlacedFromApi(placements));
      setLastScanAt(invApi.lastScanAt ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const persistPlacements = useCallback(
    async (next: LandObject[]) => {
      if (!walletAddress) return;
      try {
        await putPlacements(
          walletAddress,
          next.map((o) => ({ badgeId: o.badgeId ?? "", x: o.gx, y: o.gy })).filter(
            (p) => p.badgeId.length > 0,
          ),
        );
      } catch (err) {
        // Surface the error and refresh to stay in sync with the server.
        setError(err instanceof Error ? err.message : "save placements failed");
        await refresh();
      }
    },
    [walletAddress, refresh],
  );

  const placeAt = useCallback(
    (gx: number, gy: number) => {
      if (!activeItemId) return false;
      const item = inventory.find((i) => i.id === activeItemId);
      if (!item || item.state !== "claimed") return false;
      if (placed.some((o) => o.gx === gx && o.gy === gy)) return false;
      if (placed.some((o) => o.badgeId === item.badgeId)) return false;

      const next: LandObject[] = [
        ...placed,
        {
          id: placedIdFor(item.id),
          badgeId: item.badgeId,
          gx,
          gy,
          hue: item.hue,
          glyph: item.glyph,
          type: item.type,
          name: item.name,
          protocol: item.protocol,
          tile: tileLabel(gx, gy),
          mintedAt: new Date().toISOString().slice(0, 10),
        },
      ];
      setPlaced(next);
      setInventory((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, state: "placed" } : i)),
      );
      setActiveItemId(null);
      void persistPlacements(next);
      return true;
    },
    [activeItemId, inventory, placed, persistPlacements],
  );

  const removeObject = useCallback(
    (placedId: string) => {
      const target = placed.find((o) => o.id === placedId);
      if (!target) return;
      const next = placed.filter((o) => o.id !== placedId);
      setPlaced(next);
      const inventoryId = inventoryIdFromPlaced(placedId);
      if (inventoryId) {
        setInventory((prev) =>
          prev.map((i) => (i.id === inventoryId ? { ...i, state: "claimed" } : i)),
        );
      }
      void persistPlacements(next);
    },
    [placed, persistPlacements],
  );

  const mintBadge = useCallback(
    async (badgeId: string) => {
      if (!walletAddress) throw new Error("Wallet not connected");

      setBusyBadgeId(badgeId);
      setError(null);
      try {
        console.log(`[mint] ${badgeId}: requesting tx from backend...`);
        const { transaction } = await requestMintSingle(badgeId);
        console.log(`[mint] ${badgeId}: got tx (${transaction.length} chars b64)`);
        const txBytes = decodeBase64(transaction);
        const tx = VersionedTransaction.deserialize(txBytes);
        console.log(`[mint] ${badgeId}: deserialized, signers count=${tx.signatures.length}`);

        // Paid-mint flow: the backend partial-signed with the tree authority
        // (Bubblegum requires it). The leafOwner (user) is now the fee payer
        // AND signs the SystemProgram.transfer to the creator address, so the
        // wallet adapter must add the second signature before submit.
        // (Sponsored mode falls under the same path — the tx still has the
        // user as fee payer, just without the transfer ix.)
        const signed = await signTransaction(tx);
        const connection = connectionRef.current!;
        let sig: string;
        try {
          sig = await connection.sendRawTransaction(signed.serialize(), {
            skipPreflight: false,
            maxRetries: 3,
          });
        } catch (err) {
          console.error(`[mint] ${badgeId}: sendRawTransaction failed`, err);
          throw err;
        }
        console.log(`[mint] ${badgeId}: sent, signature=${sig}`);

        const latest = await connection.getLatestBlockhash("confirmed");
        try {
          await connection.confirmTransaction(
            {
              signature: sig,
              blockhash: latest.blockhash,
              lastValidBlockHeight: latest.lastValidBlockHeight,
            },
            "confirmed",
          );
        } catch (err) {
          console.error(`[mint] ${badgeId}: confirmTransaction failed`, err);
          throw err;
        }
        console.log(`[mint] ${badgeId}: confirmed on-chain`);

        const signatureB58 =
          typeof sig === "string" ? sig : bs58.encode(sig as unknown as Uint8Array);

        // Backend confirm — retry briefly: tx may still be propagating to RPC the
        // backend uses, even after we've seen it confirmed locally.
        let lastErr: unknown = null;
        for (let i = 0; i < 6; i++) {
          try {
            await confirmMint(signatureB58, badgeId);
            console.log(`[mint] ${badgeId}: backend confirmed (attempt ${i + 1})`);
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err;
            const status = err instanceof ApiError ? err.status : 0;
            console.warn(`[mint] ${badgeId}: backend confirm attempt ${i + 1} failed (status ${status})`, err);
            if (status !== 422) break;
            await new Promise((r) => setTimeout(r, 1500));
          }
        }
        if (lastErr) throw lastErr;

        // Notify other components (Hero banner, StatsRail) so they re-fetch
        // /lands and /inventory and reflect the new score / claimed count
        // without waiting for the next page reload.
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("onchainme:mint", { detail: { badgeId } }));
        }
      } catch (err) {
        console.error(`[mint] ${badgeId}: FAILED`, err);
        throw err;
      } finally {
        setBusyBadgeId(null);
      }
    },
    [walletAddress, signTransaction],
  );

  const mintItem = useCallback(
    async (inventoryId: string) => {
      const item = inventory.find((i) => i.id === inventoryId);
      if (!item || item.state !== "eligible") return;
      try {
        await mintBadge(item.badgeId);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "mint failed");
      }
    },
    [inventory, mintBadge, refresh],
  );

  const mintAll = useCallback(async () => {
    const eligible = inventory.filter((i) => i.state === "eligible");
    for (const item of eligible) {
      try {
        await mintBadge(item.badgeId);
      } catch (err) {
        setError(err instanceof Error ? err.message : `mint ${item.badgeId} failed`);
        break;
      }
    }
    await refresh();
  }, [inventory, mintBadge, refresh]);

  /**
   * Explicit dev-seed: grants every badgeId as eligible for the connected
   * wallet. Only succeeds when the backend has ALLOW_DEV_ROUTES=true (or
   * NODE_ENV=development). Used for UI testing without real on-chain
   * activity / Helius key.
   */
  const seedAll = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await seedAllEligibilities();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "seed failed");
    }
  }, [walletAddress, refresh]);

  /**
   * Real wallet scan: enqueues a worker job that pulls swap txs via Helius,
   * sums per-protocol USD volume incrementally, queries Orca/Meteora/Seeker
   * positions on-chain, and rewrites BadgeEligibility from the resulting
   * UserState. Eligibilities reflect actual on-chain reality — empty wallets
   * end up with zero eligible badges.
   */
  const smartRescan = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const status = await runScan(walletAddress, "incremental");
      if (status.status === "failed") {
        setError(status.error ?? "scan failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "scan failed");
    } finally {
      await refresh();
    }
  }, [walletAddress, refresh]);

  const eligibleCount = useMemo(
    () => inventory.filter((i) => i.state === "eligible").length,
    [inventory],
  );
  const claimedCount = useMemo(
    () => inventory.filter((i) => i.state === "claimed").length,
    [inventory],
  );

  return {
    inventory,
    placed,
    activeItemId,
    setActiveItem: setActiveItemId,
    placeAt,
    removeObject,
    mintItem,
    mintAll,
    rescan: smartRescan,
    seedAll,
    eligibleCount,
    claimedCount,
    loading,
    error,
    busyBadgeId,
    lastScanAt,
    mintConfig,
  };
}
