const express = require('express');
const router = express.Router();
const { verifyToken, isOwner } = require('../middlewares/authMiddleware');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkUpdateProducts,
} = require('../controllers/productController');

router.get('/', verifyToken, getProducts);
router.get('/:id', verifyToken, getProductById);
router.put('/bulk-update', verifyToken, isOwner, bulkUpdateProducts);
router.post('/', verifyToken, isOwner, createProduct);
router.put('/:id', verifyToken, isOwner, updateProduct);
router.delete('/:id', verifyToken, isOwner, deleteProduct);

module.exports = router;
