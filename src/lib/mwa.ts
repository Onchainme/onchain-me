// TypeScript wrapper around the OnchainMwa Capacitor plugin.
//
// Wire protocol over the JS bridge: binary fields are base64. This module
// exposes a friendlier API (Uint8Array / bs58) and persists the MWA auth_token
// in localStorage so we can reauthorize on subsequent app launches without
// asking the user to pick a wallet again.

import bs58 from "bs58";
import { registerPlugin } from "@capacitor/core";

interface AuthorizeResult {
  authToken: string;
  /** base64-encoded raw public key bytes (32B) */
  accountPublicKey: string;
  accountLabel?: string | null;
  walletUriBase?: string | null;
}

interface SignMessagesResult {
  authToken: string;
  /** base64-encoded ed25519 signatures, one per input message */
  signatures: string[];
}

interface SignTransactionsResult {
  authToken: string;
  /** base64-encoded fully-or-partially signed transaction payloads */
  signedTransactions: string[];
}

interface SignAndSendTransactionsResult {
  authToken: string;
  /** base64-encoded signature bytes; bs58 in TS */
  signatures: string[];
}

interface IdentityFields {
  identityName: string;
  identityUri: string;
  iconRelativeUri?: string;
  cluster?: "mainnet-beta" | "devnet" | "testnet";
}

interface OnchainMwaPlugin {
  authorize(opts: IdentityFields): Promise<AuthorizeResult>;
  reauthorize(opts: IdentityFields & { authToken: string }): Promise<AuthorizeResult>;
  signMessages(
    opts: IdentityFields & { authToken: string; messages: string[] },
  ): Promise<SignMessagesResult>;
  signTransactions(
    opts: IdentityFields & { authToken: string; transactions: string[] },
  ): Promise<SignTransactionsResult>;
  signAndSendTransactions(
    opts: IdentityFields & {
      authToken: string;
      transactions: string[];
      minContextSlot?: number;
    },
  ): Promise<SignAndSendTransactionsResult>;
  deauthorize(opts: { authToken: string }): Promise<void>;
}

const OnchainMwa = registerPlugin<OnchainMwaPlugin>("OnchainMwa");

const AUTH_TOKEN_KEY = "mwa:authToken:v1";
const PUBKEY_KEY = "mwa:publicKey:v1";

function b64Encode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function b64Decode(s: string): Uint8Array {
  const binary = atob(s);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function identity(): IdentityFields {
  // Wallets surface identityUri to the user during connect ("Connect to X?").
  // On mobile window.location.origin is the Capacitor-synthetic
  // https://mobile.onchainme.to — show the canonical web origin instead.
  const isMobile = process.env.NEXT_PUBLIC_PLATFORM === "mobile";
  const origin =
    !isMobile && typeof window !== "undefined"
      ? window.location.origin
      : "https://app.onchainme.to";
  return {
    identityName: "Onchain.me",
    identityUri: origin,
    iconRelativeUri: "favicon.ico",
    cluster: "mainnet-beta",
  };
}

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredPublicKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PUBKEY_KEY);
}

function persistAuth(authToken: string, publicKeyB58: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, authToken);
  window.localStorage.setItem(PUBKEY_KEY, publicKeyB58);
}

function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(PUBKEY_KEY);
}

export interface MwaSession {
  authToken: string;
  publicKeyB58: string;
}

/**
 * Pop the wallet bottom sheet and authorize the dApp. If a stored authToken
 * exists, tries `reauthorize` first (silent on Seeker / quick approve on other
 * wallets) and falls back to a fresh `authorize` on failure.
 */
export async function mwaConnect(): Promise<MwaSession> {
  const id = identity();
  const stored = getStoredAuthToken();
  let result: AuthorizeResult;
  if (stored) {
    try {
      result = await OnchainMwa.reauthorize({ ...id, authToken: stored });
    } catch {
      result = await OnchainMwa.authorize(id);
    }
  } else {
    result = await OnchainMwa.authorize(id);
  }
  const publicKeyB58 = bs58.encode(b64Decode(result.accountPublicKey));
  persistAuth(result.authToken, publicKeyB58);
  return { authToken: result.authToken, publicKeyB58 };
}

/** Sign a raw message and return the signature as bs58 (matches /auth/verify). */
export async function mwaSignMessage(
  message: Uint8Array,
  session: MwaSession,
): Promise<string> {
  const id = identity();
  const result = await OnchainMwa.signMessages({
    ...id,
    authToken: session.authToken,
    messages: [b64Encode(message)],
  });
  // Wallet may have rotated the auth token — keep ours fresh.
  persistAuth(result.authToken, session.publicKeyB58);
  const sigBytes = b64Decode(result.signatures[0]);
  return bs58.encode(sigBytes);
}

/**
 * Sign serialised transactions. Each input is the raw serialised tx (the same
 * bytes you'd send via web3.js `tx.serialize({ requireAllSignatures: false })`)
 * and each output is the wallet-signed tx ready to submit.
 */
export async function mwaSignTransactions(
  serialisedTxs: Uint8Array[],
  session: MwaSession,
): Promise<Uint8Array[]> {
  const id = identity();
  const result = await OnchainMwa.signTransactions({
    ...id,
    authToken: session.authToken,
    transactions: serialisedTxs.map(b64Encode),
  });
  persistAuth(result.authToken, session.publicKeyB58);
  return result.signedTransactions.map(b64Decode);
}

export async function mwaDisconnect(): Promise<void> {
  const token = getStoredAuthToken();
  if (token) {
    try {
      await OnchainMwa.deauthorize({ authToken: token });
    } catch {
      // ignore — best-effort
    }
  }
  clearAuth();
}
