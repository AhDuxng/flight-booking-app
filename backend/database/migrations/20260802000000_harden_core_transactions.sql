-- Core transaction hardening. PostgreSQL remains the source of truth; Redis and
-- external providers are deliberately kept outside every business transaction.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'VND',
  ADD COLUMN IF NOT EXISTS price_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS payment_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS price_locked_at TIMESTAMPTZ;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_price_version_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_price_version_check CHECK (price_version > 0);
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_total_price_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_total_price_check CHECK (total_price >= 0 AND price_snapshot >= 0);
UPDATE public.bookings SET currency=UPPER(currency);
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_currency_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_currency_check CHECK(currency ~ '^[A-Z]{3}$');
UPDATE public.bookings SET status='confirmed',updated_at=NOW() WHERE status='paid';
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check
  CHECK(status IN('pending','confirmed','cancelled','refund_pending','refunded'));

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS booking_price_version INTEGER,
  ADD COLUMN IF NOT EXISTS amount_snapshot NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS currency_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS provider_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

UPDATE public.payments p
SET user_id = b.user_id,
    booking_price_version = COALESCE(p.booking_price_version, b.price_version, 1),
    amount_snapshot = COALESCE(p.amount_snapshot, p.amount),
    currency_snapshot = COALESCE(p.currency_snapshot, p.currency, 'VND')
FROM public.bookings b
WHERE b.id = p.booking_id
  AND (p.user_id IS NULL OR p.booking_price_version IS NULL OR p.amount_snapshot IS NULL OR p.currency_snapshot IS NULL);
UPDATE public.payments SET currency_snapshot=UPPER(currency_snapshot),currency=UPPER(currency);

ALTER TABLE public.payments ALTER COLUMN amount_snapshot SET NOT NULL;
ALTER TABLE public.payments ALTER COLUMN currency_snapshot SET NOT NULL;
ALTER TABLE public.payments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.payments ALTER COLUMN booking_price_version SET NOT NULL;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending','success','failed','expired','refund_pending','refunded'));
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_amount_snapshot_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_amount_snapshot_check CHECK (amount_snapshot > 0);
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_price_version_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_price_version_check CHECK(booking_price_version > 0);
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_currency_snapshot_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_currency_snapshot_check CHECK(currency_snapshot ~ '^[A-Z]{3}$');

CREATE OR REPLACE FUNCTION public.enforce_core_state_transition()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
DECLARE v_allowed BOOLEAN:=FALSE;
BEGIN
  IF OLD.status=NEW.status THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME='bookings' THEN
    v_allowed:=(OLD.status='pending' AND NEW.status IN('confirmed','cancelled','refund_pending')) OR
      (OLD.status='confirmed' AND NEW.status IN('cancelled','refund_pending')) OR
      (OLD.status='cancelled' AND NEW.status='refund_pending') OR
      (OLD.status='refund_pending' AND NEW.status='refunded');
  ELSIF TG_TABLE_NAME='payments' THEN
    v_allowed:=(OLD.status='pending' AND NEW.status IN('success','failed','expired','refund_pending')) OR
      (OLD.status='expired' AND NEW.status='refund_pending') OR
      (OLD.status='success' AND NEW.status='refund_pending') OR
      (OLD.status='refund_pending' AND NEW.status='refunded');
  END IF;
  IF NOT v_allowed THEN RAISE EXCEPTION 'INVALID_STATE_TRANSITION: % -> %',OLD.status,NEW.status USING ERRCODE='P0001'; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS bookings_state_machine ON public.bookings;
CREATE TRIGGER bookings_state_machine BEFORE UPDATE OF status ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.enforce_core_state_transition();
DROP TRIGGER IF EXISTS payments_state_machine ON public.payments;
CREATE TRIGGER payments_state_machine BEFORE UPDATE OF status ON public.payments FOR EACH ROW EXECUTE FUNCTION public.enforce_core_state_transition();

DROP POLICY IF EXISTS bookings_insert_own ON public.bookings;
DROP POLICY IF EXISTS bookings_update_own ON public.bookings;
REVOKE INSERT,UPDATE,DELETE ON public.bookings,public.passengers,public.booking_seats,public.payments,
  public.booking_baggage,public.booking_meals,public.booking_discounts,public.tickets,public.check_ins,
  public.refund_requests,public.flight_change_requests,public.booking_ancillaries FROM anon,authenticated;

