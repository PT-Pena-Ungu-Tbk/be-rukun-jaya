# Migrasi Backend Rukun Jaya ke TypeScript

Dokumen ini berisi langkah-langkah lengkap untuk mengubah *source code* backend Express.js dari JavaScript (CommonJS) ke TypeScript pada *branch* baru.

## User Review Required

> [!IMPORTANT]
> Mohon tinjau rencana migrasi di bawah ini. Jika Anda setuju, kita akan langsung membuat *branch* baru dan memulai eksekusi.

## Proposed Changes

---

### Tahap 1: Setup Branch & Dependensi
- [NEW] **Git Branch**: Membuat branch baru bernama `feature/typescript-migration`.
- [NEW] **Dependensi TS**: Menginstal `typescript`, `@types/node`, `@types/express`, `@types/bcrypt`, `@types/jsonwebtoken`, `ts-node`, dan `nodemon` (sebagai `devDependencies`).
- [NEW] **tsconfig.json**: Melakukan inisialisasi konfigurasi TypeScript dengan target `ES2022`, modul `CommonJS` (atau `NodeNext`), *strict mode*, dan *outDir* ke `dist/`.

### Tahap 2: Konfigurasi `package.json` & Prisma
- [MODIFY] **NPM Scripts**: 
  - `"dev": "nodemon src/app.ts"`
  - `"build": "tsc"`
  - `"start": "node dist/app.js"`
- [MODIFY] **Prisma Seed**: Mengubah konfigurasi *seed* di `package.json` agar mengeksekusi file TypeScript (menggunakan `ts-node`).

### Tahap 3: Konversi File ke `.ts`
Mengganti ekstensi seluruh file `.js` menjadi `.ts` di dalam folder `src/` dan `prisma/`.
- `src/app.ts`
- `src/utils/prismaClient.ts`
- `src/controllers/*.ts`
- `src/routes/*.ts`
- `src/middlewares/authMiddleware.ts`
- `prisma/seed.ts`

### Tahap 4: Penyesuaian Sintaks (ESM & Typing)
- [MODIFY] **Sistem Import**: Mengubah semua `const ... = require(...)` menjadi `import ... from ...`.
- [MODIFY] **Sistem Export**: Mengubah `module.exports` menjadi `export default` atau `export const`.
- [NEW] **Type Definitions**:
  - Menambahkan tipe `Request`, `Response`, `NextFunction` dari modul `express` ke seluruh fungsi *controller* dan *middleware*.
  - *Extending* tipe `Express.Request` untuk mengakomodasi properti `req.user` yang di-inject oleh `verifyToken` middleware.

## Verification Plan

1. **Kompilasi TypeScript**: Menjalankan perintah `npm run build` dan memastikan kode berhasil di-*compile* ke dalam folder `dist/` tanpa *error* tipe data.
2. **Menjalankan Server Dev**: Menguji coba server dengan `npm run dev` dan memastikan API tetap berjalan di port 5000.
3. **Seeding Database**: Menjalankan ulang `npx prisma db seed` memastikan integrasi *ts-node* dan Prisma ORM berfungsi normal.
