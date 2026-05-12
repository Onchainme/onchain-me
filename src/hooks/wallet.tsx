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
import {
  WalletReadyState,
  type MessageSignerWalletAdapter,
  type SignerWalletAdapter,
} from "@solana/wallet-adapter-base";
import type { Transaction, VersionedTransaction } from "@solana/web3.js";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import type { Wallet } from "@/lib/types";
import { IS_MOBILE } from "@/lib/platform";
import {
  phantomConnect,
  phantomDisconnect,
  phantomSignMessage,
} from "@/lib/phantom-mobile-bridge";

interface WalletContextValue {
  wallet: Wallet | null;
  isConnected: boolean;
  isConnecting: boolean;
  /** True once the initial /auth/me check has completed (wallet is null OR set). */
  isSessionReady: boolean;
  authError: string | null;
  connect: (walletName: WalletProviderName) => Promise<void>;
  disconnect: () => Promise<void>;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  isConnectOpen: boolean;
  /** Sign a transaction using the currently connected wallet adapter. */
  signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>;
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
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isConnectOpen, setConnectOpen] = useState(false);
  const adaptersRef = useRef<Partial<Record<WalletProviderName, MessageSignerWalletAdapter>>>({});
  const activeAdapterRef = useRef<MessageSignerWalletAdapter | null>(null);

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
    } finally {
      setIsSessionReady(true);
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
      let walletAddress: string;
      let signMessage: (msg: Uint8Array) => Promise<string>; // returns bs58 signature

      if (IS_MOBILE) {
        if (walletName !== "phantom") {
          throw new Error(
            `${WALLET_LABELS[walletName]} mobile is not supported yet. Use Phantom.`,
          );
        }
        const origin =
          typeof window !== "undefined" ? window.location.origin : "https://localhost";
        const { publicKey } = await phantomConnect(origin);
        walletAddress = publicKey;
        signMessage = async (msg) => {
          const { signature } = await phantomSignMessage(msg);
          return signature;
        };
      } else {
        const adapter = getAdapter(walletName);
        if (
          adapter.readyState === WalletReadyState.NotDetected ||
          adapter.readyState === WalletReadyState.Unsupported
        ) {
          throw new Error(`${WALLET_LABELS[walletName]} wallet not found. Please install it.`);
        }

        await adapter.connect();
        const adapterAddress = adapter.publicKey?.toBase58();
        if (!adapterAddress) {
          throw new Error(`${WALLET_LABELS[walletName]} connected but no public key was returned.`);
        }
        activeAdapterRef.current = adapter;
        walletAddress = adapterAddress;
        signMessage = async (msg) => {
          if (!adapter.signMessage) {
            throw new Error(`${WALLET_LABELS[walletName]} does not support message signing.`);
          }
          const signed = await adapter.signMessage(msg);
          return bs58.encode(normalizeSignedMessage(signed));
        };
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
      const signature = await signMessage(encodedMessage);

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
    if (IS_MOBILE) {
      try {
        await phantomDisconnect();
      } catch {}
    } else {
      const adapters = Object.values(adaptersRef.current);
      await Promise.all(
        adapters.map(async (adapter) => {
          if (!adapter) return;
          try {
            await adapter.disconnect();
          } catch {}
        }),
      );
      activeAdapterRef.current = null;
    }
    try {
      await fetch(getApiUrl("/api/v1/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    setWallet(null);
  }, []);

  const signTransaction = useCallback(
    async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
      if (IS_MOBILE) {
        // Phantom mobile signTransaction via deep links is doable but not yet
        // wired — first mobile release is read-only beyond login.
        throw new Error("Transaction signing on Android is not supported yet.");
      }
      const adapter = activeAdapterRef.current as SignerWalletAdapter | null;
      if (!adapter) throw new Error("Wallet not connected");
      if (!adapter.signTransaction) {
        throw new Error("Connected wallet does not support transaction signing");
      }
      return (await adapter.signTransaction(tx)) as T;
    },
    [],
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      wallet,
      isConnected: !!wallet,
      isConnecting,
      isSessionReady,
      authError,
      connect,
      disconnect,
      openConnectModal: () => setConnectOpen(true),
      closeConnectModal: () => {
        setAuthError(null);
        setConnectOpen(false);
      },
      isConnectOpen,
      signTransaction,
    }),
    [wallet, isConnecting, isSessionReady, authError, connect, disconnect, isConnectOpen, signTransaction],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}