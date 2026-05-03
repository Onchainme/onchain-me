"use client";

import dynamic from "next/dynamic";

export const ConnectWalletModalLazy = dynamic(
  () =>
    import("@/components/modals/connect-wallet-modal").then(
      (m) => m.ConnectWalletModal,
    ),
  { ssr: false },
);
