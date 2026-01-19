# Project Brief: ft_transcendence

## Proje Adı
ft_transcendence - Backend & API Development

## Proje Özeti
42 School'un son Common Core projesi olan ft_transcendence için **Backend & API Geliştirici** rolünde çalışıyorum. Proje, gerçek zamanlı çok oyunculu Pong oyunu oynayabileceğiniz, turnuva sistemi içeren kapsamlı bir web sitesidir.

## Sorumlu Olduğum Modüller (Toplam: 45 Puan)

### Major Modüller (3 adet - 30 puan)
1. **Backend: Fastify Node.js** (10 Puan)
   - Projenin temel backend framework'ü
   - PHP yerine Fastify + Node.js kullanılacak

2. **Standart Kullanıcı Yönetimi** (10 Puan)
   - Kayıt/giriş sistemi
   - Profil yönetimi, avatar
   - Arkadaşlık sistemi
   - Maç geçmişi ve istatistikler

3. **Uzaktan Kimlik Doğrulama - OAuth 2.0** (10 Puan)
   - Google veya GitHub OAuth entegrasyonu
   - Güvenli token yönetimi

4. **2FA & JWT** (10 Puan)
   - JSON Web Tokens ile oturum yönetimi
   - İki faktörlü kimlik doğrulama

### Minor Modüller (2 adet - 10 puan)
1. **SQLite Veritabanı** (5 Puan)
   - Tüm DB işlemleri için SQLite
   - Backend framework ile uyumlu

2. **GDPR Uyumluluğu** (5 Puan)
   - Veri anonimleştirme
   - Hesap silme
   - Yerel veri yönetimi

## Zorunlu Backend Gereksinimleri
- Şifreler güçlü hash algoritmasıyla saklanmalı
- SQL injection ve XSS koruması
- HTTPS bağlantısı (WebSocket için wss)
- Form validasyonu sunucu tarafında
- Credential'lar .env dosyasında, git'e eklenmemeli

## Teknoloji Stack
- **Runtime**: Node.js
- **Framework**: Fastify
- **Database**: SQLite
- **Authentication**: JWT + OAuth 2.0 + 2FA
- **Container**: Docker

## Hedef
Kullanıcıların güvenle kayıt olduğu, OAuth veya 2FA ile giriş yaptığı ve tüm verilerinin GDPR kurallarına göre korunduğu sağlam bir backend altyapısı inşa etmek.
