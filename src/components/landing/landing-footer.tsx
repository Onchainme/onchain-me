import Link from "next/link";
import { PixelLogo } from "@/components/ui/pixel-logo";
import { SOCIAL_GITHUB_URL, SOCIAL_X_URL } from "@/lib/urls";

const PRODUCT_LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Badges", href: "#badges" },
  { label: "Mint your land", href: "#cta" },
  { label: "FAQ", href: "#faq" },
];

// const PROTOCOL_LINKS = [
//   { label: "Anti-Sybil API", href: "#sybil" },
//   { label: "Use cases", href: "#sybil" },
//   { label: "Partnerships", href: "#cta" },
//   { label: "API docs", href: "#sybil", ext: "soon" },
// ];

// const COMMUNITY_LINKS = [
//   { label: "Twitter / X", href: "https://twitter.com/onchainme" },
//   { label: "Discord", href: "https://discord.gg/onchainme" },
//   { label: "Telegram", href: "https://t.me/onchainme" },
//   { label: "GitHub", href: "https://github.com/onchainme" },
// ];

export function LandingFooter() {
  return (
    <footer className="relative pt-16 pb-10">
      <div className="max-w-[1320px] mx-auto px-3 min-[640px]:px-12">
        <div className="grid gap-12 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <PixelLogo size={28} />
              <span className="font-px text-[16px] leading-none">
                <span className="glow-m">ONCHAIN</span>
                <span className="glow-c">.ME</span>
              </span>
            </Link>
            <p className="font-grotesk text-[14px] text-muted-neon mt-5 max-w-[36ch] leading-[1.5]">
              Your Solana wallet, as a 3D land you can mint and share. Plus the
              humanity score behind it, sold as an API.
            </p>
          </div>

          <FooterCol title="Product" links={PRODUCT_LINKS} />
          {/* <FooterCol title="For protocols" links={PROTOCOL_LINKS} />
          <FooterCol title="Community" links={COMMUNITY_LINKS} external /> */}
        </div>

        <div
          aria-hidden
          className="font-px text-[clamp(40px,8vw,120px)] max-[500px]:text-[clamp(22px,9vw,34px)] max-[500px]:tracking-normal tracking-[0.02em] text-transparent text-center mt-18 leading-none select-none [-webkit-text-stroke:1px_var(--color-border-neon)] max-w-full overflow-hidden px-1"
        >
          ONCHAIN<span className="text-magenta-neon">.</span>ME
        </div>

        <div className="mt-14 pt-7 border-t-2 border-border-neon flex flex-wrap justify-between items-center gap-4 font-jetbrains text-[11px] text-muted-neon-2">
          <span>© 2026 OnchainMe Labs · Built for Solana</span>
          <div className="flex gap-5">
            <a
              href={SOCIAL_X_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-neon transition-colors"
            >
              Twitter
            </a>
            <a
              href={SOCIAL_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-neon transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FooterColProps {
  title: string;
  links: Array<{ label: string; href: string; ext?: string }>;
  external?: boolean;
}

function FooterCol({ title, links, external }: FooterColProps) {
  return (
    <div>
      <h5 className="font-jetbrains text-[12px] text-muted-neon mb-5">{title}</h5>
      <ul className="flex flex-col gap-3.5">
        {links.map((l) =>
          external ? (
            <li key={l.label}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-grotesk text-[15px] text-ink hover:text-magenta-neon transition-colors"
              >
                {l.label}
                <span className="font-jetbrains text-[10px] text-muted-neon-2 ml-2">↗</span>
              </a>
            </li>
          ) : (
            <li key={l.label}>
              <Link
                href={l.href}
                className="font-grotesk text-[15px] text-ink hover:text-magenta-neon transition-colors"
              >
                {l.label}
                {l.ext && (
                  <span className="font-jetbrains text-[10px] text-muted-neon-2 ml-2">
                    {l.ext}
                  </span>
                )}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
