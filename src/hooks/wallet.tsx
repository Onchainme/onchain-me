"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import bs58 from "bs58";
import type { Wallet } from "@/lib/types";

interface WalletContextValue {
  wallet: Wallet | null;
  isConnected: boolean;
  isConnecting: boolean;
  authError: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  isConnectOpen: boolean;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

type AuthNonceResponse = {
  nonce: string;
  message: string;
};

type AuthMeResponse = {
  wallet: string;
};

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: { toBase58(): string };
  connect: () => Promise<{ publicKey: { toBase58(): string } }>;
  signMessage: (
    message: Uint8Array<ArrayBufferLike>,
    encoding?: "utf8",
  ) => Promise<{ signature: Uint8Array<ArrayBufferLike> }>;
};

function toShortAddress(address: string) {
  if (address.length < 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function getApiUrl(path: string) {
  return `${API_BASE}${path}`;
}

async function parseError(response: Response) {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {}
  return `Request failed with status ${response.status}`;
}

function getPhantomProvider() {
  if (typeof window === "undefined") return null;
  const provider = (window as Window & { solana?: PhantomProvider }).solana;
  if (provider?.isPhantom) {
    return provider;
  }
  return null;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isConnectOpen, setConnectOpen] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch(getApiUrl("/api/v1/auth/me"), {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        setWallet(null);
        return;
      }

      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      const data = (await response.json()) as AuthMeResponse;
      setWallet({ address: data.wallet, shortAddress: toShortAddress(data.wallet) });
    } catch {
      setWallet(null);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshSession();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshSession]);

  const connect = useCallback(async () => {
    setAuthError(null);
    setIsConnecting(true);
    try {
      const provider = getPhantomProvider();
      if (!provider) {
        throw new Error("Phantom wallet not found. Please install Phantom.");
      }

      const { publicKey } = await provider.connect();
      const walletAddress = publicKey.toBase58();

      const nonceResponse = await fetch(getApiUrl("/api/v1/auth/nonce"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress }),
      });

      if (!nonceResponse.ok) {
        throw new Error(await parseError(nonceResponse));
      }

      const nonceData = (await nonceResponse.json()) as AuthNonceResponse;
      const message = nonceData.message || `Sign this message. Nonce: ${nonceData.nonce}`;

      const encodedMessage = new TextEncoder().encode(message);
      const signed = await provider.signMessage(encodedMessage, "utf8");
      const signature = bs58.encode(signed.signature);

      const verifyResponse = await fetch(getApiUrl("/api/v1/auth/verify"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: walletAddress,
          nonce: nonceData.nonce,
          signature,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error(await parseError(verifyResponse));
      }

      await refreshSession();
      setConnectOpen(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Wallet connect failed");
      setWallet(null);
    } finally {
      setIsConnecting(false);
    }
  }, [refreshSession]);

  const disconnect = useCallback(async () => {
    setAuthError(null);
    try {
      await fetch(getApiUrl("/api/v1/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    setWallet(null);
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      wallet,
      isConnected: !!wallet,
      isConnecting,
      authError,
      connect,
      disconnect,
      openConnectModal: () => setConnectOpen(true),
      closeConnectModal: () => {
        setAuthError(null);
        setConnectOpen(false);
      },
      isConnectOpen,
    }),
    [wallet, isConnecting, authError, connect, disconnect, isConnectOpen],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
