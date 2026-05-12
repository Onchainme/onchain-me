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
};

export default config;
