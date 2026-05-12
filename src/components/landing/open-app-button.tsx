import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "cyan" | "pixel";
type Size = "default" | "sm" | "lg" | "xl";

interface OpenAppButtonProps {
  label?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
}

/**
 * Landing CTA that navigates straight to the app home (`/home`). Wallet
 * connect is no longer triggered from the landing — it happens in-app once
 * the user is inside the dashboard / lands an app route.
 */
export function OpenAppButton({
  label = "Open app",
  variant = "primary",
  size = "lg",
  className,
}: OpenAppButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      asChild
    >
      <Link href="/home">
        <span aria-hidden="true" className="pb-2">
          ▶
        </span>
        {label}
      </Link>
    </Button>
  );
}
