import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createReviewSchema,
  reviewParamsSchema,
  reviewQuerySchema,
  updateReviewSchema,
} from './review.schema.js';
import * as reviewController from './review.controller.js';

const router = Router();

router.get('/', validate({ query: reviewQuerySchema }), reviewController.getReviews);
router.post('/', authenticate, validate(createReviewSchema), reviewController.createReview);
router.patch(
  '/:reviewId',
  authenticate,
  validate({ params: reviewParamsSchema, body: updateReviewSchema }),
  reviewController.updateReview,
);

export default router;
