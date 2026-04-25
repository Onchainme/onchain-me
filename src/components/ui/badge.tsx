import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-none border-2 whitespace-nowrap transition-all select-none [&>svg]:pointer-events-none [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        /* ── Chip: filter-style pill used in rails and toolbars ── */
        chip: "font-silk text-[11px] tracking-[0.06em] uppercase px-2.5 py-1.5 bg-bg-2 border-border-neon text-ink-2 cursor-pointer hover:border-cyan-neon hover:text-ink",
        "chip-on":
          "font-silk text-[11px] tracking-[0.06em] uppercase px-2.5 py-1.5 bg-violet-neon border-violet-neon text-bg cursor-pointer",
        /* ── Tag: tiny status pill (MINT / ELIGIBLE / FEATURED) ── */
        tag: "font-px text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-magenta-neon text-white border-white",
        "tag-cyan":
          "font-px text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-cyan-neon text-[#001014] border-[#001014]",
        "tag-yellow":
          "font-px text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-yellow-neon text-[#2a1400] border-[#2a1400]",
        "tag-outline-cyan":
          "font-px text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-transparent border-cyan-neon text-cyan-neon",
        "tag-outline-yellow":
          "font-px text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-transparent border-yellow-neon text-yellow-neon",
        /* ── Passthroughs retained from shadcn for completeness ── */
        default: "font-silk text-[10px] px-2 py-0.5 bg-primary text-primary-foreground",
        secondary:
          "font-silk text-[10px] px-2 py-0.5 bg-secondary text-secondary-foreground",
        outline: "font-silk text-[10px] px-2 py-0.5 bg-transparent border-border-neon text-ink",
      },
    },
    defaultVariants: { variant: "chip" },
  },
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean };

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
