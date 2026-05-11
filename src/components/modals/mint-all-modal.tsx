"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GlyphTile } from "@/components/ui/glyph-tile";
import type { InventoryItem } from "@/lib/types";
import { API_BASE_URL } from "@/lib/api";
import { badgeAsset, isBadgeId } from "@/lib/badge-catalog";

interface MintAllModalProps {
  items: InventoryItem[];
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Per-mint price in lamports (0 = sponsored / free). null while loading. */
  mintPriceLamports: number | null;
}

const LAMPORTS_PER_SOL = 1_000_000_000;

function formatMintPriceTotal(lamportsPer: number | null, count: number): string {
  if (lamportsPer === null) return "…";
  if (lamportsPer === 0) return "FREE · sponsored";
  const total = (lamportsPer * count) / LAMPORTS_PER_SOL;
  const trimmed = total.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  return `${trimmed} SOL (${count} × ${(lamportsPer / LAMPORTS_PER_SOL).toString()})`;
}

export function MintAllModal({ items, open, onClose, onConfirm, mintPriceLamports }: MintAllModalProps) {
  const eligible = items.filter((i) => i.state === "eligible");

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent accent="cyan" className="max-w-[calc(100vw-24px)] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>MINT ALL · ELIGIBLE</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {eligible.length} eligible object{eligible.length === 1 ? "" : "s"} will
          be minted in a single batch.
        </DialogDescription>
        <div className="border-2 border-border-neon p-2 bg-bg-2 max-h-[40vh] overflow-y-auto">
          {eligible.length === 0 ? (
            <div className="py-4 font-silk text-center text-muted-neon text-[12px]">
              NOTHING TO MINT
            </div>
          ) : (
            eligible.map((it, i) => {
              const animUrl = isBadgeId(it.badgeId)
                ? badgeAsset(API_BASE_URL, it.badgeId)?.url ?? null
                : null;
              return (
                <div
                  key={it.id}
                  className="flex items-center gap-2.5 px-1.5 py-2"
                  style={{
                    borderBottom:
                      i < eligible.length - 1
                        ? "1px dashed var(--color-border-neon)"
                        : undefined,
                  }}
                >
                  {animUrl ? (
                    <img
                      src={animUrl}
                      alt={it.name}
                      className="block w-8 h-8 object-contain image-render-pixel"
                      draggable={false}
                    />
                  ) : (
                    <GlyphTile glyph={it.glyph} hue={it.hue} size="md" />
                  )}
                  <div className="flex-1">
                    <div className="font-px text-[8px] text-ink">{it.name}</div>
                    <div className="font-silk text-[8px] text-muted-neon mt-0.5">
                      {it.protocol}
                    </div>
                  </div>
                  <Badge variant="tag-cyan">ELIGIBLE</Badge>
                </div>
              );
            })
          )}
        </div>
        <Separator variant="dashed" />
        {/* Cost = mintPriceLamports × eligible.length. Wallet shows the exact
            amount during Phantom approval (1 prompt per badge for now). */}
        <div className="flex items-center">
          <span className="font-silk text-[12px] text-muted-neon">YOUR COST</span>
          <div className="flex-1" />
          <span className="font-px glow-y text-xs">
            {formatMintPriceTotal(mintPriceLamports, eligible.length)}
          </span>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={eligible.length === 0}
          >
            ✨ Mint All ({eligible.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
