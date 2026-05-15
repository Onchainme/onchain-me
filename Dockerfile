# syntax=docker/dockerfile:1.7

# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
# Native build deps: libc6-compat for prebuilt addons used by the Solana stack;
# python3/make/g++/linux-headers/eudev-dev/libusb-dev are required so npm can
# compile the `usb` addon pulled in transitively by @trezor/transport.
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    linux-headers \
    eudev-dev \
    libusb-dev
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* vars are baked into the bundle at build time.
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
# Controls which Solana cluster the Explorer links point at (Solscan ?cluster=…
# and explorer.solana.com paths). Use mainnet-beta on prod; defaults to devnet
# in solana-explorer.ts when this is unset, so dev builds Just Work.
ARG NEXT_PUBLIC_SOLANA_CLUSTER
ENV NEXT_PUBLIC_SOLANA_CLUSTER=${NEXT_PUBLIC_SOLANA_CLUSTER}

# RPC the wallet adapter uses to submit signed mint transactions + confirm
# them. Must match the cluster the backend builds blockhashes against —
# mismatched values produce "Blockhash not found" simulation errors.
ARG NEXT_PUBLIC_SOLANA_RPC_URL
ENV NEXT_PUBLIC_SOLANA_RPC_URL=${NEXT_PUBLIC_SOLANA_RPC_URL}

# Public origins for the split-domain deployment. NEXT_PUBLIC_APP_URL is the
# subdomain that serves the app (e.g. https://app.onchainme.to), used by the
# marketing landing's CTAs. NEXT_PUBLIC_LANDING_URL is the apex (e.g.
# https://onchainme.to), used by the app's logo to navigate back to the
# landing. Both inline into the bundle at build time.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ARG NEXT_PUBLIC_LANDING_URL
ENV NEXT_PUBLIC_LANDING_URL=${NEXT_PUBLIC_LANDING_URL}
# Master switch for the hostname split in src/proxy.ts. "true" makes the
# proxy enforce apex=landing / app.=dashboard; anything else (incl. unset)
# keeps it a pass-through. Inlined at build time.
ARG NEXT_PUBLIC_ENABLE_DOMAIN_SPLIT
ENV NEXT_PUBLIC_ENABLE_DOMAIN_SPLIT=${NEXT_PUBLIC_ENABLE_DOMAIN_SPLIT}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user.
RUN addgroup -S -g 1001 nodejs \
 && adduser -S -u 1001 -G nodejs nextjs

# Copy only what `next build` produced under "output: standalone".
# `standalone/` already contains a pruned node_modules + server.js.
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/ >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
