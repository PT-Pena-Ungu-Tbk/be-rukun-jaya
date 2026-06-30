import express from 'express';
const router = express.Router();
import { exportTransactionsExcel, getTransactionHistory } from '../controllers/transactionController';
import { verifyToken, hasRoles } from '../middlewares/authMiddleware';

// Daftar Transaksi JSON (dengan Pagination, Filter, Search)
router.get('/', verifyToken, hasRoles(['MANAGER', 'OWNER', 'CASHIER']), getTransactionHistory);

// Overview dan Export
router.get('/export/excel', verifyToken, hasRoles(['MANAGER', 'OWNER']), exportTransactionsExcel);