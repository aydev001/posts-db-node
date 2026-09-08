# back-lesson API

`title` + `description` + `image` dan iborat postlar ustida CRUD amallarini bajaruvchi REST API.
Rasm **Cloudinary**'ga yuklanadi, **MongoDB**'da esa faqat uning havolasi saqlanadi.

**Stack:** Node.js · Express · Mongoose · Cloudinary · Multer

> Server ishga tushgach `http://localhost:3002/` manzilida **interaktiv hujjat** ochiladi —
> u yerda har bir endpointni to'g'ridan-to'g'ri brauzerdan sinab ko'rish mumkin (Postman shart emas).

---

## Tez boshlash

```bash
# 1. paketlar
npm install

# 2. muhit o'zgaruvchilari
cp .env.example .env      # so'ng .env ichidagi qiymatlarni to'ldiring

# 3. ishga tushirish
npm run dev               # nodemon bilan (ishlab chiqish)
npm start                 # oddiy rejim
```

Hammasi joyida bo'lsa terminalda quyidagicha chiqadi:

```
MongoDB connected

Server is running. Reachable at:
  - Local:   http://localhost:3002
  - Network: http://192.168.0.5:3002
```

Talab: **Node.js 18+**.

---

## Muhit o'zgaruvchilari

| O'zgaruvchi | Majburiy | Default | Tavsif |
|---|---|---|---|
| `PORT` | yo'q | `3002` | Server tinglaydigan port |
| `HOST` | yo'q | `0.0.0.0` | Tinglash manzili — lokal tarmoqdan ham ochilishi uchun |
| `NODE_ENV` | yo'q | — | `test` bo'lsa morgan loglari o'chadi |
| `MONGO_URI` | **ha** | — | MongoDB ulanish satri (Atlas yoki lokal) |
| `CLOUDINARY_CLOUD_NAME` | **ha** | — | Cloudinary hisob nomi |
| `CLOUDINARY_API_KEY` | **ha** | — | Cloudinary API kaliti |
| `CLOUDINARY_API_SECRET` | **ha** | — | Cloudinary maxfiy kaliti |
| `CLOUDINARY_FOLDER` | yo'q | `back-lesson` | Rasmlar saqlanadigan papka |

`.env` fayli `.gitignore` da — u hech qachon repozitoriyga tushmaydi.
Kalitlar tasodifan ochiq joyga (commit, screenshot, chat) tushsa, ularni almashtiring.

---

## Endpointlar

Base URL: `http://localhost:3002`

| Metod | Manzil | Vazifasi |
|---|---|---|
| `GET` | `/api/posts` | Postlar ro'yxati, sahifalash bilan |
| `GET` | `/api/posts/:id` | Bitta post |
| `POST` | `/api/posts` | Yangi post yaratish (rasm majburiy) |
| `PUT` \| `PATCH` | `/api/posts/:id` | Postni qisman yangilash |
| `DELETE` | `/api/posts/:id` | Postni va rasmini o'chirish |
| `GET` | `/health` | Server holati (`{ status, uptime }`) |

### Javob formati

```jsonc
// muvaffaqiyat
{ "success": true, "data": { /* ... */ } }

// ro'yxat
{ "success": true, "data": [ /* ... */ ], "meta": { "page": 1, "limit": 20, "total": 42, "pages": 3 } }

// xatolik
{ "success": false, "message": "Xato tavsifi", "details": [ { "field": "title", "message": "..." } ] }
```

`details` faqat validatsiya xatolarida qo'shiladi.

### Post modeli

