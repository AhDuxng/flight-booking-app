import * as discountQueries from './discount.queries.js';
import { createHttpError } from '../../utils/error.js';
import { calculateDiscountAmount } from './discount.calculator.js';

export const getActiveDiscounts = async () => {
  return discountQueries.findActive();
};

const toDiscountPreview = (discount, orderValue) => {
  const discountAmount = calculateDiscountAmount(discount, orderValue);
  return {
    code: discount.code,
    description: discount.description,
    discountAmount,
    discountId: discount.id,
    finalAmount: Math.max(0, Number(orderValue) - discountAmount),
    orderValue: Number(orderValue),
  };
};

export const getEligibleDiscounts = async ({ flightId, orderValue }) => {
  const [flight, discounts] = await Promise.all([
    discountQueries.findFlight(flightId),
    discountQueries.findActive(),
  ]);
  if (
    !flight ||
    !['scheduled', 'delayed'].includes(flight.status) ||
    new Date(flight.departure_time) <= new Date()
  ) {
    return [];
  }
  return discounts
    .filter(
      (discount) =>
        ['all', 'flight'].includes(discount.applicable_to) &&
        (discount.max_uses == null || Number(discount.used_count) < Number(discount.max_uses)) &&
        Number(orderValue) >= Number(discount.min_order_value),
    )
    .map((discount) => toDiscountPreview(discount, orderValue))
    .sort((left, right) => right.discountAmount - left.discountAmount);
};

export const validateDiscount = async ({ code, orderValue }) => {
  const discount = await discountQueries.findByCode(code);
  const now = Date.now();
  const isWithinValidity =
    discount &&
    new Date(discount.start_date).getTime() <= now &&
    new Date(discount.end_date).getTime() >= now;
  const hasRemainingUses =
    discount?.max_uses == null || Number(discount.used_count) < Number(discount.max_uses);
  const appliesToFlight = ['all', 'flight'].includes(discount?.applicable_to);

  if (!discount?.is_active || !isWithinValidity || !hasRemainingUses || !appliesToFlight) {
    throw createHttpError(400, 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
  }
  if (Number(orderValue) < Number(discount.min_order_value)) {
    throw createHttpError(
      400,
      `Đơn hàng tối thiểu để dùng mã là ${Number(discount.min_order_value).toLocaleString('vi-VN')} VND`,
    );
  }

  return toDiscountPreview(discount, orderValue);
};
