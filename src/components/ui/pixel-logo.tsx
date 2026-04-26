interface PixelLogoProps {
  size?: number;
  glow?: boolean;
}

const PALETTE: Record<number, string> = {
  1: "#fde047",
  2: "#fde047",
  3: "#fb923c",
  4: "#ff2d93",
  5: "#e11d74",
  6: "#a855f7",
  7: "#7e22ce",
};

const ROWS = [
  [0, 0, 0, 2, 2, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 3, 3, 3, 3, 3, 3, 0],
  [4, 4, 4, 4, 4, 4, 4, 4],
  [5, 5, 5, 5, 5, 5, 5, 5],
  [6, 6, 6, 6, 6, 6, 6, 6],
  [7, 7, 7, 7, 7, 7, 7, 7],
];

export function PixelLogo({ size = 64, glow = true }: PixelLogoProps) {
  const px = Math.max(1, Math.floor(size / 8));
  const W = 8 * px;
  const H = 7 * px;
  return (
    <div
      style={{
        width: W,
        height: H,
        filter: glow
          ? "drop-shadow(0 0 6px rgba(251,191,36,0.6)) drop-shadow(0 0 14px rgba(255,45,147,0.4))"
          : "none",
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges">
        {ROWS.map((row, y) =>
          row.map((c, x) =>
            c ? (
              <rect
                key={`${y}-${x}`}
                x={x * px}
                y={y * px}
                width={px}
                height={px}
                fill={PALETTE[c]}
              />
            ) : null,
          ),
        )}
      </svg>
    </div>
  );
}
