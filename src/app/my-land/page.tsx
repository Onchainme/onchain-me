"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/dashboard/page-shell";
import { StatsRail } from "@/components/dashboard/stats-rail";
import { MapFrame } from "@/components/dashboard/map-frame";
import { ObjectTooltip } from "@/components/dashboard/object-tooltip";
import { Button } from "@/components/ui/button";
import { IsometricIsland } from "@/components/canvas/IsometricIsland";
import { useWallet } from "@/hooks/wallet";
import { MY_SHORT } from "@/lib/mock-data";
import { UI_LAYOUT, UI_TEXT } from "@/lib/ui-styles";
import {
  fetchLandByWallet,
  fetchLandInventory,
  type ApiInventory,
  type ApiLandDetails,
} from "@/lib/api";
import type { BuildingType, LandObject } from "@/lib/types";

const ShareModal = dynamic(
  () => import("@/components/modals/share-modal").then((m) => m.ShareModal),
  { ssr: false },
);

const ISLAND_W = 940;
const ISLAND_H = 720;

export default function MyLandPage() {
  const { isConnected, isSessionReady, wallet, openConnectModal } = useWallet();
  const router = useRouter();
  const [placed, setPlaced] = useState<LandObject[]>([]);
  const [hovered, setHovered] = useState<number | null>(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<ApiInventory | null>(null);
  const [landData, setLandData] = useState<ApiLandDetails | null>(null);

  // Guard: this page requires a wallet.
  useEffect(() => {
    if (!isSessionReady) return;
    if (!isConnected) {
      openConnectModal();
      router.replace("/");
    }
  }, [isConnected, isSessionReady, openConnectModal, router]);

  useEffect(() => {
    if (!wallet?.address) return;
    const ctrl = new AbortController();
    setIsLoading(true);
    setLoadError(null);

    Promise.all([
      fetchLandByWallet(wallet.address, ctrl.signal),
      fetchLandInventory(wallet.address, ctrl.signal),
    ])
      .then(([land, inv]) => {
        setLandData(land);
        setInventory(inv);
        const mapped = land.placements.map((placement, index) => placementToLandObject(placement, index));
        setPlaced(mapped);
        setHovered(mapped.length > 0 ? 0 : null);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setLoadError(e instanceof Error ? e.message : "Failed to load your land");
        setLandData(null);
        setPlaced([]);
        setHovered(null);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
  }, [wallet?.address]);

  if (!isSessionReady || !isConnected) return null;

  const hoveredObj = hovered != null ? placed[hovered] : null;
  const shortAddress = wallet?.shortAddress ?? MY_SHORT;
  const fullAddress = wallet?.address ?? shortAddress;
  const eligibleCount = inventory?.eligible.length ?? 0;
  const claimedCount = inventory?.claimed.length ?? 0;
  const errorView = formatLoadError(loadError);
  const helperText = isLoading
    ? "LOADING LAND DATA..."
    : loadError
      ? "FAILED TO LOAD LAND DATA"
      : placed.length === 0
        ? "NO PLACED OBJECTS YET"
        : `HOVER A BUILDING FOR DETAILS · CLAIMED ${claimedCount} · ELIGIBLE ${eligibleCount}`;

  return (
    <PageShell>
      <div className={`${UI_LAYOUT.pageGrid} grid-cols-1 lg:grid-cols-[280px_1fr]`}>
        <StatsRail address={shortAddress} stats={landData?.stats} />
        <MapFrame
          label="YOUR ISLAND"
          action={
            <Button variant="cyan" onClick={() => setShareOpen(true)}>
              ↗ Share the Land
            </Button>
          }
        >
          <div className="relative h-200 flex items-center justify-center">
            <IsometricIsland
              width={ISLAND_W}
              height={ISLAND_H}
              objects={placed}
              hoveredIndex={hovered}
              onHoverObject={setHovered}
            />
            {isLoading ? (
              <div className="absolute inset-0 z-20 grid place-items-center bg-[rgba(10,6,18,0.35)]">
                <div className={`${UI_TEXT.labelText} glow-c`}>LOADING...</div>
              </div>
            ) : null}
            {hoveredObj ? (
              <ObjectTooltip obj={hoveredObj} style={{ left: "54%", top: "10%" }} />
            ) : null}
            <div className={`${UI_TEXT.labelText} absolute bottom-4 left-4 text-muted-neon`}>
              {helperText}
            </div>
            {errorView ? (
              <div className="absolute top-4 left-4 z-20 max-w-105 rounded border-2 border-magenta-neon bg-[rgba(26,15,46,0.92)] px-3 py-2 shadow-[0_0_16px_rgba(255,45,147,0.2)]">
                <div className="flex items-start gap-2">
                  <span className={`${UI_TEXT.labelText} text-magenta-neon`}>!</span>
                  <div className="min-w-0">
                    <div className={`${UI_TEXT.labelText} text-magenta-neon`}>
                      {errorView.title}
                    </div>
                    <div className="font-silk text-[11px] text-ink-2 mt-1 leading-snug">
                      {errorView.message}
                    </div>
                    {errorView.technical ? (
                      <div className="font-silk text-[10px] text-muted-neon mt-1.5 truncate">
                        {errorView.technical}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
            {!isLoading && !loadError && (eligibleCount > 0 || claimedCount > 0) ? (
              <div className="absolute top-12 right-0 z-20 rounded border-2 border-border-neon bg-bg-2 px-3 py-2">
                <div className={`${UI_TEXT.labelText} text-cyan-neon`}>
                  INVENTORY: {claimedCount} CLAIMED · {eligibleCount} ELIGIBLE
                </div>
              </div>
            ) : null}
            {!isLoading && !loadError && placed.length === 0 ? (
              <Button
                variant="outline"
                onClick={() => void router.push("/edit")}
                className="absolute z-20"
              >
                Go to Edit to place objects
              </Button>
            ) : null}
            {!isLoading && !loadError && placed.length > 0 ? (
              <div className={`${UI_TEXT.labelText} absolute top-16 right-4 text-muted-neon`}>
                OBJECTS: {placed.length}
              </div>
            ) : null}
          </div>
        </MapFrame>
      </div>
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        ownerAddress={fullAddress}
        refAddress={fullAddress}
      />
    </PageShell>
  );
}

function placementToLandObject(
  placement: { badgeId: string; x: number; y: number },
  index: number,
): LandObject {
  const parsed = parseBadgeId(placement.badgeId);
  const hue = hueFromString(placement.badgeId);
  return {
    id: `api-${placement.badgeId}-${index}`,
    gx: clampGrid(placement.x),
    gy: clampGrid(placement.y),
    hue,
    glyph: parsed.glyph,
    type: typeFromString(placement.badgeId),
    name: parsed.name,
    protocol: parsed.protocol,
    tile: tileLabelFromCoords(placement.x, placement.y),
    mintedAt: "API",
  };
}

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

const BUILDING_TYPES: BuildingType[] = [
  "tower",
  "crystal",
  "tree",
  "dome",
  "mushroom",
  "shrine",
  "lighthouse",
];

function typeFromString(value: string): BuildingType {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 17 + value.charCodeAt(i)) | 0;
  }
  return BUILDING_TYPES[Math.abs(hash) % BUILDING_TYPES.length];
}

function formatLoadError(
  raw: string | null,
): { title: string; message: string; technical?: string } | null {
  if (!raw) return null;
  const status = extractStatusCode(raw);
  if (status === 401) {
    return {
      title: "AUTH REQUIRED",
      message: "Please reconnect your wallet session and try again.",
      technical: "API returned 401 Unauthorized",
    };
  }
  if (status === 404) {
    return {
      title: "LAND NOT FOUND",
      message: "We could not find this land yet. Try scanning wallet data first.",
      technical: "API returned 404 Not Found",
    };
  }
  return {
    title: "SYNC FAILED",
    message: "Could not load island data from API right now.",
    technical: raw,
  };
}

function extractStatusCode(raw: string): number | null {
  const match = raw.match(/\b(\d{3})\b/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}
