import express from 'express';
const router = express.Router();
import { verifyToken, isOwner } from '../middlewares/authMiddleware';
import { getDashboardOverview } from '../controllers/dashboardController';

router.get('/overview', verifyToken, isOwner, getDashboardOverview);

export default router;
