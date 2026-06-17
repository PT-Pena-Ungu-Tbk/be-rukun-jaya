import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import { apiReference } from '@scalar/express-api-reference';
import openApiSpec from './docs/openapi.json';

import authRoutes from './routes/authRoutes';
import transactionRoutes from './routes/transactionRoutes';
import memberRoutes from './routes/memberRoutes';
import productRoutes from './routes/productRoutes';
import reportRoutes from './routes/reportRoutes';
import auditRoutes from './routes/auditRoutes';
import employeeRoutes from './routes/employeeRoutes';

const app = express();

app.use(express.json());

app.use('/docs', apiReference({
  title: 'Dokumentasi API Be Rukun Jaya',
  spec: {
    content: openApiSpec,
  },
}));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/employees', employeeRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});