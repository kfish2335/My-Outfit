# frontend/Dockerfile

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# 1) Install dependencies using the lockfile that exists
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then corepack enable && yarn install --frozen-lockfile; \
  else npm i; fi

# 2) Copy source
COPY . .

# 3) Build-time env/options (safe defaults)
#    - Keep devDeps available during build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_DISABLE_ESLINT=1
ENV TSC_COMPILE_ON_ERROR=1

# If your app requires a public API base at build, set a default:
ARG NEXT_PUBLIC_API_BASE=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE

# 4) Build Next.js
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

# Copy only what is needed to run
COPY --from=builder /app/package.json ./

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# Install production deps only (if you have server code requiring deps at runtime)
# If you're only serving the Next build, you can still have a minimal install.
# Keep the same lockfile logic if you need it; otherwise npm ci --omit=dev is fine:
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm i --omit=dev; fi

# Start the Next server
CMD ["npm", "run", "start"]