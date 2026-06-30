import express from 'express';
const router = express.Router();
import { verifyToken } from '../middlewares/authMiddleware';
import { getSuppliers } from '../controllers/supplierController';

router.get('/', verifyToken, getSuppliers);

export default router;
