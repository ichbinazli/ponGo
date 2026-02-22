FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# devDependencies dahil kurulmalı (webpack burada)
RUN npm ci

COPY . .

# TypeScript + Webpack build
RUN npm run build

EXPOSE 5173

# Build sonrası http-server ile serve et (HTTPS)
CMD ["npm", "run", "serve"]
