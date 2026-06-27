import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: true, // Return rate limit info in header
  legacyHeaders: false, // Disable legacy X-RateLimit headers
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts, please try again after 15 minutes'
  }
});

export default rateLimiter;
