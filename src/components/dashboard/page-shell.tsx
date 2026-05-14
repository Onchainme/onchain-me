import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/dashboard/Header";
import { ConnectWalletModalLazy } from "@/components/modals/connect-wallet-modal-lazy";
import { MintToast } from "@/components/dashboard/mint-toast";

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        "page-bg stars scan min-h-screen relative isolate",
        className,
      )}
    >
      <div
        aria-hidden
        className="bg-grid-fade pointer-events-none fixed inset-0 -z-10"
      />
      <Header />
      <main>{children}</main>
      <ConnectWalletModalLazy />
      {/* Mint-completion notifications — fixed bottom-right above all modals.
          Listens for `onchainme:mint` so it works for both single and batch
          flows regardless of which page triggered the mint. */}
      <MintToast />
    </div>
  );
}