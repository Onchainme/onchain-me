"use client";

import Link from "next/link";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LandCard } from "@/components/dashboard/land-card";
import {
  fetchLands,
  toLandSummary,
  type ApiLand,
  type LandsSort,
} from "@/lib/api";
import {
  HOME_LANDS_HASH,
  hashForLandsView,
  homeHashHref,
  parseHomeHash,
} from "@/lib/home-anchors";

const PAGE_SIZE = 10;

const SORTS: Array<[LandsSort, string, (typeof HOME_LANDS_HASH)[keyof typeof HOME_LANDS_HASH]]> =
  [
    ["recent", "Newest", HOME_LANDS_HASH.newest24h],
    ["score", "Top Points", HOME_LANDS_HASH.topPoints],
  ];

// Sliding-window options only shown while sort=recent. Value 0 == "all time"
// (no window). Numbers are seconds.
const RECENT_WINDOWS: Array<{
  value: number;
  label: string;
  hash: (typeof HOME_LANDS_HASH)[keyof typeof HOME_LANDS_HASH];
}> = [
  { value: 60 * 60 * 24, label: "Last 24h", hash: HOME_LANDS_HASH.newest24h },
  { value: 60 * 60 * 24 * 7, label: "Last 7 days", hash: HOME_LANDS_HASH.sevenDays },
  { value: 0, label: "All time", hash: HOME_LANDS_HASH.newestAll },
];

function formatWindowShort(secs: number | undefined): string {
  if (!secs) return "all time";
  if (secs >= 60 * 60 * 24 * 7) return `last ${Math.round(secs / (60 * 60 * 24))} days`;
  if (secs >= 60 * 60 * 24) return "last 24h";
  return `last ${Math.round(secs / 60)}m`;
}

// Bento grid: slot definitions for the 7 cards above the trailing 3-card row
// on page 1. Subsequent pages render a uniform 10-card grid.
const BENTO: Array<{ area: string; size: "sm" | "md" | "lg" | "xl" }> = [
  { area: "a", size: "xl" },
  { area: "b", size: "md" },
  { area: "c", size: "sm" },
  { area: "d", size: "sm" },
  { area: "e", size: "sm" },
  { area: "f", size: "sm" },
  { area: "g", size: "md" },
];

interface LandsExplorerProps {
  initialItems: ApiLand[];
  initialNextCursor: string | null;
  initialSort: LandsSort;
  /** Sliding-window cap (seconds) applied only to the "Newest" tab — matches
   *  the SSR fetch on /home so client re-fetches stay consistent. Undefined
   *  → no time cap (all-time history). */
  newestWindowSec?: number;
}

