import { NextResponse } from "next/server";

const NONCE_COOKIE = "onchainme_siws_nonce";
const NONCE_TTL_SECONDS = 60 * 5;

export async function GET() {
  const nonce = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + NONCE_TTL_SECONDS * 1000).toISOString();

  const response = NextResponse.json({ nonce, expiresAt });
  response.cookies.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: NONCE_TTL_SECONDS,
  });
  return response;
}
