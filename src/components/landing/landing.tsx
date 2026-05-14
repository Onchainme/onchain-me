import dynamic from "next/dynamic";
import type { LandResponse, StatsResponse } from "@/lib/api";
import { Sk } from "@/components/loading/skeleton-primitives";
import { LandingShell } from "./landing-shell";
import { LandingHero } from "./landing-hero";
import { LandingProblem } from "./landing-problem";
import { LandingHow } from "./landing-how";
import { LandingBadges } from "./landing-badges";
import { LandingSybil } from "./landing-sybil";
import { LandingStats } from "./landing-stats";
import { LandingCta } from "./landing-cta";
import { LandingFooter } from "./landing-footer";

const LandingFaqDynamic = dynamic(
  () => import("./landing-faq").then((m) => m.LandingFaq),
  {
    loading: () => (
      <section
        className="relative py-20 min-[768px]:py-28"
        id="faq"
        aria-hidden
      >
        <div className="max-w-[1320px] mx-auto px-3 min-[640px]:px-12">
          <div className="flex flex-wrap justify-between items-end gap-8 mb-12 min-[768px]:mb-16">
            <div className="max-w-[720px] space-y-3 w-full">
              <Sk className="h-3 w-36" />
              <Sk className="h-10 w-full max-w-lg min-[768px]:h-12" />
            </div>
            <Sk className="h-12 w-full max-w-sm min-[768px]:w-64" />
          </div>
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Sk key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </section>
    ),
  },
);

interface LandingProps {
  /** Most-recent land from `fetchLands({ limit: 1 })`, used to seed the hero
   *  preview's PixiJS scene. Null when the API is unreachable or there are
   *  no lands yet — hero falls back to the SVG `MiniIsland` thumbnail. */
  previewLand?: LandResponse | null;
  /** Live aggregate counters; when present, LandingStats swaps its hardcoded
   *  marketing numbers for these. Null → static placeholders. */
  stats?: StatsResponse | null;
}

export function Landing({ previewLand = null, stats = null }: LandingProps) {
  return (
    <LandingShell>
      <LandingHero previewLand={previewLand} />
      <LandingProblem />
      <LandingHow />
      <LandingBadges />
      <LandingSybil />
      <LandingStats stats={stats} />
      <LandingFaqDynamic />
      <LandingCta />
      <LandingFooter />
    </LandingShell>
  );
}
