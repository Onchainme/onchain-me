import type { CSSProperties } from "react";
import type { LandObject } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GlyphTile } from "@/components/ui/glyph-tile";

interface ObjectTooltipProps {
  obj: LandObject;
  style?: CSSProperties;
}

export function ObjectTooltip({ obj, style }: ObjectTooltipProps) {
  return (
    <Card
      accent="cyan"
      padding="default"
      className="absolute z-30 w-60 pointer-events-none"
      style={style}
    >
      <div className="flex items-center gap-2.5">
        <GlyphTile glyph={obj.glyph} hue={obj.hue} size="md" tone="bold" shade={{ l: 0.82 }} />
        <div className="flex-1 min-w-0">
          <div className="font-px glow-m text-[9px] mb-0.5">{obj.name}</div>
          <div className="font-silk text-[10px] text-muted-neon">{obj.protocol}</div>
        </div>
      </div>
      <Separator variant="dashed" />
      <div className="flex items-center justify-between">
        <span className="font-silk glow-c text-[10px]">TILE {obj.tile}</span>
        <span className="font-silk text-[10px] text-muted-neon">{obj.mintedAt}</span>
      </div>
    </Card>
  );
}
