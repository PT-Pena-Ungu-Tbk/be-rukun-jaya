import express from 'express';
import { getAllEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee } from '../controllers/employeeController';
import { verifyToken, isOwner } from '../middlewares/authMiddleware';

const router = express.Router();

// Middleware: Semua rute karyawan wajib login dan harus memiliki role OWNER
router.use(verifyToken);
router.use(isOwner);

router.get('/', getAllEmployees);
router.get('/:id', getEmployeeById);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

export default router;
