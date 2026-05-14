import type { CapacitorConfig } from "@capacitor/cli";

// Static export from `next build` lands in ./out. Capacitor copies that into
// the Android assets folder on `cap sync`.
const isDev = process.env.CAP_DEV === "1";

const config: CapacitorConfig = {
  appId: "me.onchain.app",
  appName: "Onchain.me",
  webDir: "out",
  android: {
    // Dev needs cleartext so the WebView can reach the local Fastify API on
    // http://10.0.2.2:3001. Disable for release.
    allowMixedContent: isDev,
  },
  server: {
    androidScheme: "https",
    // Synthetic origin presented by the WebView. Subdomain of the web app
    // (https://app.onchainme.to) so the API's existing CORS regex covers it
    // automatically as a sub-subdomain. No DNS or TLS for this hostname is
    // required — WebView intercepts every request to it and serves from the APK.
    hostname: "mobile.app.onchainme.to",
    // Mirror allowMixedContent — `cleartext: true` makes Android stop blocking
    // plain-http fetches outright.
    cleartext: isDev,
  },
  plugins: {
    // Route `fetch()` through native HTTP. WebView origin and API origin are
    // cross-origin, which makes browser-side cookie persistence brittle.
    // Native HTTP has no such restriction — CapacitorCookies stores cookies
    // in a shared native jar, CapacitorHttp reads/writes them automatically
    // when `credentials: "include"` is set.
    CapacitorHttp: { enabled: true },
    CapacitorCookies: { enabled: true },
  },
};

export default config;
