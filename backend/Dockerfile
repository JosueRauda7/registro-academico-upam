FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit
COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
