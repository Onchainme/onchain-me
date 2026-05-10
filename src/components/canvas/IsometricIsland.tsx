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

export function IsometricIsland(props: IslandSceneProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const compute = (containerW: number) => {
      const ratio = props.height / props.width;
      const w = Math.min(props.width, Math.floor(containerW));
      const h = Math.floor(w * ratio);
      setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    };
    compute(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0]?.contentRect.width ?? el.clientWidth;
      compute(cw);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [props.width, props.height]);

  const w = size?.w ?? props.width;
  const h = size?.h ?? props.height;

  // Visually shrink the island when the canvas is narrow so it doesn't fill
  // the whole container — gives breathing room on mobile.
  const baseScale = props.scale ?? 1;
  const shrink = w < 360 ? 0.4 : w < 480 ? 0.4 : w < 640 ? 0.8 : 1;
  const scale = baseScale * shrink;

  return (
    <div ref={wrapRef} className="w-full min-w-0 max-w-full flex justify-center overflow-hidden">
      <div
        style={{
          width: w,
          height: h,
          maxWidth: "100%",
          imageRendering: "pixelated",
        }}
      >
        {size ? <IslandScene {...props} width={w} height={h} scale={scale} /> : null}
      </div>
    </div>
  );
}
