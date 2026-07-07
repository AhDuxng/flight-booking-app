import { z } from 'zod';

const passengerSchema = z.object({
  first_name: z.string({ required_error: 'Tên hành khách là bắt buộc' }).trim().min(1, 'Vui lòng nhập tên hành khách'),
  last_name: z.string({ required_error: 'Họ hành khách là bắt buộc' }).trim().min(1, 'Vui lòng nhập họ hành khách'),
  date_of_birth: z.string({ required_error: 'Ngày sinh là bắt buộc' }),
  gender: z.enum(['male', 'female', 'other'], { error_map: () => ({ message: 'Giới tính không hợp lệ' }) }),
  nationality: z.string({ required_error: 'Quốc tịch là bắt buộc' }).trim().min(2, 'Quốc tịch không hợp lệ'),
  passport_number: z.string().trim().optional(),
  passenger_type: z.enum(['adult', 'child', 'infant']).optional().default('adult'),
});

export const createBookingSchema = {
  body: z.object({
    flight_id: z.string({ required_error: 'ID chuyến bay là bắt buộc' }).uuid('ID chuyến bay phải là UUID hợp lệ'),
    passengers: z.array(passengerSchema).min(1, 'Phải có ít nhất 1 hành khách trong đơn đặt vé'),
    contact_email: z.string({ required_error: 'Email liên hệ là bắt buộc' }).email('Email không hợp lệ').trim().toLowerCase(),
    contact_phone: z.string({ required_error: 'Số điện thoại liên hệ là bắt buộc' }).trim(),
    notes: z.string().trim().optional(),
    total_price: z.number().nonnegative().optional(),
    price_snapshot: z.number().nonnegative().optional(),
  }),
};

export const getByIdSchema = {
  params: z.object({
    id: z.string({ required_error: 'ID đơn vé là bắt buộc' }).uuid('ID đơn vé phải là UUID hợp lệ'),
  }),
};

export const updateStatusSchema = {
  params: z.object({
    id: z.string({ required_error: 'ID đơn vé là bắt buộc' }).uuid('ID đơn vé phải là UUID hợp lệ'),
  }),
  body: z.object({
    status: z.enum(['pending', 'paid', 'confirmed', 'cancelled', 'refund_pending', 'refunded'], {
      error_map: () => ({ message: 'Trạng thái đơn vé không hợp lệ' }),
    }),
  }),
};

export default {
  createBookingSchema,
  getByIdSchema,
  updateStatusSchema,
};
