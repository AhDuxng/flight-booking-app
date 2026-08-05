import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { createHttpError } from '../../utils/error.js';
import * as notificationService from '../notifications/notification.service.js';
import * as paymentQueries from '../payments/payment.queries.js';
import { attachOnlineCheckout } from '../payments/payment.service.js';
import * as queries from './operation.queries.js';
import { createBoardingPassPdf, createETicketPdf } from './document.service.js';
import { sendTicketEmail } from './mail.service.js';
import { generateScheduledFlights } from '../../jobs/scheduleGeneration.job.js';
import { hashRequest, normalizeIdempotencyKey } from '../../utils/idempotency.js';

const requireBooking = async (bookingId, userId) => {
  const booking = await queries.findBooking(bookingId, userId);
  if (!booking) throw createHttpError(404, 'Booking not found');
  return booking;
};

export const getBookingOperations = requireBooking;

export const getFares = (flightId) => queries.findFaresForFlight(flightId);

export const setBookingFare = async (bookingId, userId, fareId) => {
  const booking = await requireBooking(bookingId, userId);
  if (booking.status !== 'pending')
    throw createHttpError(409, 'Fare can only be changed before payment');
  const fares = await queries.findFaresForFlight(booking.flight_id);
  const fare = fares.find((item) => item.id === fareId);
  if (!fare) throw createHttpError(400, 'Fare is not valid for this flight');
  return queries.setBookingFare(bookingId, userId, fareId);
};

export const getTicketPdf = async (ticketId, userId) => {
  const ticket = await queries.findTicket(ticketId, userId);
  if (!ticket) throw createHttpError(404, 'Ticket not found');
  const booking = await requireBooking(ticket.booking_id, userId);
  return {
    filename: `vietfly-ticket-${ticket.ticket_number}.pdf`,
    buffer: await createETicketPdf(booking),
  };
};

export const getBookingTicketPdf = async (bookingId, userId) => {
  const booking = await requireBooking(bookingId, userId);
  if (!booking.tickets?.some((ticket) => ['issued', 'reissued'].includes(ticket.status))) {
    throw createHttpError(409, 'Tickets have not been issued');
  }
  return {
    filename: `vietfly-${booking.booking_reference ?? booking.id}.pdf`,
    buffer: await createETicketPdf(booking),
    booking,
  };
};

export const emailBookingTicket = async (bookingId, userId) => {
  const document = await getBookingTicketPdf(bookingId, userId);
  const result = await sendTicketEmail({ booking: document.booking, pdf: document.buffer });
  if (!result.sent) throw createHttpError(503, 'Email delivery is not configured');
  return result;
};

export const checkIn = async (bookingId, userId, payload) => {
  const booking = await requireBooking(bookingId, userId);
  const passengerIds = new Set((booking.passengers ?? []).map((passenger) => passenger.id));
  if (payload.passengerIds.some((id) => !passengerIds.has(id)))
    throw createHttpError(400, 'Passenger does not belong to booking');
  const ids = [];
  for (const passengerId of payload.passengerIds) {
    const seatId =
      payload.seatAssignments.find((item) => item.passengerId === passengerId)?.seatId ?? null;
    ids.push(
      await queries.checkInPassenger(
        bookingId,
        passengerId,
        userId,
        payload.documentConfirmed,
        seatId,
      ),
    );
  }
  const updated = await requireBooking(bookingId, userId);
  return updated.check_ins;
};

export const getBoardingPassPdf = async (checkInId, userId) => {
  const checkIn = await queries.findCheckIn(checkInId, userId);
  if (!checkIn) throw createHttpError(404, 'Boarding pass not found');
  return {
    filename: `boarding-pass-${checkIn.boarding_pass_number}.pdf`,
    buffer: await createBoardingPassPdf(checkIn),
  };
};

export const getChangeOptions = async (bookingId, userId, query) => {
  const booking = await requireBooking(bookingId, userId);
  if (booking.status !== 'confirmed')
    throw createHttpError(409, 'Only confirmed bookings can be changed');
  if (!booking.fare?.change_allowed)
    throw createHttpError(409, 'Selected fare does not allow flight changes');
  const from = (query.page - 1) * query.limit;
  const data = await queries.findChangeOptions(booking, from, from + query.limit - 1);
  return Promise.all(
    data.map(async (flight) => ({
      ...flight,
      quoted_fare_total:
        (await queries.calculateFarePrice(flight.id, booking.fare.cabin_class, booking.fare.id)) *
        booking.passengers.length,
    })),
  );
};

