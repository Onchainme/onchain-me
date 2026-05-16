"use client";

import dynamic from "next/dynamic";
import { memo, useEffect, useMemo, useState } from "react";
import { MiniIsland } from "@/components/canvas/MiniIsland";
import { useInView } from "@/hooks/use-in-view";
import {
  acquirePixiPreviewSlot,
  cardSizeWantsPixi,
  detectPreviewEngine,
  releasePixiPreviewSlot,
  type LandCardPreviewEngine,
} from "@/lib/island-preview";
import type { LandObject } from "@/lib/types";

const CardPixiIsland = dynamic(
  () =>
    import("@/components/canvas/IsometricIsland").then((m) => m.IsometricIsland),
  {
    ssr: false,
    loading: () => <PreviewPlaceholder />,
  },
);

interface LandCardPreviewProps {
  seed: number;
  objects?: LandObject[];
  width: number;
  height: number;
  size: "sm" | "md" | "lg" | "xl";
  ogImageUrl?: string | null;
  maxFPS?: number;
  maxResolution?: number;
}

function PreviewPlaceholder() {
  return (
    <div
      className="absolute inset-0 bg-[linear-gradient(180deg,#1a1438_0%,#5a3470_45%,#b87aa0_100%)]"
      aria-hidden
    />
  );
}


function LandCardPreviewInner({
  seed,
  objects,
  width,
  height,
  size,
  ogImageUrl,
  maxFPS,
  maxResolution,
}: LandCardPreviewProps) {
  const { ref, inView } = useInView({ rootMargin: "160px", threshold: 0.02 });
  const hasPlacements = (objects?.length ?? 0) > 0;
  const ogImage = ogImageUrl?.trim() || null;

  const [engine, setEngine] = useState<LandCardPreviewEngine>("svg");
  const [usePixi, setUsePixi] = useState(false);

  useEffect(() => {
    setEngine(detectPreviewEngine());
  }, []);

  useEffect(() => {
    const wantPixi =
      inView &&
      engine === "pixi" &&
      cardSizeWantsPixi(size) &&
      hasPlacements;

    if (!wantPixi) {
      setUsePixi(false);
      return;
    }
    if (!acquirePixiPreviewSlot()) {
      setUsePixi(false);
      return;
    }
    setUsePixi(true);
    return () => {
      releasePixiPreviewSlot();
      setUsePixi(false);
    };
  }, [inView, engine, size, hasPlacements]);

  const svgPreview = useMemo(
    () => (
      <MiniIsland
        width={width}
        height={height}
        seed={seed}
        objects={hasPlacements ? objects : undefined}
        count={0}
        lite
        fill
        className="absolute inset-0 pointer-events-none"
      />
    ),
    [width, height, seed, hasPlacements, objects],
  );

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      {!inView ? (
        <PreviewPlaceholder />
      ) : usePixi && objects ? (
        <CardPixiIsland
          fill
          width={width}
          height={height}
          scale={size === "xl" ? 1.35 : 1.15}
          objects={objects}
          preview
          maxFPS={maxFPS}
          maxResolution={maxResolution}
          className="absolute inset-0 pointer-events-none"
        />
      ) : hasPlacements ? (
        svgPreview
      ) : ogImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- external OG URLs from API
        <img
          src={ogImage}
          alt=""
          className="absolute inset-0 size-full object-cover pointer-events-none image-render-pixel"
        />
      ) : (
        svgPreview
      )}
    </div>
  );
}

export const LandCardPreview = memo(LandCardPreviewInner);
