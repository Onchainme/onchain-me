"use client";

import { Application, extend, useTick } from "@pixi/react";
import { Container, Graphics } from "pixi.js";
import { useCallback, useMemo, useRef, useState } from "react";
import type { FederatedPointerEvent } from "pixi.js";
import type { LandObject } from "@/lib/types";
import {
  BLOCK_H,
  SIDE_LAYERS,
  TILE_H,
  TILE_W,
  createProjection,
  hueToRgb,
  pickLeft,
  pickRight,
  pickTop,
  shadeHue,
} from "./geometry";
import { getBuildingShape, type Pixel } from "./building-shapes";

extend({ Container, Graphics });

export interface IslandSceneProps {
  width: number;
  height: number;
  /** Number of tiles per side. Defaults to 10×10. */
  gridSize?: number;
  objects: LandObject[];
  /** When true, draws tile outlines and enables tile hover/click feedback. */
  showGrid?: boolean;
  hoveredIndex?: number | null;
  onHoverObject?: (i: number | null) => void;
  onTileClick?: (gx: number, gy: number) => void;
  onObjectClick?: (obj: LandObject) => void;
}

export function IslandScene(props: IslandSceneProps) {
  return (
    <Application
      width={props.width}
      height={props.height}
      background="#0a0612"
      antialias={false}
      resolution={
        typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1
      }
      autoDensity
    >
      <IslandContent {...props} />
    </Application>
  );
}

function IslandContent({
  width,
  height,
  gridSize = 10,
  objects,
  showGrid = false,
  hoveredIndex = null,
  onHoverObject,
  onTileClick,
  onObjectClick,
}: IslandSceneProps) {
  const cx = width / 2;
  const cy = height / 2 - (gridSize * TILE_H) / 4 - 30;
  const project = useMemo(() => createProjection(cx, cy), [cx, cy]);
  const occupied = useMemo(
    () => new Set(objects.map((o) => `${o.gx},${o.gy}`)),
    [objects],
  );

  // Gentle vertical bob so the island feels floating.
  const [bobOffset, setBobOffset] = useState(0);
  const timeRef = useRef(0);
  useTick((ticker) => {
    timeRef.current += ticker.deltaMS;
    setBobOffset(Math.sin(timeRef.current / 900) * 3);
  });

  return (
    <pixiContainer>
      <Sky width={width} height={height} />
      <pixiContainer y={bobOffset}>
        <SideBlocks gridSize={gridSize} project={project} />
        <Hamsters gridSize={gridSize} project={project} />
        <TileGrid
          gridSize={gridSize}
          project={project}
          showGrid={showGrid}
          occupied={occupied}
          onTileClick={onTileClick}
        />
        <Objects
          objects={objects}
          project={project}
          hoveredIndex={hoveredIndex}
          onHoverObject={onHoverObject}
          onObjectClick={onObjectClick}
        />
      </pixiContainer>
    </pixiContainer>
  );
}

/* ─────────────────────────────── Sky ─────────────────────────────── */

