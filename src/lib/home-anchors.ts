import type { LandsSort } from "@/lib/api";

/** Hash fragments for `/home` lands explorer tabs & time windows. */
export type HomeLandsHash = "newest-24h" | "7days" | "newest-all" | "top-points";

export const HOME_LANDS_HASH = {
  newest24h: "newest-24h",
  sevenDays: "7days",
  newestAll: "newest-all",
  topPoints: "top-points",
} as const satisfies Record<string, HomeLandsHash>;

const DAY_SEC = 60 * 60 * 24;

export function parseHomeHash(raw: string): { sort: LandsSort; windowSec: number } | null {
  const id = raw.replace(/^#/, "").trim().toLowerCase();
  switch (id) {
    case HOME_LANDS_HASH.newest24h:
      return { sort: "recent", windowSec: DAY_SEC };
    case HOME_LANDS_HASH.sevenDays:
      return { sort: "recent", windowSec: DAY_SEC * 7 };
    case HOME_LANDS_HASH.newestAll:
      return { sort: "recent", windowSec: 0 };
    case HOME_LANDS_HASH.topPoints:
      return { sort: "score", windowSec: 0 };
    default:
      return null;
  }
}

export function hashForLandsView(sort: LandsSort, windowSec: number): HomeLandsHash {
  if (sort === "score") return HOME_LANDS_HASH.topPoints;
  if (windowSec >= DAY_SEC * 7) return HOME_LANDS_HASH.sevenDays;
  if (windowSec >= DAY_SEC) return HOME_LANDS_HASH.newest24h;
  return HOME_LANDS_HASH.newestAll;
}

export function homeHashHref(hash: HomeLandsHash): string {
  return `/home#${hash}`;
}
