"use client";

import { useCallback, useMemo, useState } from "react";
import type { InventoryItem, LandObject } from "@/lib/types";
import { INITIAL_INVENTORY, PLACED_OBJECTS, tileLabel } from "@/lib/mock-data";

interface UseInventoryResult {
  inventory: InventoryItem[];
  placed: LandObject[];
  activeItemId: string | null;
  setActiveItem: (id: string | null) => void;
  /** Place the active (claimed) inventory item on the given tile. Returns true on success. */
  placeAt: (gx: number, gy: number) => boolean;
  /** Remove a placed object from the board, returning its inventory entry to `claimed`. */
  removeObject: (placedId: string) => void;
  /** Mint a single eligible item → claimed. */
  mintItem: (inventoryId: string) => void;
  /** Mint every eligible item in one batch. */
  mintAll: () => void;
  /** Simulate a wallet rescan — re-flag eligible items as "new" so the UI pulses. */
  rescan: () => void;
  eligibleCount: number;
  claimedCount: number;
}

/** Prefix embedded in placed-object ids so we can map back to the inventory source. */
const PLACED_PREFIX = "placed:";

function placedIdFor(inventoryId: string) {
  return `${PLACED_PREFIX}${inventoryId}:${Date.now()}`;
}

function inventoryIdFromPlaced(placedId: string): string | null {
  if (!placedId.startsWith(PLACED_PREFIX)) return null;
  const withoutPrefix = placedId.slice(PLACED_PREFIX.length);
  const sep = withoutPrefix.lastIndexOf(":");
  return sep === -1 ? withoutPrefix : withoutPrefix.slice(0, sep);
}

export function useInventory(): UseInventoryResult {
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [placed, setPlaced] = useState<LandObject[]>(PLACED_OBJECTS);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const placeAt = useCallback(
    (gx: number, gy: number) => {
      if (!activeItemId) return false;
      const item = inventory.find((i) => i.id === activeItemId);
      if (!item || item.state !== "claimed") return false;
      if (placed.some((o) => o.gx === gx && o.gy === gy)) return false;

      setPlaced((prev) => [
        ...prev,
        {
          id: placedIdFor(item.id),
          gx,
          gy,
          hue: item.hue,
          glyph: item.glyph,
          type: item.type,
          name: item.name,
          protocol: item.protocol,
          tile: tileLabel(gx, gy),
          mintedAt: new Date().toISOString().slice(0, 10),
        },
      ]);
      setInventory((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, state: "placed" } : i)),
      );
      setActiveItemId(null);
      return true;
    },
    [activeItemId, inventory, placed],
  );

  const removeObject = useCallback((placedId: string) => {
    setPlaced((prev) => prev.filter((o) => o.id !== placedId));
    const inventoryId = inventoryIdFromPlaced(placedId);
    if (!inventoryId) return;
    setInventory((prev) =>
      prev.map((i) => (i.id === inventoryId ? { ...i, state: "claimed" } : i)),
    );
  }, []);

  const mintItem = useCallback((inventoryId: string) => {
    setInventory((prev) =>
      prev.map((i) =>
        i.id === inventoryId && i.state === "eligible"
          ? { ...i, state: "claimed", isNew: false }
          : i,
      ),
    );
  }, []);

  const mintAll = useCallback(() => {
    setInventory((prev) =>
      prev.map((i) =>
        i.state === "eligible" ? { ...i, state: "claimed", isNew: false } : i,
      ),
    );
  }, []);

  const rescan = useCallback(() => {
    setInventory((prev) =>
      prev.map((i) => ({ ...i, isNew: i.state === "eligible" })),
    );
  }, []);

  const eligibleCount = useMemo(
    () => inventory.filter((i) => i.state === "eligible").length,
    [inventory],
  );
  const claimedCount = useMemo(
    () => inventory.filter((i) => i.state === "claimed").length,
    [inventory],
  );

  return {
    inventory,
    placed,
    activeItemId,
    setActiveItem: setActiveItemId,
    placeAt,
    removeObject,
    mintItem,
    mintAll,
    rescan,
    eligibleCount,
    claimedCount,
  };
}