-- Existing duplicate pending intents are closed deterministically before the
-- invariant is installed. The oldest intent remains authoritative.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY booking_id, purpose ORDER BY created_at, id) AS position
  FROM public.payments WHERE status = 'pending'
)
UPDATE public.payments p
SET status = 'expired', updated_at = NOW()
FROM ranked r
WHERE p.id = r.id AND r.position > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_payment_per_booking_purpose
  ON public.payments(booking_id, purpose) WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_idempotency
  ON public.payments(user_id, booking_id, purpose, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.release_expired_held_seats()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_released_count INTEGER:=0;
BEGIN
  WITH expired AS(
    SELECT id,flight_id,booking_id FROM public.seats WHERE status='held' AND hold_expires_at<=NOW()
    ORDER BY id FOR UPDATE SKIP LOCKED
  ), released AS(
    UPDATE public.seats s SET status='available',booking_id=NULL,hold_expires_at=NULL,updated_at=NOW()
    FROM expired e WHERE s.id=e.id RETURNING e.flight_id,e.booking_id
  ), flight_counts AS(
    SELECT flight_id,COUNT(*)::INTEGER released_count FROM released GROUP BY flight_id
  ), updated_flights AS(
    UPDATE public.flights f SET available_seats=f.available_seats+c.released_count,updated_at=NOW()
    FROM flight_counts c WHERE f.id=c.flight_id RETURNING f.id
  ), booking_ids AS(
    SELECT DISTINCT booking_id FROM released WHERE booking_id IS NOT NULL
  ), expired_payments AS(
    UPDATE public.payments SET status='expired',updated_at=NOW()
    WHERE booking_id IN(SELECT booking_id FROM booking_ids) AND status='pending' RETURNING id
  ), expired_bookings AS(
    UPDATE public.bookings SET status='cancelled',hold_expires_at=NULL,price_locked_at=NULL,payment_started_at=NULL,updated_at=NOW()
    WHERE id IN(SELECT booking_id FROM booking_ids) AND status='pending' RETURNING id
  ) SELECT COUNT(*) INTO v_released_count FROM released;
  RETURN v_released_count;
END;
$$;

CREATE TABLE IF NOT EXISTS public.idempotency_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_payload JSONB,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','completed','failed')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_idempotency_expiry ON public.idempotency_records(expires_at);
ALTER TABLE public.idempotency_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.idempotency_records FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','dead_letter')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_by TEXT,
  locked_until TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_outbox_claim
  ON public.outbox_events(status, available_at, created_at)
  WHERE status IN ('pending','processing');
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.outbox_events FROM anon, authenticated;

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS outbox_event_id UUID REFERENCES public.outbox_events(id) ON DELETE SET NULL;
DROP INDEX IF EXISTS public.uq_notification_outbox_event;
CREATE UNIQUE INDEX uq_notification_outbox_event ON public.notifications(outbox_event_id,user_id);

CREATE OR REPLACE FUNCTION public.enqueue_outbox_event(
  p_aggregate_type TEXT, p_aggregate_id UUID, p_event_type TEXT, p_payload JSONB
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.outbox_events(aggregate_type, aggregate_id, event_type, payload)
  VALUES (p_aggregate_type, p_aggregate_id, p_event_type, COALESCE(p_payload, '{}'::JSONB))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.emit_core_outbox_events()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id UUID; v_booking_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'bookings' THEN
    IF TG_OP = 'INSERT' THEN
      PERFORM public.enqueue_outbox_event('booking', NEW.id, 'BOOKING_CREATED',
        jsonb_build_object('bookingId', NEW.id, 'userId', NEW.user_id));
    ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'cancelled' THEN
        PERFORM public.enqueue_outbox_event('booking', NEW.id, 'BOOKING_CANCELLED', jsonb_build_object('bookingId', NEW.id, 'userId', NEW.user_id));
      ELSIF NEW.status = 'refund_pending' THEN
        PERFORM public.enqueue_outbox_event('booking', NEW.id, 'REFUND_REQUIRED', jsonb_build_object('bookingId', NEW.id, 'userId', NEW.user_id));
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'payments' AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT user_id INTO v_user_id FROM public.bookings WHERE id = NEW.booking_id;
    IF NEW.status = 'success' THEN
      PERFORM public.enqueue_outbox_event('payment', NEW.id, 'PAYMENT_SUCCEEDED', jsonb_build_object('bookingId', NEW.booking_id, 'paymentId', NEW.id, 'userId', v_user_id));
    ELSIF NEW.status = 'failed' THEN
      PERFORM public.enqueue_outbox_event('payment', NEW.id, 'PAYMENT_FAILED', jsonb_build_object('bookingId', NEW.booking_id, 'paymentId', NEW.id, 'userId', v_user_id));
    END IF;
  ELSIF TG_TABLE_NAME = 'tickets' AND TG_OP = 'INSERT' THEN
    SELECT user_id INTO v_user_id FROM public.bookings WHERE id = NEW.booking_id;
    PERFORM public.enqueue_outbox_event('ticket', NEW.id, 'TICKET_ISSUED', jsonb_build_object('bookingId', NEW.booking_id, 'ticketId', NEW.id, 'userId', v_user_id));
  ELSIF TG_TABLE_NAME = 'check_ins' AND TG_OP = 'INSERT' THEN
    SELECT user_id INTO v_user_id FROM public.bookings WHERE id = NEW.booking_id;
    PERFORM public.enqueue_outbox_event('check_in', NEW.id, 'CHECK_IN_COMPLETED', jsonb_build_object('bookingId', NEW.booking_id, 'checkInId', NEW.id, 'userId', v_user_id));
  ELSIF TG_TABLE_NAME = 'refund_requests' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
    PERFORM public.enqueue_outbox_event('refund', NEW.id, 'REFUND_COMPLETED', jsonb_build_object('bookingId', NEW.booking_id, 'refundRequestId', NEW.id, 'userId', NEW.user_id));
  ELSIF TG_TABLE_NAME = 'flight_change_requests' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
    PERFORM public.enqueue_outbox_event('flight_change', NEW.id, 'FLIGHT_CHANGED', jsonb_build_object('bookingId', NEW.booking_id, 'changeRequestId', NEW.id, 'userId', NEW.user_id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_core_outbox ON public.bookings;
CREATE TRIGGER bookings_core_outbox AFTER INSERT OR UPDATE OF status ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.emit_core_outbox_events();
DROP TRIGGER IF EXISTS payments_core_outbox ON public.payments;
CREATE TRIGGER payments_core_outbox AFTER UPDATE OF status ON public.payments FOR EACH ROW EXECUTE FUNCTION public.emit_core_outbox_events();
DROP TRIGGER IF EXISTS tickets_core_outbox ON public.tickets;
CREATE TRIGGER tickets_core_outbox AFTER INSERT ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.emit_core_outbox_events();
DROP TRIGGER IF EXISTS check_ins_core_outbox ON public.check_ins;
CREATE TRIGGER check_ins_core_outbox AFTER INSERT ON public.check_ins FOR EACH ROW EXECUTE FUNCTION public.emit_core_outbox_events();
DROP TRIGGER IF EXISTS refunds_core_outbox ON public.refund_requests;
CREATE TRIGGER refunds_core_outbox AFTER UPDATE OF status ON public.refund_requests FOR EACH ROW EXECUTE FUNCTION public.emit_core_outbox_events();
DROP TRIGGER IF EXISTS changes_core_outbox ON public.flight_change_requests;
CREATE TRIGGER changes_core_outbox AFTER UPDATE OF status ON public.flight_change_requests FOR EACH ROW EXECUTE FUNCTION public.emit_core_outbox_events();

CREATE OR REPLACE FUNCTION public.claim_outbox_events(p_worker_id TEXT, p_limit INTEGER DEFAULT 20)
RETURNS SETOF public.outbox_events LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT id FROM public.outbox_events
    WHERE available_at <= NOW()
      AND (status = 'pending' OR (status = 'processing' AND locked_until <= NOW()))
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit, 1), 100)
  )
  UPDATE public.outbox_events event
  SET status = 'processing', locked_by = p_worker_id, locked_until = NOW() + INTERVAL '2 minutes',
      attempts = event.attempts + 1, updated_at = NOW()
  FROM candidates WHERE event.id = candidates.id
  RETURNING event.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_outbox_event(p_event_id UUID, p_worker_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.outbox_events SET status = 'completed', processed_at = NOW(), locked_by = NULL,
    locked_until = NULL, last_error = NULL, updated_at = NOW()
  WHERE id = p_event_id AND status = 'processing' AND locked_by = p_worker_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_outbox_event(p_event_id UUID, p_worker_id TEXT, p_error TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.outbox_events
  SET status = CASE WHEN attempts >= 8 THEN 'dead_letter' ELSE 'pending' END,
      available_at = NOW() + make_interval(secs => LEAST(3600, POWER(2, LEAST(attempts, 10))::INTEGER * 15)),
      locked_by = NULL, locked_until = NULL, last_error = LEFT(p_error, 2000), updated_at = NOW()
  WHERE id = p_event_id AND status = 'processing' AND locked_by = p_worker_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_flight_sellable(
  p_flight_id UUID, p_required_seats INTEGER DEFAULT 1, p_cabin_class TEXT DEFAULT NULL,
  p_booking_cutoff INTERVAL DEFAULT INTERVAL '45 minutes'
) RETURNS BOOLEAN LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.flights f
    LEFT JOIN public.flight_schedules fs ON fs.id = f.schedule_id
    WHERE f.id = p_flight_id
      AND f.status IN ('scheduled','delayed')
      AND f.departure_time > NOW() + p_booking_cutoff
      AND (f.schedule_id IS NULL OR fs.is_active = TRUE)
      AND (SELECT COUNT(*) FROM public.seats s WHERE s.flight_id = f.id AND s.status = 'available'
           AND (p_cabin_class IS NULL OR s.seat_class = p_cabin_class)) >= GREATEST(p_required_seats, 1)
  );
$$;

CREATE OR REPLACE FUNCTION public.calculate_flight_price(
  p_flight_id UUID, p_cabin_class TEXT DEFAULT NULL, p_fare_id UUID DEFAULT NULL
) RETURNS NUMERIC LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE v_base NUMERIC; v_total INTEGER; v_available INTEGER; v_fare_multiplier NUMERIC := 1;
BEGIN
  SELECT COALESCE(MIN(s.price), f.base_price), COUNT(s.*)::INTEGER,
         COUNT(*) FILTER (WHERE s.status = 'available')::INTEGER
  INTO v_base, v_total, v_available
  FROM public.flights f LEFT JOIN public.seats s ON s.flight_id = f.id
    AND (p_cabin_class IS NULL OR s.seat_class = p_cabin_class)
  WHERE f.id = p_flight_id GROUP BY f.base_price;
  IF v_base IS NULL THEN RETURN NULL; END IF;
  IF p_fare_id IS NOT NULL THEN
    SELECT price_multiplier INTO v_fare_multiplier FROM public.fare_classes WHERE id = p_fare_id AND is_active = TRUE;
    IF NOT FOUND THEN RETURN NULL; END IF;
  END IF;
  RETURN ROUND(v_base * public.calculate_dynamic_price_multiplier(v_available, v_total) * COALESCE(v_fare_multiplier, 1), 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.search_flights_v2(
  p_origin_airport_id UUID DEFAULT NULL, p_destination_airport_id UUID DEFAULT NULL,
  p_airline_id UUID DEFAULT NULL, p_departure_from TIMESTAMPTZ DEFAULT NOW(),
  p_departure_to TIMESTAMPTZ DEFAULT NULL, p_cabin_class TEXT DEFAULT NULL,
  p_passenger_count INTEGER DEFAULT 1, p_flight_number TEXT DEFAULT NULL,
  p_offset INTEGER DEFAULT 0, p_limit INTEGER DEFAULT 20
) RETURNS JSONB LANGUAGE sql STABLE SET search_path = public AS $$
  WITH eligible AS (
    SELECT f.*, a.total_seats,
      COUNT(*) FILTER (WHERE s.status = 'available')::INTEGER AS actual_available_seats,
      COUNT(*) FILTER (WHERE s.status = 'available' AND (p_cabin_class IS NULL OR s.seat_class = p_cabin_class))::INTEGER AS cabin_available_seats,
      COUNT(*) FILTER (WHERE p_cabin_class IS NULL OR s.seat_class = p_cabin_class)::INTEGER AS cabin_total_seats,
      COALESCE(MIN(s.price) FILTER (WHERE p_cabin_class IS NULL OR s.seat_class = p_cabin_class), f.base_price) AS cabin_base_price
    FROM public.flights f JOIN public.aircrafts a ON a.id = f.aircraft_id
    JOIN public.seats s ON s.flight_id = f.id
    LEFT JOIN public.flight_schedules fs ON fs.id = f.schedule_id
    WHERE f.status IN ('scheduled','delayed') AND f.departure_time > NOW() + INTERVAL '45 minutes'
      AND f.departure_time >= COALESCE(p_departure_from, NOW())
      AND (p_departure_to IS NULL OR f.departure_time < p_departure_to)
      AND (p_origin_airport_id IS NULL OR f.origin_airport_id = p_origin_airport_id)
      AND (p_destination_airport_id IS NULL OR f.destination_airport_id = p_destination_airport_id)
      AND (p_airline_id IS NULL OR f.airline_id = p_airline_id)
      AND (p_flight_number IS NULL OR f.flight_number = p_flight_number)
      AND (f.schedule_id IS NULL OR fs.is_active = TRUE)
    GROUP BY f.id, a.total_seats
    HAVING COUNT(*) FILTER (WHERE s.status = 'available' AND (p_cabin_class IS NULL OR s.seat_class = p_cabin_class)) >= GREATEST(p_passenger_count, 1)
  ), counted AS (SELECT eligible.*, COUNT(*) OVER() AS full_count FROM eligible), page AS (
    SELECT c.* FROM counted c ORDER BY departure_time LIMIT LEAST(GREATEST(p_limit,1),100) OFFSET GREATEST(p_offset,0)
  )
  SELECT jsonb_build_object(
    'data', COALESCE(jsonb_agg(
      (to_jsonb(page) - 'full_count' - 'total_seats' - 'cabin_base_price') ||
      jsonb_build_object(
        'available_seats', page.actual_available_seats,
        'sellable', TRUE,
        'dynamic_price', ROUND(page.cabin_base_price * public.calculate_dynamic_price_multiplier(page.cabin_available_seats, page.cabin_total_seats), 0),
        'dynamic_price_multiplier', public.calculate_dynamic_price_multiplier(page.cabin_available_seats, page.cabin_total_seats),
        'fare_options', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id',fc.id,'code',fc.code,'name',fc.name,'cabin_class',fc.cabin_class,
            'price',public.calculate_flight_price(page.id,fc.cabin_class,fc.id),
            'change_allowed',fc.change_allowed,'refundable',fc.refundable
          ) ORDER BY fc.price_multiplier)
          FROM public.fare_classes fc WHERE fc.is_active=TRUE
            AND (p_cabin_class IS NULL OR fc.cabin_class=p_cabin_class)
            AND (fc.airline_id IS NULL OR fc.airline_id=page.airline_id)
            AND (fc.route_id IS NULL OR fc.route_id=page.route_id)
        ),'[]'::JSONB),
        'airline', (SELECT to_jsonb(x) FROM (SELECT ar.id, ar.code, ar.name, ar.logo_url FROM public.airlines ar WHERE ar.id = page.airline_id) x),
        'aircraft', (SELECT to_jsonb(x) FROM (SELECT ac.id, ac.code, ac.model, ac.total_seats FROM public.aircrafts ac WHERE ac.id = page.aircraft_id) x),
        'origin_airport', (SELECT to_jsonb(x) FROM (SELECT ap.id, ap.code, ap.name, ap.city, ap.timezone FROM public.airports ap WHERE ap.id = page.origin_airport_id) x),
        'destination_airport', (SELECT to_jsonb(x) FROM (SELECT ap.id, ap.code, ap.name, ap.city, ap.timezone FROM public.airports ap WHERE ap.id = page.destination_airport_id) x)
      ) ORDER BY page.departure_time
    ), '[]'::JSONB),
    'count', COALESCE(MAX(page.full_count), 0)
  ) FROM page;