function Sky({ width, height }: { width: number; height: number }) {
  const stars = useMemo(() => {
    const out: Array<{ x: number; y: number; s: number; o: number }> = [];
    let seed = 1;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 40; i++) {
      out.push({
        x: Math.floor(rnd() * width),
        y: Math.floor(rnd() * height * 0.55),
        s: 1 + Math.floor(rnd() * 2),
        o: 0.4 + rnd() * 0.5,
      });
    }
    return out;
  }, [width, height]);

  const twinkleRef = useRef(0);
  const [tick, setTick] = useState(0);
  useTick((ticker) => {
    twinkleRef.current += ticker.deltaMS;
    if (twinkleRef.current > 120) {
      twinkleRef.current = 0;
      setTick((t) => (t + 1) % 1000);
    }
  });

  const drawBg = useCallback(
    (g: Graphics) => {
      g.clear();
      const gradientSteps = 8;
      const stops: Array<[number, number]> = [
        [0, 0x1a1438],
        [0.3, 0x3d2558],
        [0.55, 0x7a3d74],
        [0.78, 0xd68ab0],
        [1, 0xf5d5d0],
      ];
      for (let i = 0; i < gradientSteps; i++) {
        const t = i / (gradientSteps - 1);
        const color = interpolateStops(stops, t);
        const y = Math.floor((i * height) / gradientSteps);
        const h = Math.ceil(height / gradientSteps) + 1;
        g.rect(0, y, width, h).fill({ color });
      }
    },
    [width, height],
  );

  const drawMoon = useCallback(
    (g: Graphics) => {
      g.clear();
      const mx = width * 0.82;
      const my = height * 0.14;
      g.circle(mx, my, 28).fill({ color: 0xfff2c8, alpha: 0.35 });
      g.circle(mx, my, 20).fill({ color: 0xfff2c8, alpha: 0.55 });
      g.circle(mx, my, 14).fill({ color: 0xfff6d4 });
    },
    [width, height],
  );

  const drawStars = useCallback(
    (g: Graphics) => {
      g.clear();
      stars.forEach((s, i) => {
        const phase = (tick + i * 13) % 60;
        const alpha = s.o * (phase < 30 ? 1 : 0.4);
        g.rect(s.x, s.y, s.s, s.s).fill({ color: 0xffffff, alpha });
      });
    },
    [stars, tick],
  );

  const drawClouds = useCallback(
    (g: Graphics) => {
      g.clear();
      const clouds: Array<[number, number, number]> = [
        [width * 0.08, height * 0.52, 1.1],
        [width * 0.68, height * 0.46, 1.35],
        [width * 0.76, height * 0.8, 0.9],
        [width * 0.04, height * 0.78, 1.0],
      ];
      clouds.forEach(([x, y, scale]) => {
        const s = 5 * scale;
        const shadow: Array<[number, number, number, number]> = [
          [1, 3, 9, 1],
          [2, 4, 7, 1],
        ];
        const blocks: Array<[number, number, number, number]> = [
          [2, 0, 3, 1],
          [5, 0, 2, 1],
          [1, 1, 8, 1],
          [0, 2, 10, 1],
          [1, 3, 9, 1],
          [2, 4, 7, 1],
        ];
        shadow.forEach(([bx, by, bw, bh]) => {
          g.rect(x + bx * s, y + (by + 0.5) * s, bw * s, bh * s).fill({
            color: 0xe9e3f2,
            alpha: 0.75,
          });
        });
        blocks.forEach(([bx, by, bw, bh]) => {
          g.rect(x + bx * s, y + by * s, bw * s, bh * s).fill({
            color: 0xffffff,
            alpha: 0.85,
          });
        });
      });
    },
    [width, height],
  );

  return (
    <pixiContainer>
      <pixiGraphics draw={drawBg} />
      <pixiGraphics draw={drawMoon} />
      <pixiGraphics draw={drawStars} />
      <pixiGraphics draw={drawClouds} />
    </pixiContainer>
  );
}

function interpolateStops(stops: Array<[number, number]>, t: number): number {
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (t >= t0 && t <= t1) {
      const k = (t - t0) / (t1 - t0);
      const r0 = (c0 >> 16) & 0xff;
      const g0 = (c0 >> 8) & 0xff;
      const b0 = c0 & 0xff;
      const r1 = (c1 >> 16) & 0xff;
      const g1 = (c1 >> 8) & 0xff;
      const b1 = c1 & 0xff;
      const r = Math.round(r0 + (r1 - r0) * k);
      const g = Math.round(g0 + (g1 - g0) * k);
      const b = Math.round(b0 + (b1 - b0) * k);
      return (r << 16) | (g << 8) | b;
    }
  }
  return stops[stops.length - 1][1];
}

/* ───────────────────────── Side blocks ───────────────────────── */

