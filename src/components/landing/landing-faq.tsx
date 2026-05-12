"use client";

import { useState } from "react";
import { LandingSection } from "./landing-section";

const QUESTIONS = [
  {
    q: "Do I need to sign anything dangerous?",
    a: "No. We read your public transaction history through Helius — no approvals, no permissions, no custody. You sign exactly once: when you mint your badges as compressed NFTs.",
  },
  {
    q: "What does it cost?",
    a: "Minting your land is free during alpha. After that, expect ~$0.001 per badge via Solana's compressed NFT standard — the network fee, nothing more. Cosmetics and traits are an optional upgrade later.",
  },
  {
    q: "How is the Sybil score calculated?",
    a: "Transparent rule set on top of parsed activity: protocol diversity, tenure, NFT history, DEX volume, badge count. No ML black box — every wallet's score is reproducible. Protocols can request the underlying signals.",
  },
  {
    q: "Which protocols do you read from?",
    a: "At launch: Jupiter, Pump.fun, Orca, Meteora, plus the Seeker Genesis NFT. The parser is extensible — any Solana program with a readable IDL can be added.",
  },
  {
    q: "What about Phi, Solana ID, POAP?",
    a: "Phi has not shipped on Solana. Solana ID and POAP are reputation primitives — neither does visual, gamified identity. We sit at the intersection of fun and proof.",
  },
  {
    q: "Is this open source?",
    a: "The achievement rules and the score formula are public. The renderer and parser are closed-source during alpha and will open as we hit the v1 milestone.",
  },
];

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <LandingSection id="faq" eyebrow="FAQ" title="Questions, answered.">
      <div className="flex flex-col border-t-2 border-border-neon">
        {QUESTIONS.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={item.q} className="border-b-2 border-border-neon">
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                className="w-full text-left cursor-pointer py-7 flex justify-between items-center gap-6 font-grotesk text-[20px] min-[640px]:text-[22px] font-semibold text-ink"
              >
                <span>{item.q}</span>
                <span
                  className={`font-px text-[18px] glow-c shrink-0 transition-transform duration-300 ease-out ${
                    open ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              {/* grid-rows-[0fr → 1fr] is the modern pure-CSS pattern for
                  animating to auto height; child must overflow-hidden. */}
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
              >
                <div
                  className={`overflow-hidden transition-opacity duration-300 ${
                    open ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <p className="pb-7 pr-10 font-grotesk text-[16px] text-muted-neon leading-[1.6] max-w-[68ch]">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </LandingSection>
  );
}
