"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type Filter = "all" | "top" | "newest" | "most";

const FILTERS: Array<[Filter, string]> = [
  ["all", "All Lands"],
  ["top", "Top Points"],
  ["newest", "Newest"],
  ["most", "Most Objects"],
];

interface LandFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  active: Filter;
  onActiveChange: (f: Filter) => void;
}

export function LandFilters({
  query,
  onQueryChange,
  active,
  onActiveChange,
}: LandFiltersProps) {
  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {FILTERS.map(([k, label]) => (
        <Badge
          key={k}
          variant={active === k ? "chip-on" : "chip"}
          asChild
        >
          <button type="button" onClick={() => onActiveChange(k)}>
            {label}
          </button>
        </Badge>
      ))}
      <div className="flex-1" />
      <Input
        className={cn("w-56")}
        placeholder="SEARCH WALLET..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
    </div>
  );
}

export function useLandFilters() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Filter>("all");
  return { query, setQuery, active, setActive };
}

export type { Filter };
