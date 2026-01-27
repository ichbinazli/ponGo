# 🗄️ ft_transcendence Veritabanı Dokümantasyonu

Bu dokümantasyon, ft_transcendence projesinin backend veritabanı yapısını detaylı şekilde açıklamaktadır.

---

## 📌 Genel Bakış

| Özellik | Değer |
|---------|-------|
| **Veritabanı Türü** | SQLite |
| **Kütüphane** | better-sqlite3 |
| **Dosya Konumu** | `database/transcendence.db` |
| **Yapılandırma** | `src/config/database.ts` |
| **Migrationlar** | `database/migrations/` |

### Veritabanı Özellikleri

- **Foreign Keys**: Aktif (referans bütünlüğü)
- **WAL Modu**: Aktif (Write-Ahead Logging - daha iyi eşzamanlılık)
- **Verbose Logging**: Development modunda aktif

---

## 📊 Tablo Listesi

| # | Tablo Adı | Açıklama |
|---|-----------|----------|
| 1 | `users` | Kullanıcı hesapları ve profil bilgileri |
| 2 | `sessions` | JWT refresh token'ları ve oturum yönetimi |
| 3 | `friendships` | Arkadaşlık ilişkileri ve engelleme |
| 4 | `match_history` | Oynanan maçların kaydı |
| 5 | `tournaments` | Turnuva bilgileri |
| 6 | `tournament_participants` | Turnuva katılımcıları (kayıtlı + misafir) |
| 7 | `tournament_matches` | Turnuva maçları ve bracket bilgisi |

---

## 📋 Tablo Detayları

### 1. users (Kullanıcılar)

Ana kullanıcı bilgilerini saklayan tablo. Kimlik doğrulama, profil ve GDPR verileri burada tutulur.

#### Sütunlar

| Sütun | Tip | Null | Varsayılan | Açıklama |
|-------|-----|------|------------|----------|
| `id` | INTEGER | ❌ | Auto Increment | Primary Key |
| `email` | TEXT | ❌ | - | E-posta adresi (**UNIQUE**) |
| `password_hash` | TEXT | ✅ | NULL | Bcrypt ile hashlenmiş şifre |
| `display_name` | TEXT | ❌ | - | Görüntülenen kullanıcı adı (**UNIQUE**) |
| `avatar_url` | TEXT | ✅ | 'default-avatar.png' | Profil resmi URL'i |
| `oauth_provider` | TEXT | ✅ | NULL | OAuth sağlayıcısı (örn: '42') |
| `oauth_id` | TEXT | ✅ | NULL | OAuth benzersiz ID'si |
| `two_factor_secret` | TEXT | ✅ | NULL | 2FA TOTP gizli anahtarı |
| `two_factor_enabled` | INTEGER | ❌ | 0 | 2FA aktif mi? (0=Hayır, 1=Evet) |
| `two_factor_backup_codes` | TEXT | ✅ | NULL | 2FA yedek kodları (JSON array) |
| `is_online` | INTEGER | ❌ | 0 | Çevrimiçi durumu (0=Hayır, 1=Evet) |
| `last_seen_at` | DATETIME | ✅ | NULL | Son görülme zamanı |
| `anonymized` | INTEGER | ❌ | 0 | GDPR anonimleştirildi mi? |
| `anonymized_at` | DATETIME | ✅ | NULL | Anonimleştirme zamanı |
| `created_at` | DATETIME | ❌ | CURRENT_TIMESTAMP | Kayıt tarihi |
| `updated_at` | DATETIME | ❌ | CURRENT_TIMESTAMP | Son güncelleme tarihi |

#### İndeksler

| İndeks Adı | Sütun(lar) | Amaç |
|------------|------------|------|
| `idx_users_email` | email | E-posta ile hızlı arama |
| `idx_users_display_name` | display_name | Kullanıcı adı aramaları |
| `idx_users_oauth` | oauth_provider, oauth_id | OAuth login sorguları |
| `idx_users_online` | is_online | Çevrimiçi kullanıcı listesi |

#### Trigger'lar

