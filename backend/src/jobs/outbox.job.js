import { randomUUID } from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import * as notificationQueries from '../modules/notifications/notification.queries.js';
import * as operationQueries from '../modules/operations/operation.queries.js';
import { createETicketPdf } from '../modules/operations/document.service.js';
import { sendTicketEmail } from '../modules/operations/mail.service.js';
import * as adminQueries from '../modules/admin/admin.queries.js';

const workerId = `outbox-${randomUUID()}`;
let timer;
let running = false;

const notificationFor = (event) => {
  const bookingId = event.payload.bookingId;
  const messages = {
    BOOKING_CREATED: ['general', 'Booking created', `Booking ${bookingId} is awaiting payment.`],
    BOOKING_CANCELLED: ['booking_cancelled', 'Booking cancelled', `Booking ${bookingId} has been cancelled.`],
    CHECK_IN_COMPLETED: ['general', 'Online check-in completed', `A boarding pass is ready for booking ${bookingId}.`],
    FLIGHT_CHANGED: ['booking_confirmed', 'Flight changed', `The new itinerary for booking ${bookingId} is ready.`],
    PAYMENT_FAILED: ['payment_failed', 'Payment failed', `Payment for booking ${bookingId} failed.`],
    PAYMENT_SUCCEEDED: ['payment_success', 'Payment successful', `Booking ${bookingId} is confirmed and tickets are ready.`],
    REFUND_COMPLETED: ['refund_processed', 'Refund completed', `Refund for booking ${bookingId} has completed.`],
    REFUND_REQUIRED: ['general', 'Refund review required', `Booking ${bookingId} is awaiting refund processing.`],
  };
  return messages[event.event_type];
};

const dispatch = async (event) => {
  const message = notificationFor(event);
  if (message && event.payload.userId) {
    await notificationQueries.insertOnce({
      outbox_event_id: event.id,
      user_id: event.payload.userId,
      type: message[0],
      title: message[1],
      body: message[2],
      payload: event.payload,
    });
  }

  if (event.event_type === 'PAYMENT_SUCCEEDED' && event.payload.bookingId && event.payload.userId) {
    const booking = await operationQueries.findBooking(event.payload.bookingId, event.payload.userId);
    if (booking?.tickets?.length) {
      await sendTicketEmail({ booking, pdf: await createETicketPdf(booking) });
    }
  }

  if (event.event_type === 'FLIGHT_DELAYED' && event.payload.flightId) {
    const bookings = await adminQueries.findActiveBookingsByFlightId(event.payload.flightId);
    for (const booking of bookings) {
      await notificationQueries.insertOnce({
        outbox_event_id: event.id,
        user_id: booking.user_id,
        type: 'flight_delayed',
        title: 'Flight delayed',
        body: event.payload.message || 'Your flight departure time has changed.',
        payload: { bookingId: booking.id, flightId: event.payload.flightId },
      });
    }
  }

  if (event.event_type === 'FLIGHT_CANCELLED' && event.payload.flightId) {
    const bookings = await adminQueries.findBookingsByFlightId(event.payload.flightId);
    const users = [...new Set(bookings.map((booking) => booking.user_id))];
    for (const userId of users) {
      await notificationQueries.insertOnce({
        outbox_event_id: event.id,
        user_id: userId,
        type: 'flight_cancelled',
        title: 'Flight cancelled',
        body: 'Your flight has been cancelled. Refund processing follows the purchased fare policy.',
        payload: { flightId: event.payload.flightId },
      });
    }
  }
};

const runOnce = async () => {
  if (running) return;
  running = true;
  try {
    const { data: events, error } = await supabase.rpc('claim_outbox_events', {
      p_worker_id: workerId,
      p_limit: 20,
    });
    if (error) throw error;
    for (const event of events ?? []) {
      try {
        await dispatch(event);
        const { error: completeError } = await supabase.rpc('complete_outbox_event', {
          p_event_id: event.id,
          p_worker_id: workerId,
        });
        if (completeError) throw completeError;
      } catch (dispatchError) {
        await supabase.rpc('fail_outbox_event', {
          p_event_id: event.id,
          p_worker_id: workerId,
          p_error: dispatchError.message,
        });
        logger.warn(Number(event.attempts) >= 8 ? 'dead_letter_event' : 'outbox_retry', {
          outbox_event_id: event.id,
          event_type: event.event_type,
          attempts: event.attempts,
          error: dispatchError.message,
        });
      }
    }
  } catch (error) {
    logger.error('outbox_worker_failed', { error: error.message });
  } finally {
    running = false;
  }
};

export const startOutboxJob = () => {
  if (env.nodeEnv === 'test' || timer) return;
  void runOnce();
  timer = setInterval(() => void runOnce(), env.outboxPollIntervalMs);
  timer.unref();
};
