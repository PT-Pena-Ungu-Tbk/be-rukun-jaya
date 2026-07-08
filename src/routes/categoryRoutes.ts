import express from 'express';
const router = express.Router();

import { verifyToken, isOwner } from '../middlewares/authMiddleware';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';

router.get('/', verifyToken, getCategories);
router.post('/', verifyToken, isOwner, createCategory);
router.put('/:id', verifyToken, isOwner, updateCategory);
router.delete('/:id', verifyToken, isOwner, deleteCategory);

export default router;
