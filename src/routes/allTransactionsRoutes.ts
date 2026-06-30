import express from 'express';
const router = express.Router();
import { verifyToken } from '../middlewares/authMiddleware';
import { getAllTransactions } from '../controllers/transactionController';

router.get('/', verifyToken, getAllTransactions);

export default router;
