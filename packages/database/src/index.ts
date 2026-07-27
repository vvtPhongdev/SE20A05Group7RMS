import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

type PrismaLogLevel = 'query' | 'warn' | 'error';

const accelerateUrl = process.env.DATABASE_URL;

if (!accelerateUrl) {
  throw new Error('DATABASE_URL must contain the Prisma Accelerate connection URL.');
}

export const getAccelerateClientOptions = () => ({
  accelerateUrl,
  log: (process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['warn', 'error']) as PrismaLogLevel[],
});

/**
 * The application-wide Prisma client. Every runtime client uses the Accelerate
 * URL, so microservices no longer open independent PostgreSQL connection pools.
 */
export const createAcceleratedPrismaClient = () =>
  new PrismaClient(getAccelerateClientOptions()).$extends(withAccelerate());

export type AcceleratedPrismaClient = ReturnType<typeof createAcceleratedPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: AcceleratedPrismaClient | undefined;
};

/**
 * Singleton Prisma client.
 * In development, reuses the same instance across hot-reloads.
 */
export const prisma =
  globalForPrisma.prisma ??
  createAcceleratedPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '@prisma/client';
export * from './audit-log.service';
