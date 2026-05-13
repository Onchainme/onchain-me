

import type { LandResponse } from "@/lib/api";
import { LandingShell } from "./landing-shell";
import { LandingHero } from "./landing-hero";
import { LandingProblem } from "./landing-problem";
import { LandingHow } from "./landing-how";
import { LandingBadges } from "./landing-badges";
import { LandingSybil } from "./landing-sybil";
import { LandingStats } from "./landing-stats";
import { LandingFaq } from "./landing-faq";
import { LandingCta } from "./landing-cta";
import { LandingFooter } from "./landing-footer";

interface LandingProps {
  /** Most-recent land from `fetchLands({ limit: 1 })`, used to seed the hero
   *  preview's PixiJS scene. Null when the API is unreachable or there are
   *  no lands yet — hero falls back to the SVG `MiniIsland` thumbnail. */
  previewLand?: LandResponse | null;
}

export function Landing({ previewLand = null }: LandingProps) {
  return (
    <LandingShell>
      <LandingHero previewLand={previewLand} />
      <LandingProblem />
      <LandingHow />
      <LandingBadges />
      <LandingSybil />
      <LandingStats />
      <LandingFaq />
      <LandingCta />
      <LandingFooter />
    </LandingShell>
  );
}
