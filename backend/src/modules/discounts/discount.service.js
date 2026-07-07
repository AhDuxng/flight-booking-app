import discountQueries from './discount.queries.js';

/**
 * Lấy danh sách mã giảm giá
 */
export const getDiscountsService = async (activeOnly = false) => {
  return await discountQueries.getAllDiscounts(activeOnly);
};

/**
 * Lấy chi tiết mã giảm giá theo ID
 */
export const getDiscountByIdService = async (id) => {
  const discount = await discountQueries.getDiscountById(id);
  if (!discount) {
    const error = new Error('Không tìm thấy thông tin mã giảm giá.');
    error.statusCode = 404;
    throw error;
  }
  return discount;
};

/**
 * Kiểm tra và áp dụng mã giảm giá (Validate & Calculate Voucher)
 * Hàm này có thể gọi khi khách hàng bấm nút "Áp dụng mã" ở bước thanh toán
 */
export const applyDiscountService = async (code, orderValue = 0) => {
  const discount = await discountQueries.getDiscountByCode(code);
  if (!discount) {
    const error = new Error('Mã giảm giá không tồn tại.');
    error.statusCode = 404;
    throw error;
  }

  // 1. Kiểm tra trạng thái kích hoạt
  if (!discount.is_active) {
    const error = new Error('Mã giảm giá này đang bị tạm khóa hoặc không hoạt động.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Kiểm tra thời hạn sử dụng
  const now = new Date();
  const startDate = new Date(discount.start_date);
  const endDate = new Date(discount.end_date);

  if (now < startDate) {
    const error = new Error('Mã giảm giá chưa đến thời gian áp dụng.');
    error.statusCode = 400;
    throw error;
  }

  if (now > endDate) {
    const error = new Error('Mã giảm giá đã hết hạn sử dụng.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Kiểm tra số lượt sử dụng tối đa
  if (discount.max_uses && discount.used_count >= discount.max_uses) {
    const error = new Error('Mã giảm giá đã hết lượt sử dụng.');
    error.statusCode = 400;
    throw error;
  }

  // 4. Kiểm tra giá trị đơn hàng tối thiểu
  if (orderValue < discount.min_order_value) {
    const error = new Error(`Đơn hàng cần đạt giá trị tối thiểu ${discount.min_order_value.toLocaleString('vi-VN')} VNĐ để sử dụng mã này.`);
    error.statusCode = 400;
    throw error;
  }

  // 5. Tính toán số tiền được giảm
  let discountAmount = 0;
  if (discount.discount_type === 'percentage') {
    discountAmount = (orderValue * Number(discount.discount_value)) / 100;
    // Nếu có giới hạn số tiền giảm tối đa (max_discount)
    if (discount.max_discount && discountAmount > discount.max_discount) {
      discountAmount = Number(discount.max_discount);
    }
  } else {
    // Giảm tiền mặt cố định
    discountAmount = Number(discount.discount_value);
  }

  // Không được giảm vượt quá tổng giá trị đơn hàng
  if (discountAmount > orderValue) {
    discountAmount = orderValue;
  }

  return {
    ...discount,
    calculated_discount: discountAmount,
    final_order_value: orderValue - discountAmount,
  };
};

/**
 * Thêm mới mã giảm giá (Admin)
 */
export const createDiscountService = async (data) => {
  const existing = await discountQueries.getDiscountByCode(data.code);
  if (existing) {
    const error = new Error('Mã giảm giá (code) này đã tồn tại trong hệ thống.');
    error.statusCode = 400;
    throw error;
  }
  return await discountQueries.createDiscount(data);
};

/**
 * Cập nhật mã giảm giá (Admin)
 */
export const updateDiscountService = async (id, updates) => {
  await getDiscountByIdService(id);
  if (updates.code) {
    const existing = await discountQueries.getDiscountByCode(updates.code);
    if (existing && existing.id !== id) {
      const error = new Error('Mã giảm giá (code) này đã bị trùng với voucher khác.');
      error.statusCode = 400;
      throw error;
    }
  }
  return await discountQueries.updateDiscount(id, updates);
};

/**
 * Xóa mã giảm giá (Admin)
 */
export const deleteDiscountService = async (id) => {
  await getDiscountByIdService(id);
  return await discountQueries.deleteDiscount(id);
};

export default {
  getDiscountsService,
  getDiscountByIdService,
  applyDiscountService,
  createDiscountService,
  updateDiscountService,
  deleteDiscountService,
};
