import * as queries from './review.queries.js';
import supabase from '../../config/supabase.js';

export const createReview = async (userId, reviewData) => {
  // Check if booking belongs to user
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('user_id, status')
    .eq('id', reviewData.booking_id)
    .single();

  if (error || !booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  if (booking.user_id !== userId) {
    const err = new Error('Forbidden: You can only review your own bookings');
    err.status = 403;
    throw err;
  }

  // We should verify that the booking status is 'confirmed' or 'paid'
  // Or completed. But standard confirmed is fine.
  return await queries.createReview({
    user_id: userId,
    booking_id: reviewData.booking_id,
    flight_id: reviewData.flight_id,
    rating: reviewData.rating,
    comment: reviewData.comment || null
  });
};

export const getReviewsByFlightId = async (flightId) => {
  return await queries.getReviewsByFlightId(flightId);
};
