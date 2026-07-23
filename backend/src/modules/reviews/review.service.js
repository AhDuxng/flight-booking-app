import * as reviewQueries from './review.queries.js';
import { createHttpError } from '../../utils/error.js';
import { createPagination, getPagination } from '../../utils/pagination.js';

export const getReviews = async (query) => {
  const { page, limit, from, to } = getPagination(query);
  const { data, count } = await reviewQueries.findByFlightId(query.flightId, from, to);
  return { data, pagination: createPagination(page, limit, count) };
};

export const createReview = async (userId, payload) => {
  const booking = await reviewQueries.findBookingForUser(payload.bookingId, userId);

  const flightCompleted =
    booking?.flight?.status === 'arrived' ||
    (booking?.flight?.arrival_time && new Date(booking.flight.arrival_time) <= new Date());

  if (!booking || booking.status !== 'confirmed' || !flightCompleted) {
    throw createHttpError(400, 'Only completed flights with confirmed bookings can be reviewed');
  }

  return reviewQueries.insert({
    user_id: userId,
    booking_id: booking.id,
    flight_id: booking.flight_id,
    rating: payload.rating,
    comment: payload.comment ?? null,
  });
};

export const updateReview = async (reviewId, userId, payload) => {
  const review = await reviewQueries.findOwnedById(reviewId, userId);

  if (!review) {
    throw createHttpError(404, 'Review not found');
  }

  return reviewQueries.update(reviewId, payload);
};
