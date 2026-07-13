import express from 'express';
import multer from 'multer';
const router = express.Router();
import { verifyToken, isOwner  } from '../middlewares/authMiddleware';
import { createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkUpdateProducts,
  uploadExcelBulkUpdate,
  downloadTemplate
 } from '../controllers/productController';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB
});

router.get('/', verifyToken, getProducts);
router.get('/:id', verifyToken, getProductById);
router.put('/bulk-update', verifyToken, isOwner, bulkUpdateProducts);
router.get('/bulk-update/template', verifyToken, isOwner, downloadTemplate);
router.post('/bulk-update/upload', verifyToken, isOwner, upload.single('file'), uploadExcelBulkUpdate);
router.post('/', verifyToken, isOwner, createProduct);
router.put('/:id', verifyToken, isOwner, updateProduct);
router.delete('/:id', verifyToken, isOwner, deleteProduct);

export default router;
