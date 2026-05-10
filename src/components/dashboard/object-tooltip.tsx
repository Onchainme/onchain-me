import type { CSSProperties } from "react";
import type { LandObject } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GlyphTile } from "@/components/ui/glyph-tile";
import { cn } from "@/lib/utils";

interface ObjectTooltipProps {
  obj: LandObject;
  style?: CSSProperties;
  className?: string;
}

export function ObjectTooltip({ obj, style, className }: ObjectTooltipProps) {
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
        <GlyphTile glyph={obj.glyph} hue={obj.hue} size="md" tone="bold" shade={{ l: 0.82 }} />
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
