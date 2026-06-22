# ============================================================
# Animals Service — Multi-stage Dockerfile
# ============================================================
# Animals backend — species catalog, sightings, habitats,
# tracking.
# Uses boot.js to fetch secrets from Vault at startup.
# ============================================================

# ── Stage 1: Install dependencies ─────────────────────────────
FROM node:26-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN apk add --no-cache git
RUN --mount=type=ssh \
    --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile


# ── Stage 2: Build TypeScript ─────────────────────────────────
FROM deps AS build
WORKDIR /app
COPY . .
RUN pnpm run build
# Prune devDependencies for the runtime image
RUN pnpm prune --prod

# ── Stage 3: Runtime ──────────────────────────────────────────
FROM node:26-alpine
WORKDIR /app

# Copy pre-built node_modules from deps stage
COPY --from=build /app/node_modules ./node_modules

# Copy application source
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

# Non-root user for security
RUN addgroup --system --gid 1001 appuser && \
    adduser --system --uid 1001 appuser
USER appuser

EXPOSE 5616

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 -O /dev/null http://127.0.0.1:5616/health || exit 1

CMD ["node", "dist/boot.js"]
