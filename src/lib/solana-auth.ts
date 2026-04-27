interface BuildMessageInput {
  domain: string;
  address: string;
  nonce: string;
  uri: string;
}

export function buildSolanaSignInMessage({
  domain,
  address,
  nonce,
  uri,
}: BuildMessageInput) {
  return [
    `${domain} wants you to sign in with your Solana account:`,
    address,
    "",
    "Sign in to Onchain.me",
    "",
    `URI: ${uri}`,
    "Version: 1",
    "Chain ID: solana:devnet",
    `Nonce: ${nonce}`,
  ].join("\n");
}