$$;

-- Versioned booking creation keeps the legacy implementation as a tested inner
-- primitive, but fare and ancillary work now happen inside this single RPC call.
CREATE OR REPLACE FUNCTION public.create_booking_v2(
  p_user_id UUID, p_flight_id UUID, p_contact_email TEXT, p_contact_phone TEXT,
  p_notes TEXT, p_passengers JSONB, p_seat_ids UUID[], p_fare_id UUID,
  p_baggage JSONB DEFAULT '[]'::JSONB, p_meals JSONB DEFAULT '[]'::JSONB,
  p_ancillaries JSONB DEFAULT '[]'::JSONB, p_discount_code TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL, p_request_hash TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_booking_id UUID; v_record public.idempotency_records%ROWTYPE; v_fare public.fare_classes%ROWTYPE;
  v_flight public.flights%ROWTYPE; v_item JSONB; v_passenger_ids UUID[]; v_index INTEGER;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO public.idempotency_records(user_id, endpoint, idempotency_key, request_hash)
    VALUES (p_user_id, 'POST:/api/bookings', p_idempotency_key, p_request_hash)
    ON CONFLICT DO NOTHING;
    SELECT * INTO v_record FROM public.idempotency_records
    WHERE user_id = p_user_id AND endpoint = 'POST:/api/bookings' AND idempotency_key = p_idempotency_key FOR UPDATE;
    IF v_record.request_hash <> p_request_hash THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT' USING ERRCODE = 'P0001'; END IF;
    IF v_record.status = 'completed' THEN RETURN (v_record.response_payload->>'bookingId')::UUID; END IF;
  END IF;

  SELECT * INTO v_flight FROM public.flights WHERE id = p_flight_id FOR UPDATE;
  IF NOT FOUND OR NOT public.is_flight_sellable(p_flight_id, cardinality(p_seat_ids), NULL) THEN
    RAISE EXCEPTION 'FLIGHT_NOT_SELLABLE' USING ERRCODE = 'P0001';
  END IF;
  SELECT * INTO v_fare FROM public.fare_classes WHERE id = p_fare_id AND is_active = TRUE
    AND cabin_class = ALL(SELECT seat_class FROM public.seats WHERE id = ANY(p_seat_ids))
    AND (airline_id IS NULL OR airline_id = v_flight.airline_id)
    AND (route_id IS NULL OR route_id = v_flight.route_id) FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'FARE_NOT_AVAILABLE' USING ERRCODE = 'P0001'; END IF;

  BEGIN
    v_booking_id := public.create_booking(p_user_id, p_flight_id, p_contact_email, p_contact_phone,
      p_notes, p_passengers, p_seat_ids, p_baggage, p_meals, p_discount_code);
  EXCEPTION
    WHEN SQLSTATE 'P0001' THEN RAISE EXCEPTION 'SEAT_NOT_AVAILABLE' USING ERRCODE='P0001';
    WHEN SQLSTATE 'P0002' THEN RAISE EXCEPTION 'BOOKING_INPUT_INVALID' USING ERRCODE='P0001';
  END;
  PERFORM public.set_booking_fare(v_booking_id, p_user_id, p_fare_id);

  SELECT ARRAY_AGG(bs.passenger_id ORDER BY array_position(p_seat_ids,bs.seat_id)) INTO v_passenger_ids
  FROM public.booking_seats bs WHERE bs.booking_id=v_booking_id;
  FOR v_item IN SELECT value FROM jsonb_array_elements(COALESCE(p_ancillaries, '[]'::JSONB)) LOOP
    v_index := NULLIF(v_item->>'passengerIndex', '')::INTEGER;
    IF v_index IS NOT NULL AND (v_index < 0 OR v_index >= cardinality(v_passenger_ids)) THEN
      RAISE EXCEPTION 'PASSENGER_NOT_OWNED' USING ERRCODE = 'P0001';
    END IF;
    PERFORM public.add_booking_ancillary(v_booking_id, p_user_id, (v_item->>'ancillaryServiceId')::UUID,
      CASE WHEN v_index IS NULL THEN NULL ELSE v_passenger_ids[v_index + 1] END,
      COALESCE((v_item->>'quantity')::INTEGER, 1), COALESCE(v_item->'details', '{}'::JSONB));
  END LOOP;

  IF p_idempotency_key IS NOT NULL THEN
    UPDATE public.idempotency_records SET status = 'completed', response_payload = jsonb_build_object('bookingId', v_booking_id), updated_at = NOW()
    WHERE id = v_record.id;
  END IF;
  RETURN v_booking_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_or_create_payment_intent(
  p_user_id UUID, p_booking_id UUID, p_purpose TEXT, p_provider TEXT,
  p_idempotency_key TEXT, p_request_hash TEXT, p_transaction_ref TEXT,
  p_change_request_id UUID DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_booking public.bookings%ROWTYPE; v_payment public.payments%ROWTYPE; v_record public.idempotency_records%ROWTYPE; v_amount NUMERIC;
BEGIN
  IF p_idempotency_key IS NULL OR LENGTH(p_idempotency_key) NOT BETWEEN 8 AND 200 THEN
    RAISE EXCEPTION 'IDEMPOTENCY_KEY_REQUIRED' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.idempotency_records(user_id, endpoint, idempotency_key, request_hash)
  VALUES (p_user_id, 'POST:/api/payments/intent:' || p_booking_id::TEXT || ':' || p_purpose, p_idempotency_key, p_request_hash)
  ON CONFLICT DO NOTHING;
  SELECT * INTO v_record FROM public.idempotency_records
  WHERE user_id = p_user_id AND endpoint = 'POST:/api/payments/intent:' || p_booking_id::TEXT || ':' || p_purpose
    AND idempotency_key = p_idempotency_key FOR UPDATE;
  IF v_record.request_hash <> p_request_hash THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT' USING ERRCODE = 'P0001'; END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'BOOKING_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;
  IF p_purpose = 'booking' THEN
    IF v_booking.status <> 'pending' OR v_booking.hold_expires_at <= NOW() THEN RAISE EXCEPTION 'BOOKING_NOT_PAYABLE' USING ERRCODE = 'P0001'; END IF;
    v_amount := v_booking.total_price;
  ELSIF p_purpose = 'flight_change' THEN
    SELECT additional_amount INTO v_amount FROM public.flight_change_requests
    WHERE id = p_change_request_id AND booking_id = p_booking_id AND user_id = p_user_id
      AND status IN ('quoted','pending_payment') AND quote_expires_at > NOW() FOR UPDATE;
    IF NOT FOUND OR v_amount <= 0 THEN RAISE EXCEPTION 'CHANGE_QUOTE_EXPIRED' USING ERRCODE = 'P0001'; END IF;
  ELSE RAISE EXCEPTION 'BOOKING_NOT_PAYABLE' USING ERRCODE = 'P0001'; END IF;

  SELECT * INTO v_payment FROM public.payments
  WHERE booking_id = p_booking_id AND purpose = p_purpose AND status = 'pending' FOR UPDATE;
  IF FOUND THEN
    IF v_payment.provider <> p_provider OR v_payment.amount_snapshot <> v_amount OR
       (v_payment.idempotency_key IS NOT NULL AND v_payment.idempotency_key <> p_idempotency_key) THEN
      RAISE EXCEPTION 'PAYMENT_ALREADY_EXISTS' USING ERRCODE = 'P0001';
    END IF;
  ELSE
    INSERT INTO public.payments(booking_id,user_id,amount,currency,provider,transaction_ref,status,purpose,
      change_request_id,idempotency_key,booking_price_version,amount_snapshot,currency_snapshot,expires_at)
    VALUES (p_booking_id,p_user_id,v_amount,v_booking.currency,p_provider,p_transaction_ref,'pending',p_purpose,
      p_change_request_id,p_idempotency_key,v_booking.price_version,v_amount,v_booking.currency,v_booking.hold_expires_at)
    RETURNING * INTO v_payment;
  END IF;
  IF p_purpose = 'booking' THEN
    UPDATE public.bookings SET payment_started_at = COALESCE(payment_started_at,NOW()), price_locked_at = COALESCE(price_locked_at,NOW()), updated_at = NOW()
    WHERE id = p_booking_id;
  ELSE
    UPDATE public.flight_change_requests SET status = 'pending_payment', updated_at = NOW() WHERE id = p_change_request_id;
  END IF;
  UPDATE public.idempotency_records SET status = 'completed', response_payload = jsonb_build_object('paymentId',v_payment.id), updated_at = NOW() WHERE id = v_record.id;
  RETURN to_jsonb(v_payment);
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_payment_intent(p_payment_id UUID, p_user_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_payment public.payments%ROWTYPE;
BEGIN
  SELECT p.* INTO v_payment FROM public.payments p JOIN public.bookings b ON b.id=p.booking_id
  WHERE p.id=p_payment_id AND b.user_id=p_user_id AND p.status='pending' FOR UPDATE OF p;
  IF NOT FOUND THEN RAISE EXCEPTION 'PAYMENT_NOT_FOUND' USING ERRCODE='P0001'; END IF;
  UPDATE public.payments SET status='expired',updated_at=NOW() WHERE id=p_payment_id;
  IF v_payment.purpose='booking' THEN
    UPDATE public.bookings SET price_locked_at=NULL,payment_started_at=NULL,price_version=price_version+1,updated_at=NOW()
    WHERE id=v_payment.booking_id AND status='pending';
  END IF;
  RETURN p_payment_id;
END;
$$;

-- Price-changing operations are rejected while the booking payment snapshot is active.
CREATE OR REPLACE FUNCTION public.set_booking_fare(p_booking_id UUID, p_user_id UUID, p_fare_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_booking public.bookings%ROWTYPE; v_old_multiplier NUMERIC:=1; v_fare public.fare_classes%ROWTYPE; v_flight public.flights%ROWTYPE; v_new_price NUMERIC;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id=p_booking_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND OR v_booking.status<>'pending' OR v_booking.hold_expires_at<=NOW() THEN RAISE EXCEPTION 'BOOKING_NOT_PAYABLE' USING ERRCODE='P0001'; END IF;
  IF v_booking.price_locked_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.payments WHERE booking_id=p_booking_id AND purpose='booking' AND status='pending') THEN RAISE EXCEPTION 'BOOKING_PRICE_LOCKED' USING ERRCODE='P0001'; END IF;
  SELECT * INTO v_flight FROM public.flights WHERE id=v_booking.flight_id;
  SELECT COALESCE(price_multiplier,1) INTO v_old_multiplier FROM public.fare_classes WHERE id=v_booking.fare_id;
  SELECT * INTO v_fare FROM public.fare_classes WHERE id=p_fare_id AND is_active=TRUE
    AND cabin_class=ALL(SELECT s.seat_class FROM public.booking_seats bs JOIN public.seats s ON s.id=bs.seat_id WHERE bs.booking_id=v_booking.id)
    AND (airline_id IS NULL OR airline_id=v_flight.airline_id) AND (route_id IS NULL OR route_id=v_flight.route_id);
  IF NOT FOUND THEN RAISE EXCEPTION 'FARE_NOT_AVAILABLE' USING ERRCODE='P0001'; END IF;
  v_new_price:=ROUND(v_booking.price_snapshot/NULLIF(COALESCE(v_old_multiplier,1),0)*v_fare.price_multiplier,0);
  UPDATE public.bookings SET fare_id=v_fare.id,price_snapshot=v_new_price,total_price=total_price-v_booking.price_snapshot+v_new_price,
    price_version=price_version+1,updated_at=NOW() WHERE id=v_booking.id;
  RETURN v_booking.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_booking_ancillary(p_booking_id UUID,p_user_id UUID,p_service_id UUID,p_passenger_id UUID,p_quantity INTEGER,p_details JSONB)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_booking public.bookings%ROWTYPE;v_service public.ancillary_services%ROWTYPE;v_id UUID;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id=p_booking_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND OR v_booking.status<>'pending' OR v_booking.hold_expires_at<=NOW() THEN RAISE EXCEPTION 'BOOKING_NOT_PAYABLE' USING ERRCODE='P0001'; END IF;
  IF v_booking.price_locked_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.payments WHERE booking_id=p_booking_id AND purpose='booking' AND status='pending') THEN RAISE EXCEPTION 'BOOKING_PRICE_LOCKED' USING ERRCODE='P0001'; END IF;
  SELECT * INTO v_service FROM public.ancillary_services WHERE id=p_service_id AND is_active=TRUE FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ANCILLARY_NOT_AVAILABLE' USING ERRCODE='P0001'; END IF;
  IF p_quantity NOT BETWEEN 1 AND 10 THEN RAISE EXCEPTION 'INVALID_QUANTITY' USING ERRCODE='P0001'; END IF;
  IF p_passenger_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.passengers WHERE id=p_passenger_id AND booking_id=p_booking_id) THEN RAISE EXCEPTION 'PASSENGER_NOT_OWNED' USING ERRCODE='P0001'; END IF;
  INSERT INTO public.booking_ancillaries(booking_id,passenger_id,ancillary_service_id,quantity,price_snapshot,status,details)
  VALUES(p_booking_id,p_passenger_id,p_service_id,p_quantity,v_service.price,'confirmed',COALESCE(p_details,'{}'::JSONB)) RETURNING id INTO v_id;
  UPDATE public.bookings SET total_price=total_price+v_service.price*p_quantity,price_version=price_version+1,updated_at=NOW() WHERE id=p_booking_id;
  RETURN v_id;
END;
$$;

-- Public hold/release RPCs are retired. Seat allocation now only happens in booking/check-in/change RPCs.
REVOKE ALL ON FUNCTION public.hold_seat(UUID, UUID) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.release_held_seat(UUID, UUID) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.confirm_seats(UUID) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.create_booking(UUID,UUID,TEXT,TEXT,TEXT,JSONB,UUID[],JSONB,JSONB,TEXT) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.cancel_booking(UUID,UUID) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.process_payment_webhook(UUID,TEXT,TEXT,NUMERIC,TEXT,JSONB) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.apply_flight_change(UUID,UUID) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.process_payment_refund(UUID) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.process_change_payment_webhook(TEXT,TEXT,JSONB) FROM PUBLIC,anon,authenticated,service_role;

CREATE TABLE IF NOT EXISTS public.flight_boarding_counters(
  flight_id UUID PRIMARY KEY REFERENCES public.flights(id) ON DELETE CASCADE,
  next_sequence INTEGER NOT NULL DEFAULT 1 CHECK(next_sequence>0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.flight_boarding_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.flight_boarding_counters FROM anon,authenticated;

CREATE OR REPLACE FUNCTION public.check_in_passenger(p_booking_id UUID,p_passenger_id UUID,p_user_id UUID,p_document_confirmed BOOLEAN,p_seat_id UUID DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_booking public.bookings%ROWTYPE;v_flight public.flights%ROWTYPE;v_ticket public.tickets%ROWTYPE;v_current_seat UUID;v_id UUID;v_seq INTEGER;v_pass TEXT;v_existing public.check_ins%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id=p_booking_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND OR v_booking.status<>'confirmed' THEN RAISE EXCEPTION 'BOOKING_NOT_CHECKABLE' USING ERRCODE='P0001'; END IF;
  SELECT * INTO v_flight FROM public.flights WHERE id=v_booking.flight_id FOR UPDATE;
  IF NOW()<v_flight.departure_time-INTERVAL '24 hours' OR NOW()>v_flight.departure_time-INTERVAL '45 minutes' OR v_flight.status NOT IN('scheduled','delayed','boarding') THEN RAISE EXCEPTION 'CHECK_IN_CLOSED' USING ERRCODE='P0001'; END IF;
  IF NOT p_document_confirmed THEN RAISE EXCEPTION 'DOCUMENT_CONFIRMATION_REQUIRED' USING ERRCODE='P0001'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.passengers WHERE id=p_passenger_id AND booking_id=p_booking_id) THEN RAISE EXCEPTION 'PASSENGER_NOT_OWNED' USING ERRCODE='P0001'; END IF;
  SELECT * INTO v_existing FROM public.check_ins WHERE passenger_id=p_passenger_id AND flight_id=v_flight.id FOR UPDATE;
  IF FOUND THEN
    IF p_seat_id IS NOT NULL AND p_seat_id<>v_existing.seat_id THEN RAISE EXCEPTION 'SEAT_CHANGE_AFTER_CHECK_IN_NOT_ALLOWED' USING ERRCODE='P0001'; END IF;
    RETURN v_existing.id;
  END IF;
  SELECT * INTO v_ticket FROM public.tickets WHERE booking_id=p_booking_id AND passenger_id=p_passenger_id AND status IN('issued','reissued') ORDER BY issued_at DESC LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'ACTIVE_TICKET_NOT_FOUND' USING ERRCODE='P0001'; END IF;
  SELECT seat_id INTO v_current_seat FROM public.booking_seats WHERE booking_id=p_booking_id AND passenger_id=p_passenger_id FOR UPDATE;
  IF p_seat_id IS NOT NULL AND p_seat_id<>v_current_seat THEN
    PERFORM id FROM public.seats WHERE id IN(v_current_seat,p_seat_id) ORDER BY id FOR UPDATE;
    IF NOT EXISTS(SELECT 1 FROM public.seats WHERE id=p_seat_id AND flight_id=v_flight.id AND status='available') THEN RAISE EXCEPTION 'SEAT_NOT_AVAILABLE' USING ERRCODE='P0001'; END IF;
    UPDATE public.seats SET status='available',booking_id=NULL,hold_expires_at=NULL,updated_at=NOW() WHERE id=v_current_seat;
    UPDATE public.seats SET status='booked',booking_id=p_booking_id,hold_expires_at=NULL,updated_at=NOW() WHERE id=p_seat_id;
    UPDATE public.booking_seats SET seat_id=p_seat_id WHERE booking_id=p_booking_id AND passenger_id=p_passenger_id;
    v_current_seat:=p_seat_id;
  END IF;
  INSERT INTO public.flight_boarding_counters(flight_id,next_sequence) VALUES(v_flight.id,2)
  ON CONFLICT(flight_id) DO UPDATE SET next_sequence=public.flight_boarding_counters.next_sequence+1,updated_at=NOW()
  RETURNING next_sequence-1 INTO v_seq;
  v_pass:=UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT,'-','') FROM 1 FOR 12));
  INSERT INTO public.check_ins(booking_id,passenger_id,flight_id,ticket_id,seat_id,document_confirmed,boarding_sequence,boarding_pass_number,qr_payload)
  VALUES(p_booking_id,p_passenger_id,v_flight.id,v_ticket.id,v_current_seat,TRUE,v_seq,v_pass,
    jsonb_build_object('version',1,'boardingPass',v_pass,'ticket',v_ticket.ticket_number,'flight',v_flight.flight_number,'passenger',p_passenger_id)::TEXT)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

