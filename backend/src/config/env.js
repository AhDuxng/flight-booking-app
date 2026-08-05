import 'dotenv/config';
import { z } from 'zod';
import { resolveFrontendOrigins } from './frontendOrigins.js';

const booleanFromString = z
  .string()
  .optional()
  .transform((value) => value === 'true');

const corsOriginsSchema = z
  .string()
  .min(1)
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .refine(
    (origins) => origins.every((origin) => URL.canParse(origin)),
    'FRONTEND_URL must contain valid URLs',
  );

const commaSeparatedListSchema = z
  .string()
  .optional()
  .default('')
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );

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
  PAYMENT_CHECKOUT_API_URL: z.string().url().optional().or(z.literal('')).default(''),
  BACKEND_PUBLIC_URL: z.string().url().optional().or(z.literal('')).default(''),
  PAYMENT_WEBHOOK_SECRET: z.string().optional().default(''),
  PAYMENT_RETURN_URL: z.string().url().optional().or(z.literal('')).default(''),
  PAYMENT_CANCEL_URL: z.string().url().optional().or(z.literal('')).default(''),
  PAYMENT_REFUND_API_URL: z.string().url().optional().or(z.literal('')).default(''),
  PAYMENT_REFUND_STATUS_API_URL: z.string().url().optional().or(z.literal('')).default(''),
  PAYMENT_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(10_000),
  PAYMENT_WEBHOOK_REPLAY_WINDOW_SECONDS: z.coerce.number().int().min(30).max(3_600).default(300),
  VNPAY_TMN_CODE: z.string().trim().optional().default(''),
  VNPAY_HASH_SECRET: z.string().trim().optional().default(''),
  VNPAY_PAY_URL: z.string().url().optional().or(z.literal('')).default(''),
  VNPAY_API_URL: z.string().url().optional().or(z.literal('')).default(''),
  VNPAY_RETURN_URL: z.string().url().optional().or(z.literal('')).default(''),
  VNPAY_IPN_URL: z.string().url().optional().or(z.literal('')).default(''),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: booleanFromString,
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default('VietFly <no-reply@vietfly.local>'),
  REDIS_URL: z.string().url().optional().or(z.literal('')).default(''),
  FLIGHT_SEARCH_CACHE_TTL_SECONDS: z.coerce.number().int().min(1).max(300).default(15),
  SEAT_CLEANUP_INTERVAL_MS: z.coerce.number().int().min(30_000).max(900_000).default(60_000),
  SCHEDULE_GENERATION_HORIZON_DAYS: z.coerce.number().int().min(1).max(365).default(90),
  SCHEDULE_GENERATION_INTERVAL_MS: z.coerce.number().int().min(3_600_000).max(604_800_000).default(86_400_000),
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().min(1_000).max(60_000).default(5_000),
  REFUND_RECONCILIATION_INTERVAL_MS: z.coerce.number().int().min(10_000).max(3_600_000).default(60_000),
  INVENTORY_RECONCILIATION_INTERVAL_MS: z.coerce.number().int().min(60_000).max(86_400_000).default(300_000),
  INVENTORY_RECONCILIATION_AUTO_REPAIR: booleanFromString,
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
const { corsOrigins, frontendUrl } = resolveFrontendOrigins({
  configuredOrigins: values.FRONTEND_URL,
  productionOrigins: productionFrontendOrigins,
  nodeEnv: values.NODE_ENV,
});

export const env = {
  nodeEnv: values.NODE_ENV,
  port: values.PORT,
  supabaseUrl: values.SUPABASE_URL,
  supabaseServiceRoleKey: values.SUPABASE_SERVICE_ROLE_KEY,
  supabaseReadUrl: values.SUPABASE_READ_URL,
  supabaseReadServiceRoleKey: values.SUPABASE_READ_SERVICE_ROLE_KEY,
  jwtSecret: values.JWT_SECRET,
  frontendUrl,
  corsOrigins,
  trustProxy: values.TRUST_PROXY,
  bodyLimit: values.BODY_LIMIT,
  rateLimitWindowMs: values.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000,
  authRateLimit: values.AUTH_RATE_LIMIT ?? (values.NODE_ENV === 'production' ? 20 : 100),
  publicRateLimit: values.PUBLIC_RATE_LIMIT ?? (values.NODE_ENV === 'production' ? 100 : 500),
  paymentProviders: values.PAYMENT_PROVIDER,
  paymentSecretKey: values.PAYMENT_SECRET_KEY,
  paymentCheckoutApiUrl: values.PAYMENT_CHECKOUT_API_URL,
  backendPublicUrl: values.BACKEND_PUBLIC_URL,
  paymentWebhookSecret: values.PAYMENT_WEBHOOK_SECRET,
  paymentReturnUrl: values.PAYMENT_RETURN_URL,
  paymentCancelUrl: values.PAYMENT_CANCEL_URL,
  paymentRefundApiUrl: values.PAYMENT_REFUND_API_URL,
  paymentRefundStatusApiUrl: values.PAYMENT_REFUND_STATUS_API_URL,
  paymentRequestTimeoutMs: values.PAYMENT_REQUEST_TIMEOUT_MS,
  paymentWebhookReplayWindowSeconds: values.PAYMENT_WEBHOOK_REPLAY_WINDOW_SECONDS,
  vnpayTmnCode: values.VNPAY_TMN_CODE,
  vnpayHashSecret: values.VNPAY_HASH_SECRET,
  vnpayPayUrl: values.VNPAY_PAY_URL,
  vnpayApiUrl: values.VNPAY_API_URL,
  vnpayReturnUrl: values.VNPAY_RETURN_URL,
  vnpayIpnUrl: values.VNPAY_IPN_URL,
  smtpHost: values.SMTP_HOST,
  smtpPort: values.SMTP_PORT,
  smtpSecure: values.SMTP_SECURE,
  smtpUser: values.SMTP_USER,
  smtpPassword: values.SMTP_PASSWORD,
  smtpFrom: values.SMTP_FROM,
  redisUrl: values.REDIS_URL,
  flightSearchCacheTtlSeconds: values.FLIGHT_SEARCH_CACHE_TTL_SECONDS,
  seatCleanupIntervalMs: values.SEAT_CLEANUP_INTERVAL_MS,
  scheduleGenerationHorizonDays: values.SCHEDULE_GENERATION_HORIZON_DAYS,
  scheduleGenerationIntervalMs: values.SCHEDULE_GENERATION_INTERVAL_MS,
  outboxPollIntervalMs: values.OUTBOX_POLL_INTERVAL_MS,
  refundReconciliationIntervalMs: values.REFUND_RECONCILIATION_INTERVAL_MS,
  inventoryReconciliationIntervalMs: values.INVENTORY_RECONCILIATION_INTERVAL_MS,
  inventoryReconciliationAutoRepair: values.INVENTORY_RECONCILIATION_AUTO_REPAIR,
  geminiApiKeys: values.GEMINI_API_KEYS,
  geminiModel: values.GEMINI_MODEL,
  geminiRequestTimeoutMs: values.GEMINI_REQUEST_TIMEOUT_MS,
};
