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
import * as adminQueries from '../admin/admin.queries.js';

const requireBooking = async (bookingId, userId) => {
  const booking = await queries.findBooking(bookingId, userId);
  if (!booking) throw createHttpError(404, 'Booking not found');
  return booking;
};

export const getBookingOperations = requireBooking;

export const getFares = (flightId) => queries.findFaresForFlight(flightId);

export const setBookingFare = async (bookingId, userId, fareId) => {
  const booking = await requireBooking(bookingId, userId);
  if (booking.status !== 'pending') throw createHttpError(409, 'Fare can only be changed before payment');
  const fares = await queries.findFaresForFlight(booking.flight_id);
  const fare = fares.find((item) => item.id === fareId);
  if (!fare) throw createHttpError(400, 'Fare is not valid for this flight');
  return queries.setBookingFare(bookingId, userId, fareId);
};

export const getTicketPdf = async (ticketId, userId) => {
  const ticket = await queries.findTicket(ticketId, userId);
  if (!ticket) throw createHttpError(404, 'Ticket not found');
  const booking = await requireBooking(ticket.booking_id, userId);
  return { filename: `vietfly-ticket-${ticket.ticket_number}.pdf`, buffer: await createETicketPdf(booking) };
};

export const getBookingTicketPdf = async (bookingId, userId) => {
  const booking = await requireBooking(bookingId, userId);
  if (!booking.tickets?.some((ticket) => ['issued', 'reissued'].includes(ticket.status))) {
    throw createHttpError(409, 'Tickets have not been issued');
  }
  return { filename: `vietfly-${booking.booking_reference ?? booking.id}.pdf`, buffer: await createETicketPdf(booking), booking };
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
  if (payload.passengerIds.some((id) => !passengerIds.has(id))) throw createHttpError(400, 'Passenger does not belong to booking');
  const ids = [];
  for (const passengerId of payload.passengerIds) {
    const seatId = payload.seatAssignments.find((item) => item.passengerId === passengerId)?.seatId ?? null;
    ids.push(await queries.checkInPassenger(bookingId, passengerId, userId, payload.documentConfirmed, seatId));
  }
  const updated = await requireBooking(bookingId, userId);
  await notificationService.sendNotification(userId, {
    type: 'general', title: 'Online check-in completed',
    body: `Boarding pass is ready for booking ${updated.booking_reference ?? bookingId}`,
    payload: { bookingId, checkInIds: ids },
  });
  return updated.check_ins;
};

export const getBoardingPassPdf = async (checkInId, userId) => {
  const checkIn = await queries.findCheckIn(checkInId, userId);
  if (!checkIn) throw createHttpError(404, 'Boarding pass not found');
  return { filename: `boarding-pass-${checkIn.boarding_pass_number}.pdf`, buffer: await createBoardingPassPdf(checkIn) };
};

export const getChangeOptions = async (bookingId, userId, query) => {
  const booking = await requireBooking(bookingId, userId);
  if (booking.status !== 'confirmed') throw createHttpError(409, 'Only confirmed bookings can be changed');
  if (!booking.fare?.change_allowed) throw createHttpError(409, 'Selected fare does not allow flight changes');
  const from = (query.page - 1) * query.limit;
  const data = await queries.findChangeOptions(booking, from, from + query.limit - 1);
  return data.map((flight) => ({
    ...flight,
    quoted_fare_total: Math.round(Number(flight.base_price) * Number(booking.fare?.price_multiplier ?? 1) * booking.passengers.length),
  }));
};

export const quoteFlightChange = async (bookingId, userId, newFlightId) => {
  const booking = await requireBooking(bookingId, userId);
  if (booking.status !== 'confirmed') throw createHttpError(409, 'Only confirmed bookings can be changed');
  if (!booking.fare?.change_allowed) throw createHttpError(409, 'Selected fare does not allow flight changes');
  const options = await queries.findChangeOptions(booking, 0, 499);
  const newFlight = options.find((flight) => flight.id === newFlightId);
  if (!newFlight) throw createHttpError(409, 'New flight is not available for this itinerary');
  const newFareTotal = Math.round(Number(newFlight.base_price) * Number(booking.fare?.price_multiplier ?? 1) * booking.passengers.length);
  const fareDifference = newFareTotal - Number(booking.price_snapshot);
  const changeFee = Number(booking.fare?.change_fee ?? 0) * booking.passengers.length;
  const net = fareDifference + changeFee;
  return queries.insertChangeRequest({
    booking_id: booking.id, user_id: userId, old_flight_id: booking.flight_id,
    new_flight_id: newFlight.id, fare_id: booking.fare_id, old_total: booking.total_price,
    new_fare_total: newFareTotal, fare_difference: fareDifference, change_fee: changeFee,
    additional_amount: Math.max(0, net), refund_amount: Math.max(0, -net), status: 'quoted',
  });
};

