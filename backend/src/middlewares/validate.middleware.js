import { ZodError } from 'zod';

/**
 * Middleware kiểm tra dữ liệu đầu vào (body, query, params) sử dụng Zod schema
 * @param {object} schema - Đối tượng Zod schema chứa { body, query, params }
 */
export const validate = (schema) => async (req, res, next) => {
  try {
    if (schema.body) {
      req.body = await schema.body.parseAsync(req.body);
    }
    if (schema.query) {
      req.query = await schema.query.parseAsync(req.query);
    }
    if (schema.params) {
      req.params = await schema.params.parseAsync(req.params);
    }
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: formattedErrors,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ khi xác thực dữ liệu',
    });
  }
};

export default validate;
