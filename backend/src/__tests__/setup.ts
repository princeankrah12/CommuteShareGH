import { beforeAll, beforeEach, afterAll } from 'vitest';
import prisma from '../services/prisma';

beforeAll(async () => {
  // Ensure we are connected
  await prisma.$connect();
});

beforeEach(async () => {
  // Clear all data before each test
  // Order matters due to foreign keys
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.error('Error clearing database:', error);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
