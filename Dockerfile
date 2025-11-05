# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Install with pinned lockfile, prod only
RUN npm ci --omit=dev

# ---- runtime ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Create non-root user (official image already has 'node')
USER node

# Copy deps first, then app code (use chown so node user owns files)
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .

EXPOSE 8080
CMD ["npm","start"]
