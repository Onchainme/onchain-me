import Link from "next/link";
import { memo } from "react";
import { cn, shortWallet } from "@/lib/utils";
import { MiniIsland } from "@/components/canvas/MiniIsland";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LandSummary } from "@/lib/types";

type Size = "sm" | "md" | "lg" | "xl";

// vbox dimensions are tuned so slice-mode scales the island by container height
// (vbox aspect ratio is always wider than any card aspect in the bento, so
// height dominates the slice scale). Smaller `h` → bigger relative island.
const PREVIEW: Record<Size, { w: number; h: number; minH: number; count: number }> = {
  sm: { w: 480, h: 170, minH: 90,  count: 3 },
  md: { w: 480, h: 135, minH: 110, count: 4 },
  lg: { w: 480, h: 110, minH: 150, count: 5 },
  xl: { w: 480, h: 95,  minH: 220, count: 7 },
};

// Font sizes in px for address/stat rows and overlay chips.
const FONT = {
  addr: { xl: 16, default: 12 },
  statKey: { xl: 12, default: 8 },
  statVal: { xl: 16, default: 12 },
  rankKey: { xl: 12, default: 8 },
  rankVal: { xl: 16, default: 12 },
};

interface LandCardProps {
  land: LandSummary;
  size?: Size;
  className?: string;
}

/** SVG / OG image previews — Pixi per card froze `/home`; real placements via MiniIsland. */
function LandCardInner({ land, size = "md", className }: LandCardProps) {
  const s = PREVIEW[size];
  const isXL = size === "xl";
  const hasPlacements = (land.objects?.length ?? 0) > 0;
  const ogImage = land.ogImageUrl?.trim() || null;

  return (
    <Link
      href={`/land?wallet=${encodeURIComponent(land.address)}`}
      prefetch={false}
      className={cn("block h-full", className)}
    >
      <Card
        accent={land.featured ? "magenta" : "default"}
        padding={isXL ? "lg" : "sm"}
        className="land-card flex-col h-full"
      >
        <div
          className="flex-1 relative mb-2.5 border-2 border-border-neon-2 overflow-hidden"
          style={{ minHeight: s.minH }}
        >
          {hasPlacements ? (
            <MiniIsland
              width={s.w}
              height={s.h}
              seed={land.seed}
              objects={land.objects}
              fill
              className="absolute inset-0 pointer-events-none"
            />
          ) : ogImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- external OG URLs from API
            <img
              src={ogImage}
              alt=""
              className="absolute inset-0 size-full object-cover pointer-events-none image-render-pixel"
            />
          ) : (
            <MiniIsland
              width={s.w}
              height={s.h}
              seed={land.seed}
              count={s.count}
              fill
              className="absolute inset-0 pointer-events-none"
            />
          )}

          <PreviewBadge land={land} size={size} />

          <div
            className={cn(
              "absolute z-10 flex flex-col items-end gap-1",
              isXL ? "top-2.5 right-2.5" : "top-2 right-2",
            )}
          >
            {land.rarityPct != null && isXL ? (
              <Badge
                variant="tag-outline-cyan"
                className="text-[8px] 2xl:text-[12px] px-1.5 py-1"
              >
                TOP {land.rarityPct}%
              </Badge>
            ) : null}
            {land.rank != null && land.rank > 0 ? (
              <div className="font-silk flex items-baseline gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
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
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span
            className="font-silk glow-c"
            style={{ fontSize: isXL ? FONT.addr.xl : FONT.addr.default }}
          >
            {shortWallet(land.address)}
          </span>
           <span className="font-silk text-[12px] 2xl:text-[16px] text-muted-neon">
              VIEW →
            </span>
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
    "absolute z-10 top-2 left-2",
    isXL && "top-2.5 left-2.5 text-[12px] px-1.5 py-1",
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

export const LandCard = memo(LandCardInner);