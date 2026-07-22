import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  forgotPasswordSchema,
  loginSchema,
  oauthProviderParamsSchema,
  refreshSessionSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.schema.js';
import * as authController from './auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSessionSchema), authController.refreshSession);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.requestPasswordReset);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/oauth/:provider', validate({ params: oauthProviderParamsSchema }), authController.getOAuthUrl);
router.get('/session', authenticate, authController.getSession);
router.post('/logout', authenticate, authController.logout);

export default router;
