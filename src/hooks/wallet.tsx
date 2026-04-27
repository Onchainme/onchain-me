"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  ConnectionProvider,
  WalletProvider as AdapterWalletProvider,
  useWallet as useAdapterWallet,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import type { Wallet } from "@/lib/types";
import { buildSolanaSignInMessage } from "@/lib/solana-auth";
import "@solana/wallet-adapter-react-ui/styles.css";

interface WalletContextValue {
  wallet: Wallet | null;
  isConnected: boolean;
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  connect: (provider?: string) => Promise<void>;
  disconnect: () => void;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  isConnectOpen: boolean;
  wallets: Array<{ name: string; ready: boolean }>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

async function authenticateWallet(
  address: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
) {
  const nonceRes = await fetch("/api/auth/nonce", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  if (!nonceRes.ok) {
    throw new Error("Failed to request nonce");
  }
  const noncePayload = (await nonceRes.json()) as { nonce: string; expiresAt: string };

  const message = buildSolanaSignInMessage({
    domain: window.location.host,
    address,
    nonce: noncePayload.nonce,
    uri: window.location.origin,
  });

  const signature = await signMessage(new TextEncoder().encode(message));
  const verifyRes = await fetch("/api/auth/verify", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      publicKey: address,
      signature: bytesToBase64(signature),
      message,
    }),
  });
  if (!verifyRes.ok) {
    const payload = (await verifyRes.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? "Failed to verify wallet signature");
  }
}

function WalletInnerProvider({ children }: { children: React.ReactNode }) {
  const {
    wallets: adapterWallets,
    wallet: selectedWallet,
    publicKey,
    connected,
    disconnect: adapterDisconnect,
    connect: adapterConnect,
    select,
    signMessage,
  } = useAdapterWallet();
  const [isConnectOpen, setConnectOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const wallet = useMemo<Wallet | null>(() => {
    const address = publicKey?.toBase58();
    if (!connected || !address) return null;
    return { address, shortAddress: shortAddress(address) };
  }, [connected, publicKey]);

  const connect = useCallback(
    async (provider?: string) => {
      if (provider) {
        const target = adapterWallets.find((w) => w.adapter.name === provider);
        if (target) select(target.adapter.name);
      }
      await adapterConnect();
      const connectedAddress = selectedWallet?.adapter.publicKey?.toBase58();
      if (connectedAddress && signMessage) {
        setIsAuthenticating(true);
        try {
          await authenticateWallet(connectedAddress, signMessage);
          setIsAuthenticated(true);
        } finally {
          setIsAuthenticating(false);
        }
      }
      setConnectOpen(false);
    },
    [adapterConnect, adapterWallets, select, selectedWallet, signMessage],
  );

  const disconnect = useCallback(() => {
    void fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    void adapterDisconnect();
    setIsAuthenticated(false);
  }, [adapterDisconnect]);

  const value = useMemo<WalletContextValue>(
    () => ({
      wallet,
      isConnected: connected,
      isAuthenticating,
      isAuthenticated: connected && isAuthenticated,
      connect,
      disconnect,
      openConnectModal: () => setConnectOpen(true),
      closeConnectModal: () => setConnectOpen(false),
      isConnectOpen,
      wallets: adapterWallets.map((w) => ({
        name: w.adapter.name,
        ready: w.readyState === "Installed" || w.readyState === "Loadable",
      })),
    }),
    [
      wallet,
      connected,
      isAuthenticating,
      isAuthenticated,
      connect,
      disconnect,
      isConnectOpen,
      adapterWallets,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <AdapterWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletInnerProvider>{children}</WalletInnerProvider>
        </WalletModalProvider>
      </AdapterWalletProvider>
    </ConnectionProvider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
