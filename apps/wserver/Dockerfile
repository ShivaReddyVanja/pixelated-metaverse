FROM node:24.11.0-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/wserver/package.json ./apps/wserver/
COPY packages ./packages

RUN npm ci

COPY apps/wserver ./apps/wserver

RUN npm run build --workspace=wserver

FROM node:24.11.0-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/wserver/package.json ./apps/wserver/
COPY packages ./packages

RUN npm ci --omit=dev

COPY --from=builder /app/apps/wserver/dist ./apps/wserver/dist

EXPOSE 5002

CMD ["node", "apps/wserver/dist/index.js"]
