#!/usr/bin/env node
// Wraps `next build` for the Capacitor (Android) target. Next.js refuses to
// build with `output: "export"` if a `proxy` file is present, so we move
// src/proxy.ts out of the way for the duration of the build and restore it
// after — including on failure/SIGINT — so the file always ends up back in
// the working tree.

import { existsSync, renameSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const proxy = join(repoRoot, "src", "proxy.ts");
const stash = `${proxy}.skip-mobile`;

let stashed = false;

function unstash() {
  if (stashed && existsSync(stash)) {
    renameSync(stash, proxy);
    stashed = false;
  }
}

process.on("exit", unstash);
process.on("SIGINT", () => {
  unstash();
  process.exit(130);
});
process.on("SIGTERM", () => {
  unstash();
  process.exit(143);
});

if (existsSync(proxy)) {
  renameSync(proxy, stash);
  stashed = true;
}

const child = spawn(
  "npx",
  ["--no-install", "dotenv", "-e", ".env.mobile", "--", "next", "build"],
  {
    cwd: repoRoot,
    stdio: "inherit",
    env: { ...process.env, BUILD_TARGET: "mobile" },
  },
);

child.on("exit", (code, signal) => {
  unstash();
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
