import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    full_name: z.string().min(1, 'Full name is required').optional(),
    phone: z.string().optional(),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format').optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    nationality: z.string().optional(),
    passport_number: z.string().optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
});
