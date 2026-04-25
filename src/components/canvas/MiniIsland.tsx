import { memo, useMemo } from "react";
import type { BuildingType } from "@/lib/types";

interface MiniIslandProps {
  width?: number;
  height?: number;
  seed?: number;
  count?: number;
}

const TOP = [
  "#FFE0F0",
  "#FFD5BA",
  "#FFF2B8",
  "#D6F5C5",
  "#C7ECF5",
  "#D8D1F5",
  "#F5C8E0",
];
const SIDE_L = [
  "#E6B8D1",
  "#E8B99A",
  "#E5D78F",
  "#B7DBA5",
  "#A8CFE0",
  "#B5ADE0",
  "#D8A7C4",
];
const SIDE_R = [
  "#C99CB6",
  "#C99A7B",
  "#C4B872",
  "#97BF85",
  "#88B4C7",
  "#968DC7",
  "#B78BA4",
];

const HUES = [30, 240, 140, 80, 320, 180, 200];

function computeStars(seed: number, width: number, height: number) {
  let sd = seed + 3;
  const next = () => {
    sd = (sd * 9301 + 49297) % 233280;
    return sd / 233280;
  };
  const out: Array<{ x: number; y: number; o: number }> = [];
  for (let i = 0; i < 8; i++) {
    out.push({
      x: next() * width,
      y: next() * (height * 0.55),
      o: 0.4 + next() * 0.5,
    });
  }
  return out;
}
const TYPES: BuildingType[] = [
  "tower",
  "crystal",
  "tree",
  "dome",
  "mushroom",
  "shrine",
  "lighthouse",
];

/**
 * Lightweight SVG thumbnail — used on land card grids where we need many
 * of these rendered at once. Main island uses the Pixi scene.
 */
