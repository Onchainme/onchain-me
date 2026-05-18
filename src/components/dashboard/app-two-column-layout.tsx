import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { UI_LAYOUT } from "@/lib/ui-styles";

interface AppTwoColumnLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  /** Map-first on md+ (public land). Default: sidebar left. */
  mapFirst?: boolean;
  className?: string;
}

/**
 * Shared shell for edit / my-land / public land: fixed sidebar width + main
 * column with consistent outer padding and grid gaps.
 */
export function AppTwoColumnLayout({
  sidebar,
  children,
  mapFirst = false,
  className,
}: AppTwoColumnLayoutProps) {
  return (
    <div
      className={cn(
        UI_LAYOUT.pageGrid,
        mapFirst ? UI_LAYOUT.twoColumnMapFirst : UI_LAYOUT.twoColumn,
        className,
      )}
    >
      <aside
        className={cn(
          UI_LAYOUT.sidebar,
          mapFirst && "md:col-start-2 md:row-start-1",
        )}
      >
        {sidebar}
      </aside>
      <div className={cn("min-w-0", mapFirst && "md:col-start-1 md:row-start-1")}>
        {children}
      </div>
    </div>
  );
}
