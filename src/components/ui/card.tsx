import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "group/card relative flex flex-col rounded-none bg-panel border-2 text-ink overflow-hidden",
  {
    variants: {
      accent: {
        default: "border-border-neon",
        violet:
          "border-violet-neon shadow-[0_0_0_2px_var(--color-bg),0_0_18px_rgba(168,85,247,0.25)]",
        magenta:
          "border-magenta-neon shadow-[0_0_0_2px_var(--color-bg),0_0_18px_rgba(255,45,147,0.35)]",
        cyan: "border-cyan-neon shadow-[0_0_0_2px_var(--color-bg),0_0_18px_rgba(34,211,238,0.35)]",
        yellow:
          "border-yellow-neon shadow-[0_0_0_2px_var(--color-bg),0_0_18px_rgba(251,191,36,0.35)]",
      },
      padding: {
        none: "",
        sm: "p-2",
        default: "p-3",
        lg: "p-4",
      },
    },
    defaultVariants: {
      accent: "default",
      padding: "default",
    },
  },
);

type CardProps = React.ComponentProps<"div"> & VariantProps<typeof cardVariants>;

function Card({ className, accent, padding, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-accent={accent}
      className={cn(cardVariants({ accent, padding }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex items-center gap-2 mb-2", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-px text-xs uppercase tracking-wider", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("font-pixel-body text-[16px] text-muted-neon", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("flex-1", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("mt-3 flex items-center gap-2", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
};
