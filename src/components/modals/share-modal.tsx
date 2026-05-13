"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  ownerAddress: string;
  refAddress?: string | null;
}

export function ShareModal({
  open,
  onClose,
  ownerAddress,
  refAddress,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  // Use the live origin so the share link works on localhost, app.onchainme.to,
  // or any future custom domain. SSR fallback is the canonical apex.
  const [origin, setOrigin] = useState<string>("https://onchainme.to");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);
  const link = useMemo(
    () =>
      `${origin}/land/${ownerAddress}${refAddress ? `?ref=${refAddress}` : ""}`,
    [origin, ownerAddress, refAddress],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const tweet = () => {
    const text = encodeURIComponent(
      `Check out my pixel island on Onchain.me — ${link}`,
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent accent="cyan" className="max-w-[calc(100vw-24px)] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>SHARE THE LAND</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Every new wallet that connects via your link earns you ref credit.
        </DialogDescription>
        <div className="flex flex-col xs:flex-row items-stretch gap-1.5">
          <Input
            readOnly
            value={link}
            className="font-pixel-body text-[14px] sm:text-[16px] text-cyan-neon min-w-0"
          />
          <Button variant="cyan" onClick={copy}>
            {copied ? "COPIED" : "COPY"}
          </Button>
        </div>
        <Button
          variant="pixel"
          className="w-full bg-black border-white"
          onClick={tweet}
        >
          𝕏 SHARE ON X
        </Button>
        <Separator variant="dashed" />
        <Card accent="violet" padding="sm">
          <div className="font-silk glow-v text-[12px] mb-1">REFERRAL LOGIC</div>
          <div className="font-pixel-body text-base text-ink-2 leading-snug">
            <span className="text-green-neon">●</span> Visitor connected → ref =
            visitor wallet
            <br />
            <span className="text-yellow-neon">●</span> Not connected → ref = land
            owner
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
