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
  className?: string;
}

export function StatChip({
  label,
  value,
  icon,
  color = "cyan",
  className,
}: StatChipProps) {
  const c = accentMap[color];
  return (
    <Card
      accent={c.accent}
      padding="default"
      className={cn("flex flex-col gap-0.5 py-3 px-3.5", className)}
    >
      <span className="font-silk text-[10px] text-muted-neon tracking-[0.1em]">
        {label}
      </span>
      <span className={cn("font-px text-lg", c.value)}>{value}</span>
      {icon ? (
        <span className="absolute top-2 right-2.5 opacity-50">{icon}</span>
      ) : null}
    </Card>
  );
}
