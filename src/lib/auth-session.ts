import { PublicKey } from "@solana/web3.js";

export const SESSION_COOKIE = "onchainme_wallet_session";

export function isLikelySolanaAddress(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

export function isValidSolanaAddress(value: string) {
  try {
    void new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}
