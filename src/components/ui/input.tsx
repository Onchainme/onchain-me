import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-none border-2 border-border-neon bg-bg px-2.5 py-2 font-pixel-body text-[17px] text-ink outline-none",
        "placeholder:text-muted-neon placeholder:font-silk placeholder:text-[11px] placeholder:tracking-widest",
        "focus-visible:border-cyan-neon focus-visible:shadow-[0_0_12px_rgba(34,211,238,0.3)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
