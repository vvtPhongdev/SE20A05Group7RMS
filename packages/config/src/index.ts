import { z } from 'zod';

/**
 * Typed environment validation.
 * Validates at startup — fail fast if config is missing.
 */

// ─── API Environment ───────────────────────────────────────────────

const ApiEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default('localhost'),
  API_PORT: z.coerce.number().int().default(3001),
  API_CORS_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

export type ApiEnv = z.infer<typeof ApiEnvSchema>;

export function validateApiEnv(env: Record<string, string | undefined> = process.env): ApiEnv {
  return ApiEnvSchema.parse(env);
}

// ─── Worker Environment ────────────────────────────────────────────

const WorkerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default('localhost'),
});

export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;

export function validateWorkerEnv(
  env: Record<string, string | undefined> = process.env,
): WorkerEnv {
  return WorkerEnvSchema.parse(env);
}

// ─── Web Environment ───────────────────────────────────────────────

const WebEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3001'),
});

export type WebEnv = z.infer<typeof WebEnvSchema>;

export function validateWebEnv(env: Record<string, string | undefined> = process.env): WebEnv {
  return WebEnvSchema.parse(env);
}
