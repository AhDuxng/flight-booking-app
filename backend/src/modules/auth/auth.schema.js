import { z } from 'zod';

/**
 * Schema xác thực dữ liệu đăng ký tài khoản mới
 */
export const registerSchema = {
  body: z.object({
    email: z
      .string({ required_error: 'Email là bắt buộc' })
      .email('Địa chỉ email không hợp lệ')
      .trim()
      .toLowerCase(),
    password: z
      .string({ required_error: 'Mật khẩu là bắt buộc' })
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
      .max(50, 'Mật khẩu không được vượt quá 50 ký tự'),
    full_name: z
      .string({ required_error: 'Họ và tên là bắt buộc' })
      .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
      .max(100, 'Họ và tên không được vượt quá 100 ký tự')
      .trim(),
    phone: z
      .string()
      .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ (chuẩn Việt Nam)')
      .optional()
      .or(z.literal('')),
  }),
};

/**
 * Schema xác thực dữ liệu đăng nhập
 */
export const loginSchema = {
  body: z.object({
    email: z
      .string({ required_error: 'Email là bắt buộc' })
      .email('Địa chỉ email không hợp lệ')
      .trim()
      .toLowerCase(),
    password: z
      .string({ required_error: 'Mật khẩu là bắt buộc' })
      .min(1, 'Vui lòng nhập mật khẩu'),
  }),
};

/**
 * Schema xác thực làm mới token (khi gửi qua body nếu không dùng cookie)
 */
export const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().optional(), // Có thể gửi qua body hoặc cookie
  }),
};

/**
 * Schema xác thực đổi mật khẩu
 */
export const changePasswordSchema = {
  body: z.object({
    oldPassword: z.string({ required_error: 'Mật khẩu cũ là bắt buộc' }).min(1, 'Vui lòng nhập mật khẩu cũ'),
    newPassword: z
      .string({ required_error: 'Mật khẩu mới là bắt buộc' })
      .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  }).refine((data) => data.oldPassword !== data.newPassword, {
    message: 'Mật khẩu mới không được trùng với mật khẩu cũ',
    path: ['newPassword'],
  }),
};

export default {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
};
