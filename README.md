# 🧾 Backend Rukun Jaya - Sistem Kasir & Manajemen Inventaris

Backend API untuk **Sistem Kasir Toko Bangunan Rukun Jaya** milik PT. Pena Ungu Tbk. Aplikasi ini dibangun menggunakan **TypeScript, Express.js (v5), Prisma ORM, dan PostgreSQL** dengan standar keamanan JWT serta proteksi infrastruktur yang siap dideploy menggunakan **Docker**.

---

## 🧩 Fitur Utama
* **Otentikasi & RBAC (Role-Based Access Control)**: Pengaturan hak akses granular untuk peran `OWNER`, `ADMIN`, dan `KASIR`.
* **Manajemen Karyawan (Employee Management)**: CRUD data karyawan yang aman, terlindungi oleh validasi strict TypeScript, enkripsi password menggunakan `bcrypt`, dan hanya dapat diakses oleh user ber-role `OWNER`.
* **Manajemen Produk**: Sistem inventaris dengan fitur filter stok minimum (*low stock*) dan pembaruan massal (*bulk update*).
* **Transaksi POS**: Checkout barang, pemotongan stok real-time, potongan diskon VIP/Member, dan perhitungan otomatis PPN 11%.
* **Klaim Garansi (Retur)**: Pemrosesan barang cacat dengan pencatatan *Audit Log* ketat.
* **Laporan Finansial**: Agregasi pendapatan dan metrik jumlah transaksi.
* **Audit Log**: Pencatatan riwayat aktivitas transaksional yang sensitif.
* **API Security Middleware**:
  - **CORS**: Pengaturan whitelist origin domain (ke frontend Vercel di prod / wildcard di dev).
  - **Helmet**: Keamanan HTTP response headers untuk perlindungan terhadap serangan web umum.
  - **Express Rate Limit**: Pembatasan request (maks 100 request/15 menit per IP) untuk menghindari brute-force dan DoS.
* **Scalar OpenAPI Docs**: Dokumentasi interaktif visual untuk eksplorasi dan testing endpoint API secara langsung.

---

## 🛠️ Tech Stack
* **Language**: TypeScript
* **Framework**: Express.js (v5)
* **Database**: PostgreSQL
* **ORM**: Prisma Client dengan adapter PostgreSQL
* **Security & Auth**: `bcrypt` (hashing), `jsonwebtoken` (JWT Bearer Token), `helmet`, `cors`, `express-rate-limit`
* **Docker**: Alpine-based Node.js runtime environment
* **API Docs**: Scalar (`@scalar/express-api-reference`)

---

## 🚀 Panduan Menjalankan Secara Lokal (Development)

### 1. Prasyarat
- Node.js (Minimal v18, direkomendasikan v20+)
- PostgreSQL yang aktif (lokal atau via Docker)

### 2. Instalasi Dependensi
Jalankan perintah berikut pada root folder backend:
```bash
npm install
```

### 3. Konfigurasi Environment (File `.env`)
Salin file `.env.example` ke `.env` dan sesuaikan nilainya:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:password_rahasia@localhost:5432/rukun_jaya_db?schema=public"
JWT_SECRET="rahasia_super_aman"
NODE_ENV="development"
```

### 4. Sinkronisasi Database & Seeding
Jalankan migrasi database, buat client Prisma, lalu masukkan data awal (seed):
```bash
# Jalankan migrasi database ke lokal
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Jalankan Seeding Data Awal
npx prisma db seed
```

*Catatan: Akun bawaan hasil seeding untuk keperluan testing:*
- **Owner**: `owner@toko-rukunjaya.com` | Pass: `password_rahasia`
- **Kasir**: `kasir@toko-rukunjaya.com` | Pass: `password_rahasia`

### 5. Menjalankan Server Dev
Jalankan aplikasi menggunakan nodemon di lingkungan lokal:
```bash
npm run dev
```
Server akan berjalan di **`http://localhost:5000`**.

