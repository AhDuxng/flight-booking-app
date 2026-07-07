import discountService from './discount.service.js';

/**
 * Lấy danh sách mã giảm giá
 */
export const getAll = async (req, res, next) => {
  try {
    const activeOnly = req.query.active === 'true';
    const data = await discountService.getDiscountsService(activeOnly);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Lấy chi tiết mã giảm giá theo ID
 */
export const getById = async (req, res, next) => {
  try {
    const data = await discountService.getDiscountByIdService(req.params.id);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

/**
 * Kiểm tra & áp dụng mã giảm giá
 */
export const apply = async (req, res, next) => {
  try {
    const { code, order_value } = req.body;
    const data = await discountService.applyDiscountService(code, order_value || 0);
    return res.status(200).json({
      success: true,
      message: 'Áp dụng mã giảm giá thành công!',
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

/**
 * Thêm mới mã giảm giá (Admin)
 */
export const create = async (req, res, next) => {
  try {
    const data = await discountService.createDiscountService(req.body);
    return res.status(201).json({
      success: true,
      message: 'Tạo mã giảm giá mới thành công!',
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

/**
 * Cập nhật mã giảm giá (Admin)
 */
export const update = async (req, res, next) => {
  try {
    const data = await discountService.updateDiscountService(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Cập nhật mã giảm giá thành công!',
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

/**
 * Xóa mã giảm giá (Admin)
 */
export const remove = async (req, res, next) => {
  try {
    await discountService.deleteDiscountService(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Xóa mã giảm giá thành công!',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export default {
  getAll,
  getById,
  apply,
  create,
  update,
  remove,
};
