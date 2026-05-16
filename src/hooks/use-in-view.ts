"use client";

import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  /** Expand the root viewport (e.g. `"160px"` mounts slightly before scroll-in). */
  rootMargin?: string;
  /** Fraction of the target that must be visible (0–1). */
  threshold?: number;
}

/** Tracks viewport intersection; updates when the target enters or leaves. */
export function useInView({
  rootMargin = "120px",
  threshold = 0.05,
}: UseInViewOptions = {}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry?.isIntersecting ?? false);
      },
      { rootMargin, threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return { ref, inView };
}
