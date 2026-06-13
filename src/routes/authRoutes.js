// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

// Mendaftarkan endpoint POST /auth/login
router.post('/login', login);

module.exports = router;