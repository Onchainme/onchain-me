"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MintStage } from "@/hooks/use-inventory";

interface MintProgressProps {
  stage: MintStage;
  /** Optional batch position ("Minting 2 of 5"). Shown above the steps. */
  batch?: { current: number; total: number } | null;
}

// Linear pipeline the user walks through. Order matters: rendering compares
// each step's index against the current stage to decide done/active/upcoming.
const STEPS: Array<{ key: MintStage; label: string }> = [
  { key: "preparing", label: "Building transaction" },
  { key: "signing", label: "Waiting for wallet signature" },
  { key: "sending", label: "Broadcasting to Solana" },
  { key: "confirming", label: "Confirming on-chain" },
  { key: "indexing", label: "Indexing the NFT" },
  { key: "done", label: "Done" },
];

function stageIndex(stage: MintStage): number {
  if (stage === "idle") return -1;
  if (stage === "error") return -1;
  const i = STEPS.findIndex((s) => s.key === stage);
  return i;
}

export function MintProgress({ stage, batch }: MintProgressProps) {
  const active = stageIndex(stage);
  return (
    <div className="border-2 border-border-neon bg-bg-2 p-3">
      {batch && batch.total > 1 ? (
        <div className="font-silk text-[10px] tracking-widest text-cyan-neon mb-2">
          MINTING {batch.current} OF {batch.total}
        </div>
      ) : null}
      <ol className="flex flex-col gap-1.5">
        {STEPS.map((step, i) => {
          const isDone = active > i || stage === "done";
          // The final "Done" row is only "active" when stage === "done";
          // otherwise the truly-active step is the one at index === active.
          const isActive = !isDone && i === active && stage !== "error";
          return (
            <li
              key={step.key}
              className={cn(
                "flex items-center gap-2.5 font-pixel-body text-[14px] leading-none",
                isDone
                  ? "text-cyan-neon"
                  : isActive
                    ? "text-ink"
                    : "text-muted-neon/60",
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center justify-center w-4 h-4 border-2",
                  isDone
                    ? "bg-cyan-neon border-cyan-neon text-[#001014]"
                    : isActive
                      ? "border-cyan-neon"
                      : "border-border-neon",
                )}
              >
                {isDone ? (
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                ) : isActive ? (
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-cyan-neon" />
                ) : null}
              </span>
              {step.label}
            </li>
          );
        })}
      </ol>
      {stage === "error" ? (
        <div className="mt-2 font-silk text-[10px] text-red-300 uppercase tracking-widest">
          ⚠ Mint failed — see error below
        </div>
      ) : null}
    </div>
  );
}
