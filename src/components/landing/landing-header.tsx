"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PixelLogo } from "@/components/ui/pixel-logo";
import { OpenAppButton } from "./open-app-button";

const NAV_LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Badges", href: "#badges" },
  { label: "Anti-Sybil API", href: "#sybil" },
  { label: "FAQ", href: "#faq" },
];

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-border-neon bg-[rgba(10,6,18,0.7)] backdrop-blur-md">
      <div className="max-w-[1320px] mx-auto flex items-center gap-6 h-[68px] min-[640px]:h-[76px] px-3 min-[640px]:px-12">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <PixelLogo size={28} />
          <span className="font-px text-[14px] min-[640px]:text-[16px] leading-none">
            <span className="glow-m">ONCHAIN</span>
            <span className="glow-c">.ME</span>
          </span>
        </Link>

        <nav className="hidden min-[900px]:flex gap-7 ml-auto font-jetbrains text-[12px] text-muted-neon">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="hover:text-ink transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="https://twitter.com/onchainme"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-neon hover:text-cyan-neon-2 transition-colors"
          >
            Twitter ↗
          </a>
        </nav>

        <div className="hidden min-[900px]:flex items-center gap-3 ml-3">
          <Button
            variant="ghost"
            size="lg"
            className="font-px tracking-[0.08em]"
            asChild
          >
            <a href="#sybil">For protocols</a>
          </Button>
          <OpenAppButton />
        </div>

        <div className="min-[900px]:hidden ml-auto flex items-center gap-2">
          <OpenAppButton />
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center justify-center size-9 border-2 border-border-neon bg-bg-2 text-ink"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="min-[900px]:hidden border-t-2 border-border-neon bg-[rgba(10,6,18,0.96)] px-3 py-4 flex flex-col gap-1">
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
            href="https://twitter.com/onchainme"
            target="_blank"
            rel="noopener noreferrer"
            className="font-jetbrains text-[12px] text-cyan-neon px-2 py-2.5"
          >
            Twitter ↗
          </a>
        </div>
      ) : null}
    </header>
  );
}
