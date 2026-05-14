import { Sk } from "@/components/loading/skeleton-primitives";
import { UI_LAYOUT } from "@/lib/ui-styles";

/** Mirrors `/my-land`: StatsRail + taller MapFrame island. */
export function MyLandLoadingSkeleton() {
  return (
    <div className={`${UI_LAYOUT.pageGrid} grid-cols-1 sm:grid-cols-[300px_1fr] md:grid-cols-[340px_1fr]`} aria-hidden>
      <div className="flex flex-col gap-3">
        <div className="border-2 border-border-neon bg-panel-2 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <Sk className="size-14 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Sk className="h-2.5 w-20" />
              <Sk className="h-5 w-32" />
              <Sk className="h-3 w-full" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Sk className="h-9 w-full" />
          <Sk className="h-9 w-full" />
          <Sk className="h-9 w-full" />
        </div>
        <div className="border-2 border-border-neon bg-panel p-3 flex flex-col gap-2">
          <Sk className="h-3 w-28 mb-1" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <Sk className="size-3 shrink-0" />
              <Sk className="h-3 flex-1 max-w-[160px]" />
            </div>
          ))}
        </div>
      </div>

      <div className="border-2 border-border-neon bg-panel relative overflow-hidden min-h-[360px] sm:min-h-[700px]">
        <div className="hidden sm:flex absolute left-4 top-2 gap-2.5 z-[1]">
          <Sk className="h-3 w-32" />
        </div>
        <div className="hidden sm:flex absolute right-2 top-2 z-[1]">
          <Sk className="h-9 w-36" />
        </div>
        <div className="flex min-h-[360px] items-center justify-center pt-10 sm:pt-11">
          <Sk className="w-[min(94%,940px)] aspect-[940/720] max-h-[min(78vh,720px)]" />
        </div>
      </div>
    </div>
  );
}
