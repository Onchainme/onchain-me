import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface MapFrameProps {
  label: string;
  action?: ReactNode;
  children: ReactNode;
}

export function MapFrame({ label, action, children }: MapFrameProps) {
  return (
    <Card
      padding="lg"
      className="relative overflow-hidden bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(168,85,247,0.18)_0%,var(--color-bg)_60%)]"
    >
      <div className="hidden sm:flex absolute left-4 top-3.5 items-center gap-2.5 z-10">
        <div className="w-2 h-2 bg-cyan-neon shadow-[0_0_8px_var(--color-cyan-neon)]" />
        <span className="font-silk text-[12px] text-muted-neon tracking-[0.12em]">
          {label}
        </span>
      </div>
      {action ? (
        <div className="absolute right-2 top-2 sm:right-4 sm:top-3.5 z-10">{action}</div>
      ) : null}
      {children}
    </Card>
  );
}
