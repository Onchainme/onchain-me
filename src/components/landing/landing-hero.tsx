"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { MiniIsland } from "@/components/canvas/MiniIsland";
import { OpenAppButton } from "./open-app-button";
import { Button } from "@/components/ui/button";
import type { LandResponse } from "@/lib/api";
import { placementToLandObject } from "@/lib/placement-mapper";
import { shortWallet } from "@/lib/utils";

const HeroIsland = dynamic(
  () =>
    import("@/components/canvas/IsometricIsland").then((m) => m.IsometricIsland),
  {
    ssr: false,
    loading: () => <MiniIsland fill seed={7} count={5} />,
  },
);

const PROTOCOLS = ["Jupiter", "Pump.fun", "Orca", "Meteora", "Drift", "Tensor"];

interface LandingHeroProps {
  previewLand?: LandResponse | null;
}

export function LandingHero({ previewLand = null }: LandingHeroProps) {
  return (
    <section className="relative px-3 min-[640px]:px-12 pt-16 min-[640px]:pt-24 pb-16 min-[640px]:pb-28 overflow-hidden">
      <div className="absolute inset-x-0 -top-24 bottom-0 pointer-events-none [background:radial-gradient(ellipse_55%_50%_at_70%_40%,rgba(168,85,247,0.22),transparent_70%),radial-gradient(ellipse_40%_35%_at_30%_80%,rgba(34,211,238,0.12),transparent_70%)]" />

      <div className="relative max-w-[1320px] mx-auto grid gap-12 min-[900px]:gap-18 min-[900px]:grid-cols-[1.1fr_1fr] items-center">
        <div>
          <span className="inline-flex items-center gap-3 font-jetbrains text-[12px] min-[640px]:text-[14px] text-cyan-neon">
            <span className="inline-block size-2.5 bg-cyan-neon shadow-[0_0_10px_var(--color-cyan-neon)]" />
            Solana · pixel identity layer
          </span>

          <h1 className="font-grotesk text-[40px] xs:text-[52px] min-[768px]:text-[64px] min-[1280px]:text-[80px] font-bold leading-[1.02] mt-6 tracking-[-0.025em] text-balance">
            Your Solana wallet,
            <br />
            as a <span className="glow-m">3D land</span>
            <br />
            you can <span className="glow-c">mint and share</span>.
          </h1>

          <p className="font-grotesk text-[18px] min-[768px]:text-[22px] text-ink mt-7 max-w-[58ch] leading-[1.5]">
            Connect a wallet. We scan every protocol you&apos;ve used and turn
            your history into a piece of pixel real estate — populated with the
            badges you earned{" "}
            <span className="text-muted-neon">just by living onchain</span>.
          </p>

          <div className="flex flex-wrap gap-4 mt-10">
            <OpenAppButton size="lg" className="min-w-[260px]" />
            <Button
              variant="ghost"
              size="lg"
              className="font-px tracking-[0.08em] min-w-[260px]"
              asChild
            >
              <a href="#how">See how it works →</a>
            </Button>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-4 mt-10 pt-7 border-t-2 border-border-neon font-jetbrains text-[12px] min-[640px]:text-[13px] text-muted-neon">
            <div>
              Status&nbsp;&nbsp;
              <span className="glow-c">▶ Alpha</span>
              <span className="text-ink-2"> · Solana mainnet</span>
            </div>
            <div>
              Mint cost&nbsp;&nbsp;
              <span className="glow-m">~$0.005</span>
              <span className="text-ink-2">/badge</span>
            </div>
            <div>
              No login&nbsp;&nbsp;<span className="text-ink-2">wallet only</span>
            </div>
          </div>
        </div>

        <LandPreviewCard previewLand={previewLand} />
      </div>

      <div className="relative max-w-[1320px] mx-auto mt-16 flex gap-4 flex-wrap items-center">
        <span className="font-jetbrains text-[12px] text-muted-neon">
          Reads activity from
        </span>
        {PROTOCOLS.map((p) => (
          <span
            key={p}
            className="font-jetbrains text-[12px] text-ink-2 border-2 border-border-neon bg-bg-2/40 px-4 py-2.5"
          >
            {p}
          </span>
        ))}
        <span className="font-jetbrains text-[12px] text-muted-neon-2">
          + extensible
        </span>
      </div>
    </section>
  );
}

interface LandPreviewCardProps {
  previewLand: LandResponse | null;
}

function LandPreviewCard({ previewLand }: LandPreviewCardProps) {
  const objects = useMemo(
    () => previewLand?.placements.map(placementToLandObject) ?? [],
    [previewLand],
  );
  const hasScene = objects.length > 0;
  const headerLabel = previewLand?.wallet
    ? `/land/${shortWallet(previewLand.wallet)}`
    : "/land/0xT…7fE";

  return (
    <div className="relative w-full aspect-square border-2 border-border-neon bg-panel overflow-hidden">
      <div className="absolute inset-0 z-0">
        {hasScene ? (
          <HeroIsland
            width={1200}
            height={1200}
            scale={1.5}
            objects={objects}
          />
        ) : (
          <MiniIsland fill seed={7} count={5} />
        )}
      </div>

      <div className="relative z-10 flex flex-col h-full p-6 min-[640px]:p-7 pointer-events-none">
        <div className="flex justify-between items-center font-jetbrains text-[11px] min-[640px]:text-[12px] text-muted-neon [text-shadow:0_0_8px_rgba(10,6,18,0.9)]">
          <span>{headerLabel}</span>
          <span className="inline-flex items-center gap-2 text-green-neon">
            <span className="inline-block size-2 bg-green-neon shadow-[0_0_10px_var(--color-green-neon)]" />
            LIVE
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex gap-2 mb-4">
          <span className="size-5 bg-magenta-neon shadow-[0_0_10px_var(--color-magenta-neon)]" />
          <span className="size-5 bg-cyan-neon shadow-[0_0_10px_var(--color-cyan-neon)]" />
          <span className="size-5 bg-yellow-neon shadow-[0_0_10px_var(--color-yellow-neon)]" />
          <span className="size-5 bg-green-neon shadow-[0_0_10px_var(--color-green-neon)]" />
        </div>

        <div className="flex justify-between items-center pt-4 border-t-2 border-border-neon font-jetbrains text-[13px] [text-shadow:0_0_8px_rgba(10,6,18,0.9)]">
          <span className="text-ink-2 normal-case tracking-normal">onchain.me/land</span>
          <span className="glow-c">/&lt;wallet&gt;</span>
        </div>
      </div>
    </div>
  );
}
