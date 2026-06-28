import express from 'express';
const router = express.Router();
import { verifyToken, isOwner  } from '../middlewares/authMiddleware';
import { getFinancialSummary  } from '../controllers/reportController';

router.get('/financial', verifyToken, isOwner, getFinancialSummary);

export default router;
