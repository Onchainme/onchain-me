import type { CSSProperties } from "react";
import type { LandObject } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GlyphTile } from "@/components/ui/glyph-tile";
import { API_BASE_URL } from "@/lib/api";
import { badgeAsset, isBadgeId } from "@/lib/badge-catalog";
import { cn } from "@/lib/utils";

interface ObjectTooltipProps {
  obj: LandObject;
  style?: CSSProperties;
  className?: string;
}

export function ObjectTooltip({ obj, style, className }: ObjectTooltipProps) {
  // Same image-vs-glyph fallback the inventory grid and placed-objects list
  // use: render the actual rendered badge asset when we recognise the badge
  // id, fall back to the legacy GlyphTile otherwise.
  const assetUrl =
    obj.badgeId && isBadgeId(obj.badgeId)
      ? badgeAsset(API_BASE_URL, obj.badgeId)?.url ?? null
      : null;
  return (
    <Card
      accent="cyan"
      padding="default"
      className={cn(
        "absolute z-30 w-52 sm:w-60 max-w-[calc(100%-1rem)] pointer-events-none",
        className,
      )}
      style={style}
    >
      <div className="flex items-center gap-2.5">
        {assetUrl ? (
          <img
            src={assetUrl}
            alt={obj.name}
            className="w-10 h-10 object-contain image-render-pixel border border-border-neon bg-bg-2"
            draggable={false}
          />
        ) : (
          <GlyphTile glyph={obj.glyph} hue={obj.hue} size="md" tone="bold" shade={{ l: 0.82 }} />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-px glow-m text-[8px] mb-0.5">{obj.name}</div>
          <div className="font-silk text-[12px] text-muted-neon">{obj.protocol}</div>
        </div>
      </div>
      <Separator variant="dashed" />
      <div className="flex items-center justify-between">
        <span className="font-silk glow-c text-[12px]">TILE {obj.tile}</span>
        <span className="font-silk text-[12px] text-muted-neon">{obj.mintedAt}</span>
      </div>
    </Card>
  );
}
