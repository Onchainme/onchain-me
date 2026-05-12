import type { NextConfig } from "next";

// Mobile builds (Capacitor / Android) need a fully static export so the bundle
// can be packed into the WebView. Trigger via `BUILD_TARGET=mobile next build`.
// Web (Docker) keeps the standalone server bundle.
const isMobile = process.env.BUILD_TARGET === "mobile";

const nextConfig: NextConfig = isMobile
  ? {
      output: "export",
      images: { unoptimized: true },
      trailingSlash: true,
    }
  : {
      output: "standalone",
    };

export default nextConfig;
