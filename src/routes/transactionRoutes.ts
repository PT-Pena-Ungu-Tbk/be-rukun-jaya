// src/routes/transactionRoutes.js
import express from 'express';
const router = express.Router();
import { checkout, returnItem  } from '../controllers/transactionController';
import { verifyToken  } from '../middlewares/authMiddleware';

// Endpoint wajib menggunakan verifyToken untuk memastikan Kasir/Owner sudah login
router.post('/checkout', verifyToken, checkout);
router.post('/return', verifyToken, returnItem);

export default router;