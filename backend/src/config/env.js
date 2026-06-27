import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  PAYMENT_PROVIDER: z.string().optional().default('cash'),
  PAYMENT_SECRET_KEY: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  PAYMENT_RETURN_URL: z.string().url().optional(),
  PAYMENT_CANCEL_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export default env;