function MiniIslandView({
  width = 200,
  height = 110,
  seed = 0,
  count = 4,
}: MiniIslandProps) {
  const gs = 5;
  const tw = 18;
  const th = 9;
  const blockH = 5;
  const layers = 2;
  const cx = width / 2;
  const cy = height / 2 - 18;
  const pickT = (gx: number, gy: number) =>
    TOP[(gx * 3 + gy * 7 + seed * 2) % TOP.length];
  const pickL = (gx: number, gy: number, l: number) =>
    SIDE_L[(gx * 5 + gy * 2 + l * 11 + seed) % SIDE_L.length];
  const pickR = (gx: number, gy: number, l: number) =>
    SIDE_R[(gx * 7 + gy * 3 + l * 13 + seed) % SIDE_R.length];
  const proj = (gx: number, gy: number) => ({
    x: cx + ((gx - gy) * tw) / 2,
    y: cy + ((gx + gy) * th) / 2,
  });

  const objs = useMemo(() => {
    const out: Array<{ gx: number; gy: number; hue: number; type: BuildingType }> = [];
    for (let i = 0; i < count; i++) {
      const gx = (i * 2 + seed + 1) % gs;
      const gy = (i * 3 + seed + 2) % gs;
      if (out.some((o) => o.gx === gx && o.gy === gy)) continue;
      out.push({
        gx,
        gy,
        hue: HUES[(i + seed) % HUES.length],
        type: TYPES[(i + seed * 2) % TYPES.length],
      });
    }
    return out;
  }, [count, gs, seed]);

  const stars = useMemo(() => computeStars(seed, width, height), [seed, width, height]);

  const coords = useMemo(() => {
    const out: Array<[number, number]> = [];
    for (let gy = 0; gy < gs; gy++) {
      for (let gx = 0; gx < gs; gx++) out.push([gx, gy]);
    }
    return out;
  }, [gs]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={`mini-sky-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1438" />
          <stop offset="45%" stopColor="#5a3470" />
          <stop offset="80%" stopColor="#b87aa0" />
          <stop offset="100%" stopColor="#f5d5d0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={width} height={height} fill={`url(#mini-sky-${seed})`} />
      {stars.map((s, i) => (
        <rect
          key={i}
          x={Math.floor(s.x)}
          y={Math.floor(s.y)}
          width="1"
          height="1"
          fill="#ffffff"
          opacity={s.o}
        />
      ))}
      <ellipse
        cx={cx}
        cy={cy + (gs * th) / 2 + 8}
        rx={width * 0.42}
        ry={height * 0.1}
        fill="rgba(255,230,200,0.25)"
      />
      {Array.from({ length: gs }).map((_, gx) => {
        const gy = gs - 1;
        const p = proj(gx, gy);
        return Array.from({ length: layers }).map((_, l) => {
          const leftX = p.x - tw / 2;
          const midX = p.x;
          const pts = [
            [leftX, p.y + th / 2 + l * blockH],
            [midX, p.y + th + l * blockH],
            [midX, p.y + th + (l + 1) * blockH],
            [leftX, p.y + th / 2 + (l + 1) * blockH],
          ]
            .map((pt) => pt.join(","))
            .join(" ");
          return (
            <polygon
              key={`L_${gx}_${l}`}
              points={pts}
              fill={pickL(gx, gy, l)}
              stroke="rgba(70,40,90,0.12)"
              strokeWidth="0.4"
            />
          );
        });
      })}
      {Array.from({ length: gs }).map((_, gy) => {
        const gx = gs - 1;
        const p = proj(gx, gy);
        return Array.from({ length: layers }).map((_, l) => {
          const rightX = p.x + tw / 2;
          const midX = p.x;
          const pts = [
            [midX, p.y + th + l * blockH],
            [rightX, p.y + th / 2 + l * blockH],
            [rightX, p.y + th / 2 + (l + 1) * blockH],
            [midX, p.y + th + (l + 1) * blockH],
          ]
            .map((pt) => pt.join(","))
            .join(" ");
          return (
            <polygon
              key={`R_${gy}_${l}`}
              points={pts}
              fill={pickR(gx, gy, l)}
              stroke="rgba(60,30,80,0.15)"
              strokeWidth="0.4"
            />
          );
        });
      })}
      {coords.map(([gx, gy]) => {
        const p = proj(gx, gy);
        const c = pickT(gx, gy);
        const points = `${p.x},${p.y} ${p.x + tw / 2},${p.y + th / 2} ${p.x},${p.y + th} ${p.x - tw / 2},${p.y + th / 2}`;
        return (
          <polygon
            key={`${gx}_${gy}`}
            points={points}
            fill={c}
            stroke="rgba(130,80,160,0.1)"
            strokeWidth="0.4"
          />
        );
      })}
      {objs
        .sort((a, b) => a.gx + a.gy - (b.gx + b.gy))
        .map((o, i) => {
          const p = proj(o.gx, o.gy);
          const bx = p.x;
          const by = p.y + th;
          const main = `oklch(0.80 0.14 ${o.hue})`;
          const mid = `oklch(0.60 0.17 ${o.hue})`;
          const dark = `oklch(0.42 0.17 ${o.hue})`;
          if (o.type === "tree") {
            return (
              <g key={i}>
                <rect x={bx - 1} y={by - 4} width="2" height="4" fill="#6b4a2a" />
                <rect x={bx - 4} y={by - 12} width="8" height="8" fill={main} />
                <rect x={bx + 2} y={by - 10} width="2" height="6" fill={mid} />
              </g>
            );
          }
          if (o.type === "crystal") {
            return (
              <g key={i}>
                <polygon
                  points={`${bx},${by - 14} ${bx + 4},${by - 8} ${bx},${by - 2} ${bx - 4},${by - 8}`}
                  fill={main}
                />
                <polygon
                  points={`${bx},${by - 14} ${bx + 4},${by - 8} ${bx},${by - 8}`}
                  fill={mid}
                />
                <rect x={bx - 3} y={by - 1} width="6" height="1" fill={dark} />
              </g>
            );
          }
          if (o.type === "dome" || o.type === "mushroom") {
            return (
              <g key={i}>
                <rect x={bx - 2} y={by - 6} width="4" height="6" fill={mid} />
                <rect x={bx - 5} y={by - 10} width="10" height="4" fill={main} />
                <rect x={bx - 3} y={by - 12} width="6" height="2" fill={main} />
              </g>
            );
          }
          if (o.type === "shrine") {
            return (
              <g key={i}>
                <rect x={bx - 4} y={by - 6} width="1" height="6" fill={main} />
                <rect x={bx + 3} y={by - 6} width="1" height="6" fill={main} />
                <rect x={bx - 5} y={by - 8} width="10" height="2" fill={main} />
                <rect x={bx - 4} y={by - 10} width="8" height="1" fill={dark} />
              </g>
            );
          }
          if (o.type === "lighthouse") {
            return (
              <g key={i}>
                <rect x={bx - 1} y={by - 12} width="2" height="12" fill={main} />
                <rect x={bx - 2} y={by - 14} width="4" height="2" fill="#ffe8b8" />
                <rect x={bx - 1} y={by - 8} width="2" height="1" fill={dark} />
              </g>
            );
          }
          return (
            <g key={i}>
              <rect x={bx - 3} y={by - 6} width="6" height="6" fill={main} />
              <rect x={bx + 2} y={by - 5} width="1" height="5" fill={mid} />
              <rect x={bx - 4} y={by - 7} width="8" height="1" fill={dark} />
              <rect x={bx - 2} y={by - 11} width="4" height="4" fill={main} />
              <rect x={bx - 3} y={by - 12} width="6" height="1" fill={dark} />
            </g>
          );
        })}
    </svg>
  );
}

export const MiniIsland = memo(MiniIslandView);
