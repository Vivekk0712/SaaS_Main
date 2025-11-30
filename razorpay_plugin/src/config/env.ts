import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  RAZORPAY_KEY_ID: z.string().min(1, 'Razorpay Key ID is required'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'Razorpay Key Secret is required'),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, 'Razorpay Webhook Secret is required'),
  PORT: z.string().default('5002'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('3306'),
  DB_USER: z.string().min(1, 'Database user is required'),
  DB_PASSWORD: z.string().min(1, 'Database password is required'),
  DB_NAME: z.string().min(1, 'Database name is required'),
  FRONTEND_URL: z.string().url(),
  BACKEND_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Environment validation failed:');
    console.error(result.error.format());
    throw new Error('Invalid environment configuration');
  }
  
  return result.data;
}

export const env = loadEnv();
