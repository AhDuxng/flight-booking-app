import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env.js';
import * as paymentService from './payment.service.js';

const stableStringify = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
};

export const verifyPaymentWebhookSignature = (req, res, next) => {
  if (!env.paymentWebhookSecret) {
    return res.status(503).json({ error: 'Payment webhook is not configured' });
  }

  const signature = req.get('x-payment-signature');

  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const expected = createHmac('sha256', env.paymentWebhookSecret)
    .update(stableStringify(req.body))
    .digest('hex');
  const isValid = timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));

  if (!isValid) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  return next();
};

export const handlePaymentWebhook = async (req, res, next) => {
  try {
    const data = await paymentService.handleWebhook({
      ...req.body,
      rawPayload: req.body,
    });
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
