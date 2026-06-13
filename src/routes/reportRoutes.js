const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getFinancialReport } = require('../controllers/reportController');

router.get('/financial', verifyToken, getFinancialReport);

module.exports = router;
