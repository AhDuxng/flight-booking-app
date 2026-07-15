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
