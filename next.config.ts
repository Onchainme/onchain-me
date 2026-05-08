import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle so the production Docker image only
  // needs Node + the compiled output (no node_modules at runtime).
  output: "standalone",
};

export default nextConfig;
