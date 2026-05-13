"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { fetchFeed, type FeedItem } from "@/lib/api";
import { shortWallet } from "@/lib/utils";

const POLL_INTERVAL_MS = 15_000;
const MAX_ITEMS = 12;
// Pixels of marquee travel per second — keeps perceived speed constant even
// as item count changes between polls.
const TICKER_PX_PER_SEC = 60;

interface LiveTickerProps {
  initialItems: FeedItem[];
  badgeNames?: Record<string, string>;
}

export function LiveTicker({ initialItems, badgeNames = {} }: LiveTickerProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const visibleRef = useRef(true);
  const trackRef = useRef<HTMLSpanElement | null>(null);
  const [duration, setDuration] = useState(40);

  useEffect(() => {
    const onVisibility = () => {
      visibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      if (!visibleRef.current) return;
      try {
        const page = await fetchFeed({ limit: MAX_ITEMS, signal: ctrl.signal });
        if (cancelled) return;
        setItems(page.items);
      } catch {
        // swallow — keep last good snapshot
      }
    };

    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      ctrl.abort();
      clearInterval(id);
    };
  }, []);

  const shown = useMemo(() => items.slice(0, MAX_ITEMS), [items]);

  // Recompute marquee duration whenever the rendered content width changes
  // (new items, font load, viewport resize). The track holds two copies, so
  // its scrollWidth is 2× the content; we animate by 50% — i.e. one copy.
  useEffect(() => {
    if (shown.length === 0) return;
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const oneLoopPx = el.scrollWidth / 2;
      if (oneLoopPx > 0) {
        setDuration(Math.max(20, oneLoopPx / TICKER_PX_PER_SEC));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [shown]);

  if (shown.length === 0) {
    return (
      <div className="flex items-center gap-2 sm:gap-3.5 text-muted-neon">
        <span className="font-silk text-[12px] glow-c tracking-widest">◉ LIVE</span>
        <span className="font-pixel-body text-base opacity-60">no recent activity</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3.5 text-muted-neon">
      <span className="font-silk text-[12px] glow-c tracking-widest shrink-0">◉ LIVE</span>
      <div className="ticker-mask relative flex-1 min-w-0 overflow-hidden">
        <span
          ref={trackRef}
          className="ticker-track font-pixel-body text-sm sm:text-base"
          style={{ ["--ticker-duration" as string]: `${duration}s` }}
        >
          {/* Two identical copies → seamless wrap when we slide by -50%. */}
          <TickerRow items={shown} badgeNames={badgeNames} />
          <TickerRow items={shown} badgeNames={badgeNames} ariaHidden />
        </span>
      </div>
    </div>
  );
}

function TickerRow({
  items,
  badgeNames,
  ariaHidden,
}: {
  items: FeedItem[];
  badgeNames: Record<string, string>;
  ariaHidden?: boolean;
}) {
  return (
    <span aria-hidden={ariaHidden} className="inline-flex items-center">
      {items.map((event, i) => {
        const addrClass = i % 2 === 0 ? "glow-m" : "glow-c";
        const action = event.type === "mint" ? "minted" : "placed";
        const target =
          badgeNames[event.badgeId] ?? formatBadgeFallback(event.badgeId);
        const key = `${event.type}-${event.wallet}-${event.badgeId}-${event.at}`;
        return (
          <Fragment key={key}>
            <span className="mx-3.5 opacity-50">·</span>
            <span className={addrClass}>{shortWallet(event.wallet)}</span>
            <span className="mx-1.5">{action}</span>
            <span className="text-yellow-neon">{target}</span>
          </Fragment>
        );
      })}
    </span>
  );
}

function formatBadgeFallback(badgeId: string): string {
  return badgeId.replace(/[-_]/g, " ").toUpperCase();
}
