import { z } from 'zod';

export const apiEnvSchema = z.object({
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/payment_verification?schema=public'),
  JWT_ACCESS_SECRET: z.string().default('super-secret-access-token-key-change-in-prod'),
  JWT_REFRESH_SECRET: z.string().default('super-secret-refresh-token-key-change-in-prod'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  VERIFY_ET_API_KEY: z.string().default('mock-verify-et-api-key'),
  VERIFY_ET_BASE_URL: z.string().default('https://verify.et'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

export const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().default('http://localhost:3001/api/v1')
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
