"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { PageShell } from "@/components/dashboard/page-shell";
import { MapFrame } from "@/components/dashboard/map-frame";
import { ObjectTooltip } from "@/components/dashboard/object-tooltip";
import { IsometricIsland } from "@/components/canvas/IsometricIsland";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatChip } from "@/components/ui/stat-chip";
import { GlyphTile } from "@/components/ui/glyph-tile";
import { WalletAvatar } from "@/components/ui/wallet-avatar";
import { ApiError, fetchLand, type LandResponse } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api";
import { BADGE_CATALOG, badgeAsset, isBadgeId } from "@/lib/badge-catalog";
import { tileLabel } from "@/lib/mock-data";
import { UI_LAYOUT, UI_TEXT } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";
import type { LandObject } from "@/lib/types";

const ShareModal = dynamic(
  () => import("@/components/modals/share-modal").then((m) => m.ShareModal),
  { ssr: false },
);

const ISLAND_W = 760;
const ISLAND_H = 560;

function shortAddress(addr: string): string {
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function buildLandObjects(land: LandResponse): LandObject[] {
  return land.placements.flatMap<LandObject>((p) => {
    if (!isBadgeId(p.badgeId)) return [];
    const def = BADGE_CATALOG[p.badgeId];
    return [
      {
        id: `placed:${p.badgeId}:${p.x}:${p.y}`,
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
      },
    ];
  });
}

export default function PublicLandPageWrapper() {
  return (
    <Suspense fallback={<PageShell>{null}</PageShell>}>
      <PublicLandPage />
    </Suspense>
  );
}

function PublicLandPage() {
  const search = useSearchParams();
  // Hover drives the cyan ring; click drives the ObjectTooltip. Two separate
  // indices so the tooltip stays open when the cursor moves away.
  const [hovered, setHovered] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [land, setLand] = useState<LandResponse | null>(null);
  const [notFound, setNotFound] = useState(false);

  const owner = decodeURIComponent(search?.get("wallet") ?? "");

  useEffect(() => {
    if (!owner) return;
    let cancelled = false;
    setLand(null);
    setNotFound(false);
    void (async () => {
      try {
        const data = await fetchLand(owner);
        if (!cancelled) setLand(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [owner]);

  const objects = useMemo(() => (land ? buildLandObjects(land) : []), [land]);
  const hoveredObj = selectedIdx != null ? (objects[selectedIdx] ?? null) : null;

  // Tap-outside to close the tooltip. Canvas taps and PlacedObjectsList row
  // taps have their own handlers — exempt them so they aren't doubly handled.
  useEffect(() => {
    if (hovered === null) return;
    function handler(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("canvas")) return;
      if (target?.closest("[data-tooltip-zone='list']")) return;
      // Outside-click closes the tooltip (formerly the hover indicator).
      setSelectedIdx(null);
    }
    const t = setTimeout(() => {
      document.addEventListener("click", handler);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", handler);
    };
  }, [hovered]);

  const score = land?.stats.score ?? 0;
  const rank = land?.stats.rank ?? 0;

  return (
    <PageShell>
      <div className={`${UI_LAYOUT.pageContainer} pt-3 flex items-center gap-2 flex-wrap`}>
        <span className={`${UI_TEXT.labelText} text-muted-neon break-all`}>
          <span className="text-cyan-neon">onchain.me</span>/land/
          <span className="glow-m">{owner}</span>
        </span>
      </div>

      <div className={`${UI_LAYOUT.pageContainer} grid gap-3 p-3 sm:gap-5 sm:p-6 grid-cols-1 md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_380px]`}>
        <div className="flex sm:hidden flex-col gap-2 col-span-full">
          <div className="flex items-center gap-2.5 min-w-0">
            <WalletAvatar size="md" />
            <div className="min-w-0 flex-1">
              <div className="font-px glow-c text-[12px]">{shortAddress(owner)}</div>
              <div className="font-silk text-[8px] text-muted-neon truncate">{owner} · OWNER</div>
            </div>
            <Button variant="cyan" size="sm" onClick={() => setShareOpen(true)}>
              ↗ Share
            </Button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatChip label="OBJ" value={objects.length} color="cyan" size="sm" />
            <StatChip label="PTS" value={score.toLocaleString()} color="yellow" size="sm" />
            {rank > 0 ? <StatChip label="RANK" value={`#${rank}`} color="magenta" size="sm" /> : null}
          </div>
        </div>
        <MapFrame
          label="PUBLIC ISLAND"
          action={
            <div className="hidden sm:flex items-center gap-2">
              <StatChip label="OBJ" value={objects.length} color="cyan" size="sm" />
              <StatChip label="PTS" value={score.toLocaleString()} color="yellow" size="sm" />
              {rank > 0 ? <StatChip label="RANK" value={`#${rank}`} color="magenta" size="sm" /> : null}
              <Button variant="cyan" onClick={() => setShareOpen(true)}>
                ↗ Share the Land
              </Button>
            </div>
          }
        >
          <div className="hidden sm:flex absolute left-4 top-12 items-center gap-4 z-[4]">
            <div className="flex items-center gap-2.5">
              <WalletAvatar size="md" />
              <div className="min-w-0">
                <div className="font-px glow-c text-[12px] 2xl:text-[16px]">
                  {shortAddress(owner)}
                </div>
                <div className="font-silk text-[8px] 2xl:text-[12px] text-muted-neon truncate max-w-[260px]">
                  {owner} · OWNER
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[300px] sm:h-[700px] flex items-center justify-center pt-8 sm:pt-0">
            <IsometricIsland
              width={ISLAND_W}
              height={ISLAND_H}
              scale={1.5}
              objects={objects}
              hoveredIndex={hovered}
              onHoverObject={setHovered}
              onObjectClick={(obj) => {
                const idx = objects.findIndex((o) => o.id === obj.id);
                if (idx < 0) return;
                setSelectedIdx((prev) => (prev === idx ? null : idx));
              }}
              onTileClick={() => setSelectedIdx(null)}
            />
            {hoveredObj ? (
              <ObjectTooltip
                obj={hoveredObj}
                className="left-2 top-2 sm:left-auto sm:top-12 sm:right-4"
                // Click-driven tooltip → close button on every platform.
                onClose={() => setSelectedIdx(null)}
              />
            ) : null}
            {notFound ? (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="font-px text-[12px] text-muted-neon bg-bg-2 border-2 border-border-neon px-4 py-3">
                  This wallet has no land yet.
                </div>
              </div>
            ) : null}
          </div>
        </MapFrame>

        <PlacedObjectsList
          objects={objects}
          hovered={hovered}
          onHover={setHovered}
          onSelect={(i) => setSelectedIdx((prev) => (prev === i ? null : i))}
          loading={!land && !notFound}
        />
      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        ownerAddress={owner}
      />
    </PageShell>
  );
}

function PlacedObjectsList({
  objects,
  hovered,
  onHover,
  onSelect,
  loading,
}: {
  objects: LandObject[];
  hovered: number | null;
  onHover: (i: number | null) => void;
  /** Called when the user clicks a list row — opens the tooltip on the canvas. */
  onSelect: (i: number) => void;
  loading: boolean;
}) {
  return (
    <Card padding="lg" className="flex-col sm:min-h-[700px]" data-tooltip-zone="list">
      <div className="flex items-center mb-2.5">
        <span className={`${UI_TEXT.labelText} glow-c`}>PLACED OBJECTS</span>
        <Badge variant="tag-cyan" className="ml-2">
          {objects.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-2 overflow-auto flex-1">
        {loading ? (
          <div className="font-pixel-body text-sm text-muted-neon p-2">Loading…</div>
        ) : objects.length === 0 ? (
          <div className="font-pixel-body text-sm text-muted-neon p-2">
            No objects placed yet.
          </div>
        ) : (
          objects.map((o, i) => {
            const assetUrl =
              o.badgeId && isBadgeId(o.badgeId)
                ? badgeAsset(API_BASE_URL, o.badgeId)?.url ?? null
                : null;
            return (
              <button
                key={o.id}
                type="button"
                onMouseEnter={() => onHover(i)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onSelect(i)}
                className={cn(
                  "flex items-center gap-2.5 p-2 border-2 cursor-pointer transition-colors text-left",
                  hovered === i
                    ? "bg-panel-2 border-cyan-neon"
                    : "bg-bg-2 border-border-neon",
                )}
              >
                {assetUrl ? (
                  <img
                    src={assetUrl}
                    alt={o.name}
                    className="w-10 h-10 object-contain image-render-pixel border border-border-neon bg-bg-2"
                    draggable={false}
                  />
                ) : (
                  <GlyphTile glyph={o.glyph} hue={o.hue} size="md" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-px text-[12px] 2xl:text-[16px] text-ink">{o.name}</div>
                  <div className="font-silk text-[8px] 2xl:text-[12px] text-muted-neon mt-0.5">
                    {o.protocol} · TILE {o.tile}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
      <Separator variant="dashed" />
      <div className="font-pixel-body text-sm text-muted-neon">
        Tap a row or an object → details appear.
      </div>
    </Card>
  );
}
