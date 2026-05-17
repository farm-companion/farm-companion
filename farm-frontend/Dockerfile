# syntax=docker/dockerfile:1.7
# farm-frontend production image (Next.js 16 + Prisma 5 + Node 22)
#
# Build context is farm-frontend/, e.g.:
#   docker build -t farm-frontend:dev ./farm-frontend
#
# Run with runtime env injected by Coolify or docker compose:
#   docker run --rm -p 3000:3000 --env-file .env farm-frontend:dev
#
# Target platform: linux/amd64 (Hetzner CPX42 - shared x86). For multi-arch
# add `--platform=linux/amd64,linux/arm64` to a buildx invocation; sharp +
# Prisma engines have prebuilts for both.

ARG NODE_VERSION=22.11.0
ARG BASE_VARIANT=bookworm-slim

# ----------------------------------------------------------------------------
# deps: install dependencies only - cached layer
# ----------------------------------------------------------------------------
FROM node:${NODE_VERSION}-${BASE_VARIANT} AS deps
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable

# postinstall: prisma generate && node scripts/fix-prisma-zeptomatch.js && patch-package
# All three need their inputs present before `pnpm install` runs.
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY scripts/fix-prisma-zeptomatch.js ./scripts/fix-prisma-zeptomatch.js

ENV CI=1
RUN --mount=type=cache,id=farm-companion-pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ----------------------------------------------------------------------------
# builder: compile Next.js with standalone output
# ----------------------------------------------------------------------------
FROM node:${NODE_VERSION}-${BASE_VARIANT} AS builder
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable

# Build-time placeholders so `next build` does not crash on env validators
# or top-level Prisma client instantiation. Real values are injected at run
# time by Coolify / docker compose - never bake real secrets into the image.
ARG NEXT_PUBLIC_SITE_URL=https://www.farmcompanion.co.uk
ARG DATABASE_URL=postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    DATABASE_URL=$DATABASE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm run build

# ----------------------------------------------------------------------------
# runner: minimal runtime image (~250-350 MB target)
# ----------------------------------------------------------------------------
FROM node:${NODE_VERSION}-${BASE_VARIANT} AS runner
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates curl \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs --home /app --shell /usr/sbin/nologin nextjs

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Next.js standalone output bundles a minimal node_modules and a server.js entry.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma engine artefacts. Standalone's tracer usually pulls these in, but the
# zeptomatch patch indirection has caused intermittent miss in CI. Copy
# explicitly as belt-and-suspenders - costs ~30 MB, prevents runtime crash.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

USER nextjs
EXPOSE 3000

# Liveness probe: any 2xx/3xx from the root path means the server is up.
# Coolify will additionally do its own external probe; do not duplicate here.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS --max-time 4 -o /dev/null http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
