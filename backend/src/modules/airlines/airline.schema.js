import { z } from 'zod';

export const createAirlineSchema = {
  body: z.object({
    code: z.string({ required_error: 'Mã hãng bay là bắt buộc' }).trim().min(2, 'Mã hãng bay tối thiểu 2 ký tự').toUpperCase(),
    name: z.string({ required_error: 'Tên hãng bay là bắt buộc' }).trim().min(2, 'Tên hãng tối thiểu 2 ký tự'),
    logo_url: z.string().url('URL logo không hợp lệ').optional().or(z.literal('')),
    country: z.string().trim().optional(),
    is_active: z.boolean().optional().default(true),
  }),
};

export const updateAirlineSchema = {
  params: z.object({
    id: z.string({ required_error: 'ID hãng bay là bắt buộc' }).uuid('ID hãng bay phải là UUID hợp lệ'),
  }),
  body: z.object({
    code: z.string().trim().min(2, 'Mã hãng bay tối thiểu 2 ký tự').toUpperCase().optional(),
    name: z.string().trim().min(2, 'Tên hãng tối thiểu 2 ký tự').optional(),
    logo_url: z.string().url('URL logo không hợp lệ').optional().or(z.literal('')),
    country: z.string().trim().optional(),
    is_active: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'Cần cung cấp ít nhất một trường để cập nhật',
  }),
};

export const getAirlineByIdSchema = {
  params: z.object({
    id: z.string({ required_error: 'ID hãng bay là bắt buộc' }).uuid('ID hãng bay phải là UUID hợp lệ'),
  }),
};

export default {
  createAirlineSchema,
  updateAirlineSchema,
  getAirlineByIdSchema,
};
