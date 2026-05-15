// Cross-domain link helpers.
//
// In production the marketing landing lives on the apex (onchainme.to) and the
// app on its subdomain (app.onchainme.to). NEXT_PUBLIC_* vars below are inlined
// at build time and tell each side how to link to the other.
//
// Both default to `""` so dev (single host on localhost) and the mobile static
// export (single bundle in a WebView) keep using same-origin relative paths.

const APP_ORIGIN = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
const LANDING_ORIGIN = (process.env.NEXT_PUBLIC_LANDING_URL ?? "").replace(
  /\/+$/,
  "",
);

function joinPath(origin: string, path: string): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${origin}${path}`;
}

/** Build an absolute URL to a route on the app subdomain.
 *  Returns a relative path when NEXT_PUBLIC_APP_URL is unset (dev / mobile). */
export function appUrl(path: string): string {
  return APP_ORIGIN ? joinPath(APP_ORIGIN, path) : path;
}

/** Build an absolute URL to a route on the landing (apex) domain.
 *  Returns a relative path when NEXT_PUBLIC_LANDING_URL is unset. */
export function landingUrl(path: string = "/"): string {
  return LANDING_ORIGIN ? joinPath(LANDING_ORIGIN, path) : path;
}

export const SOCIAL_X_URL = "https://x.com/onchain_me";
export const SOCIAL_GITHUB_URL = "https://github.com/Onchainme";

/** Anti-Sybil / API section on the marketing landing (no separate route). */
export const LANDING_SYBIL_SECTION = "#sybil";
