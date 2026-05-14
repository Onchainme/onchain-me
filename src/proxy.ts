import { NextResponse, type NextRequest } from "next/server";

// Next.js `proxy` (intercepts every matched request before it reaches a
// route). Splits traffic by hostname so the marketing landing lives on the
// apex domain (onchainme.to) and the app lives on its subdomain
// (app.onchainme.to). One Next.js server still handles both — an upstream
// reverse proxy fans both hostnames into this container, and the code below
// rewrites/redirects per host.
//
// This only runs in the "standalone" (Node) build. The mobile build is a pure
// static export (`output: "export"`), which Next.js refuses to build if this
// file exists — `scripts/mobile-build.mjs` stashes it out of the way for that
// build and restores it after.

const APP_HOST_PREFIX = "app.";

function isLocalHost(host: string): boolean {
  // Strip port for the comparison.
  const bare = host.split(":")[0];
  return (
    bare === "localhost" ||
    bare === "127.0.0.1" ||
    bare === "0.0.0.0" ||
    bare.endsWith(".local")
  );
}

export function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (!host || isLocalHost(host)) {
    // Dev / health checks: don't enforce the split locally so devs can still
    // poke both `/` (landing) and `/home` (app) on a single localhost.
    return NextResponse.next();
  }

  const path = req.nextUrl.pathname;
  const isAppHost = host.startsWith(APP_HOST_PREFIX);

  if (isAppHost) {
    // Bare `/` on the app subdomain is meaningless — punt to the dashboard.
    if (path === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url, 308);
    }
    return NextResponse.next();
  }

  // Apex (or any non-`app.` host): only the marketing landing is valid here.
  // Send every other path to the same path on the app subdomain so deep links
  // (e.g. shared `/land?wallet=…` URLs) still resolve after the split.
  if (path === "/") {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  // Preserve port for staging-like setups; drop the leading `www.` if present.
  const bareHost = host.replace(/^www\./, "");
  url.host = `${APP_HOST_PREFIX}${bareHost}`;
  return NextResponse.redirect(url, 308);
}

export const config = {
  // Skip Next internals, API routes (none today, but reserved), and any file
  // with an extension (favicon, sprites, _next chunks).
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