export const confirmFlightChange = async (requestId, userId, provider) => {
  const request = await queries.findChangeRequest(requestId, userId);
  if (!request) throw createHttpError(404, 'Flight change quote not found');
  if (request.quote_expires_at <= new Date().toISOString() || request.status !== 'quoted') throw createHttpError(409, 'Flight change quote has expired');
  if (Number(request.additional_amount) === 0) {
    const result = await queries.applyFlightChange(request.id, userId);
    await notificationService.sendNotification(userId, { type: 'booking_confirmed', title: 'Flight changed', body: 'Your new itinerary and reissued ticket are ready.', payload: { bookingId: request.booking_id, changeRequestId: request.id } });
    await sendIssuedTicketEmail(request.booking_id, userId);
    return { change: result, payment: null };
  }
  if (!['cash', ...env.paymentProviders].includes(provider)) throw createHttpError(400, 'Payment provider is not configured');
  const payment = await paymentQueries.insertIntent({
    booking_id: request.booking_id, amount: request.additional_amount, provider,
    transaction_ref: `change_${randomUUID()}`, status: 'pending', purpose: 'flight_change', change_request_id: request.id,
  });
  await queries.updateChangeRequest(request.id, userId, { status: 'pending_payment' });
  const booking = await requireBooking(request.booking_id, userId);
  try {
    return { change: { ...request, status: 'pending_payment' }, payment: await attachOnlineCheckout(payment, booking) };
  } catch (error) {
    await paymentQueries.failIntent(payment.id, error.message).catch(() => {});
    await queries.updateChangeRequest(request.id, userId, { status: 'quoted' }).catch(() => {});
    throw error;
  }
};

export const getContent = (query) => queries.findPublishedContent(query);
export const getFlightStatus = (query) => queries.findFlightStatus(query);
export const getAncillaries = queries.findAncillaries;

export const addAncillary = async (userId, payload) => {
  const booking = await requireBooking(payload.bookingId, userId);
  if (booking.status !== 'pending') throw createHttpError(409, 'Ancillaries can be added before booking payment');
  const services = await queries.findAncillaries();
  const service = services.find((item) => item.id === payload.ancillaryServiceId);
  if (!service) throw createHttpError(404, 'Ancillary service not found');
  if (payload.passengerId && !booking.passengers.some((item) => item.id === payload.passengerId)) throw createHttpError(400, 'Passenger does not belong to booking');
  return queries.purchaseAncillary({
    bookingId: booking.id, userId, passengerId: payload.passengerId ?? null,
    ancillaryServiceId: service.id, quantity: payload.quantity, details: payload.details,
  });
};

export const createSupportTicket = async (userId, payload) => {
  if (payload.bookingId) await requireBooking(payload.bookingId, userId);
  return queries.createSupportTicket({
    user_id: userId, booking_id: payload.bookingId ?? null, category: payload.category,
    subject: payload.subject, description: payload.description, priority: payload.priority,
    sla_due_at: new Date(Date.now() + (payload.priority === 'urgent' ? 2 : payload.priority === 'high' ? 8 : 24) * 60 * 60 * 1000).toISOString(),
  });
};
export const getSupportTickets = queries.findSupportTickets;
export const addSupportMessage = async (ticketId, userId, body) => {
  const tickets = await queries.findSupportTickets(userId);
  const ticket = tickets.find((item) => item.id === ticketId);
  if (!ticket) throw createHttpError(404, 'Support ticket not found');
  const message = await queries.addSupportMessage({ ticket_id: ticketId, sender_id: userId, body, is_internal: false });
  if (ticket.status === 'waiting_customer') await queries.updateAdminResource('support_tickets', ticketId, { status: 'open' });
  return message;
};
export const addAdminSupportMessage = async (ticketId, adminId, payload) => {
  const ticket = await queries.findSupportTicketById(ticketId);
  if (!ticket) throw createHttpError(404, 'Support ticket not found');
  const message = await queries.addSupportMessage({ ticket_id: ticketId, sender_id: adminId, body: payload.body, is_internal: payload.isInternal });
  if (!payload.isInternal) {
    await queries.updateAdminResource('support_tickets', ticketId, { status: 'waiting_customer', assigned_to: ticket.assigned_to ?? adminId });
    await notificationService.sendNotification(ticket.user_id, { type: 'general', title: `Support update ${ticket.reference}`, body: payload.body.slice(0, 240), payload: { supportTicketId: ticket.id } });
  }
  return message;
};

