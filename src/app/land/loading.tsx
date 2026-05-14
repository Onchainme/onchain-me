import { PageShell } from "@/components/dashboard/page-shell";
import { PublicLandLoadingSkeleton } from "@/components/loading/public-land-loading-skeleton";
import { RouteLoadingGate } from "@/components/loading/route-loading-gate";

export default function PublicLandLoading() {
  return (
    <PageShell>
      <RouteLoadingGate>
        <PublicLandLoadingSkeleton />
      </RouteLoadingGate>
    </PageShell>
  );
}
