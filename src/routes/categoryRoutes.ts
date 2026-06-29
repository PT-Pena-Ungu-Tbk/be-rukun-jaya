import express from 'express';
const router = express.Router();

import { verifyToken } from '../middlewares/authMiddleware';
import { getCategories } from '../controllers/categoryController';

router.get('/', verifyToken, getCategories);

export default router;
