FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Dev bağımlılıkları da yükle (webpack build için gerekli)
RUN npm ci

COPY . .

RUN npm run build

# Production aşaması
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

# Build çıktısını ve ssl sertifikalarını kopyala
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/certs ./certs

EXPOSE 5173

CMD ["npm", "run", "serve"]
