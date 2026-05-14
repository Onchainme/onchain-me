import { PageShell } from "@/components/dashboard/page-shell";
import { HomeLoadingSkeleton } from "@/components/loading/home-loading-skeleton";
import { RouteLoadingGate } from "@/components/loading/route-loading-gate";

export default function HomeLoading() {
  return (
    <PageShell>
      <RouteLoadingGate>
        <HomeLoadingSkeleton />
      </RouteLoadingGate>
    </PageShell>
  );
}