- `update_users_timestamp`: Her UPDATE işleminde `updated_at` otomatik güncellenir

---

### 2. sessions (Oturumlar)

JWT refresh token'larını ve kullanıcı oturumlarını yönetir. Güvenli token yenileme mekanizması sağlar.

#### Sütunlar

| Sütun | Tip | Null | Varsayılan | Açıklama |
|-------|-----|------|------------|----------|
| `id` | INTEGER | ❌ | Auto Increment | Primary Key |
| `user_id` | INTEGER | ❌ | - | Kullanıcı referansı (FK) |
| `refresh_token_hash` | TEXT | ❌ | - | SHA-256 ile hashlenmiş token (**UNIQUE**) |
| `user_agent` | TEXT | ✅ | NULL | Tarayıcı/cihaz bilgisi |
| `ip_address` | TEXT | ✅ | NULL | İstemci IP adresi |
| `expires_at` | DATETIME | ❌ | - | Token son kullanma tarihi |
| `revoked` | INTEGER | ❌ | 0 | İptal durumu (0=Aktif, 1=İptal) |
| `revoked_at` | DATETIME | ✅ | NULL | İptal zamanı |
| `created_at` | DATETIME | ❌ | CURRENT_TIMESTAMP | Oturum oluşturma zamanı |

#### İlişkiler

| Referans | Hedef Tablo | Silme Davranışı |
|----------|-------------|-----------------|
| `user_id` | users(id) | CASCADE (Kullanıcı silinince oturumlar da silinir) |

#### İndeksler

| İndeks Adı | Sütun | Amaç |
|------------|-------|------|
| `idx_sessions_user_id` | user_id | Kullanıcının oturumlarını listeleme |
| `idx_sessions_token` | refresh_token_hash | Token doğrulama sorguları |
| `idx_sessions_expires` | expires_at | Süresi dolmuş oturumları temizleme |

---

### 3. friendships (Arkadaşlıklar)

Kullanıcılar arasındaki arkadaşlık istekleri, kabul edilen arkadaşlıklar ve engelleme bilgileri.

#### Sütunlar

| Sütun | Tip | Null | Varsayılan | Açıklama |
|-------|-----|------|------------|----------|
| `id` | INTEGER | ❌ | Auto Increment | Primary Key |
| `requester_id` | INTEGER | ❌ | - | İstek gönderen kullanıcı (FK) |
| `addressee_id` | INTEGER | ❌ | - | İstek alan kullanıcı (FK) |
| `status` | TEXT | ❌ | 'pending' | İlişki durumu |
| `created_at` | DATETIME | ❌ | CURRENT_TIMESTAMP | İstek gönderilme zamanı |
| `updated_at` | DATETIME | ❌ | CURRENT_TIMESTAMP | Son güncelleme zamanı |

#### Status Değerleri

| Değer | Açıklama |
|-------|----------|
| `pending` | Bekleyen arkadaşlık isteği |
| `accepted` | Kabul edilmiş arkadaşlık |
| `blocked` | requester_id, addressee_id'yi engelledi |

#### Kısıtlamalar

- `UNIQUE(requester_id, addressee_id)`: Aynı iki kullanıcı arasında tek kayıt olabilir

#### İlişkiler

| Referans | Hedef Tablo | Silme Davranışı |
|----------|-------------|-----------------|
| `requester_id` | users(id) | CASCADE |
| `addressee_id` | users(id) | CASCADE |

#### Trigger'lar

- `update_friendships_timestamp`: Her UPDATE işleminde `updated_at` otomatik güncellenir

---

### 4. match_history (Maç Geçmişi)

Oynanan tüm Pong maçlarının kaydını tutar. İstatistikler ve liderlik tablosu bu tablodan hesaplanır.

#### Sütunlar

