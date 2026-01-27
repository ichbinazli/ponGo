# ⚙️ Deployment Rehberi

Backend'i production ortamına deploy etmek için kapsamlı checklist ve talimatlar.

---

## 📋 İçindekiler

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Variables](#environment-variables)
3. [SSL/HTTPS Kurulumu](#sslhttps-kurulumu)
4. [Database](#database)
5. [Production Build](#production-build)
6. [Monitoring](#monitoring)

---

## Pre-Deployment Checklist

### Güvenlik

- [ ] `JWT_SECRET` değiştirildi (min 32 karakter, rastgele)
- [ ] `NODE_ENV=production` ayarlandı
- [ ] OAuth secrets production değerleriyle güncellendi
- [ ] SSL sertifikaları hazırlandı
- [ ] Rate limiting aktif
- [ ] CORS origin'ler güncellendi

### Database

- [ ] Database dosyası güvenli konumda
- [ ] Backup stratejisi belirlendi
- [ ] Migration'lar uygulandı

### Uygulama

- [ ] TypeScript build başarılı (`npm run build`)
- [ ] Unit testler geçiyor (`npm test`)
- [ ] Health check çalışıyor

---

## Environment Variables

### Zorunlu Değişkenler

| Değişken | Production Değeri | Açıklama |
|----------|-------------------|----------|
| `NODE_ENV` | `production` | Ortam türü |
| `PORT` | `3000` | Sunucu portu |
| `HOST` | `0.0.0.0` | Dinlenecek IP |
| `JWT_SECRET` | `<random-64-char>` | Token imzalama anahtarı |
| `DATABASE_PATH` | `/data/transcendence.db` | Database konumu |
| `CORS_ORIGIN` | `https://yourdomain.com` | İzinli origin'ler |

### JWT Yapılandırması

```env
JWT_SECRET=<your-super-secret-production-key-min-64-chars>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

### OAuth Yapılandırması

```env
# 42 Intra
FORTYTWO_CLIENT_ID=<production-client-id>
FORTYTWO_CLIENT_SECRET=<production-secret>
FORTYTWO_CALLBACK_URL=https://yourdomain.com/api/oauth/42/callback

# Google
GOOGLE_CLIENT_ID=<production-client-id>
GOOGLE_CLIENT_SECRET=<production-secret>
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/oauth/google/callback

# GitHub
GITHUB_CLIENT_ID=<production-client-id>
GITHUB_CLIENT_SECRET=<production-secret>
GITHUB_CALLBACK_URL=https://yourdomain.com/api/oauth/github/callback
```

### SSL Yapılandırması

```env
SSL_KEY_PATH=/etc/ssl/private/server.key
SSL_CERT_PATH=/etc/ssl/certs/server.crt
```

### Rate Limiting

```env
RATE_LIMIT_MAX=100          # Dakika başına max istek
RATE_LIMIT_WINDOW_MS=60000  # Window süresi (ms)
```

---

## SSL/HTTPS Kurulumu

### Let's Encrypt ile Sertifika

```bash
# Certbot kurulumu
sudo apt install certbot

# Sertifika alma
sudo certbot certonly --standalone -d yourdomain.com

# Sertifika konumları
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

### Self-Signed (Development)

```bash
cd certs/
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem \
  -days 365 -nodes -subj "/CN=localhost"
```

---

## Database

### Backup Stratejisi

```bash
# Manuel backup
sqlite3 transcendence.db ".backup '/backup/transcendence_$(date +%Y%m%d).db'"

# Cron job (günlük)
0 3 * * * sqlite3 /app/database/transcendence.db ".backup '/backup/transcendence_$(date +\%Y\%m\%d).db'"
```

### Restore

```bash
cp /backup/transcendence_20260127.db /app/database/transcendence.db
```

### Migration

Migration'lar uygulama başlangıcında otomatik çalışır. Manuel çalıştırma:

```bash
npm run db:migrate
```

---

## Production Build

### Build ve Çalıştırma

```bash
# Bağımlılıkları yükle
npm ci --only=production

# TypeScript derle
npm run build

# Production modda başlat
NODE_ENV=production node dist/app.js
```

### PM2 ile Process Management

```bash
# PM2 kurulumu
npm install -g pm2

# Başlat
pm2 start dist/app.js --name "ft-backend"

# Restart on boot
pm2 startup
pm2 save

# Logları görüntüle
pm2 logs ft-backend
```

### Systemd Service

```ini
# /etc/systemd/system/ft-backend.service
[Unit]
Description=ft_transcendence Backend
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/app
ExecStart=/usr/bin/node dist/app.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable ft-backend
sudo systemctl start ft-backend
```

---

## Monitoring

### Health Check

```bash
curl -s https://localhost:3000/health | jq
```

```json
{
  "status": "ok",
  "timestamp": "2026-01-27T12:00:00.000Z",
  "uptime": 3600
}
```

### Log Seviyeleri

| NODE_ENV | Log Level |
|----------|-----------|
| development | debug |
| production | info |

### Prometheus Metrics (Opsiyonel)

```bash
# Fastify metrics plugin eklenebilir
npm install @fastify/metrics
```

---

## Troubleshooting

### Yaygın Sorunlar

| Sorun | Çözüm |
|-------|-------|
| Port kullanımda | `lsof -i :3000` ile process'i bul ve sonlandır |
| Database lock | WAL mode kontrol et, birden fazla yazma işlemi var mı? |
| SSL hatası | Sertifika yollarını ve izinlerini kontrol et |
| Memory leak | PM2 ile restart limitleri ayarla |

### Logları Kontrol Et

```bash
# PM2
pm2 logs ft-backend --lines 100

# Systemd
journalctl -u ft-backend -f
```

---

*Son Güncelleme: Ocak 2026*
