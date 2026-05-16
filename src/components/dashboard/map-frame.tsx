import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { UI_TEXT } from "@/lib/ui-styles";

interface MapFrameProps {
  label: string;
  /** Instruction line beside the label — outside the island canvas. */
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function MapFrame({ label, hint, action, children }: MapFrameProps) {
  return (
    <Card
      padding="lg"
      className="relative overflow-hidden bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(168,85,247,0.18)_0%,var(--color-bg)_60%)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-3 sm:mb-4 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap">
          <div className="w-2 h-2 shrink-0 bg-cyan-neon shadow-[0_0_8px_var(--color-cyan-neon)]" />
          <span className="font-silk text-[12px] text-muted-neon tracking-[0.12em] uppercase">
            {label}
          </span>
          {hint ? (
            <>
              <span className="hidden sm:inline text-muted-neon-2 select-none" aria-hidden>
                ·
              </span>
              <span
                className={`${UI_TEXT.labelText} text-muted-neon truncate max-w-full hidden sm:inline`}
              >
                {hint}
              </span>
            </>
          ) : null}
        </div>
        {action ? (
          <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">{action}</div>
        ) : null}
      </div>
      {hint ? (
        <p className={`${UI_TEXT.labelText} text-muted-neon mb-3 sm:hidden pl-4`}>{hint}</p>
      ) : null}
      <div className="relative min-w-0">{children}</div>
    </Card>
  );
}
