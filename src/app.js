const express = require('express');
const { apiReference } = require('@scalar/express-api-reference');
const path = require('path');
const openApiSpec = require('./docs/openapi.json'); // Impor spesifikasi JSON Anda

const app = express();

// Middleware dasar untuk parsing JSON
app.use(express.json());

// --- INTEGRASI SCALAR DOCUMENTATION ---
app.use(
  '/docs',
  apiReference({
    theme: 'purple',
    spec: {
      content: openApiSpec,
    },
  })
);

// Rute API utama Anda yang lain diletakkan di bawah ini
// app.use('/api/v1/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server Express aktif berjalan pada port ${PORT}`);
  console.log(`Dokumentasi API interaktif dapat diakses di: http://localhost:${PORT}/docs`);
});