"use client";

import { useEffect, useState } from "react";
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
import { MintProgress } from "@/components/modals/mint-progress";
import type { MintStage } from "@/hooks/use-inventory";

interface MintSingleModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  /** Per-mint price in lamports (0 = sponsored / free). null while loading. */
  mintPriceLamports: number | null;
  /** Current mint stage from the inventory hook; drives the progress UI. */
  mintStage: MintStage;
}

const LAMPORTS_PER_SOL = 1_000_000_000;

function formatMintPrice(lamports: number | null): string {
  if (lamports === null) return "…";
  if (lamports === 0) return "FREE · sponsored mint";
  const sol = lamports / LAMPORTS_PER_SOL;
  const trimmed = sol.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  return `${trimmed} SOL`;
}

export function MintSingleModal({
  item,
  onClose,
  onConfirm,
  mintPriceLamports,
  mintStage,
}: MintSingleModalProps) {
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setLocalError(null);
      setPending(false);
    }
  }, [item?.id]);

  const animUrl =
    item && isBadgeId(item.badgeId)
      ? badgeAsset(API_BASE_URL, item.badgeId)?.url ?? null
      : null;

  const inFlight =
    pending &&
    mintStage !== "idle" &&
    mintStage !== "done" &&
    mintStage !== "error";
  // Don't let the user click out / hit Esc while the wallet round-trip is
  // mid-flight — closing the modal while signing/sending leaves the hook in
  // a partially-set state and is the kind of thing that previously made mints
  // "disappear" until a hard refresh.
  const lockClose = pending && inFlight;

  return (
    <Dialog
      open={!!item}
      onOpenChange={(o) => {
        if (!o && lockClose) return;
        if (!o) onClose();
      }}
    >
      <DialogContent
        accent="magenta"
        className="max-w-[calc(100vw-24px)] sm:max-w-[440px]"
        showCloseButton={!lockClose}
        onPointerDownOutside={(e) => {
          if (lockClose) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (lockClose) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {pending ? "MINT IN PROGRESS" : "MINT NFT"}
          </DialogTitle>
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
            <div className="flex items-center">
              <span className="font-silk text-[12px] text-muted-neon">YOUR COST</span>
              <div className="flex-1" />
              <span className="font-px glow-c text-xs">{formatMintPrice(mintPriceLamports)}</span>
            </div>
            {pending ? <MintProgress stage={mintStage} /> : null}
            {localError ? (
              <p className="font-silk text-[10px] text-red-300 border border-red-500/40 bg-red-500/10 px-2 py-1.5 break-words">
                {localError}
              </p>
            ) : null}
            <DialogFooter>
              <Button variant="ghost" onClick={onClose} disabled={lockClose}>
                {pending && mintStage === "error" ? "Close" : "Cancel"}
              </Button>
              <Button
                variant="primary"
                disabled={pending && mintStage !== "error"}
                onClick={() => {
                  void (async () => {
                    setLocalError(null);
                    setPending(true);
                    try {
                      await onConfirm(item.id);
                      onClose();
                    } catch (err) {
                      setLocalError(err instanceof Error ? err.message : "Mint failed");
                    } finally {
                      setPending(false);
                    }
                  })();
                }}
              >
                {pending && mintStage !== "error"
                  ? labelForStage(mintStage)
                  : pending && mintStage === "error"
                    ? "↻ Retry"
                    : "✓ Confirm Mint"}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function labelForStage(stage: MintStage): string {
  switch (stage) {
    case "preparing":
      return "BUILDING TX…";
    case "signing":
      return "WAITING FOR WALLET…";
    case "sending":
      return "BROADCASTING…";
    case "confirming":
      return "CONFIRMING ON-CHAIN…";
    case "indexing":
      return "INDEXING…";
    case "done":
      return "DONE";
    default:
      return "MINT PENDING…";
  }
}
