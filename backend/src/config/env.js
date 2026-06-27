import 'dotenv/config';
import { z } from 'zod';

const booleanFromString = z
  .string()
  .optional()
  .transform((value) => value === 'true');

const corsOriginsSchema = z
  .string()
  .min(1)
  .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean))
  .refine(
    (origins) => origins.every((origin) => URL.canParse(origin)),
    'FRONTEND_URL must contain valid URLs',
  );

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  FRONTEND_URL: corsOriginsSchema,
  TRUST_PROXY: booleanFromString,
  BODY_LIMIT: z.string().min(1).default('100kb'),
  PAYMENT_PROVIDER: z.string().optional().default(''),
  PAYMENT_SECRET_KEY: z.string().optional().default(''),
  PAYMENT_WEBHOOK_SECRET: z.string().optional().default(''),
  PAYMENT_RETURN_URL: z.string().url().optional().or(z.literal('')).default(''),
  PAYMENT_CANCEL_URL: z.string().url().optional().or(z.literal('')).default(''),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const missing = parsedEnv.error.issues.map((issue) => issue.message).join(', ');
  throw new Error(`Invalid environment configuration: ${missing}`);
}

const values = parsedEnv.data;

export const env = {
  nodeEnv: values.NODE_ENV,
  port: values.PORT,
  supabaseUrl: values.SUPABASE_URL,
  supabaseServiceRoleKey: values.SUPABASE_SERVICE_ROLE_KEY,
  jwtSecret: values.JWT_SECRET,
  frontendUrl: values.FRONTEND_URL[0],
  corsOrigins: values.FRONTEND_URL,
  trustProxy: values.TRUST_PROXY,
  bodyLimit: values.BODY_LIMIT,
  paymentProvider: values.PAYMENT_PROVIDER,
  paymentSecretKey: values.PAYMENT_SECRET_KEY,
  paymentWebhookSecret: values.PAYMENT_WEBHOOK_SECRET,
  paymentReturnUrl: values.PAYMENT_RETURN_URL,
  paymentCancelUrl: values.PAYMENT_CANCEL_URL,
};
