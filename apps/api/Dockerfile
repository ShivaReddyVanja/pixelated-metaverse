FROM node:24.11.0-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages ./packages

RUN npm ci

COPY apps/api ./apps/api

RUN npm run build --workspace=api

FROM node:24.11.0-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages ./packages

RUN npm ci --omit=dev

COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 5001

CMD ["node", "apps/api/dist/index.js"]