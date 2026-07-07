import { z } from 'zod';

/**
 * Schema xác thực phân trang khi lấy danh sách user
 */
export const getUsersSchema = {
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  }),
};

/**
 * Schema xác thực cập nhật trạng thái người dùng
 */
export const updateUserSchema = {
  params: z.object({
    id: z.string({ required_error: 'ID người dùng là bắt buộc' }).uuid('ID người dùng phải là UUID hợp lệ'),
  }),
  body: z.object({
    role: z.enum(['admin', 'user', 'staff'], { error_map: () => ({ message: 'Quyền (role) không hợp lệ' }) }).optional(),
    is_active: z.boolean({ invalid_type_error: 'is_active phải là kiểu boolean' }).optional(),
  }).refine((data) => data.role !== undefined || data.is_active !== undefined, {
    message: 'Cần cung cấp ít nhất một trường để cập nhật (role hoặc is_active)',
  }),
};

export default {
  getUsersSchema,
  updateUserSchema,
};
