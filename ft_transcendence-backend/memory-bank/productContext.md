# Product Context: ft_transcendence Backend

## Neden Bu Proje Var?
ft_transcendence, 42 School Common Core'un final projesidir. Öğrencilerin daha önce hiç yapmadıkları teknolojilerle karşılaşmalarını ve adaptasyon yeteneklerini test etmeyi amaçlar.

## Çözdüğü Problemler

### 1. Güvenli Kullanıcı Yönetimi
- Kullanıcıların güvenli şekilde kayıt olması ve giriş yapması
- Profil bilgilerinin yönetimi
- Sosyal özellikler (arkadaşlık, online durum)

### 2. Modern Kimlik Doğrulama
- Geleneksel kullanıcı adı/şifre yerine OAuth 2.0 seçeneği
- 2FA ile ekstra güvenlik katmanı
- JWT ile stateless oturum yönetimi

### 3. Veri Gizliliği (GDPR)
- Kullanıcı verilerinin korunması
- İstenildiğinde veri anonimleştirme
- Hesap silme hakkı

### 4. Performanslı API
- Fastify ile hızlı API yanıtları
- SQLite ile hafif veritabanı çözümü
- Docker ile taşınabilir deployment

## Nasıl Çalışmalı?

### Kullanıcı Akışı
1. **Kayıt**: Email/şifre veya OAuth ile kayıt
2. **Giriş**: Normal giriş veya 2FA ile güvenli giriş
3. **Profil**: Avatar, display name, bilgi güncelleme
4. **Sosyal**: Arkadaş ekleme, online durum görme
5. **Oyun**: Turnuvalara katılım, maç geçmişi
6. **GDPR**: Veri görüntüleme, silme talepleri

### API Yapısı
- RESTful API tasarımı
- JWT ile route koruması
- Validation middleware'leri
- Error handling

## Kullanıcı Deneyimi Hedefleri
- Hızlı response süreleri
- Güvenilir kimlik doğrulama
- Şeffaf veri yönetimi
- Kolay profil yönetimi
- Arkadaşlarla etkileşim
