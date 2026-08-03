import { z } from 'zod';

const emailSchema = z.string().trim().email().max(254).toLowerCase();
const passwordSchema = z.string().min(8).max(72);

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(2).max(100),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const refreshSessionSchema = z.object({
  refreshToken: z.string().trim().min(1).max(4096),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  accessToken: z.string().trim().min(1).max(4096),
  password: passwordSchema,
});

export const oauthProviderParamsSchema = z.object({
  provider: z.enum(['google', 'facebook']),
});
