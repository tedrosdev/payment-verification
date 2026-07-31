FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/ ./packages/
COPY apps/payment-verification-api/ ./apps/payment-verification-api/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter payment-verification-api prisma generate
RUN pnpm --filter payment-verification-api build

FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/payment-verification-api/ ./apps/payment-verification-api/

ENV NODE_ENV=production

EXPOSE 3001

CMD ["pnpm", "--filter", "payment-verification-api", "start:prod"]
