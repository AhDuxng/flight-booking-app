import { Router } from 'express';
import * as controller from './auth.controller.js';
import { signupSchema, loginSchema } from './auth.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { authRateLimiter } from '../../middlewares/rateLimiter.middleware.js';

const router = Router();

router.post('/signup', authRateLimiter, validate(signupSchema), controller.signup);
router.post('/login', authRateLimiter, validate(loginSchema), controller.login);
router.get('/me', authMiddleware, controller.me);

export default router;