export const getAdminResource = queries.getAdminResource;
export const createAdminResource = async (resource, payload, adminId) => {
  if (['refund_requests', 'support_tickets'].includes(resource)) {
    throw createHttpError(405, 'This resource must be created by its business workflow');
  }
  const normalized = ['flight_status_events', 'cms_contents'].includes(resource)
    ? { ...payload, created_by: adminId }
    : payload;
  const data = await queries.insertAdminResource(resource, normalized);
  if (resource === 'flight_status_events') {
    await queries.syncFlightStatus(data);
    if (['delayed', 'cancelled'].includes(data.status)) {
      const bookings = await adminQueries.findActiveBookingsByFlightId(data.flight_id);
      await Promise.all(bookings.map((booking) => notificationService.sendNotification(booking.user_id, {
        type: data.status === 'cancelled' ? 'flight_cancelled' : 'flight_delayed',
        title: data.status === 'cancelled' ? 'Flight cancelled' : 'Flight delayed',
        body: data.message ?? `The status of your flight has changed to ${data.status}.`,
        payload: { bookingId: booking.id, flightId: data.flight_id },
      })));
    }
  }
  return data;
};
export const updateAdminResource = async (resource, id, payload) => {
  if (resource === 'refund_requests') throw createHttpError(405, 'Use the refund decision workflow');
  const normalized = resource === 'support_tickets' && ['resolved', 'closed'].includes(payload.status)
    ? { ...payload, resolved_at: payload.resolved_at ?? new Date().toISOString() }
    : payload;
  return queries.updateAdminResource(resource, id, normalized);
};
export const generateSchedules = async () => ({ createdFlights: await generateScheduledFlights() });

const callRefundProvider = async (refund) => {
  if (refund.payment.provider === 'cash') return { id: `cash_refund_${refund.id}`, status: 'succeeded' };
  if (!env.paymentRefundApiUrl || !env.paymentSecretKey) throw createHttpError(503, 'Refund provider is not configured');
  if (refund.payment.provider === 'stripe') {
    const zeroDecimal = ['VND', 'JPY', 'KRW'].includes(String(refund.payment.currency).toUpperCase());
    const amount = Math.round(Number(refund.approved_amount) * (zeroDecimal ? 1 : 100));
    const body = new URLSearchParams({ payment_intent: refund.payment.transaction_ref, amount: String(amount), 'metadata[refundRequestId]': refund.id });
    const response = await fetch(env.paymentRefundApiUrl, { method: 'POST', headers: { Authorization: `Bearer ${env.paymentSecretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    if (!response.ok) throw createHttpError(502, 'Stripe refund request failed');
    return response.json();
  }
  const response = await fetch(env.paymentRefundApiUrl, { method: 'POST', headers: { Authorization: `Bearer ${env.paymentSecretKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ refundRequestId: refund.id, transactionRef: refund.payment.transaction_ref, amount: Number(refund.approved_amount), currency: refund.payment.currency, provider: refund.payment.provider }) });
  if (!response.ok) throw createHttpError(502, 'Refund provider request failed');
  return response.json();
};

export const decideRefund = async (refundId, adminId, payload) => {
  const refund = await queries.findRefundRequest(refundId);
  if (!refund) throw createHttpError(404, 'Refund request not found');
  if (refund.status !== 'pending') throw createHttpError(409, 'Refund request has already been reviewed');
  if (payload.action === 'reject') return queries.updateRefundRequest(refundId, { status: 'rejected', reviewed_by: adminId, reviewed_at: new Date().toISOString(), failure_reason: payload.reason ?? 'Rejected by reviewer' });
  const approvedAmount = payload.approvedAmount ?? Number(refund.requested_amount);
  if (approvedAmount > Number(refund.requested_amount)) throw createHttpError(400, 'Approved amount exceeds requested amount');
  let approved = await queries.updateRefundRequest(refundId, { status: 'processing', approved_amount: approvedAmount, reviewed_by: adminId, reviewed_at: new Date().toISOString() });
  try {
    const providerResult = await callRefundProvider({ ...refund, approved_amount: approvedAmount });
    if (refund.booking?.status === 'refund_pending') await queries.completeRefund(refund.payment_id);
    else if (refund.payment?.status === 'refund_pending') await queries.completeStandaloneRefund(refund.payment_id);
    approved = await queries.updateRefundRequest(refundId, { status: 'completed', provider_refund_id: providerResult.id ?? providerResult.refundId ?? null, completed_at: new Date().toISOString(), metadata: providerResult });
    await notificationService.sendNotification(refund.user_id, { type: 'refund_processed', title: 'Refund completed', body: `Refund for booking ${refund.booking?.booking_reference ?? refund.booking_id} has been completed.`, payload: { bookingId: refund.booking_id, refundId } });
    return approved;
  } catch (error) {
    await queries.updateRefundRequest(refundId, { status: 'failed', failure_reason: error.message });
    throw error;
  }
};

export const sendIssuedTicketEmail = async (bookingId, userId) => {
  try { return await emailBookingTicket(bookingId, userId); } catch (error) { return { sent: false, reason: error.message }; }
};
