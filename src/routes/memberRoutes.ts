// src/routes/memberRoutes.js
import express from 'express';
const router = express.Router();
import { verifyMember  } from '../controllers/memberController';
import { verifyToken  } from '../middlewares/authMiddleware';

// Endpoint: GET /api/v1/members/verify?phone=...
router.get('/verify', verifyToken, verifyMember);

export default router;