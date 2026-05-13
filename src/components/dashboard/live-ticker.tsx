"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { fetchFeed, type FeedItem } from "@/lib/api";
import { shortWallet } from "@/lib/utils";

const POLL_INTERVAL_MS = 15_000;
const MAX_ITEMS = 8;

interface LiveTickerProps {
  initialItems: FeedItem[];
  badgeNames?: Record<string, string>;
}

export function LiveTicker({ initialItems, badgeNames = {} }: LiveTickerProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const visibleRef = useRef(true);

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

    // Static-export builds bake an empty feed into the HTML because the API is
    // unreachable from the build host. Fire one tick immediately so the ticker
    // populates on first paint instead of waiting a full poll interval.
    if (initialItems.length === 0) void tick();

    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      ctrl.abort();
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex items-start sm:items-center gap-2 sm:gap-3.5 flex-wrap text-muted-neon">
        <span className="font-silk text-[12px] glow-c tracking-widest">◉ LIVE</span>
        <span className="font-pixel-body text-base opacity-60">no recent activity</span>
      </div>
    );
  }

  return (
    <div className="flex items-start sm:items-center gap-2 sm:gap-3.5 flex-wrap text-muted-neon">
      <span className="font-silk text-[12px] glow-c tracking-widest shrink-0">◉ LIVE</span>
      <span className="font-pixel-body text-sm sm:text-base break-words min-w-0">
        {items.slice(0, MAX_ITEMS).map((event, i) => {
          const addrClass = i % 2 === 0 ? "glow-m" : "glow-c";
          const action = event.type === "mint" ? "minted" : "placed";
          const target =
            badgeNames[event.badgeId] ?? formatBadgeFallback(event.badgeId);
          const key = `${event.type}-${event.wallet}-${event.badgeId}-${event.at}`;
          return (
            <Fragment key={key}>
              <span className={addrClass}>{shortWallet(event.wallet)}</span>{" "}
              {action} <span className="text-yellow-neon">{target}</span>
              {i < Math.min(items.length, MAX_ITEMS) - 1 ? (
                <span className="opacity-50 mx-3.5">·</span>
              ) : null}
            </Fragment>
          );
        })}
      </span>
    </div>
  );
}

function formatBadgeFallback(badgeId: string): string {
  return badgeId.replace(/[-_]/g, " ").toUpperCase();
}