import { z } from 'zod';
/**
 * Typed environment validation.
 * Validates at startup — fail fast if config is missing.
 */
declare const ApiEnvSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    DATABASE_URL: z.ZodString;
    REDIS_HOST: z.ZodDefault<z.ZodString>;
    REDIS_PORT: z.ZodDefault<z.ZodNumber>;
    API_PORT: z.ZodDefault<z.ZodNumber>;
    API_CORS_ORIGIN: z.ZodDefault<z.ZodString>;
    JWT_SECRET: z.ZodString;
    JWT_EXPIRES_IN: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    DATABASE_URL: string;
    REDIS_HOST: string;
    REDIS_PORT: number;
    API_PORT: number;
    API_CORS_ORIGIN: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
}, {
    DATABASE_URL: string;
    JWT_SECRET: string;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    REDIS_HOST?: string | undefined;
    REDIS_PORT?: number | undefined;
    API_PORT?: number | undefined;
    API_CORS_ORIGIN?: string | undefined;
    JWT_EXPIRES_IN?: string | undefined;
}>;
export type ApiEnv = z.infer<typeof ApiEnvSchema>;
export declare function validateApiEnv(env?: Record<string, string | undefined>): ApiEnv;
declare const WorkerEnvSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    DATABASE_URL: z.ZodString;
    REDIS_HOST: z.ZodDefault<z.ZodString>;
    REDIS_PORT: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    DATABASE_URL: string;
    REDIS_HOST: string;
    REDIS_PORT: number;
}, {
    DATABASE_URL: string;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    REDIS_HOST?: string | undefined;
    REDIS_PORT?: number | undefined;
}>;
export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;
export declare function validateWorkerEnv(env?: Record<string, string | undefined>): WorkerEnv;
declare const WebEnvSchema: z.ZodObject<{
    NEXT_PUBLIC_API_URL: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NEXT_PUBLIC_API_URL: string;
}, {
    NEXT_PUBLIC_API_URL?: string | undefined;
}>;
export type WebEnv = z.infer<typeof WebEnvSchema>;
export declare function validateWebEnv(env?: Record<string, string | undefined>): WebEnv;
export {};
//# sourceMappingURL=index.d.ts.map