| Sütun | Tip | Null | Varsayılan | Açıklama |
|-------|-----|------|------------|----------|
| `id` | INTEGER | ❌ | Auto Increment | Primary Key |
| `player1_id` | INTEGER | ❌ | - | Birinci oyuncu (FK) |
| `player2_id` | INTEGER | ❌ | - | İkinci oyuncu (FK) |
| `player1_score` | INTEGER | ❌ | 0 | Birinci oyuncunun skoru |
| `player2_score` | INTEGER | ❌ | 0 | İkinci oyuncunun skoru |
| `winner_id` | INTEGER | ✅ | NULL | Kazanan oyuncu (beraberlik için NULL) |
| `game_type` | TEXT | ❌ | 'pong' | Oyun türü |
| `tournament_id` | INTEGER | ✅ | NULL | Turnuva referansı (varsa) |
| `duration_seconds` | INTEGER | ✅ | NULL | Maç süresi (saniye) |
| `started_at` | DATETIME | ✅ | NULL | Maç başlangıç zamanı |
| `ended_at` | DATETIME | ❌ | CURRENT_TIMESTAMP | Maç bitiş zamanı |

#### Game Type Değerleri

| Değer | Açıklama |
|-------|----------|
| `pong` | Normal Pong maçı |
| `tournament` | Turnuva maçı |
| `other` | Diğer oyun türleri |

#### İlişkiler

| Referans | Hedef Tablo | Silme Davranışı |
|----------|-------------|-----------------|
| `player1_id` | users(id) | CASCADE |
| `player2_id` | users(id) | CASCADE |
| `winner_id` | users(id) | SET NULL |

#### İndeksler

| İndeks Adı | Sütun | Amaç |
|------------|-------|------|
| `idx_match_player1` | player1_id | Oyuncu maç geçmişi sorguları |
| `idx_match_player2` | player2_id | Oyuncu maç geçmişi sorguları |
| `idx_match_winner` | winner_id | Kazanma istatistikleri |
| `idx_match_game_type` | game_type | Oyun türüne göre filtreleme |
| `idx_match_ended_at` | ended_at | Tarih sıralaması |

---

### 5. tournaments (Turnuvalar)

Turnuva bilgilerini saklar. `is_local` alanı ile yerel (offline) turnuvalar desteklenir.

#### Sütunlar

| Sütun | Tip | Null | Varsayılan | Açıklama |
|-------|-----|------|------------|----------|
| `id` | INTEGER | ❌ | Auto Increment | Primary Key |
| `name` | TEXT | ❌ | - | Turnuva adı |
| `description` | TEXT | ✅ | NULL | Turnuva açıklaması |
| `status` | TEXT | ❌ | 'pending' | Turnuva durumu |
| `max_players` | INTEGER | ❌ | 8 | Maksimum katılımcı sayısı |
| `current_round` | INTEGER | ❌ | 0 | Mevcut tur numarası |
| `winner_id` | INTEGER | ✅ | NULL | Turnuva kazananı (FK) |
| `created_by` | INTEGER | ❌ | - | Turnuvayı oluşturan (FK) |
| `is_local` | INTEGER | ❌ | 0 | Yerel turnuva mı? (0=Hayır, 1=Evet) |
| `created_at` | DATETIME | ❌ | CURRENT_TIMESTAMP | Oluşturma zamanı |
| `started_at` | DATETIME | ✅ | NULL | Başlangıç zamanı |
| `ended_at` | DATETIME | ✅ | NULL | Bitiş zamanı |

> **Not**: `is_local = 1` olan turnuvalar misafir (guest) katılımcıları destekler.

#### Status Değerleri

| Değer | Açıklama |
|-------|----------|
| `pending` | Katılımcı bekleniyor |
| `in_progress` | Turnuva devam ediyor |
| `completed` | Turnuva tamamlandı |
| `cancelled` | Turnuva iptal edildi |

#### İlişkiler

| Referans | Hedef Tablo | Silme Davranışı |
|----------|-------------|-----------------|
| `winner_id` | users(id) | SET NULL |
| `created_by` | users(id) | CASCADE |

---

### 6. tournament_participants (Turnuva Katılımcıları)

Turnuvalara katılan oyuncuları ve durumlarını takip eder.

#### Sütunlar

