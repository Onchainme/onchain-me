"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
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
import { useWallet } from "@/hooks/wallet";
import { useInventory } from "@/hooks/use-inventory";
import { MY_SHORT } from "@/lib/mock-data";
import { UI_LAYOUT, UI_TEXT } from "@/lib/ui-styles";
import type { InventoryItem } from "@/lib/types";

const MintSingleModal = dynamic(
  () =>
    import("@/components/modals/mint-single-modal").then((m) => m.MintSingleModal),
  { ssr: false },
);
const MintAllModal = dynamic(
  () => import("@/components/modals/mint-all-modal").then((m) => m.MintAllModal),
  { ssr: false },
);
const ShareModal = dynamic(
  () => import("@/components/modals/share-modal").then((m) => m.ShareModal),
  { ssr: false },
);

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
    error: mintError,
    busyBadgeId,
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
  const address = wallet?.address ?? MY_SHORT;

  return (
    <PageShell>
      <div className={`${UI_LAYOUT.pageGrid} grid-cols-1 lg:grid-cols-[340px_1fr]`}>
        <aside className="flex flex-col gap-3">
          <StatsRail title="Edit" address={address} recent={false} />
          <Button
            variant="primary"
            size="lg"
            onClick={() => setMintAllOpen(true)}
            disabled={eligibleCount === 0 || busyBadgeId !== null}
          >
            <Sparkles className="size-3" />{" "}
            {busyBadgeId ? `Minting ${busyBadgeId}…` : `Mint All (${eligibleCount} eligible)`}
          </Button>
          <Button variant="ghost" onClick={rescan}>
            <RefreshCcw className="size-3" /> Update inventory
          </Button>
          {mintError ? (
            <div className="border border-red-500 bg-red-950/40 p-2 text-[11px] font-mono text-red-200 break-all">
              ⚠ {mintError}
            </div>
          ) : null}
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
            <div className={`${UI_TEXT.labelText} absolute bottom-4 left-4 text-muted-neon`}>
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
      <div className={`${UI_TEXT.labelText} glow-m mb-1`}>ACTIVE CURSOR</div>
      <div className="flex items-center gap-2">
        <GlyphTile glyph={item.glyph} hue={item.hue} size="xs" tone="bold" />
        <span className="font-pixel-body text-sm">{item.name}</span>
      </div>
      <div className={`${UI_TEXT.labelTextSm} text-muted-neon mt-1`}>
        CLICK EMPTY TILE TO PLACE
      </div>
    </Card>
  );
}
