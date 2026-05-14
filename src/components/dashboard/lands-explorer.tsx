"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
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

const PAGE_SIZE = 10;

const SORTS: Array<[LandsSort, string]> = [
  ["recent", "Newest"],
  ["score", "Top Points"],
];

// Sliding-window options only shown while sort=recent. Value 0 == "all time"
// (no window). Numbers are seconds.
const RECENT_WINDOWS: Array<{ value: number; label: string }> = [
  { value: 60 * 60 * 24, label: "Last 24h" },
  { value: 60 * 60 * 24 * 7, label: "Last 7 days" },
  { value: 0, label: "All time" },
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
  const pageIndex = cursorStack.length - 1;

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
        signal: ctrl.signal,
        withinSec: windowForSort(initialSort),
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
      signal: ctrl.signal,
      withinSec: windowForSort(sort),
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
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 flex-wrap">
          {SORTS.map(([k, label]) => (
            <Badge key={k} variant={sort === k ? "chip-on" : "chip"} asChild>
              <button
                type="button"
                onClick={() => setSort(k)}
                disabled={loading}
              >
                {label}
              </button>
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
                <button
                  type="button"
                  onClick={() => setWindowSec(w.value)}
                  disabled={loading}
                >
                  {w.label}
                </button>
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
            <LandCard key={`${land.address}-rest-${i}`} land={land} size="sm" />
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
            <button type="button" onClick={onWidenWindow}>
              Show all time
            </button>
          </Badge>
          <Badge variant="chip" asChild>
            <button type="button" onClick={onSwitchSort}>
              Check Top Points →
            </button>
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
