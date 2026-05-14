import { Sk } from "@/components/loading/skeleton-primitives";
import { UI_LAYOUT } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

/** Mirrors `/land`: breadcrumb → mobile header row → MapFrame + PlacedObjectsList card. */
export function PublicLandLoadingSkeleton() {
  return (
    <div aria-hidden>
      <div className={cn(UI_LAYOUT.pageContainer, "pt-3 flex items-center gap-2 flex-wrap")}>
        <div className="flex items-center gap-1.5 min-w-0">
          <Sk className="h-3 w-24 shrink-0" />
          <Sk className="h-3 flex-1 min-w-[120px] max-w-xl" />
        </div>
      </div>

      <div
        className={cn(
          UI_LAYOUT.pageContainer,
          "grid gap-3 p-3 sm:gap-5 sm:p-6 grid-cols-1 md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_380px]",
        )}
      >
        <div className="flex sm:hidden flex-col gap-2 col-span-full">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sk className="size-10 shrink-0" />
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <Sk className="h-3.5 w-32" />
              <Sk className="h-2.5 w-full max-w-xs" />
            </div>
            <Sk className="h-8 w-20 shrink-0" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Sk className="h-8 w-16" />
            <Sk className="h-8 w-20" />
            <Sk className="h-8 w-20" />
          </div>
        </div>

        <div className="border-2 border-border-neon bg-panel relative overflow-hidden min-h-[300px] sm:h-[700px]">
          <div className="hidden sm:flex absolute left-4 top-2 z-[1]">
            <Sk className="h-3 w-36" />
          </div>
          <div className="hidden sm:flex absolute right-2 top-2 z-[1]">
            <Sk className="h-9 w-44" />
          </div>
          <div className="hidden sm:flex absolute left-4 top-12 z-[4] items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Sk className="size-10" />
              <div className="flex flex-col gap-1.5 min-w-0">
                <Sk className="h-3.5 w-28" />
                <Sk className="h-2.5 w-48 max-w-[260px]" />
              </div>
            </div>
          </div>
          <div className="flex h-full min-h-[300px] items-center justify-center pt-8 sm:pt-0">
            <Sk className="w-[min(92%,760px)] aspect-[760/560] max-h-[min(70vh,560px)]" />
          </div>
        </div>

        <div className="border-2 border-border-neon bg-panel-2 p-4 flex flex-col sm:min-h-[700px]">
          <div className="flex items-center gap-2 mb-2.5">
            <Sk className="h-3 w-40" />
            <Sk className="h-5 w-10" />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2 border-2 border-border-neon bg-bg-2/80">
                <Sk className="size-10 shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <Sk className="h-3.5 w-[75%] max-w-[200px]" />
                  <Sk className="h-2.5 w-[50%] max-w-[140px]" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t-2 border-dashed border-border-neon">
            <Sk className="h-3 w-full max-w-xs" />
          </div>
        </div>
      </div>
    </div>
  );
}
