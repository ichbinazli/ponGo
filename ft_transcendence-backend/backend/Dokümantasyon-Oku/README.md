# 📚 Backend Dokümantasyonu

ft_transcendence Backend API dokümantasyonu.

---

## 🎯 Hedef Kitleye Göre Başlangıç

| Ekip | Dosya | İçerik |
|------|-------|--------|
| 🖥️ Frontend | [FRONTEND_GUIDE.md](integration/FRONTEND_GUIDE.md) | API kullanımı, token yönetimi, error handling |
| 🎮 Game | [GAME_INTEGRATION.md](integration/GAME_INTEGRATION.md) | Match API, turnuva sistemi, skor kaydetme |
| ⚙️ DevOps | [DEPLOYMENT.md](devops/DEPLOYMENT.md) | Production deployment, Docker |

---

## 📖 Dokümantasyon İndeksi

### API Referansı
- [API_REFERENCE.md](api/API_REFERENCE.md) - Tüm endpoint'ler (60+)
- [AUTHENTICATION.md](api/AUTHENTICATION.md) - JWT, 2FA, OAuth
- [DATABASE.md](api/DATABASE.md) - Veritabanı şeması (7 tablo)

### Entegrasyon
- [FRONTEND_GUIDE.md](integration/FRONTEND_GUIDE.md) - Frontend entegrasyon rehberi
- [GAME_INTEGRATION.md](integration/GAME_INTEGRATION.md) - Game modülü API

### DevOps
- [DEPLOYMENT.md](devops/DEPLOYMENT.md) - Production checklist
- [DOCKER.md](devops/DOCKER.md) - Docker yapılandırması

---

## 🚀 Hızlı Başlangıç

```bash
cd backend
npm install
npm run dev
# → http://localhost:3000/health
```

**Base URL:** `https://localhost:3000/api`

---

## 📡 API Modülleri

| Prefix | Modül | Auth |
|--------|-------|------|
| `/api/auth` | Kimlik doğrulama | Kısmen |
| `/api/users` | Kullanıcı işlemleri | Kısmen |
| `/api/friends` | Arkadaşlık sistemi | ✅ |
| `/api/oauth` | OAuth (42 Intra) | Kısmen |
| `/api/2fa` | İki faktörlü doğrulama | Kısmen |
| `/api/gdpr` | GDPR uyumluluğu | Kısmen |
| `/api/stats` | İstatistikler | ❌ |
| `/api/matches` | Maç kayıtları | Kısmen |
| `/api/local-tournament` | Yerel turnuva | Kısmen |

---

*Son Güncelleme: Ocak 2026*
