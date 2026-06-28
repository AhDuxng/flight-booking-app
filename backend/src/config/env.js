import dotenv from 'dotenv';
import { z } from 'zod';

// Nạp biến môi trường từ file .env
dotenv.config();

// Định nghĩa schema xác thực cho các biến môi trường
const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url('SUPABASE_URL phải là một URL hợp lệ').default('https://placeholder.supabase.co'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('placeholder_key'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET phải có ít nhất 10 ký tự').default('default_jwt_secret_key_for_access_token_dev'),
  REFRESH_TOKEN_SECRET: z.string().min(10, 'REFRESH_TOKEN_SECRET phải có ít nhất 10 ký tự').default('default_refresh_token_secret_key_for_dev_only'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'), // Thời hạn Access Token ngắn hạn (15 phút)
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'), // Thời hạn Refresh Token dài hạn (7 ngày)
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

// Xác thực và phân tích biến môi trường
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Lỗi cấu hình biến môi trường (.env):');
    console.error(JSON.stringify(result.error.format(), null, 2));
  }

  return result.success ? result.data : envSchema.parse({});
};

export const env = parseEnv();
export default env;
