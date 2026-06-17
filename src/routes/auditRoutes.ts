import express from 'express';
const router = express.Router();
import { verifyToken, isOwner  } from '../middlewares/authMiddleware';
import { getAuditLogs, getAuditLogById  } from '../controllers/auditController';

router.get('/', verifyToken, isOwner, getAuditLogs);
router.get('/:id', verifyToken, isOwner, getAuditLogById);

export default router;
