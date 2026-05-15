"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PixelLogo } from "@/components/ui/pixel-logo";
import {
  LANDING_SYBIL_SECTION,
  SOCIAL_GITHUB_URL,
  SOCIAL_X_URL,
} from "@/lib/urls";
import { LandingHashButton } from "./landing-hash-button";
import { OpenAppButton } from "./open-app-button";

const NAV_LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Badges", href: "#badges" },
  { label: "Anti-Sybil API", href: LANDING_SYBIL_SECTION },
  { label: "FAQ", href: "#faq" },
];

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-border-neon bg-[rgba(10,6,18,0.7)] backdrop-blur-md">
      <div className="max-w-[1320px] mx-auto flex flex-nowrap items-center gap-3 min-[640px]:gap-4 h-[68px] min-[640px]:h-[76px] px-3 min-[640px]:px-12">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <PixelLogo size={28} />
          <span className="font-px text-[14px] min-[640px]:text-[16px] leading-none whitespace-nowrap">
            <span className="glow-m">ONCHAIN</span>
            <span className="glow-c">.ME</span>
          </span>
        </Link>

        <div className="hidden min-[1100px]:flex flex-nowrap items-center gap-3 min-[1200px]:gap-5 ml-auto min-w-0">
          <nav className="flex flex-nowrap items-center gap-3 min-[1100px]:gap-5 whitespace-nowrap font-jetbrains text-[11px] min-[1200px]:text-[12px] text-muted-neon shrink min-w-0">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="hover:text-ink transition-colors shrink-0"
              >
                {l.label}
              </a>
            ))}
            <a
              href={SOCIAL_X_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-neon hover:text-cyan-neon-2 transition-colors shrink-0"
            >
              Twitter ↗
            </a>
            <a
              href={SOCIAL_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-neon hover:text-cyan-neon-2 transition-colors shrink-0"
            >
              GitHub ↗
            </a>
          </nav>

          <div className="flex flex-nowrap items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="lg"
              className="font-px tracking-[0.08em] whitespace-nowrap px-3 min-[1200px]:px-4"
              asChild
            >
              <a href={LANDING_SYBIL_SECTION}>For protocols</a>
            </Button>
            <OpenAppButton className="whitespace-nowrap shrink-0" />
          </div>
        </div>

        <div className="min-[900px]:hidden ml-auto flex items-center gap-2 shrink-0">
          <OpenAppButton className="max-[500px]:hidden whitespace-nowrap" />
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center justify-center size-9 border-2 border-border-neon bg-bg-2 text-ink shrink-0"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      <div className="hidden max-[500px]:block border-t-2 border-border-neon px-3 py-2.5">
        <LandingHashButton
          label="Request API access"
          size="lg"
          className="w-full [&_a]:w-full"
        />
      </div>

      {menuOpen ? (
        <div className="min-[1100px]:hidden border-t-2 border-border-neon bg-[rgba(10,6,18,0.96)] px-3 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="font-jetbrains text-[12px] text-muted-neon hover:text-ink px-2 py-2.5"
            >
              {l.label}
            </a>
          ))}
          <a
            href={SOCIAL_X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-jetbrains text-[12px] text-cyan-neon px-2 py-2.5"
          >
            Twitter ↗
          </a>
          <a
            href={SOCIAL_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-jetbrains text-[12px] text-cyan-neon px-2 py-2.5"
          >
            GitHub ↗
          </a>
        </div>
      ) : null}
    </header>
  );
}
