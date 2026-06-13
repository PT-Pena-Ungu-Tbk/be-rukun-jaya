const express = require('express');
const { apiReference } = require('@scalar/express-api-reference');
const path = require('path');
const openApiSpec = require('./docs/openapi.json'); // Impor spesifikasi JSON Anda

const app = express();

// Middleware dasar untuk parsing JSON
app.use(express.json());

// Daftarkan API Reference Middleware
app.use('/docs', apiReference({
  title: 'Dokumentasi API Be Rukun Jaya',
  spec: {
    content: openApiSpec,
  },
}));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server Express aktif berjalan pada port ${PORT}`);
  console.log(`Dokumentasi API interaktif dapat diakses di: http://localhost:${PORT}/docs`);
});
  console.log(`Server running at http://localhost:${port}`);

// src/app.js
const express = require('express');
const app = express();

// Middleware agar Express bisa membaca format JSON
app.use(express.json()); 

// Import file router yang sudah kamu buat
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const memberRoutes = require('./routes/memberRoutes');

// Daftarkan Base Route sesuai Standar Kontrak API (/api/v1)
app.use('/api/v1/auth', authRoutes); 
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/members', memberRoutes);

// Endpoint bawaan dari Ulil
app.get('/', (req, res) => {
    res.send("Hello World!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});