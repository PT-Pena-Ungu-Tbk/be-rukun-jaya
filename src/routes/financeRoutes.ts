import express from 'express';
const router = express.Router();
import { verifyToken, isOwner } from '../middlewares/authMiddleware';
import { getFinancialSummary, exportFinancialPDF } from '../controllers/reportController';

router.get('/summary', verifyToken, isOwner, getFinancialSummary);
router.get('/export/pdf', verifyToken, isOwner, exportFinancialPDF);

export default router;
