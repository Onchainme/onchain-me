"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { Wallet } from "@/lib/types";
import { MY_SHORT, MY_WALLET } from "@/lib/mock-data";

interface WalletContextValue {
  wallet: Wallet | null;
  isConnected: boolean;
  connect: (provider?: string) => Promise<void>;
  disconnect: () => void;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  isConnectOpen: boolean;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const STORAGE_KEY = "onchainme.wallet";

/* Module-level mock wallet store — keeps Provider code synchronous and
 * dodges the `set-state-in-effect` rule. Reads hydrate lazily from
 * localStorage the first time the client asks for a snapshot. */
let cached: { value: Wallet | null; loaded: boolean } = {
  value: null,
  loaded: false,
};
const listeners = new Set<() => void>();

function loadFromStorage(): Wallet | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Wallet) : null;
  } catch {
    return null;
  }
}

function persist(w: Wallet | null) {
  if (typeof window === "undefined") return;
  try {
    if (w) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): Wallet | null {
  if (!cached.loaded) {
    cached = { value: loadFromStorage(), loaded: true };
  }
  return cached.value;
}

function getServerSnapshot(): Wallet | null {
  return null;
}

function setWalletState(w: Wallet | null) {
  cached = { value: w, loaded: true };
  persist(w);
  listeners.forEach((l) => l());
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wallet = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isConnectOpen, setConnectOpen] = useState(false);

  const connect = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 400));
    setWalletState({ address: MY_WALLET, shortAddress: MY_SHORT });
    setConnectOpen(false);
  }, []);

  const disconnect = useCallback(() => {
    setWalletState(null);
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      wallet,
      isConnected: !!wallet,
      connect,
      disconnect,
      openConnectModal: () => setConnectOpen(true),
      closeConnectModal: () => setConnectOpen(false),
      isConnectOpen,
    }),
    [wallet, connect, disconnect, isConnectOpen],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
