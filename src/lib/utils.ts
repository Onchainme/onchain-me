import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Truncate a wallet for display: "0xBEEF…0001".
export function shortWallet(wallet: string, head = 4, tail = 4): string {
  if (!wallet) return ""
  if (wallet.length <= head + tail + 1) return wallet
  return `${wallet.slice(0, head)}…${wallet.slice(-tail)}`
}