function SideBlocks({
  gridSize,
  project,
}: {
  gridSize: number;
  project: ReturnType<typeof createProjection>;
}) {
  const draw = useCallback(
    (g: Graphics) => {
      g.clear();
      for (let gx = 0; gx < gridSize; gx++) {
        const gy = gridSize - 1;
        const p = project(gx, gy);
        for (let layer = 0; layer < SIDE_LAYERS; layer++) {
          const leftX = p.x - TILE_W / 2;
          const midX = p.x;
          const pts = [
            leftX,
            p.y + TILE_H / 2 + layer * BLOCK_H,
            midX,
            p.y + TILE_H + layer * BLOCK_H,
            midX,
            p.y + TILE_H + (layer + 1) * BLOCK_H,
            leftX,
            p.y + TILE_H / 2 + (layer + 1) * BLOCK_H,
          ];
          g.poly(pts)
            .fill({ color: pickLeft(gx, gy, layer) })
            .stroke({ color: 0x462858, alpha: 0.15, width: 1 });
        }
      }
      for (let gy = 0; gy < gridSize; gy++) {
        const gx = gridSize - 1;
        const p = project(gx, gy);
        for (let layer = 0; layer < SIDE_LAYERS; layer++) {
          const rightX = p.x + TILE_W / 2;
          const midX = p.x;
          const pts = [
            midX,
            p.y + TILE_H + layer * BLOCK_H,
            rightX,
            p.y + TILE_H / 2 + layer * BLOCK_H,
            rightX,
            p.y + TILE_H / 2 + (layer + 1) * BLOCK_H,
            midX,
            p.y + TILE_H + (layer + 1) * BLOCK_H,
          ];
          g.poly(pts)
            .fill({ color: pickRight(gx, gy, layer) })
            .stroke({ color: 0x3c1e50, alpha: 0.2, width: 1 });
        }
      }
    },
    [gridSize, project],
  );

  return <pixiGraphics draw={draw} />;
}

/* ───────────────────────── Top tiles ───────────────────────── */

function TileGrid({
  gridSize,
  project,
  showGrid,
  occupied,
  onTileClick,
}: {
  gridSize: number;
  project: ReturnType<typeof createProjection>;
  showGrid: boolean;
  occupied: Set<string>;
  onTileClick?: (gx: number, gy: number) => void;
}) {
  const coords = useMemo(() => {
    const out: Array<[number, number]> = [];
    for (let gy = 0; gy < gridSize; gy++)
      for (let gx = 0; gx < gridSize; gx++) out.push([gx, gy]);
    return out;
  }, [gridSize]);
  const [hoverTile, setHoverTile] = useState<string | null>(null);

  const draw = useCallback(
    (g: Graphics) => {
      g.clear();
      coords.forEach(([gx, gy]) => {
        const p = project(gx, gy);
        const isOcc = occupied.has(`${gx},${gy}`);
        const isHover = hoverTile === `${gx},${gy}` && !isOcc;
        const color = isHover ? 0x67e8f9 : pickTop(gx, gy);
        const alpha = isHover ? 0.7 : 1;
        const points = [
          p.x,
          p.y,
          p.x + TILE_W / 2,
          p.y + TILE_H / 2,
          p.x,
          p.y + TILE_H,
          p.x - TILE_W / 2,
          p.y + TILE_H / 2,
        ];
        g.poly(points).fill({ color, alpha });
        const strokeColor = showGrid ? 0xb478c8 : 0x8250a0;
        const strokeAlpha = showGrid ? 0.6 : 0.12;
        const strokeWidth = showGrid ? 1 : 0.5;
        g.poly(points).stroke({
          color: strokeColor,
          alpha: strokeAlpha,
          width: strokeWidth,
        });
      });
    },
    [coords, project, showGrid, occupied, hoverTile],
  );

  const handlePointerMove = useCallback(
    (e: FederatedPointerEvent) => {
      if (!showGrid || !onTileClick) return;
      const tile = findTile(e, project, gridSize);
      if (tile) setHoverTile(`${tile.gx},${tile.gy}`);
      else setHoverTile(null);
    },
    [showGrid, onTileClick, project, gridSize],
  );

  const handlePointerTap = useCallback(
    (e: FederatedPointerEvent) => {
      if (!onTileClick) return;
      const tile = findTile(e, project, gridSize);
      if (tile) onTileClick(tile.gx, tile.gy);
    },
    [onTileClick, project, gridSize],
  );

  return (
    <pixiGraphics
      draw={draw}
      eventMode={onTileClick ? "static" : "passive"}
      cursor={onTileClick ? "pointer" : "default"}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHoverTile(null)}
      onPointerTap={handlePointerTap}
    />
  );
}

