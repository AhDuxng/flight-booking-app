-- Complete MVP operations: network planning, fare families, ticketing, check-in,
-- flight changes, refunds, live operations, CMS, support and ancillary services.
-- This migration is additive and backfills the existing single-flight model.

CREATE SEQUENCE IF NOT EXISTS public.ticket_number_seq START 1000000001;

CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_airport_id UUID NOT NULL REFERENCES public.airports(id) ON DELETE RESTRICT,
  destination_airport_id UUID NOT NULL REFERENCES public.airports(id) ON DELETE RESTRICT,
  code TEXT NOT NULL UNIQUE,
  default_duration_minutes INTEGER NOT NULL CHECK (default_duration_minutes > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (origin_airport_id, destination_airport_id),
  CHECK (origin_airport_id <> destination_airport_id)
);

CREATE TABLE IF NOT EXISTS public.flight_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE RESTRICT,
  airline_id UUID NOT NULL REFERENCES public.airlines(id) ON DELETE RESTRICT,
  aircraft_id UUID NOT NULL REFERENCES public.aircrafts(id) ON DELETE RESTRICT,
  flight_number TEXT NOT NULL,
  departure_local_time TIME NOT NULL,
  arrival_day_offset SMALLINT NOT NULL DEFAULT 0 CHECK (arrival_day_offset BETWEEN 0 AND 2),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  days_of_week SMALLINT[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6,7]::SMALLINT[],
  start_date DATE NOT NULL,
  end_date DATE,
  base_price NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
  seat_template JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (flight_number, route_id, departure_local_time, start_date),
  CHECK (end_date IS NULL OR end_date >= start_date),
  CHECK (days_of_week <@ ARRAY[1,2,3,4,5,6,7]::SMALLINT[])
);

ALTER TABLE public.flights ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES public.routes(id) ON DELETE RESTRICT;
ALTER TABLE public.flights ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES public.flight_schedules(id) ON DELETE SET NULL;
ALTER TABLE public.flights ADD COLUMN IF NOT EXISTS scheduled_departure_time TIMESTAMPTZ;
ALTER TABLE public.flights ADD COLUMN IF NOT EXISTS scheduled_arrival_time TIMESTAMPTZ;
ALTER TABLE public.flights ADD COLUMN IF NOT EXISTS actual_departure_time TIMESTAMPTZ;
ALTER TABLE public.flights ADD COLUMN IF NOT EXISTS actual_arrival_time TIMESTAMPTZ;
ALTER TABLE public.flights ADD COLUMN IF NOT EXISTS gate TEXT;
ALTER TABLE public.flights ADD COLUMN IF NOT EXISTS terminal TEXT;
ALTER TABLE public.flights ADD COLUMN IF NOT EXISTS baggage_carousel TEXT;
ALTER TABLE public.flights ADD COLUMN IF NOT EXISTS delay_reason TEXT;

INSERT INTO public.routes (origin_airport_id, destination_airport_id, code, default_duration_minutes)
SELECT DISTINCT
  f.origin_airport_id,
  f.destination_airport_id,
  origin.code || '-' || destination.code,
  GREATEST(1, CEIL(EXTRACT(EPOCH FROM (f.arrival_time - f.departure_time)) / 60)::INTEGER)
FROM public.flights f
JOIN public.airports origin ON origin.id = f.origin_airport_id
JOIN public.airports destination ON destination.id = f.destination_airport_id
ON CONFLICT (origin_airport_id, destination_airport_id) DO NOTHING;

UPDATE public.flights f
SET route_id = r.id,
    scheduled_departure_time = COALESCE(f.scheduled_departure_time, f.departure_time),
    scheduled_arrival_time = COALESCE(f.scheduled_arrival_time, f.arrival_time)
FROM public.routes r
WHERE f.route_id IS NULL
  AND r.origin_airport_id = f.origin_airport_id
  AND r.destination_airport_id = f.destination_airport_id;

CREATE TABLE IF NOT EXISTS public.fare_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airline_id UUID REFERENCES public.airlines(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  cabin_class TEXT NOT NULL CHECK (cabin_class IN ('economy', 'business', 'first')),
  price_multiplier NUMERIC(6,3) NOT NULL DEFAULT 1 CHECK (price_multiplier > 0),
  change_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  change_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (change_fee >= 0),
  refundable BOOLEAN NOT NULL DEFAULT FALSE,
  cancellation_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cancellation_fee >= 0),
  checked_baggage_kg INTEGER NOT NULL DEFAULT 0 CHECK (checked_baggage_kg >= 0),
  cabin_baggage_kg INTEGER NOT NULL DEFAULT 7 CHECK (cabin_baggage_kg >= 0),
  priority_boarding BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_fare_scope_code ON public.fare_classes(COALESCE(airline_id, '00000000-0000-0000-0000-000000000000'::UUID), COALESCE(route_id, '00000000-0000-0000-0000-000000000000'::UUID), code);

