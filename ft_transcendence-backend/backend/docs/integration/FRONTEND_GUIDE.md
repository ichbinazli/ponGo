# 🖥️ Frontend Entegrasyon Rehberi

Backend API'yi frontend'de nasıl kullanacağınızı anlatan kapsamlı rehber.

---

## 📋 İçindekiler

1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [API İstek Yapısı](#api-i̇stek-yapısı)
3. [Token Yönetimi](#token-yönetimi)
4. [Error Handling](#error-handling)
5. [Örnek Kodlar](#örnek-kodlar)
6. [CORS Ayarları](#cors-ayarları)

---

## Hızlı Başlangıç

### Base URL

| Ortam | URL |
|-------|-----|
| Development | `http://localhost:3000` |
| Production | `https://your-domain.com` |

### Temel İstek

```javascript
const API_BASE = 'http://localhost:3000/api';

const response = await fetch(`${API_BASE}/health`);
const data = await response.json();
// { status: 'ok', timestamp: '...', uptime: ... }
```

---

## API İstek Yapısı

### Request Headers

```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken}`  // Auth gerektiren istekler için
};
```

### Response Format

Tüm API yanıtları şu yapıdadır:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**Başarılı Yanıt:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Hatalı Yanıt:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format"
  }
}
```

---

## Token Yönetimi

### Token Saklama

```javascript
// Login sonrası token'ları sakla
function saveTokens(tokens) {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  localStorage.setItem('expiresAt', tokens.expiresAt);
}

// Token'ları al
function getAccessToken() {
  return localStorage.getItem('accessToken');
}

// Logout'ta temizle
function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('expiresAt');
}
```

### Token Refresh Logic

```javascript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    clearTokens();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const { data } = await response.json();
  localStorage.setItem('accessToken', data.accessToken);
  return data.accessToken;
}
```

### API Wrapper with Auto-Refresh

```javascript
async function apiRequest(endpoint, options = {}) {
  const accessToken = getAccessToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options.headers
    }
  };

  let response = await fetch(`${API_BASE}${endpoint}`, config);

  // Token expired - try refresh
  if (response.status === 401 && accessToken) {
    try {
      const newToken = await refreshAccessToken();
      config.headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE}${endpoint}`, config);
    } catch {
      // Refresh failed, redirect to login
      return null;
    }
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error?.message || 'Request failed');
  }

  return data;
}
```

---

## Error Handling

### Error Codes

| Code | HTTP Status | Açıklama |
|------|-------------|----------|
| `VALIDATION_ERROR` | 400 | Geçersiz istek verisi |
| `UNAUTHORIZED` | 401 | Token yok veya geçersiz |
| `FORBIDDEN` | 403 | Yetkisiz erişim |
| `NOT_FOUND` | 404 | Kaynak bulunamadı |
| `CONFLICT` | 409 | Kaynak zaten mevcut (örn: email) |
| `RATE_LIMITED` | 429 | Çok fazla istek |
| `INTERNAL_ERROR` | 500 | Sunucu hatası |

### Error Display

```javascript
function handleApiError(error) {
  const messages = {
    VALIDATION_ERROR: 'Lütfen bilgileri kontrol edin',
    UNAUTHORIZED: 'Oturum süreniz doldu, lütfen tekrar giriş yapın',
    FORBIDDEN: 'Bu işlem için yetkiniz yok',
    NOT_FOUND: 'Aradığınız kaynak bulunamadı',
    CONFLICT: 'Bu kayıt zaten mevcut',
    RATE_LIMITED: 'Çok fazla istek gönderdiniz, lütfen bekleyin',
    INTERNAL_ERROR: 'Bir hata oluştu, lütfen tekrar deneyin'
  };

  return messages[error.code] || error.message;
}
```

---

## Örnek Kodlar

### Login

```javascript
async function login(email, password) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (response.data.requires2FA) {
    // 2FA ekranına yönlendir
    return { requires2FA: true, userId: response.data.userId };
  }

  saveTokens(response.data.tokens);
  return response.data.user;
}
```

### Kullanıcı Profili

```javascript
async function getProfile() {
  const response = await apiRequest('/users/me');
  return response.data;
}

async function updateProfile(displayName) {
  const response = await apiRequest('/users/me', {
    method: 'PATCH',
    body: JSON.stringify({ displayName })
  });
  return response.data;
}
```

### Avatar Yükleme

```javascript
async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch(`${API_BASE}/users/me/avatar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`
      // Content-Type FormData için otomatik ayarlanır
    },
    body: formData
  });

  return response.json();
}
```

### Arkadaş Listesi

```javascript
async function getFriends() {
  const response = await apiRequest('/friends');
  return response.data.friends;
}

async function sendFriendRequest(userId) {
  await apiRequest(`/friends/request/${userId}`, { method: 'POST' });
}
```

---

## CORS Ayarları

Backend şu CORS ayarlarını kullanır:

| Ayar | Değer |
|------|-------|
| Origin | `CORS_ORIGIN` env variable |
| Credentials | `true` |
| Methods | GET, POST, PUT, PATCH, DELETE, OPTIONS |
| Headers | Content-Type, Authorization |

### Development'ta

`.env` dosyasında:
```
CORS_ORIGIN=http://localhost:5173
```

### Multiple Origins

```
CORS_ORIGIN=http://localhost:5173,http://localhost:3001
```

---

## TypeScript Types

```typescript
// User
interface User {
  id: number;
  email: string;
  display_name: string;
  avatar_url: string;
  is_online: boolean;
  two_factor_enabled: boolean;
  created_at: string;
}

// Auth Tokens
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// Match
interface Match {
  id: number;
  player1_id: number;
  player2_id: number;
  player1_score: number;
  player2_score: number;
  winner_id: number | null;
  game_type: 'pong' | 'tournament' | 'other';
  ended_at: string;
}

// Friend
interface Friend {
  id: number;
  display_name: string;
  avatar_url: string;
  is_online: boolean;
  status: 'pending' | 'accepted' | 'blocked';
}
```

---

*Son Güncelleme: Ocak 2026*
