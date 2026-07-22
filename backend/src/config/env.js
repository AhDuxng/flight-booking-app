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

const commaSeparatedListSchema = z
  .string()
  .optional()
  .default('')
  .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean));

const optionalStringWithDefault = (fallback) =>
  z
    .string()
    .optional()
    .default(fallback)
    .transform((value) => value.trim() || fallback);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_READ_URL: z.string().url().optional().or(z.literal('')).default(''),
  SUPABASE_READ_SERVICE_ROLE_KEY: z.string().optional().default(''),
  JWT_SECRET: z.string().min(32),
  FRONTEND_URL: corsOriginsSchema,
  TRUST_PROXY: booleanFromString,
  BODY_LIMIT: z.string().min(1).default('100kb'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(60_000).max(86_400_000).optional(),
  AUTH_RATE_LIMIT: z.coerce.number().int().min(1).max(10_000).optional(),
  PUBLIC_RATE_LIMIT: z.coerce.number().int().min(1).max(10_000).optional(),
  PAYMENT_PROVIDER: commaSeparatedListSchema,
  PAYMENT_SECRET_KEY: z.string().optional().default(''),
  PAYMENT_WEBHOOK_SECRET: z.string().optional().default(''),
  PAYMENT_RETURN_URL: z.string().url().optional().or(z.literal('')).default(''),
  PAYMENT_CANCEL_URL: z.string().url().optional().or(z.literal('')).default(''),
  REDIS_URL: z.string().url().optional().or(z.literal('')).default(''),
  FLIGHT_SEARCH_CACHE_TTL_SECONDS: z.coerce.number().int().min(1).max(300).default(15),
  SEAT_CLEANUP_INTERVAL_MS: z.coerce.number().int().min(30_000).max(900_000).default(60_000),
  GEMINI_API_KEYS: commaSeparatedListSchema,
  GEMINI_MODEL: optionalStringWithDefault('gemini-flash-lite-latest'),
  GEMINI_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(15_000),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const missing = parsedEnv.error.issues.map((issue) => issue.message).join(', ');
  throw new Error(`Invalid environment configuration: ${missing}`);
}

const values = parsedEnv.data;
const productionFrontendOrigins = ['https://vietfly.netlify.app'];
const corsOrigins = [...new Set([...values.FRONTEND_URL, ...productionFrontendOrigins])];

export const env = {
  nodeEnv: values.NODE_ENV,
  port: values.PORT,
  supabaseUrl: values.SUPABASE_URL,
  supabaseServiceRoleKey: values.SUPABASE_SERVICE_ROLE_KEY,
  supabaseReadUrl: values.SUPABASE_READ_URL,
  supabaseReadServiceRoleKey: values.SUPABASE_READ_SERVICE_ROLE_KEY,
  jwtSecret: values.JWT_SECRET,
  frontendUrl: corsOrigins[0],
  corsOrigins,
  trustProxy: values.TRUST_PROXY,
  bodyLimit: values.BODY_LIMIT,
  rateLimitWindowMs: values.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000,
  authRateLimit: values.AUTH_RATE_LIMIT ?? (values.NODE_ENV === 'production' ? 20 : 100),
  publicRateLimit: values.PUBLIC_RATE_LIMIT ?? (values.NODE_ENV === 'production' ? 100 : 500),
  paymentProviders: values.PAYMENT_PROVIDER,
  paymentSecretKey: values.PAYMENT_SECRET_KEY,
  paymentWebhookSecret: values.PAYMENT_WEBHOOK_SECRET,
  paymentReturnUrl: values.PAYMENT_RETURN_URL,
  paymentCancelUrl: values.PAYMENT_CANCEL_URL,
  redisUrl: values.REDIS_URL,
  flightSearchCacheTtlSeconds: values.FLIGHT_SEARCH_CACHE_TTL_SECONDS,
  seatCleanupIntervalMs: values.SEAT_CLEANUP_INTERVAL_MS,
  geminiApiKeys: values.GEMINI_API_KEYS,
  geminiModel: values.GEMINI_MODEL,
  geminiRequestTimeoutMs: values.GEMINI_REQUEST_TIMEOUT_MS,
};
