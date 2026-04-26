"use client";

import dynamic from "next/dynamic";
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
  return (
    <div
      style={{
        width: props.width,
        height: props.height,
        imageRendering: "pixelated",
      }}
    >
      <IslandScene {...props} />
    </div>
  );
}
