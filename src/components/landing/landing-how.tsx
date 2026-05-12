import { LandingSection } from "./landing-section";

const STEPS = [
  { num: "01", title: "Connect", text: "One tap with Phantom, Backpack, or Solflare." },
  {
    num: "02",
    title: "Scan",
    text: "Helius parses your transaction history across every supported protocol in under ten seconds.",
  },
  {
    num: "03",
    title: "Mint",
    text: "The engine matches your activity to badges. Sign once, mint them all as compressed NFTs.",
  },
  {
    num: "04",
    title: "Share",
    text: "A public /land/<wallet> URL anyone can visit — no login required.",
  },
];

export function LandingHow() {
  return (
    <LandingSection
      id="how"
      eyebrow="How it works"
      title="Four steps from wallet to land."
      lead="No signup, no email, no custody. One signature mints the whole land."
    >
      <div className="relative grid gap-4 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-4">
        <div
          aria-hidden
          className="hidden min-[1024px]:block absolute top-[46px] left-[64px] right-[64px] h-0.5 z-0 [background:repeating-linear-gradient(90deg,var(--color-cyan-neon)_0,var(--color-cyan-neon)_8px,transparent_8px,transparent_16px)] opacity-50"
        />
        {STEPS.map((s) => (
          <div
            key={s.num}
            className="relative z-10 border-2 border-border-neon bg-bg-2 p-7 flex flex-col gap-4"
          >
            {/* Pixel step number per spec — Press Start 2P kept. */}
            <div className="size-13 border-2 border-cyan-neon bg-bg grid place-items-center font-px text-[14px] glow-c">
              {s.num}
            </div>
            <h3 className="font-grotesk text-[22px] font-semibold text-ink">
              {s.title}
            </h3>
            <p className="font-grotesk text-[15px] text-muted-neon leading-[1.5]">
              {s.text}
            </p>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}
