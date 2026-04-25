"use client";

import { useMemo, useState } from "react";
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
import { ShareModal } from "@/components/modals/share-modal";
import { useWallet } from "@/hooks/wallet";
import { PLACED_OBJECTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { LandObject } from "@/lib/types";

const ISLAND_W = 760;
const ISLAND_H = 560;

export default function PublicLandPage() {
  const params = useParams<{ wallet: string }>();
  const search = useSearchParams();
  const { wallet: visitor } = useWallet();
  const [hovered, setHovered] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const owner = decodeURIComponent(params?.wallet ?? "0xBEEF…0001");
  const incomingRef = search?.get("ref");
  const hoveredObj = hovered != null ? PLACED_OBJECTS[hovered] : null;

  // Ref-link rule: a connected visitor earns credit with their wallet;
  // otherwise pass through the incoming ref or default to the owner.
  const refForLink = useMemo(
    () => visitor?.shortAddress ?? incomingRef ?? owner,
    [visitor, incomingRef, owner],
  );

  return (
    <PageShell>
      <div className="max-w-[1280px] mx-auto px-6 pt-3 flex items-center gap-2 flex-wrap">
        <span className="font-silk text-[11px] text-muted-neon">
          <span className="text-cyan-neon">onchain.me</span>/land/
          <span className="glow-m">{owner}</span>
        </span>
        {incomingRef ? (
          <span className="font-silk text-[10px] text-muted-neon">
            · REF: <span className="glow-c">{incomingRef}</span>
          </span>
        ) : null}
      </div>

      <div className="max-w-[1280px] mx-auto grid gap-5 p-6 grid-cols-1 lg:grid-cols-[1fr_380px]">
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
                <div className="font-px glow-c text-[10px]">SOMEONE.SOL</div>
                <div className="font-silk text-[9px] text-muted-neon">
                  {owner} · OWNER
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <StatChip label="OBJ" value={PLACED_OBJECTS.length} color="cyan" />
              <StatChip label="PTS" value="1,240" color="yellow" />
            </div>
          </div>

          <div className="relative h-[700px] flex items-center justify-center">
            <IsometricIsland
              width={ISLAND_W}
              height={ISLAND_H}
              objects={PLACED_OBJECTS}
              hoveredIndex={hovered}
              onHoverObject={setHovered}
            />
            {hoveredObj ? (
              <ObjectTooltip obj={hoveredObj} style={{ left: "52%", top: "18%" }} />
            ) : null}
          </div>
        </MapFrame>

        <PlacedObjectsList
          objects={PLACED_OBJECTS}
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
        <span className="font-silk glow-c text-[11px]">PLACED OBJECTS</span>
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
              <div className="font-px text-[9px] text-ink">{o.name}</div>
              <div className="font-silk text-[9px] text-muted-neon mt-0.5">
                {o.protocol} · TILE {o.tile}
              </div>
            </div>
            <span className="font-silk text-[9px] text-muted-neon-2">
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
