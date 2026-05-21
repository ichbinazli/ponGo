FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:1.25-alpine

RUN printf 'server {\n\
    listen 5173 ssl;\n\
    ssl_certificate /etc/nginx/ssl/cert.pem;\n\
    ssl_certificate_key /etc/nginx/ssl/key.pem;\n\
    ssl_protocols TLSv1.2 TLSv1.3;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location /api {\n\
        return 404;\n\
    }\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/certs /etc/nginx/ssl

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
