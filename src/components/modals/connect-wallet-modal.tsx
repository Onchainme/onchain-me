"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useWallet, type WalletProviderName } from "@/hooks/wallet";
import { Button } from "@/components/ui/button";

type WalletOption = {
  id: WalletProviderName;
  label: string;
  iconSrc: string;
};

const WALLET_OPTIONS: WalletOption[] = [
  { id: "phantom", label: "Phantom", iconSrc: "/wallets/phantom.jpg" },
  { id: "backpack", label: "Backpack", iconSrc: "/wallets/backpack.jpg" },
  { id: "solflare", label: "Solflare", iconSrc: "/wallets/solflare.jpg" },
];

function WalletOptionIcon({ wallet }: { wallet: WalletOption }) {
  const [isBroken, setIsBroken] = useState(false);

  if (isBroken) {
    return (
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border/70 bg-muted/40 font-px text-[10px]">
        {wallet.label.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={wallet.iconSrc}
      alt={`${wallet.label} icon`}
      className="h-10 w-10 bg-muted/20 object-contain p-1"
      loading="lazy"
      onError={() => setIsBroken(true)}
    />
  );
}

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
          {WALLET_OPTIONS.map((wallet) => (
            <Button
              key={wallet.id}
              type="button"
              variant="outline"
              className="h-auto w-full justify-between p-3"
              onClick={() => void connect(wallet.id)}
              disabled={isConnecting}
            >
              <span className="flex items-center gap-2">
                <WalletOptionIcon wallet={wallet} />
                <span className="font-px text-[12px]">{wallet.label}</span>
              </span>
              <span className="font-silk glow-c text-sm">
                {isConnecting ? "CONNECTING..." : "->"}
              </span>
            </Button>
          ))}
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
