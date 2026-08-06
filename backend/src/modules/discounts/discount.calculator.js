export const calculateDiscountAmount = (discount, orderValue) => {
  const total = Number(orderValue);
  const value = Number(discount.discount_value);
  const rawAmount = discount.discount_type === 'percentage' ? (total * value) / 100 : value;
  const cappedAmount =
    discount.max_discount == null ? rawAmount : Math.min(rawAmount, Number(discount.max_discount));

  return Math.max(0, Math.min(total, Math.round(cappedAmount * 100) / 100));
};
