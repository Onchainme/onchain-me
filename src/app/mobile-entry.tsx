"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The marketing landing only exists in the web build. In the mobile APK the
// Capacitor WebView always boots at `/` (the root of the static export), so
// `/` bounces straight to the dashboard.
//
// This MUST be a soft, client-side router navigation — NOT
// `window.location.replace`. A hard cross-document navigation makes the Next
// App Router re-hydrate `/home` as a fresh static-export document, which it
// cannot reconcile inside the WebView: it falls into an infinite
// `mpaNavigation` → `window.location.replace('/home')` loop (Chromium logs
// "Throttling navigation to prevent the browser from hanging") and the screen
// never paints. `router.replace` keeps a single document and just swaps the
// route tree, which the static export handles correctly.
const HOME = "/home";

export function MobileEntry() {
  const router = useRouter();

  useEffect(() => {
    router.replace(HOME);
  }, [router]);

  // Fills the frame with the app background during the one client tick before
  // the dashboard tree mounts, so there's no white flash.
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#0a0612",
      }}
    />
  );
}
