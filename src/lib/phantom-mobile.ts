// Phantom Mobile Deep Link protocol.
// Reference: https://docs.phantom.app/phantom-deeplinks/provider-methods
//
// Connect / signMessage / disconnect all use X25519 key exchange + secretbox
// (tweetnacl `box`). The dApp keeps a long-lived ephemeral keypair; after the
// initial connect the shared secret derived against Phantom's public key is
// reused for every encrypted payload until disconnect.

import nacl from "tweetnacl";
import bs58 from "bs58";

const PHANTOM_BASE = "https://phantom.app/ul/v1";
const REDIRECT_BASE = "onchainme://phantom";
const CLUSTER = "mainnet-beta";

export interface DappKeypair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export function generateDappKeypair(): DappKeypair {
  const kp = nacl.box.keyPair();
  return { publicKey: kp.publicKey, secretKey: kp.secretKey };
}

export function computeSharedSecret(
  phantomPublicKey: Uint8Array,
  dappSecretKey: Uint8Array,
): Uint8Array {
  return nacl.box.before(phantomPublicKey, dappSecretKey);
}

function encryptPayload(payload: object, sharedSecret: Uint8Array) {
  const nonce = nacl.randomBytes(24);
  const msg = new TextEncoder().encode(JSON.stringify(payload));
  const encrypted = nacl.box.after(msg, nonce, sharedSecret);
  if (!encrypted) throw new Error("Failed to encrypt payload for Phantom");
  return { nonce, encrypted };
}

function decryptPayload<T>(
  encryptedB58: string,
  nonceB58: string,
  sharedSecret: Uint8Array,
): T {
  const encrypted = bs58.decode(encryptedB58);
  const nonce = bs58.decode(nonceB58);
  const decrypted = nacl.box.open.after(encrypted, nonce, sharedSecret);
  if (!decrypted) throw new Error("Failed to decrypt payload from Phantom");
  return JSON.parse(new TextDecoder().decode(decrypted)) as T;
}

export function buildConnectUrl(dappPublicKey: Uint8Array, appUrl: string): string {
  const params = new URLSearchParams({
    dapp_encryption_public_key: bs58.encode(dappPublicKey),
    cluster: CLUSTER,
    app_url: appUrl,
    redirect_link: `${REDIRECT_BASE}/connect`,
  });
  return `${PHANTOM_BASE}/connect?${params.toString()}`;
}

export function buildSignMessageUrl(
  dappPublicKey: Uint8Array,
  sharedSecret: Uint8Array,
  session: string,
  message: Uint8Array,
): string {
  const payload = {
    session,
    message: bs58.encode(message),
  };
  const { nonce, encrypted } = encryptPayload(payload, sharedSecret);
  const params = new URLSearchParams({
    dapp_encryption_public_key: bs58.encode(dappPublicKey),
    nonce: bs58.encode(nonce),
    redirect_link: `${REDIRECT_BASE}/sign_message`,
    payload: bs58.encode(encrypted),
  });
  return `${PHANTOM_BASE}/signMessage?${params.toString()}`;
}

export function buildDisconnectUrl(
  dappPublicKey: Uint8Array,
  sharedSecret: Uint8Array,
  session: string,
): string {
  const payload = { session };
  const { nonce, encrypted } = encryptPayload(payload, sharedSecret);
  const params = new URLSearchParams({
    dapp_encryption_public_key: bs58.encode(dappPublicKey),
    nonce: bs58.encode(nonce),
    redirect_link: `${REDIRECT_BASE}/disconnect`,
    payload: bs58.encode(encrypted),
  });
  return `${PHANTOM_BASE}/disconnect?${params.toString()}`;
}

export interface ConnectResponse {
  publicKey: string;
  session: string;
  phantomEncryptionPublicKey: Uint8Array;
  sharedSecret: Uint8Array;
}

function ensureNoError(params: URLSearchParams) {
  const errorCode = params.get("errorCode");
  if (errorCode) {
    throw new Error(
      `Phantom error ${errorCode}: ${params.get("errorMessage") ?? "(no message)"}`,
    );
  }
}

export function parseConnectResponse(
  params: URLSearchParams,
  dappSecretKey: Uint8Array,
): ConnectResponse {
  ensureNoError(params);
  const phantomEncPub = params.get("phantom_encryption_public_key");
  const data = params.get("data");
  const nonce = params.get("nonce");
  if (!phantomEncPub || !data || !nonce) {
    throw new Error("Missing fields in Phantom connect response");
  }
  const phantomPub = bs58.decode(phantomEncPub);
  const sharedSecret = computeSharedSecret(phantomPub, dappSecretKey);
  const decoded = decryptPayload<{ public_key: string; session: string }>(
    data,
    nonce,
    sharedSecret,
  );
  return {
    publicKey: decoded.public_key,
    session: decoded.session,
    phantomEncryptionPublicKey: phantomPub,
    sharedSecret,
  };
}

export interface SignMessageResponse {
  signature: string; // bs58
}

export function parseSignMessageResponse(
  params: URLSearchParams,
  sharedSecret: Uint8Array,
): SignMessageResponse {
  ensureNoError(params);
  const data = params.get("data");
  const nonce = params.get("nonce");
  if (!data || !nonce) {
    throw new Error("Missing fields in Phantom sign_message response");
  }
  return decryptPayload<{ signature: string }>(data, nonce, sharedSecret);
}
