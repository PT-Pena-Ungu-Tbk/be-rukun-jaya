import express from 'express';
const router = express.Router();
import { verifyToken, isOwner } from '../middlewares/authMiddleware';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplierController';

router.get('/', verifyToken, getSuppliers);
router.post('/', verifyToken, isOwner, createSupplier);
router.put('/:id', verifyToken, isOwner, updateSupplier);
router.delete('/:id', verifyToken, isOwner, deleteSupplier);

export default router;
