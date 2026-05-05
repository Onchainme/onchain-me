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
import { fetchLandByWallet, type ApiLandDetails } from "@/lib/api";
import { UI_LAYOUT, UI_TEXT } from "@/lib/ui-styles";
import { cn, shortWallet } from "@/lib/utils";
import type { BuildingType, LandObject } from "@/lib/types";

const ShareModal = dynamic(
  () => import("@/components/modals/share-modal").then((m) => m.ShareModal),
  { ssr: false },
);

const ISLAND_W = 760;
const ISLAND_H = 560;

export default function PublicLandPage() {
  const params = useParams<{ wallet: string }>();
  const search = useSearchParams();
  const { wallet: visitor } = useWallet();
  const [hovered, setHovered] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [landData, setLandData] = useState<ApiLandDetails | null>(null);
  const [objects, setObjects] = useState<LandObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const owner = decodeURIComponent(params?.wallet ?? "0xBEEF…0001");
  const incomingRef = search?.get("ref");
  const hoveredObj = hovered != null ? objects[hovered] : null;

  // Ref-link rule: a connected visitor earns credit with their wallet;
  // otherwise pass through the incoming ref or default to the owner.
  const refForLink = useMemo(
    () => visitor?.shortAddress ?? incomingRef ?? owner,
    [visitor, incomingRef, owner],
  );
  const ownerShort = shortWallet(owner);

  useEffect(() => {
    const ctrl = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    fetchLandByWallet(owner, ctrl.signal)
      .then((land) => {
        setLandData(land);
        const mapped = land.placements.map((placement, index) =>
          placementToLandObject(placement, index),
        );
        setObjects(mapped);
        setHovered(mapped.length > 0 ? 0 : null);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setLoadError(e instanceof Error ? e.message : "Failed to load public land");
        setLandData(null);
        setObjects([]);
        setHovered(null);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });
    return () => ctrl.abort();
  }, [owner]);

  return (
    <PageShell>
      <div className={`${UI_LAYOUT.pageContainer} pt-3 flex items-center gap-2 flex-wrap`}>
        <span className={`${UI_TEXT.labelText} text-muted-neon`}>
          <span className="text-cyan-neon">onchain.me</span>/land/
          <span className="glow-m break-all">{owner}</span>
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
                <div className="font-px glow-c text-[12px] 2xl:text-[16px]">{ownerShort}</div>
                <div className="font-silk text-[8px] 2xl:text-[12px] text-muted-neon">
                  {ownerShort} · OWNER
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <StatChip label="OBJ" value={objects.length} color="cyan" />
              <StatChip label="PTS" value={landData?.stats.score ?? 0} color="yellow" />
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
            {isLoading ? (
              <div className="absolute inset-0 z-10 grid place-items-center bg-[rgba(10,6,18,0.35)]">
                <div className={`${UI_TEXT.labelText} glow-c`}>LOADING PUBLIC LAND...</div>
              </div>
            ) : null}
            {hoveredObj ? (
              <ObjectTooltip obj={hoveredObj} style={{ left: "52%", top: "18%" }} />
            ) : null}
            {loadError ? (
              <div className="absolute top-4 left-4 z-20 max-w-[420px] rounded border-2 border-magenta-neon bg-[rgba(26,15,46,0.92)] px-3 py-2">
                <div className={`${UI_TEXT.labelText} text-magenta-neon`}>PUBLIC LAND UNAVAILABLE</div>
                <div className="font-silk text-[11px] text-ink-2 mt-1">
                  Could not load this wallet land from API.
                </div>
              </div>
            ) : null}
          </div>
        </MapFrame>

        <PlacedObjectsList
          objects={objects}
          hovered={hovered}
          onHover={setHovered}
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

function placementToLandObject(
  placement: { badgeId: string; x: number; y: number },
  index: number,
): LandObject {
  const parsed = parseBadgeId(placement.badgeId);
  return {
    id: `public-${placement.badgeId}-${index}`,
    gx: clampGrid(placement.x),
    gy: clampGrid(placement.y),
    hue: hueFromString(placement.badgeId),
    glyph: parsed.glyph,
    type: typeFromString(placement.badgeId),
    name: parsed.name,
    protocol: parsed.protocol,
    tile: tileLabelFromCoords(placement.x, placement.y),
    mintedAt: "API",
  };
}

function PlacedObjectsList({
  objects,
  hovered,
  onHover,
}: {
  objects: LandObject[];
  hovered: number | null;
  onHover: (i: number | null) => void;
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
        {objects.map((o, i) => (
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
            <span className="font-silk text-[8px] 2xl:text-[12px] text-muted-neon-2">
              {o.mintedAt.slice(5)}
            </span>
          </button>
        ))}
      </div>
      <Separator variant="dashed" />
      <div className="font-pixel-body text-sm text-muted-neon">
        Hover row → object pulses on map.
      </div>
    </Card>
  );
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
