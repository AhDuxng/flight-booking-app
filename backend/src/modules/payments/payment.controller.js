import * as service from './payment.service.js';
import env from '../../config/env.js';

export const processPayment = async (req, res, next) => {
  try {
    const result = await service.processPayment(req.user.id, req.body);
    return res.status(200).json({
      message: 'Payment processed / initialized',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req, res, next) => {
  try {
    const result = await service.handlePaymentWebhook(req.body);
    return res.status(200).json({
      message: 'Webhook processed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const handleMockRedirect = async (req, res, next) => {
  try {
    const { paymentId, bookingId, ref, status = 'success' } = req.query;
    
    await service.handlePaymentWebhook({
      paymentId,
      bookingId,
      transactionRef: ref,
      status: status
    });

    const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/payment/result?bookingId=${bookingId}&status=${status}`);
  } catch (error) {
    next(error);
  }
};
