"use client";

import { useMemo } from "react";
import { PageShell } from "@/components/dashboard/page-shell";
import { Hero } from "@/components/dashboard/hero";
import { LiveTicker } from "@/components/dashboard/live-ticker";
import {
  LandFilters,
  useLandFilters,
  type Filter,
} from "@/components/dashboard/land-filters";
import { LandCard } from "@/components/dashboard/land-card";
import { LAND_DIRECTORY } from "@/lib/mock-data";
import type { LandSummary } from "@/lib/types";

// Bento grid — slot definitions for the 7 cards under the hero.
// `area` maps into the parent's gridTemplateAreas string.
const BENTO: Array<{ area: string; size: "sm" | "md" | "lg" }> = [
  { area: "b", size: "lg" },
  { area: "c", size: "md" },
  { area: "d", size: "md" },
  { area: "e", size: "md" },
  { area: "f", size: "sm" },
  { area: "g", size: "sm" },
  { area: "h", size: "sm" },
];

function sortLands(lands: LandSummary[], filter: Filter, query: string) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? lands.filter((l) => l.address.toLowerCase().includes(q))
    : [...lands];

  switch (filter) {
    case "top":
      return filtered.sort((a, b) => b.points - a.points);
    case "most":
      return filtered.sort((a, b) => b.objectsCount - a.objectsCount);
    case "newest":
      return filtered.reverse();
    default:
      return filtered;
  }
}

export default function HomePage() {
  const { query, setQuery, active, setActive } = useLandFilters();
  const lands = useMemo(
    () => sortLands(LAND_DIRECTORY, active, query),
    [active, query],
  );
  const [featured, ...rest] = lands.length ? lands : [LAND_DIRECTORY[0]];

  return (
    <PageShell>
      <div className="max-w-[1280px] mx-auto px-12 pt-6 pb-10 flex flex-col gap-3.5">
        <Hero />
        <LiveTicker />
        <LandFilters
          query={query}
          onQueryChange={setQuery}
          active={active}
          onActiveChange={setActive}
        />
        {featured ? <LandCard land={featured} size="xl" /> : null}
        <div
          className="grid gap-3.5 min-h-[360px]"
          style={{
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows: "repeat(2, 1fr)",
            gridTemplateAreas: '"b b c d" "e f g h"',
          }}
        >
          {rest.slice(0, BENTO.length).map((land, i) => (
            <div
              key={land.address}
              style={{ gridArea: BENTO[i].area, minHeight: 0 }}
            >
              <LandCard land={land} size={BENTO[i].size} />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
