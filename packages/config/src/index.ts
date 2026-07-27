import { z } from 'zod';

/**
 * Typed environment validation.
 * Validates at startup — fail fast if config is missing.
 */

// ─── Base Environment (Common to all services) ──────────────────────

export const BaseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  LOG_LEVEL: z.string().optional(),
});

// ─── API Gateway Environment ────────────────────────────────────────

export const GatewayEnvSchema = BaseEnvSchema.extend({
  GATEWAY_PORT: z.coerce.number().int().default(3001),
  API_PORT: z.coerce.number().int().default(3001),
  API_CORS_ORIGIN: z.string().default('http://localhost:3000'),
  AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'none']).default('lax'),
  JWT_SECRET: z.string().min(10),
  IDENTITY_HOST: z.string().default('127.0.0.1'),
  RECRUITING_HOST: z.string().default('127.0.0.1'),
  PROFILES_HOST: z.string().default('127.0.0.1'),
  NOTIFICATION_HOST: z.string().default('127.0.0.1'),
  CV_HOST: z.string().default('127.0.0.1'),
  INTERVIEW_HOST: z.string().default('127.0.0.1'),
  IDENTITY_PORT: z.coerce.number().int().default(3010),
  RECRUITING_PORT: z.coerce.number().int().default(3011),
  PROFILES_PORT: z.coerce.number().int().default(3012),
  NOTIFICATION_PORT: z.coerce.number().int().default(3013),
  CV_PORT: z.coerce.number().int().default(3014),
  INTERVIEW_PORT: z.coerce.number().int().default(3015),
  RATE_LIMIT_TTL: z.coerce.number().int().default(60000),
  RATE_LIMIT_LIMIT: z.coerce.number().int().default(100),
  RATE_LIMIT_AUTH_LIMIT: z.coerce.number().int().default(10),
});

// ─── Identity Service Environment ───────────────────────────────────

export const IdentityEnvSchema = BaseEnvSchema.extend({
  IDENTITY_PORT: z.coerce.number().int().default(3010),
  API_CORS_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default('7d'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_PROJECT_ID: z.string().default(''),
  GOOGLE_OAUTH_REDIRECT_URI: z
    .string()
    .url()
    .default('http://localhost:3001/api/v1/oauth2callback'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().default(1025),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('"Works Recruiter" <noreply@worksrecruiter.com>'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().default(6379),
});

// ─── Recruiting Service Environment ─────────────────────────────────

export const RecruitingEnvSchema = BaseEnvSchema.extend({
  RECRUITING_PORT: z.coerce.number().int().default(3011),
  NOTIFICATION_PORT: z.coerce.number().int().default(3013),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().default(6379),
});

// ─── Profiles Service Environment ───────────────────────────────────

export const ProfilesEnvSchema = BaseEnvSchema.extend({
  PROFILES_PORT: z.coerce.number().int().default(3012),
});

// ─── Notification Service Environment ───────────────────────────────

export const NotificationEnvSchema = BaseEnvSchema.extend({
  NOTIFICATION_PORT: z.coerce.number().int().default(3013),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().default(6379),
});

// ─── Worker Service Environment ─────────────────────────────────────

export const WorkerEnvSchema = BaseEnvSchema.extend({
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().default(1025),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('"Works Recruiter" <noreply@worksrecruiter.com>'),
});

// ─── CV Service Environment ──────────────────────────────────────────

export const CvEnvSchema = BaseEnvSchema.extend({
  CV_PORT: z.coerce.number().int().default(3014),
});

// ─── Interview Service Environment ───────────────────────────────────

export const InterviewEnvSchema = BaseEnvSchema.extend({
  INTERVIEW_PORT: z.coerce.number().int().default(3015),
});

// ─── Types ──────────────────────────────────────────────────────────

export type BaseEnv = z.infer<typeof BaseEnvSchema>;
export type GatewayEnv = z.infer<typeof GatewayEnvSchema>;
export type IdentityEnv = z.infer<typeof IdentityEnvSchema>;
export type RecruitingEnv = z.infer<typeof RecruitingEnvSchema>;
export type ProfilesEnv = z.infer<typeof ProfilesEnvSchema>;
export type NotificationEnv = z.infer<typeof NotificationEnvSchema>;
export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;
export type CvEnv = z.infer<typeof CvEnvSchema>;
export type InterviewEnv = z.infer<typeof InterviewEnvSchema>;

// ─── Config Factory ─────────────────────────────────────────────────

/**
 * Validates the environment configuration against a given Zod schema.
 * Throws a descriptive, multi-line error listing all validation failures if verification fails.
 */
export function loadConfig<T extends z.ZodTypeAny>(
  schema: T,
  env: Record<string, string | undefined> = process.env,
): z.infer<T> {
  const result = schema.safeParse(env);
  if (!result.success) {
    const errorMessages = result.error.errors.map((err) => {
      const path = err.path.join('.');
      return `- ${path}: ${err.message} (received: ${JSON.stringify(env[path])})`;
    });
    throw new Error(`❌ Invalid environment configuration:\n${errorMessages.join('\n')}`);
  }
  return result.data;
}
