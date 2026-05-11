"use client";

import { Application, extend } from "@pixi/react";
import { Assets, Container, Graphics, Sprite, Texture } from "pixi.js";
// Bare side-effect import runs `AnimatedWebPAsset.mjs` which calls
// `extensions.add(...)` to register the `.webp` Assets loader. Without it the
// bundler tree-shakes the registration (the package has no `sideEffects`
// declaration in its package.json) and Assets.load returns a plain Texture
// — no .clone(), no animation.
import "@olduvai-jp/pixi-animated-webp";
import { AnimatedWebP } from "@olduvai-jp/pixi-animated-webp";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FederatedPointerEvent } from "pixi.js";
import type { LandObject } from "@/lib/types";
import { API_BASE_URL } from "@/lib/api";
import { badgeAsset, isBadgeId } from "@/lib/badge-catalog";
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
import { Hamsters } from "./Hamsters";

extend({ Container, Graphics, Sprite });

const BADGE_SPRITE_SIZE = 40;

/**
 * Animated WebP playback is handled by `@olduvai-jp/pixi-animated-webp`. The
 * package's side-effect import (top of file) registers an Assets loader that
 * resolves `*.webp` URLs to a ready `AnimatedWebP` Sprite via the WebCodecs
 * `ImageDecoder` API. Caveat: ImageDecoder isn't supported in Safari.
 *
 * `Assets.load` caches the resolved Sprite per URL; we `clone()` it per tile
 * so each placement is its own display object with its own position and
 * playback state.
 */
const animatedWebpTemplateCache = new Map<string, Promise<AnimatedWebP>>();

function loadAnimatedWebpTemplate(url: string): Promise<AnimatedWebP> {
  let promise = animatedWebpTemplateCache.get(url);
  if (!promise) {
    promise = Assets.load<AnimatedWebP>(url);
    animatedWebpTemplateCache.set(url, promise);
  }
  return promise;
}

export interface IslandSceneProps {
  width: number;
  height: number;
  /** Number of tiles per side. Defaults to 10×10. */
  gridSize?: number;
  objects: LandObject[];
  /** When true, draws tile outlines and enables tile hover/click feedback. */
  showGrid?: boolean;
  /** Visual scale of the island (tiles, side blocks, buildings, hamsters).
   *  The sky/background stays full-canvas. Defaults to 1. */
  scale?: number;
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
  gridSize = 5,
  objects,
  showGrid = false,
  scale = 1,
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

  // Scale the island around (cx, cy) by translating by cx*(1-scale), cy*(1-scale)
  // so a child drawn at (cx+dx, cy+dy) renders at (cx + scale*dx, cy + scale*dy).
  const offsetX = cx * (1 - scale);
  const offsetY = cy * (0.5 - scale);

  return (
    <pixiContainer>
      <Sky width={width} height={height} />
      <pixiContainer x={offsetX} y={offsetY} scale={scale}>
        <Hamsters gridSize={gridSize} project={project} />
        <SideBlocks gridSize={gridSize} project={project} />
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
      stars.forEach((s) => {
        g.rect(s.x, s.y, s.s, s.s).fill({ color: 0xffffff, alpha: s.o });
      });
    },
    [stars],
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
            y={p.y + TILE_H / 2}
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
  // Map LandObject → badge: a single image asset per badge (animated WebP or
  // static PNG, never both). The animated branch subscribes to the Pixi
  // ticker; the static branch doesn't, so PNG-only badges cost zero per-frame
  // GPU work. Non-badge objects fall through to the legacy pixel-art building.
  if (obj.badgeId && isBadgeId(obj.badgeId)) {
    const asset = badgeAsset(API_BASE_URL, obj.badgeId);
    if (asset) {
      const shared = {
        obj,
        index,
        x,
        y,
        isHover,
        onHoverObject,
        onObjectClick,
      };
      return asset.animated ? (
        <AnimatedBadgeSprite url={asset.url} {...shared} />
      ) : (
        <StaticBadgeSprite url={asset.url} {...shared} />
      );
    }
  }

  return (
    <BuildingShapeSprite
      obj={obj}
      index={index}
      x={x}
      y={y}
      isHover={isHover}
      onHoverObject={onHoverObject}
      onObjectClick={onObjectClick}
    />
  );
}

interface BadgePlateProps {
  obj: LandObject;
  index: number;
  x: number;
  y: number;
  isHover: boolean;
  onHoverObject?: (i: number | null) => void;
  onObjectClick?: (obj: LandObject) => void;
}

/**
 * Animated WebP badge: clones a pre-decoded `AnimatedWebP` Sprite from the
 * loader cache and mounts it imperatively into a child `pixiContainer`. The
 * library subscribes the sprite to `Ticker.shared` itself (autoUpdate=true,
 * autoPlay=true defaults), so we don't need a `useTick` here.
 *
 * Why imperative addChild: `AnimatedWebP` is a fully-formed Sprite instance
 * with state baked in (frames, decoder, ticker handle). The @pixi/react
 * reconciler creates objects from JSX props, not from pre-existing instances,
 * so the cleanest interop is to keep its ref-managed container empty in JSX
 * and `addChild()` the sprite ourselves.
 */
