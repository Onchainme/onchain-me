"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { IslandSceneProps } from "./island-scene";

const IslandScene = dynamic(
  () => import("./island-scene").then((m) => m.IslandScene),
  {
    ssr: false,
    loading: () => <div className="grid place-items-center h-full text-muted-neon font-silk text-xs">LOADING ISLAND…</div>,
  },
);

export type { IslandSceneProps };

export interface IsometricIslandProps extends IslandSceneProps {
  /** Stretch the canvas to fill its parent (both dimensions) instead of
   *  preserving the props.width/height aspect ratio. Parent must be sized
   *  (e.g. `position: relative` with explicit/flex height). */
  fill?: boolean;
  className?: string;
}

export function IsometricIsland(props: IsometricIslandProps) {
  const { fill, className, ...sceneProps } = props;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const compute = (containerW: number, containerH: number) => {
      let w: number;
      let h: number;
      if (fill) {
        w = Math.max(1, Math.floor(containerW));
        h = Math.max(1, Math.floor(containerH));
      } else {
        const ratio = props.height / props.width;
        w = Math.min(props.width, Math.floor(containerW));
        h = Math.floor(w * ratio);
      }
      setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    };
    compute(el.clientWidth, el.clientHeight);
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      compute(rect?.width ?? el.clientWidth, rect?.height ?? el.clientHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [props.width, props.height, fill]);

  const w = size?.w ?? props.width;
  const h = size?.h ?? props.height;

  // fill mode uses autoFit (contain-fit inside the card), so the width-bucket
  // shrink — which forced ~0.4 for every card on mobile — must not apply; the
  // scene computes the fit scale itself. Non-fill keeps the legacy shrink.
  const baseScale = props.scale ?? 1;
  const shrink = fill ? 1 : w < 360 ? 0.4 : w < 480 ? 0.4 : w < 640 ? 0.8 : 1;
  const scale = baseScale * shrink;

  if (fill) {
    return (
      <div
        ref={wrapRef}
        className={className ?? "w-full h-full"}
        style={{ imageRendering: "pixelated" }}
      >
        {size ? (
          <IslandScene
            {...sceneProps}
            width={w}
            height={h}
            scale={scale}
            autoFit={sceneProps.autoFit ?? true}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={className ?? "w-full min-w-0 max-w-full flex justify-center overflow-hidden"}
    >
      <div
        style={{
          width: w,
          height: h,
          maxWidth: "100%",
          imageRendering: "pixelated",
        }}
      >
        {size ? (
          <IslandScene {...sceneProps} width={w} height={h} scale={scale} />
        ) : null}
      </div>
    </div>
  );
}
