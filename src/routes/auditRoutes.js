const express = require('express');
const router = express.Router();
const { verifyToken, isOwner } = require('../middlewares/authMiddleware');
const { getAuditLogs, getAuditLogById } = require('../controllers/auditController');

router.get('/', verifyToken, isOwner, getAuditLogs);
router.get('/:id', verifyToken, isOwner, getAuditLogById);

module.exports = router;
