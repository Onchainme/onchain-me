import Link from "next/link";
import { cn } from "@/lib/utils";
import { MiniIsland } from "@/components/canvas/MiniIsland";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LandSummary } from "@/lib/types";

type Size = "sm" | "md" | "lg" | "xl";

const PREVIEW: Record<Size, { w: number; h: number; count: number }> = {
  sm: { w: 160, h: 90, count: 3 },
  md: { w: 200, h: 110, count: 4 },
  lg: { w: 280, h: 150, count: 5 },
  xl: { w: 520, h: 240, count: 7 },
};

// Font sizes in px for address/stat rows and overlay chips.
const FONT = {
  addr: { xl: 14, default: 11 },
  statKey: { xl: 11, default: 10 },
  statVal: { xl: 16, default: 11 },
  rankKey: { xl: 10, default: 8 },
  rankVal: { xl: 14, default: 10 },
};

interface LandCardProps {
  land: LandSummary;
  size?: Size;
  className?: string;
}

export function LandCard({ land, size = "md", className }: LandCardProps) {
  const s = PREVIEW[size];
  const isXL = size === "xl";

  return (
    <Link
      href={`/land/${encodeURIComponent(land.address)}`}
      className={cn("block h-full", className)}
    >
      <Card
        accent={land.featured ? "magenta" : "default"}
        padding={isXL ? "lg" : "sm"}
        className="land-card flex-col h-full"
      >
        <div
          className={cn(
            "flex-1 grid place-items-center relative mb-2.5 border-2 border-border-neon-2 bg-bg",
            isXL ? "p-3.5" : "p-2",
          )}
          style={{ minHeight: s.h }}
        >
          <MiniIsland width={s.w} height={s.h} seed={land.seed} count={s.count} />
          <PreviewBadge land={land} size={size} />
          {land.rank != null && size !== "sm" ? (
            <div className="absolute bottom-2 right-2.5 font-silk flex items-baseline gap-1.5">
              <span
                className="text-muted-neon"
                style={{ fontSize: isXL ? FONT.rankKey.xl : FONT.rankKey.default }}
              >
                RANK
              </span>
              <span
                className="glow-y font-px"
                style={{ fontSize: isXL ? FONT.rankVal.xl : FONT.rankVal.default }}
              >
                #{land.rank}
              </span>
            </div>
          ) : null}
          {land.rarityPct != null && isXL ? (
            <Badge
              variant="tag-outline-cyan"
              className="absolute top-2.5 right-2.5 text-[9px] px-1.5 py-1"
            >
              TOP {land.rarityPct}%
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center justify-between">
          <span
            className="font-silk glow-c"
            style={{ fontSize: isXL ? FONT.addr.xl : FONT.addr.default }}
          >
            {land.address}
          </span>
          {isXL ? (
            <span className="font-silk text-[10px] text-muted-neon">VIEW →</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2.5 mt-1.5">
          <StatInline label="OBJ" value={land.objectsCount} color="glow-m" isXL={isXL} />
          <StatInline label="PTS" value={land.points} color="glow-y" isXL={isXL} />
        </div>
      </Card>
    </Link>
  );
}

function PreviewBadge({ land, size }: { land: LandSummary; size: Size }) {
  const isXL = size === "xl";
  const chipClass = cn(
    "absolute top-2 left-2",
    isXL && "text-[10px] px-1.5 py-1",
  );
  if (land.badge) {
    return (
      <Badge variant="tag-outline-yellow" className={chipClass}>
        {land.badge}
      </Badge>
    );
  }
  if (land.featured) {
    return (
      <Badge variant="tag" className={chipClass}>
        {isXL ? "★ TOP LAND" : "FEATURED"}
      </Badge>
    );
  }
  return null;
}

function StatInline({
  label,
  value,
  color,
  isXL,
}: {
  label: string;
  value: number;
  color: "glow-m" | "glow-y";
  isXL: boolean;
}) {
  return (
    <>
      <span
        className="font-silk text-muted-neon"
        style={{ fontSize: isXL ? FONT.statKey.xl : FONT.statKey.default }}
      >
        {label}
      </span>
      <span
        className={cn("font-px", color)}
        style={{ fontSize: isXL ? FONT.statVal.xl : FONT.statVal.default }}
      >
        {value}
      </span>
    </>
  );
}
