"use client";

import { useEffect, useState } from "react";
import { Check, X, ExternalLink } from "lucide-react";
import { BADGE_CATALOG, isBadgeId } from "@/lib/badge-catalog";
import { explorerTxUrl } from "@/lib/solana-explorer";
import { cn } from "@/lib/utils";

interface ToastItem {
  id: number;
  badgeName: string;
  signature: string | null;
}

const AUTO_DISMISS_MS = 6000;

/**
 * Global mint-completion toast. Mounted once at the PageShell level so the
 * notification rides above any modal/route and survives the "MintSingleModal
 * auto-closes after success" flow. Listens for the `onchainme:mint` window
 * event that use-inventory dispatches when a mint reaches the `done` stage.
 *
 * Each toast is auto-dismissed after AUTO_DISMISS_MS (6s) or via the ✕ button.
 * Multiple mints can stack — the Mint-All flow emits one event per badge.
 */
export function MintToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ badgeId: string; signature?: string }>).detail;
      if (!detail?.badgeId) return;
      const name = isBadgeId(detail.badgeId)
        ? BADGE_CATALOG[detail.badgeId].name
        : detail.badgeId;
      const item: ToastItem = {
        id: Date.now() + Math.random(),
        badgeName: name,
        signature: detail.signature ?? null,
      };
      setToasts((prev) => [...prev, item]);
      // Auto-dismiss. Use a single setTimeout per toast rather than a global
      // interval so each can age out on its own schedule.
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, AUTO_DISMISS_MS);
    }
    window.addEventListener("onchainme:mint", handler);
    return () => window.removeEventListener("onchainme:mint", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      // Fixed bottom-right on desktop, full-width bottom on mobile. z-index
      // higher than dialog overlay (50) so it sits above an open MintModal.
      className="fixed z-[60] bottom-3 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-center gap-3 border-2 border-cyan-neon",
            "bg-bg shadow-[0_0_24px_rgba(34,211,238,0.35)] px-3 py-2.5",
            "min-w-[260px] max-w-[420px] sm:min-w-[320px]",
            "animate-in slide-in-from-right-2 fade-in duration-200",
          )}
        >
          <span className="inline-flex items-center justify-center w-6 h-6 bg-cyan-neon text-[#001014] shrink-0">
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-px text-[12px] glow-c truncate">
              {t.badgeName} minted!
            </div>
            <div className="font-silk text-[10px] text-muted-neon mt-0.5">
              cNFT in your wallet
              {t.signature ? (
                <>
                  {" · "}
                  <a
                    href={explorerTxUrl(t.signature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-neon hover:underline inline-flex items-center gap-0.5"
                  >
                    View tx
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setToasts((prev) => prev.filter((p) => p.id !== t.id))}
            className="text-muted-neon hover:text-magenta-neon shrink-0 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
