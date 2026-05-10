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
import { shortWallet } from "@/lib/utils";
import { timeAgo } from "@/lib/time-ago";

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
    seedAll,
    eligibleCount,
    claimedCount,
    error: mintError,
    busyBadgeId,
    loading,
    lastScanAt,
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
      <div className={`${UI_LAYOUT.pageGrid} grid-cols-1 sm:grid-cols-[300px_1fr] md:grid-cols-[340px_1fr]`}>
        <aside className="flex flex-col gap-3">
          <StatsRail title="Edit" address={shortWallet(address)} recent={false} />
          <Button
            variant="primary"
            size="lg"
            onClick={() => setMintAllOpen(true)}
            disabled={eligibleCount === 0 || busyBadgeId !== null}
          >
            <Sparkles className="size-3" />{" "}
            {busyBadgeId ? `Minting ${busyBadgeId}…` : `Mint All (${eligibleCount} eligible)`}
          </Button>
          <Button variant="ghost" onClick={rescan} disabled={loading}>
            <RefreshCcw className="size-3" />{" "}
            {loading ? "Scanning…" : "Update inventory"}
          </Button>
          <div
            className="font-silk text-[10px] text-muted-neon text-center -mt-1"
            title={lastScanAt ?? "Never scanned"}
          >
            Last scan: {loading ? "running…" : timeAgo(lastScanAt)}
          </div>
          {/*
            Dev-only shortcut: grants every badge as eligible so we can test
            the mint flow without a real Helius scan. Backend only honours it
            when ALLOW_DEV_ROUTES=true; otherwise the call silently 404s.
          */}
          <Button variant="ghost" onClick={seedAll} disabled={loading}>
            ⚙ Seed eligibilities (dev)
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
            <Button variant="cyan" size="sm" className="sm:h-9 sm:px-3.5 sm:text-[12px]" onClick={() => setShareOpen(true)}>
              ↗ Share<span className="hidden sm:inline">&nbsp;the Land</span>
            </Button>
          }
        >
          <div className="relative min-h-[360px] sm:h-[760px] flex items-center justify-center pt-8 sm:pt-0">
            <IsometricIsland
              width={ISLAND_W}
              height={ISLAND_H}
              scale={2}
              objects={placed}
              showGrid
              hoveredIndex={hovered}
              onHoverObject={setHovered}
              onTileClick={placeAt}
              onObjectClick={(o) => removeObject(o.id)}
            />
            {activeItem ? <ActiveCursorCard item={activeItem} /> : null}
            <div className={`${UI_TEXT.labelText} absolute bottom-2 left-2 sm:bottom-4 sm:left-4 text-muted-neon max-w-[calc(100%-1rem)] truncate`}>
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
    <Card
      accent="magenta"
      padding="sm"
      className="absolute top-10 right-2 sm:top-12 sm:right-5 w-44 sm:w-56 max-w-[calc(100%-1rem)]"
    >
      <div className={`${UI_TEXT.labelText} glow-m mb-1`}>ACTIVE CURSOR</div>
      <div className="flex items-center gap-2 min-w-0">
        <GlyphTile glyph={item.glyph} hue={item.hue} size="xs" tone="bold" />
        <span className="font-pixel-body text-sm truncate">{item.name}</span>
      </div>
      <div className={`${UI_TEXT.labelTextSm} text-muted-neon mt-1`}>
        CLICK EMPTY TILE TO PLACE
      </div>
    </Card>
  );
}
