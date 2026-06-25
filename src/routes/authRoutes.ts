// src/routes/authRoutes.ts
import express from 'express';
const router = express.Router();
import { login, refreshToken, logout } from '../controllers/authController';
import { verifyToken } from '../middlewares/authMiddleware';

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', verifyToken, logout);

export default router;