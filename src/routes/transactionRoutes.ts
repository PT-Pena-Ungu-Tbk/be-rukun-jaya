// src/routes/transactionRoutes.ts
import express from 'express';
const router = express.Router();
import { checkout, returnItem, getTransactionDetails } from '../controllers/transactionController';
import { verifyToken, hasRoles } from '../middlewares/authMiddleware';

router.post('/', verifyToken, hasRoles(['MANAGER', 'CASHIER']), checkout);
router.get('/:transaction_id', verifyToken, hasRoles(['MANAGER', 'CASHIER', 'OWNER']), getTransactionDetails);
router.post('/return', verifyToken, returnItem);

export default router;