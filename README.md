# 🧾 Backend Rukun Jaya - Sistem Kasir & Manajemen Inventaris

Backend API untuk **Sistem Kasir Toko Rukun Jaya** milik PT. Pena Ungu Tbk. Aplikasi ini dibangun menggunakan **Node.js, Express.js, Prisma ORM, dan PostgreSQL** dengan standar keamanan JWT.

---

### 🧩 Ringkasan

* **Framework**: Express.js
* **File utama**: `src/app.js`
* **Port default**: `5000`
* **Endpoint utama**:
  * `GET /` - Menampilkan respons sederhana "Hello World!"

---

## 🛠️ Tech Stack
* **Framework**: Express.js
* **Database**: PostgreSQL
* **ORM**: Prisma Client (`@prisma/client`) dengan adapter `@prisma/adapter-pg`
* **Keamanan**: `bcrypt` (hashing) & `jsonwebtoken` (JWT Bearer Token)
* **Dokumentasi API**: Scalar (`@scalar/express-api-reference`)

---

## 🚀 Panduan Menjalankan Secara Lokal

### 1. Prasyarat
- Node.js (Minimal v18)
- Database PostgreSQL berjalan di port 5432 (secara lokal atau melalui Docker).

### 2. Instalasi Dependensi
Jalankan perintah ini untuk menginstal seluruh modul yang diperlukan:
```bash
npm install
```

### 3. Konfigurasi Environment (File `.env`)
Pastikan Anda memiliki file `.env` yang dikonfigurasi di *root* folder backend ini. Contohnya:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/rukun_jaya?schema=public"
JWT_SECRET="rahasia_toko_rukun_jaya_123"
```

### 4. Setup Database & Prisma
Lakukan penyelarasan skema, _generate_ Prisma Client, lalu masukkan data awal (_seeding_):
```bash
npx prisma generate
npx prisma db push
node prisma/seed.js`
```
*Catatan: Menjalankan skrip seed akan menyiapkan kredensial default untuk pengujian:*
- **Owner**: `owner@toko-rukunjaya.com` | Pass: `password_rahasia`
- **Kasir**: `kasir@toko-rukunjaya.com` | Pass: `password_rahasia`

### 5. Menjalankan Server
Jalankan aplikasi dengan script `dev`:
```bash
npm run dev
```
Server akan berjalan di `http://localhost:5000`.

---

## 📚 Dokumentasi API (Scalar UI)
Anda bisa langsung melihat daftar dan spesifikasi API secara visual interaktif dengan membuka tautan berikut di browser sesaat setelah server berjalan:
👉 **[http://localhost:5000/docs](http://localhost:5000/docs)**

Dokumentasi API mencakup seluruh *routes*, parameter, *payload* dan *response schema*, seperti:
- `POST /api/v1/auth/login`
- `GET /api/v1/products`
- `PUT /api/v1/products/bulk-update`
- `POST /api/v1/transactions/checkout`
- `POST /api/v1/transactions/return`
- `GET /api/v1/reports/financial`
- *dll.*

---

## 📎 Struktur Direktori Backend

```text
be-rukun-jaya/
 ┣ 📂 prisma/               # Skema Database Prisma & Skrip Seed
 ┣ 📂 src/
 ┃ ┣ 📂 controllers/        # Logika Bisnis (Auth, Transaksi, Produk, dll)
 ┃ ┣ 📂 docs/               # Definisi Skema OpenAPI (openapi.json)
 ┃ ┣ 📂 middlewares/        # Proteksi JWT & Pengecekan Peran Akses (RBAC)
 ┃ ┣ 📂 routes/             # Konfigurasi Rute URL Express
 ┃ ┣ 📂 utils/              # Pengaturan Instance Prisma Client
 ┃ ┗ 📄 app.js              # Entry-point Utama Aplikasi Server
 ┣ 📄 package.json          # Manajemen Skrip dan Dependensi NPM
 ┗ 📄 README.md             # Panduan Utama Repository Ini
```
