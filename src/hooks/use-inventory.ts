"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Connection, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import type { InventoryItem, LandObject } from "@/lib/types";
import { tileLabel } from "@/lib/mock-data";
import { BADGE_CATALOG, BADGE_IDS, isBadgeId } from "@/lib/badge-catalog";
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

/**
 * Linear stages a single mint walks through. The UI renders this as a stepper
 * so users see real-time progress instead of a generic "MINT PENDING…" spinner
 * (which previously left them assuming the flow was hung and reloading the
 * page mid-flight).
 */
export type MintStage =
  | "idle"
  | "preparing"
  | "signing"
  | "sending"
  | "confirming"
  | "indexing"
  | "done"
  | "error";

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
  /** Current stage of the active mint (single or batch). */
  mintStage: MintStage;
  /** Batch progress for mintAll; null when minting a single item. */
  mintBatchProgress: { current: number; total: number } | null;
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
  // Two id schemes feed into the placed list and we must invert both:
  //   1. placedIdFor("inv-<badgeId>")            → "placed:inv-<badgeId>:<timestamp>"
  //   2. buildPlacedFromApi (server-loaded)      → "placed:inv-<badgeId>:<x>:<y>"
  // `inv-<badgeId>` never contains a colon (badge ids are snake_case), so the
  // first colon always ends the inventory id portion. Using `indexOf` instead
  // of `lastIndexOf` correctly handles both formats — the previous lastIndexOf
  // returned "inv-X:4" for the API format, which never matched any inventory
  // item, so removing a placed badge left the inventory state stuck on
  // "placed" and the user couldn't re-place it without a hard reload.
  const sep = withoutPrefix.indexOf(":");
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
  const seen = new Set(out.map((it) => it.badgeId));
  for (const elig of api.eligible) {
    if (!isBadgeId(elig.badgeId)) continue;
    seen.add(elig.badgeId);
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
  // Round out the inventory with every catalog badge the wallet hasn't earned
  // yet. Shown as "locked" — visible but disabled — so the user understands
  // the full set of achievable badges instead of staring at an empty list
  // before the first scan completes. Ordering matches BADGE_IDS (which mirrors
  // the registry order: jupiter → pumpfun → orca → meteora → seeker).
  for (const badgeId of BADGE_IDS) {
    if (seen.has(badgeId)) continue;
    const def = BADGE_CATALOG[badgeId];
    out.push({
      id: `inv-${badgeId}`,
      badgeId,
      glyph: def.glyph,
      label: def.label,
      protocol: def.protocol,
      name: def.name,
      hue: def.hue,
      type: def.type,
      state: "locked",
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
  const [mintStage, setMintStage] = useState<MintStage>("idle");
  const [mintBatchProgress, setMintBatchProgress] = useState<
    { current: number; total: number } | null
  >(null);
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
      setMintStage("preparing");
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
        setMintStage("signing");
        const signed = await signTransaction(tx);

        setMintStage("sending");
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

        setMintStage("confirming");
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

        setMintStage("indexing");

        // Backend confirm — retry briefly: tx may still be propagating to RPC the
        // backend uses, even after we've seen it confirmed locally.
        let backendOk = false;
        for (let i = 0; i < 6; i++) {
          try {
            await confirmMint(signatureB58, badgeId);
            console.log(`[mint] ${badgeId}: backend confirmed (attempt ${i + 1})`);
            backendOk = true;
            break;
          } catch (err) {
            const status = err instanceof ApiError ? err.status : 0;
            console.warn(
              `[mint] ${badgeId}: backend confirm attempt ${i + 1} failed (status ${status})`,
              err,
            );
            if (status !== 422) break;
            await new Promise((r) => setTimeout(r, 1500));
          }
        }

        // Indexing fallback: the cNFT is already on-chain at this point. Even
        // if `/mint/confirm` keeps failing (transient backend issue, slow RPC,
        // 5xx), we can still pull the claim by re-running on-chain import via
        // DAS and polling the inventory until the badge shows up as claimed.
        // Previously a confirmMint failure silently threw, leaving the user
        // staring at a stuck "MINT PENDING…" until a hard refresh re-imported.
        if (!backendOk) {
          console.warn(`[mint] ${badgeId}: backend confirm did not succeed, falling back to on-chain import + inventory poll`);
          try {
            await importCnfts();
          } catch (err) {
            console.warn(`[mint] ${badgeId}: importCnfts fallback failed`, err);
          }
          for (let i = 0; i < 12; i++) {
            try {
              const inv = await fetchInventory(walletAddress);
              if (inv.claimed.some((c) => c.badgeId === badgeId)) {
                backendOk = true;
                console.log(`[mint] ${badgeId}: claim appeared via DAS import (poll ${i + 1})`);
                break;
              }
            } catch (err) {
              console.warn(`[mint] ${badgeId}: inventory poll ${i + 1} failed`, err);
            }
            await new Promise((r) => setTimeout(r, 2500));
          }
        }

        if (!backendOk) {
          throw new Error(
            "Mint confirmed on-chain but indexing is delayed. It will appear shortly — pull to refresh.",
          );
        }

        // Next refresh must run on-chain import again — otherwise we only
        // imported cNFTs once per wallet session and new mints stay invisible
        // until a full page reload.
        importedForWalletRef.current = null;

        // Notify other components (Hero banner, StatsRail, MintToast) so they
        // re-fetch /lands and /inventory and reflect the new score / claimed
        // count without waiting for the next page reload. The toast also needs
        // signature so it can deep-link to the explorer.
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("onchainme:mint", {
              detail: { badgeId, signature: signatureB58 },
            }),
          );
        }

        setMintStage("done");
      } catch (err) {
        console.error(`[mint] ${badgeId}: FAILED`, err);
        setMintStage("error");
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
      setMintBatchProgress(null);
      setMintStage("idle");
      try {
        await mintBadge(item.badgeId);
        await refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "mint failed";
        setError(msg);
        throw err;
      }
    },
    [inventory, mintBadge, refresh],
  );

  const mintAll = useCallback(async () => {
    const eligible = inventory.filter((i) => i.state === "eligible");
    setMintStage("idle");
    setMintBatchProgress({ current: 0, total: eligible.length });
    try {
      for (let i = 0; i < eligible.length; i++) {
        setMintBatchProgress({ current: i + 1, total: eligible.length });
        await mintBadge(eligible[i].badgeId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "mint batch failed");
      throw err;
    } finally {
      importedForWalletRef.current = null;
      await refresh();
    }
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
    mintStage,
    mintBatchProgress,
    lastScanAt,
    mintConfig,
  };
}