function findTile(
  e: FederatedPointerEvent,
  project: ReturnType<typeof createProjection>,
  gridSize: number,
) {
  const p = e.getLocalPosition(e.currentTarget);
  // iterate front-to-back so top tile wins on overlap
  for (let gy = gridSize - 1; gy >= 0; gy--) {
    for (let gx = gridSize - 1; gx >= 0; gx--) {
      const pr = project(gx, gy);
      const dx = p.x - pr.x;
      const dy = p.y - (pr.y + TILE_H / 2);
      if (Math.abs(dx) / (TILE_W / 2) + Math.abs(dy) / (TILE_H / 2) <= 1) {
        return { gx, gy };
      }
    }
  }
  return null;
}

/* ───────────────────────── Objects ───────────────────────── */

function Objects({
  objects,
  project,
  hoveredIndex,
  onHoverObject,
  onObjectClick,
}: {
  objects: LandObject[];
  project: ReturnType<typeof createProjection>;
  hoveredIndex: number | null;
  onHoverObject?: (i: number | null) => void;
  onObjectClick?: (obj: LandObject) => void;
}) {
  // Back-to-front draw order so isometric overlaps look right.
  const sorted = useMemo(
    () =>
      objects
        .map((o, i) => ({ obj: o, index: i }))
        .sort((a, b) => a.obj.gx + a.obj.gy - (b.obj.gx + b.obj.gy)),
    [objects],
  );

  return (
    <pixiContainer>
      {sorted.map(({ obj, index }) => {
        const p = project(obj.gx, obj.gy);
        return (
          <BuildingSprite
            key={obj.id}
            obj={obj}
            index={index}
            x={p.x}
            y={p.y + TILE_H}
            isHover={index === hoveredIndex}
            onHoverObject={onHoverObject}
            onObjectClick={onObjectClick}
          />
        );
      })}
    </pixiContainer>
  );
}

function BuildingSprite({
  obj,
  index,
  x,
  y,
  isHover,
  onHoverObject,
  onObjectClick,
}: {
  obj: LandObject;
  index: number;
  x: number;
  y: number;
  isHover: boolean;
  onHoverObject?: (i: number | null) => void;
  onObjectClick?: (obj: LandObject) => void;
}) {
  const shape = useMemo(() => getBuildingShape(obj.type), [obj.type]);

  const draw = useCallback(
    (g: Graphics) => {
      g.clear();
      g.ellipse(x, y + 2, 10, 3).fill({ color: 0x000000, alpha: 0.18 });
      shape.forEach((pix: Pixel) => {
        const color = resolveShade(obj.hue, pix.shade);
        const px = x + (pix.x - 9) * 2;
        const py = y + (pix.y - 27) * 2;
        g.rect(px, py, pix.w * 2, pix.h * 2).fill({ color });
      });
      if (isHover) {
        g.ellipse(x, y + 2, 13, 4).stroke({
          color: 0x22d3ee,
          width: 1,
          alpha: 0.8,
        });
      }
    },
    [shape, x, y, obj.hue, isHover],
  );

  const interactive = !!onHoverObject || !!onObjectClick;

  return (
    <pixiGraphics
      draw={draw}
      eventMode={interactive ? "static" : "passive"}
      cursor={onObjectClick ? "pointer" : "default"}
      onPointerEnter={() => onHoverObject?.(index)}
      onPointerLeave={() => onHoverObject?.(null)}
      onPointerTap={() => onObjectClick?.(obj)}
    />
  );
}

