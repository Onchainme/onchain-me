import { PageShell } from "@/components/dashboard/page-shell";
import { Hero } from "@/components/dashboard/hero";
import { LiveTicker } from "@/components/dashboard/live-ticker";
import { LandsExplorer } from "@/components/dashboard/lands-explorer";
import {
  fetchFeed,
  fetchLands,
  type FeedPage,
  type LandsPage,
} from "@/lib/api";

const INITIAL_SORT = "recent" as const;

/**
 * App entry / home dashboard. The marketing landing lives at `/`; this route
 * is where the "Open app" CTA lands and is also what the in-app `Home` nav
 * link points to. Clicking the app logo (Header) navigates back to `/`.
 */
export default async function AppHomePage() {
  const [landsResult, feedResult] = await Promise.allSettled([
    fetchLands({ sort: INITIAL_SORT, limit: 20 }),
    fetchFeed({ limit: 8 }),
  ]);

  const lands: LandsPage =
    landsResult.status === "fulfilled"
      ? landsResult.value
      : { items: [], nextCursor: null };

  const feed: FeedPage =
    feedResult.status === "fulfilled"
      ? feedResult.value
      : { items: [], nextCursor: null };

  return (
    <PageShell>
      <div className="max-w-[1280px] mx-auto px-3 pt-4 pb-8 sm:px-12 sm:pt-6 sm:pb-10 flex flex-col gap-3.5">
        <Hero />
        <LiveTicker initialItems={feed.items} />
        <LandsExplorer
          initialItems={lands.items}
          initialNextCursor={lands.nextCursor}
          initialSort={INITIAL_SORT}
        />
      </div>
    </PageShell>
  );
}
