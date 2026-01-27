# 📚 ft_transcendence Backend Dokümantasyonu

Backend API'nin kapsamlı dokümantasyonu. Aşağıdaki bölümlerden ihtiyacınıza uygun olanı seçin.

---

## 🎯 Hedef Kitleye Göre Navigasyon

| Ekip | Başlangıç Noktası | Açıklama |
|------|-------------------|----------|
| 🖥️ **Frontend** | [FRONTEND_GUIDE.md](integration/FRONTEND_GUIDE.md) | API entegrasyonu, token yönetimi |
| 🎮 **Game** | [GAME_INTEGRATION.md](integration/GAME_INTEGRATION.md) | Match API, turnuva sistemi |
| ⚙️ **DevOps** | [DEPLOYMENT.md](devops/DEPLOYMENT.md) | Production deployment |

---

## 📖 Dokümantasyon İçeriği

### API Referansı
| Dosya | İçerik |
|-------|--------|
| [API_REFERENCE.md](api/API_REFERENCE.md) | Tüm endpoint'ler, request/response örnekleri |
| [AUTHENTICATION.md](api/AUTHENTICATION.md) | JWT, 2FA, OAuth akışları |
| [DATABASE.md](api/DATABASE.md) | Veritabanı şeması ve ilişkiler |

### Entegrasyon Rehberleri
| Dosya | İçerik |
|-------|--------|
| [FRONTEND_GUIDE.md](integration/FRONTEND_GUIDE.md) | Frontend entegrasyon rehberi |
| [GAME_INTEGRATION.md](integration/GAME_INTEGRATION.md) | Game modülü API kullanımı |

### DevOps
| Dosya | İçerik |
|-------|--------|
| [DEPLOYMENT.md](devops/DEPLOYMENT.md) | Production deployment checklist |
| [DOCKER.md](devops/DOCKER.md) | Docker yapılandırması |

---

## 🚀 Hızlı Başlangıç

```bash
# Backend'i çalıştır
cd backend
npm install
npm run dev

# Çalıştığını test et
curl http://localhost:3000/health
```

**Base URL:** `http://localhost:3000/api`

---

## 📞 Destek

Sorularınız için backend ekibine ulaşın.

*Son Güncelleme: Ocak 2026*
