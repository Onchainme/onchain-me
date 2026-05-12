"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GlyphTile } from "@/components/ui/glyph-tile";
import type { InventoryItem } from "@/lib/types";
import { API_BASE_URL } from "@/lib/api";
import { badgeAsset, isBadgeId } from "@/lib/badge-catalog";
import { explorerAddressUrl } from "@/lib/solana-explorer";
import { UI_TEXT } from "@/lib/ui-styles";

type Filter = "all" | "claimed" | "eligible";

interface InventoryProps {
  items: InventoryItem[];
  activeItemId: string | null;
  onSelectPlaced: (id: string) => void;
  onMintEligible: (item: InventoryItem) => void;
  claimedCount: number;
  eligibleCount: number;
}

const TAB_ACCENT: Record<Filter, string> = {
  all: "data-active:text-cyan-neon data-active:after:bg-cyan-neon",
  claimed: "data-active:text-magenta-neon data-active:after:bg-magenta-neon",
  eligible: "data-active:text-yellow-neon data-active:after:bg-yellow-neon",
};

const matchesFilter = (item: InventoryItem, filter: Filter) => {
  if (filter === "all") return true;
  // CLAIMED tab: anything the user actually owns (minted, regardless of placed)
  if (filter === "claimed") return item.state === "claimed" || item.state === "placed";
  // ELIGIBLE tab: earned via scan, ready to mint
  return item.state === "eligible";
};

export function Inventory({
  items,
  activeItemId,
  onSelectPlaced,
  onMintEligible,
  claimedCount,
  eligibleCount,
}: InventoryProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = items.filter((i) => matchesFilter(i, filter));

  return (
    <Card padding="default">
      {/* Stack title + counts vertically so the counts never wrap onto the
          INVENTORY title or get squished by `letter-spacing`. On narrow side
          panels the previous single-row layout collapsed to "INVENTORY0 CLAIMED"
          with no visible gap. */}
      <div className="mb-2.5">
        <div className={cn(UI_TEXT.labelText, "text-muted-neon tracking-[0.14em]")}>
          INVENTORY
        </div>
        <div className={cn(UI_TEXT.labelText, "glow-c mt-1 whitespace-nowrap")}>
          {claimedCount} CLAIMED · {eligibleCount} ELIGIBLE
        </div>
      </div>
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as Filter)}
        className="gap-2.5"
      >
        <TabsList
          variant="line"
          className="h-auto p-0 gap-1 border-b-2 border-border-neon rounded-none w-full justify-start"
        >
          {(Object.keys(TAB_ACCENT) as Filter[]).map((k) => (
            <TabsTrigger
              key={k}
              value={k}
              className={cn(
                "font-silk text-[12px] 2xl:text-[16px] uppercase tracking-wider px-2 py-1",
                TAB_ACCENT[k],
              )}
            >
              {k}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={filter}>
          <div className="grid grid-cols-4 gap-3">
            {visible.map((it) => (
              <InventorySlot
                key={it.id}
                item={it}
                active={it.id === activeItemId}
                onClick={() =>
                  it.state === "eligible" ? onMintEligible(it) : onSelectPlaced(it.id)
                }
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
      <Separator variant="dashed" />
      <div className={cn(UI_TEXT.mainText, "text-muted-neon")}>
        <span className="text-magenta-neon">Claimed:</span> click → place on tile.
        <br />
        <span className="text-yellow-neon">Eligible 🔒:</span> click → Mint.
      </div>
    </Card>
  );
}

function InventorySlot({
  item,
  active,
  onClick,
}: {
  item: InventoryItem;
  active: boolean;
  onClick: () => void;
}) {
  // Visual taxonomy:
  //   locked          — catalog entry not yet earned. Greyed out, inert.
  //   eligible        — earned, ready to mint. Lock icon + clickable to mint.
  //   placed          — already on the map. Dim, disabled until removed.
  //   claimed         — minted, off the map. Full color, click to select & place.
  const locked = item.state === "locked";
  const eligible = item.state === "eligible";
  const placed = item.state === "placed";
  const dimmed = locked || eligible;
  // Prefer the image (animated WebP or static PNG) served by the api for
  // known badge ids; fall back to the legacy GlyphTile otherwise.
  const animUrl = isBadgeId(item.badgeId)
    ? badgeAsset(API_BASE_URL, item.badgeId)?.url ?? null
    : null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        // Locked = not earned yet, so clicking is a no-op (no action wired).
        // Placed = already on map, must be removed first.
        disabled={placed || locked}
        className={cn(
          "slot",
          dimmed ? "locked" : "filled",
          active && "active",
          item.isNew && "new",
          placed && "opacity-40 cursor-default",
          locked && "cursor-default",
        )}
        title={
          locked
            ? `${item.name} — not yet earned. Update inventory to scan your wallet.`
            : eligible
              ? `${item.name} — eligible, click to mint`
              : placed
                ? `${item.name} — placed on the island`
                : `${item.name} — click to select then place on a tile`
        }
      >
        {animUrl ? (
          <img
            src={animUrl}
            alt={item.name}
            className={cn(
              "block w-full h-full object-contain image-render-pixel",
              locked && "opacity-30 grayscale",
              eligible && "opacity-80",
            )}
            draggable={false}
          />
        ) : (
          <GlyphTile glyph={item.glyph} hue={item.hue} size="sm" dim={dimmed} />
        )}
        {dimmed ? (
          <span className="lock">
            <Lock className="w-2.5 h-2.5" />
          </span>
        ) : null}
      </button>
      {/* Truncate at slot width: full label fits in the tooltip via <button title>
          if a user wants the threshold. Keeps the grid visually aligned even
          when labels vary in length (Jupiter $1k vs Jupiter $100k vs Pump.fun $10k). */}
      <div
        className="font-silk text-[8px] 2xl:text-[12px] text-muted-neon text-center mt-1 truncate"
        title={item.name}
      >
        {item.label}
      </div>
      {/* For claimed (or placed) badges with a known cNFT asset id, expose a
          tiny "↗" link to the Solana Explorer. Sits at the top-right of the
          slot and stops propagation so the click doesn't toggle selection. */}
      {(item.state === "claimed" || item.state === "placed") && item.assetId ? (
        <a
          href={explorerAddressUrl(item.assetId)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-1 -right-1 w-4 h-4 grid place-items-center bg-bg-2 border border-border-neon text-[8px] text-cyan-neon hover:text-magenta-neon hover:border-magenta-neon"
          title={`View ${item.name} on Solana Explorer`}
        >
          ↗
        </a>
      ) : null}
    </div>
  );
}
