ALTER POLICY airlines_admin_write ON airlines
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
ALTER POLICY airports_admin_write ON airports
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
ALTER POLICY aircrafts_admin_write ON aircrafts
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
ALTER POLICY flights_admin_write ON flights
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
ALTER POLICY users_admin_all ON users
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
ALTER POLICY bookings_admin_all ON bookings
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
ALTER POLICY passengers_admin_all ON passengers
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
ALTER POLICY seats_admin_write ON seats
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
ALTER POLICY booking_seats_admin_all ON booking_seats
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
ALTER POLICY payments_admin_all ON payments
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
ALTER POLICY baggage_options_admin_write ON baggage_options
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
ALTER POLICY booking_baggage_admin_all ON booking_baggage
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
ALTER POLICY meal_options_admin_write ON meal_options
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
ALTER POLICY booking_meals_admin_all ON booking_meals
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
ALTER POLICY discounts_admin_all ON discounts
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
ALTER POLICY booking_discounts_admin_all ON booking_discounts
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
ALTER POLICY reviews_admin_all ON reviews
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
ALTER POLICY admin_logs_admin_read ON admin_logs
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY bookings_insert_own ON bookings;
DROP POLICY bookings_update_own ON bookings;
DROP POLICY passengers_insert_own ON passengers;
DROP POLICY booking_baggage_insert_own ON booking_baggage;
DROP POLICY booking_meals_insert_own ON booking_meals;
DROP POLICY reviews_insert_own ON reviews;
DROP POLICY reviews_update_own ON reviews;
DROP POLICY notifications_own ON notifications;

CREATE POLICY notifications_select_own ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE booking_seats DROP CONSTRAINT uq_booking_seat;
CREATE INDEX idx_booking_seats_booking_id ON booking_seats(booking_id);
CREATE INDEX idx_booking_seats_seat_id ON booking_seats(seat_id);

