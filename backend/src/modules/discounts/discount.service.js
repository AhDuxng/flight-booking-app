import * as queries from './discount.queries.js';

export const validateDiscount = async (code, orderValue) => {
  const result = await queries.validateDiscountRpc(code, orderValue);
  if (!result || result.length === 0) {
    throw new Error('Invalid discount code or requirements not met');
  }
  return {
    discount_id: result[0].discount_id,
    discount_amount: Number(result[0].discount_amount)
  };
};
