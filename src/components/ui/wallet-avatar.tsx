import { cn } from "@/lib/utils";

const SIZE = {
  sm: "w-4 h-4 border",
  md: "w-7 h-7 border-2",
  lg: "w-10 h-10 border-2",
} as const;

interface WalletAvatarProps {
  size?: keyof typeof SIZE;
  glow?: boolean;
  className?: string;
}

/**
 * Rainbow Jazzicon-style placeholder avatar. Same visual across header,
 * stats rail, and public land ownership banner.
 */
export function WalletAvatar({ size = "md", glow, className }: WalletAvatarProps) {
  return (
    <span
      className={cn(SIZE[size], "shrink-0 border-ink inline-block", className)}
      style={{
        background:
          "conic-gradient(from 45deg, var(--color-magenta-neon), var(--color-cyan-neon), var(--color-yellow-neon), var(--color-magenta-neon))",
        boxShadow: glow
          ? "0 0 0 2px var(--color-bg), 0 0 12px rgba(244,114,182,0.45)"
          : undefined,
      }}
    />
  );
}
