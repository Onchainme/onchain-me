import { PageShell } from "@/components/dashboard/page-shell";
import { MyLandLoadingSkeleton } from "@/components/loading/my-land-loading-skeleton";
import { RouteLoadingGate } from "@/components/loading/route-loading-gate";

export default function MyLandLoading() {
  return (
    <PageShell>
      <RouteLoadingGate>
        <MyLandLoadingSkeleton />
      </RouteLoadingGate>
    </PageShell>
  );
}