function AnimatedBadgeSprite({
  url,
  obj,
  index,
  x,
  y,
  isHover,
  onHoverObject,
  onObjectClick,
}: BadgePlateProps & { url: string }) {
  const hostRef = useRef<Container | null>(null);
  const spriteRef = useRef<AnimatedWebP | null>(null);
  // Latest callbacks/coords kept in refs so the listeners attached once at
  // mount always read fresh values without re-binding on every render.
  const callbacksRef = useRef({ obj, index, onHoverObject, onObjectClick });
  const positionRef = useRef({ x, y });

  useEffect(() => {
    callbacksRef.current = { obj, index, onHoverObject, onObjectClick };
  });

  useEffect(() => {
    positionRef.current = { x, y };
    if (spriteRef.current) {
      spriteRef.current.x = x;
      spriteRef.current.y = y + 2;
    }
  }, [x, y]);

  useEffect(() => {
    let cancelled = false;
    loadAnimatedWebpTemplate(url)
      .then((template) => {
        if (cancelled || !hostRef.current) return;
        // Assets.load caches by URL; a single Sprite can't be displayed in
        // two places, so each tile gets its own clone.
        const sprite = template.clone();
        sprite.texture.source.scaleMode = "nearest";
        sprite.anchor.set(0.5, 1);
        sprite.width = BADGE_SPRITE_SIZE;
        sprite.height = BADGE_SPRITE_SIZE;
        sprite.x = positionRef.current.x;
        sprite.y = positionRef.current.y + 2;
        sprite.eventMode = "static";
        sprite.cursor = "pointer";
        sprite.on("pointerenter", () =>
          callbacksRef.current.onHoverObject?.(callbacksRef.current.index),
        );
        sprite.on("pointerleave", () =>
          callbacksRef.current.onHoverObject?.(null),
        );
        sprite.on("pointertap", () =>
          callbacksRef.current.onObjectClick?.(callbacksRef.current.obj),
        );
        // `clone()` overrides autoPlay to false, so the clone never subscribes
        // to Ticker.shared on its own. `dirty = true` forces the first frame
        // to paint on the next render — without it the sprite stays blank
        // until the ticker advances past frame 0 (the constructor's initial
        // `currentFrame = 0` assignment is a no-op and never marks dirty).
        sprite.dirty = true;
        sprite.play();
        hostRef.current.addChild(sprite);
        spriteRef.current = sprite;
      })
      .catch((err) => {
        if (!cancelled) console.warn("[island] animated webp load failed", url, err);
      });
    return () => {
      cancelled = true;
      if (spriteRef.current) {
        spriteRef.current.destroy();
        spriteRef.current = null;
      }
    };
  }, [url]);

  const drawShadow = useCallback(
    (g: Graphics) => {
      g.clear();
      g.ellipse(x, y + 4, 12, 3).fill({ color: 0x000000, alpha: 0.22 });
      if (isHover) {
        g.ellipse(x, y + 4, 16, 5).stroke({
          color: 0x22d3ee,
          width: 1,
          alpha: 0.9,
        });
      }
    },
    [x, y, isHover],
  );

  return (
    <pixiContainer>
      <pixiGraphics draw={drawShadow} />
      {/* Empty JSX container — the AnimatedWebP sprite is addChild'd onto
          it imperatively above. Leaving JSX children empty prevents the
          @pixi/react reconciler from clearing our manual child. */}
      <pixiContainer ref={hostRef} />
    </pixiContainer>
  );
}

/**
 * Cache the loaded Texture per URL across mounts so re-mounting (e.g. user
 * re-enters /edit) doesn't trigger a fresh network request.
 */
const staticTextureCache = new Map<string, Texture>();

/**
 * Static PNG badge: load the texture via the Pixi Assets loader and render
 * once it's ready. No per-tick GPU work. We can't use `Texture.from(url)`
 * here — in Pixi v8 it's just a Cache lookup that returns undefined for
 * unloaded URLs (see textureFrom.ts).
 */
function StaticBadgeSprite({ url, ...rest }: BadgePlateProps & { url: string }) {
  const [texture, setTexture] = useState<Texture | null>(
    () => staticTextureCache.get(url) ?? null,
  );

  useEffect(() => {
    const cached = staticTextureCache.get(url);
    if (cached) {
      setTexture(cached);
      return;
    }
    let cancelled = false;
    Assets.load<Texture>(url)
      .then((tex) => {
        if (cancelled) return;
        // Keep pixel-art crisp when scaled down to BADGE_SPRITE_SIZE.
        tex.source.scaleMode = "nearest";
        staticTextureCache.set(url, tex);
        setTexture(tex);
      })
      .catch((err) => {
        if (!cancelled) console.warn("[island] png load failed", url, err);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return <BadgePlate texture={texture} {...rest} />;
}

/** Shared layout: shadow + sprite + hover/click handlers. */
function BadgePlate({
  texture,
  obj,
  index,
  x,
  y,
  isHover,
  onHoverObject,
  onObjectClick,
}: BadgePlateProps & { texture: Texture | null }) {
  const interactive = !!onHoverObject || !!onObjectClick;

  const drawShadow = useCallback(
    (g: Graphics) => {
      g.clear();
      g.ellipse(x, y + 4, 12, 3).fill({ color: 0x000000, alpha: 0.22 });
      if (isHover) {
        g.ellipse(x, y + 4, 16, 5).stroke({
          color: 0x22d3ee,
          width: 1,
          alpha: 0.9,
        });
      }
    },
    [x, y, isHover],
  );

  return (
    <pixiContainer>
      <pixiGraphics draw={drawShadow} />
      {texture ? (
        <pixiSprite
          texture={texture}
          x={x}
          y={y + 2}
          anchor={{ x: 0.5, y: 1 }}
          width={BADGE_SPRITE_SIZE}
          height={BADGE_SPRITE_SIZE}
          eventMode={interactive ? "static" : "passive"}
          cursor={onObjectClick ? "pointer" : "default"}
          onPointerEnter={() => onHoverObject?.(index)}
          onPointerLeave={() => onHoverObject?.(null)}
          onPointerTap={() => onObjectClick?.(obj)}
        />
      ) : null}
    </pixiContainer>
  );
}

function BuildingShapeSprite({
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
