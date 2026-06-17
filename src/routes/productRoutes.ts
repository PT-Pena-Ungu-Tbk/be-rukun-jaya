import express from 'express';
const router = express.Router();
import { verifyToken, isOwner  } from '../middlewares/authMiddleware';
import { createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkUpdateProducts,
 } from '../controllers/productController';

router.get('/', verifyToken, getProducts);
router.get('/:id', verifyToken, getProductById);
router.put('/bulk-update', verifyToken, isOwner, bulkUpdateProducts);
router.post('/', verifyToken, isOwner, createProduct);
router.put('/:id', verifyToken, isOwner, updateProduct);
router.delete('/:id', verifyToken, isOwner, deleteProduct);

export default router;
