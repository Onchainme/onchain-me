"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MiniIsland } from "@/components/canvas/MiniIsland";
import { useWallet } from "@/hooks/wallet";
import { STATS } from "@/lib/mock-data";
import { ApiError, fetchInventory, fetchLand } from "@/lib/api";

interface HeroStats {
  eligible: number;
  claimed: number;
  rank: number;
  score: number;
  transactions: number;
  protocols: number;
}

export function Hero() {
  const { isConnected, openConnectModal, wallet } = useWallet();
  const [stats, setStats] = useState<HeroStats | null>(null);

  useEffect(() => {
    if (!wallet?.address) {
      setStats(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const [inv, land] = await Promise.all([
          fetchInventory(wallet.address),
          fetchLand(wallet.address).catch((err) => {
            if (err instanceof ApiError && err.status === 404) return null;
            throw err;
          }),
        ]);
        if (cancelled) return;
        setStats({
          eligible: inv.eligible.length,
          claimed: inv.claimed.length,
          rank: land?.stats.rank ?? 0,
          score: land?.stats.score ?? 0,
          transactions: land?.stats.transactions ?? 0,
          protocols: land?.stats.protocols ?? 0,
        });
      } catch {
        if (!cancelled) setStats(null);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [wallet?.address]);

  if (isConnected) {
    const eligible = stats?.eligible ?? 0;
    const claimed = stats?.claimed ?? 0;
    const rankLine =
      stats && stats.rank > 0 ? (
        <>
          <span className="text-ink-2">Your island is </span>
          <span className="glow-m">rank #{stats.rank}</span>
          {stats.score > 0 ? (
            <>
              <span className="text-ink-2"> · </span>
              <span className="glow-y">{stats.score} pts</span>
            </>
          ) : null}
        </>
      ) : (
        <span className="text-ink-2">Your island awaits.</span>
      );

    const headlineMain = eligible > 0
      ? <><span className="glow-c">{eligible} OBJECTS</span> <span className="text-ink-2">eligible to mint.</span></>
      : claimed > 0
      ? <><span className="glow-c">{claimed} OBJECTS</span> <span className="text-ink-2">claimed — place them on your land.</span></>
      : <span className="text-ink-2">No badges yet — open Edit to scan.</span>;

    return (
      <Card
        accent="magenta"
        padding="lg"
        className="relative bg-[linear-gradient(90deg,rgba(255,45,147,0.08),rgba(34,211,238,0.04)_60%,transparent)]"
      >
        <div className="flex items-center gap-5 flex-wrap">
          <div className="shrink-0 p-1 border-2 border-border-neon-2 bg-bg">
            <MiniIsland width={140} height={90} seed={12} count={3} />
          </div>
          <div className="flex-1 min-w-60">
            <div className="font-silk text-[12px] text-muted-neon tracking-[0.16em]">
              WELCOME BACK
            </div>
            <div className="font-px text-[20px] mt-1.5 leading-snug">
              {headlineMain}
              <br />
              {rankLine}
            </div>
            <div className="font-pixel-body text-base text-muted-neon mt-1.5">
              {stats
                ? `${stats.protocols} protocol${stats.protocols === 1 ? "" : "s"} · ${stats.transactions.toLocaleString()} transaction${stats.transactions === 1 ? "" : "s"} indexed`
                : "Loading wallet stats…"}
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-full md:min-w-50 ">
            <Button variant="primary" size="lg" asChild>
              <Link href="/edit" prefetch={false} className="w-full">
                {eligible > 0 ? `✨ Mint All (${eligible})` : "→ Open Edit"}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/my-land" prefetch={false} className="w-full text-[16px]">
                → Open My Land
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex items-end gap-5 flex-wrap">
      <div className="flex-1 min-w-[320px]">
        <h1 className="text-4xl mb-2">
          <span className="glow-m">ONCHAIN</span>
          <span className="glow-c">.ME</span>
        </h1>
        <div className="font-silk text-[12px] text-ink-2 tracking-[0.15em]">
          YOUR WALLET · YOUR WORLD
        </div>
        <div className="w-60 h-0.75 mt-2 bg-cyan-neon shadow-[0_0_10px_var(--color-cyan-neon)]" />
        <div className="font-pixel-body text-base text-muted-neon mt-3.5 max-w-lg">
          Turn your Solana history into a collectible island. Each protocol you
          use unlocks a unique pixel building.
        </div>
        <Button variant="primary" size="lg" onClick={openConnectModal} className="mt-3.5">
          ▶ Connect wallet to start
        </Button>
      </div>
      <Card accent="violet" padding="default" className="min-w-70">
        <div className="flex items-center gap-6">
          <div>
            <div className="font-silk text-[8px] text-muted-neon">LANDS MINTED</div>
            <div className="font-px glow-v text-[20px] mt-0.5">
              {STATS.mintedTotal.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="font-silk text-[8px] text-muted-neon">TODAY</div>
            <div className="font-px glow-y text-[20px] mt-0.5">+{STATS.today}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
