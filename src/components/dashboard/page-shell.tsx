import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { Header } from "@/components/dashboard/Header";

const ConnectWalletModal = dynamic(
  () =>
    import("@/components/modals/connect-wallet-modal").then(
      (m) => m.ConnectWalletModal,
    ),
  { ssr: false },
);

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
