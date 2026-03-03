# =============================================================================
# Backend Dockerfile — Multi-stage build
# Build context: monorepo root (needs x402-sdk-eth source + pnpm workspace)
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

# Copy workspace config + package.json files for dependency install
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/backend/package.json packages/backend/
COPY packages/x402-sdk-eth/package.json packages/x402-sdk-eth/

RUN pnpm install --frozen-lockfile

# ---- Stage 2: Builder ----
FROM deps AS builder

# Copy SDK source and build it first (tsup)
COPY packages/x402-sdk-eth/ packages/x402-sdk-eth/
# Build SDK JS only (skip DTS — not needed at runtime)
RUN cd packages/x402-sdk-eth && npx tsup src/index.ts --format cjs,esm

# Copy backend source and build it
# tsc has noEmitOnError:false — emits JS despite type-only errors (missing .d.ts, Express augmentation)
COPY packages/backend/ packages/backend/
RUN cd packages/backend && (npx tsc || true) && node scripts/fix-imports.js

# tsc expands rootDir to include SDK source, producing:
#   dist/backend/src/   — compiled backend code
#   dist/x402-sdk-eth/src/ — compiled SDK source (for dynamic imports)
#
# But eth-utils.js imports from x402-sdk-eth/dist/ (tsup output),
# which resolves to dist/x402-sdk-eth/dist/ — copy it there:
RUN cp -r packages/x402-sdk-eth/dist/ packages/backend/dist/x402-sdk-eth/dist/
# tsup CJS output (index.js) uses module.exports — incompatible with backend's
# "type":"module". Overwrite with ESM build (index.mjs) so Node treats it as ESM:
RUN cp packages/x402-sdk-eth/dist/index.mjs packages/backend/dist/x402-sdk-eth/dist/index.js

# Static files: __dirname at runtime = dist/backend/src/
# path.join(__dirname, "../public/files") = dist/backend/public/files/
RUN mkdir -p packages/backend/dist/backend/public && \
    cp -r packages/backend/public/files packages/backend/dist/backend/public/files

# ---- Stage 3: Production runner ----
FROM node:22-slim AS runner

# Install build tools for native dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

ENV NODE_ENV=production

# Install production deps only
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/backend/package.json packages/backend/
COPY packages/x402-sdk-eth/package.json packages/x402-sdk-eth/
RUN pnpm install --frozen-lockfile --prod

# Copy compiled backend (includes SDK dist + static files)
COPY --from=builder /app/packages/backend/dist/ packages/backend/dist/

EXPOSE 3001

CMD ["node", "packages/backend/dist/backend/src/index.js"]
