import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = `${process.env.DATABASE_URL}`;
if (process.env.NODE_ENV === 'test') {
  console.log(`[Prisma Service] Connecting to: ${connectionString.split('@')[1] || 'UNDEFINED'}`);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
