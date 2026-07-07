import { z } from 'zod';

export const applyDiscountSchema = {
  body: z.object({
    code: z.string({ required_error: 'Vui lòng nhập mã giảm giá' }).trim().min(2, 'Mã giảm giá không hợp lệ').toUpperCase(),
    order_value: z.number({ invalid_type_error: 'Giá trị đơn hàng phải là con số' }).nonnegative('Giá trị đơn hàng không được âm').optional().default(0),
  }),
};

export const createDiscountSchema = {
  body: z.object({
    code: z.string({ required_error: 'Mã voucher là bắt buộc' }).trim().min(3, 'Mã voucher tối thiểu 3 ký tự').toUpperCase(),
    description: z.string().trim().optional(),
    discount_type: z.enum(['percentage', 'fixed'], { error_map: () => ({ message: 'Loại giảm giá phải là percentage hoặc fixed' }) }),
    discount_value: z.number({ required_error: 'Giá trị giảm là bắt buộc' }).positive('Giá trị giảm phải lớn hơn 0'),
    min_order_value: z.number().nonnegative().optional().default(0),
    max_discount: z.number().nonnegative().optional(),
    max_uses: z.number().int().positive().optional(),
    start_date: z.string({ required_error: 'Ngày bắt đầu là bắt buộc' }),
    end_date: z.string({ required_error: 'Ngày kết thúc là bắt buộc' }),
    is_active: z.boolean().optional().default(true),
    applicable_to: z.enum(['all', 'flight', 'baggage', 'meal']).optional().default('all'),
  }).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    message: 'Ngày kết thúc phải lớn hơn ngày bắt đầu',
    path: ['end_date'],
  }).refine((data) => data.discount_type !== 'percentage' || data.discount_value <= 100, {
    message: 'Nếu giảm theo phần trăm thì giá trị không được vượt quá 100%',
    path: ['discount_value'],
  }),
};

export const updateDiscountSchema = {
  params: z.object({
    id: z.string({ required_error: 'ID mã giảm giá là bắt buộc' }).uuid('ID phải là UUID hợp lệ'),
  }),
  body: z.object({
    code: z.string().trim().min(3, 'Mã voucher tối thiểu 3 ký tự').toUpperCase().optional(),
    description: z.string().trim().optional(),
    discount_type: z.enum(['percentage', 'fixed']).optional(),
    discount_value: z.number().positive().optional(),
    min_order_value: z.number().nonnegative().optional(),
    max_discount: z.number().nonnegative().optional(),
    max_uses: z.number().int().positive().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    is_active: z.boolean().optional(),
    applicable_to: z.enum(['all', 'flight', 'baggage', 'meal']).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'Cần cung cấp ít nhất một trường để cập nhật',
  }),
};

export const getByIdSchema = {
  params: z.object({
    id: z.string({ required_error: 'ID mã giảm giá là bắt buộc' }).uuid('ID phải là UUID hợp lệ'),
  }),
};

export default {
  applyDiscountSchema,
  createDiscountSchema,
  updateDiscountSchema,
  getByIdSchema,
};
