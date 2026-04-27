import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";
import { buildSolanaSignInMessage } from "@/lib/solana-auth";
import { SESSION_COOKIE } from "@/lib/auth-session";

const NONCE_COOKIE = "onchainme_siws_nonce";
const SESSION_TTL_SECONDS = 60 * 60 * 24;

interface VerifyBody {
  publicKey: string;
  signature: string;
  message: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as VerifyBody | null;
  if (!body?.publicKey || !body.signature || !body.message) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const nonce = cookieStore.get(NONCE_COOKIE)?.value;
  if (!nonce) {
    return NextResponse.json({ error: "Nonce is missing or expired" }, { status: 401 });
  }

  const headerStore = await headers();
  const host = headerStore.get("host");
  const protocol =
    (
      headerStore.get("x-forwarded-proto") ??
      (process.env.NODE_ENV === "production" ? "https" : "http")
    ).split(",")[0];
  const domain = host ?? "localhost:3000";
  const uri = `${protocol}://${domain}`;

  const expectedMessage = buildSolanaSignInMessage({
    domain,
    address: body.publicKey,
    nonce,
    uri,
  });
  if (body.message !== expectedMessage) {
    return NextResponse.json({ error: "Message mismatch" }, { status: 401 });
  }

  let signatureBytes: Uint8Array;
  let publicKeyBytes: Uint8Array;
  try {
    signatureBytes = Uint8Array.from(Buffer.from(body.signature, "base64"));
    publicKeyBytes = new PublicKey(body.publicKey).toBytes();
  } catch {
    return NextResponse.json({ error: "Invalid key/signature format" }, { status: 400 });
  }

  const messageBytes = new TextEncoder().encode(body.message);
  const isValid = nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKeyBytes,
  );
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    address: body.publicKey,
    session: bs58.encode(crypto.getRandomValues(new Uint8Array(24))),
  });
  response.cookies.set(NONCE_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(SESSION_COOKIE, body.publicKey, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