| Maydon | Turi | Tavsif |
|---|---|---|
| `id` | string | MongoDB ObjectId |
| `title` | string | Sarlavha, 1–120 belgi |
| `description` | string | Tavsif, 1–2000 belgi |
| `imageUrl` | string | Cloudinary'dagi rasmning to'liq havolasi |
| `imagePublicId` | string | Cloudinary identifikatori (o'chirish uchun) |
| `createdAt` / `updatedAt` | string (ISO) | Vaqt belgilari |

### Cheklovlar

- `title` — 1–120 belgi, bo'sh bo'lmasligi kerak
- `description` — 1–2000 belgi
- `image` — maksimal **5 MB**, faqat `jpeg` / `png` / `webp` / `gif`, bir so'rovda 1 ta fayl

---

## Misollar

### Ro'yxat

```bash
curl "http://localhost:3002/api/posts?page=1&limit=10"
```

`page` default `1`, `limit` default `20` (maksimal `100`). Chegaradan chiqqan qiymatlar
xato bermaydi — ruxsat etilgan oraliqqa siqiladi.

### Yaratish

```bash
curl -X POST http://localhost:3002/api/posts \
  -F "title=Salom dunyo" \
  -F "description=Bu mening birinchi postim" \
  -F "image=@./rasm.png"
```

```js
const form = new FormData();
form.append('title', 'Salom dunyo');
form.append('description', 'Bu mening birinchi postim');
form.append('image', fileInput.files[0]);

const res = await fetch('http://localhost:3002/api/posts', {
  method: 'POST',
  body: form,          // Content-Type ni QO'LDA qo'ymang — brauzer o'zi qo'yadi
});
const json = await res.json();
if (!res.ok) throw new Error(json.message);
```

### Yangilash (qisman)

```bash
# faqat sarlavha
curl -X PATCH http://localhost:3002/api/posts/<id> -F "title=Yangi sarlavha"

# rasmni almashtirish — eskisi Cloudinary'dan avtomatik o'chadi
curl -X PATCH http://localhost:3002/api/posts/<id> -F "image=@./yangi.png"
```

### O'chirish

```bash
curl -X DELETE http://localhost:3002/api/posts/<id>
# → { "success": true, "data": { "id": "<id>" } }
```

Optimistic delete namunasi:

```js
async function deletePost(id) {
  const snapshot = posts;                       // 1. eski holat
  posts = posts.filter(p => p.id !== id);       // 2. darhol UI dan olib tashlaymiz
  render(posts);

  try {
    const res = await fetch(`${BASE}/api/posts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).message);
  } catch (err) {
    posts = snapshot;                           // 3. xatoda qaytaramiz
    render(posts);
    showError(err.message);
  }
}
```

---

## Xatolar

| Status | Xabar | Qachon |
|---|---|---|
| `400` | `title is required` | Yaratishda `title` yo'q yoki bo'sh |
| `400` | `title must be at most 120 characters` | Sarlavha juda uzun |
| `400` | `description must be at most 2000 characters` | Tavsif juda uzun |
| `400` | `image file is required (field name: "image")` | Yaratishda fayl yuborilmagan |
| `400` | `File too large. Max allowed size is 5 MB.` | Rasm 5 MB dan katta |
| `400` | `Unsupported image type: …` | Ruxsat etilmagan format (PDF, SVG, ...) |
| `400` | `Unexpected file field: …` | Fayl maydoni `image` deb nomlanmagan |
| `400` | `Invalid _id: …` | `id` ObjectId formatiga mos emas |
| `404` | `Post not found` | Bunday id li post yo'q |
| `404` | `Route not found: …` | Manzil noto'g'ri |
| `500` | `Cloudinary upload failed: …` | Cloudinary kalitlari xato yoki tarmoq yo'q |

---

## Loyiha tuzilishi

```
back-lesson/
├── server.js                     # kirish nuqtasi: .env, DB ulanish, listen
├── public/
│   └── index.html                # interaktiv API hujjati ("/" da ochiladi)
└── src/
    ├── app.js                    # Express ilova: middleware'lar, marshrutlar
    ├── config/
    │   ├── db.js                 # MongoDB ulanishi
    │   └── cloudinary.js         # Cloudinary SDK sozlamasi
    ├── routes/post.routes.js     # /api/posts marshrutlari
    ├── controllers/post.controller.js  # CRUD mantiq va validatsiya
    ├── services/cloudinary.service.js  # rasm yuklash / o'chirish
    ├── models/post.model.js      # Mongoose sxemasi
    ├── middlewares/
    │   ├── upload.js             # multer: format va hajm nazorati
    │   └── error.js              # 404 va markazlashgan xato ishlovchi
    └── utils/ApiError.js         # statusCode bilan ishlaydigan Error klassi
```

So'rovning yo'li:

```
So'rov
  → app.js              (cors, json, morgan, static)
  → post.routes.js      (metod va manzil bo'yicha yo'naltirish)
  → upload.js           (multer: faylni xotiraga oladi, formatni tekshiradi)
  → post.controller.js  (validatsiya → cloudinary.service → Mongoose model)
  → error.js            (xatoni bir xil JSON formatga keltiradi)
Javob
```

### Diqqatga sazovor xulq-atvor

- Rasm **xotirada** (memory storage) saqlanadi va to'g'ridan-to'g'ri Cloudinary'ga oqim orqali
  yuboriladi — diskda vaqtinchalik fayl qolmaydi.
- Yaratishda Cloudinary'ga yuklab bo'lgach bazaga yozish xato bersa, yuklangan rasm
  avtomatik o'chiriladi — "yetim" fayllar to'planmaydi.
- Yangilashda yangi rasm kelsa, eskisi Cloudinary'dan o'chiriladi.
- Postni o'chirish uning rasmini ham o'chiradi.

---

## Skriptlar

| Buyruq | Vazifasi |
|---|---|
| `npm start` | Serverni ishga tushirish |
| `npm run dev` | Nodemon bilan ishga tushirish (avtomatik qayta yuklash) |

---

## Eslatmalar

- Autentifikatsiya yo'q — bu o'quv loyihasi. Ochiq internetga chiqarishdan oldin
  himoya (API key / JWT) va rate limiting qo'shish kerak.
- CORS barcha manbalar uchun ochiq, shuning uchun frontendni istalgan portdan ulash mumkin.
