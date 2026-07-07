import { z } from 'zod';

export const createAircraftSchema = {
  body: z.object({
    airline_id: z.string({ required_error: 'ID hãng hàng không là bắt buộc' }).uuid('ID hãng bay phải là UUID hợp lệ'),
    code: z.string({ required_error: 'Mã máy bay là bắt buộc' }).trim().min(2, 'Mã máy bay tối thiểu 2 ký tự').toUpperCase(),
    model: z.string({ required_error: 'Dòng máy bay (model) là bắt buộc' }).trim().min(2, 'Tên model tối thiểu 2 ký tự'),
    total_seats: z.number({ required_error: 'Tổng số ghế là bắt buộc', invalid_type_error: 'Tổng số ghế phải là số' }).int().positive('Tổng số ghế phải lớn hơn 0'),
  }),
};

export const updateAircraftSchema = {
  params: z.object({
    id: z.string({ required_error: 'ID máy bay là bắt buộc' }).uuid('ID máy bay phải là UUID hợp lệ'),
  }),
  body: z.object({
    airline_id: z.string().uuid('ID hãng bay phải là UUID hợp lệ').optional(),
    code: z.string().trim().min(2, 'Mã máy bay tối thiểu 2 ký tự').toUpperCase().optional(),
    model: z.string().trim().min(2, 'Tên model tối thiểu 2 ký tự').optional(),
    total_seats: z.number({ invalid_type_error: 'Tổng số ghế phải là số' }).int().positive('Tổng số ghế phải lớn hơn 0').optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'Cần cung cấp ít nhất một trường để cập nhật',
  }),
};

export const getAircraftByIdSchema = {
  params: z.object({
    id: z.string({ required_error: 'ID máy bay là bắt buộc' }).uuid('ID máy bay phải là UUID hợp lệ'),
  }),
};

export default {
  createAircraftSchema,
  updateAircraftSchema,
  getAircraftByIdSchema,
};
