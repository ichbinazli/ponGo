Kısaca: **TypeScript’i tarayıcı doğrudan çalıştırmaz.**
Bu yüzden `.ts` dosyanı **JavaScript’e derleyip**, HTML’den o `.js` dosyasını çağırman gerekir.

Aşağıda **en sade → biraz daha profesyonel** olacak şekilde adım adım anlatıyorum.

---

## 1️⃣ Minimum gerekli şeyler (en basit yol)

### Dosya yapısı

```
project/
 ├─ index.html
 ├─ main.ts
 ├─ main.js   ← (derleme sonrası oluşacak)
```

---

### 1. TypeScript’i yükle

Terminalde proje klasöründe:

```bash
npm init -y
npm install typescript --save-dev
```

---

### 2. TypeScript config oluştur

```bash
npx tsc --init
```

Bu sana bir `tsconfig.json` oluşturur.
Başlangıç için şunlar yeterli:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "ESNext",
    "outDir": "./",
    "strict": true
  }
}
```

> İstersen şimdilik `outDir` bile kullanmayabilirsin.

---

### 3. TypeScript’i JavaScript’e çevir

```bash
npx tsc main.ts
```
npx tsc

Bu komut:

```
main.ts → main.js
```

oluşturur.

---

### 4. HTML’den JS’i çağır

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>TS Web</title>
</head>
<body>

  <h1>Hello TypeScript</h1>

  <script type="module" src="./main.js"></script>
</body>
</html>
```

⚠️ **HTML’de `.ts` değil `.js` çağırılır.**

---

### 5. Çalıştırma

Dosyayı direkt açmak yerine **küçük bir server** ile aç:

```bash
npx serve
```

veya

```bash
python -m http.server
```

Tarayıcıda:

```
http://localhost:3000
```

---

## 2️⃣ Bir tık daha düzgün setup (önerilen)

Eğer biraz büyüyecekse:

### Yapı

```
src/
 ├─ main.ts
public/
 ├─ index.html
dist/
 ├─ main.js
```

### tsconfig

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "ESNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true
  }
}
```

HTML:

```html
<script type="module" src="/dist/main.js"></script>
```

---

## 3️⃣ Alternatif: hiç TS derlemesiyle uğraşmak istemezsen

Bunlar **hackathon & hızlı prototip** için çok rahat:

* **Vite (şiddetle öneririm)**
* **Parcel**
* **Webpack**

Örnek Vite:

```bash
npm create vite@latest my-app -- --template vanilla-ts
cd my-app
npm install
npm run dev
```

---

## 4️⃣ Özet – “Neleri initialize etmem gerekir?”

✅ Gerekli olanlar:

* `npm init`
* `typescript` kurulumu
* `tsconfig.json`
* `.ts → .js` derleme
* HTML’de `.js` çağırma
* Local server