| Sütun | Tip | Null | Varsayılan | Açıklama |
|-------|-----|------|------------|----------|
| `id` | INTEGER | ❌ | Auto Increment | Primary Key |
| `tournament_id` | INTEGER | ❌ | - | Turnuva referansı (FK) |
| `user_id` | INTEGER | ❌ | - | Kullanıcı referansı (FK) |
| `alias` | TEXT | ✅ | NULL | Takma ad (opsiyonel) |
| `placement` | INTEGER | ✅ | NULL | Final sıralaması (1., 2., vb.) |
| `status` | TEXT | ❌ | 'registered' | Katılımcı durumu |
| `joined_at` | DATETIME | ❌ | CURRENT_TIMESTAMP | Katılım zamanı |

#### Status Değerleri

| Değer | Açıklama |
|-------|----------|
| `registered` | Turnuvaya kayıtlı |
| `playing` | Aktif olarak oynuyor |
| `eliminated` | Elendi |
| `winner` | Turnuva kazananı |

#### Kısıtlamalar

- `UNIQUE(tournament_id, user_id)`: Bir kullanıcı aynı turnuvaya bir kez katılabilir

#### İlişkiler

| Referans | Hedef Tablo | Silme Davranışı |
|----------|-------------|-----------------|
| `tournament_id` | tournaments(id) | CASCADE |
| `user_id` | users(id) | CASCADE |

---

## 🔗 Entity-Relationship Diyagramı

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                 users                                   │
│ ════════════════════════════════════════════════════════════════════════│
│ PK: id                                                                  │
│ email (UNIQUE) | password_hash | display_name (UNIQUE) | avatar_url    │
│ oauth_provider | oauth_id | two_factor_* | is_online | anonymized      │
└─────────────────────────────────────────────────────────────────────────┘
         │                    │                    │                │
         │ 1:N                │ 1:N                │ 1:N            │ 1:N
         ▼                    ▼                    ▼                ▼
┌────────────────┐  ┌─────────────────────┐  ┌──────────────┐  ┌────────────────┐
│    sessions    │  │     friendships     │  │ match_history│  │  tournaments   │
│ ═══════════════│  │ ════════════════════│  │ ═════════════│  │ ═══════════════│
│ user_id (FK)   │  │ requester_id (FK)   │  │ player1_id   │  │ winner_id (FK) │
│ refresh_token  │  │ addressee_id (FK)   │  │ player2_id   │  │ created_by(FK) │
│ expires_at     │  │ status              │  │ winner_id    │  │ status         │
│ revoked        │  │ (pending/accepted/  │  │ scores       │  │ max_players    │
│                │  │  blocked)           │  │ game_type    │  │                │
└────────────────┘  └─────────────────────┘  └──────────────┘  └────────────────┘
                                                                       │
                                                                       │ 1:N
                                                                       ▼
                                                    ┌────────────────────────────┐
                                                    │  tournament_participants   │
                                                    │ ═══════════════════════════│
                                                    │ tournament_id (FK)         │
                                                    │ user_id (FK)               │
                                                    │ alias | placement | status │
                                                    └────────────────────────────┘
```

---

## 🏗️ Model Sınıfları

Her tablo için TypeScript model sınıfı mevcuttur:

| Tablo | Model Sınıfı | Dosya | Singleton Instance |
|-------|--------------|-------|-------------------|
| users | `UserModel` | `src/models/user.model.ts` | `userModel` |
| sessions | `SessionModel` | `src/models/session.model.ts` | `sessionModel` |
| friendships | `FriendshipModel` | `src/models/friendship.model.ts` | `friendshipModel` |
| match_history | `MatchHistoryModel` | `src/models/match.model.ts` | `matchHistoryModel` |
| tournaments | `TournamentModel` | `src/models/tournament.model.ts` | `tournamentModel` |

### Model Kullanım Örneği

```typescript
import { userModel } from './models/user.model.js';
import { matchHistoryModel } from './models/match.model.js';

// Kullanıcı oluşturma
const user = userModel.create({
    email: 'test@example.com',
    password_hash: hashedPassword,
    display_name: 'TestUser'
});

