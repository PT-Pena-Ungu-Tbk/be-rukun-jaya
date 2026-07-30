import express from 'express';
const router = express.Router();
import { exportTransactionsExcel, getTransactionHistory, getAllTransactions, getTransactionDetails } from '../controllers/transactionController';
import { verifyToken, hasRoles } from '../middlewares/authMiddleware';

// Daftar Transaksi JSON (dengan Pagination, Filter, Search)
router.get('/', verifyToken, hasRoles(['OWNER', 'CASHIER']), getTransactionHistory);

// Daftar Semua Transaksi (Tanpa Paginasi)
router.get('/all', verifyToken, hasRoles(['OWNER', 'CASHIER']), getAllTransactions);

// Detail Transaksi Berdasarkan ID atau Invoice
router.get('/:transaction_id', verifyToken, hasRoles(['OWNER', 'CASHIER']), getTransactionDetails);

// Overview dan Export
router.get('/export/excel', verifyToken, hasRoles(['OWNER']), exportTransactionsExcel);

export default router;