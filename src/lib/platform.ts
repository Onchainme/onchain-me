import { Capacitor } from "@capacitor/core";

// Runtime check for "is the bundle running inside a Capacitor WebView". This
// works regardless of how the bundle was compiled — the same JS can ship as a
// web build and an Android build, and the flag self-determines at boot.
//
// SSR safety: `Capacitor.isNativePlatform()` reads `window.Capacitor`, which is
// undefined during Next.js's build-time static export. The `typeof window`
// guard returns `false` there, then the client-side bundle re-evaluates this
// module at WebView startup and gets the correct `true`.
export const IS_MOBILE =
  typeof window !== "undefined" && Capacitor.isNativePlatform();
