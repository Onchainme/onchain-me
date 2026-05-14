import { Sk } from "@/components/loading/skeleton-primitives";

const BENTO_AREAS = ["a", "b", "c", "d", "e", "f", "g"] as const;

/** Mirrors `/home`: Hero → LiveTicker → LandsExplorer (toolbar + bento + row). */
export function HomeLoadingSkeleton() {
  return (
    <div
      className="max-w-[1280px] mx-auto px-3 pt-4 pb-8 sm:px-12 sm:pt-6 sm:pb-10 flex flex-col gap-3.5"
      aria-hidden
    >
      {/* Hero card */}
      <div className="border-2 border-border-neon bg-[linear-gradient(90deg,rgba(255,45,147,0.08),rgba(34,211,238,0.04)_60%,transparent)] p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <Sk className="h-[86px] w-[118px] shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <Sk className="h-2.5 w-32" />
            <Sk className="h-5 w-full max-w-[min(100%,28rem)]" />
            <Sk className="h-5 w-full max-w-[min(100%,32rem)]" />
            <Sk className="h-4 w-64 max-w-full" />
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[200px]">
            <Sk className="h-11 w-full sm:min-w-[200px]" />
            <Sk className="h-9 w-full" />
          </div>
        </div>
      </div>

      {/* Live ticker row */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        <Sk className="h-4 w-16 shrink-0" />
        <Sk className="h-7 flex-1 min-w-0" />
      </div>

      {/* LandsExplorer */}
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <Sk className="h-8 w-[5.5rem]" />
            <Sk className="h-8 w-[6.5rem]" />
          </div>
          <div className="hidden sm:block flex-1 min-w-2" />
          <Sk className="h-10 w-full sm:w-56" />
        </div>

        <div className="bento-grid">
          {BENTO_AREAS.map((area) => (
            <Sk
              key={area}
              className="min-h-[120px] sm:min-h-[140px] lg:min-h-[180px]"
              style={{ gridArea: area, minHeight: 0 }}
            />
          ))}
        </div>

        <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 3 }, (_, i) => (
            <Sk key={i} className="h-40 sm:h-48" />
          ))}
        </div>

        <div className="flex items-center justify-center gap-3.5 pt-1">
          <Sk className="h-10 w-24" />
          <Sk className="h-4 w-20" />
          <Sk className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}
