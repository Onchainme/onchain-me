import { LandingLoadingSkeleton } from "@/components/loading/landing-loading-skeleton";
import { RouteLoadingGate } from "@/components/loading/route-loading-gate";

/**
 * Instant UI for `/` while the marketing page RSC streams (first visit or
 * navigating back from the app). Nested routes use their own `loading.tsx`.
 */
export default function RootPageLoading() {
  return (
    <div className="landing-root min-h-screen text-ink-2">
      <div
        aria-hidden
        className="bg-grid-fade pointer-events-none fixed inset-0 -z-10"
      />
      <RouteLoadingGate>
        <LandingLoadingSkeleton />
      </RouteLoadingGate>
    </div>
  );
}