export const quoteFlightChange = async (bookingId, userId, newFlightId) => {
  const booking = await requireBooking(bookingId, userId);
  if (booking.status !== 'confirmed')
    throw createHttpError(409, 'Only confirmed bookings can be changed');
  if (!booking.fare?.change_allowed)
    throw createHttpError(409, 'Selected fare does not allow flight changes');
  return queries.createChangeQuote(booking.id, userId, newFlightId);
};

export const confirmFlightChange = async (requestId, userId, provider, rawIdempotencyKey) => {
  const request = await queries.findChangeRequest(requestId, userId);
  if (!request) throw createHttpError(404, 'Flight change quote not found');
  if (request.status === 'completed') return { change: request, payment: null };
  if (
    request.quote_expires_at <= new Date().toISOString() ||
    !['quoted', 'pending_payment'].includes(request.status)
  )
    throw createHttpError(409, 'Flight change quote has expired');
  if (Number(request.additional_amount) === 0) {
    const result = await queries.applyFlightChange(request.id, userId);
    return { change: result, payment: null };
  }
  if (!['cash', ...env.paymentProviders].includes(provider))
    throw createHttpError(400, 'Payment provider is not configured');
  const idempotencyKey = normalizeIdempotencyKey(rawIdempotencyKey, { required: true });
  const payment = await paymentQueries.getOrCreateIntent({
    userId,
    bookingId: request.booking_id,
    purpose: 'flight_change',
    provider,
    idempotencyKey,
    requestHash: hashRequest({ requestId, provider }),
    transactionRef: `change_${randomUUID()}`,
    changeRequestId: request.id,
  });
  const booking = await requireBooking(request.booking_id, userId);
  const checkout = payment.checkout_url ? payment : await attachOnlineCheckout(payment, booking);
  return { change: { ...request, status: 'pending_payment' }, payment: checkout };
};

export const getContent = (query) => queries.findPublishedContent(query);
export const getFlightStatus = (query) => queries.findFlightStatus(query);
export const getAncillaries = queries.findAncillaries;

export const addAncillary = async (userId, payload) => {
  const booking = await requireBooking(payload.bookingId, userId);
  if (booking.status !== 'pending')
    throw createHttpError(409, 'Ancillaries can be added before booking payment');
  const services = await queries.findAncillaries();
  const service = services.find((item) => item.id === payload.ancillaryServiceId);
  if (!service) throw createHttpError(404, 'Ancillary service not found');
  if (payload.passengerId && !booking.passengers.some((item) => item.id === payload.passengerId))
    throw createHttpError(400, 'Passenger does not belong to booking');
  return queries.purchaseAncillary({
    bookingId: booking.id,
    userId,
    passengerId: payload.passengerId ?? null,
    ancillaryServiceId: service.id,
    quantity: payload.quantity,
    details: payload.details,
  });
};

export const createSupportTicket = async (userId, payload) => {
  if (payload.bookingId) await requireBooking(payload.bookingId, userId);
  return queries.createSupportTicket({
    user_id: userId,
    booking_id: payload.bookingId ?? null,
    category: payload.category,
    subject: payload.subject,
    description: payload.description,
    priority: payload.priority,
    sla_due_at: new Date(
      Date.now() +
        (payload.priority === 'urgent' ? 2 : payload.priority === 'high' ? 8 : 24) * 60 * 60 * 1000,
    ).toISOString(),
  });
};
export const getSupportTickets = queries.findSupportTickets;
export const addSupportMessage = async (ticketId, userId, body) => {
  const tickets = await queries.findSupportTickets(userId);
  const ticket = tickets.find((item) => item.id === ticketId);
  if (!ticket) throw createHttpError(404, 'Support ticket not found');
  const message = await queries.addSupportMessage({
    ticket_id: ticketId,
    sender_id: userId,
    body,
    is_internal: false,
  });
  if (ticket.status === 'waiting_customer')
    await queries.updateAdminResource('support_tickets', ticketId, { status: 'open' });
  return message;
};
export const addAdminSupportMessage = async (ticketId, adminId, payload) => {
  const ticket = await queries.findSupportTicketById(ticketId);
  if (!ticket) throw createHttpError(404, 'Support ticket not found');
  const message = await queries.addSupportMessage({
    ticket_id: ticketId,
    sender_id: adminId,
    body: payload.body,
    is_internal: payload.isInternal,
  });
  if (!payload.isInternal) {
    await queries.updateAdminResource('support_tickets', ticketId, {
      status: 'waiting_customer',
      assigned_to: ticket.assigned_to ?? adminId,
    });
    await notificationService.sendNotification(ticket.user_id, {
      type: 'general',
      title: `Support update ${ticket.reference}`,
      body: payload.body.slice(0, 240),
      payload: { supportTicketId: ticket.id },
    });
  }
  return message;
};