INSERT INTO public.fare_classes (code, name, cabin_class, price_multiplier, change_allowed, change_fee, refundable, cancellation_fee, checked_baggage_kg, cabin_baggage_kg, priority_boarding)
VALUES
  ('ECO-LITE', 'Economy Lite', 'economy', 1.000, TRUE, 350000, FALSE, 500000, 0, 7, FALSE),
  ('ECO-CLASSIC', 'Economy Classic', 'economy', 1.150, TRUE, 200000, TRUE, 300000, 20, 7, FALSE),
  ('ECO-FLEX', 'Economy Flex', 'economy', 1.350, TRUE, 0, TRUE, 100000, 23, 10, TRUE),
  ('BUS-FLEX', 'Business Flex', 'business', 1.000, TRUE, 0, TRUE, 0, 32, 12, TRUE)
ON CONFLICT DO NOTHING;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_reference TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS fare_id UUID REFERENCES public.fare_classes(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_reference ON public.bookings(booking_reference) WHERE booking_reference IS NOT NULL;
UPDATE public.bookings SET booking_reference = UPPER(SUBSTRING(REPLACE(id::TEXT, '-', '') FROM 1 FOR 6)) WHERE booking_reference IS NULL;
UPDATE public.bookings SET fare_id = (SELECT id FROM public.fare_classes WHERE code = 'ECO-LITE' AND airline_id IS NULL AND route_id IS NULL LIMIT 1) WHERE fare_id IS NULL;

CREATE OR REPLACE FUNCTION public.assign_booking_defaults()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.booking_reference IS NULL THEN
    NEW.booking_reference := UPPER(SUBSTRING(ENCODE(gen_random_bytes(6), 'hex') FROM 1 FOR 6));
  END IF;
  IF NEW.fare_id IS NULL THEN
    SELECT id INTO NEW.fare_id FROM public.fare_classes
    WHERE code = 'ECO-LITE' AND airline_id IS NULL AND route_id IS NULL LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS bookings_assign_defaults ON public.bookings;
CREATE TRIGGER bookings_assign_defaults BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.assign_booking_defaults();

CREATE OR REPLACE FUNCTION public.set_booking_fare(p_booking_id UUID, p_user_id UUID, p_fare_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_booking public.bookings%ROWTYPE; v_old_multiplier NUMERIC := 1; v_fare public.fare_classes%ROWTYPE; v_flight public.flights%ROWTYPE; v_new_price NUMERIC(12,2);
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_booking.status <> 'pending' OR v_booking.hold_expires_at <= NOW() THEN RAISE EXCEPTION 'Fare can only be changed on an active unpaid booking' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_flight FROM public.flights WHERE id = v_booking.flight_id;
  SELECT COALESCE(price_multiplier, 1) INTO v_old_multiplier FROM public.fare_classes WHERE id = v_booking.fare_id;
  v_old_multiplier := COALESCE(v_old_multiplier, 1);
  SELECT * INTO v_fare FROM public.fare_classes WHERE id = p_fare_id AND is_active = TRUE
    AND (airline_id IS NULL OR airline_id = v_flight.airline_id) AND (route_id IS NULL OR route_id = v_flight.route_id);
  IF NOT FOUND THEN RAISE EXCEPTION 'Fare is not valid for this flight' USING ERRCODE = 'P0002'; END IF;
  v_new_price := ROUND(v_booking.price_snapshot / NULLIF(v_old_multiplier, 0) * v_fare.price_multiplier, 0);
  UPDATE public.bookings SET fare_id = v_fare.id, price_snapshot = v_new_price,
    total_price = total_price - v_booking.price_snapshot + v_new_price, updated_at = NOW()
  WHERE id = v_booking.id;
  RETURN v_booking.id;
END;
$$;

CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES public.passengers(id) ON DELETE CASCADE,
  flight_id UUID NOT NULL REFERENCES public.flights(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'reissued', 'void', 'used', 'refunded')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reissued_from_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_ticket_per_passenger ON public.tickets(booking_id, passenger_id) WHERE status IN ('issued', 'reissued');

CREATE OR REPLACE FUNCTION public.issue_booking_tickets()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.tickets (ticket_number, booking_id, passenger_id, flight_id)
    SELECT '738' || LPAD(nextval('public.ticket_number_seq')::TEXT, 10, '0'), NEW.id, p.id, NEW.flight_id
    FROM public.passengers p WHERE p.booking_id = NEW.id
    ON CONFLICT DO NOTHING;
  END IF;
  IF NEW.status IN ('refunded', 'cancelled') AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE public.tickets SET status = CASE WHEN NEW.status = 'refunded' THEN 'refunded' ELSE 'void' END, updated_at = NOW()
    WHERE booking_id = NEW.id AND status IN ('issued', 'reissued');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS bookings_issue_tickets ON public.bookings;
CREATE TRIGGER bookings_issue_tickets AFTER UPDATE OF status ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.issue_booking_tickets();

INSERT INTO public.tickets (ticket_number, booking_id, passenger_id, flight_id)
SELECT '738' || LPAD(nextval('public.ticket_number_seq')::TEXT, 10, '0'), b.id, p.id, b.flight_id
FROM public.bookings b JOIN public.passengers p ON p.booking_id = b.id
WHERE b.status = 'confirmed'
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES public.passengers(id) ON DELETE CASCADE,
  flight_id UUID NOT NULL REFERENCES public.flights(id) ON DELETE RESTRICT,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE RESTRICT,
  seat_id UUID NOT NULL REFERENCES public.seats(id) ON DELETE RESTRICT,
  document_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  boarding_sequence INTEGER NOT NULL,
  boarding_pass_number TEXT NOT NULL UNIQUE,
  qr_payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'boarded', 'offloaded')),
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  boarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (passenger_id, flight_id)
);

