import express from 'express';
const router = express.Router();
import { exportTransactionsExcel, getTransactionHistory, getAllTransactions } from '../controllers/transactionController';
import { verifyToken, hasRoles } from '../middlewares/authMiddleware';

// Daftar Transaksi JSON (dengan Pagination, Filter, Search)
router.get('/', verifyToken, hasRoles(['OWNER', 'CASHIER']), getTransactionHistory);

// Daftar Semua Transaksi (Tanpa Paginasi)
router.get('/all', verifyToken, hasRoles(['OWNER', 'CASHIER']), getAllTransactions);

// Overview dan Export
router.get('/export/excel', verifyToken, hasRoles(['OWNER']), exportTransactionsExcel);

export default router;