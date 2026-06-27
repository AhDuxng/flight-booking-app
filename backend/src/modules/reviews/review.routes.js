import { Router } from 'express';
import * as controller from './review.controller.js';
import { createReviewSchema, getReviewsSchema } from './review.schema.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

// Create review (auth required)
router.post('/', authMiddleware, validate(createReviewSchema), controller.createReview);

// Get flight reviews (public)
router.get('/', validate(getReviewsSchema), controller.getReviews);

export default router;
