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
import { API_BASE_URL } from "@/lib/api";
import { badgeAsset, isBadgeId } from "@/lib/badge-catalog";

interface MintSingleModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export function MintSingleModal({ item, onClose, onConfirm }: MintSingleModalProps) {
  // Prefer the image served by the api when we have a known badge id (animated
  // WebP or static PNG — browser handles either inside <img>). Fall back to the
  // legacy GlyphTile for ad-hoc inventory items without a catalog entry.
  const animUrl =
    item && isBadgeId(item.badgeId)
      ? badgeAsset(API_BASE_URL, item.badgeId)?.url ?? null
      : null;

  return (
    <Dialog open={!!item} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent accent="magenta" className="max-w-[calc(100vw-24px)] sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>MINT NFT</DialogTitle>
        </DialogHeader>
        {item ? (
          <>
            <div className="flex items-start gap-3.5">
              {animUrl ? (
                <img
                  src={animUrl}
                  alt={item.name}
                  className="block w-[96px] h-[96px] object-contain border-2 border-border-neon bg-bg-2 image-render-pixel"
                  draggable={false}
                />
              ) : (
                <GlyphTile glyph={item.glyph} hue={item.hue} size="xl" tone="bold" glow />
              )}
              <div className="flex-1">
                <div className="font-px glow-m text-xs mb-1">{item.name}</div>
                <div className="font-silk text-[12px] text-muted-neon">
                  PROTOCOL · {item.protocol.toUpperCase()}
                </div>
                <div className="font-pixel-body text-[16px] text-ink-2 mt-2">
                  Unlocked based on your onchain activity.
                </div>
              </div>
            </div>
            <Separator variant="dashed" />
            {/* Cost is paid by the mint authority — recipient pays nothing.
                See packages/shared/src/mint/prepare.ts (umi.identity signs/pays). */}
            <div className="flex items-center">
              <span className="font-silk text-[12px] text-muted-neon">YOUR COST</span>
              <div className="flex-1" />
              <span className="font-px glow-c text-xs">FREE · sponsored mint</span>
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
