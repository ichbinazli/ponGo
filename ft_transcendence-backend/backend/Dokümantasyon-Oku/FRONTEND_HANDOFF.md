# 📢 Frontend Ekibi İçin Bilgilendirme: Backend Güncellemeleri

Backend ekibi olarak kimlik doğrulama sisteminde önemli değişiklikler yaptık. TOTP (QR Kod) yerine **E-posta tabanlı 2FA** sistemine geçtik ve **Şifre Sıfırlama** özelliği ekledik.

Aşağıda entegrasyon için yapmanız gereken değişiklikleri özetledik.

---

## 🚨 Kritik Değişiklikler (Breaking Changes)

### 1. Login Akışı (2FA)
Kullanıcı giriş yaparken eğer 2FA aktifse, backend artık token dönmek yerine `requires2FA: true` yanıtı dönüyor.

**Eski Akış:**
- `POST /api/auth/login` -> `{ token: "..." }` (Direkt login)

**Yeni Akış:**
1. **Adım 1:** `POST /api/auth/login`
   - Yanıt: `{ requires2FA: true, userId: 123 }`
   - *Bu anda kullanıcıya e-posta ile 6 haneli kod gönderilmiştir.*

2. **Adım 2:** Kullanıcıdan kodu isteyip tekrar login'e gönderin:
   - `POST /api/auth/login`
   - Payload: `{ email: "...", password: "...", twoFactorCode: "123456" }`
   - Yanıt: `{ token: "...", user: {...} }` (Başarılı)

### 2. 2FA Kurulumu (Eski QR Kod İptal)
Artık QR kod ve `authenticator` uygulaması yok.

**Yeni Akış:**
1. **Başlat:** `POST /api/2fa/setup` çağırın.
   - Backend kullanıcıya e-posta ile kod gönderir.
2. **Onayla:** Kullanıcıdan kodu alıp `POST /api/2fa/confirm`'e `{ code: "..." }` gönderin.
3. **Bitti:** 2FA aktifleşir.

---

## ✨ Yeni Özellikler

### Şifremi Unuttum
Login ekranına "Şifremi Unuttum" linki ekleyin.

1. **Kod İste:** `POST /api/auth/forgot-password` -> `{ email }`
   - E-posta gider.
2. **Şifre Belirle:** `POST /api/auth/reset-password`
   - Payload: `{ email, code, newPassword }`

---

## 🛠️ Kaldırılan Endpoint'ler
- ❌ `POST /api/2fa/verify` (Login endpoint'i içine gömüldü)
- ❌ `POST /api/2fa/backup-codes` (Artık yedek kod yok)
- ❌ `GET /api/2fa/qr` (QR kod yok)

---

## 📋 Örnek Kod (Login)

```javascript
// Login Fonksiyonu Örneği
async function login(email, password, twoFactorCode = null) {
  const body = { email, password };
  if (twoFactorCode) body.twoFactorCode = twoFactorCode;

  const res = await api.post('/auth/login', body);

  // 2FA Gerekli Hali
  if (res.data.requires2FA) {
    // UI'da modal açıp kullanıcıdan kodu isteyin
    // Sonra bu fonksiyonu tekrar çağırın: login(email, password, girilenKod)
    return { status: '2FA_REQUIRED', userId: res.data.userId };
  }

  // Başarılı
  return { status: 'SUCCESS', token: res.data.tokens.accessToken };
}
```

Daha fazla detay için güncellenen **[FRONTEND_GUIDE.md](../backend/Dokümantasyon-Oku/integration/FRONTEND_GUIDE.md)** dosyasına bakabilirsiniz.

Kolay gelsin! 🚀
Backend Ekibi
