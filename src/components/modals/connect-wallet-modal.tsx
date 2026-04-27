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

const WALLET_STYLES: Record<string, { color: string; glyph: string }> = {
  Phantom: { color: "#ab9ff2", glyph: "P" },
  Solflare: { color: "#fc8d3c", glyph: "S" },
};

export function ConnectWalletModal() {
  const { isConnectOpen, closeConnectModal, connect, wallets } = useWallet();

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
          {wallets.map((w) => {
            const style = WALLET_STYLES[w.name] ?? { color: "#6366f1", glyph: w.name[0] ?? "W" };
            return (
            <button
              key={w.name}
              type="button"
              onClick={() => connect(w.name)}
              disabled={!w.ready}
              className="flex items-center gap-3 p-3 bg-panel border-2 border-border-neon cursor-pointer hover:border-cyan-neon transition-colors text-left"
            >
              <div
                className="w-10 h-10 border-2 border-ink grid place-items-center font-display text-base"
                style={{ background: style.color, color: "rgba(0,0,0,0.7)" }}
              >
                {style.glyph}
              </div>
              <div className="flex-1">
                <div className="font-px text-[12px]">{w.name}</div>
                <div className="font-silk text-[8px] text-muted-neon mt-0.5">
                  {w.ready ? "DETECTED" : "NOT DETECTED"}
                </div>
              </div>
              <span className="font-silk glow-c text-sm">→</span>
            </button>
            );
          })}
        </div>
        <Separator variant="dashed" />
        <div className="font-silk text-[8px] text-muted-neon text-center">
          TRIGGERED BY MY LAND / EDIT WITH NO WALLET
        </div>
      </DialogContent>
    </Dialog>
  );
}
