# -------------------------
# Stage 1: Build
# -------------------------
FROM node:lts AS builder

# Install dependencies required for Chromium (you may move or remove Chromium 
# if your production runtime doesn't need it, e.g., only needed for headless tests)
RUN apt-get update && apt-get install -y \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy source code
COPY package*.json ./
COPY .env.docker .env
COPY . .

# Install dependencies and build
RUN npm install && \
  NODE_ENV=production npm run build && \
  npm ci --omit=dev

# -------------------------
# Stage 2: Runtime
# -------------------------
FROM node:lts-alpine

# Add chromium in production
RUN apk update && apk add --no-cache \
  ca-certificates \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ttf-freefont

# Set working directory
WORKDIR /usr/src/app

# Copy built files from builder stage
COPY --from=builder /usr/src/app/bin /usr/src/app/bin
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY .env.docker .env

# Run as non-root user (node is already created in node:lts-alpine)
USER node

ENV NODE_ENV=production

LABEL org.opencontainers.image.source="https://github.com/Third-Culture-Software/bhima"
LABEL org.opencontainers.image.description="A hospital information management application for rural Congolese hospitals"
LABEL org.opencontainers.image.licenses="GPL-2.0"

WORKDIR /usr/src/app/bin

# Startup command
CMD ["node", "server/app.js"]
