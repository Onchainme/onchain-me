"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GlyphTile } from "@/components/ui/glyph-tile";
import type { InventoryItem } from "@/lib/types";
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
  if (filter === "claimed") return item.state !== "eligible";
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
      <div className="flex items-center mb-2.5">
        <span className={cn(UI_TEXT.labelText, "text-muted-neon tracking-[0.14em]")}>
          INVENTORY
        </span>
        <span className={cn(UI_TEXT.labelText, "glow-c ml-2")}>
          {claimedCount} CLAIMED · {eligibleCount} ELIGIBLE
        </span>
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
  const locked = item.state === "eligible";
  const placed = item.state === "placed";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={placed}
        className={cn(
          "slot",
          locked ? "locked" : "filled",
          active && "active",
          item.isNew && "new",
          placed && "opacity-40 cursor-default",
        )}
      >
        <GlyphTile glyph={item.glyph} hue={item.hue} size="sm" dim={locked} />
        {locked ? (
          <span className="lock">
            <Lock className="w-2.5 h-2.5" />
          </span>
        ) : null}
      </button>
      <div className="font-silk text-[8px] 2xl:text-[12px] text-muted-neon text-center mt-1">
        {item.label}
      </div>
    </div>
  );
}
