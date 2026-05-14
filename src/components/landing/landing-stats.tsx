import type { StatsResponse } from "@/lib/api";
import { LandingSection } from "./landing-section";

interface LandingStatsProps {
  /** Live counts from /api/v1/stats. Two of the four cells render from this
   *  when present; the other two are evergreen marketing numbers about the
   *  Solana ecosystem (TVL, MAW) — those stay static. Null → all four show
   *  marketing fallbacks so the section is never empty. */
  stats?: StatsResponse | null;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString("en-US");
}

export function LandingStats({ stats = null }: LandingStatsProps) {
  // First two cells: live OnchainMe numbers. Render "—" while API is
  // unreachable so the section never goes blank but it's clearly empty
  // (not a fake count).
  const STATS = [
    {
      value: stats ? formatCompact(stats.totalMinted) : "—",
      label: "Badges minted on Solana",
      glow: "glow-c",
    },
    {
      value: stats ? formatCompact(stats.totalUsers) : "—",
      label: "Wallets onboarded",
      glow: "glow-m",
    },
    // Last two cells: ecosystem context. Static, ground truth from category
    // research (Phi shipped this on Base; we're applying the same playbook).
    { value: "$6B", label: "Solana DeFi TVL, 2026", glow: "glow-y" },
    { value: "100K+", label: "Phi users on Base — category validated", glow: "" },
  ];

  return (
    <LandingSection
      eyebrow="Why now"
      title="The Solana identity layer is empty."
      lead="Phi shipped this exact playbook on Base and crossed 100k users in months. The category is validated; the chain is the variable."
    >
      <div className="grid grid-cols-2 min-[768px]:grid-cols-4 border-2 border-border-neon bg-bg-2">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`p-8 min-[640px]:p-9 flex flex-col gap-3 ${
              i < STATS.length - 1 ? "min-[768px]:border-r-2" : ""
            } ${i % 2 === 0 ? "border-r-2 min-[768px]:border-r-2" : ""} ${
              i < 2 ? "border-b-2 min-[768px]:border-b-0" : ""
            } border-border-neon`}
          >
            <span
              className={`font-grotesk font-bold text-[40px] min-[640px]:text-[56px] min-[1024px]:text-[64px] leading-none tracking-[-0.03em] ${s.glow}`}
            >
              {s.value}
            </span>
            <span className="font-jetbrains text-[12px] text-muted-neon">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}
