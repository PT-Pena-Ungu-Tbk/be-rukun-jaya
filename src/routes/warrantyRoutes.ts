import express from 'express';
import { lookupWarranty, createWarrantyClaim } from '../controllers/warrantyController';
import { verifyToken, hasRoles } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/lookup', verifyToken, hasRoles(['OWNER', 'CASHIER']), lookupWarranty);
router.post('/claims', verifyToken, hasRoles(['OWNER', 'CASHIER']), createWarrantyClaim);

export default router;
