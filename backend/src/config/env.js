import "dotenv/config";

const requiredEnv = ["PORT", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET", "FRONTEND_URL"];

for (const envKey of requiredEnv) {
    if (!process.env[envKey]) {
        throw new Error(`Missing required environment variable: ${envKey}`);
    }
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  jwtSecret: process.env.JWT_SECRET,
  frontendUrl: process.env.FRONTEND_URL,
  paymentProvider: process.env.PAYMENT_PROVIDER || '',
  paymentSecretKey: process.env.PAYMENT_SECRET_KEY || '',
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || '',
  paymentReturnUrl: process.env.PAYMENT_RETURN_URL || '',
  paymentCancelUrl: process.env.PAYMENT_CANCEL_URL || '',
};