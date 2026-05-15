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

// Hostname split is gated behind an explicit env flag. Until the apex domain
// is wired in Caddy (apex → reverse_proxy frontend instead of redir → app),
// enforcing the split would make the marketing landing unreachable
// (everything 308s to /home on app.<domain>). Default OFF → this proxy is a
// pure pass-through and prod behaves exactly as before. Flip
// NEXT_PUBLIC_ENABLE_DOMAIN_SPLIT=true in deploy/.env.production once the
// Caddyfile apex block + NEXT_PUBLIC_APP_URL/LANDING_URL are in place.
const DOMAIN_SPLIT_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_DOMAIN_SPLIT === "true";

export function proxy(req: NextRequest) {
  if (!DOMAIN_SPLIT_ENABLED) {
    return NextResponse.next();
  }

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
  // `req.nextUrl` is built from the proxied connection (Caddy → frontend:3000),
  // so cloning it carries the internal :3000. Strip any port from the public
  // Host header, force https, and clear url.port — otherwise the redirect
  // leaks `app.onchainme.to:3000` which the browser can't reach.
  const bareHost = host.replace(/^www\./, "").split(":")[0];
  url.protocol = "https:";
  url.host = `${APP_HOST_PREFIX}${bareHost}`;
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export const config = {
  // Skip Next internals, API routes (none today, but reserved), and any file
  // with an extension (favicon, sprites, _next chunks).
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
