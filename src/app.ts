import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { apiReference } from '@scalar/express-api-reference';
import openApiSpec from './docs/openapi.json';
import { responseStandardizer } from './middlewares/responseStandardizer';

import authRoutes from './routes/authRoutes';
import transactionRoutes from './routes/transactionRoutes';
import memberRoutes from './routes/memberRoutes';
import productRoutes from './routes/productRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import financeRoutes from './routes/financeRoutes';
import auditRoutes from './routes/auditRoutes';
import employeeRoutes from './routes/employeeRoutes';
import warrantyRoutes from './routes/warrantyRoutes';
import supplierRoutes from './routes/supplierRoutes';

const app = express();

app.use(express.json());
app.use(responseStandardizer);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://domain-asli-frontend.com' 
    : '*', 
  optionsSuccessStatus: 200
}));

app.set('trust proxy', 1); // Wajib untuk Railway/Cloud deployment yang berada di balik reverse proxy

app.use(helmet({
  contentSecurityPolicy: false, // Dinonaktifkan agar script UI dari Scalar Docs (CDN) tidak terblokir oleh browser
}));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1000 request/menit 
  max: 300, // Batas maksimal  300 request/menit per user permintaan per windowMs per IP
  message: "Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti."
});

app.use(limiter);

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Rukun Jaya POS & Inventory API',
    version: '1.2.0',
    documentation: '/docs',
    timestamp: new Date().toISOString()
  });
});

app.use('/docs', apiReference({
  title: 'Dokumentasi API Be Rukun Jaya',
  spec: {
    content: openApiSpec,
  },
}));

import posRoutes from './routes/posRoutes';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/pos', posRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/inventory', productRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/audit/logs', auditRoutes);
app.use('/api/v1/staff', employeeRoutes);
app.use('/api/v1/warranty', warrantyRoutes);
app.use('/api/suppliers', supplierRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
}); 