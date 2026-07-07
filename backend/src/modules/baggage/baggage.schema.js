import { z } from 'zod';

export const createBaggageSchema = {
  body: z.object({
    flight_id: z.string({ required_error: 'ID chuyến bay là bắt buộc' }).uuid('ID chuyến bay phải là UUID hợp lệ'),
    weight_kg: z.number({ required_error: 'Trọng lượng (kg) là bắt buộc', invalid_type_error: 'Trọng lượng phải là số' }).int().positive('Trọng lượng phải lớn hơn 0'),
    price: z.number({ required_error: 'Giá tiền là bắt buộc', invalid_type_error: 'Giá tiền phải là số' }).nonnegative('Giá tiền không được âm'),
    description: z.string().trim().optional(),
    is_available: z.boolean().optional().default(true),
  }),
};

export const updateBaggageSchema = {
  params: z.object({
    id: z.string({ required_error: 'ID gói hành lý là bắt buộc' }).uuid('ID gói hành lý phải là UUID hợp lệ'),
  }),
  body: z.object({
    flight_id: z.string().uuid('ID chuyến bay phải là UUID hợp lệ').optional(),
    weight_kg: z.number({ invalid_type_error: 'Trọng lượng phải là số' }).int().positive('Trọng lượng phải lớn hơn 0').optional(),
    price: z.number({ invalid_type_error: 'Giá tiền phải là số' }).nonnegative('Giá tiền không được âm').optional(),
    description: z.string().trim().optional(),
    is_available: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'Cần cung cấp ít nhất một trường để cập nhật',
  }),
};

export const getByFlightIdSchema = {
  params: z.object({
    flightId: z.string({ required_error: 'ID chuyến bay là bắt buộc' }).uuid('ID chuyến bay phải là UUID hợp lệ'),
  }),
};

export const getByIdSchema = {
  params: z.object({
    id: z.string({ required_error: 'ID gói hành lý là bắt buộc' }).uuid('ID gói hành lý phải là UUID hợp lệ'),
  }),
};

export default {
  createBaggageSchema,
  updateBaggageSchema,
  getByFlightIdSchema,
  getByIdSchema,
};
