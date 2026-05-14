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
}

export function LandsExplorer({
  initialItems,
  initialNextCursor,
  initialSort,
}: LandsExplorerProps) {
  const [sort, setSort] = useState<LandsSort>(initialSort);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ApiLand[]>(initialItems);
  // Cursor used to fetch each page; index = page number (0-based). Page 0
  // always uses `null` (the API's "first page" sentinel).
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastSortRef = useRef(initialSort);
  const pageIndex = cursorStack.length - 1;

  // Static-export builds (Capacitor / Android) can't reach the API at build
  // time, so server-fetched initialItems come back empty. Fetch once on mount
  // to recover. Web SSR populates initialItems → this branch is skipped.
  useEffect(() => {
    if (initialItems.length > 0) return;
    const ctrl = new AbortController();
    startTransition(() => {
      fetchLands({ sort: initialSort, limit: PAGE_SIZE, signal: ctrl.signal })
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

  // Refetch page 1 whenever sort changes.
  useEffect(() => {
    if (lastSortRef.current === sort) return;
    lastSortRef.current = sort;

    const ctrl = new AbortController();
    setError(null);
    setLoading(true);
    fetchLands({ sort, limit: PAGE_SIZE, signal: ctrl.signal })
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
  }, [sort]);

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
      const page = await fetchLands({ sort, cursor: cursor ?? undefined, limit: PAGE_SIZE });
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
        <div className="font-silk text-[12px] text-muted-neon py-8 text-center">
          NO LANDS FOUND
        </div>
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
