import { supabase } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';

const FLIGHT_RELATIONS = `
  id, route_id, airline_id, aircraft_id, flight_number, departure_time, arrival_time,
  scheduled_departure_time, scheduled_arrival_time, actual_departure_time, actual_arrival_time,
  status, gate, terminal, baggage_carousel, delay_reason, base_price, available_seats,
  airline:airlines!flights_airline_id_fkey(id, code, name, logo_url),
  aircraft:aircrafts!flights_aircraft_id_fkey(id, code, model, total_seats),
  origin_airport:airports!flights_origin_airport_id_fkey(id, code, name, city, timezone),
  destination_airport:airports!flights_destination_airport_id_fkey(id, code, name, city, timezone)
`;

export const findBooking = async (bookingId, userId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id, booking_reference, user_id, flight_id, fare_id, price_snapshot, total_price, status,
      contact_email, contact_phone, created_at, updated_at,
      flight:flights!bookings_flight_id_fkey(${FLIGHT_RELATIONS}),
      fare:fare_classes(id, code, name, cabin_class, change_allowed, change_fee, refundable,
        cancellation_fee, checked_baggage_kg, cabin_baggage_kg, priority_boarding),
      passengers(id, first_name, last_name, date_of_birth, gender, nationality, passport_number, passenger_type),
      booking_seats(id, passenger_id, seat_id, seat:seats!booking_seats_seat_id_fkey(id, seat_number, seat_class, price)),
      tickets(id, ticket_number, passenger_id, flight_id, status, issued_at),
      check_ins(id, passenger_id, ticket_id, seat_id, boarding_sequence, boarding_pass_number, status, checked_in_at),
      flight_change_requests(id, old_flight_id, new_flight_id, fare_difference, change_fee, additional_amount, refund_amount, status, quote_expires_at, created_at),
      refund_requests(id, payment_id, reason, requested_amount, approved_amount, provider_refund_id, status, failure_reason, created_at, updated_at),
      booking_ancillaries(id, passenger_id, ancillary_service_id, quantity, price_snapshot, status, details,
        service:ancillary_services!booking_ancillaries_ancillary_service_id_fkey(id, code, type, name))
    `)
    .eq('id', bookingId)
    .eq('user_id', userId)
    .maybeSingle();
  throwDatabaseError(error, 'Unable to load booking operations');
  return data;
};

export const findTicket = async (ticketId, userId) => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      id, ticket_number, booking_id, passenger_id, flight_id, status, issued_at,
      passenger:passengers!tickets_passenger_id_fkey(id, first_name, last_name, date_of_birth, nationality, passport_number),
      booking:bookings!tickets_booking_id_fkey(id, booking_reference, user_id, contact_email),
      flight:flights!tickets_flight_id_fkey(${FLIGHT_RELATIONS})
    `)
    .eq('id', ticketId)
    .maybeSingle();
  throwDatabaseError(error, 'Unable to load ticket');
  return data?.booking?.user_id === userId ? data : null;
};

export const checkInPassenger = async (bookingId, passengerId, userId, documentConfirmed, seatId = null) => {
  const { data, error } = await supabase.rpc('check_in_passenger', {
    p_booking_id: bookingId,
    p_passenger_id: passengerId,
    p_user_id: userId,
    p_document_confirmed: documentConfirmed,
    p_seat_id: seatId,
  });
  throwDatabaseError(error, error?.message || 'Unable to check in passenger');
  return data;
};

export const findCheckIn = async (checkInId, userId) => {
  const { data, error } = await supabase
    .from('check_ins')
    .select(`
      id, booking_id, passenger_id, flight_id, ticket_id, seat_id, boarding_sequence,
      boarding_pass_number, qr_payload, status, checked_in_at,
      passenger:passengers!check_ins_passenger_id_fkey(id, first_name, last_name),
      ticket:tickets!check_ins_ticket_id_fkey(id, ticket_number),
      seat:seats!check_ins_seat_id_fkey(id, seat_number, seat_class),
      booking:bookings!check_ins_booking_id_fkey(id, booking_reference, user_id),
      flight:flights!check_ins_flight_id_fkey(${FLIGHT_RELATIONS})
    `)
    .eq('id', checkInId)
    .maybeSingle();
  throwDatabaseError(error, 'Unable to load boarding pass');
  return data?.booking?.user_id === userId ? data : null;
};

