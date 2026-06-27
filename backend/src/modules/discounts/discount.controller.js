import * as service from './discount.service.js';

export const validateDiscount = async (req, res, next) => {
  try {
    const { code, order_value } = req.body;
    const data = await service.validateDiscount(code, order_value);
    return res.status(200).json({
      message: 'Discount code is valid',
      data
    });
  } catch (error) {
    next(error);
  }
};
