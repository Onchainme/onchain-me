import { Sk } from "@/components/loading/skeleton-primitives";
import { UI_LAYOUT } from "@/lib/ui-styles";

/** Mirrors `/edit`: StatsRail column + Mint/Scan + Inventory + MapFrame island. */
export function EditLoadingSkeleton() {
  return (
    <div className={`${UI_LAYOUT.pageGrid} grid-cols-1 sm:grid-cols-[300px_1fr] md:grid-cols-[340px_1fr]`} aria-hidden>
      <div className="flex flex-col gap-3">
        <div className="border-2 border-border-neon bg-panel-2 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <Sk className="size-14 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Sk className="h-2.5 w-20" />
              <Sk className="h-5 w-28" />
              <Sk className="h-3 w-full" />
            </div>
          </div>
        </div>
        <Sk className="h-11 w-full" />
        <Sk className="h-9 w-full" />
        <Sk className="h-2 w-full max-w-[200px] mx-auto" />
        <div className="border-2 border-border-neon bg-panel p-3 flex flex-col gap-2">
          <div className="flex gap-1">
            <Sk className="h-8 flex-1" />
            <Sk className="h-8 flex-1" />
            <Sk className="h-8 flex-1" />
          </div>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <Sk className="size-10 shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                <Sk className="h-3 w-[75%] max-w-[180px]" />
                <Sk className="h-2.5 w-[50%] max-w-[120px]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-2 border-border-neon bg-panel relative overflow-hidden min-h-[360px] sm:min-h-[760px]">
        <div className="hidden sm:flex absolute left-4 top-2 gap-2.5 z-[1]">
          <Sk className="h-3 w-28" />
        </div>
        <div className="hidden sm:flex absolute right-2 top-2 z-[1]">
          <Sk className="h-9 w-36" />
        </div>
        <div className="flex h-full min-h-[360px] items-center justify-center pt-10 sm:pt-0">
          <Sk className="w-[min(92%,900px)] aspect-[900/680] max-h-[min(72vh,680px)]" />
        </div>
        <Sk className="absolute bottom-3 left-3 h-3 w-64 max-w-[85%] sm:bottom-4 sm:left-4" />
      </div>
    </div>
  );
}
