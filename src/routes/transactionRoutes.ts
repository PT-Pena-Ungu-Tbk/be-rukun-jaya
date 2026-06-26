import express from 'express';
const router = express.Router();
import { checkout, returnItem, getTransactionDetails, exportTransactionsExcel } from '../controllers/transactionController';
import { verifyToken, hasRoles } from '../middlewares/authMiddleware';

router.post('/', verifyToken, hasRoles(['MANAGER', 'CASHIER']), checkout);
router.get('/:transaction_id', verifyToken, hasRoles(['MANAGER', 'CASHIER', 'OWNER']), getTransactionDetails);
router.post('/return', verifyToken, returnItem);
router.get('/export/excel', verifyToken, hasRoles(['MANAGER', 'OWNER']), exportTransactionsExcel);

export default router;