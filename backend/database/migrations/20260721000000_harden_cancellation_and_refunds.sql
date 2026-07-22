CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id UUID, p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_flight flights%ROWTYPE;
  v_released_count INTEGER;
  v_next_status TEXT;
BEGIN
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_flight
  FROM flights
  WHERE id = v_booking.flight_id
  FOR UPDATE;

  IF v_booking.status NOT IN ('pending', 'paid', 'confirmed') THEN
    RAISE EXCEPTION 'Booking cannot be cancelled' USING ERRCODE = 'P0002';
  END IF;

  IF v_flight.departure_time <= NOW() OR v_flight.status IN ('boarding', 'departed', 'arrived', 'cancelled') THEN
    RAISE EXCEPTION 'Flight is no longer eligible for cancellation' USING ERRCODE = 'P0002';
  END IF;

  WITH released AS (
    UPDATE seats
    SET status = 'available', booking_id = NULL, hold_expires_at = NULL, updated_at = NOW()
    WHERE booking_id = p_booking_id AND status IN ('held', 'booked')
    RETURNING id
  )
  SELECT COUNT(*) INTO v_released_count FROM released;

  UPDATE flights
  SET available_seats = available_seats + v_released_count, updated_at = NOW()
  WHERE id = v_booking.flight_id;

  v_next_status := CASE WHEN v_booking.status = 'pending' THEN 'cancelled' ELSE 'refund_pending' END;

  UPDATE bookings
  SET status = v_next_status, hold_expires_at = NULL, updated_at = NOW()
  WHERE id = p_booking_id;

  IF v_next_status = 'refund_pending' THEN
    UPDATE payments
    SET status = 'refund_pending', updated_at = NOW()
    WHERE booking_id = p_booking_id AND status = 'success';
  END IF;

  RETURN p_booking_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_payment_refund(p_payment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment payments%ROWTYPE;
  v_booking bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_payment
  FROM payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_booking
  FROM bookings
  WHERE id = v_payment.booking_id
  FOR UPDATE;

  IF v_payment.status <> 'refund_pending' OR v_booking.status <> 'refund_pending' THEN
    RAISE EXCEPTION 'Payment is not awaiting refund' USING ERRCODE = 'P0002';
  END IF;

  UPDATE payments
  SET status = 'refunded', updated_at = NOW()
  WHERE id = p_payment_id;

  UPDATE bookings
  SET status = 'refunded', updated_at = NOW()
  WHERE id = v_booking.id;

  RETURN jsonb_build_object(
    'payment_id', v_payment.id,
    'booking_id', v_booking.id,
    'user_id', v_booking.user_id,
    'payment_status', 'refunded',
    'booking_status', 'refunded'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_booking(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_payment_refund(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_booking(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_payment_refund(UUID) TO service_role;

-- Cancelling a flight must compensate every affected booking in the same transaction.
CREATE OR REPLACE FUNCTION public.handle_flight_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_released_count INTEGER := 0;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM NEW.status THEN
    WITH released AS (
      UPDATE seats
      SET status = 'available', booking_id = NULL, hold_expires_at = NULL, updated_at = NOW()
      WHERE flight_id = NEW.id AND status IN ('held', 'booked')
      RETURNING id
    )
    SELECT COUNT(*) INTO v_released_count FROM released;

    UPDATE payments
    SET status = 'refund_pending', updated_at = NOW()
    WHERE status = 'success'
      AND booking_id IN (
        SELECT id FROM bookings
        WHERE flight_id = NEW.id AND status IN ('paid', 'confirmed')
      );

    UPDATE bookings
    SET status = CASE
      WHEN status = 'pending' THEN 'cancelled'
      ELSE 'refund_pending'
    END,
    hold_expires_at = NULL,
    updated_at = NOW()
    WHERE flight_id = NEW.id AND status IN ('pending', 'paid', 'confirmed');

    NEW.available_seats := NEW.available_seats + v_released_count;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS flights_cancel_bookings_before_update ON public.flights;
CREATE TRIGGER flights_cancel_bookings_before_update
BEFORE UPDATE OF status ON public.flights
FOR EACH ROW
EXECUTE FUNCTION public.handle_flight_cancellation();

REVOKE ALL ON FUNCTION public.handle_flight_cancellation() FROM PUBLIC;

-- A failed attempt remains retryable while the seat hold is valid. Once the hold
-- expires, the same callback performs the compensating release and cancellation.
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

  SELECT COUNT(*) INTO v_expected_seat_count FROM booking_seats WHERE booking_id = p_booking_id;
  SELECT COUNT(*) INTO v_held_seat_count
  FROM seats
  WHERE booking_id = p_booking_id AND status = 'held' AND hold_expires_at > NOW();

  IF p_status = 'success' THEN
    IF v_booking.hold_expires_at <= NOW() OR v_expected_seat_count = 0 OR v_held_seat_count <> v_expected_seat_count THEN
      WITH released AS (
        UPDATE seats
        SET status = 'available', booking_id = NULL, hold_expires_at = NULL, updated_at = NOW()
        WHERE booking_id = p_booking_id AND status = 'held'
        RETURNING id
      ) SELECT COUNT(*) INTO v_released_count FROM released;
      UPDATE flights SET available_seats = available_seats + v_released_count, updated_at = NOW()
      WHERE id = v_booking.flight_id;
      UPDATE payments
      SET status = 'refund_pending', paid_at = NOW(), raw_payload = p_raw_payload, updated_at = NOW()
      WHERE id = v_payment.id;
      UPDATE bookings SET status = 'refund_pending', hold_expires_at = NULL, updated_at = NOW()
      WHERE id = p_booking_id;
      RETURN jsonb_build_object(
        'processed', true, 'payment_id', v_payment.id, 'booking_id', v_booking.id,
        'user_id', v_booking.user_id, 'flight_id', v_booking.flight_id,
        'payment_status', 'refund_pending', 'requires_refund', true
      );
    END IF;

    UPDATE payments
    SET status = 'success', paid_at = NOW(), raw_payload = p_raw_payload, updated_at = NOW()
    WHERE id = v_payment.id;
    UPDATE seats SET status = 'booked', hold_expires_at = NULL, updated_at = NOW()
    WHERE booking_id = p_booking_id AND status = 'held';
    UPDATE bookings SET status = 'confirmed', hold_expires_at = NULL, updated_at = NOW()
    WHERE id = p_booking_id;
  ELSE
    UPDATE payments SET status = 'failed', raw_payload = p_raw_payload, updated_at = NOW()
    WHERE id = v_payment.id;

    IF v_booking.hold_expires_at <= NOW() OR v_expected_seat_count = 0 OR v_held_seat_count <> v_expected_seat_count THEN
      WITH released AS (
        UPDATE seats
        SET status = 'available', booking_id = NULL, hold_expires_at = NULL, updated_at = NOW()
        WHERE booking_id = p_booking_id AND status = 'held'
        RETURNING id
      ) SELECT COUNT(*) INTO v_released_count FROM released;
      UPDATE flights SET available_seats = available_seats + v_released_count, updated_at = NOW()
      WHERE id = v_booking.flight_id;
      UPDATE bookings SET status = 'cancelled', hold_expires_at = NULL, updated_at = NOW()
      WHERE id = p_booking_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'processed', true, 'payment_id', v_payment.id, 'booking_id', v_booking.id,
    'user_id', v_booking.user_id, 'flight_id', v_booking.flight_id,
    'payment_status', p_status, 'requires_refund', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_payment_webhook(UUID, TEXT, TEXT, NUMERIC, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_payment_webhook(UUID, TEXT, TEXT, NUMERIC, TEXT, JSONB) TO service_role;
