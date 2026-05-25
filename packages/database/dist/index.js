import { PrismaClient } from '@prisma/client';
const globalForPrisma = globalThis;
/**
 * Singleton Prisma client.
 * In development, reuses the same instance across hot-reloads.
 */
export const prisma = globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
    });
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
export { PrismaClient };
export * from '@prisma/client';
//# sourceMappingURL=index.js.map