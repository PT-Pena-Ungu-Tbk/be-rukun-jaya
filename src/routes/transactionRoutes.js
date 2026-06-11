// src/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const { checkout, returnItem } = require('../controllers/transactionController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Endpoint wajib menggunakan verifyToken untuk memastikan Kasir/Owner sudah login
router.post('/checkout', verifyToken, checkout);
router.post('/return', verifyToken, returnItem);

module.exports = router;