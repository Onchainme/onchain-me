import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatChip } from "@/components/ui/stat-chip";
import { WalletAvatar } from "@/components/ui/wallet-avatar";
import { STATS } from "@/lib/mock-data";

interface StatsRailProps {
  title?: "My Land" | "Edit";
  address: string;
  recent?: boolean;
}

const RECENT_MINTS = [
  { name: "Jupiter Power User", hue: 30 },
  { name: "Drift Degen", hue: 240 },
  { name: "Jito Staker", hue: 140 },
];

export function StatsRail({
  title = "My Land",
  address,
  recent = true,
}: StatsRailProps) {
  const kicker = title === "Edit" ? "EDIT MODE" : "OWNER";
  return (
    <div className="flex flex-col gap-3 w-full">
      <Card padding="lg" className="bg-panel-2">
        <div className="flex items-center gap-2.5">
          <WalletAvatar size="lg" glow />
          <div className="min-w-0">
            <div className="font-silk text-[10px] text-muted-neon">{kicker}</div>
            <h2 className="glow-c text-xl leading-none mt-0.5">{title}</h2>
            <div className="font-silk glow-m text-[11px] mt-1">{address}</div>
          </div>
        </div>
      </Card>
      <StatChip label="PROTOCOLS" value={STATS.protocols} color="cyan" />
      <StatChip
        label="TRANSACTIONS"
        value={STATS.transactions.toLocaleString()}
        color="magenta"
      />
      <StatChip label="POINTS" value={STATS.points} color="yellow" />
      {recent ? (
        <Card padding="default">
          <div className="font-silk text-[10px] text-muted-neon mb-1.5">
            RECENT MINTS
          </div>
          {RECENT_MINTS.map((r) => (
            <div key={r.name} className="flex items-center gap-2 py-1">
              <span
                className="w-3 h-3 block"
                style={{ background: `oklch(0.80 0.14 ${r.hue})` }}
              />
              <span className="font-pixel-body text-[15px] text-ink-2">
                {r.name}
              </span>
            </div>
          ))}
          <Separator variant="dashed" />
        </Card>
      ) : null}
    </div>
  );
}
