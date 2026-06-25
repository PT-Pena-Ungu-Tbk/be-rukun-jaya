# API CONTRACT DOCUMENT

## Toko Rukun Jaya — Enterprise Inventory & POS Management System

- Versi: 1.0.0
- Base URL: `https://api.tokorukunajaya.id/v1`
- Format: `JSON`
- Protokol: `HTTPS`
- Auth: `Bearer JWT`

---

## Daftar Isi

1. [Overview & Konvensi Umum](#1-overview--konvensi-umum)
   1. [Informasi Dasar](#11-informasi-dasar)
   2. [Struktur Respons Standar](#12-struktur-respons-standar)
   3. [Struktur Error Standar](#13-struktur-error-standar)
   4. [Header Wajib](#14-header-wajib)
   5. [Role & Hak Akses](#15-role--hak-akses)
2. [Autentikasi & Otorisasi](#2-autentikasi--otorisasi)
   1. [Login](#21-login)
   2. [Refresh Token](#22-refresh-token)
   3. [Logout](#23-logout)
3. [Dashboard (Tinjauan Operasional)](#3-dashboard-tinjauan-operasional)
   1. [Ambil Data Dashboard Utama](#31-ambil-data-dashboard-utama)
4. [POS — Menu Penjualan / Transaksi](#4-pos--menu-penjualan--transaksi)
   1. [Cari Produk untuk POS](#41-cari-produk-untuk-pos)
   2. [Buat Transaksi Baru (Bayar & Cetak Struk)](#42-buat-transaksi-baru-bayar--cetak-struk)
   3. [Detail Transaksi (Modal Pop-up)](#43-detail-transaksi-modal-pop-up)
   4. [Validasi Member VIP](#44-validasi-member-vip)
5. [Manajemen Inventaris Barang](#5-manajemen-inventaris-barang)
   1. [Daftar Inventaris Barang](#51-daftar-inventaris-barang)
   2. [Tambah Barang Baru](#52-tambah-barang-baru)
   3. [Update Barang](#53-update-barang)
   4. [Hapus Barang](#54-hapus-barang)
   5. [Update Stok Massal (Perbarui Sekaligus)](#55-update-stok-massal-perbarui-sekaligus)
   6. [Upload Template Excel Bulk Update](#56-upload-template-excel-bulk-update)
   7. [Detail Produk](#57-detail-produk)
6. [Klaim Garansi & Retur Barang](#6-klaim-garansi--retur-barang)
   1. [Cari Nota Transaksi untuk Retur](#61-cari-nota-transaksi-untuk-retur)
   2. [Konfirmasi Retur Barang](#62-konfirmasi-retur-barang)
7. [Laporan Keuangan & Penjualan](#7-laporan-keuangan--penjualan)
   1. [Ringkasan Laporan Keuangan](#71-ringkasan-laporan-keuangan)
   2. [Riwayat Transaksi Sukses](#72-riwayat-transaksi-sukses)
   3. [Download Laporan PDF](#73-download-laporan-pdf)
8. [Riwayat Transaksi — Overview](#8-riwayat-transaksi--overview)
   1. [Overview Riwayat Transaksi](#81-overview-riwayat-transaksi)
   2. [Export Riwayat Transaksi CSV](#82-export-riwayat-transaksi-csv)
9. [Manajemen Akun Karyawan](#9-manajemen-akun-karyawan)
   1. [Daftar Karyawan](#91-daftar-karyawan)
   2. [Tambah Karyawan Baru](#92-tambah-karyawan-baru)
   3. [Edit Karyawan](#93-edit-karyawan)
   4. [Toggle Akses Karyawan (Quick Toggle)](#94-toggle-akses-karyawan-quick-toggle)
   5. [Hapus Karyawan](#95-hapus-karyawan)
10. [Manajemen Member VIP](#10-manajemen-member-vip)
    1. [Daftar Member VIP](#101-daftar-member-vip)
    2. [Tambah Member VIP Baru](#102-tambah-member-vip-baru)
    3. [Tukar Poin (Redeem Points)](#103-tukar-poin-redeem-points)
    4. [Export Daftar Member](#104-export-daftar-member)
11. [Audit Log & Keamanan](#11-audit-log--keamanan)
    1. [Ambil Audit Log](#111-ambil-audit-log)
    2. [Export Audit Log CSV](#112-export-audit-log-csv)
12. [Referensi Kode Error HTTP](#12-referensi-kode-error-http)
13. [Changelog & Versi](#13-changelog--versi)

---

## 1. Overview & Konvensi Umum

### 1.1 Informasi Dasar

| Item | Deskripsi |
|---|---|
| Base URL | `https://api.tokorukunajaya.id/v1` |
| Protokol | HTTPS (TLS 1.2+) |
| Format Request | `application/json` |
| Format Response | `application/json` |
| Autentikasi | Bearer JWT Token (Authorization header) |
| Rate Limiting | 300 request/menit per user, 1000 request/menit per IP |
| Versi API | v1 (disertakan di URL path) |
| Charset | UTF-8 |
| Timezone | Asia/Jakarta (WIB, UTC+7) |
| Format Tanggal | ISO 8601 — `YYYY-MM-DDTHH:mm:ssZ` |
| Format Mata Uang | IDR (integer, tanpa desimal). Contoh: `65000` |
| Pagination Default | `page=1`, `limit=10`, max `limit=100` |

### 1.2 Struktur Respons Standar

```json
{
  "success": true,
  "status_code": 200,
  "message": "Data berhasil diambil",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total_items": 1248,
    "total_pages": 125
  },
  "timestamp": "2023-10-24T14:32:00+07:00",
  "request_id": "req_abc123xyz"
}
```

### 1.3 Struktur Error Standar

```json
{
  "success": false,
  "status_code": 422,
  "message": "Validasi gagal",
  "error_code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "nama_barang",
      "message": "Nama barang wajib diisi",
      "code": "REQUIRED_FIELD"
    }
  ],
  "timestamp": "2023-10-24T14:32:00+07:00",
  "request_id": "req_abc123xyz"
}
```

### 1.4 Header Wajib

| Header | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| Authorization | string | Ya | Bearer `<JWT>` | Token autentikasi. Format: `Bearer eyJ...` |
| Content-Type | string | Ya (POST/PUT) | `application/json` | Wajib untuk semua request dengan body |
| Accept | string | Tidak | `application/json` | Menentukan format respons yang diinginkan |
| X-Request-ID | string (UUID) | Tidak | UUID v4 | ID unik request untuk tracing & debugging |
| X-Timezone | string | Tidak | Asia/Jakarta | Override timezone untuk format tanggal respons |

### 1.5 Role & Hak Akses

| Role | Kode Role | Akses Modul |
|---|---|---|
| Owner / Pemilik | OWNER | Semua modul: Dashboard, POS, Inventaris, Garansi, Akun Karyawan, Member VIP, Laporan Keuangan, Audit Log |
| Kasir | CASHIER | POS (Penjualan), Garansi & Retur, Riwayat Transaksi |
| Admin Gudang | WAREHOUSE_ADMIN | Inventaris Barang, Detail Produk, Update Stok Massal |
| Manager | MANAGER | Dashboard, Laporan Keuangan, Riwayat Transaksi, Inventaris (read), Member VIP (read) |

---

## 2. Autentikasi & Otorisasi

Endpoint untuk login, logout, dan manajemen token akses.

### 2.1 Login

`POST /auth/login`

> 🔓 Endpoint publik — tidak memerlukan Authorization header.

**Request Body**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| email_or_username | string | Ya | max 100 char | Email atau username akun (contoh: `admin@ciailing.com`) |
| password | string | Ya | min 8, max 128 char | Password akun dalam format plaintext (dikirim via HTTPS) |
| remember_me | boolean | Tidak | `true | false` | Jika true, token berlaku 30 hari; default false (24 jam) |

**Contoh Request**

```http
POST /v1/auth/login
Content-Type: application/json

{
  "email_or_username": "admin@ciailing.com",
  "password": "secret123",
  "remember_me": false
}
```

**Respons Sukses (200 OK)**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
    "user": {
      "id": "STF001",
      "nama_lengkap": "Andi Wijaya",
      "email": "andi.wijaya@lumbertrack.com",
      "role": "OWNER",
      "permissions": [
        "pos.read",
        "pos.write",
        "inventory.read",
        "inventory.write",
        "reports.read",
        "accounts.manage",
        "audit.read"
      ],
      "last_login": "2023-10-23T07:30:00+07:00",
      "avatar_url": "https://cdn.tokorukunjaya.id/avatars/STF001.jpg"
    }
  }
}
```

**Error yang Mungkin Terjadi**

| Status | Error Code | Keterangan |
|---|---|---|
| 400 | INVALID_REQUEST | Body request tidak valid atau field wajib kosong |
| 401 | INVALID_CREDENTIALS | Email/username atau password salah |
| 403 | ACCOUNT_INACTIVE | Akun dinonaktifkan oleh Owner/Admin |
| 429 | TOO_MANY_ATTEMPTS | Terlalu banyak percobaan login gagal. Coba lagi dalam 15 menit |
| 500 | INTERNAL_SERVER_ERROR | Kesalahan server internal |

### 2.2 Refresh Token

`POST /auth/refresh`

**Request Body**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| refresh_token | string | Ya | JWT string | Refresh token yang diterima saat login |

**Respons Sukses**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
  }
}
```

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 401 | TOKEN_EXPIRED | Refresh token sudah kadaluarsa. User harus login ulang |
| 401 | TOKEN_INVALID | Refresh token tidak valid atau sudah digunakan |

### 2.3 Logout

`POST /auth/logout`

> 🔒 Wajib menyertakan Authorization: `Bearer <token>`.

**Respons**

```json
{
  "success": true,
  "message": "Logout berhasil. Sesi telah diakhiri."
}
```

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 401 | UNAUTHORIZED | Token tidak valid atau tidak disertakan |

---

## 3. Dashboard (Tinjauan Operasional)

Data ringkasan performa toko harian.

> 🔒 Role yang diizinkan: OWNER, MANAGER

### 3.1 Ambil Data Dashboard Utama

`GET /dashboard/overview`

**Query Parameters**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| date | string (date) | Tidak | `YYYY-MM-DD` | Tanggal data yang ingin ditampilkan. Default: hari ini |

**Respons Sukses (200 OK)**

```json
{
  "success": true,
  "data": {
    "summary": {
      "pendapatan_hari_ini": 24500000,
      "pendapatan_kemarin": 22600000,
      "persentase_perubahan_pendapatan": 8.4,
      "profit_kotor": 5200000,
      "profit_kemarin": 4990000,
      "persentase_perubahan_profit": 4.2,
      "volume_transaksi": 142,
      "volume_transaksi_kemarin": 144,
      "persentase_perubahan_volume": -1.2,
      "jumlah_pelanggan": 84,
      "jumlah_pelanggan_kemarin": 80,
      "persentase_perubahan_pelanggan": 5.0
    },
    "peringatan_stok": [
      { "sku": "SG-50-01", "nama": "Semen Gresik 50kg", "stok": 2, "satuan": "Sak", "status": "CRITICAL" },
      { "sku": "BB-10-SNI", "nama": "Besi Beton 10mm SNI", "stok": 16, "satuan": "Btg", "status": "LOW" },
      { "sku": "CT-DLX-W25", "nama": "Cat Tembok Dulux Putih 25kg", "stok": 0, "satuan": "Klg", "status": "EMPTY" }
    ],
    "produk_terlaris": [
      { "nama": "Semen Tiga Roda", "unit_terjual": 420, "total_nilai": 21000000 },
      { "nama": "Besi Beton 10mm", "unit_terjual": 315, "total_nilai": 38000000 }
    ],
    "aktivitas_terbaru": [
      { "tipe": "INVOICE_PRINT", "deskripsi": "Invoice #TRX-99824 dicetak", "waktu": "2023-10-24T14:22:00+07:00" },
      { "tipe": "STOCK_UPDATE", "deskripsi": "Update stok Cat Tembok", "waktu": "2023-10-24T13:47:00+07:00" }
    ],
    "metode_pembayaran": {
      "tunai": { "persentase": 45, "total": 11025000 },
      "transfer_bank": { "persentase": 40, "total": 9800000 },
      "qris": { "persentase": 15, "total": 3675000 },
      "total_terproses": 24500000
    },
    "daily_sales_chart": [
      { "hari": "Mon", "nilai": 11000000 },
      { "hari": "Tue", "nilai": 18000000 },
      { "hari": "Wed", "nilai": 25000000 }
    ]
  }
}
```

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 401 | UNAUTHORIZED | Token tidak valid |
| 403 | FORBIDDEN | Role tidak memiliki akses ke dashboard |
| 500 | INTERNAL_SERVER_ERROR | Kesalahan server internal |

---

## 4. POS — Menu Penjualan / Transaksi

Endpoint untuk operasi kasir, pencarian produk, dan pemrosesan transaksi.

> 🔒 Role yang diizinkan: OWNER, CASHIER, MANAGER

### 4.1 Cari Produk untuk POS

`GET /pos/products`

**Query Parameters**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| q | string | Tidak | max 100 char | Kata kunci pencarian nama barang |
| filter_by | string | Tidak | `nama|sku|rak` | Jenis filter pencarian. Default: semua |
| rak | string | Tidak | format: `X0-00-00` | Filter berdasarkan kode rak gudang |
| status | string | Tidak | `in_stock|low_stock|out_of_stock` | Filter berdasarkan status stok |
| page | integer | Tidak | min 1 | Halaman data. Default: 1 |
| limit | integer | Tidak | min 1, max 100 | Jumlah item per halaman. Default: 20 |

**Contoh Request**

```http
GET /v1/pos/products?q=beras&filter_by=nama&page=1&limit=20
Authorization: Bearer eyJ...
```

**Respons Sukses**

| Field | Type | Keterangan |
|---|---|---|
| items[] | array | Daftar produk yang ditemukan |
| items[].id | string | ID unik produk |
| items[].nama_barang | string | Nama produk |
| items[].kode_sku | string | Kode SKU unik (contoh: SKU-C-001) |
| items[].rak | string | Lokasi rak di gudang (contoh: R-A1-01) |
| items[].stok | integer | Jumlah stok tersedia |
| items[].harga_jual | integer | Harga jual satuan dalam IDR |
| items[].status | string | `IN_STOCK | LOW_STOCK | OUT_OF_STOCK` |
| items[].satuan | string | Satuan unit (sak, dus, btg, dll) |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 400 | INVALID_FILTER | Parameter filter tidak valid |
| 401 | UNAUTHORIZED | Token tidak valid atau kadaluarsa |

### 4.2 Buat Transaksi Baru (Bayar & Cetak Struk)

`POST /pos/transactions`

**Request Body**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| items | array | Ya | min 1 item | Daftar barang yang dibeli |
| items[].product_id | string | Ya | ID produk valid | ID produk dari endpoint `/pos/products` |
| items[].qty | integer | Ya | min 1 | Jumlah unit yang dibeli |
| payment_method | string | Ya | `CASH|TRANSFER|QRIS|CREDIT` | Metode pembayaran |
| jumlah_bayar | integer | Ya (CASH) | min = total | Jumlah uang yang dibayarkan (khusus CASH) |
| vip_phone | string | Tidak | format nomor HP | Nomor HP member VIP untuk validasi diskon |
| diskon_persen | number | Tidak | 0 - 100 | Persentase diskon manual (override) |
| diskon_nominal | integer | Tidak | min 0 | Diskon dalam nilai rupiah (tidak bisa bersamaan dengan persen) |
| payment_reference | string | Tidak | max 100 char | Nomor referensi transfer/QRIS |
| nama_pelanggan | string | Tidak | max 200 char | Nama pelanggan untuk nota |

**Contoh Request**

```http
POST /v1/pos/transactions
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "items": [
    { "product_id": "INV-001", "qty": 10 },
    { "product_id": "INV-089", "qty": 5 }
  ],
  "payment_method": "CASH",
  "jumlah_bayar": 1000000,
  "vip_phone": "081234567890"
}
```

**Respons Sukses**

```json
{
  "success": true,
  "data": {
    "transaction_id": "TRX-99824",
    "status": "SUCCESS",
    "subtotal": 810000,
    "diskon": 0,
    "ppn_11_persen": 89100,
    "grand_total": 899100,
    "jumlah_bayar": 1000000,
    "kembalian": 100900,
    "vip_member": null,
    "kasir_id": "STF002",
    "created_at": "2023-10-24T14:30:00+07:00",
    "struk_url": "https://cdn.tokorukunjaya.id/struk/TRX-99824.pdf",
    "items": [
      {
        "product_id": "INV-001",
        "nama": "Semen Tiga Roda 50kg",
        "qty": 10,
        "harga_satuan": 65000,
        "subtotal": 650000
      },
      {
        "product_id": "INV-089",
        "nama": "Pipa Wavin AW 1/2",
        "qty": 5,
        "harga_satuan": 32000,
        "subtotal": 160000
      }
    ]
  }
}
```

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 400 | INVALID_REQUEST | Field wajib tidak lengkap atau format salah |
| 402 | INSUFFICIENT_PAYMENT | Jumlah bayar kurang dari grand total (khusus CASH) |
| 404 | PRODUCT_NOT_FOUND | Satu atau lebih product_id tidak ditemukan |
| 409 | INSUFFICIENT_STOCK | Stok tidak mencukupi untuk qty yang diminta |
| 422 | VALIDATION_ERROR | Data tidak lulus validasi (qty negatif, diskon > 100%, dll) |
| 500 | TRANSACTION_FAILED | Transaksi gagal diproses di server |

### 4.3 Detail Transaksi (Modal Pop-up)

`GET /pos/transactions/:transaction_id`

**Path Parameter**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| :transaction_id | string | Ya | format TRX-XXXXX | ID transaksi yang valid |

**Respons**

| Field | Type | Keterangan |
|---|---|---|
| transaction_id | string | ID transaksi (contoh: TRX-88291) |
| status | string | `LUNAS | PENDING | CANCELLED` |
| created_at | datetime | Waktu transaksi dibuat |
| informasi_pelanggan | object | Nama, nomor HP, alamat pelanggan |
| metode_pembayaran | object | Tipe dan referensi pembayaran |
| items[] | array | Detail produk: nama, SKU, qty, harga satuan, total harga |
| subtotal | integer | Total sebelum PPN dan diskon |
| diskon_member | integer | Nilai diskon member VIP yang diterapkan |
| ppn_11_persen | integer | Nilai PPN 11% |
| grand_total | integer | Total akhir yang dibayarkan pelanggan |
| pdf_url | string | URL download faktur PDF |
| struk_url | string | URL cetak struk thermal |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 401 | UNAUTHORIZED | Token tidak valid |
| 404 | TRANSACTION_NOT_FOUND | Transaksi dengan ID tersebut tidak ditemukan |

### 4.4 Validasi Member VIP

`POST /pos/validate-vip`

**Request Body**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| phone | string | Ya | format: `08xx-xxxx-xxxx` | Nomor HP member VIP |

**Respons**

| Field | Type | Keterangan |
|---|---|---|
| is_member | boolean | true jika nomor terdaftar sebagai member VIP |
| member_id | string | ID member VIP (contoh: `#VIP-0892`) |
| nama | string | Nama member VIP |
| level | string | `Gold | Silver | Bronze` |
| poin | integer | Jumlah poin loyalitas saat ini |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 200 | NOT_A_MEMBER | Nomor HP tidak terdaftar (data `is_member: false`) |
| 400 | INVALID_PHONE_FORMAT | Format nomor HP tidak valid |

---

## 5. Manajemen Inventaris Barang

Endpoint untuk pengelolaan stok, produk, dan gudang.

> 🔒 Role yang diizinkan: OWNER, WAREHOUSE_ADMIN (write); MANAGER, CASHIER (read only)

### 5.1 Daftar Inventaris Barang

`GET /inventory/items`

**Query Parameters**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| kategori | string | Tidak | string | Filter berdasarkan kategori (contoh: Semen, Cat, Besi) |
| status | string | Tidak | `in_stock|low|empty|expired` | Filter berdasarkan status stok |
| kondisi | string | Tidak | `Baru|Rusak Ringan|Rusak Berat` | Filter berdasarkan kondisi fisik barang |
| q | string | Tidak | max 100 char | Pencarian berdasarkan nama atau kode ID |
| sort_by | string | Tidak | `nama|stok|exp_date|harga_jual` | Kolom untuk pengurutan |
| sort_order | string | Tidak | `asc|desc` | Arah pengurutan. Default: asc |
| page | integer | Tidak | min 1 | Halaman. Default: 1 |
| limit | integer | Tidak | `1-100` | Item per halaman. Default: 10 |

**Respons**

| Field | Type | Keterangan |
|---|---|---|
| summary | object | Ringkasan: jumlah stok_habis, di_bawah_minimum, akan_expired |
| items[] | array | Daftar barang inventaris |
| items[].id | string | ID barang (contoh: INV-001) |
| items[].nama_barang | string | Nama lengkap barang |
| items[].kondisi | string | `Baru | Rusak Ringan | Rusak Berat` |
| items[].stok | integer | Jumlah stok saat ini |
| items[].satuan | string | Satuan unit (sak, klg, btg, dus) |
| items[].harga_beli | integer | Harga beli per unit dalam IDR |
| items[].harga_jual | integer | Harga jual per unit dalam IDR |
| items[].exp_date | string (date) | Tanggal kadaluarsa. Null jika tidak ada |
| items[].kode_rak | string | Lokasi rak (contoh: A1-R01) |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 400 | INVALID_QUERY_PARAM | Parameter query tidak valid |
| 401 | UNAUTHORIZED | Token tidak valid |
| 403 | FORBIDDEN | Role tidak memiliki akses inventaris |

### 5.2 Tambah Barang Baru

`POST /inventory/items`

**Request Body**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| nama_barang | string | Ya | max 200 char | Nama lengkap barang (contoh: Semen Gresik 50kg) |
| kategori | string | Ya | string | Kategori barang (Semen, Besi, Cat, Pipa, Kayu, dll) |
| kondisi | string | Ya | `Baru|Rusak Ringan|Rusak Berat` | Kondisi fisik barang saat ini |
| jumlah_stok_awal | integer | Ya | min 0 | Jumlah stok awal saat pertama didaftarkan |
| satuan | string | Ya | max 20 char | Satuan unit (sak, klg, btg, dus, m, pcs) |
| kode_rak | string | Tidak | format: `X0-00` | Kode lokasi rak di gudang (contoh: A1-01) |
| harga_beli | integer | Ya | min 0 | Harga beli per unit dalam IDR |
| harga_jual | integer | Ya | min harga_beli | Harga jual per unit dalam IDR |
| tanggal_kadaluarsa | string (date) | Tidak | `YYYY-MM-DD`, harus > hari ini | Tanggal kadaluarsa produk (opsional) |
| stok_minimum | integer | Tidak | min 0 | Batas minimum stok untuk peringatan. Default: 10 |

**Respons**

```json
{
  "success": true,
  "message": "Barang berhasil ditambahkan",
  "data": {
    "id": "INV-1249",
    "nama_barang": "Semen Gresik 50kg",
    "kode_sku": "SKU-SGR-50",
    "created_at": "2023-10-24T15:00:00+07:00"
  }
}
```

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 400 | INVALID_REQUEST | Format atau nilai field tidak valid |
| 409 | DUPLICATE_ITEM | Barang dengan nama dan kategori yang sama sudah ada |
| 422 | VALIDATION_ERROR | harga_jual < harga_beli, atau tanggal_kadaluarsa sudah lewat |

### 5.3 Update Barang

`PUT /inventory/items/:item_id`

> Semua field bersifat opsional (partial update). Hanya field yang dikirim yang akan diperbarui.

**Path Parameter**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| :item_id | string | Ya | ID valid | ID barang yang akan diupdate |

**Request Body**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| nama_barang | string | Tidak | max 200 char | Nama baru barang |
| harga_beli | integer | Tidak | min 0 | Harga beli baru |
| harga_jual | integer | Tidak | min harga_beli | Harga jual baru |
| kondisi | string | Tidak | `Baru|Rusak Ringan|Rusak Berat` | Kondisi fisik baru |
| kode_rak | string | Tidak | format: `X0-00` | Lokasi rak baru |
| tanggal_kadaluarsa | string (date) | Tidak | `YYYY-MM-DD` | Tanggal kadaluarsa baru |
| stok_minimum | integer | Tidak | min 0 | Batas minimum stok baru |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 404 | ITEM_NOT_FOUND | Barang dengan ID tersebut tidak ditemukan |
| 422 | VALIDATION_ERROR | Nilai field tidak valid |

### 5.4 Hapus Barang

`DELETE /inventory/items/:item_id`

> ⚠️ PERINGATAN: Tindakan ini permanen. Barang yang sudah pernah digunakan dalam transaksi tidak dapat dihapus (soft delete diterapkan).

**Respons**

| Field | Type | Keterangan |
|---|---|---|
| deleted | boolean | true jika berhasil dihapus |
| message | string | Konfirmasi penghapusan |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 403 | FORBIDDEN | Hanya OWNER yang dapat menghapus barang |
| 404 | ITEM_NOT_FOUND | Barang tidak ditemukan |
| 409 | CANNOT_DELETE | Barang pernah digunakan dalam transaksi. Gunakan nonaktifkan saja |

### 5.5 Update Stok Massal (Perbarui Sekaligus)

`POST /inventory/bulk-update`

**Request Body**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| gudang_id | string | Ya | string | ID gudang yang distok ulang (contoh: gudang_utama) |
| items | array | Ya | min 1 | Daftar barang yang stoknya diperbarui |
| items[].item_id | string | Ya | ID valid | ID barang yang akan diupdate |
| items[].stok_fisik_baru | integer | Ya | min 0 | Jumlah stok fisik aktual di gudang |
| items[].kode_rak | string | Tidak | format: `X0-00` | Kode rak jika berbeda dari data sistem |
| items[].keterangan | string | Tidak | max 200 char | Keterangan alasan perubahan stok |

**Contoh Request**

```http
POST /v1/inventory/bulk-update

{
  "gudang_id": "gudang_utama",
  "items": [
    { "item_id": "INV-001", "stok_fisik_baru": 455, "kode_rak": "A1-22", "keterangan": "Audit Stok Rutin" },
    { "item_id": "INV-042", "stok_fisik_baru": 118, "kode_rak": "Y-04", "keterangan": "Barang Rusak" },
    { "item_id": "INV-109", "stok_fisik_baru": 32, "kode_rak": "C3-01" }
  ]
}
```

**Respons**

| Field | Type | Keterangan |
|---|---|---|
| updated_count | integer | Jumlah barang yang berhasil diupdate |
| failed_count | integer | Jumlah barang yang gagal diupdate |
| selisih_signifikan | integer | Jumlah barang dengan selisih stok > 10% |
| results[] | array | Detail hasil per barang: item_id, status, stok_lama, stok_baru, selisih |
| audit_log_id | string | ID log audit yang dibuat otomatis |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 207 | PARTIAL_SUCCESS | Beberapa item berhasil, beberapa gagal (lihat results[]) |
| 400 | EMPTY_ITEMS | Array items kosong |
| 404 | ITEM_NOT_FOUND | Satu atau lebih item_id tidak valid |

### 5.6 Upload Template Excel Bulk Update

`POST /inventory/bulk-update/upload`

> Content-Type wajib: `multipart/form-data`. Max ukuran file: 10MB.

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| file | file (.xlsx) | Ya | max 10MB | File Excel hasil download template dari sistem |
| gudang_id | string | Ya | string | ID gudang yang diupdate |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 400 | INVALID_FILE_FORMAT | File bukan format .xlsx yang valid |
| 422 | TEMPLATE_MISMATCH | Kolom di file tidak sesuai dengan template yang diunduh |

### 5.7 Detail Produk

`GET /inventory/items/:item_id`

**Respons**

| Field | Type | Keterangan |
|---|---|---|
| id | string | ID barang |
| nama_barang | string | Nama barang |
| kode_sku | string | Kode SKU unik |
| brand | string | Merek produk |
| kategori | string | Kategori produk |
| berat_net | string | Berat bersih produk |
| standar_sni | string | Standar SNI yang berlaku (jika ada) |
| harga_beli | integer | Harga beli (unit cost) |
| harga_jual | integer | Harga jual (sales price) |
| margin_persen | number | Persentase margin keuntungan |
| stok_tersedia | integer | Total stok tersedia di semua rak |
| stok_minimum_reorder | integer | Batas minimum untuk reorder |
| distribusi_stok[] | array | Detail stok per rak: rak, jumlah, level_stok (Optimal/Low/Critical) |
| gambar_urls[] | array | URL gambar produk |
| last_stock_update | datetime | Waktu terakhir stok diperbarui |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 404 | ITEM_NOT_FOUND | Produk tidak ditemukan |

---

## 6. Klaim Garansi & Retur Barang

Endpoint untuk proses pengembalian barang cacat dan penukaran.

> 🔒 Role yang diizinkan: OWNER, CASHIER

### 6.1 Cari Nota Transaksi untuk Retur

`GET /warranty/lookup`

**Query Parameters**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| invoice_id | string | Ya | format INV-XXXXXXXX-XXX | ID nota transaksi (contoh: INV-202310-045) |

**Respons**

| Field | Type | Keterangan |
|---|---|---|
| nota_id | string | ID nota yang ditemukan |
| tanggal | string (date) | Tanggal transaksi awal |
| items[] | array | Daftar barang dalam nota yang bisa diretur |
| items[].kode_item | string | Kode item produk |
| items[].nama_barang | string | Nama barang |
| items[].qty_beli | integer | Jumlah yang dibeli dalam nota ini |
| items[].qty_sudah_diretur | integer | Jumlah yang sudah pernah diretur sebelumnya |
| items[].harga_satuan | integer | Harga satuan saat transaksi |
| items[].can_return | boolean | true jika masih bisa diretur |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 404 | INVOICE_NOT_FOUND | Nota dengan ID tersebut tidak ditemukan di sistem |
| 410 | INVOICE_EXPIRED | Nota melebihi batas waktu garansi (biasanya 30 hari) |

### 6.2 Konfirmasi Retur Barang

`POST /warranty/claims`

**Request Body**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| invoice_id | string | Ya | ID nota valid | ID nota asal transaksi |
| item_kode | string | Ya | kode item valid | Kode item yang akan diretur |
| alasan_retur | string | Ya | enum | Alasan: `CACAT_PABRIK | SALAH_KIRIM | KUALITAS_TIDAK_SESUAI | LAINNYA` |
| qty_diretur | integer | Ya | min 1, max qty_beli | Jumlah unit yang diretur |
| deskripsi_kondisi | string | Tidak | max 500 char | Deskripsi detail kerusakan atau kondisi barang |

**Respons**

| Field | Type | Keterangan |
|---|---|---|
| claim_id | string | ID klaim garansi yang dibuat |
| status | string | `APPROVED | PENDING_REVIEW` |
| estimasi_nilai_retur | integer | Nilai estimasi retur dalam IDR |
| stok_berkurang | boolean | true jika stok item pengganti sudah dikurangi otomatis |
| catatan | string | Catatan dari sistem |

> ⚠️ Menekan konfirmasi akan otomatis mengurangi stok gudang untuk item pengganti. Pastikan fisik barang pengganti sudah siap.

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 400 | INVALID_QTY | qty_diretur melebihi qty_beli atau sudah pernah diretur |
| 404 | INVOICE_NOT_FOUND | Nota tidak ditemukan |
| 409 | ALREADY_CLAIMED | Item sudah pernah diklaim garansi untuk nota yang sama |
| 422 | INSUFFICIENT_STOCK | Stok barang pengganti tidak cukup di gudang |

---

## 7. Laporan Keuangan & Penjualan

Endpoint untuk data finansial, ringkasan omzet, dan riwayat transaksi.

> 🔒 Role yang diizinkan: OWNER, MANAGER

### 7.1 Ringkasan Laporan Keuangan

`GET /finance/summary`

**Query Parameters**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| period | string | Tidak | `this_month|last_month|custom` | Periode laporan. Default: this_month |
| date_from | string (date) | Cond. | `YYYY-MM-DD` | Wajib jika period=custom. Tanggal mulai |
| date_to | string (date) | Cond. | `YYYY-MM-DD` | Wajib jika period=custom. Tanggal akhir |

**Respons**

| Field | Type | Keterangan |
|---|---|---|
| total_omzet | integer | Total pendapatan kotor dalam IDR |
| keuntungan_bersih | integer | Keuntungan bersih setelah HPP |
| persentase_omzet_vs_sebelumnya | number | Perubahan omzet dibanding periode sebelumnya (%) |
| persentase_profit_vs_sebelumnya | number | Perubahan profit dibanding periode sebelumnya (%) |
| periode | object | `date_from` dan `date_to` yang digunakan |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 400 | INVALID_PERIOD | Kombinasi period dan date_from/date_to tidak valid |
| 400 | DATE_RANGE_TOO_WIDE | Rentang tanggal melebihi 366 hari |

### 7.2 Riwayat Transaksi Sukses

`GET /finance/transactions`

**Query Parameters**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| date_from | string (date) | Tidak | `YYYY-MM-DD` | Filter tanggal mulai |
| date_to | string (date) | Tidak | `YYYY-MM-DD` | Filter tanggal akhir |
| payment_method | string | Tidak | `CASH|TRANSFER|QRIS|CREDIT|all` | Filter metode pembayaran |
| status | string | Tidak | `SUCCESS|PENDING|CANCELLED|all` | Filter status transaksi |
| kasir_id | string | Tidak | ID kasir valid | Filter berdasarkan kasir yang memproses |
| pelanggan | string | Tidak | max 100 char | Pencarian nama pelanggan |
| q | string | Tidak | format TRX-XXXXX | Cari berdasarkan ID transaksi |
| page | integer | Tidak | min 1 | Halaman. Default: 1 |
| limit | integer | Tidak | `1-100` | Item per halaman. Default: 10 |
| sort_by | string | Tidak | `created_at|total|pelanggan` | Kolom pengurutan. Default: created_at |
| sort_order | string | Tidak | `asc|desc` | Arah pengurutan. Default: desc |

**Respons**

| Field | Type | Keterangan |
|---|---|---|
| items[] | array | Daftar transaksi |
| items[].id_transaksi | string | ID transaksi (contoh: TRU-88291) |
| items[].tanggal_waktu | datetime | Waktu transaksi |
| items[].pelanggan | string | Nama pelanggan |
| items[].metode_pembayaran | string | Metode pembayaran yang digunakan |
| items[].total_transaksi | integer | Grand total transaksi dalam IDR |
| items[].status | string | Sukses | Pending | Cancelled |
| items[].kasir_id | string | ID kasir yang memproses |
| meta.total_items | integer | Total transaksi yang memenuhi filter |
| meta.total_pages | integer | Total halaman |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 400 | INVALID_DATE_RANGE | `date_from > date_to` |
| 401 | UNAUTHORIZED | Token tidak valid |

### 7.3 Download Laporan PDF

`GET /finance/export/pdf`

**Query Parameters**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| period | string | Ya | `this_month|last_month|custom` | Periode laporan |
| date_from | string (date) | Cond. | `YYYY-MM-DD` | Wajib jika period=custom |
| date_to | string (date) | Cond. | `YYYY-MM-DD` | Wajib jika period=custom |

> Response Content-Type: `application/pdf`. File akan langsung diunduh. Proses generate dapat memakan waktu hingga 30 detik untuk data besar.

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 400 | INVALID_PERIOD | Parameter periode tidak valid |
| 503 | EXPORT_SERVICE_UNAVAILABLE | Layanan generate PDF sedang tidak tersedia |

---

## 8. Riwayat Transaksi — Overview

Endpoint untuk tampilan overview transaksi dengan audit trail inline.

> 🔒 Role yang diizinkan: OWNER, MANAGER, CASHIER (hanya transaksi sendiri)

### 8.1 Overview Riwayat Transaksi

`GET /transactions/overview`

**Respons**

| Field | Type | Keterangan |
|---|---|---|
| total_revenue_today | integer | Total pendapatan hari ini dalam IDR |
| total_transactions | integer | Jumlah total transaksi hari ini |
| transactions_change_pct | number | Perubahan jumlah transaksi vs kemarin (%) |
| pending_count | integer | Jumlah transaksi pending yang perlu perhatian |
| revenue_trends[] | array | Data grafik tren revenue mingguan: date, nilai |
| transactions[] | array | Daftar transaksi dengan filter aktif |
| audit_trail[] | array | Log aktivitas terkini: tipe, deskripsi, waktu, aktor |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 401 | UNAUTHORIZED | Token tidak valid |
| 403 | FORBIDDEN | Kasir hanya bisa melihat transaksi miliknya sendiri |

### 8.2 Export Riwayat Transaksi CSV

`GET /transactions/export/csv`

**Query Parameters**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| date_from | string (date) | Tidak | `YYYY-MM-DD` | Tanggal mulai filter |
| date_to | string (date) | Tidak | `YYYY-MM-DD` | Tanggal akhir filter |
| status | string | Tidak | `SUCCESS|PENDING|CANCELLED|all` | Filter status |

> Response Content-Type: `text/csv`. Max 10.000 baris per export.

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 400 | DATE_RANGE_TOO_WIDE | Rentang tanggal melebihi 1 tahun |
| 429 | EXPORT_RATE_LIMITED | Terlalu sering melakukan export. Tunggu 1 menit |

---

## 9. Manajemen Akun Karyawan

Endpoint untuk pengelolaan user, role, dan kontrol akses karyawan.

> 🔒 Role yang diizinkan: OWNER saja (semua operasi write). MANAGER dapat membaca daftar karyawan.

### 9.1 Daftar Karyawan

`GET /staff`

**Query Parameters**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| q | string | Tidak | max 100 char | Pencarian berdasarkan nama atau ID karyawan |
| role | string | Tidak | `OWNER|CASHIER|WAREHOUSE_ADMIN|MANAGER` | Filter berdasarkan role |
| status | string | Tidak | `active|inactive` | Filter status akun |

**Respons**

| Field | Type | Keterangan |
|---|---|---|
| items[] | array | Daftar karyawan |
| items[].id_karyawan | string | ID karyawan (contoh: STF001) |
| items[].nama_lengkap | string | Nama lengkap karyawan |
| items[].jabatan | string | Role/jabatan: Owner | Cashier | Warehouse Admin | Manager |
| items[].login_time | string | Waktu login shift terakhir |
| items[].is_active | boolean | Status akun aktif atau tidak |
| items[].last_activity | datetime | Waktu aktivitas terakhir di sistem |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 403 | FORBIDDEN | Hanya OWNER dan MANAGER yang dapat melihat daftar karyawan |

### 9.2 Tambah Karyawan Baru

`POST /staff`

**Request Body**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| full_name | string | Ya | max 200 char | Nama lengkap karyawan |
| role | string | Ya | `CASHIER|WAREHOUSE_ADMIN|MANAGER` | Role/jabatan di sistem |
| phone_number | string | Ya | format `08xx-xxxx-xxxx` | Nomor HP karyawan untuk kontak |
| email | string | Ya | format email valid | Alamat email untuk login sistem |
| password | string | Ya | min 8 char, max 128 char | Password awal akun karyawan |

**Respons**

| Field | Type | Keterangan |
|---|---|---|
| id_karyawan | string | ID karyawan yang dibuat (contoh: STF004) |
| nama_lengkap | string | Nama karyawan |
| email | string | Email yang terdaftar |
| role | string | Role yang ditetapkan |
| created_at | datetime | Waktu akun dibuat |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 409 | EMAIL_ALREADY_EXISTS | Email sudah digunakan akun lain |
| 422 | WEAK_PASSWORD | Password tidak memenuhi persyaratan minimum |
| 422 | INVALID_ROLE | Role tidak valid atau OWNER tidak dapat didaftarkan lewat endpoint ini |

### 9.3 Edit Karyawan

`PUT /staff/:staff_id`

**Path Parameter**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| :staff_id | string | Ya | ID karyawan valid | ID karyawan yang akan diedit |

**Request Body**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| nama_lengkap | string | Tidak | max 200 char | Nama lengkap baru |
| email | string | Tidak | format email valid | Email baru |
| role | string | Tidak | enum role valid | Role/jabatan baru |
| is_active | boolean | Tidak | `true | false` | Aktifkan atau nonaktifkan akun |

> ℹ️ Mengubah `is_active` menjadi `false` akan segera mencabut semua akses karyawan dari sistem secara real-time.

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 403 | CANNOT_EDIT_OWNER | Akun Owner tidak dapat diedit lewat endpoint ini |
| 404 | STAFF_NOT_FOUND | Karyawan tidak ditemukan |
| 409 | EMAIL_ALREADY_EXISTS | Email baru sudah digunakan akun lain |

### 9.4 Toggle Akses Karyawan (Quick Toggle)

`PATCH /staff/:staff_id/toggle-access`

**Path Parameter**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| :staff_id | string | Ya | ID karyawan valid | ID karyawan target |

**Respons**

| Field | Type | Keterangan |
|---|---|---|
| staff_id | string | ID karyawan |
| is_active | boolean | Status baru setelah toggle |
| message | string | Konfirmasi pesan |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 403 | CANNOT_DEACTIVATE_OWNER | Akun Owner tidak dapat dinonaktifkan |

### 9.5 Hapus Karyawan

`DELETE /staff/:staff_id`

> ⚠️ PERINGATAN: Tindakan ini tidak dapat dibatalkan. Semua data terkait karyawan akan dihapus secara permanen.

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 403 | FORBIDDEN | Hanya OWNER yang dapat menghapus karyawan |
| 403 | CANNOT_DELETE_SELF | Tidak dapat menghapus akun diri sendiri |
| 404 | STAFF_NOT_FOUND | Karyawan tidak ditemukan |
| 409 | HAS_ACTIVE_SESSIONS | Karyawan masih dalam sesi aktif. Nonaktifkan dulu |

---

## 10. Manajemen Member VIP

Endpoint untuk program loyalitas, poin, dan manajemen member.

> 🔒 Role yang diizinkan: OWNER, MANAGER (write); CASHIER (read + validate)

### 10.1 Daftar Member VIP

`GET /members/vip`

**Query Parameters**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| level | string | Tidak | `Gold|Silver|Bronze|all` | Filter berdasarkan tingkat keanggotaan. Default: all |
| q | string | Tidak | max 100 char | Pencarian nama atau nomor HP |
| sort_by | string | Tidak | `poin|join_date|last_transaction` | Pengurutan. Default: poin |
| sort_order | string | Tidak | `asc|desc` | Arah pengurutan. Default: desc |
| page | integer | Tidak | min 1 | Halaman. Default: 1 |
| limit | integer | Tidak | `1-100` | Item per halaman. Default: 10 |

**Respons**

| Field | Type | Keterangan |
|---|---|---|
| stats.total_members | integer | Total seluruh member VIP terdaftar |
| stats.active_members | integer | Member yang aktif bertransaksi (engagement rate) |
| stats.total_poin_issued | integer | Total poin yang pernah diterbitkan |
| items[] | array | Daftar member VIP |
| items[].member_id | string | ID member (contoh: `#VIP-0892`) |
| items[].nama | string | Nama member atau nama perusahaan |
| items[].phone_number | string | Nomor HP terdaftar |
| items[].level | string | `Gold | Silver | Bronze` |
| items[].poin | integer | Jumlah poin saat ini |
| items[].join_date | string (date) | Tanggal mendaftar jadi member |
| items[].last_transaction | string | Waktu terakhir bertransaksi (relatif: "2 days ago") |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 400 | INVALID_LEVEL_FILTER | Nilai level filter tidak valid |

### 10.2 Tambah Member VIP Baru

`POST /members/vip`

**Request Body**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| nama | string | Ya | max 200 char | Nama lengkap atau nama perusahaan |
| phone_number | string | Ya | format 08xx, unik | Nomor HP yang akan digunakan sebagai identifikasi |
| level | string | Tidak | `Gold|Silver|Bronze` | Level awal. Default: Bronze |
| poin_awal | integer | Tidak | min 0 | Poin awal (untuk migrasi data). Default: 0 |

**Respons**

| Field | Type | Keterangan |
|---|---|---|
| member_id | string | ID member yang dibuat (contoh: `#VIP-1249`) |
| nama | string | Nama member |
| level | string | Level keanggotaan |
| poin | integer | Poin awal |
| join_date | string (date) | Tanggal bergabung |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 409 | PHONE_ALREADY_REGISTERED | Nomor HP sudah terdaftar sebagai member lain |

### 10.3 Tukar Poin (Redeem Points)

`POST /members/vip/:member_id/redeem`

**Request Body**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| :member_id | string | Ya | ID VIP valid | ID member VIP (path parameter) |
| poin_ditukar | integer | Ya | min 1, max saldo poin | Jumlah poin yang ingin ditukarkan |
| jenis_penukaran | string | Ya | `DISKON|HADIAH` | Tipe penukaran poin |
| transaction_id | string | Tidak | ID transaksi aktif | ID transaksi jika penukaran untuk diskon langsung |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 400 | INSUFFICIENT_POINTS | Saldo poin tidak mencukupi |
| 404 | MEMBER_NOT_FOUND | Member VIP tidak ditemukan |

### 10.4 Export Daftar Member

`GET /members/vip/export`

> Response Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 429 | EXPORT_RATE_LIMITED | Terlalu sering export. Tunggu 1 menit |

---

## 11. Audit Log & Keamanan

Endpoint untuk pemantauan aktivitas sistem, log keamanan, dan riwayat perubahan data.

> 🔒 Role yang diizinkan: OWNER saja

### 11.1 Ambil Audit Log

`GET /audit/logs`

**Query Parameters**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| date_from | string (date) | Tidak | `YYYY-MM-DD` | Tanggal mulai pencarian log. Default: 7 hari lalu |
| date_to | string (date) | Tidak | `YYYY-MM-DD` | Tanggal akhir. Default: hari ini |
| jenis_aktivitas | string | Tidak | `LOGIN|EDIT_HARGA|HAPUS_BARANG|RETUR|all` | Filter tipe aktivitas |
| user_id | string | Tidak | ID karyawan | Filter berdasarkan user yang melakukan aktivitas |
| page | integer | Tidak | min 1 | Halaman. Default: 1 |
| limit | integer | Tidak | `1-100` | Item per halaman. Default: 20 |

**Respons**

| Field | Type | Keterangan |
|---|---|---|
| items[] | array | Daftar log aktivitas |
| items[].user | object | Informasi user: id, nama, jabatan, avatar_url |
| items[].waktu | datetime | Waktu kejadian aktivitas |
| items[].aktivitas | string | Tipe aktivitas: `EDIT_HARGA | HAPUS_BARANG | LOGIN | RETUR_PEMBELIAN` |
| items[].detail_perubahan | string | Deskripsi lengkap perubahan yang terjadi |
| items[].nilai_lama | string | Nilai sebelum perubahan (untuk aktivitas edit) |
| items[].nilai_baru | string | Nilai sesudah perubahan |
| items[].ip_address | string | Alamat IP dari mana aktivitas dilakukan |
| meta.total_items | integer | Total log yang memenuhi filter |

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 403 | FORBIDDEN | Hanya OWNER yang dapat mengakses audit log |
| 400 | DATE_RANGE_TOO_WIDE | Rentang tanggal melebihi 90 hari per request |

### 11.2 Export Audit Log CSV

`GET /audit/logs/export`

**Query Parameters**

| Field | Type | Required | Constraint | Deskripsi |
|---|---|---|---|---|
| date_from | string (date) | Ya | `YYYY-MM-DD` | Tanggal mulai export |
| date_to | string (date) | Ya | `YYYY-MM-DD` | Tanggal akhir export. Max rentang 90 hari |
| jenis_aktivitas | string | Tidak | enum atau all | Filter tipe aktivitas |

> Response Content-Type: `text/csv`. File nama: `audit-log-{date_from}-{date_to}.csv`

**Error**

| Status | Error Code | Keterangan |
|---|---|---|
| 400 | INVALID_DATE_RANGE | `date_from > date_to` atau rentang > 90 hari |
| 403 | FORBIDDEN | Hanya OWNER yang dapat export audit log |

---

## 12. Referensi Kode Error HTTP

| Status | Status Text | Keterangan |
|---|---|---|
| 200 | OK | Request berhasil diproses |
| 201 | Created | Resource baru berhasil dibuat (POST) |
| 204 | No Content | Request berhasil, tidak ada data yang dikembalikan (DELETE) |
| 207 | Multi-Status | Sebagian request berhasil, sebagian gagal (bulk operations) |
| 400 | Bad Request | Request tidak valid: format salah, field wajib kosong, atau tipe data tidak sesuai |
| 401 | Unauthorized | Token tidak ada, tidak valid, atau sudah kadaluarsa |
| 402 | Payment Required | Jumlah pembayaran tidak mencukupi (khusus endpoint POS) |
| 403 | Forbidden | Token valid tapi role tidak punya izin akses ke resource ini |
| 404 | Not Found | Resource yang diminta tidak ditemukan di sistem |
| 405 | Method Not Allowed | HTTP method yang digunakan tidak didukung endpoint ini |
| 409 | Conflict | Konflik data: duplikasi, stok tidak cukup, atau constraint lainnya |
| 410 | Gone | Resource sudah tidak tersedia (kadaluarsa) |
| 422 | Unprocessable Entity | Format valid tapi nilai tidak lolos validasi bisnis |
| 429 | Too Many Requests | Melebihi rate limit. Header `Retry-After` disertakan |
| 500 | Internal Server Error | Kesalahan tidak terduga di sisi server |
| 503 | Service Unavailable | Layanan sedang tidak tersedia (maintenance atau overload) |

---

## 13. Changelog & Versi

| Versi | Tanggal | Perubahan |
|---|---|---|
| v1.0.0 | 24 Okt 2023 | Rilis pertama API Contract mencakup: Autentikasi, POS, Inventaris, Garansi, Keuangan, Karyawan, Member VIP, Audit Log. |
