import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Neon-bordered pulse block for route skeletons. */
export function Sk({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        "rounded-none border-2 border-border-neon bg-panel-2/55 animate-pulse",
        className,
      )}
      style={style}
      aria-hidden
    />
  );
}
