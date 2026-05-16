"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareLandButtonProps {
  onClick: () => void;
  className?: string;
  /** Shorter label on narrow viewports (public land mobile header). */
  compact?: boolean;
}

/** Consistent Share CTA used on every island MapFrame. */
export function ShareLandButton({
  onClick,
  className,
  compact = false,
}: ShareLandButtonProps) {
  return (
    <Button
      variant="cyan"
      size="sm"
      className={cn("h-8 px-3 text-[10px] sm:h-9 sm:px-3.5 sm:text-[12px]", className)}
      onClick={onClick}
    >
      {compact ? (
        "↗ Share"
      ) : (
        <>
          ↗ Share<span className="hidden sm:inline">&nbsp;the Land</span>
        </>
      )}
    </Button>
  );
}
