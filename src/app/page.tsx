import { Landing } from "@/components/landing/landing";
import {
  fetchLand,
  fetchLands,
  type LandResponse,
} from "@/lib/api";

/**
 * Marketing landing — always shown at `/`. The app dashboard lives at `/home`
 * and the in-app Header logo navigates back here so the landing is reachable
 * at any time from inside the app.
 */
export default async function HomePage() {
  // Most recent land seeds the hero's PixiJS preview. Null when the API is
  // unreachable or there are no lands yet (hero falls back to MiniIsland SVG).
  let previewLand: LandResponse | null = null;
  try {
    const list = await fetchLands({ sort: "recent", limit: 1 });
    const wallet = list.items[0]?.wallet;
    if (wallet) previewLand = await fetchLand(wallet);
  } catch {
    previewLand = null;
  }

  return <Landing previewLand={previewLand} />;
}
