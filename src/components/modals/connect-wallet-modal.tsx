"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useWallet } from "@/hooks/wallet";

const WALLETS = [
  { name: "Phantom", color: "#ab9ff2", glyph: "P" },
  { name: "Backpack", color: "#e33e3f", glyph: "B" },
  { name: "Solflare", color: "#fc8d3c", glyph: "S" },
] as const;

export function ConnectWalletModal() {
  const { isConnectOpen, closeConnectModal, connect } = useWallet();

  return (
    <Dialog
      open={isConnectOpen}
      onOpenChange={(o) => (!o ? closeConnectModal() : undefined)}
    >
      <DialogContent accent="violet" className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>CONNECT WALLET</DialogTitle>
        </DialogHeader>
        <DialogDescription>Required for My Land & Edit.</DialogDescription>
        <div className="flex flex-col gap-2">
          {WALLETS.map((w) => (
            <button
              key={w.name}
              type="button"
              onClick={() => connect(w.name)}
              className="flex items-center gap-3 p-3 bg-panel border-2 border-border-neon cursor-pointer hover:border-cyan-neon transition-colors text-left"
            >
              <div
                className="w-10 h-10 border-2 border-ink grid place-items-center font-display text-base"
                style={{ background: w.color, color: "rgba(0,0,0,0.7)" }}
              >
                {w.glyph}
              </div>
              <div className="flex-1">
                <div className="font-px text-[12px]">{w.name}</div>
                <div className="font-silk text-[8px] text-muted-neon mt-0.5">
                  DETECTED
                </div>
              </div>
              <span className="font-silk glow-c text-sm">→</span>
            </button>
          ))}
        </div>
        <Separator variant="dashed" />
        <div className="font-silk text-[8px] text-muted-neon text-center">
          TRIGGERED BY MY LAND / EDIT WITH NO WALLET
        </div>
      </DialogContent>
    </Dialog>
  );
}
