# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

# ---- Dependencies ----------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build -------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Zum Bauen genügt ein Platzhalter – die echte DATABASE_URL wird erst zur
# Laufzeit injiziert (next build greift dank Server Actions/dynamic
# rendering nicht auf die DB zu).
ENV DATABASE_URL="postgres://user:pass@localhost:5432/db"
ENV BETTER_AUTH_SECRET="build-time-placeholder"
RUN npm run build

# ---- Runtime -------------------------------------------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Wendet beim Start automatisch offene Drizzle-Migrationen an (idempotent,
# s. scripts/migrate.cjs), bevor der Server hochfährt - kein manuelles
# db:migrate mehr im Datenbank-Container nötig.
CMD ["sh", "-c", "node scripts/migrate.cjs && node server.js"]
