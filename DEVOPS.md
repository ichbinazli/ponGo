# ft_transcendence — DevOps Dokümantasyonu

> Bu doküman, projeyi ayağa kaldırmak isteyen ekip üyeleri için hazırlanmıştır.  
> **`.env` dosyası ve SSL sertifikaları repoya dahildir** — ek kurulum gerekmez.  
> Tek ihtiyacın: Docker ve Docker Compose.

---

## İçindekiler

1. [Ön Gereksinimler](#1-ön-gereksinimler)
2. [Projeyi Çalıştırma](#2-projeyi-çalıştırma)
3. [Proje Mimarisi](#3-proje-mimarisi)
4. [Servisler ve URL'ler](#4-servisler-ve-urllar)
5. [Nginx Routing Yapısı](#5-nginx-routing-yapısı)
6. [Monitoring (Prometheus + Grafana)](#6-monitoring-prometheus--grafana)
7. [Log Yönetimi (ELK Stack)](#7-log-yönetimi-elk-stack)
8. [SSL Sertifikası](#8-ssl-sertifikası)
9. [Faydalı Docker Komutları](#9-faydalı-docker-komutları)
10. [Mimari Diyagramı](#10-mimari-diyagramı)
11. [Sorun Giderme](#11-sorun-giderme)

---

## 1. Ön Gereksinimler

| Araç | Minimum Sürüm | Kontrol Komutu |
|------|--------------|----------------|
| Docker | 24.x | `docker --version` |
| Docker Compose | 2.x (v2 plugin) | `docker compose version` |
| OpenSSL | herhangi | `openssl version` |

---

## 2. Projeyi Çalıştırma

```bash
# Tüm servisleri başlat (ilk seferde image'lar derlenir, 5-10 dk sürebilir)
docker compose up -d --build

# Bağlantıyı test et
curl -sk https://localhost/health
# Beklenen çıktı: {"status":"ok","uptime":...}
```

**Hepsi bu kadar.** 🎉

Tüm container'ların durumunu görmek için:
```bash
docker compose ps
```
Tüm servislerin `Up` veya `healthy` statüsünde olması gerekir.

---

## 3. Proje Mimarisi

```
┌─────────────────────────────────────────────────────────────────┐
│                        Kullanıcı Tarayıcısı                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS :443
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Nginx (Reverse Proxy)                          │
│  • HTTP → HTTPS yönlendirme (:80 → :443)                        │
│  • Rate limiting (API: 30r/m, Auth: 5r/m)                       │
│  • SSL termination                                               │
│  • Gzip sıkıştırma                                              │
└────┬──────────┬───────────┬───────────┬──────────┬─────────────┘
     │          │           │           │          │
     │/         │/api       │/api/auth  │/api/users│/api/game
     ▼          ▼           ▼           ▼          ▼
  ┌──────┐  ┌────────┐  ┌─────────┐ ┌─────────┐ ┌──────────┐
  │  UI  │  │Backend │  │  Auth   │ │  User   │ │  Game    │
  │:5173 │  │ :3000  │  │Service  │ │ Service │ │ Service  │
  │(Game)│  │(Fastify│  │  :3001  │ │  :3002  │ │  :3003   │
  └──────┘  │ HTTPS) │  └─────────┘ └─────────┘ └──────────┘
            └────────┘
                │
                ▼
       SQLite Database
       (persistent volume)

Monitoring Stack (ayrı):
  Prometheus :9090 → Grafana :3001(ext)
  Elasticsearch → Logstash → Kibana :5601(ext)
  Node Exporter + cAdvisor → Prometheus
```

---

## 4. Servisler ve URL'ler

### Uygulama Servisleri

| Servis | Container | Dahili Port | Dışarıdan Erişim | Açıklama |
|--------|-----------|-------------|------------------|----------|
| **Ana Uygulama (UI)** | `ft_game` | 5173 | `https://localhost/` | Frontend + Pong oyunu |
| **Backend API** | `ft_backend` | 3000 | `https://localhost/api/` | Fastify REST API (HTTPS) |
| **Auth Service** | `ft_auth_service` | 3001 | `https://localhost/api/auth/` | JWT + OAuth |
| **User Service** | `ft_user_service` | 3002 | `https://localhost/api/users/` | Kullanıcı profili |
| **Game Service** | `ft_game_service` | 3003 | `https://localhost/api/game/` | Oyun mantığı |
| **Nginx** | `ft_nginx` | 80, 443 | `https://localhost` | Reverse proxy |

### Monitoring Servisleri

| Servis | Container | Dışarıdan Erişim | Giriş |
|--------|-----------|------------------|-------|
| **Grafana** | `ft_grafana` | `http://localhost:3001` | admin / `ft_grafana_2024!` |
| **Prometheus** | `ft_prometheus` | `http://localhost:9090` | Şifresiz |
| **Kibana** | `ft_kibana` | `http://localhost:5601` | elastic / `ft_elastic_2024!` |

### Önemli API Endpoint'leri

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `https://localhost/health` | GET | Backend sağlık durumu |
| `https://localhost/metrics` | GET | Prometheus metrikleri |
| `https://localhost/api/auth/register` | POST | Kullanıcı kaydı |
| `https://localhost/api/auth/login` | POST | Kullanıcı girişi |
| `https://localhost/api/users/me` | GET | Oturum bilgisi (token gerekli) |

---

## 5. Nginx Routing Yapısı

Nginx tüm trafiği tek noktadan yönetir:

```
https://localhost/              → ft_game (Frontend UI) :5173
https://localhost/api/*         → ft_backend :3000 (HTTPS, rate: 30r/m)
https://localhost/api/auth/*    → ft_backend :3000 (daha sıkı rate: 5r/m)
https://localhost/health        → ft_backend :3000/health
https://localhost/metrics       → ft_backend :3000/metrics
https://localhost/ws/*          → ft_backend :3000 (WebSocket)
http://localhost/*              → 301 → https://localhost/*
```

**Rate Limiting:**
- `/api/*` genel: `30 istek/dakika` per IP (burst: 20)
- `/api/auth/*` (login/register): `5 istek/dakika` per IP (burst: 10)

---

## 6. Monitoring (Prometheus + Grafana)

### Grafana Dashboard

`http://localhost:3001` → `admin` / `ft_grafana_2024!`

`Dashboards → ft_transcendence → ft_transcendence - Overview` panosunda:

| Panel | Açıklama |
|-------|----------|
| **Servis Sağlığı** | Backend, Auth, User, Game servislerinin UP/DOWN durumu |
| **CPU Kullanımı** | Host sistem CPU grafiği |
| **RAM Kullanımı** | Host sistem bellek grafiği |
| **HTTP Metrikleri** | `http_requests_total`, response süreleri |

### Prometheus Targets

`http://localhost:9090/targets` adresinde tüm scrape hedefleri görünür.

| Job | Hedef | Açıklama |
|-----|-------|----------|
| `backend` | `backend:3000` (HTTPS) | Ana backend metrikleri |
| `auth-service` | `auth-service:3001` | Auth servisi |
| `user-service` | `user-service:3002` | User servisi |
| `game-service` | `game-service:3003` | Game servisi |
| `node-exporter` | `node-exporter:9100` | Host sistem metrikleri |
| `cadvisor` | `cadvisor:8080` | Docker container metrikleri |
| `prometheus` | `localhost:9090` | Prometheus kendisi |

> **Not:** Backend HTTPS çalıştığı için `prometheus.yml`'de `scheme: https` ve  
> `tls_config.insecure_skip_verify: true` yapılandırılmıştır.

---

## 7. Log Yönetimi (ELK Stack)

### Kibana

`http://localhost:5601` → `elastic` / `ft_elastic_2024!`

### Log Akışı

```
Nginx log dosyaları (JSON format)
    ↓
Filebeat (log toplayıcı)
    ↓
Logstash (log işleme + zenginleştirme)
    ↓
Elasticsearch (depolama + indeksleme)
    ↓
Kibana (görselleştirme + arama)
```

Nginx logları JSON formatında tutulur:

```json
{
  "time": "2026-02-22T04:00:00+03:00",
  "remote_addr": "172.18.0.1",
  "method": "GET",
  "uri": "/api/users/me",
  "status": "200",
  "request_time": "0.003",
  "service": "nginx"
}
```

---

## 8. SSL Sertifikası

Proje self-signed sertifika kullanır. Sertifikalar repoya dahildir — ek kurulum gerekmez.

**Sertifika Konumları:**

| Yer | Yol |
|-----|-----|
| Nginx | `nginx/ssl/cert.pem` ve `nginx/ssl/key.pem` |
| Backend | `ft_transcendence-backend/backend/certs/cert.pem` ve `key.pem` |

Tarayıcı "Güvenli değil" uyarısı verecektir — bu normaldir:  
**"Gelişmiş" → "localhost'a ilerle (güvensiz)"** diyerek geçebilirsin.

**Sertifikayı yenilemek gerekirse** (365 gün sonra):

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=TR/ST=Istanbul/L=Istanbul/O=ft_transcendence/CN=localhost"

cp nginx/ssl/key.pem ft_transcendence-backend/backend/certs/key.pem
cp nginx/ssl/cert.pem ft_transcendence-backend/backend/certs/cert.pem

docker compose restart nginx backend
```

---

## 9. Faydalı Docker Komutları

### Genel

```bash
# Tüm servisleri başlat
docker compose up -d --build

# Tüm servisleri durdur
docker compose down

# Servis durumlarını gör
docker compose ps

# Tüm logları canlı izle
docker compose logs -f

# Belirli bir servisin logunu izle
docker compose logs -f backend
docker compose logs -f nginx
docker compose logs -f prometheus
```

### Tek Servis Yeniden Başlatma

```bash
# Nginx konfigürasyonu değiştiyse
docker compose restart nginx

# Backend kodu değiştiyse — yeniden derle
docker compose build backend && docker compose up -d --force-recreate backend

# Prometheus yapılandırması değiştiyse
docker compose restart prometheus
```

### Temizlik

```bash
# Container'ları sil (volume'lar = veriler kalır)
docker compose down

# Her şeyi sıfırla — VERİ KAYBI OLUR!
docker compose down -v
docker image prune -f
```

### Debug Komutları

```bash
# Nginx konfigürasyonunu test et
docker exec ft_nginx nginx -t

# Backend metrics endpoint'ini test et
docker exec ft_backend wget -qO- --no-check-certificate https://localhost:3000/metrics | head -20

# Belirli bir container'ın healthcheck durumu
docker inspect ft_backend --format='{{.State.Health.Status}}'
```

---

## 10. Mimari Diyagramı

### Dışarıya Açık Portlar

| Dış Port | Servis | Protokol | Erişim |
|----------|--------|----------|--------|
| `80` | Nginx | HTTP | → HTTPS yönlendirme |
| `443` | Nginx | HTTPS | Ana uygulama |
| `3001` | Grafana | HTTP | Monitoring dashboard |
| `5601` | Kibana | HTTP | Log görselleştirme |
| `9090` | Prometheus | HTTP | Metrik sorgulama |

> Diğer tüm servisler (backend, microservices, ELK) yalnızca Docker iç ağında erişilebilirdir.

### Kalıcı Volume'lar

| Volume | İçerik |
|--------|--------|
| `backend_data` | SQLite veritabanı |
| `backend_uploads` | Kullanıcı avatar dosyaları |
| `backend_logs` | Backend uygulama logları |
| `nginx_logs` | Nginx access/error logları |
| `es_data` | Elasticsearch indeksleri |
| `prometheus_data` | Metrik verileri |
| `grafana_data` | Dashboard konfigürasyonları |

---

## 11. Sorun Giderme

### Servis başlamıyor

```bash
# Servis loglarına bak
docker compose logs backend --tail=50

# Container sağlık durumunu kontrol et
docker inspect ft_backend --format='{{.State.Health.Status}}'
```

### 502 Bad Gateway

Backend HTTPS üzerinde çalışır; nginx `proxy_ssl_verify off` ile bağlanır.

```bash
docker exec ft_nginx nginx -t   # nginx config doğruluğunu kontrol et
docker compose ps backend       # backend ayakta mı?
```

### Grafana'da servis DOWN görünüyor

```bash
# Prometheus target durumlarını kontrol et
curl http://localhost:9090/api/v1/targets | python3 -m json.tool | grep -E '"job"|"health"'
```

### Tarayıcı SSL hatası

Self-signed sertifika nedeniyle normaldir.  
→ **"Gelişmiş"** → **"localhost'a ilerle (güvensiz)"**

### Port çakışması

```bash
ss -tlnp | grep :3001   # Hangi process kullanıyor?
```

---

## Katkıda Bulunanlar

```
naanapa · fgumusay · egermen · ndogan · kcevik
```
