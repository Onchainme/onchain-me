"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatChip } from "@/components/ui/stat-chip";
import { WalletAvatar } from "@/components/ui/wallet-avatar";
import { useWallet } from "@/hooks/wallet";
import { ApiError, fetchInventory, fetchLand } from "@/lib/api";
import { BADGE_CATALOG, isBadgeId } from "@/lib/badge-catalog";
import { UI_TEXT } from "@/lib/ui-styles";

interface StatsRailProps {
  title?: "My Land" | "Edit";
  address: string;
  recent?: boolean;
  /**
   * Optional pre-fetched stats. If provided, the rail renders these numbers
   * directly and skips its own /lands fetch — used by callers (e.g.
   * my-land/page.tsx) that already loaded the land details.
   */
  stats?: {
    protocols: number;
    transactions: number;
    score: number;
    rank?: number;
  };
}

interface RailStats {
  protocols: number;
  transactions: number;
  score: number;
  rank: number;
  recentClaims: { name: string; hue: number }[];
}

export function StatsRail({
  title = "My Land",
  address,
  recent = true,
  stats: externalStats,
}: StatsRailProps) {
  const { wallet } = useWallet();
  const [stats, setStats] = useState<RailStats | null>(null);

  useEffect(() => {
    // Caller supplied stats — don't run our own fetch.
    if (externalStats) {
      setStats({
        protocols: externalStats.protocols,
        transactions: externalStats.transactions,
        score: externalStats.score,
        rank: externalStats.rank ?? 0,
        recentClaims: [],
      });
      return;
    }
    if (!wallet?.address) {
      setStats(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const [inv, land] = await Promise.all([
          fetchInventory(wallet.address).catch((err) => {
            if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return null;
            throw err;
          }),
          fetchLand(wallet.address).catch((err) => {
            if (err instanceof ApiError && err.status === 404) return null;
            throw err;
          }),
        ]);
        if (cancelled) return;
        const recentClaims = (inv?.claimed ?? [])
          .slice(0, 3)
          .map((c) => {
            const def = isBadgeId(c.badgeId) ? BADGE_CATALOG[c.badgeId] : null;
            return def ? { name: def.name, hue: def.hue } : { name: c.badgeId, hue: 200 };
          });
        setStats({
          protocols: land?.stats.protocols ?? 0,
          transactions: land?.stats.transactions ?? 0,
          score: land?.stats.score ?? 0,
          rank: land?.stats.rank ?? 0,
          recentClaims,
        });
      } catch {
        if (!cancelled) setStats(null);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [wallet?.address, externalStats]);

  const kicker = title === "Edit" ? "EDIT MODE" : "OWNER";
  return (
    <div className="flex flex-col gap-3 w-full">
      <Card padding="lg" className="bg-panel-2">
        <div className="flex items-center gap-2.5">
          <WalletAvatar size="lg" glow />
          <div className="min-w-0">
            <div className={`${UI_TEXT.labelText} text-muted-neon`}>{kicker}</div>
            <h2 className="glow-c text-xl leading-none mt-0.5">{title}</h2>
            <div className={`${UI_TEXT.labelText} glow-m mt-1`}>{address}</div>
          </div>
        </div>
      </Card>
      <StatChip label="PROTOCOLS" value={stats?.protocols ?? 0} color="cyan" />
      <StatChip
        label="TRANSACTIONS"
        value={(stats?.transactions ?? 0).toLocaleString()}
        color="magenta"
      />
      <StatChip label="POINTS" value={stats?.score ?? 0} color="yellow" />
      {recent && (stats?.recentClaims.length ?? 0) > 0 ? (
        <Card padding="default">
          <div className={`${UI_TEXT.labelText} text-muted-neon mb-1.5`}>
            RECENT MINTS
          </div>
          {stats!.recentClaims.map((r) => (
            <div key={r.name} className="flex items-center gap-2 py-1">
              <span
                className="w-3 h-3 block"
                style={{ background: `oklch(0.80 0.14 ${r.hue})` }}
              />
              <span className="font-pixel-body text-[16px] 2xl:text-[20px] text-ink-2">
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
