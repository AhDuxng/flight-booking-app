import * as reviewService from './review.service.js';

export const getReviews = async (req, res, next) => {
  try {
    const result = await reviewService.getReviews(req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const data = await reviewService.createReview(req.user.id, req.body);
    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const data = await reviewService.updateReview(req.params.reviewId, req.user.id, req.body);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
