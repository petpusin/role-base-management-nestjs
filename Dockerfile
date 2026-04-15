# ─────────────────────────────────────────────
# Stage 1: base — pin Node version & enable pnpm
# ─────────────────────────────────────────────
FROM node:22-alpine AS base

# Enable corepack so pnpm is available without a separate install step
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# ─────────────────────────────────────────────
# Stage 2: deps — install ALL dependencies
#   (dev deps are needed to compile TypeScript)
# ─────────────────────────────────────────────
FROM base AS deps

COPY package.json pnpm-lock.yaml ./

# --frozen-lockfile guarantees reproducible installs (CI-safe)
RUN pnpm install --frozen-lockfile

# ─────────────────────────────────────────────
# Stage 3: build — compile TypeScript → dist/
# ─────────────────────────────────────────────
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# ─────────────────────────────────────────────
# Stage 4: prod-deps — production-only modules
#   Keeps the final image free of dev tooling
# ─────────────────────────────────────────────
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

# ─────────────────────────────────────────────
# Stage 5: runner — minimal production image
# ─────────────────────────────────────────────
FROM node:22-alpine AS runner

# Run as a non-root user (security best practice)
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nestjs

WORKDIR /app

# Copy only what the runtime actually needs
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build     --chown=nestjs:nodejs /app/dist         ./dist
COPY --chown=nestjs:nodejs package.json ./

USER nestjs

# Google Cloud Run injects PORT at runtime; default to 3000 for local use
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE ${PORT}

# Use exec form so signals (SIGTERM) reach the Node process directly
CMD ["node", "dist/main"]
