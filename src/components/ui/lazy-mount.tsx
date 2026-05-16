"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface LazyMountProps {
  children: ReactNode;
  className?: string;
  rootMargin?: string;
  fallback?: ReactNode;
  /** Keep observing and unmount `children` (back to `fallback`) when the host
   *  scrolls out of view. Use for heavy children (e.g. WebGL canvases) so only
   *  the on-screen ones stay alive. Default: mount-once, never unmount. */
  unmountOnExit?: boolean;
}

export function LazyMount({
  children,
  className,
  rootMargin = "200px",
  fallback,
  unmountOnExit = false,
}: LazyMountProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted && !unmountOnExit) return;
    const node = hostRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible) {
          setMounted(true);
          if (!unmountOnExit) observer.disconnect();
        } else if (unmountOnExit) {
          setMounted(false);
        }
      },
      { root: null, rootMargin, threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [mounted, rootMargin, unmountOnExit]);

  return (
    <div ref={hostRef} className={className}>
      {mounted ? children : fallback}
    </div>
  );
}
