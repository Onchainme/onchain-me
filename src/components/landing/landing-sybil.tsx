import { OpenAppButton } from "./open-app-button";
import { LandingSection } from "./landing-section";

const SCORE_ROWS = [
  {
    swatch: "bg-magenta-neon shadow-[0_0_10px_var(--color-magenta-neon)]",
    desc: "High · long history, diverse protocols, real PnL",
    verdict: "REAL USER",
    verdictColor: "text-magenta-neon",
  },
  {
    swatch: "bg-yellow-neon shadow-[0_0_10px_var(--color-yellow-neon)]",
    desc: "Mid · some swaps, a few badges, recent wallet",
    verdict: "REVIEW",
    verdictColor: "text-yellow-neon",
  },
  {
    swatch: "bg-muted-neon-2",
    desc: "Low · empty land, no badges, fresh wallet",
    verdict: "LIKELY SYBIL",
    verdictColor: "text-muted-neon-2",
  },
];

const USE_CASES = [
  {
    num: "/01",
    color: "glow-c",
    title: "Airdrop filtering",
    text: "Exclude farms before you spend a single token.",
  },
  {
    num: "/02",
    color: "glow-m",
    title: "Quest gating",
    text: "Gate XP and rewards to wallets that actually use Solana.",
  },
  {
    num: "/03",
    color: "glow-y",
    title: "DeFi underwriting",
    text: "Weight reputation when sizing limits, fees, or payouts.",
  },
  {
    num: "/04",
    color: "text-green-neon",
    title: "Allowlists & DAOs",
    text: "Whitelist real holders without KYC.",
  },
];

export function LandingSybil() {
  return (
    <LandingSection
      id="sybil"
      eyebrow="For protocols · Anti-Sybil API"
      title={
        <>
          Every land is a <span className="glow-c">Sybil score</span>.
          <br />
          <span className="text-muted-neon">We sell it as an API.</span>
        </>
      }
      lead="More badges, more activity, more days onchain — the harder a wallet is to fake. Query any wallet's humanity score with a single call."
    >
      <div className="grid gap-7 lg:gap-15 lg:grid-cols-[1fr_1.05fr] items-stretch">
        <div className="border-2 border-border-neon bg-bg-2 p-7 sm:p-8 flex flex-col gap-6">
          <div className="flex justify-between items-center font-jetbrains text-[12px] text-muted-neon">
            <span>Humanity score</span>
            <span className="glow-c">0 → 100</span>
          </div>

          <div className="border-t-2 border-border-neon">
            {SCORE_ROWS.map((r) => (
              <div
                key={r.verdict}
                className="grid grid-cols-[28px_1fr_auto] gap-5 items-center py-5 border-b-2 border-border-neon last:border-b-0"
              >
                <span className={`size-5 ${r.swatch}`} />
                <span className="font-grotesk text-[16px] text-ink leading-snug">
                  {r.desc}
                </span>
                <span
                  className={`font-jetbrains text-[11px] ${r.verdictColor}`}
                >
                  {r.verdict}
                </span>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mt-1">
            {USE_CASES.map((u) => (
              <div
                key={u.num}
                className="border-2 border-border-neon p-5 flex flex-col gap-2"
              >
                {/* Use case number kept on Press Start 2P per spec. */}
                <span className={`font-px text-[14px] ${u.color}`}>{u.num}</span>
                <h4 className="font-grotesk text-[18px] font-semibold text-ink">
                  {u.title}
                </h4>
                <p className="font-grotesk text-[14px] text-muted-neon leading-snug">
                  {u.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <pre className="border-2 border-border-neon bg-[#06040c] p-6 font-jetbrains text-[14px] normal-case tracking-[0.02em] leading-[1.6] text-muted-neon overflow-x-auto">
            <code>
              <span className="text-muted-neon-2"># GET https://api.onchain.me/v1/score/&lt;wallet&gt;</span>
              {"\n\n"}
              <span className="text-green-neon font-bold">curl</span> -H{" "}
              <span className="text-yellow-neon">
                &quot;Authorization: Bearer $ONCHAIN_KEY&quot;
              </span>{" "}
              \{"\n"}
              {"     "}https://api.onchain.me/v1/score/
              <span className="text-magenta-neon">5f3w…7fE</span>
              {"\n\n"}
              <span className="text-muted-neon-2"># → response</span>
              {"\n"}
              {"{"}
              {"\n"}
              {"  "}<span className="text-cyan-neon">&quot;wallet&quot;</span>:{" "}
              <span className="text-yellow-neon">&quot;5f3w…7fE&quot;</span>,{"\n"}
              {"  "}<span className="text-cyan-neon">&quot;score&quot;</span>:{" "}
              <span className="text-magenta-neon">87</span>,{"\n"}
              {"  "}<span className="text-cyan-neon">&quot;verdict&quot;</span>:{" "}
              <span className="text-yellow-neon">&quot;real_user&quot;</span>,{"\n"}
              {"  "}<span className="text-cyan-neon">&quot;badges&quot;</span>:{" "}
              <span className="text-magenta-neon">12</span>,{"\n"}
              {"  "}<span className="text-cyan-neon">&quot;first_tx_days&quot;</span>:{" "}
              <span className="text-magenta-neon">847</span>,{"\n"}
              {"  "}<span className="text-cyan-neon">&quot;protocols&quot;</span>: [
              <span className="text-yellow-neon">&quot;jupiter&quot;</span>,{" "}
              <span className="text-yellow-neon">&quot;meteora&quot;</span>,{" "}
              <span className="text-yellow-neon">&quot;orca&quot;</span>]{"\n"}
              {"}"}
            </code>
          </pre>

          <OpenAppButton label="Request API access" size="lg" className="self-start" />
          <p className="font-grotesk text-[14px] text-muted-neon m-0">
            Free tier · pay per query above 10k/mo · enterprise on request.
          </p>
        </div>
      </div>
    </LandingSection>
  );
}
