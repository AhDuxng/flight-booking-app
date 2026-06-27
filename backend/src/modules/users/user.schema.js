import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().min(1, 'Full name cannot be empty').optional(),
    phone: z.string().optional(),
    avatar_url: z.string().url('Avatar URL must be a valid URL').optional().nullable(),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format').optional().nullable(),
    gender: z.enum(['male', 'female', 'other']).optional().nullable(),
    nationality: z.string().optional().nullable(),
    passport_number: z.string().optional().nullable()
  })
});
