import type { CapacitorConfig } from "@capacitor/cli";

// Static export from `next build` lands in ./out. Capacitor copies that into
// the Android assets folder on `cap sync`.
const isDev = process.env.CAP_DEV === "1";

const config: CapacitorConfig = {
  appId: "me.onchain.app",
  appName: "Onchain.me",
  webDir: "out",
  android: {
    // Dev needs cleartext so the WebView (https://localhost) can reach the
    // local Fastify API on http://10.0.2.2:3001. Disable for release.
    allowMixedContent: isDev,
  },
  server: {
    androidScheme: "https",
    // Mirror allowMixedContent — `cleartext: true` makes Android stop blocking
    // plain-http fetches outright.
    cleartext: isDev,
  },
  plugins: {
    // Route `fetch()` through native HTTP. The WebView origin (https://localhost)
    // and the API origin (http://10.0.2.2:3001) are cross-origin, which makes
    // browser-side cookie persistence impossible (SameSite=None requires Secure,
    // Secure can't be set over HTTP). Native HTTP has no such restriction —
    // CapacitorCookies stores cookies in a shared native jar, CapacitorHttp
    // reads/writes them automatically when `credentials: "include"` is set.
    CapacitorHttp: { enabled: true },
    CapacitorCookies: { enabled: true },
  },
};

export default config;
