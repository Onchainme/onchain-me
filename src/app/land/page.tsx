"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { PageShell } from "@/components/dashboard/page-shell";
import { AppTwoColumnLayout } from "@/components/dashboard/app-two-column-layout";
import { IslandViewport } from "@/components/dashboard/island-viewport";
import { LandPageBreadcrumb } from "@/components/dashboard/land-page-breadcrumb";
import { MapFrame } from "@/components/dashboard/map-frame";
import { PublicLandOwnerStrip } from "@/components/dashboard/public-land-owner-strip";
import { ShareLandButton } from "@/components/dashboard/share-land-button";
import { ObjectTooltip } from "@/components/dashboard/object-tooltip";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatChip } from "@/components/ui/stat-chip";
import { GlyphTile } from "@/components/ui/glyph-tile";
import { ApiError, fetchLand, type LandResponse } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api";
import { badgeAsset, isBadgeId } from "@/lib/badge-catalog";
import { ISLAND_VIEWPORT, UI_TEXT } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";
import { placementsToLandObjects } from "@/lib/placement-mapper";
import type { LandObject } from "@/lib/types";

const ShareModal = dynamic(
  () => import("@/components/modals/share-modal").then((m) => m.ShareModal),
  { ssr: false },
);

export default function PublicLandPageWrapper() {
  return (
    <Suspense fallback={<PageShell>{null}</PageShell>}>
      <PublicLandPage />
    </Suspense>
  );
}

function PublicLandPage() {
  const search = useSearchParams();
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

  const objects = useMemo(
    () => (land ? placementsToLandObjects(land.placements) : []),
    [land],
  );
  const hoveredObj = selectedIdx != null ? (objects[selectedIdx] ?? null) : null;
  const score = land?.stats.score ?? 0;
  const rank = land?.stats.rank ?? 0;
  const loading = !land && !notFound;

  useEffect(() => {
    if (hovered === null) return;
    function handler(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("canvas")) return;
      if (target?.closest("[data-tooltip-zone='list']")) return;
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

  const mapAction = (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <StatChip label="OBJ" value={objects.length} color="cyan" size="sm" />
      <StatChip label="PTS" value={score.toLocaleString()} color="yellow" size="sm" />
      {rank > 0 ? (
        <StatChip label="RANK" value={`#${rank}`} color="magenta" size="sm" />
      ) : null}
      <ShareLandButton onClick={() => setShareOpen(true)} />
    </div>
  );

  return (
    <PageShell>
      <LandPageBreadcrumb wallet={owner} />

      <AppTwoColumnLayout
        mapFirst
        sidebar={
          <PlacedObjectsList
            objects={objects}
            hovered={hovered}
            onHover={setHovered}
            onSelect={(i) => setSelectedIdx((prev) => (prev === i ? null : i))}
            loading={loading}
          />
        }
      >
        <div className="flex sm:hidden flex-col gap-3 mb-3">
          <div className="flex items-center justify-between gap-2">
            <PublicLandOwnerStrip owner={owner} className="flex-1" />
            <ShareLandButton compact onClick={() => setShareOpen(true)} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatChip label="OBJ" value={objects.length} color="cyan" size="sm" />
            <StatChip label="PTS" value={score.toLocaleString()} color="yellow" size="sm" />
            {rank > 0 ? (
              <StatChip label="RANK" value={`#${rank}`} color="magenta" size="sm" />
            ) : null}
          </div>
        </div>

        <MapFrame
          label="PUBLIC ISLAND"
          hint={
            objects.length === 0 && !loading
              ? notFound
                ? "THIS WALLET HAS NO LAND YET"
                : "NO OBJECTS PLACED YET"
              : "TAP A BUILDING FOR DETAILS"
          }
          action={mapAction}
        >
          <div className="hidden sm:flex absolute left-4 top-12 z-[4]">
            <PublicLandOwnerStrip owner={owner} />
          </div>
          <IslandViewport
            objects={objects}
            hoveredIndex={hovered}
            onHoverObject={setHovered}
            onObjectClick={(obj) => {
              const idx = objects.findIndex((o) => o.id === obj.id);
              if (idx < 0) return;
              setSelectedIdx((prev) => (prev === idx ? null : idx));
            }}
            onTileClick={() => setSelectedIdx(null)}
          >
            {hoveredObj ? (
              <ObjectTooltip
                obj={hoveredObj}
                className="left-2 top-2 sm:left-auto sm:top-12 sm:right-4 z-20"
                onClose={() => setSelectedIdx(null)}
              />
            ) : null}
            {notFound ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div className="font-px text-[12px] text-muted-neon bg-bg-2 border-2 border-border-neon px-4 py-3">
                  This wallet has no land yet.
                </div>
              </div>
            ) : null}
          </IslandViewport>
        </MapFrame>
      </AppTwoColumnLayout>

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
  onSelect: (i: number) => void;
  loading: boolean;
}) {
  return (
    <Card
      padding="lg"
      className={cn("flex-col", ISLAND_VIEWPORT.minHeight)}
      data-tooltip-zone="list"
    >
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
                  "flex items-center gap-2.5 p-2 border-2 cursor-pointer transition-colors text-left w-full",
                  hovered === i
                    ? "bg-panel-2 border-cyan-neon"
                    : "bg-bg-2 border-border-neon",
                )}
              >
                {assetUrl ? (
                  <img
                    src={assetUrl}
                    alt={o.name}
                    className="w-10 h-10 object-contain image-render-pixel border border-border-neon bg-bg-2 shrink-0"
                    draggable={false}
                  />
                ) : (
                  <GlyphTile glyph={o.glyph} hue={o.hue} size="md" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-px text-[12px] 2xl:text-[16px] text-ink truncate">
                    {o.name}
                  </div>
                  <div className={`${UI_TEXT.labelTextSm} text-muted-neon mt-0.5`}>
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
