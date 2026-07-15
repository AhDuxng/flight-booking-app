import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(8).max(20).nullable().optional(),
  dateOfBirth: z.string().date().nullable().optional(),
  gender: z.enum(['male', 'female', 'other']).nullable().optional(),
  nationality: z.string().trim().min(2).max(100).nullable().optional(),
  passportNumber: z.string().trim().min(4).max(30).nullable().optional(),
}).refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required',
);
