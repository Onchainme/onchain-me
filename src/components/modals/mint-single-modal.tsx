"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GlyphTile } from "@/components/ui/glyph-tile";
import type { InventoryItem } from "@/lib/types";

interface MintSingleModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export function MintSingleModal({ item, onClose, onConfirm }: MintSingleModalProps) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent accent="magenta" className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>MINT NFT</DialogTitle>
        </DialogHeader>
        {item ? (
          <>
            <div className="flex items-start gap-3.5">
              <GlyphTile glyph={item.glyph} hue={item.hue} size="xl" tone="bold" glow />
              <div className="flex-1">
                <div className="font-px glow-m text-xs mb-1">{item.name}</div>
                <div className="font-silk text-[10px] text-muted-neon">
                  PROTOCOL · {item.protocol.toUpperCase()}
                </div>
                <div className="font-pixel-body text-[15px] text-ink-2 mt-2">
                  Unlocked based on your onchain activity.
                </div>
              </div>
            </div>
            <Separator variant="dashed" />
            <div className="flex items-center">
              <span className="font-silk text-[11px] text-muted-neon">EST. GAS</span>
              <div className="flex-1" />
              <span className="font-px glow-c text-xs">≈ 0.00042 SOL</span>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onConfirm(item.id);
                  onClose();
                }}
              >
                ✓ Confirm Mint
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
