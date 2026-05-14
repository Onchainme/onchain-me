import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { appUrl } from "@/lib/urls";

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
 *
 * In production the landing and app live on different subdomains, so this
 * resolves to an absolute URL via `appUrl()` (which falls back to a relative
 * path when NEXT_PUBLIC_APP_URL is unset, keeping localhost dev simple).
 */
export function OpenAppButton({
  label = "Open app",
  variant = "primary",
  size = "lg",
  className,
}: OpenAppButtonProps) {
  const href = appUrl("/home");
  const isExternal = /^https?:\/\//.test(href);

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      asChild
    >
      {isExternal ? (
        <a href={href}>
          <span aria-hidden="true" className="pb-2">
            ▶
          </span>
          {label}
        </a>
      ) : (
        <Link href={href}>
          <span aria-hidden="true" className="pb-2">
            ▶
          </span>
          {label}
        </Link>
      )}
    </Button>
  );
}
