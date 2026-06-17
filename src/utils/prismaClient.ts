import dotenv from 'dotenv';
dotenv.config();

// @ts-ignore
import { PrismaClient  } from '@prisma/client';
// @ts-ignore
import { PrismaPg  } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required to initialize Prisma client.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export default prisma;
