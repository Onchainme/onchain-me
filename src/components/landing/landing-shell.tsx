import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LandingHeader } from "./landing-header";

interface LandingShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Landing-only page chrome. Owns its header. The wallet connect modal is
 * mounted by the app's {@link PageShell} — the landing CTAs route into
 * `/home`, where connect happens via the app Header.
 */
export function LandingShell({ children, className }: LandingShellProps) {
  return (
    <div className={cn("landing-root min-h-screen", className)}>
      <div
        aria-hidden
        className="bg-grid-fade pointer-events-none fixed inset-0 -z-10"
      />
      <LandingHeader />
      <main className="font-grotesk text-base min-[640px]:text-lg text-ink-2">
        {children}
      </main>
    </div>
  );
}
