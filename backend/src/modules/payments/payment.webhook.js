import { env } from '../../config/env.js';
import * as paymentService from './payment.service.js';
import { isWebhookTimestampFresh, verifyWebhookHmac } from '../../utils/webhook.js';

export const verifyPaymentWebhookSignature = (req, res, next) => {
  if (!env.paymentWebhookSecret) {
    return res.status(503).json({ error: 'Payment webhook is not configured' });
  }

  const signature = req.get('x-payment-signature');
  const timestamp = req.get('x-payment-timestamp');
  const providerEventId = req.get('x-payment-event-id');

  if (!signature || !/^[a-f0-9]{64}$/i.test(signature) || !timestamp || !providerEventId) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const eventTime = Number(timestamp);
  if (!Number.isFinite(eventTime))
    return res.status(400).json({ error: 'Invalid webhook timestamp' });
  const eventTimeMs = eventTime < 10_000_000_000 ? eventTime * 1000 : eventTime;
  if (!isWebhookTimestampFresh(timestamp, Date.now(), env.paymentWebhookReplayWindowSeconds)) {
    return res.status(400).json({ error: 'Webhook timestamp is outside the replay window' });
  }

  const rawBody = req.rawBody?.toString('utf8');
  if (!rawBody) return res.status(400).json({ error: 'Raw webhook body is required' });

  if (!verifyWebhookHmac({ secret: env.paymentWebhookSecret, timestamp, rawBody, signature })) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  req.paymentWebhook = {
    eventCreatedAt: new Date(eventTimeMs).toISOString(),
    providerEventId: providerEventId.slice(0, 255),
    rawBody,
    signature,
  };

  return next();
};

export const handlePaymentWebhook = async (req, res, next) => {
  try {
    const data = await paymentService.handleWebhook({
      ...req.body,
      ...req.paymentWebhook,
      rawPayload: req.body,
    });
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
