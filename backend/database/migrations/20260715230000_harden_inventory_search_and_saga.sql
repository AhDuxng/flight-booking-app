ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ;

ALTER TABLE seats
  ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments
  ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'success', 'failed', 'refund_pending', 'refunded'));

CREATE TABLE IF NOT EXISTS payment_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID,
  provider TEXT NOT NULL,
  transaction_ref TEXT NOT NULL,
  payload JSONB NOT NULL,
  processing_result JSONB,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payment_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_flights_search_route_departure
  ON flights(origin_airport_id, destination_airport_id, departure_time)
  WHERE status IN ('scheduled', 'boarding', 'delayed');
CREATE INDEX IF NOT EXISTS idx_seats_held_expiry
  ON seats(hold_expires_at, flight_id)
  WHERE status = 'held';
CREATE INDEX IF NOT EXISTS idx_bookings_pending_hold_expiry
  ON bookings(hold_expires_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_reference
  ON payment_webhook_logs(provider, transaction_ref, created_at DESC);

-- Bài toán 2 - Flight Search & Dynamic Pricing: cùng công thức ở search và transaction booking để giá hiển thị có quy tắc rõ ràng.
CREATE OR REPLACE FUNCTION public.calculate_dynamic_price_multiplier(
  p_available_seats INTEGER,
  p_total_seats INTEGER
)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_total_seats <= 0 OR p_available_seats::NUMERIC / p_total_seats > 0.50 THEN 1.00
    WHEN p_available_seats::NUMERIC / p_total_seats > 0.25 THEN 1.10
    WHEN p_available_seats::NUMERIC / p_total_seats > 0.10 THEN 1.20
    ELSE 1.35
  END;
$$;

-- Bài toán 1 - Seat Inventory & Concurrency: chỉ Postgres lock seat/flight; Redis không bao giờ là nguồn sự thật của tồn ghế.
CREATE OR REPLACE FUNCTION public.hold_seat(p_seat_id UUID, p_booking_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_flight_id UUID;
  v_seat_flight_id UUID;
  v_hold_expires_at TIMESTAMPTZ := NOW() + INTERVAL '10 minutes';
BEGIN
  SELECT flight_id INTO v_booking_flight_id
  FROM bookings
  WHERE id = p_booking_id
    AND status = 'pending'
    AND (hold_expires_at IS NULL OR hold_expires_at > NOW())
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking is not pending' USING ERRCODE = 'P0002';
  END IF;

  SELECT flight_id INTO v_seat_flight_id
  FROM seats
  WHERE id = p_seat_id AND status = 'available'
  FOR UPDATE;

  IF NOT FOUND OR v_seat_flight_id <> v_booking_flight_id THEN
    RAISE EXCEPTION 'Seat not available' USING ERRCODE = 'P0001';
  END IF;

  UPDATE flights
  SET available_seats = available_seats - 1, updated_at = NOW()
  WHERE id = v_seat_flight_id AND available_seats > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Flight has no available seats' USING ERRCODE = 'P0001';
  END IF;

  UPDATE bookings
  SET hold_expires_at = v_hold_expires_at, updated_at = NOW()
  WHERE id = p_booking_id;

  UPDATE seats
  SET status = 'held', booking_id = p_booking_id, hold_expires_at = v_hold_expires_at, updated_at = NOW()
  WHERE id = p_seat_id;
END;
$$;

-- Bài toán 1 - Seat Inventory & Concurrency: SKIP LOCKED cho phép nhiều worker dọn TTL mà không đụng cùng một ghế.
CREATE OR REPLACE FUNCTION public.release_expired_held_seats()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_released_count INTEGER := 0;
BEGIN
  WITH expired AS (
    SELECT id, flight_id, booking_id
    FROM seats
    WHERE status = 'held'
      AND (hold_expires_at IS NULL OR hold_expires_at <= NOW())
    FOR UPDATE SKIP LOCKED
  ), released AS (
    UPDATE seats seat
    SET status = 'available', booking_id = NULL, hold_expires_at = NULL, updated_at = NOW()
    FROM expired
    WHERE seat.id = expired.id
    RETURNING expired.flight_id, expired.booking_id
  ), flight_counts AS (
    SELECT flight_id, COUNT(*)::INTEGER AS released_count
    FROM released
    GROUP BY flight_id
  ), updated_flights AS (
    UPDATE flights flight
    SET available_seats = available_seats + flight_counts.released_count, updated_at = NOW()
    FROM flight_counts
    WHERE flight.id = flight_counts.flight_id
    RETURNING flight.id
  ), expired_bookings AS (
    SELECT DISTINCT booking_id
    FROM released
    WHERE booking_id IS NOT NULL
  ), updated_bookings AS (
    UPDATE bookings
    SET status = 'cancelled', hold_expires_at = NULL, updated_at = NOW()
    WHERE id IN (SELECT booking_id FROM expired_bookings)
      AND status = 'pending'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_released_count FROM released;

  RETURN v_released_count;
END;
$$;

-- Bài toán 1 + 2: lock theo flight rồi theo seat ID cố định, snapshot giá động trong cùng transaction chống overbooking và lệch giá.
CREATE OR REPLACE FUNCTION public.create_booking(
  p_user_id UUID,
  p_flight_id UUID,
  p_contact_email TEXT,
  p_contact_phone TEXT,
  p_notes TEXT,
  p_passengers JSONB,
  p_seat_ids UUID[],
  p_baggage JSONB DEFAULT '[]'::jsonb,
  p_meals JSONB DEFAULT '[]'::jsonb,
  p_discount_code TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flight flights%ROWTYPE;
  v_booking_id UUID;
  v_passenger_id UUID;
  v_passenger_ids UUID[] := ARRAY[]::UUID[];
  v_seat RECORD;
  v_seat_count INTEGER := 0;
  v_total_seats INTEGER := 0;
  v_ticket_total NUMERIC(12,2) := 0;
  v_total NUMERIC(12,2) := 0;
  v_dynamic_multiplier NUMERIC := 1;
  v_hold_expires_at TIMESTAMPTZ := NOW() + INTERVAL '10 minutes';
  v_selection JSONB;
  v_selection_index INTEGER;
  v_quantity INTEGER;
  v_option_price NUMERIC(12,2);
  v_discount discounts%ROWTYPE;
  v_discount_amount NUMERIC(12,2) := 0;
  v_index INTEGER;
  v_released_count INTEGER := 0;
  v_expired_booking_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  IF jsonb_typeof(p_passengers) <> 'array' OR jsonb_array_length(p_passengers) = 0 THEN
    RAISE EXCEPTION 'Passengers are required' USING ERRCODE = 'P0002';
  END IF;

  IF cardinality(p_seat_ids) <> jsonb_array_length(p_passengers) THEN
    RAISE EXCEPTION 'Each passenger needs one seat' USING ERRCODE = 'P0002';
  END IF;

  IF cardinality(p_seat_ids) <> (SELECT COUNT(DISTINCT id) FROM unnest(p_seat_ids) AS selected_seat(id)) THEN
    RAISE EXCEPTION 'Seats must be unique' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_flight
  FROM flights
  WHERE id = p_flight_id
    AND departure_time > NOW()
    AND status IN ('scheduled', 'delayed')
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Flight is not available for booking' USING ERRCODE = 'P0002';
  END IF;

  WITH expired AS (
    SELECT id, booking_id
    FROM seats
    WHERE flight_id = p_flight_id
      AND status = 'held'
      AND (hold_expires_at IS NULL OR hold_expires_at <= NOW())
    FOR UPDATE SKIP LOCKED
  ), released AS (
    UPDATE seats seat
    SET status = 'available', booking_id = NULL, hold_expires_at = NULL, updated_at = NOW()
    FROM expired
    WHERE seat.id = expired.id
    RETURNING expired.booking_id
  )
  SELECT
    COUNT(*),
    COALESCE(ARRAY_AGG(DISTINCT booking_id) FILTER (WHERE booking_id IS NOT NULL), ARRAY[]::UUID[])
  INTO v_released_count, v_expired_booking_ids
  FROM released;

  IF v_released_count > 0 THEN
    UPDATE flights
    SET available_seats = available_seats + v_released_count, updated_at = NOW()
    WHERE id = p_flight_id;

    UPDATE bookings
    SET status = 'cancelled', hold_expires_at = NULL, updated_at = NOW()
    WHERE id = ANY(v_expired_booking_ids)
      AND status = 'pending';
  END IF;

  SELECT * INTO v_flight FROM flights WHERE id = p_flight_id FOR UPDATE;

  IF v_flight.available_seats < cardinality(p_seat_ids) THEN
    RAISE EXCEPTION 'Flight has insufficient seats' USING ERRCODE = 'P0001';
  END IF;

  FOR v_seat IN
    SELECT id, price
    FROM seats
    WHERE id = ANY(p_seat_ids)
      AND flight_id = p_flight_id
      AND status = 'available'
    ORDER BY id
    FOR UPDATE
  LOOP
    v_seat_count := v_seat_count + 1;
    v_ticket_total := v_ticket_total + v_seat.price;
  END LOOP;

  IF v_seat_count <> cardinality(p_seat_ids) THEN
    RAISE EXCEPTION 'One or more seats are not available' USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*) INTO v_total_seats FROM seats WHERE flight_id = p_flight_id;
  v_dynamic_multiplier := calculate_dynamic_price_multiplier(v_flight.available_seats, v_total_seats);
  v_ticket_total := ROUND(v_ticket_total * v_dynamic_multiplier, 0);
  v_total := v_ticket_total;

  INSERT INTO bookings (
    user_id, flight_id, price_snapshot, total_price, status,
    contact_email, contact_phone, notes, hold_expires_at
  ) VALUES (
    p_user_id, p_flight_id, v_ticket_total, v_total, 'pending',
    p_contact_email, p_contact_phone, p_notes, v_hold_expires_at
  ) RETURNING id INTO v_booking_id;

  UPDATE seats
  SET status = 'held', booking_id = v_booking_id, hold_expires_at = v_hold_expires_at, updated_at = NOW()
  WHERE id = ANY(p_seat_ids);

  UPDATE flights
  SET available_seats = available_seats - cardinality(p_seat_ids), updated_at = NOW()
  WHERE id = p_flight_id;

  FOR v_index IN 0..jsonb_array_length(p_passengers) - 1 LOOP
    INSERT INTO passengers (
      booking_id, first_name, last_name, date_of_birth, gender,
      nationality, passport_number, passenger_type
    ) VALUES (
      v_booking_id, p_passengers -> v_index ->> 'firstName', p_passengers -> v_index ->> 'lastName',
      (p_passengers -> v_index ->> 'dateOfBirth')::DATE, p_passengers -> v_index ->> 'gender',
      p_passengers -> v_index ->> 'nationality', NULLIF(p_passengers -> v_index ->> 'passportNumber', ''),
      COALESCE(p_passengers -> v_index ->> 'passengerType', 'adult')
    ) RETURNING id INTO v_passenger_id;

    v_passenger_ids := array_append(v_passenger_ids, v_passenger_id);
    INSERT INTO booking_seats (booking_id, passenger_id, seat_id)
    VALUES (v_booking_id, v_passenger_id, p_seat_ids[v_index + 1]);
  END LOOP;

  FOR v_selection IN SELECT value FROM jsonb_array_elements(p_baggage) LOOP
    v_selection_index := (v_selection ->> 'passengerIndex')::INTEGER;
    v_quantity := COALESCE((v_selection ->> 'quantity')::INTEGER, 1);

    IF v_selection_index < 0 OR v_selection_index >= array_length(v_passenger_ids, 1) OR v_quantity NOT BETWEEN 1 AND 5 THEN
      RAISE EXCEPTION 'Invalid baggage selection' USING ERRCODE = 'P0002';
    END IF;

    SELECT price INTO v_option_price
    FROM baggage_options
    WHERE id = (v_selection ->> 'baggageOptionId')::UUID
      AND flight_id = p_flight_id AND is_available = true
    FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Baggage option is not available' USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO booking_baggage (booking_id, passenger_id, baggage_option_id, quantity, price_snapshot)
    VALUES (v_booking_id, v_passenger_ids[v_selection_index + 1], (v_selection ->> 'baggageOptionId')::UUID, v_quantity, v_option_price);
    v_total := v_total + (v_option_price * v_quantity);
  END LOOP;

  FOR v_selection IN SELECT value FROM jsonb_array_elements(p_meals) LOOP
    v_selection_index := (v_selection ->> 'passengerIndex')::INTEGER;
    v_quantity := COALESCE((v_selection ->> 'quantity')::INTEGER, 1);

    IF v_selection_index < 0 OR v_selection_index >= array_length(v_passenger_ids, 1) OR v_quantity < 1 THEN
      RAISE EXCEPTION 'Invalid meal selection' USING ERRCODE = 'P0002';
    END IF;

    SELECT price INTO v_option_price
    FROM meal_options
    WHERE id = (v_selection ->> 'mealOptionId')::UUID
      AND flight_id = p_flight_id AND is_available = true
    FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Meal option is not available' USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO booking_meals (booking_id, passenger_id, meal_option_id, quantity, price_snapshot)
    VALUES (v_booking_id, v_passenger_ids[v_selection_index + 1], (v_selection ->> 'mealOptionId')::UUID, v_quantity, v_option_price);
    v_total := v_total + (v_option_price * v_quantity);
  END LOOP;

  IF p_discount_code IS NOT NULL THEN
    SELECT * INTO v_discount
    FROM discounts
    WHERE code = p_discount_code
      AND is_active = true
      AND NOW() BETWEEN start_date AND end_date
      AND (max_uses IS NULL OR used_count < max_uses)
      AND applicable_to IN ('all', 'flight')
    FOR UPDATE;

    IF NOT FOUND OR v_total < v_discount.min_order_value THEN
      RAISE EXCEPTION 'Discount code is not eligible' USING ERRCODE = 'P0002';
    END IF;

    IF v_discount.discount_type = 'percentage' THEN
      v_discount_amount := v_total * v_discount.discount_value / 100;
      IF v_discount.max_discount IS NOT NULL THEN
        v_discount_amount := LEAST(v_discount_amount, v_discount.max_discount);
      END IF;
    ELSE
      v_discount_amount := LEAST(v_discount.discount_value, v_total);
    END IF;

    INSERT INTO booking_discounts (booking_id, discount_id, discount_amount)
    VALUES (v_booking_id, v_discount.id, v_discount_amount);
    UPDATE discounts SET used_count = used_count + 1, updated_at = NOW() WHERE id = v_discount.id;
    v_total := v_total - v_discount_amount;
  END IF;

  UPDATE bookings SET total_price = v_total, updated_at = NOW() WHERE id = v_booking_id;
  RETURN v_booking_id;
END;
$$;

-- Bài toán 3 - Distributed Transaction/Saga: một webhook chỉ chuyển state một lần, callback đến muộn chuyển sang nhánh hoàn tiền bù trừ.
CREATE OR REPLACE FUNCTION public.process_payment_webhook(
  p_booking_id UUID,
  p_transaction_ref TEXT,
  p_provider TEXT,
  p_amount NUMERIC,
  p_status TEXT,
  p_raw_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_payment payments%ROWTYPE;
  v_expected_seat_count INTEGER;
  v_held_seat_count INTEGER;
  v_released_count INTEGER := 0;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_amount <> v_booking.total_price THEN
    RAISE EXCEPTION 'Payment amount does not match booking' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_payment FROM payments WHERE transaction_ref = p_transaction_ref FOR UPDATE;

  IF FOUND AND v_payment.booking_id <> p_booking_id THEN
    RAISE EXCEPTION 'Transaction reference belongs to another booking' USING ERRCODE = 'P0002';
  END IF;

  IF FOUND AND v_payment.status IN ('success', 'failed', 'refund_pending', 'refunded') THEN
    RETURN jsonb_build_object(
      'processed', false, 'payment_id', v_payment.id, 'booking_id', v_booking.id,
      'user_id', v_booking.user_id, 'flight_id', v_booking.flight_id,
      'payment_status', v_payment.status, 'requires_refund', v_payment.status = 'refund_pending'
    );
  END IF;

  IF NOT FOUND THEN
    INSERT INTO payments (booking_id, amount, provider, transaction_ref, status, raw_payload)
    VALUES (p_booking_id, p_amount, p_provider, p_transaction_ref, 'pending', p_raw_payload)
    RETURNING * INTO v_payment;
  END IF;

  IF v_booking.status <> 'pending' THEN
    IF p_status = 'success' AND v_booking.status IN ('cancelled', 'refund_pending') THEN
      UPDATE payments
      SET status = 'refund_pending', paid_at = NOW(), raw_payload = p_raw_payload, updated_at = NOW()
      WHERE id = v_payment.id;
      UPDATE bookings SET status = 'refund_pending', updated_at = NOW() WHERE id = p_booking_id;
      RETURN jsonb_build_object(
        'processed', true, 'payment_id', v_payment.id, 'booking_id', v_booking.id,
        'user_id', v_booking.user_id, 'flight_id', v_booking.flight_id,
        'payment_status', 'refund_pending', 'requires_refund', true
      );
    END IF;

    RAISE EXCEPTION 'Booking is not awaiting payment' USING ERRCODE = 'P0002';
  END IF;

  IF p_status = 'success' THEN
    SELECT COUNT(*) INTO v_expected_seat_count FROM booking_seats WHERE booking_id = p_booking_id;
    SELECT COUNT(*) INTO v_held_seat_count
    FROM seats
    WHERE booking_id = p_booking_id
      AND status = 'held'
      AND hold_expires_at > NOW();

    IF v_booking.hold_expires_at <= NOW() OR v_expected_seat_count = 0 OR v_held_seat_count <> v_expected_seat_count THEN
      WITH released AS (
        UPDATE seats
        SET status = 'available', booking_id = NULL, hold_expires_at = NULL, updated_at = NOW()
        WHERE booking_id = p_booking_id AND status = 'held'
        RETURNING id
      ) SELECT COUNT(*) INTO v_released_count FROM released;

      UPDATE flights
      SET available_seats = available_seats + v_released_count, updated_at = NOW()
      WHERE id = v_booking.flight_id;

      UPDATE payments
      SET status = 'refund_pending', paid_at = NOW(), raw_payload = p_raw_payload, updated_at = NOW()
      WHERE id = v_payment.id;
      UPDATE bookings SET status = 'refund_pending', hold_expires_at = NULL, updated_at = NOW() WHERE id = p_booking_id;
      RETURN jsonb_build_object(
        'processed', true, 'payment_id', v_payment.id, 'booking_id', v_booking.id,
        'user_id', v_booking.user_id, 'flight_id', v_booking.flight_id,
        'payment_status', 'refund_pending', 'requires_refund', true
      );
    END IF;

    UPDATE payments
    SET status = 'success', paid_at = NOW(), raw_payload = p_raw_payload, updated_at = NOW()
    WHERE id = v_payment.id;
    UPDATE bookings SET status = 'paid', updated_at = NOW() WHERE id = p_booking_id;
    UPDATE seats
    SET status = 'booked', hold_expires_at = NULL, updated_at = NOW()
    WHERE booking_id = p_booking_id AND status = 'held';
    UPDATE bookings
    SET status = 'confirmed', hold_expires_at = NULL, updated_at = NOW()
    WHERE id = p_booking_id;
  ELSE
    UPDATE payments
    SET status = 'failed', raw_payload = p_raw_payload, updated_at = NOW()
    WHERE id = v_payment.id;
    WITH released AS (
      UPDATE seats
      SET status = 'available', booking_id = NULL, hold_expires_at = NULL, updated_at = NOW()
      WHERE booking_id = p_booking_id AND status = 'held'
      RETURNING id
    ) SELECT COUNT(*) INTO v_released_count FROM released;
    UPDATE flights
    SET available_seats = available_seats + v_released_count, updated_at = NOW()
    WHERE id = v_booking.flight_id;
    UPDATE bookings
    SET status = 'cancelled', hold_expires_at = NULL, updated_at = NOW()
    WHERE id = p_booking_id;
  END IF;

  RETURN jsonb_build_object(
    'processed', true, 'payment_id', v_payment.id, 'booking_id', v_booking.id,
    'user_id', v_booking.user_id, 'flight_id', v_booking.flight_id,
    'payment_status', p_status, 'requires_refund', false
  );
END;
$$;

REVOKE ALL ON TABLE payment_webhook_logs FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_dynamic_price_multiplier(INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_dynamic_price_multiplier(INTEGER, INTEGER) TO service_role;