// Maç kaydetme
const match = matchHistoryModel.create({
    player1_id: 1,
    player2_id: 2,
    player1_score: 11,
    player2_score: 7,
    winner_id: 1,
    game_type: 'pong'
});

// Kullanıcı istatistikleri
const stats = matchHistoryModel.getUserStats(userId);
// {
//   total_matches: 10,
//   wins: 7,
//   losses: 3,
//   win_rate: 70,
//   total_points_scored: 85,
//   ...
// }
```

---

## 🔐 GDPR Uyumluluğu

Veritabanı, GDPR (Genel Veri Koruma Yönetmeliği) gereksinimlerine uygun tasarlanmıştır:

### Kullanıcı Anonimleştirme

Kullanıcı hesabı silinmek istediğinde, veriler kalıcı olarak silmek yerine anonimleştirilir:

```sql
UPDATE users SET 
    email = 'anonymized_' || id || '@deleted.local',
    password_hash = NULL,
    display_name = 'Deleted User ' || id,
    avatar_url = 'default-avatar.png',
    oauth_provider = NULL,
    oauth_id = NULL,
    two_factor_secret = NULL,
    two_factor_enabled = 0,
    anonymized = 1,
    anonymized_at = CURRENT_TIMESTAMP
WHERE id = ?
```

### Veri Silme Zincirleri

| Kaynak | Hedef | Davranış |
|--------|-------|----------|
| users silinince | sessions | Otomatik silinir (CASCADE) |
| users silinince | friendships | Otomatik silinir (CASCADE) |
| users silinince | match_history | Oyuncu olarak → silinir, Kazanan olarak → NULL |
| tournaments silinince | tournament_participants | Otomatik silinir (CASCADE) |

---

## ⚡ Performans Optimizasyonları

### 1. İndeksler

Tüm sık sorgulanan sütunlarda indeksler tanımlanmıştır:
- E-posta ve kullanıcı adı aramaları
- OAuth login sorguları
- Çevrimiçi kullanıcı listesi
- Token doğrulama
- Maç geçmişi sorguları

### 2. WAL Modu

SQLite'ın Write-Ahead Logging modu aktiftir:
- Daha iyi eşzamanlı okuma/yazma performansı
- Yazma işlemleri okumayı engellemez
- Daha hızlı commit işlemleri

### 3. Prepared Statements

Tüm veritabanı sorguları prepared statement kullanır:
- SQL injection koruması
- Sorgu planı önbelleğe alınır
- Daha iyi performans

### 4. Singleton Pattern

Model sınıfları singleton olarak export edilir:
- Tek veritabanı bağlantısı
- Kaynak tasarrufu
- Tutarlı durum yönetimi

---

## 🔄 Migration Sistemi

Veritabanı şeması migration dosyaları ile yönetilir:

| # | Dosya | Açıklama |
|---|-------|----------|
| 001 | `001_create_users_table.sql` | Users tablosu ve indeksler |
| 002 | `002_create_sessions_table.sql` | Sessions tablosu |
| 003 | `003_create_friendships_table.sql` | Friendships tablosu |
| 004 | `004_create_match_history_table.sql` | Match history tablosu |
| 005 | `005_create_tournaments_table.sql` | Tournaments ve participants tabloları |
| 006 | `006_add_backup_codes.sql` | 2FA backup codes sütunu |

### Migration Çalıştırma

Migration'lar uygulama başlangıcında otomatik olarak çalıştırılır veya manuel olarak:

```bash
# Development
npm run dev

# Production
npm run start
```

---

## 📝 Notlar

1. **Tarih/Saat Formatı**: Tüm datetime alanları ISO 8601 formatında saklanır
2. **Boolean Değerler**: SQLite'da boolean yoktur, INTEGER (0/1) kullanılır
3. **JSON Depolama**: `two_factor_backup_codes` gibi alanlar TEXT olarak JSON formatında saklanır
4. **Varsayılan Avatar**: Yeni kullanıcılar için `default-avatar.png` atanır

---

*Son Güncelleme: Ocak 2026*