CREATE OR REPLACE FUNCTION public.check_in_passenger(p_booking_id UUID, p_passenger_id UUID, p_user_id UUID, p_document_confirmed BOOLEAN, p_seat_id UUID DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_flight public.flights%ROWTYPE;
  v_ticket public.tickets%ROWTYPE;
  v_seat_id UUID;
  v_check_in_id UUID;
  v_sequence INTEGER;
  v_pass_number TEXT;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_booking.status <> 'confirmed' THEN RAISE EXCEPTION 'Confirmed booking not found' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_flight FROM public.flights WHERE id = v_booking.flight_id FOR UPDATE;
  IF NOW() < v_flight.departure_time - INTERVAL '24 hours' THEN RAISE EXCEPTION 'Online check-in opens 24 hours before departure' USING ERRCODE = 'P0002'; END IF;
  IF NOW() > v_flight.departure_time - INTERVAL '45 minutes' OR v_flight.status NOT IN ('scheduled','delayed','boarding') THEN RAISE EXCEPTION 'Online check-in is closed' USING ERRCODE = 'P0002'; END IF;
  IF NOT p_document_confirmed THEN RAISE EXCEPTION 'Travel document confirmation is required' USING ERRCODE = 'P0002'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.passengers WHERE id = p_passenger_id AND booking_id = p_booking_id) THEN RAISE EXCEPTION 'Passenger not found' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_ticket FROM public.tickets WHERE booking_id = p_booking_id AND passenger_id = p_passenger_id AND status IN ('issued','reissued') ORDER BY issued_at DESC LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active ticket not found' USING ERRCODE = 'P0002'; END IF;
  SELECT bs.seat_id INTO v_seat_id FROM public.booking_seats bs WHERE bs.booking_id = p_booking_id AND bs.passenger_id = p_passenger_id;
  IF v_seat_id IS NULL THEN RAISE EXCEPTION 'Passenger seat not found' USING ERRCODE = 'P0002'; END IF;
  IF p_seat_id IS NOT NULL AND p_seat_id <> v_seat_id THEN
    PERFORM id FROM public.seats WHERE id = p_seat_id AND flight_id = v_flight.id AND status = 'available' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Requested check-in seat is not available' USING ERRCODE = 'P0001'; END IF;
    UPDATE public.seats SET status = 'available', booking_id = NULL, hold_expires_at = NULL, updated_at = NOW() WHERE id = v_seat_id;
    UPDATE public.seats SET status = 'booked', booking_id = p_booking_id, hold_expires_at = NULL, updated_at = NOW() WHERE id = p_seat_id;
    UPDATE public.booking_seats SET seat_id = p_seat_id WHERE booking_id = p_booking_id AND passenger_id = p_passenger_id;
    v_seat_id := p_seat_id;
  END IF;
  SELECT COALESCE(MAX(boarding_sequence), 0) + 1 INTO v_sequence FROM public.check_ins WHERE flight_id = v_flight.id;
  v_pass_number := UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 12));
  INSERT INTO public.check_ins (booking_id, passenger_id, flight_id, ticket_id, seat_id, document_confirmed, boarding_sequence, boarding_pass_number, qr_payload)
  VALUES (p_booking_id, p_passenger_id, v_flight.id, v_ticket.id, v_seat_id, TRUE, v_sequence, v_pass_number,
    jsonb_build_object('boardingPass', v_pass_number, 'ticket', v_ticket.ticket_number, 'flight', v_flight.flight_number, 'passenger', p_passenger_id)::TEXT)
  ON CONFLICT (passenger_id, flight_id) DO UPDATE SET document_confirmed = TRUE, updated_at = NOW()
  RETURNING id INTO v_check_in_id;
  RETURN v_check_in_id;
END;
$$;

