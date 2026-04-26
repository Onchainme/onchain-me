import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Pastel square tile with a single letter — used in inventory slots, tooltips,
 * modal lists, and active-cursor cards. The hue drives the OKLCH fill so every
 * protocol gets a distinct color.
 */
const tileVariants = cva(
  "inline-grid place-items-center border-2 font-display uppercase leading-none",
  {
    variants: {
      size: {
        xs: "w-5 h-5 text-[8px]",
        sm: "w-7 h-7 text-[12px]",
        md: "w-8 h-8 text-[12px]",
        lg: "w-10 h-10 text-base",
        xl: "w-24 h-24 text-4xl",
      },
      tone: {
        /** dim ring on dark surface (inventory/list rows) */
        inner: "border-[rgba(0,0,0,0.6)] text-[rgba(0,0,0,0.7)]",
        /** bright ring on card surface (tooltip/modal) */
        bold: "border-ink text-[rgba(0,0,0,0.7)]",
      },
    },
    defaultVariants: { size: "md", tone: "inner" },
  },
);

type GlyphTileProps = Omit<ComponentProps<"div">, "children"> &
  VariantProps<typeof tileVariants> & {
    glyph: string;
    hue: number;
    /** Lightness / chroma override, defaults to 0.75 / 0.18 */
    shade?: { l?: number; c?: number };
    dim?: boolean;
    glow?: boolean;
  };

export function GlyphTile({
  glyph,
  hue,
  size,
  tone,
  shade,
  dim,
  glow,
  className,
  style,
  ...rest
}: GlyphTileProps) {
  const l = shade?.l ?? 0.75;
  const c = shade?.c ?? 0.18;
  return (
    <div
      className={cn(tileVariants({ size, tone }), dim && "opacity-60", className)}
      style={{
        background: `oklch(${l} ${c} ${hue})`,
        boxShadow: glow ? "0 0 18px rgba(34,211,238,0.4)" : undefined,
        ...style,
      }}
      {...rest}
    >
      {glyph}
    </div>
  );
}
