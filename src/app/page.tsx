import { Landing } from "@/components/landing/landing";
import {
  fetchLand,
  fetchLands,
  fetchStats,
  type LandResponse,
  type StatsResponse,
} from "@/lib/api";

/**
 * Marketing landing — always shown at `/`. The app dashboard lives at `/home`
 * and the in-app Header logo navigates back here so the landing is reachable
 * at any time from inside the app.
 */
export default async function HomePage() {
  // Top-scoring land seeds the hero's PixiJS preview so it's always populated.
  // Stats power the LandingStats section. Both null on API failure — components
  // fall back to their static placeholders.
  let previewLand: LandResponse | null = null;
  let stats: StatsResponse | null = null;

  const [landsResult, statsResult] = await Promise.allSettled([
    fetchLands({ sort: "score", limit: 1 }),
    fetchStats(),
  ]);
  if (landsResult.status === "fulfilled") {
    const wallet = landsResult.value.items[0]?.wallet;
    if (wallet) {
      try {
        previewLand = await fetchLand(wallet);
      } catch {
        previewLand = null;
      }
    }
  }
  if (statsResult.status === "fulfilled") {
    stats = statsResult.value;
  }

  return <Landing previewLand={previewLand} stats={stats} />;
}
