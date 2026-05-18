"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { IslandSceneProps } from "@/components/canvas/island-scene";
import {
  ISLAND_CANVAS,
  ISLAND_VIEWPORT,
  UI_TEXT,
} from "@/lib/ui-styles";

const IslandCanvas = dynamic(
  () =>
    import("@/components/canvas/IsometricIsland").then((m) => m.IsometricIsland),
  {
    ssr: false,
    loading: () => (
      <div
        className={cn(
          "grid place-items-center w-full text-muted-neon font-silk text-xs",
          ISLAND_VIEWPORT.minHeight,
        )}
      >
        LOADING ISLAND…
      </div>
    ),
  },
);

type IslandViewportProps = Pick<
  IslandSceneProps,
  | "objects"
  | "scale"
  | "showGrid"
  | "preview"
  | "hoveredIndex"
  | "onHoverObject"
  | "onTileClick"
  | "onObjectClick"
> & {
  loading?: boolean;
  children?: ReactNode;
  className?: string;
};

/**
 * Canonical island canvas host for edit, my-land, and public land pages.
 * Keeps resolution, viewport height, and helper placement consistent.
 */
export function IslandViewport({
  objects,
  scale = ISLAND_CANVAS.scale,
  showGrid,
  preview,
  hoveredIndex,
  onHoverObject,
  onTileClick,
  onObjectClick,
  loading = false,
  children,
  className,
}: IslandViewportProps) {
  return (
    <div
      className={cn(ISLAND_VIEWPORT.container, ISLAND_VIEWPORT.minHeight, className)}
    >
      <IslandCanvas
        width={ISLAND_CANVAS.width}
        height={ISLAND_CANVAS.height}
        scale={scale}
        objects={objects}
        showGrid={showGrid}
        preview={preview}
        hoveredIndex={hoveredIndex}
        onHoverObject={onHoverObject}
        onTileClick={onTileClick}
        onObjectClick={onObjectClick}
      />
      {loading ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-[rgba(10,6,18,0.35)]">
          <div className={`${UI_TEXT.labelText} glow-c`}>LOADING…</div>
        </div>
      ) : null}
      {children}
    </div>
  );
}
