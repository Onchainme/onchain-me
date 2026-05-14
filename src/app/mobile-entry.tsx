"use client";

import { useEffect } from "react";

// Mobile WebView starts at `/index.html` (the root of Capacitor's `webDir`).
// The landing only exists on the web build, so on mobile we bounce the user
// straight to the dashboard. `replace` so the back button doesn't return here.
const HOME = "/home/";

export function MobileEntry() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.replace(HOME);
    }
  }, []);

  return (
    <>
      {/* Fallback for the brief window before useEffect runs and for any
       *  WebView that has JS disabled (shouldn't happen in Capacitor, but
       *  cheap insurance). */}
      <noscript>
        <meta httpEquiv="refresh" content={`0; url=${HOME}`} />
      </noscript>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "#0a0612",
        }}
      />
    </>
  );
}
