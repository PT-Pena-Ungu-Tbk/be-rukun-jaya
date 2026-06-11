// src/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const { calculateVipDiscount } = require('../controllers/transactionController');

// TODO: Nanti tambahkan authMiddleware (verifyToken) di sini agar route aman
// router.post('/calculate-discount', verifyToken, calculateVipDiscount);

// Endpoint API untuk menghitung diskon VIP
router.post('/calculate-discount', calculateVipDiscount);

module.exports = router;