import { PageShell } from "@/components/dashboard/page-shell";
import { Hero } from "@/components/dashboard/hero";
import { LiveTicker } from "@/components/dashboard/live-ticker";
import { LandsExplorer } from "@/components/dashboard/lands-explorer";
import {
  fetchBadges,
  fetchFeed,
  fetchLands,
  type FeedPage,
  type LandsPage,
} from "@/lib/api";

const INITIAL_SORT = "recent" as const;

export default async function HomePage() {
  const [landsResult, feedResult, badgesResult] = await Promise.allSettled([
    fetchLands({ sort: INITIAL_SORT, limit: 20 }),
    fetchFeed({ limit: 8 }),
    fetchBadges(),
  ]);

  const lands: LandsPage =
    landsResult.status === "fulfilled"
      ? landsResult.value
      : { items: [], nextCursor: null };

  const feed: FeedPage =
    feedResult.status === "fulfilled"
      ? feedResult.value
      : { items: [], nextCursor: null };

  const badgeNames: Record<string, string> =
    badgesResult.status === "fulfilled"
      ? Object.fromEntries(badgesResult.value.map((b) => [b.id, b.name]))
      : {};

  return (
    <PageShell>
      <div className="max-w-[1280px] mx-auto px-12 pt-6 pb-10 flex flex-col gap-3.5">
        <Hero />
        <LiveTicker initialItems={feed.items} badgeNames={badgeNames} />
        <LandsExplorer
          initialItems={lands.items}
          initialNextCursor={lands.nextCursor}
          initialSort={INITIAL_SORT}
        />
      </div>
    </PageShell>
  );
}
