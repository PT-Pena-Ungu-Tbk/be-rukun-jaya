import express from 'express';
const router = express.Router();
import { verifyToken, isOwner  } from '../middlewares/authMiddleware';
import { getFinancialReport  } from '../controllers/reportController';

router.get('/financial', verifyToken, isOwner, getFinancialReport);

export default router;
