import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
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

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://domain-asli-frontend.com' 
    : '*', 
  optionsSuccessStatus: 200
}));

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Batas maksimal 100 permintaan per windowMs per IP
  message: "Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti."
});

app.use(limiter);

app.get('/', (req, res) => {
  res.send('API aman dengan CORS, Helmet, dan Rate Limiting!');
});

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

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
}); 