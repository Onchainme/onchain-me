import { PageShell } from "@/components/dashboard/page-shell";
import { EditLoadingSkeleton } from "@/components/loading/edit-loading-skeleton";
import { RouteLoadingGate } from "@/components/loading/route-loading-gate";

export default function EditLoading() {
  return (
    <PageShell>
      <RouteLoadingGate>
        <EditLoadingSkeleton />
      </RouteLoadingGate>
    </PageShell>
  );
}
