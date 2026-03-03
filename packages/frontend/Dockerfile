# =============================================================================
# Frontend Dockerfile — Multi-stage build (Next.js standalone)
# Build context: monorepo root
# =============================================================================

# ---- Stage 1: Dependencies ----
FROM node:22-slim AS deps

# Install build tools for native dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/frontend/package.json packages/frontend/

RUN pnpm install --frozen-lockfile

# ---- Stage 2: Builder ----
FROM deps AS builder

COPY packages/frontend/ packages/frontend/

# NEXT_PUBLIC_* vars must be set at build time (baked into client JS)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ARG NEXT_PUBLIC_X402_CHAIN=bite-v2-sandbox
ARG NEXT_PUBLIC_X402_CURRENCY=USDC

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ENV NEXT_PUBLIC_X402_CHAIN=$NEXT_PUBLIC_X402_CHAIN
ENV NEXT_PUBLIC_X402_CURRENCY=$NEXT_PUBLIC_X402_CURRENCY

RUN pnpm --filter frontend run build

# ---- Stage 3: Production runner ----
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Next.js standalone output mirrors the monorepo structure
COPY --from=builder /app/packages/frontend/.next/standalone ./
COPY --from=builder /app/packages/frontend/.next/static ./packages/frontend/.next/static
COPY --from=builder /app/packages/frontend/public ./packages/frontend/public

EXPOSE 3000

ENV HOSTNAME=0.0.0.0
ENV PORT=3000

CMD ["node", "packages/frontend/server.js"]