export const findFaresForFlight = async (flightId) => {
  const { data: flight, error: flightError } = await supabase
    .from('flights')
    .select('id, airline_id, route_id')
    .eq('id', flightId)
    .maybeSingle();
  throwDatabaseError(flightError, 'Unable to load flight');
  if (!flight) return [];
  const { data, error } = await supabase
    .from('fare_classes')
    .select('*')
    .eq('is_active', true)
    .or(`airline_id.is.null,airline_id.eq.${flight.airline_id}`)
    .order('price_multiplier');
  throwDatabaseError(error, 'Unable to load fare classes');
  return (data ?? []).filter((fare) => !fare.route_id || fare.route_id === flight.route_id);
};

export const setBookingFare = async (bookingId, userId, fareId) => {
  const { data: id, error } = await supabase.rpc('set_booking_fare', {
    p_booking_id: bookingId, p_user_id: userId, p_fare_id: fareId,
  });
  throwDatabaseError(error, 'Unable to set booking fare');
  const { data, error: loadError } = await supabase.from('bookings').select('id, fare_id, price_snapshot, total_price, fare:fare_classes(*)').eq('id', id).single();
  throwDatabaseError(loadError, 'Unable to load booking fare');
  return data;
};

export const findChangeOptions = async (booking, from, to) => {
  const { data, error } = await supabase
    .from('flights')
    .select(FLIGHT_RELATIONS)
    .eq('origin_airport_id', booking.flight.origin_airport.id)
    .eq('destination_airport_id', booking.flight.destination_airport.id)
    .in('status', ['scheduled', 'delayed'])
    .gt('departure_time', new Date().toISOString())
    .gte('available_seats', booking.passengers.length)
    .neq('id', booking.flight_id)
    .range(from, to)
    .order('departure_time');
  throwDatabaseError(error, 'Unable to load change options');
  return data ?? [];
};

export const insertChangeRequest = async (payload) => {
  const { data, error } = await supabase
    .from('flight_change_requests')
    .insert(payload)
    .select('*')
    .single();
  throwDatabaseError(error, 'Unable to create flight change quote');
  return data;
};

export const findChangeRequest = async (requestId, userId) => {
  const { data, error } = await supabase
    .from('flight_change_requests')
    .select('*')
    .eq('id', requestId)
    .eq('user_id', userId)
    .maybeSingle();
  throwDatabaseError(error, 'Unable to load flight change quote');
  return data;
};

export const updateChangeRequest = async (requestId, userId, payload) => {
  const { data, error } = await supabase
    .from('flight_change_requests')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('user_id', userId)
    .select('*')
    .single();
  throwDatabaseError(error, 'Unable to update flight change quote');
  return data;
};

export const applyFlightChange = async (requestId, userId) => {
  const { data, error } = await supabase.rpc('apply_flight_change', {
    p_request_id: requestId,
    p_user_id: userId,
  });
  throwDatabaseError(error, error?.message || 'Unable to apply flight change');
  return data;
};

export const findPublishedContent = async ({ type, slug }) => {
  let query = supabase
    .from('cms_contents')
    .select('id, type, slug, title, summary, body, image_url, metadata, published_at, updated_at')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false });
  if (type) query = query.eq('type', type);
  if (slug) query = query.eq('slug', slug);
  const { data, error } = await query;
  throwDatabaseError(error, 'Unable to load content');
  return data ?? [];
};

export const findFlightStatus = async ({ flightNumber, departureDate }) => {
  let query = supabase.from('flights').select(`${FLIGHT_RELATIONS}, flight_status_events(*)`).eq('flight_number', flightNumber);
  if (departureDate) {
    query = query.gte('departure_time', `${departureDate}T00:00:00.000Z`).lt('departure_time', `${departureDate}T23:59:59.999Z`);
  }
  const { data, error } = await query.order('departure_time').limit(20);
  throwDatabaseError(error, 'Unable to load flight status');
  return data ?? [];
};

export const findAncillaries = async () => {
  const { data, error } = await supabase.from('ancillary_services').select('*').eq('is_active', true).order('type');
  throwDatabaseError(error, 'Unable to load ancillary services');
  return data ?? [];
};

export const purchaseAncillary = async (payload) => {
  const { data: id, error } = await supabase.rpc('add_booking_ancillary', {
    p_booking_id: payload.bookingId,
    p_user_id: payload.userId,
    p_service_id: payload.ancillaryServiceId,
    p_passenger_id: payload.passengerId,
    p_quantity: payload.quantity,
    p_details: payload.details,
  });
  throwDatabaseError(error, 'Unable to add ancillary service');
  const { data, error: loadError } = await supabase.from('booking_ancillaries').select('*, service:ancillary_services(*)').eq('id', id).single();
  throwDatabaseError(loadError, 'Unable to load ancillary service');
  return data;
};

