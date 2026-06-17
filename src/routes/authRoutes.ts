// src/routes/authRoutes.js
import express from 'express';
const router = express.Router();
import { login  } from '../controllers/authController';

// Mendaftarkan endpoint POST /auth/login
router.post('/login', login);

export default router;