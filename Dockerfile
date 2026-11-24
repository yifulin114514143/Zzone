# Stage 1: Build static SPA
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# Stage 2: Lightweight production runtime (zero extra runtime dependencies)
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json ./
COPY --from=builder /app/dist ./dist
COPY server ./server
COPY scripts ./scripts
COPY src/industry/officialSnapshot.json ./src/industry/officialSnapshot.json

RUN mkdir -p /app/server/data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1

CMD ["node", "server/index.mjs"]
