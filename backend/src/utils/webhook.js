import { createHmac, timingSafeEqual } from 'node:crypto';

export const isWebhookTimestampFresh = (timestamp, nowMs, replayWindowSeconds) => {
  const parsed = Number(timestamp);
  if (!Number.isFinite(parsed)) return false;
  const timestampMs = parsed < 10_000_000_000 ? parsed * 1000 : parsed;
  return Math.abs(nowMs - timestampMs) <= replayWindowSeconds * 1000;
};

export const verifyWebhookHmac = ({ secret, timestamp, rawBody, signature }) => {
  if (!secret || !timestamp || !rawBody || !/^[a-f0-9]{64}$/i.test(signature ?? '')) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest();
  return timingSafeEqual(Buffer.from(signature, 'hex'), expected);
};
