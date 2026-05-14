import { Sk } from "@/components/loading/skeleton-primitives";

/**
 * Placeholder layout for `/` while the marketing RSC resolves (see `app/loading.tsx`).
 * Mirrors {@link LandingShell} header, {@link LandingHero} two-column hero, protocol strip,
 * and stacked {@link LandingSection}-style blocks + footer band.
 */
export function LandingLoadingSkeleton() {
  return (
    <div className="font-grotesk text-base min-[640px]:text-lg" aria-hidden>
      <header className="sticky top-0 z-50 border-b-2 border-border-neon bg-[rgba(10,6,18,0.7)] backdrop-blur-md">
        <div className="max-w-[1320px] mx-auto flex items-center gap-4 h-[68px] min-[640px]:h-[76px] px-3 min-[640px]:px-12">
          <div className="flex items-center gap-3 shrink-0">
            <Sk className="size-7 shrink-0" />
            <Sk className="h-4 w-28 min-[640px]:w-32" />
          </div>
          <div className="hidden min-[900px]:flex flex-1 justify-end gap-6">
            <Sk className="h-3 w-24" />
            <Sk className="h-3 w-20" />
            <Sk className="h-3 w-28" />
            <Sk className="h-3 w-16" />
          </div>
          <div className="flex-1 min-[900px]:hidden" />
          <div className="flex items-center gap-2 shrink-0">
            <Sk className="h-10 w-28 min-[900px]:w-32" />
            <Sk className="size-9 min-[900px]:hidden shrink-0" />
            <Sk className="h-10 w-32 hidden min-[900px]:block" />
          </div>
        </div>
      </header>

      <main>
        <section className="relative px-3 min-[640px]:px-12 pt-16 min-[640px]:pt-24 pb-16 min-[640px]:pb-28 overflow-hidden">
          <div className="relative max-w-[1320px] mx-auto grid gap-12 min-[900px]:gap-18 min-[900px]:grid-cols-[1.1fr_1fr] items-center">
            <div className="flex flex-col gap-6 min-w-0">
              <Sk className="h-3.5 w-56 max-w-full" />
              <Sk className="h-11 w-full max-w-[min(100%,20ch)] min-[768px]:h-14 min-[768px]:max-w-[24ch]" />
              <Sk className="h-11 w-full max-w-[min(100%,18ch)] min-[768px]:h-14 min-[768px]:max-w-[22ch]" />
              <Sk className="h-11 w-full max-w-[min(100%,16ch)] min-[768px]:h-14 min-[768px]:max-w-[18ch]" />
              <Sk className="h-24 w-full max-w-[58ch] min-[768px]:h-28" />
              <div className="flex flex-wrap gap-4 mt-2">
                <Sk className="h-12 w-[min(100%,260px)]" />
                <Sk className="h-12 w-[min(100%,260px)]" />
              </div>
            </div>
            <Sk className="aspect-square w-full max-w-[min(100%,520px)] mx-auto min-[900px]:max-w-none" />
          </div>
        </section>

        <div className="relative max-w-[1320px] mx-auto mt-12 min-[640px]:mt-16 px-3 min-[640px]:px-12 flex flex-wrap gap-3 items-center">
          <Sk className="h-3 w-36 hidden min-[640px]:block" />
          {Array.from({ length: 6 }, (_, i) => (
            <Sk key={i} className="h-9 min-w-[5.5rem] flex-1 max-w-[8rem] sm:flex-none sm:max-w-none" />
          ))}
          <Sk className="h-3 w-24 hidden sm:block" />
        </div>

        {Array.from({ length: 5 }, (_, s) => (
          <section
            key={s}
            className="relative py-20 min-[768px]:py-28 border-t-2 border-border-neon/40 first:border-t-0"
          >
            <div className="max-w-[1320px] mx-auto px-3 min-[640px]:px-12">
              <div className="flex flex-wrap justify-between items-end gap-8 mb-12 min-[768px]:mb-16">
                <div className="flex flex-col gap-3 max-w-[720px] w-full min-[768px]:w-auto">
                  <Sk className="h-3 w-40" />
                  <Sk className="h-10 w-full max-w-lg min-[768px]:h-12" />
                </div>
                <Sk className="h-16 w-full max-w-md min-[768px]:max-w-sm" />
              </div>
              <div className="grid gap-4 min-[768px]:grid-cols-2">
                <Sk className="h-40 min-[768px]:h-48" />
                <Sk className="h-40 min-[768px]:h-48" />
              </div>
            </div>
          </section>
        ))}

        <footer className="relative border-t-2 border-border-neon pt-12 pb-8 mt-4">
          <div className="max-w-[1320px] mx-auto px-3 min-[640px]:px-12">
            <div className="grid gap-10 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-[1.4fr_1fr_1fr_1fr]">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Sk className="size-7" />
                  <Sk className="h-4 w-32" />
                </div>
                <Sk className="h-20 w-full max-w-[36ch]" />
              </div>
              <div className="flex flex-col gap-2.5">
                <Sk className="h-3 w-24" />
                {Array.from({ length: 4 }, (_, i) => (
                  <Sk key={i} className="h-3 w-32" />
                ))}
              </div>
              <Sk className="hidden min-[1024px]:block h-32 col-span-2" />
            </div>
            <Sk className="h-16 w-full max-w-4xl mx-auto mt-12 opacity-60" />
            <div className="mt-10 pt-6 border-t-2 border-border-neon flex flex-wrap justify-between gap-4">
              <Sk className="h-3 w-48" />
              <Sk className="h-3 w-24" />
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
