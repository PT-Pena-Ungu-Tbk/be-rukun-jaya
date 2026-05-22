# 🧾 Backend Rukun Jaya - Express API

Repository ini berisi layanan backend untuk **Sistem Kasir Toko Rukun Jaya**. Aplikasi dibuat menggunakan **Express.js** dan menyediakan API dasar yang dapat dihubungkan dengan Frontend dan Database.

---

### 🧩 Ringkasan

* **Framework**: Express.js
* **File utama**: `src/app.js`
* **Port default**: `3000`
* **Endpoint utama**:
  * `GET /` - Menampilkan respons sederhana "Hello World!"

---

### 🛠️ Prasyarat

Sebelum menjalankan backend ini, pastikan:
* Node.js sudah terpasang jika ingin menjalankan secara lokal.
* Jika menggunakan environment Docker Compose, cukup jalankan dari `infra-rukun-jaya`.

---

### 🚀 Menjalankan Backend Secara Lokal

1. Buka terminal di `be-rukun-jaya`.
2. Jalankan:
```bash
node src/app.js
```
3. Buka `http://localhost:3000` di browser untuk memastikan server berjalan.

---

### 🌐 Integrasi Dengan `infra-rukun-jaya`

Jika repository ini dijalankan sebagai bagian dari workspace multi-repo, backend biasanya akan di-orchestrasi melalui `infra-rukun-jaya`.

Pastikan struktur folder workspace sudah benar:

```text
📁 rukun-jaya-workspace/
 ┣ 📁 be-rukun-jaya/
 ┣ 📁 fe-rukun-jaya/
 ┗ 📁 infra-rukun-jaya/
```

Kemudian jalankan Docker Compose dari folder `infra-rukun-jaya`:
```bash
docker compose up
```

---

### 📌 Catatan

* Saat ini `package.json` belum memiliki script `start`, jadi jalankan langsung melalui `node src/app.js`.
* Jika ingin menambahkan route baru, modifikasi file `src/app.js` dan restart server.

---

### 📎 Struktur Folder Sederhana

```text
be-rukun-jaya/
 ┣ 📂 src/
 ┃ ┗ 📄 app.js
 ┣ 📄 package.json
 ┗ 📄 README.md
```
