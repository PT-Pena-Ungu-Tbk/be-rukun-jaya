// src/routes/memberRoutes.js
const express = require('express');
const router = express.Router();
const { verifyMember } = require('../controllers/memberController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Endpoint: GET /api/v1/members/verify?phone=...
router.get('/verify', verifyToken, verifyMember);

module.exports = router;