"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw, Sparkles } from "lucide-react";
import { PageShell } from "@/components/dashboard/page-shell";
import { StatsRail } from "@/components/dashboard/stats-rail";
import { MapFrame } from "@/components/dashboard/map-frame";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlyphTile } from "@/components/ui/glyph-tile";
import { IsometricIsland } from "@/components/canvas/IsometricIsland";
import { Inventory } from "@/components/edit/inventory";
import { MintSingleModal } from "@/components/modals/mint-single-modal";
import { MintAllModal } from "@/components/modals/mint-all-modal";
import { ShareModal } from "@/components/modals/share-modal";
import { useWallet } from "@/hooks/wallet";
import { useInventory } from "@/hooks/use-inventory";
import { MY_SHORT } from "@/lib/mock-data";
import type { InventoryItem } from "@/lib/types";

const ISLAND_W = 900;
const ISLAND_H = 680;

export default function EditPage() {
  const { isConnected, wallet, openConnectModal } = useWallet();
  const router = useRouter();
  const {
    inventory,
    placed,
    activeItemId,
    setActiveItem,
    placeAt,
    removeObject,
    mintItem,
    mintAll,
    rescan,
    eligibleCount,
    claimedCount,
  } = useInventory();

  const [hovered, setHovered] = useState<number | null>(null);
  const [mintSingle, setMintSingle] = useState<InventoryItem | null>(null);
  const [mintAllOpen, setMintAllOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Guard: this page requires a wallet. Redirect home and open connect modal.
  useEffect(() => {
    if (!isConnected) {
      openConnectModal();
      router.replace("/");
    }
  }, [isConnected, openConnectModal, router]);

  if (!isConnected) return null;

  const activeItem = inventory.find((i) => i.id === activeItemId) ?? null;
  const address = wallet?.shortAddress ?? MY_SHORT;

  return (
    <PageShell>
      <div className="max-w-[1400px] mx-auto grid gap-6 p-6 grid-cols-1 lg:grid-cols-[340px_1fr]">
        <aside className="flex flex-col gap-3">
          <StatsRail title="Edit" address={address} recent={false} />
          <Button
            variant="primary"
            size="lg"
            onClick={() => setMintAllOpen(true)}
            disabled={eligibleCount === 0}
          >
            <Sparkles className="size-3" /> Mint All ({eligibleCount} eligible)
          </Button>
          <Button variant="ghost" onClick={rescan}>
            <RefreshCcw className="size-3" /> Update inventory
          </Button>
          <Inventory
            items={inventory}
            activeItemId={activeItemId}
            onSelectPlaced={(id) =>
              setActiveItem(activeItemId === id ? null : id)
            }
            onMintEligible={(it) => setMintSingle(it)}
            claimedCount={claimedCount}
            eligibleCount={eligibleCount}
          />
        </aside>

        <MapFrame
          label="EDIT · TILE GRID"
          action={
            <Button variant="cyan" onClick={() => setShareOpen(true)}>
              ↗ Share the Land
            </Button>
          }
        >
          <div className="relative h-[760px] flex items-center justify-center">
            <IsometricIsland
              width={ISLAND_W}
              height={ISLAND_H}
              objects={placed}
              showGrid
              hoveredIndex={hovered}
              onHoverObject={setHovered}
              onTileClick={placeAt}
              onObjectClick={(o) => removeObject(o.id)}
            />
            {activeItem ? <ActiveCursorCard item={activeItem} /> : null}
            <div className="absolute bottom-4 left-4 font-silk text-[10px] text-muted-neon">
              {activeItem
                ? "CLICK A TILE TO PLACE · CLICK OBJECT TO REMOVE"
                : "SELECT CLAIMED FROM INVENTORY"}
            </div>
          </div>
        </MapFrame>
      </div>

      <MintSingleModal
        item={mintSingle}
        onClose={() => setMintSingle(null)}
        onConfirm={mintItem}
      />
      <MintAllModal
        items={inventory}
        open={mintAllOpen}
        onClose={() => setMintAllOpen(false)}
        onConfirm={mintAll}
      />
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        ownerAddress={address}
        refAddress={address}
      />
    </PageShell>
  );
}

function ActiveCursorCard({ item }: { item: InventoryItem }) {
  return (
    <Card accent="magenta" padding="sm" className="absolute top-12 right-5 w-56">
      <div className="font-silk glow-m text-[10px] mb-1">ACTIVE CURSOR</div>
      <div className="flex items-center gap-2">
        <GlyphTile glyph={item.glyph} hue={item.hue} size="xs" tone="bold" />
        <span className="font-pixel-body text-sm">{item.name}</span>
      </div>
      <div className="font-silk text-[9px] text-muted-neon mt-1">
        CLICK EMPTY TILE TO PLACE
      </div>
    </Card>
  );
}