export function LandsExplorer({
  initialItems,
  initialNextCursor,
  initialSort,
  newestWindowSec,
}: LandsExplorerProps) {
  const [sort, setSort] = useState<LandsSort>(initialSort);
  // User-controlled time window for sort=recent. Initialised from the SSR
  // default (24h on /home) so the very-first paint stays consistent with the
  // server response we already rendered. 0 = no window cap (All time).
  const [windowSec, setWindowSec] = useState<number>(newestWindowSec ?? 0);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ApiLand[]>(initialItems);
  // Cursor used to fetch each page; index = page number (0-based). Page 0
  // always uses `null` (the API's "first page" sentinel).
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastSortRef = useRef(initialSort);
  // `undefined` on the very first render so the sort+window refetch effect
  // can distinguish "initial mount" from "user changed window".
  const lastWindowRef = useRef<number | undefined>(undefined);
  const applyingHashRef = useRef(false);
  const pageIndex = cursorStack.length - 1;

  const scrollToExplorer = useCallback(() => {
    document.getElementById("lands-explorer")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const applyHash = useCallback(
    (raw: string, scroll: boolean) => {
      const parsed = parseHomeHash(raw);
      if (!parsed) return;
      applyingHashRef.current = true;
      startTransition(() => {
        setSort(parsed.sort);
        setWindowSec(parsed.windowSec);
      });
      queueMicrotask(() => {
        applyingHashRef.current = false;
      });
      if (scroll) scrollToExplorer();
    },
    [scrollToExplorer],
  );

  // Deep links: /home#newest-24h, /home#7days, /home#top-points, …
  useEffect(() => {
    if (window.location.hash) applyHash(window.location.hash, true);
    const onHashChange = () => applyHash(window.location.hash, true);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [applyHash]);

  // Keep the URL hash in sync when the user changes tabs / windows in-app.
  useEffect(() => {
    if (applyingHashRef.current) return;
    if (lastWindowRef.current === undefined) return;
    const nextHash = `#${hashForLandsView(sort, windowSec)}`;
    if (window.location.hash === nextHash) return;
    const url = `${window.location.pathname}${window.location.search}${nextHash}`;
    history.replaceState(null, "", url);
  }, [sort, windowSec]);

  // Apply the user-selected window only when on the "Newest" tab —
  // sort=score on the API ignores withinSec anyway, but skipping it keeps the
  // query string clean and predictable. Value 0 = no cap.
  const windowForSort = (s: LandsSort) =>
    s === "recent" && windowSec > 0 ? windowSec : undefined;

  // Static-export builds (Capacitor / Android) can't reach the API at build
  // time, so server-fetched initialItems come back empty. Fetch once on mount
  // to recover. Web SSR populates initialItems → this branch is skipped.
  useEffect(() => {
    if (initialItems.length > 0) return;
    const ctrl = new AbortController();
    startTransition(() => {
      fetchLands({
        sort: initialSort,
        limit: PAGE_SIZE,
        includePlacements: true,
        withinSec: windowForSort(initialSort),
        signal: ctrl.signal,
      })
        .then((page) => {
          setItems(page.items);
          setNextCursor(page.nextCursor);
        })
        .catch((e: unknown) => {
          if (ctrl.signal.aborted) return;
          setError(e instanceof Error ? e.message : "Failed to load lands");
        });
    });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch page 1 whenever sort OR window changes. Skip the very first
  // render (lastSortRef holds initialSort and lastWindowRef is unset) so we
  // don't blow away the SSR data with an identical client fetch.
  useEffect(() => {
    const sortChanged = lastSortRef.current !== sort;
    const windowChanged =
      lastWindowRef.current !== undefined && lastWindowRef.current !== windowSec;
    if (!sortChanged && !windowChanged) {
      lastWindowRef.current = windowSec;
      return;
    }
    lastSortRef.current = sort;
    lastWindowRef.current = windowSec;

    const ctrl = new AbortController();
    setError(null);
    setLoading(true);
    fetchLands({
      sort,
      limit: PAGE_SIZE,
      includePlacements: true,
      withinSec: windowForSort(sort),
      signal: ctrl.signal,
    })
      .then((page) => {
        setItems(page.items);
        setNextCursor(page.nextCursor);
        setCursorStack([null]);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load lands");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [sort, windowSec]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.wallet.toLowerCase().includes(q));
  }, [items, query]);

  const summaries = useMemo(() => filtered.map(toLandSummary), [filtered]);
  // Page 1 uses bento (7 slots) + 3-card tail row; other pages render a flat
  // 10-card grid.
  const isFirstPage = pageIndex === 0;
  const bento = isFirstPage ? summaries.slice(0, BENTO.length) : [];
  const rest = isFirstPage ? summaries.slice(BENTO.length) : summaries;

  const canNext = !!nextCursor && !query && !loading;
  const canPrev = pageIndex > 0 && !query && !loading;

  async function goToPage(cursor: string | null, nextStack: Array<string | null>) {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchLands({
        sort,
        cursor: cursor ?? undefined,
        limit: PAGE_SIZE,
        includePlacements: true,
        withinSec: windowForSort(sort),
      });
      setItems(page.items);
      setNextCursor(page.nextCursor);
      setCursorStack(nextStack);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load page");
    } finally {
      setLoading(false);
    }
  }

  function goNext() {
    if (!canNext || nextCursor == null) return;
    void goToPage(nextCursor, [...cursorStack, nextCursor]);
  }

  function goPrev() {
    if (!canPrev) return;
    const prevStack = cursorStack.slice(0, -1);
    const prevCursor = prevStack[prevStack.length - 1] ?? null;
    void goToPage(prevCursor, prevStack);
  }

  return (
    <div id="lands-explorer" className="flex flex-col gap-3.5 scroll-mt-24">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 flex-wrap">
          {SORTS.map(([k, label, hash]) => (
            <Badge key={k} variant={sort === k ? "chip-on" : "chip"} asChild>
              <Link
                href={homeHashHref(hash)}
                scroll={false}
                aria-disabled={loading}
                className={loading ? "pointer-events-none opacity-60" : undefined}
                onClick={() => {
                  setSort(k);
                  if (k === "recent") setWindowSec(60 * 60 * 24);
                }}
              >
                {label}
              </Link>
            </Badge>
          ))}
        </div>
        {/* Time-window selector — only visible on the Newest tab. Hidden under
            Top Points because the leaderboard sort doesn't honor withinSec. */}
        {sort === "recent" ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-silk text-[10px] text-muted-neon tracking-[0.14em]">
              SHOW:
            </span>
            {RECENT_WINDOWS.map((w) => (
              <Badge
                key={w.value}
                variant={windowSec === w.value ? "chip-on" : "chip"}
                asChild
              >
                <Link
                  href={homeHashHref(w.hash)}
                  scroll={false}
                  aria-disabled={loading}
                  className={loading ? "pointer-events-none opacity-60" : undefined}
                  onClick={() => setWindowSec(w.value)}
                >
                  {w.label}
                </Link>
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="hidden sm:block flex-1" />
        <Input
          className="w-full sm:w-56"
          placeholder="SEARCH WALLET..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error ? (
        <div className="font-silk text-[12px] text-magenta-neon">{error}</div>
      ) : null}

      {loading ? (
        <div className="font-silk text-[12px] text-muted-neon">LOADING…</div>
      ) : null}

      {!loading && summaries.length === 0 ? (
        <EmptyState
          sort={sort}
          query={query}
          windowSec={windowSec}
          onSwitchSort={() => setSort("score")}
          onWidenWindow={() => setWindowSec(0)}
        />
      ) : null}

      {bento.length > 0 ? (
        <div className="bento-grid">
          {bento.map((land, i) => (
            <div
              key={`${land.address}-${i}`}
              className="land-card-slot"
              style={{ gridArea: BENTO[i].area, minHeight: 0 }}
            >
              <LandCard land={land} size={BENTO[i].size} />
            </div>
          ))}
        </div>
      ) : null}

      {rest.length > 0 ? (
        <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {rest.map((land, i) => (
            <div key={`${land.address}-rest-${i}`} className="land-card-slot">
              <LandCard land={land} size="sm" />
            </div>
          ))}
        </div>
      ) : null}

      {!query && (canPrev || canNext || pageIndex > 0) ? (
        <div className="flex items-center justify-center gap-3.5 pt-2">
          <Button variant="outline" onClick={goPrev} disabled={!canPrev}>
            ← PREV
          </Button>
          <span className="font-silk text-[12px] text-muted-neon tracking-widest">
            PAGE {pageIndex + 1}
          </span>
          <Button variant="outline" onClick={goNext} disabled={!canNext}>
            NEXT →
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Context-aware empty state. Tells the user *why* the grid is empty (search
 * came up dry / time window is too tight / nobody minted yet) and what they
 * can click to recover — instead of a generic "NO LANDS FOUND".
 */
function EmptyState({
  sort,
  query,
  windowSec,
  onSwitchSort,
  onWidenWindow,
}: {
  sort: LandsSort;
  query: string;
  windowSec: number;
  onSwitchSort: () => void;
  onWidenWindow: () => void;
}) {
  if (query) {
    return (
      <div className="font-silk text-[12px] text-muted-neon py-8 text-center">
        No wallets match <span className="text-cyan-neon">{query}</span>.
      </div>
    );
  }
  if (sort === "recent" && windowSec > 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <div className="font-silk text-[12px] text-muted-neon">
          No new wallets in the {formatWindowShort(windowSec)}.
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <Badge variant="chip" asChild>
            <Link
              href={homeHashHref(HOME_LANDS_HASH.newestAll)}
              scroll={false}
              onClick={onWidenWindow}
            >
              Show all time
            </Link>
          </Badge>
          <Badge variant="chip" asChild>
            <Link
              href={homeHashHref(HOME_LANDS_HASH.topPoints)}
              scroll={false}
              onClick={onSwitchSort}
            >
              Check Top Points →
            </Link>
          </Badge>
        </div>
      </div>
    );
  }
  return (
    <div className="font-silk text-[12px] text-muted-neon py-8 text-center">
      No lands yet — be the first.
    </div>
  );
}
