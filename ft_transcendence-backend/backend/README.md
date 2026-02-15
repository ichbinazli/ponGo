# 🏓 ft_transcendence Backend

Bu, ft_transcendence projesinin backend (sunucu) kısmıdır. Pong oyunu platformunun tüm arka plan işlemlerini yönetir.

---

## 📋 İçindekiler

- [Ne İşe Yarar?](#-ne-işe-yarar)
- [Gereksinimler](#-gereksinimler)
- [Kurulum](#-kurulum)
- [Çalıştırma](#-çalıştırma)
- [Durdurma](#-durdurma)
- [API Endpoint'leri](#-api-endpointleri)
- [Sorun Giderme](#-sorun-giderme)

---

## 🎯 Ne İşe Yarar?

Backend şunları yapar:
- **Kullanıcı Yönetimi:** Kayıt, giriş, profil düzenleme
- **Güvenlik:** Şifre hashleme, JWT token, 2FA
- **Sosyal Özellikler:** Arkadaş ekleme, engelleme
- **Oyun Verileri:** Maç sonuçları, skor tablosu, istatistikler
- **OAuth:** Google, GitHub, 42 ile giriş

---

## 💻 Gereksinimler

Bilgisayarında şunlar kurulu olmalı:

| Program | Minimum Versiyon | Kontrol Komutu |
|---------|------------------|----------------|
| Node.js | 20.0.0 | `node --version` |
| npm | 9.0.0 | `npm --version` |

**Node.js kurulu değilse:** https://nodejs.org adresinden indir.

---

## 📦 Kurulum

### Adım 1: Doğru klasöre git
```bash
cd ~/backend
```

### Adım 2: Bağımlılıkları yükle
```bash
npm install
```
> Bu komut 1-2 dakika sürebilir. İnternet bağlantısı gerekli.

### Adım 3: Ortam değişkenlerini ayarla
```bash
cp .env.example .env
```

### Adım 4: .env dosyasını düzenle
Herhangi bir metin editörü ile `.env` dosyasını aç ve şu satırı bul:
```
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

Şu şekilde değiştir (en az 32 karakter):
JWT_SECRET=benim-gizli-anahtarim-cok-uzun-olmali-12345678
```

Ayrıca **SMTP (E-posta)** ayarlarını da yapmalısın:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=senin-mailin@gmail.com
SMTP_PASS=google-app-password
```

### Adım 5: Veritabanını oluştur
```bash
npm run db:migrate
```

---

## 🚀 Çalıştırma

### Sunucuyu Başlat
```bash
npm run dev
```

Başarılı olursa şunu göreceksin:
```
[13:37:49 UTC] INFO: 🚀 Server running at http://0.0.0.0:3000
[13:37:49 UTC] INFO: 📖 API documentation at http://0.0.0.0:3000/api
[13:37:49 UTC] INFO: 💚 Health check at http://0.0.0.0:3000/health
```

### Sunucunun Çalıştığını Test Et
Tarayıcında şu adresi aç: http://localhost:3000/health

Şunu görmelisin:
```json
{"status":"ok","timestamp":"...","uptime":...}
```

---

## 🛑 Durdurma

### Sunucuyu Kapat
Terminal penceresinde şu tuş kombinasyonunu kullan:
```
Ctrl + C
```

> Windows'ta da Mac'te de Linux'ta da aynı: `Ctrl` tuşuna basılı tut ve `C` tuşuna bas.

---

## 📡 API Endpoint'leri

Sunucu çalışırken şu adresleri kullanabilirsin:

### Test Endpoint'leri (Giriş Gerektirmez)
| URL | Açıklama |
|-----|----------|
| http://localhost:3000/health | Sunucu durumu |
| http://localhost:3000/api | API bilgisi |
| http://localhost:3000/api/stats/global | Genel istatistikler |
| http://localhost:3000/api/stats/leaderboard | Skor tablosu |

### Kullanıcı İşlemleri
| Metod | URL | Açıklama |
|-------|-----|----------|
| POST | /api/auth/register | Yeni kullanıcı kaydı |
| POST | /api/auth/login | Giriş yap |
| POST | /api/auth/logout | Çıkış yap |
| GET | /api/users/me | Kendi profilim |

---

## 🔧 Sorun Giderme

### Hata: "ENOENT: no such file or directory"
**Sebep:** Yanlış klasördesin.
**Çözüm:** 
```bash
cd ~/Desktop/subject./ft_transcendence-backend/backend
```

### Hata: "Missing environment variables: JWT_SECRET"
**Sebep:** `.env` dosyası yok veya JWT_SECRET ayarlanmamış.
**Çözüm:**
```bash
cp .env.example .env
# Sonra .env dosyasını aç ve JWT_SECRET'i düzenle
```

### Hata: "unable to determine transport target for pino-pretty"
**Sebep:** `pino-pretty` paketi eksik.
**Çözüm:**
```bash
npm install pino-pretty --save-dev
```

### Hata: "EADDRINUSE: address already in use"
**Sebep:** Port 3000 zaten kullanımda.
**Çözüm:** Önceki sunucuyu kapat veya port'u değiştir:
```bash
# Önceki process'i bul ve kapat
lsof -i :3000
kill -9 <PID>
```

---

## 📁 Proje Yapısı

```
backend/
├── src/                    # Kaynak kodlar
│   ├── app.ts             # Ana uygulama
│   ├── config/            # Ayarlar
│   ├── controllers/       # İş mantığı
│   ├── routes/            # API yolları
│   ├── models/            # Veritabanı modelleri
│   └── services/          # Yardımcı servisler
├── database/              # Veritabanı dosyaları
├── .env                   # Gizli ayarlar (Git'e ekleme!)
├── .env.example           # Örnek ayar dosyası
└── package.json           # Proje bilgileri
```

---

## 📝 Sık Kullanılan Komutlar

| Komut | Ne Yapar |
|-------|----------|
| `npm install` | Bağımlılıkları yükler |
| `npm run dev` | Sunucuyu geliştirme modunda başlatır |
| `npm run build` | Üretim için derler |
| `npm start` | Üretim modunda başlatır |
| `npm run db:migrate` | Veritabanı tablolarını oluşturur |
| `npm run db:seed` | Test verilerini ekler |
| `npm test` | Testleri çalıştırır |

---

## ❓ Yardım

Sorun yaşarsan:
1. Bu README'yi tekrar oku
2. Hata mesajını Google'da ara
3. Ekip arkadaşlarına sor

---

**Hazırlayan:** Backend Ekibi  
**Son Güncelleme:** Ocak 2026
