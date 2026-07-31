import { z } from 'zod';
export declare const apiEnvSchema: z.ZodObject<{
    PORT: z.ZodDefault<z.ZodString>;
    DATABASE_URL: z.ZodDefault<z.ZodString>;
    JWT_ACCESS_SECRET: z.ZodDefault<z.ZodString>;
    JWT_REFRESH_SECRET: z.ZodDefault<z.ZodString>;
    JWT_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    VERIFY_ET_API_KEY: z.ZodDefault<z.ZodString>;
    VERIFY_ET_BASE_URL: z.ZodDefault<z.ZodString>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
}, "strip", z.ZodTypeAny, {
    PORT: string;
    DATABASE_URL: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_EXPIRES_IN: string;
    VERIFY_ET_API_KEY: string;
    VERIFY_ET_BASE_URL: string;
    NODE_ENV: "development" | "production" | "test";
}, {
    PORT?: string | undefined;
    DATABASE_URL?: string | undefined;
    JWT_ACCESS_SECRET?: string | undefined;
    JWT_REFRESH_SECRET?: string | undefined;
    JWT_EXPIRES_IN?: string | undefined;
    VERIFY_ET_API_KEY?: string | undefined;
    VERIFY_ET_BASE_URL?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
}>;
export declare const webEnvSchema: z.ZodObject<{
    NEXT_PUBLIC_API_URL: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NEXT_PUBLIC_API_URL: string;
}, {
    NEXT_PUBLIC_API_URL?: string | undefined;
}>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
