"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { RefreshCcw, Sparkles } from "lucide-react";
import { PageShell } from "@/components/dashboard/page-shell";
import { StatsRail } from "@/components/dashboard/stats-rail";
import { AppTwoColumnLayout } from "@/components/dashboard/app-two-column-layout";
import { IslandViewport } from "@/components/dashboard/island-viewport";
import { MapFrame } from "@/components/dashboard/map-frame";
import { ShareLandButton } from "@/components/dashboard/share-land-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlyphTile } from "@/components/ui/glyph-tile";
import { Inventory } from "@/components/edit/inventory";
import { useWallet } from "@/hooks/wallet";
import { useInventory } from "@/hooks/use-inventory";
import { MY_SHORT } from "@/lib/mock-data";
import { MINT_COST_LABEL, UI_TEXT } from "@/lib/ui-styles";
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

export default function EditPage() {
  const { isConnected, isSessionReady, wallet, openConnectModal } = useWallet();
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
    mintStage,
    mintBatchProgress,
    loading,
    lastScanAt,
    mintConfig,
  } = useInventory();

  const [hovered, setHovered] = useState<number | null>(null);
  const [mintSingle, setMintSingle] = useState<InventoryItem | null>(null);
  const [mintAllOpen, setMintAllOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!isSessionReady) return;
    if (!isConnected) {
      openConnectModal();
      router.replace("/home");
    }
  }, [isConnected, isSessionReady, openConnectModal, router]);

  if (!isSessionReady || !isConnected) return null;

  const activeItem = inventory.find((i) => i.id === activeItemId) ?? null;
  const address = wallet?.address ?? MY_SHORT;

  return (
    <PageShell>
      <AppTwoColumnLayout
        sidebar={
          <>
            <StatsRail title="Edit" address={shortWallet(address)} recent={false} />
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => setMintAllOpen(true)}
              disabled={eligibleCount === 0 || busyBadgeId !== null}
            >
              <Sparkles className="size-3" />{" "}
              {busyBadgeId ? `Minting ${busyBadgeId}…` : `Mint All (${eligibleCount} eligible)`}
            </Button>
            <Button variant="ghost" className="w-full" onClick={rescan} disabled={loading}>
              <RefreshCcw className="size-3" />{" "}
              {loading ? "Scanning…" : "Update inventory"}
            </Button>
            <p
              className="font-silk text-[10px] text-muted-neon text-center"
              title={lastScanAt ?? "Never scanned"}
            >
              Last scan: {loading ? "running…" : timeAgo(lastScanAt)}
            </p>
            <p className="font-silk text-[10px] text-muted-neon text-center glow-y">
              {MINT_COST_LABEL}
            </p>
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
          </>
        }
      >
        <MapFrame
          label="EDIT · TILE GRID"
          hint={
            activeItem
              ? "CLICK A TILE TO PLACE · CLICK OBJECT TO REMOVE"
              : "SELECT CLAIMED FROM INVENTORY"
          }
          action={<ShareLandButton onClick={() => setShareOpen(true)} />}
        >
          <IslandViewport
            objects={placed}
            showGrid
            hoveredIndex={hovered}
            onHoverObject={setHovered}
            onTileClick={placeAt}
            onObjectClick={(o) => removeObject(o.id)}
          >
            {activeItem ? <ActiveCursorCard item={activeItem} /> : null}
          </IslandViewport>
        </MapFrame>
      </AppTwoColumnLayout>

      <MintSingleModal
        item={mintSingle}
        onClose={() => setMintSingle(null)}
        onConfirm={mintItem}
        mintPriceLamports={mintConfig?.mintPriceLamports ?? null}
        mintStage={mintStage}
      />
      <MintAllModal
        items={inventory}
        open={mintAllOpen}
        onClose={() => setMintAllOpen(false)}
        onConfirm={mintAll}
        mintPriceLamports={mintConfig?.mintPriceLamports ?? null}
        mintStage={mintStage}
        mintBatchProgress={mintBatchProgress}
      />
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        ownerAddress={address}
      />
    </PageShell>
  );
}

function ActiveCursorCard({ item }: { item: InventoryItem }) {
  return (
    <Card
      accent="magenta"
      padding="sm"
      className="absolute top-10 right-2 sm:top-12 sm:right-5 z-20 w-44 sm:w-56 max-w-[calc(100%-1rem)]"
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
