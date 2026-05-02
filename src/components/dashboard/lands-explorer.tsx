"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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

const PAGE_SIZE = 20;

const SORTS: Array<[LandsSort, string]> = [
  ["recent", "Newest"],
  ["score", "Top Points"],
];

// Bento grid: slot definitions for the 7 cards under the featured XL card.
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
  const [cursor, setCursor] = useState<string | null>(initialNextCursor);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const lastSortRef = useRef(initialSort);

  // Refetch the first page when sort changes.
  useEffect(() => {
    if (lastSortRef.current === sort) return;
    lastSortRef.current = sort;

    const ctrl = new AbortController();
    setError(null);
    startTransition(() => {
      fetchLands({ sort, limit: PAGE_SIZE, signal: ctrl.signal })
        .then((page) => {
          setItems(page.items);
          setCursor(page.nextCursor);
        })
        .catch((e: unknown) => {
          if (ctrl.signal.aborted) return;
          setError(e instanceof Error ? e.message : "Failed to load lands");
        });
    });
    return () => ctrl.abort();
  }, [sort]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.wallet.toLowerCase().includes(q));
  }, [items, query]);

  const summaries = useMemo(() => filtered.map(toLandSummary), [filtered]);
  const bento = summaries.slice(0, BENTO.length);
  const more = summaries.slice(BENTO.length);

  const canLoadMore = !!cursor && !query;

  async function loadMore() {
    if (!cursor || isLoadingMore) return;
    setIsLoadingMore(true);
    setError(null);
    try {
      const page = await fetchLands({ sort, cursor, limit: PAGE_SIZE });
      setItems((prev) => mergeUnique(prev, page.items));
      setCursor(page.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-2.5 flex-wrap">
        {SORTS.map(([k, label]) => (
          <Badge key={k} variant={sort === k ? "chip-on" : "chip"} asChild>
            <button
              type="button"
              onClick={() => setSort(k)}
              disabled={isPending}
            >
              {label}
            </button>
          </Badge>
        ))}
        <div className="flex-1" />
        <Input
          className="w-56"
          placeholder="SEARCH WALLET..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error ? (
        <div className="font-silk text-[12px] text-magenta-neon">{error}</div>
      ) : null}

      {isPending ? (
        <div className="font-silk text-[12px] text-muted-neon">LOADING…</div>
      ) : null}

      {!isPending && summaries.length === 0 ? (
        <div className="font-silk text-[12px] text-muted-neon py-8 text-center">
          NO LANDS FOUND
        </div>
      ) : null}

      {bento.length > 0 ? (
        <div
          className="grid gap-3.5"
          style={{
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows: "repeat(3, minmax(180px, 1fr))",
            gridTemplateAreas: '"a a b c" "a a b d" "e f g g"',
          }}
        >
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

      {more.length > 0 ? (
        <div className="grid gap-3.5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {more.map((land, i) => (
            <LandCard key={`${land.address}-more-${i}`} land={land} size="sm" />
          ))}
        </div>
      ) : null}

      {canLoadMore ? (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "LOADING…" : "LOAD MORE"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function mergeUnique(prev: ApiLand[], next: ApiLand[]): ApiLand[] {
  const seen = new Set(prev.map((p) => p.wallet));
  const merged = [...prev];
  for (const item of next) {
    if (!seen.has(item.wallet)) {
      merged.push(item);
      seen.add(item.wallet);
    }
  }
  return merged;
}