ALTER TABLE public.payment_webhook_logs
  ADD COLUMN IF NOT EXISTS provider_event_id TEXT,
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS event_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS raw_body TEXT,
  ADD COLUMN IF NOT EXISTS signature TEXT,
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'received';
DROP INDEX IF EXISTS public.uq_webhook_provider_event;
CREATE UNIQUE INDEX uq_webhook_provider_event ON public.payment_webhook_logs(provider,provider_event_id);

CREATE OR REPLACE FUNCTION public.process_payment_webhook_v2(
  p_provider_event_id TEXT,p_event_type TEXT,p_event_created_at TIMESTAMPTZ,p_booking_id UUID,
  p_transaction_ref TEXT,p_provider TEXT,p_amount NUMERIC,p_currency TEXT,p_status TEXT,
  p_raw_body TEXT,p_signature TEXT,p_payload JSONB
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_payment public.payments%ROWTYPE;v_booking public.bookings%ROWTYPE;v_log public.payment_webhook_logs%ROWTYPE;v_result JSONB;v_refund_id UUID;v_released INTEGER:=0;
BEGIN
  INSERT INTO public.payment_webhook_logs(booking_id,provider,transaction_ref,provider_event_id,event_type,event_created_at,raw_body,signature,payload,processing_status)
  VALUES(p_booking_id,p_provider,p_transaction_ref,p_provider_event_id,p_event_type,p_event_created_at,p_raw_body,p_signature,p_payload,'processing')
  ON CONFLICT(provider,provider_event_id) DO NOTHING;
  SELECT * INTO v_log FROM public.payment_webhook_logs WHERE provider=p_provider AND provider_event_id=p_provider_event_id FOR UPDATE;
  IF v_log.processing_status='completed' THEN RETURN COALESCE(v_log.processing_result,'{}'::JSONB)||jsonb_build_object('duplicate',TRUE,'processed',FALSE); END IF;
  IF p_status='ignored' THEN
    v_result:=jsonb_build_object('processed',FALSE,'ignored',TRUE);
  ELSE
    SELECT * INTO v_payment FROM public.payments WHERE transaction_ref=p_transaction_ref FOR UPDATE;
    IF NOT FOUND OR v_payment.booking_id<>p_booking_id THEN RAISE EXCEPTION 'PAYMENT_NOT_FOUND' USING ERRCODE='P0001'; END IF;
    SELECT * INTO v_booking FROM public.bookings WHERE id=v_payment.booking_id FOR UPDATE;
    IF v_payment.provider<>p_provider THEN RAISE EXCEPTION 'PAYMENT_PROVIDER_MISMATCH' USING ERRCODE='P0001'; END IF;
    IF UPPER(v_payment.currency_snapshot)<>UPPER(p_currency) THEN RAISE EXCEPTION 'PAYMENT_CURRENCY_MISMATCH' USING ERRCODE='P0001'; END IF;
    IF v_payment.amount_snapshot<>p_amount THEN RAISE EXCEPTION 'PAYMENT_AMOUNT_MISMATCH' USING ERRCODE='P0001'; END IF;
    IF v_payment.status='pending' AND v_booking.price_version<>v_payment.booking_price_version THEN
      RAISE EXCEPTION 'PAYMENT_PRICE_VERSION_MISMATCH' USING ERRCODE='P0001';
    END IF;
    IF v_payment.status='expired' THEN
      IF p_status='success' THEN
        UPDATE public.payments SET status='refund_pending',paid_at=NOW(),raw_payload=p_payload,updated_at=NOW() WHERE id=v_payment.id;
        IF NOT EXISTS(SELECT 1 FROM public.payments p WHERE p.booking_id=v_payment.booking_id AND p.id<>v_payment.id AND p.status='pending') THEN
          WITH released AS(UPDATE public.seats SET status='available',booking_id=NULL,hold_expires_at=NULL,updated_at=NOW()
            WHERE booking_id=v_payment.booking_id AND status='held' RETURNING id)
          SELECT COUNT(*) INTO v_released FROM released;
          UPDATE public.flights SET available_seats=available_seats+v_released,updated_at=NOW()
          WHERE id=(SELECT flight_id FROM public.bookings WHERE id=v_payment.booking_id);
          UPDATE public.bookings SET status='refund_pending',hold_expires_at=NULL,updated_at=NOW()
          WHERE id=v_payment.booking_id AND status IN('pending','cancelled');
        END IF;
        v_refund_id:=gen_random_uuid();
        INSERT INTO public.refund_requests(id,booking_id,payment_id,user_id,reason,requested_amount,idempotency_key,metadata)
        VALUES(v_refund_id,v_payment.booking_id,v_payment.id,v_payment.user_id,'Late payment after intent expiration',v_payment.amount_snapshot,
          'refund:'||v_refund_id::TEXT,jsonb_build_object('latePayment',TRUE)) ON CONFLICT DO NOTHING;
        v_result:=jsonb_build_object('processed',TRUE,'payment_id',v_payment.id,'booking_id',v_payment.booking_id,'user_id',v_payment.user_id,'payment_status','refund_pending','requires_refund',TRUE);
      ELSE v_result:=jsonb_build_object('processed',FALSE,'payment_id',v_payment.id,'booking_id',v_payment.booking_id,'payment_status','expired'); END IF;
    ELSIF v_payment.status IN('success','failed','refund_pending','refunded') THEN
      v_result:=jsonb_build_object('processed',FALSE,'payment_id',v_payment.id,'booking_id',v_payment.booking_id,
        'user_id',v_payment.user_id,'payment_status',v_payment.status,'requires_refund',v_payment.status='refund_pending');
    ELSIF v_payment.purpose='flight_change' THEN v_result:=public.process_change_payment_webhook(p_transaction_ref,p_status,p_payload);
    ELSE
      v_result:=public.process_payment_webhook(p_booking_id,p_transaction_ref,p_provider,p_amount,p_status,p_payload);
      IF COALESCE((v_result->>'requires_refund')::BOOLEAN,FALSE) THEN
        v_refund_id:=gen_random_uuid();
        INSERT INTO public.refund_requests(id,booking_id,payment_id,user_id,reason,requested_amount,idempotency_key,metadata)
        VALUES(v_refund_id,v_payment.booking_id,v_payment.id,v_payment.user_id,'Late payment after seat hold expiration',v_payment.amount_snapshot,
          'refund:'||v_refund_id::TEXT,jsonb_build_object('latePayment',TRUE)) ON CONFLICT DO NOTHING;
      END IF;
    END IF;
    IF v_result->>'payment_status'='failed' THEN
      UPDATE public.bookings SET price_locked_at=NULL,payment_started_at=NULL,price_version=price_version+1,updated_at=NOW()
      WHERE id=v_payment.booking_id AND status='pending'
        AND NOT EXISTS(SELECT 1 FROM public.payments p WHERE p.booking_id=v_payment.booking_id AND p.id<>v_payment.id AND p.status='pending');
    END IF;
  END IF;
  UPDATE public.payment_webhook_logs SET processing_status='completed',processing_result=v_result,processed_at=NOW(),error_message=NULL WHERE id=v_log.id;
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  UPDATE public.payment_webhook_logs SET processing_status='failed',error_message=LEFT(SQLERRM,1000),processed_at=NOW() WHERE id=v_log.id;
  RAISE;
END;
$$;

ALTER TABLE public.refund_requests
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS provider_status TEXT,
  ADD COLUMN IF NOT EXISTS provider_response JSONB,
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reconciliation_locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reconciliation_locked_by TEXT;
UPDATE public.refund_requests SET idempotency_key='refund:'||id::TEXT WHERE idempotency_key IS NULL;
ALTER TABLE public.refund_requests ALTER COLUMN idempotency_key SET NOT NULL;
ALTER TABLE public.refund_requests DROP CONSTRAINT IF EXISTS refund_requests_status_check;
ALTER TABLE public.refund_requests ADD CONSTRAINT refund_requests_status_check CHECK(status IN('pending','approved','processing','completed','rejected','failed','requires_review'));
ALTER TABLE public.refund_requests DROP CONSTRAINT IF EXISTS refund_approved_not_over_requested;
ALTER TABLE public.refund_requests ADD CONSTRAINT refund_approved_not_over_requested CHECK(approved_amount IS NULL OR approved_amount<=requested_amount);
CREATE UNIQUE INDEX IF NOT EXISTS uq_refund_idempotency ON public.refund_requests(idempotency_key);
DROP INDEX IF EXISTS public.uq_open_refund_per_payment;
CREATE UNIQUE INDEX uq_open_refund_per_payment ON public.refund_requests(payment_id) WHERE status IN('pending','approved','processing','requires_review');

CREATE OR REPLACE FUNCTION public.assign_refund_idempotency_key()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.idempotency_key IS NULL THEN NEW.idempotency_key:='refund:'||NEW.id::TEXT; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS refund_assign_idempotency_key ON public.refund_requests;
CREATE TRIGGER refund_assign_idempotency_key BEFORE INSERT ON public.refund_requests FOR EACH ROW EXECUTE FUNCTION public.assign_refund_idempotency_key();

CREATE OR REPLACE FUNCTION public.validate_refund_amount()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
DECLARE v_paid NUMERIC;v_existing NUMERIC;
BEGIN
  SELECT amount_snapshot INTO v_paid FROM public.payments WHERE id=NEW.payment_id FOR UPDATE;
  SELECT COALESCE(SUM(COALESCE(approved_amount,requested_amount)),0) INTO v_existing
  FROM public.refund_requests WHERE payment_id=NEW.payment_id AND id<>NEW.id AND status NOT IN('rejected','failed');
  IF NEW.requested_amount>v_paid OR COALESCE(NEW.approved_amount,NEW.requested_amount)+v_existing>v_paid THEN
    RAISE EXCEPTION 'REFUND_AMOUNT_EXCEEDS_PAYMENT' USING ERRCODE='P0001';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS refund_amount_guard ON public.refund_requests;
CREATE TRIGGER refund_amount_guard BEFORE INSERT OR UPDATE OF requested_amount,approved_amount,status ON public.refund_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_refund_amount();

CREATE OR REPLACE FUNCTION public.complete_refund_v2(p_refund_id UUID,p_provider_refund_id TEXT,p_provider_response JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_refund public.refund_requests%ROWTYPE;v_payment public.payments%ROWTYPE;
BEGIN
  SELECT * INTO v_refund FROM public.refund_requests WHERE id=p_refund_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'REFUND_NOT_FOUND' USING ERRCODE='P0001'; END IF;
  IF v_refund.status='completed' THEN
    UPDATE public.refund_requests SET provider_status='succeeded',provider_refund_id=COALESCE(p_provider_refund_id,provider_refund_id),
      provider_response=COALESCE(p_provider_response,provider_response),last_checked_at=NOW(),reconciliation_locked_by=NULL,
      reconciliation_locked_until=NULL,updated_at=NOW() WHERE id=p_refund_id RETURNING * INTO v_refund;
    RETURN to_jsonb(v_refund);
  END IF;
  IF v_refund.status NOT IN('processing','approved','requires_review') THEN RAISE EXCEPTION 'REFUND_INVALID_STATE' USING ERRCODE='P0001'; END IF;
  SELECT * INTO v_payment FROM public.payments WHERE id=v_refund.payment_id FOR UPDATE;
  UPDATE public.refund_requests SET status='completed',provider_status='succeeded',provider_refund_id=COALESCE(p_provider_refund_id,provider_refund_id),
    provider_response=COALESCE(p_provider_response,'{}'::JSONB),completed_at=NOW(),last_checked_at=NOW(),updated_at=NOW() WHERE id=p_refund_id RETURNING * INTO v_refund;
  UPDATE public.payments SET status='refunded',updated_at=NOW() WHERE id=v_payment.id AND status='refund_pending';
  IF NOT EXISTS(SELECT 1 FROM public.payments WHERE booking_id=v_refund.booking_id AND status='refund_pending') THEN
    UPDATE public.bookings SET status='refunded',updated_at=NOW() WHERE id=v_refund.booking_id AND status='refund_pending';
  END IF;
  RETURN to_jsonb(v_refund);
END;
$$;

CREATE OR REPLACE FUNCTION public.review_refund_request_v2(p_refund_id UUID,p_admin_id UUID,p_action TEXT,p_approved_amount NUMERIC DEFAULT NULL,p_reason TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_refund public.refund_requests%ROWTYPE;v_amount NUMERIC;
BEGIN
  IF COALESCE((SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id=p_admin_id),'')<>'admin' THEN RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE='P0001'; END IF;
  SELECT * INTO v_refund FROM public.refund_requests WHERE id=p_refund_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'REFUND_NOT_FOUND' USING ERRCODE='P0001'; END IF;
  IF p_action='reject' THEN
    IF v_refund.status='rejected' THEN RETURN to_jsonb(v_refund); END IF;
    IF v_refund.status NOT IN('pending','approved','requires_review') THEN RAISE EXCEPTION 'REFUND_ALREADY_PROCESSING' USING ERRCODE='P0001'; END IF;
    UPDATE public.refund_requests SET status='rejected',reviewed_by=p_admin_id,reviewed_at=NOW(),failure_reason=COALESCE(p_reason,'Rejected by reviewer'),updated_at=NOW()
    WHERE id=p_refund_id RETURNING * INTO v_refund;
  ELSIF p_action='approve' THEN
    IF v_refund.status='processing' THEN RETURN to_jsonb(v_refund); END IF;
    IF v_refund.status NOT IN('pending','approved','requires_review') THEN RAISE EXCEPTION 'REFUND_INVALID_STATE' USING ERRCODE='P0001'; END IF;
    v_amount:=COALESCE(p_approved_amount,v_refund.requested_amount);
    IF v_amount<0 OR v_amount>v_refund.requested_amount THEN RAISE EXCEPTION 'REFUND_AMOUNT_EXCEEDS_PAYMENT' USING ERRCODE='P0001'; END IF;
    UPDATE public.refund_requests SET status='processing',approved_amount=v_amount,reviewed_by=p_admin_id,reviewed_at=NOW(),failure_reason=NULL,updated_at=NOW()
    WHERE id=p_refund_id RETURNING * INTO v_refund;
  ELSE RAISE EXCEPTION 'INVALID_REFUND_ACTION' USING ERRCODE='P0001'; END IF;
  RETURN to_jsonb(v_refund);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_refund_reconciliation(p_worker_id TEXT,p_limit INTEGER DEFAULT 20)
RETURNS SETOF public.refund_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  RETURN QUERY WITH candidates AS(
    SELECT id FROM public.refund_requests WHERE
      (status='processing' OR (status='completed' AND provider_refund_id IS NOT NULL))
      AND (reconciliation_locked_until IS NULL OR reconciliation_locked_until<=NOW())
      AND (last_checked_at IS NULL OR last_checked_at<=NOW()-CASE WHEN status='completed' THEN INTERVAL '6 hours' ELSE INTERVAL '30 seconds' END)
    ORDER BY updated_at FOR UPDATE SKIP LOCKED LIMIT LEAST(GREATEST(p_limit,1),100)
  ) UPDATE public.refund_requests r SET reconciliation_locked_by=p_worker_id,reconciliation_locked_until=NOW()+INTERVAL '2 minutes',
    attempts=r.attempts+1,last_checked_at=NOW(),updated_at=NOW() FROM candidates WHERE r.id=candidates.id RETURNING r.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_refund_reconciliation_v2(
  p_refund_id UUID,p_status TEXT,p_provider_refund_id TEXT DEFAULT NULL,p_provider_status TEXT DEFAULT NULL,
  p_provider_response JSONB DEFAULT NULL,p_failure_reason TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_refund public.refund_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_refund FROM public.refund_requests WHERE id=p_refund_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'REFUND_NOT_FOUND' USING ERRCODE='P0001'; END IF;
  IF NOT (
    (v_refund.status IN('processing','requires_review') AND p_status IN('processing','failed','requires_review')) OR
    (v_refund.status='completed' AND p_status IN('completed','requires_review'))
  ) THEN
    RAISE EXCEPTION 'REFUND_INVALID_STATE' USING ERRCODE='P0001';
  END IF;
  UPDATE public.refund_requests SET status=p_status,provider_refund_id=COALESCE(p_provider_refund_id,provider_refund_id),
    provider_status=COALESCE(p_provider_status,provider_status),provider_response=COALESCE(p_provider_response,provider_response),
    failure_reason=p_failure_reason,reconciliation_locked_by=NULL,reconciliation_locked_until=NULL,last_checked_at=NOW(),updated_at=NOW()
  WHERE id=p_refund_id RETURNING * INTO v_refund;
  RETURN to_jsonb(v_refund);
END;
$$;

CREATE TABLE IF NOT EXISTS public.inventory_reconciliation_logs(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),flight_id UUID NOT NULL REFERENCES public.flights(id) ON DELETE CASCADE,
  recorded_available INTEGER NOT NULL,actual_available INTEGER NOT NULL,repaired BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.inventory_reconciliation_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inventory_reconciliation_logs FROM anon,authenticated;

CREATE OR REPLACE FUNCTION public.reconcile_flight_inventory(p_auto_repair BOOLEAN DEFAULT FALSE,p_limit INTEGER DEFAULT 100)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_flight public.flights%ROWTYPE;v_actual INTEGER;v_mismatches INTEGER:=0;v_repairs INTEGER:=0;
BEGIN
  FOR v_flight IN SELECT * FROM public.flights ORDER BY updated_at FOR UPDATE SKIP LOCKED LIMIT LEAST(GREATEST(p_limit,1),1000) LOOP
    SELECT COUNT(*) INTO v_actual FROM public.seats WHERE flight_id=v_flight.id AND status='available';
    IF v_actual<>v_flight.available_seats THEN
      v_mismatches:=v_mismatches+1;
      IF p_auto_repair THEN UPDATE public.flights SET available_seats=v_actual,updated_at=NOW() WHERE id=v_flight.id;v_repairs:=v_repairs+1;END IF;
      INSERT INTO public.inventory_reconciliation_logs(flight_id,recorded_available,actual_available,repaired)
      VALUES(v_flight.id,v_flight.available_seats,v_actual,p_auto_repair);
    END IF;
  END LOOP;
  RETURN jsonb_build_object('mismatches',v_mismatches,'repairs',v_repairs);
END;
$$;

-- Consolidated voluntary cancellation. Legacy cancellation/refund triggers are
-- removed so state transitions happen once in this RPC.
DROP TRIGGER IF EXISTS bookings_enforce_nonrefundable_cancellation ON public.bookings;
DROP TRIGGER IF EXISTS payments_create_refund_request ON public.payments;
DROP TRIGGER IF EXISTS flights_restore_involuntary_refunds ON public.flights;

CREATE OR REPLACE FUNCTION public.cancel_booking_v2(p_booking_id UUID,p_user_id UUID,p_involuntary BOOLEAN DEFAULT FALSE)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_booking public.bookings%ROWTYPE;v_flight public.flights%ROWTYPE;v_fare public.fare_classes%ROWTYPE;v_payment public.payments%ROWTYPE;v_count INTEGER:=0;v_refund NUMERIC:=0;v_previously_refunded NUMERIC:=0;v_status TEXT;v_refund_id UUID;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id=p_booking_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'BOOKING_NOT_FOUND' USING ERRCODE='P0001'; END IF;
  SELECT * INTO v_flight FROM public.flights WHERE id=v_booking.flight_id FOR UPDATE;
  IF NOT p_involuntary AND (v_flight.departure_time<=NOW() OR v_flight.status IN('boarding','departed','arrived','cancelled')) THEN RAISE EXCEPTION 'BOOKING_NOT_CANCELLABLE' USING ERRCODE='P0001'; END IF;
  IF v_booking.status NOT IN('pending','confirmed') THEN RAISE EXCEPTION 'BOOKING_INVALID_STATE' USING ERRCODE='P0001'; END IF;
  SELECT * INTO v_fare FROM public.fare_classes WHERE id=v_booking.fare_id;
  SELECT * INTO v_payment FROM public.payments WHERE booking_id=v_booking.id AND purpose='booking' AND status='success' ORDER BY paid_at DESC LIMIT 1 FOR UPDATE;
  WITH released AS(UPDATE public.seats SET status='available',booking_id=NULL,hold_expires_at=NULL,updated_at=NOW() WHERE booking_id=v_booking.id AND status IN('held','booked') RETURNING id)
  SELECT COUNT(*) INTO v_count FROM released;
  UPDATE public.flights SET available_seats=available_seats+v_count,updated_at=NOW() WHERE id=v_flight.id;
  UPDATE public.payments SET status='expired',updated_at=NOW() WHERE booking_id=v_booking.id AND status='pending';
  UPDATE public.tickets SET status='void',updated_at=NOW() WHERE booking_id=v_booking.id AND status IN('issued','reissued');
  UPDATE public.check_ins SET status='offloaded',updated_at=NOW() WHERE booking_id=v_booking.id AND status='checked_in';
  IF v_payment.id IS NULL THEN v_status:='cancelled';
  ELSE
    v_refund:=CASE WHEN p_involuntary THEN v_payment.amount_snapshot WHEN COALESCE(v_fare.refundable,FALSE) THEN GREATEST(0,v_payment.amount_snapshot-COALESCE(v_fare.cancellation_fee,0)) ELSE 0 END;
    SELECT COALESCE(SUM(COALESCE(approved_amount,requested_amount)),0) INTO v_previously_refunded FROM public.refund_requests
    WHERE payment_id=v_payment.id AND status NOT IN('rejected','failed');
    v_refund:=LEAST(v_refund,GREATEST(0,v_payment.amount_snapshot-v_previously_refunded));
    IF v_refund>0 THEN
      v_status:='refund_pending';UPDATE public.payments SET status='refund_pending',updated_at=NOW() WHERE id=v_payment.id;
      v_refund_id:=gen_random_uuid();
      INSERT INTO public.refund_requests(id,booking_id,payment_id,user_id,reason,requested_amount,idempotency_key,metadata)
      VALUES(v_refund_id,v_booking.id,v_payment.id,v_booking.user_id,CASE WHEN p_involuntary THEN 'Involuntary cancellation' ELSE 'Voluntary cancellation' END,v_refund,'refund:'||v_refund_id::TEXT,jsonb_build_object('involuntary',p_involuntary))
      ON CONFLICT DO NOTHING;
    ELSE v_status:='cancelled'; END IF;
  END IF;
  UPDATE public.bookings SET status=v_status,hold_expires_at=NULL,price_locked_at=NULL,updated_at=NOW() WHERE id=v_booking.id;
  RETURN jsonb_build_object('booking_id',v_booking.id,'status',v_status,'released_seats',v_count,'refund_amount',v_refund);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_flight_v2(p_flight_id UUID,p_admin_id UUID,p_reason TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_flight public.flights%ROWTYPE;v_booking RECORD;v_count INTEGER:=0;
BEGIN
  IF COALESCE((SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id=p_admin_id),'')<>'admin' THEN RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE='P0001'; END IF;
  SELECT * INTO v_flight FROM public.flights WHERE id=p_flight_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'FLIGHT_NOT_FOUND' USING ERRCODE='P0001'; END IF;
  UPDATE public.flights SET status='cancelled',delay_reason=p_reason,updated_at=NOW() WHERE id=p_flight_id;
  FOR v_booking IN SELECT id,user_id FROM public.bookings WHERE flight_id=p_flight_id AND status IN('pending','confirmed') ORDER BY id FOR UPDATE LOOP
    PERFORM public.cancel_booking_v2(v_booking.id,v_booking.user_id,TRUE);v_count:=v_count+1;
  END LOOP;
  PERFORM public.enqueue_outbox_event('flight',p_flight_id,'FLIGHT_CANCELLED',jsonb_build_object('flightId',p_flight_id));
  RETURN jsonb_build_object('flight_id',p_flight_id,'affected_bookings',v_count,'status','cancelled');
END;
$$;

CREATE OR REPLACE FUNCTION public.record_flight_status_event_v2(p_admin_id UUID,p_payload JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_event public.flight_status_events%ROWTYPE;v_status TEXT:=p_payload->>'status';v_flight_id UUID:=(p_payload->>'flight_id')::UUID;
BEGIN
  IF COALESCE((SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id=p_admin_id),'')<>'admin' THEN RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE='P0001'; END IF;
  PERFORM id FROM public.flights WHERE id=v_flight_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'FLIGHT_NOT_FOUND' USING ERRCODE='P0001'; END IF;
  INSERT INTO public.flight_status_events(flight_id,status,message,gate,terminal,baggage_carousel,estimated_departure_time,estimated_arrival_time,created_by)
  VALUES(v_flight_id,v_status,p_payload->>'message',p_payload->>'gate',p_payload->>'terminal',p_payload->>'baggage_carousel',
    NULLIF(p_payload->>'estimated_departure_time','')::TIMESTAMPTZ,NULLIF(p_payload->>'estimated_arrival_time','')::TIMESTAMPTZ,p_admin_id)
  RETURNING * INTO v_event;
  IF v_status='cancelled' THEN PERFORM public.cancel_flight_v2(v_flight_id,p_admin_id,p_payload->>'message');
  ELSE
    UPDATE public.flights SET status=v_status,gate=COALESCE(p_payload->>'gate',gate),terminal=COALESCE(p_payload->>'terminal',terminal),
      baggage_carousel=COALESCE(p_payload->>'baggage_carousel',baggage_carousel),delay_reason=CASE WHEN v_status='delayed' THEN p_payload->>'message' ELSE delay_reason END,
      departure_time=COALESCE(NULLIF(p_payload->>'estimated_departure_time','')::TIMESTAMPTZ,departure_time),
      arrival_time=COALESCE(NULLIF(p_payload->>'estimated_arrival_time','')::TIMESTAMPTZ,arrival_time),
      actual_departure_time=CASE WHEN v_status='departed' THEN NOW() ELSE actual_departure_time END,
      actual_arrival_time=CASE WHEN v_status='arrived' THEN NOW() ELSE actual_arrival_time END,updated_at=NOW() WHERE id=v_flight_id;
    IF v_status='delayed' THEN PERFORM public.enqueue_outbox_event('flight',v_flight_id,'FLIGHT_DELAYED',jsonb_build_object('flightId',v_flight_id,'message',p_payload->>'message')); END IF;
  END IF;
  RETURN to_jsonb(v_event);
END;
$$;

DROP TRIGGER IF EXISTS flights_cancel_bookings_before_update ON public.flights;

-- Harden existing change quotes with optimistic price-version snapshots.
ALTER TABLE public.flight_change_requests
  ADD COLUMN IF NOT EXISTS booking_price_version INTEGER,
  ADD COLUMN IF NOT EXISTS passenger_count INTEGER,
  ADD COLUMN IF NOT EXISTS new_flight_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS fare_rules_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB;
UPDATE public.flight_change_requests r SET booking_price_version=b.price_version,
  passenger_count=(SELECT COUNT(*) FROM public.passengers p WHERE p.booking_id=b.id)
FROM public.bookings b WHERE b.id=r.booking_id AND (r.booking_price_version IS NULL OR r.passenger_count IS NULL);

CREATE OR REPLACE FUNCTION public.create_flight_change_quote_v2(p_booking_id UUID,p_user_id UUID,p_new_flight_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_booking public.bookings%ROWTYPE;v_fare public.fare_classes%ROWTYPE;v_old public.flights%ROWTYPE;v_new public.flights%ROWTYPE;v_count INTEGER;v_new_total NUMERIC;v_difference NUMERIC;v_fee NUMERIC;v_request public.flight_change_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id=p_booking_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND OR v_booking.status<>'confirmed' THEN RAISE EXCEPTION 'BOOKING_INVALID_STATE' USING ERRCODE='P0001'; END IF;
  SELECT * INTO v_fare FROM public.fare_classes WHERE id=v_booking.fare_id AND change_allowed=TRUE;
  IF NOT FOUND THEN RAISE EXCEPTION 'FARE_NOT_AVAILABLE' USING ERRCODE='P0001'; END IF;
  SELECT * INTO v_old FROM public.flights WHERE id=v_booking.flight_id;
  SELECT * INTO v_new FROM public.flights WHERE id=p_new_flight_id;
  SELECT COUNT(*) INTO v_count FROM public.passengers WHERE booking_id=v_booking.id;
  IF v_new.id IS NULL OR v_new.origin_airport_id<>v_old.origin_airport_id OR v_new.destination_airport_id<>v_old.destination_airport_id
     OR NOT public.is_flight_sellable(v_new.id,v_count,v_fare.cabin_class) THEN RAISE EXCEPTION 'FLIGHT_NOT_SELLABLE' USING ERRCODE='P0001'; END IF;
  v_new_total:=public.calculate_flight_price(v_new.id,v_fare.cabin_class,v_fare.id)*v_count;
  v_difference:=v_new_total-v_booking.price_snapshot;
  v_fee:=v_fare.change_fee*v_count;
  INSERT INTO public.flight_change_requests(booking_id,user_id,old_flight_id,new_flight_id,fare_id,old_total,new_fare_total,
    fare_difference,change_fee,additional_amount,refund_amount,status,booking_price_version,passenger_count,new_flight_snapshot,fare_rules_snapshot)
  VALUES(v_booking.id,p_user_id,v_old.id,v_new.id,v_fare.id,v_booking.total_price,v_new_total,v_difference,v_fee,
    GREATEST(0,v_difference+v_fee),GREATEST(0,-(v_difference+v_fee)),'quoted',v_booking.price_version,v_count,
    jsonb_build_object('flightId',v_new.id,'departureTime',v_new.departure_time,'arrivalTime',v_new.arrival_time,'price',v_new_total),
    jsonb_build_object('fareId',v_fare.id,'changeFee',v_fare.change_fee,'refundable',v_fare.refundable,'multiplier',v_fare.price_multiplier))
  RETURNING * INTO v_request;
  RETURN to_jsonb(v_request);
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_flight_change_v2(p_request_id UUID,p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_request public.flight_change_requests%ROWTYPE;v_booking public.bookings%ROWTYPE;v_result JSONB;
BEGIN
  SELECT * INTO v_request FROM public.flight_change_requests WHERE id=p_request_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND OR v_request.quote_expires_at<=NOW() OR v_request.status NOT IN('quoted','pending_payment') THEN RAISE EXCEPTION 'CHANGE_QUOTE_EXPIRED' USING ERRCODE='P0001'; END IF;
  SELECT * INTO v_booking FROM public.bookings WHERE id=v_request.booking_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND OR v_booking.status<>'confirmed' OR v_booking.price_version<>v_request.booking_price_version
    OR (SELECT COUNT(*) FROM public.passengers WHERE booking_id=v_booking.id)<>v_request.passenger_count THEN RAISE EXCEPTION 'CHANGE_QUOTE_STALE' USING ERRCODE='P0001'; END IF;
  PERFORM id FROM public.flights WHERE id IN(v_request.old_flight_id,v_request.new_flight_id) ORDER BY id FOR UPDATE;
  PERFORM id FROM public.seats WHERE flight_id IN(v_request.old_flight_id,v_request.new_flight_id) ORDER BY id FOR UPDATE;
  IF NOT public.is_flight_sellable(v_request.new_flight_id,v_request.passenger_count,
    (SELECT cabin_class FROM public.fare_classes WHERE id=v_request.fare_id)) THEN RAISE EXCEPTION 'INSUFFICIENT_SEATS' USING ERRCODE='P0001'; END IF;
  v_result:=public.apply_flight_change(p_request_id,p_user_id);
  UPDATE public.bookings SET price_version=price_version+1,updated_at=NOW() WHERE id=v_booking.id;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_change_payment_webhook(p_transaction_ref TEXT,p_status TEXT,p_raw_payload JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_payment public.payments%ROWTYPE;v_request public.flight_change_requests%ROWTYPE;v_result JSONB;v_refund_id UUID;
BEGIN
  SELECT * INTO v_payment FROM public.payments WHERE transaction_ref=p_transaction_ref AND purpose='flight_change' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PAYMENT_NOT_FOUND' USING ERRCODE='P0001'; END IF;
  SELECT * INTO v_request FROM public.flight_change_requests WHERE id=v_payment.change_request_id FOR UPDATE;
  IF v_payment.status IN('success','failed','refund_pending','refunded') THEN RETURN jsonb_build_object('processed',FALSE,'payment_id',v_payment.id,'booking_id',v_payment.booking_id,'user_id',v_request.user_id,'payment_status',v_payment.status,'purpose','flight_change'); END IF;
  IF p_status='failed' THEN
    UPDATE public.payments SET status='failed',raw_payload=p_raw_payload,updated_at=NOW() WHERE id=v_payment.id;
    UPDATE public.flight_change_requests SET status='failed',updated_at=NOW() WHERE id=v_request.id;
    RETURN jsonb_build_object('processed',TRUE,'payment_id',v_payment.id,'booking_id',v_payment.booking_id,'user_id',v_request.user_id,'payment_status','failed','purpose','flight_change');
  END IF;
  UPDATE public.payments SET status='success',paid_at=NOW(),raw_payload=p_raw_payload,updated_at=NOW() WHERE id=v_payment.id;
  BEGIN
    v_result:=public.apply_flight_change_v2(v_request.id,v_request.user_id);
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.payments SET status='refund_pending',updated_at=NOW() WHERE id=v_payment.id;
    UPDATE public.flight_change_requests SET status='failed',updated_at=NOW() WHERE id=v_request.id;
    v_refund_id:=gen_random_uuid();
    INSERT INTO public.refund_requests(id,booking_id,payment_id,user_id,reason,requested_amount,idempotency_key,metadata)
    VALUES(v_refund_id,v_payment.booking_id,v_payment.id,v_request.user_id,'Flight change failed after payment',v_payment.amount_snapshot,
      'refund:'||v_refund_id::TEXT,jsonb_build_object('changeRequestId',v_request.id,'failureCode','CHANGE_APPLY_FAILED')) ON CONFLICT DO NOTHING;
    RETURN jsonb_build_object('processed',TRUE,'payment_id',v_payment.id,'booking_id',v_payment.booking_id,'user_id',v_request.user_id,'payment_status','refund_pending','purpose','flight_change','requires_refund',TRUE);
  END;
  RETURN v_result||jsonb_build_object('processed',TRUE,'payment_id',v_payment.id,'user_id',v_request.user_id,'payment_status','success','purpose','flight_change');
END;
$$;

-- Hold-state invariant is installed after normalizing legacy rows.
UPDATE public.seats SET booking_id=NULL,hold_expires_at=NULL WHERE status='available';
-- Older data can contain booked seats whose denormalized booking_id was lost.
-- Recover it only when booking_seats identifies one unambiguous booking.
WITH mapped_bookings AS(
  SELECT bs.seat_id,MIN(bs.booking_id::TEXT)::UUID AS booking_id
  FROM public.booking_seats bs GROUP BY bs.seat_id
  HAVING COUNT(DISTINCT bs.booking_id)=1
)
UPDATE public.seats s SET booking_id=m.booking_id,hold_expires_at=NULL,updated_at=NOW()
FROM mapped_bookings m WHERE s.id=m.seat_id AND s.status='booked';
-- A booked seat without a matching passenger assignment cannot be restored
-- safely, so return it to inventory instead of preserving a phantom booking.
UPDATE public.seats s SET status='available',booking_id=NULL,hold_expires_at=NULL,updated_at=NOW()
WHERE s.status='booked' AND (
  s.booking_id IS NULL OR NOT EXISTS(
    SELECT 1 FROM public.booking_seats bs WHERE bs.seat_id=s.id AND bs.booking_id=s.booking_id
  )
);
UPDATE public.seats SET status='available',booking_id=NULL,hold_expires_at=NULL WHERE status='held' AND (booking_id IS NULL OR hold_expires_at IS NULL);
UPDATE public.seats SET status='available',booking_id=NULL,hold_expires_at=NULL WHERE status='cancelled';
-- The normalization above may change sellable inventory; make the cached
-- counter agree with seat rows before enforcing the constraint.
UPDATE public.flights f SET available_seats=(
  SELECT COUNT(*)::INTEGER FROM public.seats s WHERE s.flight_id=f.id AND s.status='available'
),updated_at=NOW();
ALTER TABLE public.seats DROP CONSTRAINT IF EXISTS seats_status_check;
ALTER TABLE public.seats ADD CONSTRAINT seats_status_check CHECK(status IN('available','held','booked'));
ALTER TABLE public.seats DROP CONSTRAINT IF EXISTS seats_hold_state_check;
ALTER TABLE public.seats ADD CONSTRAINT seats_hold_state_check CHECK(
  (status='available' AND booking_id IS NULL AND hold_expires_at IS NULL) OR
  (status='held' AND booking_id IS NOT NULL AND hold_expires_at IS NOT NULL) OR
  (status='booked' AND booking_id IS NOT NULL AND hold_expires_at IS NULL)
);

REVOKE ALL ON FUNCTION public.enqueue_outbox_event(TEXT,UUID,TEXT,JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_outbox_events(TEXT,INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_outbox_event(UUID,TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fail_outbox_event(UUID,TEXT,TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_booking_v2(UUID,UUID,TEXT,TEXT,TEXT,JSONB,UUID[],UUID,JSONB,JSONB,JSONB,TEXT,TEXT,TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_or_create_payment_intent(UUID,UUID,TEXT,TEXT,TEXT,TEXT,TEXT,UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.expire_payment_intent(UUID,UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_payment_webhook_v2(TEXT,TEXT,TIMESTAMPTZ,UUID,TEXT,TEXT,NUMERIC,TEXT,TEXT,TEXT,TEXT,JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_refund_v2(UUID,TEXT,JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_refund_request_v2(UUID,UUID,TEXT,NUMERIC,TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_refund_reconciliation(TEXT,INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_refund_reconciliation_v2(UUID,TEXT,TEXT,TEXT,JSONB,TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reconcile_flight_inventory(BOOLEAN,INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_booking_v2(UUID,UUID,BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_flight_v2(UUID,UUID,TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_flight_change_quote_v2(UUID,UUID,UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_flight_change_v2(UUID,UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_flight_status_event_v2(UUID,JSONB) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_flight_sellable(UUID,INTEGER,TEXT,INTERVAL) TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_flight_price(UUID,TEXT,UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.search_flights_v2(UUID,UUID,UUID,TIMESTAMPTZ,TIMESTAMPTZ,TEXT,INTEGER,TEXT,INTEGER,INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_booking_v2(UUID,UUID,TEXT,TEXT,TEXT,JSONB,UUID[],UUID,JSONB,JSONB,JSONB,TEXT,TEXT,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_or_create_payment_intent(UUID,UUID,TEXT,TEXT,TEXT,TEXT,TEXT,UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_payment_intent(UUID,UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_payment_webhook_v2(TEXT,TEXT,TIMESTAMPTZ,UUID,TEXT,TEXT,NUMERIC,TEXT,TEXT,TEXT,TEXT,JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_outbox_events(TEXT,INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_outbox_event(UUID,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_outbox_event(UUID,TEXT,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_refund_v2(UUID,TEXT,JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.review_refund_request_v2(UUID,UUID,TEXT,NUMERIC,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_refund_reconciliation(TEXT,INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_refund_reconciliation_v2(UUID,TEXT,TEXT,TEXT,JSONB,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.reconcile_flight_inventory(BOOLEAN,INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_booking_v2(UUID,UUID,BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_flight_v2(UUID,UUID,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_flight_change_quote_v2(UUID,UUID,UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_flight_change_v2(UUID,UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_flight_status_event_v2(UUID,JSONB) TO service_role;

COMMENT ON INDEX public.uq_pending_payment_per_booking_purpose IS 'At most one payable intent exists for a booking and purpose.';
COMMENT ON TABLE public.outbox_events IS 'Durable side effects committed in the same transaction as core state.';
COMMENT ON FUNCTION public.create_booking_v2(UUID,UUID,TEXT,TEXT,TEXT,JSONB,UUID[],UUID,JSONB,JSONB,JSONB,TEXT,TEXT,TEXT)
  IS 'Atomic seat, fare, discount, meal, baggage and ancillary snapshot.';
