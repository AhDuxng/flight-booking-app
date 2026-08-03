import * as flightService from '../flights/flight.service.js';
import * as adminQueries from './admin.queries.js';
import { createPagination, getPagination } from '../../utils/pagination.js';
import { createHttpError } from '../../utils/error.js';
import * as paymentService from '../payments/payment.service.js';
import * as bookingService from '../bookings/booking.service.js';

const getList = async (query, finder) => {
  const { page, limit, from, to } = getPagination(query);
  const { data, count } = await finder(from, to);
  return { data, pagination: createPagination(page, limit, count) };
};

export const getDashboard = async () => {
  return adminQueries.getDashboard();
};

export const getFlights = async (query) => {
  return getList(query, adminQueries.findFlights);
};

export const getBookings = async (query) => {
  const { page, limit, from, to } = getPagination(query);
  const { data, count } = await adminQueries.findBookings(query.status, from, to);
  return { data, pagination: createPagination(page, limit, count) };
};

export const getPayments = async (query) => {
  return getList(query, adminQueries.findPayments);
};

export const cancelBooking = async (adminId, bookingId) => {
  const booking = await adminQueries.findBookingById(bookingId);
  if (!booking) {
    throw createHttpError(404, 'Booking not found');
  }
  const cancelledBooking = await bookingService.cancelBooking(bookingId, booking.user_id);
  await adminQueries.logAction({
    admin_id: adminId,
    action: 'cancel_booking',
    target_id: bookingId,
    target_type: 'booking',
    metadata: { previous_status: booking.status, next_status: cancelledBooking.status },
  });
  return cancelledBooking;
};

export const getReviews = async (query) => {
  return getList(query, adminQueries.findReviews);
};

export const getUsers = async (query) => {
  return getList(query, adminQueries.findUsers);
};

export const getUserById = async (userId) => {
  const user = await adminQueries.findUserById(userId);
  if (!user) {
    throw createHttpError(404, 'User not found');
  }
  return user;
};

export const moderateReview = async (adminId, reviewId, isVisible) => {
  const review = await adminQueries.updateReviewVisibility(reviewId, isVisible);
  if (!review) {
    throw createHttpError(404, 'Review not found');
  }
  await adminQueries.logAction({
    admin_id: adminId,
    action: isVisible ? 'show_review' : 'hide_review',
    target_id: review.id,
    target_type: 'review',
    metadata: { is_visible: isVisible },
  });
  return review;
};

export const processCashPayment = async (adminId, paymentId, status) => {
  const payment = await adminQueries.findPaymentById(paymentId);
  if (!payment) {
    throw createHttpError(404, 'Payment not found');
  }
  if (payment.provider !== 'cash') {
    throw createHttpError(400, 'Only cash payments can be processed manually');
  }
  if (payment.status !== 'pending') {
    throw createHttpError(409, 'Payment has already been processed');
  }

  const result = await paymentService.handleWebhook({
    bookingId: payment.booking_id,
    transactionRef: payment.transaction_ref,
    provider: payment.provider,
    amount: Number(payment.amount),
    currency: payment.currency,
    status,
    eventType: status === 'success' ? 'payment.succeeded' : 'payment.failed',
    eventCreatedAt: new Date().toISOString(),
    providerEventId: `cash:${paymentId}:${status}`,
    signature: 'internal',
    rawBody: JSON.stringify({ source: 'admin_cash_confirmation', paymentId, status }),
    rawPayload: { source: 'admin_cash_confirmation', adminId, paymentId },
  });

  await adminQueries.logAction({
    admin_id: adminId,
    action: status === 'success' ? 'confirm_cash_payment' : 'reject_cash_payment',
    target_id: payment.id,
    target_type: 'payment',
    metadata: { booking_id: payment.booking_id },
  });
  return result;
};

export const refundPayment = async (adminId, paymentId) => {
  const payment = await adminQueries.findPaymentById(paymentId);
  if (!payment) {
    throw createHttpError(404, 'Payment not found');
  }
  if (payment.status !== 'refund_pending' || payment.booking?.status !== 'refund_pending') {
    throw createHttpError(409, 'Payment is not awaiting refund');
  }

  if (payment.provider !== 'cash') {
    throw createHttpError(405, 'Online refunds must use the refund request workflow');
  }
  const refund = await adminQueries.findOpenRefundByPaymentId(paymentId);
  if (!refund) throw createHttpError(404, 'Refund request not found');
  if (refund.status === 'pending') {
    await adminQueries.approveCashRefund(refund.id, adminId, refund.requested_amount);
  }
  const result = await adminQueries.completeCashRefund(refund.id);
  await adminQueries.logAction({
    admin_id: adminId,
    action: 'complete_payment_refund',
    target_id: payment.id,
    target_type: 'payment',
    metadata: { booking_id: result.booking_id },
  });
  return result;
};

export const createFlight = async (adminId, payload) => {
  const flight = await flightService.createFlight(payload);
  await adminQueries.logAction({
    admin_id: adminId,
    action: 'create_flight',
    target_id: flight.id,
    target_type: 'flight',
    metadata: { flight_number: flight.flight_number },
  });
  return flight;
};

export const updateFlight = async (adminId, flightId, payload) => {
  if (payload.status === 'cancelled') {
    await adminQueries.cancelFlight(flightId, adminId, payload.delayReason ?? payload.notes);
    const cancelledFlight = await flightService.getFlightById(flightId);
    await adminQueries.logAction({
      admin_id: adminId,
      action: 'cancel_flight',
      target_id: flightId,
      target_type: 'flight',
      metadata: { fields: Object.keys(payload) },
    });
    return cancelledFlight;
  }
  const flight = await flightService.updateFlight(flightId, payload);
  await adminQueries.logAction({
    admin_id: adminId,
    action: 'update_flight',
    target_id: flight.id,
    target_type: 'flight',
    metadata: { fields: Object.keys(payload) },
  });
  return flight;
};
