"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webEnvSchema = exports.apiEnvSchema = void 0;
const zod_1 = require("zod");
exports.apiEnvSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('3001'),
    DATABASE_URL: zod_1.z.string().default('postgresql://postgres:postgres@localhost:5432/payment_verification?schema=public'),
    JWT_ACCESS_SECRET: zod_1.z.string().default('super-secret-access-token-key-change-in-prod'),
    JWT_REFRESH_SECRET: zod_1.z.string().default('super-secret-refresh-token-key-change-in-prod'),
    JWT_EXPIRES_IN: zod_1.z.string().default('1d'),
    VERIFY_ET_API_KEY: zod_1.z.string().default('mock-verify-et-api-key'),
    VERIFY_ET_BASE_URL: zod_1.z.string().default('https://verify.et'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development')
});
exports.webEnvSchema = zod_1.z.object({
    NEXT_PUBLIC_API_URL: zod_1.z.string().default('http://localhost:3001/api/v1')
});