export const getAdminResource = queries.getAdminResource;
export const createAdminResource = async (resource, payload, adminId) => {
  if (['refund_requests', 'support_tickets'].includes(resource)) {
    throw createHttpError(405, 'This resource must be created by its business workflow');
  }
  if (resource === 'flight_status_events') {
    return queries.recordFlightStatusEvent(adminId, payload);
  }
  const normalized = ['cms_contents'].includes(resource)
    ? { ...payload, created_by: adminId }
    : payload;
  const data = await queries.insertAdminResource(resource, normalized);
  return data;
};
export const updateAdminResource = async (resource, id, payload) => {
  if (resource === 'refund_requests')
    throw createHttpError(405, 'Use the refund decision workflow');
  if (resource === 'flight_status_events')
    throw createHttpError(405, 'Flight status events are immutable; create a new event');
  const normalized =
    resource === 'support_tickets' && ['resolved', 'closed'].includes(payload.status)
      ? { ...payload, resolved_at: payload.resolved_at ?? new Date().toISOString() }
      : payload;
  return queries.updateAdminResource(resource, id, normalized);
};
export const generateSchedules = async () => ({ createdFlights: await generateScheduledFlights() });

const callRefundProvider = async (refund) => {
  if (refund.payment.provider === 'cash')
    return { id: `cash_refund_${refund.id}`, status: 'succeeded' };
  if (!env.paymentRefundApiUrl || !env.paymentSecretKey)
    throw createHttpError(503, 'Refund provider is not configured');
  if (refund.payment.provider === 'stripe') {
    const zeroDecimal = ['VND', 'JPY', 'KRW'].includes(
      String(refund.payment.currency).toUpperCase(),
    );
    const amount = Math.round(Number(refund.approved_amount) * (zeroDecimal ? 1 : 100));
    const body = new URLSearchParams({
      payment_intent: refund.payment.transaction_ref,
      amount: String(amount),
      'metadata[refundRequestId]': refund.id,
    });
    const response = await fetch(env.paymentRefundApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.paymentSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': refund.idempotency_key,
      },
      body,
      signal: AbortSignal.timeout(env.paymentRequestTimeoutMs),
    });
    if (!response.ok) throw createHttpError(502, 'Stripe refund request failed');
    return response.json();
  }
  const response = await fetch(env.paymentRefundApiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.paymentSecretKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': refund.idempotency_key,
    },
    body: JSON.stringify({
      refundRequestId: refund.id,
      transactionRef: refund.payment.transaction_ref,
      amount: Number(refund.approved_amount),
      currency: refund.payment.currency,
      provider: refund.payment.provider,
    }),
    signal: AbortSignal.timeout(env.paymentRequestTimeoutMs),
  });
  if (!response.ok) throw createHttpError(502, 'Refund provider request failed');
  return response.json();
};

export const decideRefund = async (refundId, adminId, payload) => {
  const refund = await queries.findRefundRequest(refundId);
  if (!refund) throw createHttpError(404, 'Refund request not found');
  if (refund.status === 'processing') return refund;
  if (!['pending', 'approved', 'requires_review'].includes(refund.status))
    throw createHttpError(409, 'Refund request has already been reviewed');
  if (payload.action === 'reject')
    return queries.reviewRefundRequest(refundId, adminId, 'reject', null, payload.reason);
  const approvedAmount = payload.approvedAmount ?? Number(refund.requested_amount);
  if (approvedAmount > Number(refund.requested_amount))
    throw createHttpError(400, 'Approved amount exceeds requested amount');
  await queries.reviewRefundRequest(refundId, adminId, 'approve', approvedAmount, payload.reason);
  try {
    const providerResult = await callRefundProvider({ ...refund, approved_amount: approvedAmount });
    const providerStatus = String(providerResult.status ?? 'succeeded').toLowerCase();
    if (['succeeded', 'success', 'completed'].includes(providerStatus)) {
      return queries.completeRefundV2(
        refundId,
        providerResult.id ?? providerResult.refundId,
        providerResult,
      );
    }
    return queries.reconcileRefund(refundId, {
      status: 'processing',
      providerRefundId: providerResult.id ?? providerResult.refundId ?? null,
      providerStatus,
      providerResponse: providerResult,
    });
  } catch (error) {
    await queries.reconcileRefund(refundId, {
      status: error.status ? 'requires_review' : 'processing',
      failureReason: error.message,
    });
    throw error;
  }
};

export const sendIssuedTicketEmail = async (bookingId, userId) => {
  try {
    return await emailBookingTicket(bookingId, userId);
  } catch (error) {
    return { sent: false, reason: error.message };
  }
};
