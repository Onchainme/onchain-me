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
import { Button } from "@/components/ui/button";

export function ConnectWalletModal() {
  const { isConnectOpen, closeConnectModal, connect, isConnecting, authError } = useWallet();

  return (
    <Dialog
      open={isConnectOpen}
      onOpenChange={(o) => (!o ? closeConnectModal() : undefined)}
    >
      <DialogContent accent="violet" className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>CONNECT WALLET</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Required for My Land & Edit. We use your signature to authenticate.
        </DialogDescription>
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between p-3 h-auto"
            onClick={() => void connect()}
            disabled={isConnecting}
          >
            <span className="font-px text-[12px]">Phantom</span>
            <span className="font-silk glow-c text-sm">
              {isConnecting ? "CONNECTING..." : "→"}
            </span>
          </Button>
          {authError ? (
            <p className="font-silk text-[10px] text-red-300 border border-red-500/40 bg-red-500/10 px-2 py-1.5">
              {authError}
            </p>
          ) : null}
        </div>
        <Separator variant="dashed" />
        <div className="font-silk text-[8px] text-muted-neon text-center">
          SIGNATURE IS USED ONLY FOR LOGIN VERIFICATION
        </div>
      </DialogContent>
    </Dialog>
  );
}
