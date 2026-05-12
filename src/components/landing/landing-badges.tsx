import { API_BASE_URL } from "@/lib/api";
import { BADGE_CATALOG, badgeAsset, type BadgeTier } from "@/lib/badge-catalog";
import { LandingSection } from "./landing-section";

const TIER_LABEL: Record<BadgeTier, string> = {
  bronze: "Bronze · common",
  silver: "Silver · rare",
  original: "Original · legendary",
  single: "Genesis · unique",
};

const TIER_ACCENT: Record<BadgeTier, string> = {
  bronze: "text-yellow-neon",
  silver: "text-cyan-neon",
  original: "text-magenta-neon",
  single: "text-violet-neon",
};

const BADGES = Object.values(BADGE_CATALOG);

export function LandingBadges() {
  return (
    <LandingSection
      id="badges"
      eyebrow="Achievements"
      title={
        <>
          {BADGES.length} launch badges.
          <br />
          <span className="text-muted-neon">A path to 50+.</span>
        </>
      }
      lead="Rule-based, transparent, and minted as compressed NFTs at ~$0.001 each."
    >
      <div className="grid gap-4 grid-cols-2 min-[640px]:grid-cols-3 min-[1024px]:grid-cols-5">
        {BADGES.map((b) => {
          const asset = badgeAsset(API_BASE_URL, b.badgeId);
          return (
            <div
              key={b.badgeId}
              className="border-2 border-border-neon bg-bg-2 p-6 flex flex-col gap-4 aspect-[1/1.05] transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="size-14 grid place-items-center">
                {asset ? (
                  <img
                    src={asset.url}
                    alt={b.name}
                    className="block w-full h-full object-contain"
                    draggable={false}
                  />
                ) : (
                  <span className="font-px text-[20px] text-muted-neon">
                    {b.glyph}
                  </span>
                )}
              </div>
              <h4 className="font-grotesk text-[18px] font-semibold leading-[1.15] text-ink mt-auto">
                {b.name}
              </h4>
              <span
                className={`font-jetbrains text-[11px] ${TIER_ACCENT[b.tier]}`}
              >
                {TIER_LABEL[b.tier]}
              </span>
            </div>
          );
        })}
      </div>
    </LandingSection>
  );
}