---

## 🐳 Menjalankan Menggunakan Docker

Anda bisa mengemas dan menjalankan aplikasi backend secara mandiri menggunakan Dockerfile yang sudah disediakan.

### 1. Build Docker Image
Jalankan perintah ini dari folder root backend:
```bash
docker build -t be-rukun-jaya .
```

### 2. Jalankan Container
Jalankan container dengan melewatkan file `.env` lokal Anda:
```bash
docker run -d -p 5000:5000 --env-file .env --name rukun-jaya-backend be-rukun-jaya
```

---

## 📚 Dokumentasi API (Scalar UI)
Saat server berjalan, Anda dapat mengakses visualisasi dokumentasi API lengkap, payload schema, parameter, dan melakukan test endpoint secara interaktif melalui:
👉 **[http://localhost:5000/docs](http://localhost:5000/docs)**

### Endpoint Utama yang Tersedia (v1.2.0):
* **Autentikasi (`/api/v1/auth`)**:
  - `POST /login` - Login pengguna untuk mendapatkan JWT token.
* **Manajemen Karyawan (`/api/v1/staff`)** *(Khusus Owner)*:
  - `GET /` - Dapatkan semua karyawan.
  - `POST /` - Tambahkan karyawan baru.
  - `PUT /:id` - Edit data karyawan (termasuk reset password/role).
  - `DELETE /:id` - Hapus data karyawan.
* **Manajemen Gudang (`/api/v1/inventory`)**:
  - `GET /` - List produk dengan pencarian dan filter stok minimum (*low-stock*).
  - `POST /` - Tambah barang baru ke inventaris.
  - `PUT /bulk-update` - Update stok massal.
  - `DELETE /:id` - Hapus barang.
* **Transaksi POS (`/api/v1/pos/transactions`)**:
  - `POST /` - Checkout kasir (parameter: `items` dengan `qty`, `payment_method`, dll).
  - `GET /:transaction_id` - Detail struk transaksi.
* **Klaim Garansi & Retur (`/api/v1/warranty/claims`)**:
  - `POST /` - Proses barang cacat dan catat ke log audit.
* **Laporan Finansial (`/api/v1/finance`)**:
  - `GET /summary` - Agregasi total pemasukan dan volume transaksi.
* **Audit Logs (`/api/v1/audit/logs`)**:
  - `GET /` - Log aktivitas audit sistem.

---

## 📎 Struktur Direktori Backend

```text
be-rukun-jaya/
 ┣ 📂 prisma/               # Skema Database Prisma (schema.prisma) & Skrip Seed (seed.ts)
 ┣ 📂 src/
 ┃ ┣ 📂 config/             # Folder konfigurasi tambahan (opsional)
 ┃ ┣ 📂 controllers/        # Pengendali Logika Bisnis (Auth, Karyawan, POS, dll)
 ┃ ┣ 📂 docs/               # Spesifikasi OpenAPI (openapi.json)
 ┃ ┣ 📂 middlewares/        # Proteksi JWT Auth & Otorisasi RBAC
 ┃ ┣ 📂 routes/             # Pemetaan endpoint URL Express
 ┃ ┣ 📂 services/           # Logika layanan terpisah (opsional)
 ┃ ┣ 📂 types/              # Deklarasi Type/Interface TypeScript kustom
 ┃ ┣ 📂 utils/              # Helper Global (PrismaClient, AppError, Validator)
 ┃ ┗ 📄 app.ts              # Entry-point Utama Server Express.js
 ┣ 📄 .dockerignore         # Mengabaikan file tidak penting saat build Docker
 ┣ 📄 Dockerfile            # Langkah-langkah build image Docker
 ┣ 📄 package.json          # Manajemen skrip build & dependencies NPM
 ┣ 📄 tsconfig.json         # Konfigurasi Compiler TypeScript
 ┗ 📄 README.md             # Panduan Dokumentasi Repository (File ini)
```
