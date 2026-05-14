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
import type { LandObject } from "@/lib/types";
import { shortWallet } from "@/lib/utils";
import { placementToLandObject } from "@/lib/placement-mapper";

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
  // Two independent indices so hover (visual ring) and click (info tooltip)
  // don't fight each other. Hover only drives the cyan ring around the
  // badge sprite; clicking a badge is what opens its ObjectTooltip. Tap the
  // same badge or an empty tile to close.
  const [hovered, setHovered] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
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
      router.replace("/home");
    }
  }, [isConnected, isSessionReady, openConnectModal, router]);

  // Tap-outside to close the tooltip. The tooltip itself is pointer-events-none
  // so it never receives the click; we just exempt the Pixi canvas (taps there
  // are handled by onObjectClick/onTileClick) and close on anything else.
  useEffect(() => {
    if (hovered === null) return;
    function handler(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("canvas")) return;
      setHovered(null);
    }
    const t = setTimeout(() => {
      document.addEventListener("click", handler);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", handler);
    };
  }, [hovered]);

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
        setSelectedIdx(null);
        setHovered(null);
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

  const hoveredObj = selectedIdx != null ? placed[selectedIdx] : null;
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
        : `TAP A BUILDING FOR DETAILS · CLAIMED ${claimedCount} · ELIGIBLE ${eligibleCount}`;

  return (
    <PageShell>
      <div className={`${UI_LAYOUT.pageGrid} grid-cols-1 sm:grid-cols-[300px_1fr] md:grid-cols-[340px_1fr]`}>
        <StatsRail address={shortWallet(fullAddress)} stats={landData?.stats} />
        <MapFrame
          label="YOUR ISLAND"
          action={
            <Button variant="cyan" size="sm" className="sm:h-9 sm:px-3.5 sm:text-[12px]" onClick={() => setShareOpen(true)}>
              ↗ Share<span className="hidden sm:inline">&nbsp;the Land</span>
            </Button>
          }
        >
          <div className="relative min-h-[360px] sm:min-h-[700px] flex items-center justify-center pt-8 sm:pt-11">
            <IsometricIsland
              width={ISLAND_W}
              height={ISLAND_H}
              scale={1.8}
              objects={placed}
              hoveredIndex={hovered}
              onHoverObject={setHovered}
              onObjectClick={(obj) => {
                const idx = placed.findIndex((p) => p.id === obj.id);
                if (idx < 0) return;
                // Toggle: re-click same badge to close, click another to switch.
                setSelectedIdx((prev) => (prev === idx ? null : idx));
              }}
              onTileClick={() => setSelectedIdx(null)}
            />
            {isLoading ? (
              <div className="absolute inset-0 z-20 grid place-items-center bg-[rgba(10,6,18,0.35)]">
                <div className={`${UI_TEXT.labelText} glow-c`}>LOADING...</div>
              </div>
            ) : null}
            {hoveredObj ? (
              <ObjectTooltip
                obj={hoveredObj}
                className="left-2 top-2 sm:left-auto sm:right-4 sm:top-12"
                // Tooltip is now click-driven everywhere (not only mobile), so
                // always render the close button. Lets desktop users dismiss
                // without aiming at empty grass.
                onClose={() => setSelectedIdx(null)}
              />
            ) : null}
            <div className={`${UI_TEXT.labelText} absolute bottom-2 left-2 sm:bottom-4 sm:left-4 text-muted-neon max-w-[calc(100%-1rem)] truncate`}>
              {helperText}
            </div>
            {errorView ? (
              <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-auto z-20 sm:max-w-105 rounded border-2 border-magenta-neon bg-[rgba(26,15,46,0.92)] px-3 py-2 shadow-[0_0_16px_rgba(255,45,147,0.2)]">
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
              <div className="hidden sm:block absolute top-12 right-0 z-20 max-w-[calc(100%-1rem)] rounded border-2 border-border-neon bg-bg-2 px-3 py-2">
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
              <div className={`${UI_TEXT.labelText} hidden sm:block absolute top-16 right-4 text-muted-neon`}>
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
      />
    </PageShell>
  );
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
