# 📢 Game Ekibi İçin Bilgilendirme: Backend Güncellemeleri

Backend ekibi olarak kimlik doğrulama sisteminde yaptığımız değişiklikler, **Lokal Turnuva (Local Tournament)** modülünü etkilemektedir.

Aşağıda oyun akışını ve turnuva yönetimini ilgilendiren değişiklikler özetlenmiştir.

---

## 🚨 Önemli Değişiklik: Turnuva Katılımcı Doğrulaması

Lokal turnuvalarda kayıtlı kullanıcıları turnuvaya eklerken veya doğrularken kullanılan **2FA (TOTP/Google Authenticator) zorunluluğu kaldırıldı.**

Bunun yerine, kullanıcıların **kendi hesap şifreleri** ile doğrulanması sistemine geçildi.

### 🛠️ Ne Değişti?

*   **Eski İstem:** Kullanıcı Google Authenticator uygulamasındaki 6 haneli kodu giriyordu.
*   **Yeni İstem:** Kullanıcı, turnuvaya katılmak için kendi **hesap şifresini** girmelidir.

### 💻 API Kullanımı (Lokal Turnuva)

**Endpoint:** `POST /api/local-tournament/verify-participant`

**Eski Payload (Kaldırıldı):**
```json
{
  "tournamentId": 1,
  "username": "oyuncu1",
  "code": "123456"  // ❌ ARTIK YOK
}
```

**Yeni Payload (Kullanılacak):**
```json
{
  "tournamentId": 1,
  "username": "oyuncu1",
  "password": "KullaniciSifresi123!"  // ✅ YENİ
}
```

---

## ℹ️ Diğer Bilgiler

*   **Maç Sonuçları:** Maç sonuçlarını kaydederken (`/api/local-tournament/match/:id/result`) herhangi bir değişiklik **yoktur**. Mevcut yapıyı kullanmaya devam edebilirsiniz.
*   **Misafir Oyuncular:** Misafir oyuncu ekleme (`/add-guest`) özelliğinde bir değişiklik **yoktur**.

Kolay gelsin! 🎮
Backend Ekibi
