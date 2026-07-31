FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/ ./packages/
COPY apps/payment-verification-web/ ./apps/payment-verification-web/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter payment-verification-web build

FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/payment-verification-web/ ./apps/payment-verification-web/

ENV NODE_ENV=production

EXPOSE 3000

CMD ["pnpm", "--filter", "payment-verification-web", "start"]
