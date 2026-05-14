"use client";

import { useEffect, useState, type ReactNode } from "react";

const LOADER_MS = 380;

function PixelLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-5" role="status" aria-live="polite">
      <div className="pixel-loader relative grid size-16 grid-cols-2 gap-0.5 border-2 border-border-neon bg-bg-2 p-1">
        <span className="block size-full bg-cyan-neon/90 [animation-delay:0ms]" />
        <span className="block size-full bg-magenta-neon/90 [animation-delay:120ms]" />
        <span className="block size-full bg-yellow-neon/90 [animation-delay:240ms]" />
        <span className="block size-full bg-violet-neon/90 [animation-delay:360ms]" />
      </div>
      <span className="font-silk text-[11px] sm:text-[12px] text-muted-neon tracking-[0.2em] glow-c">
        LOADING…
      </span>
    </div>
  );
}

interface RouteLoadingGateProps {
  children: ReactNode;
}

/**
 * Brief branded loader, then crossfades to skeleton children (still on the
 * route `loading.tsx` until the real page replaces this tree).
 */
export function RouteLoadingGate({ children }: RouteLoadingGateProps) {
  const [phase, setPhase] = useState<"loader" | "content">("loader");

  useEffect(() => {
    let cancelled = false;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setPhase("content");
      return;
    }
    const id = window.setTimeout(() => {
      if (!cancelled) setPhase("content");
    }, LOADER_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  if (phase === "loader") {
    return (
      <div className="flex min-h-[min(72vh,620px)] w-full items-center justify-center px-3 py-10">
        <PixelLoader />
      </div>
    );
  }

  return (
    <div className="route-skeleton-in">{children}</div>
  );
}
