"use client";

import * as React from "react";
import { Separator as SeparatorPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const separatorVariants = cva("shrink-0", {
  variants: {
    variant: {
      default:
        "bg-border-neon data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
      dashed:
        "border-0 data-horizontal:h-0.5 data-horizontal:w-full data-vertical:w-0.5 data-vertical:self-stretch bg-transparent data-horizontal:[background:repeating-linear-gradient(90deg,var(--color-border-neon)_0_4px,transparent_4px_8px)] data-vertical:[background:repeating-linear-gradient(180deg,var(--color-border-neon)_0_4px,transparent_4px_8px)] data-horizontal:my-2.5",
      neon: "bg-cyan-neon shadow-[0_0_8px_var(--color-cyan-neon)] data-horizontal:h-[3px] data-horizontal:w-full data-vertical:w-[3px] data-vertical:self-stretch",
    },
  },
  defaultVariants: { variant: "default" },
});

type SeparatorProps = React.ComponentProps<typeof SeparatorPrimitive.Root> &
  VariantProps<typeof separatorVariants>;

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  variant,
  ...props
}: SeparatorProps) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      data-variant={variant}
      decorative={decorative}
      orientation={orientation}
      className={cn(separatorVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Separator, separatorVariants };
