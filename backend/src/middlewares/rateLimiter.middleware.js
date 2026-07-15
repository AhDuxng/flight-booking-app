import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const rateLimitHandler = (req, res) => {
  res.status(429).json({ error: 'Too many requests, please try again later' });
};

const skipRateLimit = () => env.nodeEnv === 'development';

export const authRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.authRateLimit,
  skip: skipRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const publicRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.publicRateLimit,
  skip: skipRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
