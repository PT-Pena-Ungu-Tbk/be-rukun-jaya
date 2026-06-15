const express = require('express');
const router = express.Router();
const { verifyToken, isOwner } = require('../middlewares/authMiddleware');
const { getFinancialReport } = require('../controllers/reportController');

router.get('/financial', verifyToken, isOwner, getFinancialReport);

module.exports = router;
