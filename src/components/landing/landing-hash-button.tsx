import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANDING_SYBIL_SECTION } from "@/lib/urls";

type Variant = "primary" | "ghost" | "cyan" | "pixel";
type Size = "default" | "sm" | "lg" | "xl";

interface LandingHashButtonProps {
  href?: string;
  label: string;
  variant?: Variant;
  size?: Size;
  className?: string;
}

/** In-page CTA — scrolls to a landing section (default: Anti-Sybil API). */
export function LandingHashButton({
  href = LANDING_SYBIL_SECTION,
  label,
  variant = "primary",
  size = "lg",
  className,
}: LandingHashButtonProps) {
  return (
    <Button variant={variant} size={size} className={cn(className)} asChild>
      <a href={href} className="inline-flex items-center justify-center gap-2">
        {label}
      </a>
    </Button>
  );
}