CREATE OR REPLACE FUNCTION public.create_flight_with_seats(
  p_airline_id UUID,
  p_aircraft_id UUID,
  p_origin_airport_id UUID,
  p_destination_airport_id UUID,
  p_flight_number TEXT,
  p_departure_time TIMESTAMPTZ,
  p_arrival_time TIMESTAMPTZ,
  p_base_price NUMERIC,
  p_status TEXT,
  p_seats JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aircraft aircrafts%ROWTYPE;
  v_flight_id UUID;
  v_seat JSONB;
  v_seat_count INTEGER;
  v_seat_number TEXT;
  v_index INTEGER;
BEGIN
  IF p_origin_airport_id = p_destination_airport_id OR p_arrival_time <= p_departure_time THEN
    RAISE EXCEPTION 'Invalid flight schedule' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_aircraft
  FROM aircrafts
  WHERE id = p_aircraft_id AND airline_id = p_airline_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aircraft does not belong to airline' USING ERRCODE = 'P0002';
  END IF;

  IF jsonb_typeof(p_seats) <> 'array' THEN
    RAISE EXCEPTION 'Seats must be an array' USING ERRCODE = 'P0002';
  END IF;

  v_seat_count := jsonb_array_length(p_seats);

  IF v_seat_count = 0 THEN
    v_seat_count := v_aircraft.total_seats;
  ELSIF v_seat_count > v_aircraft.total_seats THEN
    RAISE EXCEPTION 'Seat count exceeds aircraft capacity' USING ERRCODE = 'P0002';
  ELSIF (
    SELECT COUNT(DISTINCT value ->> 'seatNumber')
    FROM jsonb_array_elements(p_seats)
  ) <> v_seat_count THEN
    RAISE EXCEPTION 'Seat numbers must be unique' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO flights (
    airline_id, aircraft_id, origin_airport_id, destination_airport_id,
    flight_number, departure_time, arrival_time, base_price, available_seats, status
  ) VALUES (
    p_airline_id, p_aircraft_id, p_origin_airport_id, p_destination_airport_id,
    p_flight_number, p_departure_time, p_arrival_time, p_base_price, v_seat_count, p_status
  ) RETURNING id INTO v_flight_id;

  IF jsonb_array_length(p_seats) = 0 THEN
    FOR v_index IN 1..v_aircraft.total_seats LOOP
      v_seat_number := (((v_index - 1) / 6) + 1)::TEXT || CHR(65 + ((v_index - 1) % 6));
      INSERT INTO seats (flight_id, seat_number, seat_class, price)
      VALUES (v_flight_id, v_seat_number, 'economy', p_base_price);
    END LOOP;
  ELSE
    FOR v_seat IN SELECT value FROM jsonb_array_elements(p_seats) LOOP
      INSERT INTO seats (flight_id, seat_number, seat_class, price)
      VALUES (
        v_flight_id,
        v_seat ->> 'seatNumber',
        COALESCE(v_seat ->> 'seatClass', 'economy'),
        COALESCE((v_seat ->> 'price')::NUMERIC, p_base_price)
      );
    END LOOP;
  END IF;

  RETURN v_flight_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.hold_seat(p_seat_id UUID, p_booking_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_flight_id UUID;
  v_seat_flight_id UUID;
BEGIN
  SELECT flight_id INTO v_booking_flight_id
  FROM bookings
  WHERE id = p_booking_id AND status = 'pending'
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

  UPDATE seats
  SET status = 'held', booking_id = p_booking_id, updated_at = NOW()
  WHERE id = p_seat_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_held_seat(p_seat_id UUID, p_booking_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flight_id UUID;
BEGIN
  SELECT flight_id INTO v_flight_id
  FROM seats
  WHERE id = p_seat_id AND booking_id = p_booking_id AND status = 'held'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Held seat not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE seats
  SET status = 'available', booking_id = NULL, updated_at = NOW()
  WHERE id = p_seat_id;

  UPDATE flights
  SET available_seats = available_seats + 1, updated_at = NOW()
  WHERE id = v_flight_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_expired_held_seats()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seat RECORD;
  v_released_count INTEGER := 0;
BEGIN
  FOR v_seat IN
    SELECT id, flight_id
    FROM seats
    WHERE status = 'held' AND updated_at < NOW() - INTERVAL '10 minutes'
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE seats
    SET status = 'available', booking_id = NULL, updated_at = NOW()
    WHERE id = v_seat.id;

    UPDATE flights
    SET available_seats = available_seats + 1, updated_at = NOW()
    WHERE id = v_seat.flight_id;

    v_released_count := v_released_count + 1;
  END LOOP;

  RETURN v_released_count;
END;
$$;

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
  v_ticket_total NUMERIC(12,2) := 0;
  v_total NUMERIC(12,2) := 0;
  v_selection JSONB;
  v_selection_index INTEGER;
  v_quantity INTEGER;
  v_option_price NUMERIC(12,2);
  v_discount discounts%ROWTYPE;
  v_discount_amount NUMERIC(12,2) := 0;
  v_index INTEGER;
BEGIN
  IF jsonb_typeof(p_passengers) <> 'array' OR jsonb_array_length(p_passengers) = 0 THEN
    RAISE EXCEPTION 'Passengers are required' USING ERRCODE = 'P0002';
  END IF;

  IF cardinality(p_seat_ids) <> jsonb_array_length(p_passengers) THEN
    RAISE EXCEPTION 'Each passenger needs one seat' USING ERRCODE = 'P0002';
  END IF;

  IF cardinality(p_seat_ids) <> (
    SELECT COUNT(DISTINCT id) FROM unnest(p_seat_ids) AS selected_seat(id)
  ) THEN
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

  v_total := v_ticket_total;

  INSERT INTO bookings (
    user_id, flight_id, price_snapshot, total_price, status,
    contact_email, contact_phone, notes
  ) VALUES (
    p_user_id, p_flight_id, v_ticket_total, v_total, 'pending',
    p_contact_email, p_contact_phone, p_notes
  ) RETURNING id INTO v_booking_id;

  UPDATE seats
  SET status = 'held', booking_id = v_booking_id, updated_at = NOW()
  WHERE id = ANY(p_seat_ids);

  UPDATE flights
  SET available_seats = available_seats - cardinality(p_seat_ids), updated_at = NOW()
  WHERE id = p_flight_id;

  FOR v_index IN 0..jsonb_array_length(p_passengers) - 1 LOOP
    INSERT INTO passengers (
      booking_id, first_name, last_name, date_of_birth, gender,
      nationality, passport_number, passenger_type
    ) VALUES (
      v_booking_id,
      p_passengers -> v_index ->> 'firstName',
      p_passengers -> v_index ->> 'lastName',
      (p_passengers -> v_index ->> 'dateOfBirth')::DATE,
      p_passengers -> v_index ->> 'gender',
      p_passengers -> v_index ->> 'nationality',
      NULLIF(p_passengers -> v_index ->> 'passportNumber', ''),
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
      AND flight_id = p_flight_id
      AND is_available = true
    FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Baggage option is not available' USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO booking_baggage (
      booking_id, passenger_id, baggage_option_id, quantity, price_snapshot
    ) VALUES (
      v_booking_id, v_passenger_ids[v_selection_index + 1],
      (v_selection ->> 'baggageOptionId')::UUID, v_quantity, v_option_price
    );

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
      AND flight_id = p_flight_id
      AND is_available = true
    FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Meal option is not available' USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO booking_meals (
      booking_id, passenger_id, meal_option_id, quantity, price_snapshot
    ) VALUES (
      v_booking_id, v_passenger_ids[v_selection_index + 1],
      (v_selection ->> 'mealOptionId')::UUID, v_quantity, v_option_price
    );

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

    UPDATE discounts
    SET used_count = used_count + 1, updated_at = NOW()
    WHERE id = v_discount.id;

    v_total := v_total - v_discount_amount;
  END IF;

  UPDATE bookings
  SET total_price = v_total, updated_at = NOW()
  WHERE id = v_booking_id;

  RETURN v_booking_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id UUID, p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_released_count INTEGER;
BEGIN
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_booking.status NOT IN ('pending', 'paid', 'confirmed') THEN
    RAISE EXCEPTION 'Booking cannot be cancelled' USING ERRCODE = 'P0002';
  END IF;

  WITH released AS (
    UPDATE seats
    SET status = 'available', booking_id = NULL, updated_at = NOW()
    WHERE booking_id = p_booking_id AND status IN ('held', 'booked')
    RETURNING id
  )
  SELECT COUNT(*) INTO v_released_count FROM released;

  UPDATE flights
  SET available_seats = available_seats + v_released_count, updated_at = NOW()
  WHERE id = v_booking.flight_id;

  UPDATE bookings
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_booking_id;

  RETURN p_booking_id;
END;
$$;

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
  v_released_count INTEGER;
BEGIN
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_amount <> v_booking.total_price THEN
    RAISE EXCEPTION 'Payment amount does not match booking' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_payment
  FROM payments
  WHERE transaction_ref = p_transaction_ref
  FOR UPDATE;

  IF FOUND AND v_payment.booking_id <> p_booking_id THEN
    RAISE EXCEPTION 'Transaction reference belongs to another booking' USING ERRCODE = 'P0002';
  END IF;

  IF FOUND AND v_payment.status IN ('success', 'failed') THEN
    RETURN jsonb_build_object(
      'processed', false,
      'payment_id', v_payment.id,
      'booking_id', v_booking.id,
      'user_id', v_booking.user_id,
      'payment_status', v_payment.status
    );
  END IF;

  IF NOT FOUND THEN
    INSERT INTO payments (
      booking_id, amount, provider, transaction_ref, status, raw_payload
    ) VALUES (
      p_booking_id, p_amount, p_provider, p_transaction_ref, 'pending', p_raw_payload
    ) RETURNING * INTO v_payment;
  END IF;

  IF v_booking.status <> 'pending' THEN
    RAISE EXCEPTION 'Booking is not awaiting payment' USING ERRCODE = 'P0002';
  END IF;

  IF p_status = 'success' THEN
    SELECT COUNT(*) INTO v_expected_seat_count
    FROM booking_seats
    WHERE booking_id = p_booking_id;

    SELECT COUNT(*) INTO v_held_seat_count
    FROM seats
    WHERE booking_id = p_booking_id AND status = 'held';

    IF v_expected_seat_count = 0 OR v_held_seat_count <> v_expected_seat_count THEN
      RAISE EXCEPTION 'Held seats have expired' USING ERRCODE = 'P0001';
    END IF;

    UPDATE payments
    SET status = 'success', paid_at = NOW(), raw_payload = p_raw_payload, updated_at = NOW()
    WHERE id = v_payment.id;

    UPDATE bookings
    SET status = 'paid', updated_at = NOW()
    WHERE id = p_booking_id;

    UPDATE seats
    SET status = 'booked', updated_at = NOW()
    WHERE booking_id = p_booking_id AND status = 'held';

    UPDATE bookings
    SET status = 'confirmed', updated_at = NOW()
    WHERE id = p_booking_id;
  ELSE
    UPDATE payments
    SET status = 'failed', raw_payload = p_raw_payload, updated_at = NOW()
    WHERE id = v_payment.id;

    WITH released AS (
      UPDATE seats
      SET status = 'available', booking_id = NULL, updated_at = NOW()
      WHERE booking_id = p_booking_id AND status = 'held'
      RETURNING id
    )
    SELECT COUNT(*) INTO v_released_count FROM released;

    UPDATE flights
    SET available_seats = available_seats + v_released_count, updated_at = NOW()
    WHERE id = v_booking.flight_id;

    UPDATE bookings
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = p_booking_id;
  END IF;

  RETURN jsonb_build_object(
    'processed', true,
    'payment_id', v_payment.id,
    'booking_id', v_booking.id,
    'user_id', v_booking.user_id,
    'payment_status', p_status
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'flights', (SELECT COUNT(*) FROM flights),
    'scheduledFlights', (SELECT COUNT(*) FROM flights WHERE status IN ('scheduled', 'boarding', 'delayed')),
    'bookings', (SELECT COUNT(*) FROM bookings),
    'pendingBookings', (SELECT COUNT(*) FROM bookings WHERE status = 'pending'),
    'confirmedBookings', (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'),
    'revenue', COALESCE((SELECT SUM(total_price) FROM bookings WHERE status = 'confirmed'), 0),
    'users', (SELECT COUNT(*) FROM users)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.hold_seat(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_seats(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_expired_held_seats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_discount(TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_held_seat(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_booking(UUID, UUID, TEXT, TEXT, TEXT, JSONB, UUID[], JSONB, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancel_booking(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_payment_webhook(UUID, TEXT, TEXT, NUMERIC, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_flight_with_seats(UUID, UUID, UUID, UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, NUMERIC, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.hold_seat(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_seats(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_expired_held_seats() TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_discount(TEXT, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_held_seat(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_booking(UUID, UUID, TEXT, TEXT, TEXT, JSONB, UUID[], JSONB, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_booking(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_payment_webhook(UUID, TEXT, TEXT, NUMERIC, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_flight_with_seats(UUID, UUID, UUID, UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, NUMERIC, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard() TO service_role;
