const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// src/app.js
const express = require('express');
const app = express();

// Middleware agar Express bisa membaca format JSON
app.use(express.json()); 

// Import file router yang sudah kamu buat
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

// Daftarkan Base Route sesuai Standar Kontrak API (/api/v1)
app.use('/api/v1/auth', authRoutes); 
app.use('/api/v1/transactions', transactionRoutes);

// Endpoint bawaan dari Ulil
app.get('/', (req, res) => {
    res.send("Hello World!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});