/** Fixed palette shades that aren't parameterized by the building's hue. */
const FIXED_SHADES: Partial<Record<Pixel["shade"], number>> = {
  trunk: 0x6b4a2a,
  "trunk-d": 0x4a3018,
  highlight: 0xf0e0c8,
  berry: 0xffe8b8,
  lamp: 0xffe8b8,
};

function resolveShade(hue: number, shade: Pixel["shade"]): number {
  if (shade === "main" || shade === "mid" || shade === "dark" || shade === "acc") {
    return shadeHue(hue, shade);
  }
  return FIXED_SHADES[shade] ?? hueToRgb(hue);
}

/* ───────────────────────── Hamsters ───────────────────────── */

function Hamsters({
  gridSize,
  project,
}: {
  gridSize: number;
  project: ReturnType<typeof createProjection>;
}) {
  const front = project(gridSize - 1, gridSize - 1);
  const bottomY = front.y + TILE_H + SIDE_LAYERS * BLOCK_H;
  const cx = front.x - (gridSize - 1) * (TILE_W / 2);

  const draw = useCallback(
    (g: Graphics) => {
      g.clear();
      drawHamster(g, cx - 82, bottomY - 14, "brown");
      drawHamster(g, cx - 20, bottomY - 6, "white");
      drawHamster(g, cx + 40, bottomY - 16, "gray");
    },
    [cx, bottomY],
  );

  return <pixiGraphics draw={draw} />;
}

const SKINS = {
  brown: { body: 0xb37a52, belly: 0xf4e9d8, shade: 0x8e5d3b, ear: 0xe0a07a },
  white: { body: 0xf4ede0, belly: 0xffffff, shade: 0xd9ceb8, ear: 0xf7c7c0 },
  gray: { body: 0xa9a9b4, belly: 0xe8e6ec, shade: 0x7e7e88, ear: 0xc4bec8 },
} as const;

function drawHamster(g: Graphics, x: number, y: number, variant: keyof typeof SKINS) {
  const k = SKINS[variant];
  const paw = 0xf4b5b5;
  const eye = 0x1a0f22;
  const nose = 0xd47a8a;
  const s = 2.2 * 1.45;
  const p = (cx: number, cy: number, cw: number, ch: number, fill: number) => {
    g.rect(x + cx * s, y + cy * s, cw * s, ch * s).fill({ color: fill });
  };
  p(2, 0, 2, 4, k.body);
  p(14, 0, 2, 4, k.body);
  p(2, 0, 2, 2, paw);
  p(14, 0, 2, 2, paw);
  p(3, 3, 2, 2, k.ear);
  p(13, 3, 2, 2, k.ear);
  p(4, 4, 10, 2, k.body);
  p(3, 6, 12, 10, k.body);
  p(2, 8, 14, 6, k.body);
  p(4, 16, 10, 2, k.body);
  p(13, 7, 2, 8, k.shade);
  p(14, 9, 1, 5, k.shade);
  p(6, 10, 6, 6, k.belly);
  p(7, 9, 4, 1, k.belly);
  p(5, 8, 2, 2, eye);
  p(11, 8, 2, 2, eye);
  p(6, 8, 1, 1, 0xffffff);
  p(12, 8, 1, 1, 0xffffff);
  p(8, 11, 2, 1, nose);
  p(4, 11, 1, 1, 0xf6c6c6);
  p(13, 11, 1, 1, 0xf6c6c6);
  p(4, 18, 3, 2, paw);
  p(11, 18, 3, 2, paw);
}
