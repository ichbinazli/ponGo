# 🖥️ Frontend Entegrasyon

Backend API kullanımı için frontend rehberi.

---

## Base URL

| Ortam | URL |
|-------|-----|
| Development | `https://localhost:3000/api` |
| Production | `https://yourdomain.com/api` |

---

## API Wrapper

```javascript
const API_BASE = 'https://localhost:3000/api';

class API {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
  }

  async request(endpoint, options = {}) {
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
        ...options.headers
      }
    };

    let response = await fetch(`${API_BASE}${endpoint}`, config);

    // Token expired - refresh
    if (response.status === 401 && this.accessToken) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
        response = await fetch(`${API_BASE}${endpoint}`, config);
      }
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error?.message);
    return data;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;
    
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      const data = await res.json();
      if (data.success) {
        this.accessToken = data.data.accessToken;
        localStorage.setItem('accessToken', this.accessToken);
        return true;
      }
    } catch {}
    this.logout();
    return false;
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }
}

const api = new API();
```

---

## Örnek Kullanımlar

### Login

```javascript
async function login(email, password, twoFactorCode = null) {
  const body = { email, password };
  if (twoFactorCode) body.twoFactorCode = twoFactorCode;

  const res = await api.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body)
  });

  // 2FA Gerekli: E-posta gönderildi, kod bekleniyor
  if (res.data.requires2FA) {
    return { needs2FA: true, userId: res.data.userId };
  }

  localStorage.setItem('accessToken', res.data.tokens.accessToken);
  localStorage.setItem('refreshToken', res.data.tokens.refreshToken);
  return res.data.user;
}
```

### Profil

```javascript
// Profil getir
const profile = await api.request('/users/me');

// Profil güncelle
await api.request('/users/me', {
  method: 'PATCH',
  body: JSON.stringify({ displayName: 'YeniIsim' })
});
```

### Avatar Yükleme

```javascript
async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);

  const res = await fetch(`${API_BASE}/users/me/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${api.accessToken}` },
    body: formData
  });
  return res.json();
}
```

---

## Error Handling

| Code | HTTP | Açıklama |
|------|------|----------|
| VALIDATION_ERROR | 400 | Geçersiz veri |
| UNAUTHORIZED | 401 | Token geçersiz |
| FORBIDDEN | 403 | Yetkisiz |
| NOT_FOUND | 404 | Bulunamadı |
| CONFLICT | 409 | Zaten mevcut |
| RATE_LIMITED | 429 | Limit aşıldı |

```javascript
try {
  await api.request('/users/me');
} catch (error) {
  showToast(error.message);
}
```

---

## TypeScript Types

```typescript
interface User {
  id: number;
  email: string;
  display_name: string;
  avatar_url: string;
  is_online: boolean;
  two_factor_enabled: boolean;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}
```

---

## CORS

Backend CORS origin'i `.env`'den okur:
```
CORS_ORIGIN=https://localhost:5173
```

---

*Son Güncelleme: Ocak 2026*
