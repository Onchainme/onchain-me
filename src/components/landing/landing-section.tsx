import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LandingSectionProps {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Shared section frame for landing blocks. Mirrors the mockup header grid:
 * JetBrains Mono eyebrow with cyan dot, large Space Grotesk title, and an
 * optional muted lead aligned to the right.
 */
export function LandingSection({
  id,
  eyebrow,
  title,
  lead,
  children,
  className,
}: LandingSectionProps) {
  return (
    <section
      id={id}
      className={cn("relative py-20 sm:py-28", className)}
    >
      <div className="max-w-[1320px] mx-auto px-3 sm:px-12">
        {(eyebrow || title || lead) && (
          <div className="flex flex-wrap justify-between items-end gap-8 mb-12 sm:mb-16">
            <div className="max-w-[720px]">
              {eyebrow && (
                <span className="inline-flex items-center gap-3 font-jetbrains text-[12px] text-cyan-neon">
                  <span className="inline-block size-2.5 bg-cyan-neon shadow-[0_0_10px_var(--color-cyan-neon)]" />
                  {eyebrow}
                </span>
              )}
              {title && (
                <h2 className="font-grotesk text-[34px] sm:text-[48px] md:text-[60px] font-bold leading-[1.05] mt-4 tracking-[-0.02em] text-balance">
                  {title}
                </h2>
              )}
            </div>
            {lead && (
              <p className="font-grotesk text-[18px] sm:text-[22px] text-muted-neon max-w-[56ch] leading-[1.5] text-pretty">
                {lead}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
