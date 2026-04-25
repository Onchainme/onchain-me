import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/dashboard/Header";
import { ConnectWalletModal } from "@/components/modals/connect-wallet-modal";

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("page-bg stars scan min-h-screen relative", className)}>
      <Header />
      <main>{children}</main>
      <ConnectWalletModal />
    </div>
  );
}
