const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getAuditLogs, getAuditLogById } = require('../controllers/auditController');

router.get('/', verifyToken, getAuditLogs);
router.get('/:id', verifyToken, getAuditLogById);

module.exports = router;
