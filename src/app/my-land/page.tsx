"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/dashboard/page-shell";
import { StatsRail } from "@/components/dashboard/stats-rail";
import { MapFrame } from "@/components/dashboard/map-frame";
import { ObjectTooltip } from "@/components/dashboard/object-tooltip";
import { Button } from "@/components/ui/button";
import { IsometricIsland } from "@/components/canvas/IsometricIsland";
import { useWallet } from "@/hooks/wallet";
import { useInventory } from "@/hooks/use-inventory";
import { MY_SHORT } from "@/lib/mock-data";
import { UI_LAYOUT, UI_TEXT } from "@/lib/ui-styles";

const ShareModal = dynamic(
  () => import("@/components/modals/share-modal").then((m) => m.ShareModal),
  { ssr: false },
);

const ISLAND_W = 940;
const ISLAND_H = 720;

export default function MyLandPage() {
  const { isConnected, wallet, openConnectModal } = useWallet();
  const router = useRouter();
  const { placed } = useInventory();
  const [hovered, setHovered] = useState<number | null>(0);
  const [shareOpen, setShareOpen] = useState(false);

  // Guard: this page requires a wallet.
  useEffect(() => {
    if (!isConnected) {
      openConnectModal();
      router.replace("/");
    }
  }, [isConnected, openConnectModal, router]);

  if (!isConnected) return null;

  const hoveredObj = hovered != null ? placed[hovered] : null;
  const address = wallet?.shortAddress ?? MY_SHORT;

  return (
    <PageShell>
      <div className={`${UI_LAYOUT.pageGrid} grid-cols-1 lg:grid-cols-[280px_1fr]`}>
        <StatsRail address={address} />
        <MapFrame
          label="YOUR ISLAND"
          action={
            <Button variant="cyan" onClick={() => setShareOpen(true)}>
              ↗ Share the Land
            </Button>
          }
        >
          <div className="relative h-[800px] flex items-center justify-center">
            <IsometricIsland
              width={ISLAND_W}
              height={ISLAND_H}
              objects={placed}
              hoveredIndex={hovered}
              onHoverObject={setHovered}
            />
            {hoveredObj ? (
              <ObjectTooltip obj={hoveredObj} style={{ left: "54%", top: "10%" }} />
            ) : null}
            <div className={`${UI_TEXT.labelText} absolute bottom-4 left-4 text-muted-neon`}>
              HOVER A BUILDING FOR DETAILS
            </div>
          </div>
        </MapFrame>
      </div>
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        ownerAddress={address}
        refAddress={address}
      />
    </PageShell>
  );
}
