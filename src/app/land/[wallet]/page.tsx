"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
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
import { useWallet } from "@/hooks/wallet";
import { ApiError, fetchLand, type LandResponse } from "@/lib/api";
import { BADGE_CATALOG, isBadgeId } from "@/lib/badge-catalog";
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

export default function PublicLandPage() {
  const params = useParams<{ wallet: string }>();
  const search = useSearchParams();
  const { wallet: visitor } = useWallet();
  const [hovered, setHovered] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [land, setLand] = useState<LandResponse | null>(null);
  const [notFound, setNotFound] = useState(false);

  const owner = decodeURIComponent(params?.wallet ?? "");
  const incomingRef = search?.get("ref");

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
  const hoveredObj = hovered != null ? (objects[hovered] ?? null) : null;

  const refForLink = useMemo(
    () => visitor?.shortAddress ?? incomingRef ?? shortAddress(owner),
    [visitor, incomingRef, owner],
  );

  const score = land?.stats.score ?? 0;
  const rank = land?.stats.rank ?? 0;

  return (
    <PageShell>
      <div className={`${UI_LAYOUT.pageContainer} pt-3 flex items-center gap-2 flex-wrap`}>
        <span className={`${UI_TEXT.labelText} text-muted-neon`}>
          <span className="text-cyan-neon">onchain.me</span>/land/
          <span className="glow-m">{owner}</span>
        </span>
        {incomingRef ? (
          <span className={`${UI_TEXT.labelTextSm} text-muted-neon`}>
            · REF: <span className="glow-c">{incomingRef}</span>
          </span>
        ) : null}
      </div>

      <div className={`${UI_LAYOUT.pageContainer} grid gap-5 p-6 grid-cols-1 lg:grid-cols-[1fr_380px]`}>
        <MapFrame
          label="PUBLIC ISLAND"
          action={
            <Button variant="cyan" onClick={() => setShareOpen(true)}>
              ↗ Share the Land
            </Button>
          }
        >
          <div className="absolute left-4 top-11 flex items-center gap-4 z-[4] flex-wrap">
            <div className="flex items-center gap-2.5">
              <WalletAvatar size="md" />
              <div>
                <div className="font-px glow-c text-[12px] 2xl:text-[16px]">
                  {shortAddress(owner)}
                </div>
                <div className="font-silk text-[8px] 2xl:text-[12px] text-muted-neon">
                  {owner} · OWNER
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <StatChip label="OBJ" value={objects.length} color="cyan" />
              <StatChip label="PTS" value={score.toLocaleString()} color="yellow" />
              {rank > 0 ? <StatChip label="RANK" value={`#${rank}`} color="magenta" /> : null}
            </div>
          </div>

          <div className="relative h-[700px] flex items-center justify-center">
            <IsometricIsland
              width={ISLAND_W}
              height={ISLAND_H}
              objects={objects}
              hoveredIndex={hovered}
              onHoverObject={setHovered}
            />
            {hoveredObj ? (
              <ObjectTooltip obj={hoveredObj} style={{ left: "52%", top: "18%" }} />
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
          loading={!land && !notFound}
        />
      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        ownerAddress={owner}
        refAddress={refForLink}
      />
    </PageShell>
  );
}

function PlacedObjectsList({
  objects,
  hovered,
  onHover,
  loading,
}: {
  objects: LandObject[];
  hovered: number | null;
  onHover: (i: number | null) => void;
  loading: boolean;
}) {
  return (
    <Card padding="lg" className="flex-col min-h-[700px]">
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
          objects.map((o, i) => (
            <button
              key={o.id}
              type="button"
              onMouseEnter={() => onHover(i)}
              onMouseLeave={() => onHover(null)}
              className={cn(
                "flex items-center gap-2.5 p-2 border-2 cursor-pointer transition-colors text-left",
                hovered === i
                  ? "bg-panel-2 border-cyan-neon"
                  : "bg-bg-2 border-border-neon",
              )}
            >
              <GlyphTile glyph={o.glyph} hue={o.hue} size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-px text-[12px] 2xl:text-[16px] text-ink">{o.name}</div>
                <div className="font-silk text-[8px] 2xl:text-[12px] text-muted-neon mt-0.5">
                  {o.protocol} · TILE {o.tile}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
      <Separator variant="dashed" />
      <div className="font-pixel-body text-sm text-muted-neon">
        Hover row → object pulses on map.
      </div>
    </Card>
  );
}
