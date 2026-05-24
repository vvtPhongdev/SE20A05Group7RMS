import { z } from 'zod';
/**
 * Typed environment validation.
 * Validates at startup — fail fast if config is missing.
 */
// ─── API Environment ───────────────────────────────────────────────
const ApiEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().url(),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().int().default(6379),
    API_PORT: z.coerce.number().int().default(3001),
    API_CORS_ORIGIN: z.string().default('http://localhost:3000'),
    JWT_SECRET: z.string().min(10),
    JWT_EXPIRES_IN: z.string().default('7d'),
});
export function validateApiEnv(env = process.env) {
    return ApiEnvSchema.parse(env);
}
// ─── Worker Environment ────────────────────────────────────────────
const WorkerEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().url(),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().int().default(6379),
});
export function validateWorkerEnv(env = process.env) {
    return WorkerEnvSchema.parse(env);
}
// ─── Web Environment ───────────────────────────────────────────────
const WebEnvSchema = z.object({
    NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3001'),
});
export function validateWebEnv(env = process.env) {
    return WebEnvSchema.parse(env);
}
//# sourceMappingURL=index.js.map