import { z } from 'zod';

export const createAirportSchema = {
  body: z.object({
    code: z.string({ required_error: 'Mã sân bay (IATA) là bắt buộc' }).trim().length(3, 'Mã IATA phải đúng 3 ký tự').toUpperCase(),
    name: z.string({ required_error: 'Tên sân bay là bắt buộc' }).trim().min(3, 'Tên sân bay tối thiểu 3 ký tự'),
    city: z.string({ required_error: 'Thành phố là bắt buộc' }).trim().min(2, 'Tên thành phố tối thiểu 2 ký tự'),
    country: z.string({ required_error: 'Quốc gia là bắt buộc' }).trim().min(2, 'Tên quốc gia tối thiểu 2 ký tự'),
    timezone: z.string().trim().optional().default('Asia/Ho_Chi_Minh'),
  }),
};

export const updateAirportSchema = {
  params: z.object({
    id: z.string({ required_error: 'ID sân bay là bắt buộc' }).uuid('ID sân bay phải là UUID hợp lệ'),
  }),
  body: z.object({
    code: z.string().trim().length(3, 'Mã IATA phải đúng 3 ký tự').toUpperCase().optional(),
    name: z.string().trim().min(3, 'Tên sân bay tối thiểu 3 ký tự').optional(),
    city: z.string().trim().min(2, 'Tên thành phố tối thiểu 2 ký tự').optional(),
    country: z.string().trim().min(2, 'Tên quốc gia tối thiểu 2 ký tự').optional(),
    timezone: z.string().trim().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'Cần cung cấp ít nhất một trường để cập nhật',
  }),
};

export const getAirportByIdSchema = {
  params: z.object({
    id: z.string({ required_error: 'ID sân bay là bắt buộc' }).uuid('ID sân bay phải là UUID hợp lệ'),
  }),
};

export default {
  createAirportSchema,
  updateAirportSchema,
  getAirportByIdSchema,
};
