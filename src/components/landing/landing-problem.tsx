import { LandingSection } from "./landing-section";

const PAINS = [
  {
    title: "Activity is fragmented",
    text: "Jupiter, Magic Eden, Kamino, Meteora — every protocol tracks you separately. There is no consolidated view of who you are on-chain.",
  },
  {
    title: "Identity is a hash",
    text: "Existing solutions give you a reputation score and a base58 address. No visual layer, no character, nothing to show.",
  },
  {
    title: "No reason to share",
    text: "Wallets are private dashboards, not social objects. There is nothing for users to post, compare, or flex.",
  },
];

export function LandingProblem() {
  return (
    <LandingSection
      eyebrow="The problem"
      title={
        <>
          A Solana wallet tells a great story.
          <br />
          <span className="text-muted-neon">Nobody can read it.</span>
        </>
      }
      lead="Years of swaps, mints and stakes — and the only proof is a 44-character address."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {PAINS.map((p) => (
          <div
            key={p.title}
            className="border-2 border-border-neon bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] p-7 sm:p-8 flex flex-col gap-4"
          >
            {/* Pixel accent kept on Press Start 2P per spec. */}
            <div className="font-px text-[18px] glow-m leading-none">[ X ]</div>
            <h3 className="font-grotesk text-[22px] sm:text-[24px] font-semibold leading-[1.15] text-ink">
              {p.title}
            </h3>
            <p className="font-grotesk text-[16px] text-muted-neon leading-[1.5]">
              {p.text}
            </p>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}
