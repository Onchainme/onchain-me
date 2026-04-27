import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, isValidSolanaAddress } from "@/lib/auth-session";

export async function GET() {
  const cookieStore = await cookies();
  const address = cookieStore.get(SESSION_COOKIE)?.value ?? "";
  const authenticated = isValidSolanaAddress(address);

  return NextResponse.json({
    authenticated,
    address: authenticated ? address : null,
  });
}
