import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle so the production Docker image only
  // needs Node + the compiled output (no node_modules at runtime).
  output: "standalone",
  // @pixi/react does not clean up its WebGL/shader context across the
  // double-mount React Strict Mode performs in dev. After navigating away
  // and back to a canvas-bearing route, the next `<Application>` boots with
  // stale GL references and crashes inside `gl.getShaderSource()` /
  // `applyStyleParams`. Tracked upstream:
  //   https://github.com/pixijs/pixi-react/issues/602
  // Strict Mode's double-invoke only happens in dev — production builds
  // mount components once, so disabling this here just makes dev behave
  // like prod. Re-enable once the upstream issue is fixed.
  reactStrictMode: false,
};

export default nextConfig;
