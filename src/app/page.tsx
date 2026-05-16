import { Landing } from "@/components/landing/landing";
import {
  fetchLand,
  fetchLands,
  fetchStats,
  type LandResponse,
  type StatsResponse,
} from "@/lib/api";

import { MobileEntry } from "./mobile-entry";

// `process.env.NEXT_PUBLIC_*` is inlined at build time, so this constant
// becomes a literal `true`/`false` after compilation and Webpack drops the
// dead branch from the bundle (the Landing imports stay because they're
// top-level, but their runtime cost is gone on mobile).
const IS_MOBILE_BUILD = process.env.NEXT_PUBLIC_PLATFORM === "mobile";

/**
 * Root route (`/`).
 *
 * Web (apex onchainme.to): renders the marketing landing. The app's Header
 * logo links back here so the landing is reachable from inside the app.
 *
 * Mobile (Capacitor static export): there is no landing in the APK — bounce
 * straight to the dashboard at `/home`. The `proxy` that normally redirects
 * `/` → `/home` on app.onchainme.to does not run inside the WebView, so we
 * redirect from the page itself.
 */
export default async function HomePage() {
  if (IS_MOBILE_BUILD) {
    return <MobileEntry />;
  }

  // Top-scoring land seeds the hero's PixiJS preview so it's always populated.
  // Stats power the LandingStats section. Both null on API failure — components
  // fall back to their static placeholders.
  let previewLand: LandResponse | null = null;
  let stats: StatsResponse | null = null;

  const [landsResult, statsResult] = await Promise.allSettled([
    fetchLands({ sort: "score", limit: 1, includePlacements: true }),
    fetchStats(),
  ]);
  if (landsResult.status === "fulfilled") {
    const top = landsResult.value.items[0];
    if (top) {
      previewLand = {
        wallet: top.wallet,
        stats: top.stats,
        placements: top.placements ?? [],
        ogImageUrl: top.ogImageUrl,
      };
      if (top.placements == null) {
        try {
          previewLand = await fetchLand(top.wallet);
        } catch {
          previewLand = null;
        }
      }
    }
  }
  if (statsResult.status === "fulfilled") {
    stats = statsResult.value;
  }

  return <Landing previewLand={previewLand} stats={stats} />;
}
