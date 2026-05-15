import { Button } from "@/components/ui/button";
import { SOCIAL_X_URL } from "@/lib/urls";
import { OpenAppButton } from "./open-app-button";

export function LandingCta() {
  return (
    <section
      id="cta"
      className="relative py-24 min-[768px]:py-32 text-center overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(255,45,147,0.22),transparent_70%),radial-gradient(ellipse_40%_35%_at_50%_60%,rgba(34,211,238,0.12),transparent_70%)]" />

      <div className="relative max-w-[880px] mx-auto px-3 min-[640px]:px-12">
        <span className="inline-flex items-center gap-3 font-jetbrains text-[12px] text-cyan-neon">
          <span className="inline-block size-2.5 bg-cyan-neon shadow-[0_0_10px_var(--color-cyan-neon)]" />
          Free alpha · Solana mainnet
        </span>

        <h2 className="font-grotesk font-bold text-[42px] min-[640px]:text-[64px] min-[1024px]:text-[80px] mt-6 leading-[1] tracking-[-0.03em]">
          Mint your <span className="glow-m">land</span>.
          <br />
          Show your <span className="glow-c">story</span>.
        </h2>

        <p className="font-grotesk text-[18px] min-[640px]:text-[20px] text-muted-neon mt-6">
          Takes about ten seconds. No email. No KYC.
        </p>

        <div className="flex flex-wrap gap-4 justify-center mt-12">
          <OpenAppButton size="lg" className="min-w-[280px]" />
          <Button
            variant="ghost"
            size="lg"
            className="font-px tracking-[0.08em] min-w-[280px]"
            asChild
          >
            <a href={SOCIAL_X_URL} target="_blank" rel="noopener noreferrer">
              Follow on Twitter →
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
