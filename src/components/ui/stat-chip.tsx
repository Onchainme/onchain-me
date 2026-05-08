import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Color = "cyan" | "magenta" | "yellow" | "violet";

const accentMap: Record<Color, { accent: "cyan" | "magenta" | "yellow" | "violet"; value: string }> = {
  cyan: { accent: "cyan", value: "text-cyan-neon" },
  magenta: { accent: "magenta", value: "text-magenta-neon" },
  yellow: { accent: "yellow", value: "text-yellow-neon" },
  violet: { accent: "violet", value: "text-violet-neon" },
};

interface StatChipProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: Color;
  size?: "default" | "sm";
  className?: string;
}

export function StatChip({
  label,
  value,
  icon,
  color = "cyan",
  size = "default",
  className,
}: StatChipProps) {
  const c = accentMap[color];
  const isSmall = size === "sm";
  return (
    <Card
      accent={c.accent}
      padding="default"
      className={cn(
        "flex flex-col gap-0.5",
        isSmall ? "py-1.5 px-2.5 min-w-[60px]" : "py-3 px-3.5",
        className,
      )}
    >
      <span className={cn("font-silk text-muted-neon tracking-[0.1em]", isSmall ? "text-[10px]" : "text-[12px]")}>
        {label}
      </span>
      <span className={cn("font-px", isSmall ? "text-[14px]" : "text-lg", c.value)}>{value}</span>
      {icon ? (
        <span className="absolute top-2 right-2.5 opacity-50">{icon}</span>
      ) : null}
    </Card>
  );
}
