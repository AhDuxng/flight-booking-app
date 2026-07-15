import * as discountQueries from './discount.queries.js';

export const getActiveDiscounts = async () => {
  return discountQueries.findActive();
};

export const validateDiscount = async ({ code, orderValue }) => {
  return discountQueries.validate(code, orderValue);
};