CREATE TABLE IF NOT EXISTS public.flight_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_flight_id UUID NOT NULL REFERENCES public.flights(id) ON DELETE RESTRICT,
  new_flight_id UUID NOT NULL REFERENCES public.flights(id) ON DELETE RESTRICT,
  fare_id UUID REFERENCES public.fare_classes(id) ON DELETE SET NULL,
  old_total NUMERIC(12,2) NOT NULL,
  new_fare_total NUMERIC(12,2) NOT NULL,
  fare_difference NUMERIC(12,2) NOT NULL,
  change_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  additional_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  refund_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'quoted' CHECK (status IN ('quoted','pending_payment','completed','expired','cancelled','failed')),
  quote_expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '15 minutes',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'booking' CHECK (purpose IN ('booking','flight_change'));
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS change_request_id UUID REFERENCES public.flight_change_requests(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS checkout_url TEXT;

CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  requested_amount NUMERIC(12,2) NOT NULL CHECK (requested_amount >= 0),
  approved_amount NUMERIC(12,2) CHECK (approved_amount >= 0),
  provider_refund_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','processing','completed','rejected','failed')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_open_refund_per_payment ON public.refund_requests(payment_id) WHERE status IN ('pending','approved','processing');

CREATE OR REPLACE FUNCTION public.apply_flight_change(p_request_id UUID, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_request public.flight_change_requests%ROWTYPE;
  v_booking public.bookings%ROWTYPE;
  v_new_flight public.flights%ROWTYPE;
  v_old_flight_id UUID;
  v_passenger RECORD;
  v_new_seat public.seats%ROWTYPE;
  v_old_seat_id UUID;
  v_count INTEGER := 0;
  v_required INTEGER := 0;
BEGIN
  SELECT * INTO v_request FROM public.flight_change_requests WHERE id = p_request_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_request.status NOT IN ('quoted','pending_payment') OR v_request.quote_expires_at <= NOW() THEN RAISE EXCEPTION 'Flight change quote is unavailable' USING ERRCODE = 'P0002'; END IF;
  IF v_request.additional_amount > 0 AND NOT EXISTS (SELECT 1 FROM public.payments WHERE change_request_id = v_request.id AND status = 'success') THEN RAISE EXCEPTION 'Additional payment is required' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_booking FROM public.bookings WHERE id = v_request.booking_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_booking.status <> 'confirmed' THEN RAISE EXCEPTION 'Booking cannot be changed' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_new_flight FROM public.flights WHERE id = v_request.new_flight_id AND departure_time > NOW() AND status IN ('scheduled','delayed') FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'New flight is no longer available' USING ERRCODE = 'P0001'; END IF;
  SELECT COUNT(*) INTO v_required FROM public.passengers WHERE booking_id = v_booking.id;
  IF v_new_flight.available_seats < v_required THEN RAISE EXCEPTION 'New flight has insufficient seats' USING ERRCODE = 'P0001'; END IF;
  v_old_flight_id := v_booking.flight_id;
  FOR v_passenger IN SELECT p.id, s.seat_class FROM public.passengers p JOIN public.booking_seats bs ON bs.passenger_id = p.id AND bs.booking_id = v_booking.id JOIN public.seats s ON s.id = bs.seat_id WHERE p.booking_id = v_booking.id ORDER BY p.created_at LOOP
    SELECT * INTO v_new_seat FROM public.seats WHERE flight_id = v_new_flight.id AND status = 'available' AND seat_class = v_passenger.seat_class ORDER BY seat_number FOR UPDATE SKIP LOCKED LIMIT 1;
    IF NOT FOUND THEN SELECT * INTO v_new_seat FROM public.seats WHERE flight_id = v_new_flight.id AND status = 'available' ORDER BY seat_number FOR UPDATE SKIP LOCKED LIMIT 1; END IF;
    IF NOT FOUND THEN RAISE EXCEPTION 'New flight has insufficient seats' USING ERRCODE = 'P0001'; END IF;
    SELECT seat_id INTO v_old_seat_id FROM public.booking_seats WHERE booking_id = v_booking.id AND passenger_id = v_passenger.id FOR UPDATE;
    UPDATE public.seats SET status = 'available', booking_id = NULL, hold_expires_at = NULL, updated_at = NOW() WHERE id = v_old_seat_id;
    UPDATE public.seats SET status = 'booked', booking_id = v_booking.id, hold_expires_at = NULL, updated_at = NOW() WHERE id = v_new_seat.id;
    UPDATE public.booking_seats SET seat_id = v_new_seat.id WHERE booking_id = v_booking.id AND passenger_id = v_passenger.id;
    v_count := v_count + 1;
  END LOOP;
  UPDATE public.flights SET available_seats = available_seats + v_count, updated_at = NOW() WHERE id = v_old_flight_id;
  UPDATE public.flights SET available_seats = available_seats - v_count, updated_at = NOW() WHERE id = v_new_flight.id;
  UPDATE public.tickets SET status = 'void', updated_at = NOW() WHERE booking_id = v_booking.id AND status IN ('issued','reissued');
  UPDATE public.check_ins SET status = 'offloaded', updated_at = NOW() WHERE booking_id = v_booking.id AND status = 'checked_in';
  UPDATE public.bookings SET flight_id = v_new_flight.id, fare_id = v_request.fare_id, price_snapshot = v_request.new_fare_total, total_price = total_price + v_request.additional_amount - v_request.refund_amount, updated_at = NOW() WHERE id = v_booking.id;
  INSERT INTO public.tickets (ticket_number, booking_id, passenger_id, flight_id, status)
  SELECT '738' || LPAD(nextval('public.ticket_number_seq')::TEXT, 10, '0'), v_booking.id, p.id, v_new_flight.id, 'reissued' FROM public.passengers p WHERE p.booking_id = v_booking.id;
  UPDATE public.flight_change_requests SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = v_request.id;
  IF v_request.refund_amount > 0 THEN
    INSERT INTO public.refund_requests (booking_id, payment_id, user_id, reason, requested_amount, metadata)
    SELECT v_booking.id, p.id, v_booking.user_id, 'Fare difference after flight change', v_request.refund_amount,
      jsonb_build_object('partial', TRUE, 'changeRequestId', v_request.id)
    FROM public.payments p WHERE p.booking_id = v_booking.id AND p.purpose = 'booking' AND p.status = 'success'
    ORDER BY p.paid_at DESC LIMIT 1
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN jsonb_build_object('request_id', v_request.id, 'booking_id', v_booking.id, 'old_flight_id', v_old_flight_id, 'new_flight_id', v_new_flight.id, 'status', 'completed');
END;
$$;

CREATE OR REPLACE FUNCTION public.process_change_payment_webhook(p_transaction_ref TEXT, p_status TEXT, p_raw_payload JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_payment public.payments%ROWTYPE; v_request public.flight_change_requests%ROWTYPE; v_result JSONB;
BEGIN
  SELECT * INTO v_payment FROM public.payments WHERE transaction_ref = p_transaction_ref AND purpose = 'flight_change' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Change payment not found' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_request FROM public.flight_change_requests WHERE id = v_payment.change_request_id FOR UPDATE;
  IF v_payment.status IN ('success','failed','refunded') THEN RETURN jsonb_build_object('processed', FALSE, 'payment_id', v_payment.id, 'booking_id', v_payment.booking_id, 'user_id', v_request.user_id, 'payment_status', v_payment.status, 'purpose', 'flight_change'); END IF;
  IF p_status = 'failed' THEN
    UPDATE public.payments SET status = 'failed', raw_payload = p_raw_payload, updated_at = NOW() WHERE id = v_payment.id;
    UPDATE public.flight_change_requests SET status = 'failed', updated_at = NOW() WHERE id = v_request.id;
    RETURN jsonb_build_object('processed', TRUE, 'payment_id', v_payment.id, 'booking_id', v_payment.booking_id, 'user_id', v_request.user_id, 'payment_status', 'failed', 'purpose', 'flight_change');
  END IF;
  UPDATE public.payments SET status = 'success', paid_at = NOW(), raw_payload = p_raw_payload, updated_at = NOW() WHERE id = v_payment.id;
  BEGIN
    v_result := public.apply_flight_change(v_request.id, v_request.user_id);
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.payments SET status = 'refund_pending', updated_at = NOW() WHERE id = v_payment.id;
    UPDATE public.flight_change_requests SET status = 'failed', updated_at = NOW() WHERE id = v_request.id;
    INSERT INTO public.refund_requests (booking_id, payment_id, user_id, reason, requested_amount, metadata)
    VALUES (v_payment.booking_id, v_payment.id, v_request.user_id, 'Flight change failed after payment', v_payment.amount,
      jsonb_build_object('partial', TRUE, 'changeRequestId', v_request.id, 'failure', SQLERRM))
    ON CONFLICT DO NOTHING;
    RETURN jsonb_build_object('processed', TRUE, 'payment_id', v_payment.id, 'booking_id', v_payment.booking_id,
      'user_id', v_request.user_id, 'payment_status', 'refund_pending', 'purpose', 'flight_change',
      'requires_refund', TRUE);
  END;
  RETURN v_result || jsonb_build_object('processed', TRUE, 'payment_id', v_payment.id, 'user_id', v_request.user_id, 'payment_status', 'success', 'purpose', 'flight_change');
END;
$$;

CREATE OR REPLACE FUNCTION public.create_refund_request_for_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_booking public.bookings%ROWTYPE; v_fare public.fare_classes%ROWTYPE; v_flight public.flights%ROWTYPE; v_amount NUMERIC(12,2);
BEGIN
  IF NEW.status = 'refund_pending' AND NEW.purpose = 'booking' AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT * INTO v_booking FROM public.bookings WHERE id = NEW.booking_id;
    SELECT * INTO v_fare FROM public.fare_classes WHERE id = v_booking.fare_id;
    SELECT * INTO v_flight FROM public.flights WHERE id = v_booking.flight_id;
    v_amount := CASE
      WHEN v_flight.status = 'cancelled' THEN NEW.amount
      WHEN COALESCE(v_fare.refundable, FALSE) THEN GREATEST(0, NEW.amount - COALESCE(v_fare.cancellation_fee, 0))
      ELSE 0
    END;
    INSERT INTO public.refund_requests (booking_id, payment_id, user_id, reason, requested_amount)
    VALUES (v_booking.id, NEW.id, v_booking.user_id, 'Booking or flight cancellation', v_amount)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS payments_create_refund_request ON public.payments;
CREATE TRIGGER payments_create_refund_request AFTER UPDATE OF status ON public.payments FOR EACH ROW EXECUTE FUNCTION public.create_refund_request_for_payment();

CREATE OR REPLACE FUNCTION public.enforce_nonrefundable_cancellation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_refundable BOOLEAN; v_flight_status TEXT;
BEGIN
  IF NEW.status = 'refund_pending' AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT COALESCE(fc.refundable, FALSE), f.status INTO v_refundable, v_flight_status
    FROM public.bookings b LEFT JOIN public.fare_classes fc ON fc.id = b.fare_id
    JOIN public.flights f ON f.id = b.flight_id WHERE b.id = NEW.id;
    IF NOT v_refundable AND v_flight_status <> 'cancelled' THEN
      UPDATE public.payments SET status = 'success', updated_at = NOW()
      WHERE booking_id = NEW.id AND purpose = 'booking' AND status = 'refund_pending';
      UPDATE public.refund_requests SET status = 'completed', approved_amount = 0, completed_at = NOW(),
        metadata = metadata || jsonb_build_object('nonRefundableFare', TRUE), updated_at = NOW()
      WHERE booking_id = NEW.id AND status = 'pending' AND requested_amount = 0;
      UPDATE public.bookings SET status = 'cancelled', updated_at = NOW() WHERE id = NEW.id AND status = 'refund_pending';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS bookings_enforce_nonrefundable_cancellation ON public.bookings;
CREATE TRIGGER bookings_enforce_nonrefundable_cancellation AFTER UPDATE OF status ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.enforce_nonrefundable_cancellation();

-- The legacy cancellation trigger runs BEFORE the flight row becomes cancelled.
-- Reclassify any non-refundable user-cancellation result as a full involuntary
-- refund once the cancelled flight status is visible.
CREATE OR REPLACE FUNCTION public.restore_involuntary_flight_refunds()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE public.refund_requests rr SET status = 'pending', requested_amount = p.amount,
      approved_amount = NULL, completed_at = NULL,
      metadata = (rr.metadata - 'nonRefundableFare') || jsonb_build_object('involuntary', TRUE), updated_at = NOW()
    FROM public.payments p
    WHERE rr.payment_id = p.id AND rr.booking_id IN (SELECT id FROM public.bookings WHERE flight_id = NEW.id)
      AND rr.status = 'completed' AND COALESCE((rr.metadata->>'nonRefundableFare')::BOOLEAN, FALSE);
    UPDATE public.payments SET status = 'refund_pending', updated_at = NOW()
    WHERE purpose = 'booking' AND status = 'success'
      AND booking_id IN (SELECT id FROM public.bookings WHERE flight_id = NEW.id AND status IN ('cancelled','confirmed','paid'));
    UPDATE public.bookings SET status = 'refund_pending', updated_at = NOW()
    WHERE flight_id = NEW.id AND status IN ('cancelled','confirmed','paid');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS flights_restore_involuntary_refunds ON public.flights;
CREATE TRIGGER flights_restore_involuntary_refunds AFTER UPDATE OF status ON public.flights FOR EACH ROW EXECUTE FUNCTION public.restore_involuntary_flight_refunds();

INSERT INTO public.refund_requests (booking_id, payment_id, user_id, reason, requested_amount)
SELECT b.id, p.id, b.user_id, 'Existing refund pending payment', p.amount
FROM public.payments p JOIN public.bookings b ON b.id = p.booking_id
WHERE p.status = 'refund_pending' ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.flight_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id UUID NOT NULL REFERENCES public.flights(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('scheduled','boarding','departed','arrived','cancelled','delayed')),
  message TEXT,
  gate TEXT,
  terminal TEXT,
  baggage_carousel TEXT,
  estimated_departure_time TIMESTAMPTZ,
  estimated_arrival_time TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cms_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('promotion','banner','faq','policy','news','terms')),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT NOT NULL,
  image_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE DEFAULT ('SUP-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 8))),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('booking','payment','refund','baggage','flight_change','other')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting_customer','resolved','closed')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sla_due_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ancillary_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('insurance','transfer','upgrade','pet')),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'VND',
  rules JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.booking_ancillaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  passenger_id UUID REFERENCES public.passengers(id) ON DELETE CASCADE,
  ancillary_service_id UUID NOT NULL REFERENCES public.ancillary_services(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 10),
  price_snapshot NUMERIC(12,2) NOT NULL CHECK (price_snapshot >= 0),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','cancelled','fulfilled')),
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.add_booking_ancillary(
  p_booking_id UUID, p_user_id UUID, p_service_id UUID, p_passenger_id UUID,
  p_quantity INTEGER, p_details JSONB
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_booking public.bookings%ROWTYPE; v_service public.ancillary_services%ROWTYPE; v_id UUID;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_booking.status <> 'pending' OR v_booking.hold_expires_at <= NOW() THEN RAISE EXCEPTION 'Ancillaries can only be added to an active unpaid booking' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_service FROM public.ancillary_services WHERE id = p_service_id AND is_active = TRUE FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ancillary service not found' USING ERRCODE = 'P0002'; END IF;
  IF p_quantity NOT BETWEEN 1 AND 10 THEN RAISE EXCEPTION 'Invalid quantity' USING ERRCODE = 'P0002'; END IF;
  IF p_passenger_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.passengers WHERE id = p_passenger_id AND booking_id = p_booking_id) THEN RAISE EXCEPTION 'Passenger not found' USING ERRCODE = 'P0002'; END IF;
  INSERT INTO public.booking_ancillaries (booking_id, passenger_id, ancillary_service_id, quantity, price_snapshot, status, details)
  VALUES (p_booking_id, p_passenger_id, p_service_id, p_quantity, v_service.price, 'confirmed', COALESCE(p_details, '{}'::JSONB)) RETURNING id INTO v_id;
  UPDATE public.bookings SET total_price = total_price + v_service.price * p_quantity, updated_at = NOW() WHERE id = p_booking_id;
  RETURN v_id;
END;
$$;

INSERT INTO public.ancillary_services (code, type, name, description, price, rules) VALUES
  ('TRAVEL-SAFE', 'insurance', 'Bảo hiểm hành trình', 'Bảo hiểm tai nạn và chậm chuyến cơ bản.', 99000, '{"perPassenger":true}'),
  ('AIRPORT-TRANSFER', 'transfer', 'Xe đưa đón sân bay', 'Xe riêng một chiều giữa sân bay và trung tâm thành phố.', 350000, '{"requiresAddress":true}'),
  ('CABIN-UPGRADE', 'upgrade', 'Yêu cầu nâng hạng', 'Yêu cầu nâng lên hạng ghế kế tiếp, tùy khả dụng.', 1200000, '{"subjectToAvailability":true}'),
  ('PET-CABIN', 'pet', 'Thú cưng trong cabin', 'Vận chuyển thú cưng nhỏ theo điều kiện khai thác.', 800000, '{"maxWeightKg":7,"requiresApproval":true}')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.cms_contents (type, slug, title, summary, body, status, published_at, metadata) VALUES
  ('faq', 'online-check-in', 'Khi nào có thể check-in trực tuyến?', 'Cửa sổ check-in trực tuyến', 'Check-in trực tuyến mở trước 24 giờ và đóng trước 45 phút so với giờ khởi hành.', 'published', NOW(), '{"order":1}'),
  ('policy', 'change-refund-policy', 'Chính sách đổi và hoàn vé', 'Điều kiện phụ thuộc hạng giá', 'Phí đổi, phí hủy và khả năng hoàn tiền được xác định theo hạng giá đã mua. Chênh lệch giá được xác nhận lại trước khi thanh toán.', 'published', NOW(), '{"order":2}')
ON CONFLICT (slug) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_routes_airports ON public.routes(origin_airport_id, destination_airport_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_schedule_flight_instance ON public.flights(schedule_id, scheduled_departure_time) WHERE schedule_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_schedules_generation ON public.flight_schedules(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tickets_booking ON public.tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_booking ON public.check_ins(booking_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_booking ON public.flight_change_requests(booking_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON public.refund_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_flight_events_flight ON public.flight_status_events(flight_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_public ON public.cms_contents(type, status, published_at);
CREATE INDEX IF NOT EXISTS idx_support_user ON public.support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_queue ON public.support_tickets(status, priority, sla_due_at);
CREATE INDEX IF NOT EXISTS idx_booking_ancillaries_booking ON public.booking_ancillaries(booking_id);

CREATE OR REPLACE FUNCTION public.generate_scheduled_flights(p_horizon_days INTEGER DEFAULT 90)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_schedule RECORD;
  v_date DATE;
  v_departure TIMESTAMPTZ;
  v_arrival TIMESTAMPTZ;
  v_flight_id UUID;
  v_total_seats INTEGER;
  v_created INTEGER := 0;
BEGIN
  IF p_horizon_days NOT BETWEEN 1 AND 365 THEN RAISE EXCEPTION 'Horizon must be between 1 and 365 days' USING ERRCODE = 'P0002'; END IF;
  FOR v_schedule IN
    SELECT fs.*, r.origin_airport_id, r.destination_airport_id, a.timezone AS origin_timezone,
      ac.total_seats
    FROM public.flight_schedules fs
    JOIN public.routes r ON r.id = fs.route_id
    JOIN public.airports a ON a.id = r.origin_airport_id
    JOIN public.aircrafts ac ON ac.id = fs.aircraft_id
    WHERE fs.is_active = TRUE AND r.is_active = TRUE
  LOOP
    FOR v_date IN SELECT generate_series(GREATEST(CURRENT_DATE, v_schedule.start_date), LEAST(CURRENT_DATE + p_horizon_days, COALESCE(v_schedule.end_date, CURRENT_DATE + p_horizon_days)), INTERVAL '1 day')::DATE
    LOOP
      IF EXTRACT(ISODOW FROM v_date)::SMALLINT = ANY(v_schedule.days_of_week) THEN
        v_departure := (v_date + v_schedule.departure_local_time) AT TIME ZONE v_schedule.origin_timezone;
        v_arrival := v_departure + make_interval(mins => v_schedule.duration_minutes);
        INSERT INTO public.flights (airline_id, aircraft_id, origin_airport_id, destination_airport_id, route_id, schedule_id,
          flight_number, departure_time, arrival_time, scheduled_departure_time, scheduled_arrival_time,
          base_price, available_seats, status)
        VALUES (v_schedule.airline_id, v_schedule.aircraft_id, v_schedule.origin_airport_id, v_schedule.destination_airport_id,
          v_schedule.route_id, v_schedule.id, v_schedule.flight_number, v_departure, v_arrival, v_departure, v_arrival,
          v_schedule.base_price, v_schedule.total_seats, 'scheduled')
        ON CONFLICT DO NOTHING RETURNING id INTO v_flight_id;
        IF v_flight_id IS NOT NULL THEN
          IF jsonb_array_length(v_schedule.seat_template) > 0 THEN
            INSERT INTO public.seats (flight_id, seat_number, seat_class, price)
            SELECT v_flight_id, item->>'seatNumber', COALESCE(item->>'seatClass', 'economy'),
              COALESCE((item->>'price')::NUMERIC, v_schedule.base_price)
            FROM jsonb_array_elements(v_schedule.seat_template) item;
          ELSE
            INSERT INTO public.seats (flight_id, seat_number, seat_class, price)
            SELECT v_flight_id, CEIL(number / 6.0)::INTEGER::TEXT || CHR(65 + ((number - 1) % 6)),
              CASE WHEN number <= LEAST(12, v_schedule.total_seats) THEN 'business' ELSE 'economy' END,
              CASE WHEN number <= LEAST(12, v_schedule.total_seats) THEN v_schedule.base_price * 2.2 ELSE v_schedule.base_price END
            FROM generate_series(1, v_schedule.total_seats) number;
          END IF;
          v_created := v_created + 1;
        END IF;
        v_flight_id := NULL;
      END IF;
    END LOOP;
  END LOOP;
  RETURN v_created;
END;
$$;

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fare_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ancillary_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_ancillaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY routes_public_read ON public.routes FOR SELECT USING (is_active = TRUE);
CREATE POLICY schedules_public_read ON public.flight_schedules FOR SELECT USING (is_active = TRUE);
CREATE POLICY fares_public_read ON public.fare_classes FOR SELECT USING (is_active = TRUE);
CREATE POLICY flight_events_public_read ON public.flight_status_events FOR SELECT USING (TRUE);
CREATE POLICY cms_public_read ON public.cms_contents FOR SELECT USING (status = 'published' AND published_at <= NOW());
CREATE POLICY ancillaries_public_read ON public.ancillary_services FOR SELECT USING (is_active = TRUE);
CREATE POLICY tickets_own_read ON public.tickets FOR SELECT USING (booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid()));
CREATE POLICY check_ins_own_read ON public.check_ins FOR SELECT USING (booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid()));
CREATE POLICY changes_own_read ON public.flight_change_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY refunds_own_read ON public.refund_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY support_own_all ON public.support_tickets FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY support_messages_own ON public.support_messages FOR SELECT USING (ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = auth.uid()) AND is_internal = FALSE);
CREATE POLICY booking_ancillaries_own_read ON public.booking_ancillaries FOR SELECT USING (booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid()));

CREATE POLICY routes_admin_all ON public.routes FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY schedules_admin_all ON public.flight_schedules FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY fares_admin_all ON public.fare_classes FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY tickets_admin_all ON public.tickets FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY check_ins_admin_all ON public.check_ins FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY changes_admin_all ON public.flight_change_requests FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY refunds_admin_all ON public.refund_requests FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY flight_events_admin_all ON public.flight_status_events FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY cms_admin_all ON public.cms_contents FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY support_admin_all ON public.support_tickets FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY support_messages_admin_all ON public.support_messages FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY ancillaries_admin_all ON public.ancillary_services FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY booking_ancillaries_admin_all ON public.booking_ancillaries FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

REVOKE ALL ON FUNCTION public.check_in_passenger(UUID, UUID, UUID, BOOLEAN, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_flight_change(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_change_payment_webhook(TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_in_passenger(UUID, UUID, UUID, BOOLEAN, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_flight_change(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_change_payment_webhook(TEXT, TEXT, JSONB) TO service_role;
REVOKE ALL ON FUNCTION public.generate_scheduled_flights(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_scheduled_flights(INTEGER) TO service_role;
REVOKE ALL ON FUNCTION public.add_booking_ancillary(UUID, UUID, UUID, UUID, INTEGER, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_booking_ancillary(UUID, UUID, UUID, UUID, INTEGER, JSONB) TO service_role;
REVOKE ALL ON FUNCTION public.set_booking_fare(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_booking_fare(UUID, UUID, UUID) TO service_role;
