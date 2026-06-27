import * as service from './review.service.js';

export const createReview = async (req, res, next) => {
  try {
    const review = await service.createReview(req.user.id, req.body);
    return res.status(201).json({
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

export const getReviews = async (req, res, next) => {
  try {
    const { flight_id } = req.query;
    const reviews = await service.getReviewsByFlightId(flight_id);
    return res.status(200).json({
      message: 'Reviews retrieved successfully',
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};
