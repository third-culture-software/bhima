# -------------------------
# Stage 1: Build
# -------------------------
FROM node:lts AS builder

# Install dependencies required for Chromium (you may move or remove Chromium 
# if your production runtime doesn't need it, e.g., only needed for headless tests)
RUN apt-get update && apt-get install -y \
  ca-certificates \
  fonts-liberation gconf-service \
  libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 \
  libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libgconf-2-4 \
  libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 \
  libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
  libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
  libxss1 libxtst6 lsb-release libxshmfence1 chromium \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy source code
COPY package*.json ./
COPY .env.docker .env
COPY . .

# Install dependencies and build
RUN npm install && \
  NODE_ENV=production npm run build && \
  npm install --omit=dev

# -------------------------
# Stage 2: Runtime
# -------------------------
FROM node:lts-alpine

# Install only the libraries needed at runtime for Chromium
# (Again, consider if Chromium or these libraries are really needed in production)
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
