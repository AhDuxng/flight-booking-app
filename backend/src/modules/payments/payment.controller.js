import * as paymentService from './payment.service.js';

export const createPaymentIntent = async (req, res, next) => {
  try {
    const data = await paymentService.createPaymentIntent(req.user.id, req.body);
    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
};

export const getPaymentsByBooking = async (req, res, next) => {
  try {
    const data = await paymentService.getPaymentsByBooking(req.user.id, req.params.bookingId);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

export const getPaymentStatus = async (req, res, next) => {
  try {
    const data = await paymentService.getPaymentStatus(req.user.id, req.body);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
