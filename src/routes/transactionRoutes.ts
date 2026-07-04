import express from 'express';
const router = express.Router();
import { exportTransactionsExcel, getTransactionHistory, returnItem } from '../controllers/transactionController';
import { verifyToken, hasRoles } from '../middlewares/authMiddleware';

// Daftar Transaksi JSON (dengan Pagination, Filter, Search)
router.get('/', verifyToken, hasRoles(['OWNER', 'CASHIER']), getTransactionHistory);

// Retur Transaksi
router.post('/return', verifyToken, hasRoles(['OWNER', 'CASHIER']), returnItem);

// Overview dan Export
router.get('/export/excel', verifyToken, hasRoles(['OWNER']), exportTransactionsExcel);

export default router;