# ⚙️ Deployment

Production deployment rehberi.

---

## Pre-Deployment Checklist

### Güvenlik
- [ ] `JWT_SECRET` değiştirildi (min 32 karakter)
- [ ] `NODE_ENV=production`
- [ ] OAuth secrets güncellendi
- [ ] SSL sertifikaları hazır
- [ ] CORS origin'ler güncellendi

### Database
- [ ] Backup stratejisi belirlendi
- [ ] Migration'lar uygulandı

### Uygulama
- [ ] `npm run build` başarılı
- [ ] `npm test` geçiyor

---

## Environment Variables

### Zorunlu

| Değişken | Production Değeri |
|----------|-------------------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `JWT_SECRET` | `<min-64-char-random>` |
| `DATABASE_PATH` | `/data/transcendence.db` |
| `CORS_ORIGIN` | `https://yourdomain.com` |

### OAuth (42 Intra)

```env
FORTYTWO_CLIENT_ID=<production-id>
FORTYTWO_CLIENT_SECRET=<production-secret>
FORTYTWO_CALLBACK_URL=https://yourdomain.com/api/oauth/42/callback
```

### SMTP (Email)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="ft_transcendence <no-reply@ft_transcendence.com>"
```

### SSL

```env
SSL_KEY_PATH=/etc/ssl/private/server.key
SSL_CERT_PATH=/etc/ssl/certs/server.crt
```

---

## SSL/HTTPS

### Let's Encrypt

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

### Self-Signed (Dev)

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

---

## Database Backup

```bash
# Manuel
sqlite3 transcendence.db ".backup '/backup/db_$(date +%Y%m%d).db'"

# Cron (günlük 03:00)
0 3 * * * sqlite3 /app/database/transcendence.db ".backup '/backup/db_$(date +\%Y\%m\%d).db'"
```

---

## Production Build

```bash
npm ci --only=production
npm run build
NODE_ENV=production node dist/app.js
```

### PM2

```bash
npm install -g pm2
pm2 start dist/app.js --name "ft-backend"
pm2 startup
pm2 save
```

### Systemd

```ini
[Unit]
Description=ft_transcendence Backend
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/app
ExecStart=/usr/bin/node dist/app.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

---

## Health Check

```bash
curl https://localhost:3000/health
# {"status":"ok","timestamp":"...","uptime":...}
```

---

*Son Güncelleme: Ocak 2026*
