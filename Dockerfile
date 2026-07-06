# ---- build the client (React/Vite) ----
FROM node:20-bookworm-slim AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ---- runtime (Express server + static build) ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# better-sqlite3 ships prebuilt binaries for glibc (bookworm) — no compiler needed
COPY package*.json ./
RUN npm install --omit=dev

COPY server/ ./server/
COPY --from=client /app/client/dist ./client/dist

# Persistent data — mount /app/data as a volume (CapRover persistent volume,
# docker `-v mellon-data:/app/data`, or a compose named volume).
RUN mkdir -p /app/data
ENV DB_PATH=/app/data/mellon.db

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.js"]
