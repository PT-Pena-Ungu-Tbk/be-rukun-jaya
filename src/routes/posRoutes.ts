import express from 'express';
const router = express.Router();

import { verifyToken, hasRoles } from '../middlewares/authMiddleware';
import { checkout, getTransactionDetails, printReceipt } from '../controllers/transactionController';
import { getProducts } from '../controllers/productController';
import { verifyMember } from '../controllers/memberController';

// Endpoint pencarian produk khusus untuk kasir
router.get('/products', verifyToken, hasRoles(['OWNER', 'MANAGER', 'CASHIER']), getProducts);

// Transaksi Kasir
router.post('/transactions', verifyToken, hasRoles(['OWNER', 'MANAGER', 'CASHIER']), checkout);
router.get('/transactions/:transaction_id', verifyToken, hasRoles(['OWNER', 'MANAGER', 'CASHIER']), getTransactionDetails);
router.get('/transactions/:transaction_id/receipt', verifyToken, hasRoles(['OWNER', 'MANAGER', 'CASHIER']), printReceipt);

// Validasi Member VIP
router.post('/validate-vip', verifyToken, hasRoles(['OWNER', 'MANAGER', 'CASHIER']), verifyMember);

export default router;
