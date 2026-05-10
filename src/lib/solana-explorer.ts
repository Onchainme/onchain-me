/**
 * Solana Explorer URL helpers.
 *
 * Cluster comes from `NEXT_PUBLIC_SOLANA_CLUSTER` build-arg. Default is
 * `devnet` so local dev "just works"; flip to `mainnet-beta` (or empty) in
 * production env once we switch the mint authority over.
 */

const CLUSTER = (
  process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "devnet"
).toLowerCase();

const NEEDS_QUERY_CLUSTER = CLUSTER !== "mainnet-beta" && CLUSTER !== "mainnet";

function withClusterQuery(base: string): string {
  if (!NEEDS_QUERY_CLUSTER) return base;
  return `${base}?cluster=${encodeURIComponent(CLUSTER)}`;
}

/** Explorer URL for an account address (works for cNFT asset ids too). */
export function explorerAddressUrl(addressBase58: string): string {
  return withClusterQuery(`https://explorer.solana.com/address/${addressBase58}`);
}

/** Explorer URL for a transaction signature. */
export function explorerTxUrl(signatureBase58: string): string {
  return withClusterQuery(`https://explorer.solana.com/tx/${signatureBase58}`);
}

/** Solscan URL for an asset / account — often nicer for cNFT inspection. */
export function solscanAddressUrl(addressBase58: string): string {
  const suffix = NEEDS_QUERY_CLUSTER ? `?cluster=${encodeURIComponent(CLUSTER)}` : "";
  return `https://solscan.io/token/${addressBase58}${suffix}`;
}
