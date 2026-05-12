// React-agnostic bridge between the Phantom Mobile protocol and the rest of
// the app. Holds the dApp keypair + session in localStorage, installs a single
// Capacitor App URL listener, and exposes promise-style connect/signMessage/
// disconnect entry points.
//
// Because Phantom backgrounds our process during the round trip, the runtime
// state must survive a re-resume — that's why we persist everything to
// localStorage and re-create the in-memory state on each call.

import bs58 from "bs58";
import { App } from "@capacitor/app";
import {
  buildConnectUrl,
  buildDisconnectUrl,
  buildSignMessageUrl,
  generateDappKeypair,
  parseConnectResponse,
  parseSignMessageResponse,
  type DappKeypair,
} from "./phantom-mobile";

const STORAGE_KEY = "phantom-mobile:state:v1";

interface PersistedState {
  dappPublicKey: string;
  dappSecretKey: string;
  session?: string;
  sharedSecret?: string;
  walletPublicKey?: string;
}

function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function saveState(state: PersistedState | null) {
  if (typeof window === "undefined") return;
  if (state) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  else window.localStorage.removeItem(STORAGE_KEY);
}

function getOrCreateKeypair(): DappKeypair {
  const existing = loadState();
  if (existing) {
    return {
      publicKey: bs58.decode(existing.dappPublicKey),
      secretKey: bs58.decode(existing.dappSecretKey),
    };
  }
  const kp = generateDappKeypair();
  saveState({
    dappPublicKey: bs58.encode(kp.publicKey),
    dappSecretKey: bs58.encode(kp.secretKey),
  });
  return kp;
}

export function getStoredWalletPublicKey(): string | null {
  return loadState()?.walletPublicKey ?? null;
}

export function clearPhantomSession() {
  const state = loadState();
  if (!state) return;
  saveState({
    dappPublicKey: state.dappPublicKey,
    dappSecretKey: state.dappSecretKey,
  });
}

// Pending promise. Only one outstanding operation at a time — that mirrors how
// users actually interact (you can't be both connecting and signing).
type PendingType = "connect" | "sign_message" | "disconnect";
interface Pending {
  type: PendingType;
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}
let pending: Pending | null = null;

function rejectPending(reason: Error) {
  if (pending) {
    pending.reject(reason);
    pending = null;
  }
}

function resolvePending(value: unknown) {
  if (pending) {
    pending.resolve(value);
    pending = null;
  }
}

function handleAppUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  if (parsed.protocol !== "onchainme:") return;
  // onchainme://phantom/<action> — Capacitor gives us the URL as-is, host is
  // "phantom", path is "/<action>". We accept both forms just in case.
  const host = parsed.host || parsed.hostname;
  if (host !== "phantom") return;
  const action = parsed.pathname.replace(/^\/+/, "");
  const params = parsed.searchParams;
  const state = loadState();
  if (!state) return;
  const dappSecret = bs58.decode(state.dappSecretKey);

  try {
    if (action === "connect") {
      const r = parseConnectResponse(params, dappSecret);
      saveState({
        ...state,
        session: r.session,
        sharedSecret: bs58.encode(r.sharedSecret),
        walletPublicKey: r.publicKey,
      });
      if (pending?.type === "connect") resolvePending({ publicKey: r.publicKey });
    } else if (action === "sign_message") {
      if (!state.sharedSecret) throw new Error("No active Phantom session");
      const r = parseSignMessageResponse(params, bs58.decode(state.sharedSecret));
      if (pending?.type === "sign_message") resolvePending({ signature: r.signature });
    } else if (action === "disconnect") {
      clearPhantomSession();
      if (pending?.type === "disconnect") resolvePending(undefined);
    }
  } catch (err) {
    rejectPending(err instanceof Error ? err : new Error(String(err)));
  }
}

let listenerInstalled = false;
async function ensureListener() {
  if (listenerInstalled) return;
  listenerInstalled = true;
  await App.addListener("appUrlOpen", (e) => {
    if (e.url) handleAppUrl(e.url);
  });
  // Cold-start case: the app was launched by the deep link itself.
  try {
    const launch = await App.getLaunchUrl();
    if (launch?.url) handleAppUrl(launch.url);
  } catch {
    // getLaunchUrl is a no-op on web; ignore.
  }
}

function setPending<T>(type: PendingType): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (pending) {
      pending.reject(new Error("Replaced by a newer Phantom request"));
    }
    pending = {
      type,
      resolve: resolve as (v: unknown) => void,
      reject,
    };
  });
}

export async function phantomConnect(appUrl: string): Promise<{ publicKey: string }> {
  await ensureListener();
  const keypair = getOrCreateKeypair();
  const url = buildConnectUrl(keypair.publicKey, appUrl);
  const result = setPending<{ publicKey: string }>("connect");
  window.location.href = url;
  return result;
}

export async function phantomSignMessage(message: Uint8Array): Promise<{ signature: string }> {
  await ensureListener();
  const state = loadState();
  if (!state?.session || !state?.sharedSecret) {
    throw new Error("Phantom is not connected. Connect first.");
  }
  const keypair: DappKeypair = {
    publicKey: bs58.decode(state.dappPublicKey),
    secretKey: bs58.decode(state.dappSecretKey),
  };
  const url = buildSignMessageUrl(
    keypair.publicKey,
    bs58.decode(state.sharedSecret),
    state.session,
    message,
  );
  const result = setPending<{ signature: string }>("sign_message");
  window.location.href = url;
  return result;
}

export async function phantomDisconnect(): Promise<void> {
  await ensureListener();
  const state = loadState();
  if (!state?.session || !state?.sharedSecret) {
    clearPhantomSession();
    return;
  }
  const keypair: DappKeypair = {
    publicKey: bs58.decode(state.dappPublicKey),
    secretKey: bs58.decode(state.dappSecretKey),
  };
  const url = buildDisconnectUrl(
    keypair.publicKey,
    bs58.decode(state.sharedSecret),
    state.session,
  );
  const result = setPending<void>("disconnect");
  window.location.href = url;
  return result;
}
