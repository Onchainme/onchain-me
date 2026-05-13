import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-none border-2 bg-clip-padding whitespace-nowrap transition-all outline-none select-none cursor-pointer disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed aria-invalid:ring-1 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3 focus-visible:ring-1 focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        /* — Neon pixel buttons (primary style for our design) — */
        primary:
          "font-px uppercase text-white tracking-[0.08em] border-magenta-neon-2 shadow-[0_2px_0_0_#6b0f43,0_0_14px_rgba(255,45,147,0.5)] hover:shadow-[0_2px_0_0_#6b0f43,0_0_22px_rgba(255,45,147,0.8)] active:translate-y-0.5 active:shadow-none [background:linear-gradient(180deg,var(--color-magenta-neon)_0%,#c7176f_100%)]",
        cyan: "font-px uppercase text-[#001014] tracking-[0.08em] border-cyan-neon-2 shadow-[0_2px_0_0_#062a33,0_0_14px_rgba(34,211,238,0.5)] hover:shadow-[0_2px_0_0_#062a33,0_0_22px_rgba(34,211,238,0.8)] active:translate-y-0.5 active:shadow-none [background:linear-gradient(180deg,var(--color-cyan-neon)_0%,#0891b2_100%)]",
        pixel:
          "font-px uppercase text-ink tracking-[0.08em] bg-panel-2 border-border-neon shadow-[0_2px_0_0_var(--color-bg),0_4px_0_0_var(--color-border-neon)] hover:-translate-y-px active:translate-y-0.5 active:shadow-none",
        /* — Flat shadcn variants — */
        default: "bg-primary text-primary-foreground border-transparent [a]:hover:bg-primary/80",
        outline:
          "border-border-neon bg-panel text-ink hover:bg-panel-2 hover:border-cyan-neon",
        ghost:
          "bg-transparent border-border-neon text-ink-2 hover:text-ink hover:border-cyan-neon/70 shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive border-transparent hover:bg-destructive/20",
        link: "bg-transparent border-transparent text-primary underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default: "h-10 px-3.5 text-[12px]",
        sm: "h-7 px-2.5 text-[8px]",
        xs: "h-6 px-2 text-[8px]",
        lg: "h-11 px-4 text-[12px]",
        xl: "h-12 px-5 text-[16px]",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "pixel",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
