import * as discountService from './discount.service.js';

export const getActiveDiscounts = async (req, res, next) => {
  try {
    const data = await discountService.getActiveDiscounts();
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

export const validateDiscount = async (req, res, next) => {
  try {
    const data = await discountService.validateDiscount(req.body);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
