"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import bs58 from "bs58";
import { WalletReadyState, type MessageSignerWalletAdapter } from "@solana/wallet-adapter-base";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import type { Wallet } from "@/lib/types";

interface WalletContextValue {
  wallet: Wallet | null;
  isConnected: boolean;
  isConnecting: boolean;
  authError: string | null;
  connect: (walletName: WalletProviderName) => Promise<void>;
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

export type WalletProviderName = "phantom" | "backpack" | "solflare";

const WALLET_ADAPTERS: Record<WalletProviderName, () => MessageSignerWalletAdapter> = {
  phantom: () => new PhantomWalletAdapter(),
  backpack: () => new BackpackWalletAdapter(),
  solflare: () => new SolflareWalletAdapter(),
};

const WALLET_LABELS: Record<WalletProviderName, string> = {
  phantom: "Phantom",
  backpack: "Backpack",
  solflare: "Solflare",
};

function toShortAddress(address: string) {
  if (address.length < 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function getApiUrl(path: string) {
  return `${API_BASE}${path}`;
}

function normalizeSignedMessage(signed: unknown): Uint8Array {
  if (signed instanceof Uint8Array) return signed;
  if (signed instanceof ArrayBuffer) return new Uint8Array(signed);

  if (Array.isArray(signed) && signed.every((item) => typeof item === "number")) {
    return Uint8Array.from(signed);
  }

  if (signed && typeof signed === "object" && "signature" in signed) {
    const nested = (signed as { signature?: unknown }).signature;
    if (nested instanceof Uint8Array) return nested;
    if (nested instanceof ArrayBuffer) return new Uint8Array(nested);
    if (Array.isArray(nested) && nested.every((item) => typeof item === "number")) {
      return Uint8Array.from(nested);
    }
  }

  throw new Error("Wallet returned an invalid signature format.");
}

async function parseError(response: Response) {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {}
  return `Request failed with status ${response.status}`;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isConnectOpen, setConnectOpen] = useState(false);
  const adaptersRef = useRef<Partial<Record<WalletProviderName, MessageSignerWalletAdapter>>>({});

  const getAdapter = useCallback((walletName: WalletProviderName) => {
    const existing = adaptersRef.current[walletName];
    if (existing) return existing;

    const next = WALLET_ADAPTERS[walletName]();
    adaptersRef.current[walletName] = next;
    return next;
  }, []);

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

  const connect = useCallback(async (walletName: WalletProviderName) => {
    setAuthError(null);
    setIsConnecting(true);
    try {
      const adapter = getAdapter(walletName);
      if (
        adapter.readyState === WalletReadyState.NotDetected ||
        adapter.readyState === WalletReadyState.Unsupported
      ) {
        throw new Error(`${WALLET_LABELS[walletName]} wallet not found. Please install it.`);
      }

      await adapter.connect();
      const walletAddress = adapter.publicKey?.toBase58();
      if (!walletAddress) {
        throw new Error(`${WALLET_LABELS[walletName]} connected but no public key was returned.`);
      }

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
      if (!adapter.signMessage) {
        throw new Error(`${WALLET_LABELS[walletName]} does not support message signing.`);
      }
      const signed = await adapter.signMessage(encodedMessage);
      const signature = bs58.encode(normalizeSignedMessage(signed));

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
  }, [getAdapter, refreshSession]);

  const disconnect = useCallback(async () => {
    setAuthError(null);
    const adapters = Object.values(adaptersRef.current);
    await Promise.all(
      adapters.map(async (adapter) => {
        if (!adapter) return;
        try {
          await adapter.disconnect();
        } catch {}
      }),
    );
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