export const createSupportTicket = async (payload) => {
  const { data, error } = await supabase.from('support_tickets').insert(payload).select('*').single();
  throwDatabaseError(error, 'Unable to create support ticket');
  return data;
};

export const findSupportTickets = async (userId) => {
  const { data, error } = await supabase.from('support_tickets').select('*, support_messages(id, sender_id, body, created_at)').eq('user_id', userId).order('created_at', { ascending: false });
  throwDatabaseError(error, 'Unable to load support tickets');
  return data ?? [];
};

export const addSupportMessage = async (payload) => {
  const { data, error } = await supabase.from('support_messages').insert(payload).select('*').single();
  throwDatabaseError(error, 'Unable to add support message');
  return data;
};

export const findSupportTicketById = async (ticketId) => {
  const { data, error } = await supabase.from('support_tickets').select('*').eq('id', ticketId).maybeSingle();
  throwDatabaseError(error, 'Unable to load support ticket');
  return data;
};

export const getAdminResource = async (resource) => {
  const relations = {
    routes: '*, origin_airport:airports!routes_origin_airport_id_fkey(id, code, city), destination_airport:airports!routes_destination_airport_id_fkey(id, code, city)',
    flight_schedules: '*, route:routes(id, code), airline:airlines(id, code, name), aircraft:aircrafts(id, code, model)',
    fare_classes: '*, airline:airlines(id, code, name), route:routes(id, code)',
    refund_requests: '*, booking:bookings(id, booking_reference, contact_email), payment:payments(id, provider, transaction_ref, amount)',
    support_tickets: '*, booking:bookings(id, booking_reference), support_messages(id, sender_id, body, is_internal, created_at)',
    cms_contents: '*', ancillary_services: '*', flight_status_events: '*, flight:flights(id, flight_number, departure_time)',
  };
  const { data, error } = await supabase.from(resource).select(relations[resource] ?? '*').order('created_at', { ascending: false }).limit(500);
  throwDatabaseError(error, 'Unable to load operations resource');
  return data ?? [];
};

export const insertAdminResource = async (resource, payload) => {
  const { data, error } = await supabase.from(resource).insert(payload).select('*').single();
  throwDatabaseError(error, 'Unable to create operations resource');
  return data;
};

export const updateAdminResource = async (resource, id, payload) => {
  const { data, error } = await supabase.from(resource).update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
  throwDatabaseError(error, 'Unable to update operations resource');
  return data;
};

export const syncFlightStatus = async (event) => {
  const payload = {
    status: event.status,
    gate: event.gate ?? null,
    terminal: event.terminal ?? null,
    baggage_carousel: event.baggage_carousel ?? null,
    delay_reason: event.status === 'delayed' ? event.message ?? null : null,
    ...(event.estimated_departure_time && { departure_time: event.estimated_departure_time }),
    ...(event.estimated_arrival_time && { arrival_time: event.estimated_arrival_time }),
    ...(event.status === 'departed' && { actual_departure_time: new Date().toISOString() }),
    ...(event.status === 'arrived' && { actual_arrival_time: new Date().toISOString() }),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('flights').update(payload).eq('id', event.flight_id);
  throwDatabaseError(error, 'Unable to synchronize flight status');
};

export const findRefundRequest = async (id) => {
  const { data, error } = await supabase.from('refund_requests').select('*, payment:payments(*), booking:bookings(*)').eq('id', id).maybeSingle();
  throwDatabaseError(error, 'Unable to load refund request');
  return data;
};

export const updateRefundRequest = async (id, payload) => updateAdminResource('refund_requests', id, payload);

export const completeRefund = async (paymentId) => {
  const { data, error } = await supabase.rpc('process_payment_refund', { p_payment_id: paymentId });
  throwDatabaseError(error, 'Unable to complete refund');
  return data;
};

export const completeStandaloneRefund = async (paymentId) => {
  const { data, error } = await supabase.from('payments').update({ status: 'refunded', updated_at: new Date().toISOString() }).eq('id', paymentId).eq('status', 'refund_pending').select('id, status').maybeSingle();
  throwDatabaseError(error, 'Unable to complete standalone refund');
  return data;
};

export const findPaymentIntentByReference = async (reference) => {
  const { data, error } = await supabase.from('payments').select('*').eq('transaction_ref', reference).maybeSingle();
  throwDatabaseError(error, 'Unable to load payment');
  return data;
};

export const processChangeWebhook = async (reference, status, rawPayload) => {
  const { data, error } = await supabase.rpc('process_change_payment_webhook', { p_transaction_ref: reference, p_status: status, p_raw_payload: rawPayload });
  throwDatabaseError(error, 'Unable to process change payment');
  return data;
};
