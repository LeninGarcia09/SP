# ── Stage 1: Build ──────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json* tsconfig.base.json ./

# Copy shared package
COPY packages/shared/ packages/shared/

# Copy API package
COPY apps/api/ apps/api/

# Install ALL workspace deps (need devDependencies for build)
RUN npm ci --workspace=packages/shared --workspace=apps/api --include-workspace-root

# Build shared package first
RUN npm run build --workspace=packages/shared

# Build API
RUN npm run build --workspace=apps/api

# ── Stage 2: Production ────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Copy workspace root
COPY package.json package-lock.json* ./

# Copy built shared package
COPY --from=builder /app/packages/shared/package.json packages/shared/package.json
COPY --from=builder /app/packages/shared/dist/ packages/shared/dist/

# Copy built API
COPY --from=builder /app/apps/api/package.json apps/api/package.json
COPY --from=builder /app/apps/api/dist/ apps/api/dist/

# Install production dependencies only
RUN npm ci --workspace=packages/shared --workspace=apps/api --include-workspace-root --omit=dev

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "apps/api/dist/main.js"]
