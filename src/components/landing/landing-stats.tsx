import { LandingSection } from "./landing-section";

const STATS = [
  { value: "$6B", label: "Solana DeFi TVL, 2026", glow: "glow-c" },
  { value: "2.5M", label: "Monthly active wallets", glow: "glow-m" },
  { value: "100K+", label: "Phi users on Base — category validated", glow: "glow-y" },
  { value: "0", label: "Solana-native competitors shipped", glow: "" },
];

export function LandingStats() {
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
