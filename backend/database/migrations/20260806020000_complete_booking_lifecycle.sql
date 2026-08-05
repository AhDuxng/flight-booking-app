BEGIN;

-- A payment may legitimately need more than one partial refund (for example a
-- fare-difference refund followed by an involuntary cancellation refund).
DROP INDEX IF EXISTS public.uq_open_refund_per_payment;
CREATE INDEX IF NOT EXISTS idx_open_refunds_per_payment
  ON public.refund_requests(payment_id)
  WHERE status IN ('pending','approved','processing','requires_review');

-- Check in all selected passengers in one database transaction. Any invalid
-- passenger, document, ticket or seat rolls the whole group back.
CREATE OR REPLACE FUNCTION public.check_in_booking_v2(
  p_booking_id UUID,
  p_passenger_ids UUID[],
  p_user_id UUID,
  p_document_confirmed BOOLEAN,
  p_seat_assignments JSONB DEFAULT '[]'::JSONB
) RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_passenger_id UUID;
  v_seat_id UUID;
  v_check_in_id UUID;
  v_results UUID[] := ARRAY[]::UUID[];
BEGIN
  IF p_passenger_ids IS NULL OR CARDINALITY(p_passenger_ids) < 1 OR CARDINALITY(p_passenger_ids) > 9 THEN
    RAISE EXCEPTION 'INVALID_PASSENGER_COUNT' USING ERRCODE = 'P0001';
  END IF;
  IF (
    SELECT COUNT(DISTINCT passenger_id)
    FROM UNNEST(p_passenger_ids) AS selected_passenger(passenger_id)
  ) <> CARDINALITY(p_passenger_ids) THEN
    RAISE EXCEPTION 'DUPLICATE_PASSENGER' USING ERRCODE = 'P0001';
  END IF;
  IF jsonb_typeof(COALESCE(p_seat_assignments, '[]'::JSONB)) <> 'array' THEN
    RAISE EXCEPTION 'INVALID_SEAT_ASSIGNMENTS' USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(p_seat_assignments, '[]'::JSONB)) assignment
    WHERE NOT ((assignment->>'passengerId')::UUID = ANY(p_passenger_ids))
  ) THEN
    RAISE EXCEPTION 'PASSENGER_NOT_OWNED' USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(p_seat_assignments, '[]'::JSONB)) assignment
    GROUP BY assignment->>'passengerId'
    HAVING COUNT(*) > 1
  ) OR EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(p_seat_assignments, '[]'::JSONB)) assignment
    GROUP BY assignment->>'seatId'
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_SEAT_ASSIGNMENT' USING ERRCODE = 'P0001';
  END IF;

  FOREACH v_passenger_id IN ARRAY p_passenger_ids LOOP
    SELECT (assignment->>'seatId')::UUID
    INTO v_seat_id
    FROM jsonb_array_elements(COALESCE(p_seat_assignments, '[]'::JSONB)) assignment
    WHERE (assignment->>'passengerId')::UUID = v_passenger_id
    LIMIT 1;

    v_check_in_id := public.check_in_passenger(
      p_booking_id,
      v_passenger_id,
      p_user_id,
      p_document_confirmed,
      v_seat_id
    );
    v_results := array_append(v_results, v_check_in_id);
    v_seat_id := NULL;
  END LOOP;

  RETURN v_results;
END;
$$;

-- Expire the matching payment together with a stale quote so another change
-- attempt cannot be blocked by the unique pending-payment constraint.
CREATE OR REPLACE FUNCTION public.expire_flight_change_quote_v2(
  p_request_id UUID,
  p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.flight_change_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request
  FROM public.flight_change_requests
  WHERE id = p_request_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CHANGE_QUOTE_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  IF v_request.quote_expires_at > NOW() THEN
    RETURN to_jsonb(v_request);
  END IF;

  UPDATE public.payments
  SET status = 'expired', updated_at = NOW()
  WHERE change_request_id = v_request.id AND status = 'pending';

  UPDATE public.flight_change_requests
  SET status = 'expired', updated_at = NOW()
  WHERE id = v_request.id AND status IN ('quoted', 'pending_payment')
  RETURNING * INTO v_request;

  RETURN to_jsonb(v_request);
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_stale_flight_change_quotes_v2()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_count INTEGER := 0;
BEGIN
  WITH stale AS (
    SELECT id
    FROM public.flight_change_requests
    WHERE quote_expires_at <= NOW() AND status IN ('quoted', 'pending_payment')
    ORDER BY id
    FOR UPDATE SKIP LOCKED
  ), expired_payments AS (
    UPDATE public.payments payment
    SET status='expired', updated_at=NOW()
    FROM stale
    WHERE payment.change_request_id=stale.id AND payment.status='pending'
    RETURNING payment.id
  ), expired_requests AS (
    UPDATE public.flight_change_requests request
    SET status='expired', updated_at=NOW()
    FROM stale
    WHERE request.id=stale.id
    RETURNING request.id
  )
  SELECT COUNT(*) INTO v_expired_count FROM expired_requests;
  RETURN v_expired_count;
END;
$$;

-- A rejected optional/voluntary refund is terminal. Restore the payment to a
-- successful paid state and leave the already-cancelled booking cancelled.
-- Mandatory compensation refunds can never be rejected by an operator.
CREATE OR REPLACE FUNCTION public.review_refund_request_v2(
  p_refund_id UUID,
  p_admin_id UUID,
  p_action TEXT,
  p_approved_amount NUMERIC DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_refund public.refund_requests%ROWTYPE;
  v_amount NUMERIC;
BEGIN
  IF COALESCE((SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id=p_admin_id), '') <> 'admin' THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;
  SELECT * INTO v_refund FROM public.refund_requests WHERE id=p_refund_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'REFUND_NOT_FOUND' USING ERRCODE='P0001'; END IF;

  IF p_action = 'reject' THEN
    IF v_refund.status = 'rejected' THEN RETURN to_jsonb(v_refund); END IF;
    IF v_refund.status NOT IN ('pending','approved','requires_review') THEN
      RAISE EXCEPTION 'REFUND_ALREADY_PROCESSING' USING ERRCODE='P0001';
    END IF;
    IF LOWER(COALESCE(v_refund.metadata->>'involuntary', 'false')) = 'true'
       OR LOWER(COALESCE(v_refund.metadata->>'latePayment', 'false')) = 'true'
       OR v_refund.metadata ? 'changeRequestId'
       OR v_refund.metadata ? 'failureCode' THEN
      RAISE EXCEPTION 'MANDATORY_REFUND_CANNOT_BE_REJECTED' USING ERRCODE='P0001';
    END IF;

    UPDATE public.refund_requests
    SET status='rejected', reviewed_by=p_admin_id, reviewed_at=NOW(),
        failure_reason=COALESCE(NULLIF(BTRIM(p_reason), ''), 'Rejected by reviewer'), updated_at=NOW()
    WHERE id=p_refund_id RETURNING * INTO v_refund;

    IF NOT EXISTS (
      SELECT 1 FROM public.refund_requests
      WHERE payment_id=v_refund.payment_id AND id<>v_refund.id
        AND status IN ('pending','approved','processing','requires_review')
    ) THEN
      UPDATE public.payments SET status='success', updated_at=NOW()
      WHERE id=v_refund.payment_id AND status='refund_pending';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.refund_requests
      WHERE booking_id=v_refund.booking_id AND id<>v_refund.id
        AND status IN ('pending','approved','processing','requires_review')
    ) THEN
      UPDATE public.bookings SET status='cancelled', updated_at=NOW()
      WHERE id=v_refund.booking_id AND status='refund_pending';
    END IF;
  ELSIF p_action = 'approve' THEN
    IF v_refund.status = 'processing' THEN RETURN to_jsonb(v_refund); END IF;
    IF v_refund.status NOT IN ('pending','approved','requires_review') THEN
      RAISE EXCEPTION 'REFUND_INVALID_STATE' USING ERRCODE='P0001';
    END IF;
    v_amount := COALESCE(p_approved_amount, v_refund.requested_amount);
    IF v_amount < 0 OR v_amount > v_refund.requested_amount THEN
      RAISE EXCEPTION 'REFUND_AMOUNT_EXCEEDS_PAYMENT' USING ERRCODE='P0001';
    END IF;
    UPDATE public.refund_requests
    SET status='processing', approved_amount=v_amount, reviewed_by=p_admin_id,
        reviewed_at=NOW(), failure_reason=NULL, updated_at=NOW()
    WHERE id=p_refund_id RETURNING * INTO v_refund;
  ELSE
    RAISE EXCEPTION 'INVALID_REFUND_ACTION' USING ERRCODE='P0001';
  END IF;

  RETURN to_jsonb(v_refund);
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_refund_v2(
  p_refund_id UUID,
  p_provider_refund_id TEXT,
  p_provider_response JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_refund public.refund_requests%ROWTYPE;
  v_payment public.payments%ROWTYPE;
BEGIN
  SELECT * INTO v_refund FROM public.refund_requests WHERE id=p_refund_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'REFUND_NOT_FOUND' USING ERRCODE='P0001'; END IF;
  IF v_refund.status='completed' THEN
    UPDATE public.refund_requests
    SET provider_status='succeeded',
        provider_refund_id=COALESCE(p_provider_refund_id, provider_refund_id),
        provider_response=COALESCE(p_provider_response, provider_response),
        last_checked_at=NOW(), reconciliation_locked_by=NULL,
        reconciliation_locked_until=NULL, updated_at=NOW()
    WHERE id=p_refund_id RETURNING * INTO v_refund;
    RETURN to_jsonb(v_refund);
  END IF;
  IF v_refund.status NOT IN ('processing','approved','requires_review') THEN
    RAISE EXCEPTION 'REFUND_INVALID_STATE' USING ERRCODE='P0001';
  END IF;

  SELECT * INTO v_payment FROM public.payments WHERE id=v_refund.payment_id FOR UPDATE;
  UPDATE public.refund_requests
  SET status='completed', provider_status='succeeded',
      provider_refund_id=COALESCE(p_provider_refund_id, provider_refund_id),
      provider_response=COALESCE(p_provider_response, '{}'::JSONB),
      completed_at=NOW(), last_checked_at=NOW(), updated_at=NOW(),
      reconciliation_locked_by=NULL, reconciliation_locked_until=NULL
  WHERE id=p_refund_id RETURNING * INTO v_refund;

  IF NOT EXISTS (
    SELECT 1 FROM public.refund_requests
    WHERE payment_id=v_refund.payment_id AND id<>v_refund.id
      AND status IN ('pending','approved','processing','requires_review')
  ) THEN
    UPDATE public.payments SET status='refunded', updated_at=NOW()
    WHERE id=v_payment.id AND status='refund_pending';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.refund_requests
    WHERE booking_id=v_refund.booking_id AND id<>v_refund.id
      AND status IN ('pending','approved','processing','requires_review')
  ) THEN
    UPDATE public.bookings SET status='refunded', updated_at=NOW()
    WHERE id=v_refund.booking_id AND status='refund_pending';
  END IF;
  RETURN to_jsonb(v_refund);
END;
$$;

-- Cancel against every successful charge (original booking and any paid
-- flight-change difference). The fare cancellation fee is deducted once from
-- the aggregate balance; involuntary flight cancellation refunds all balances.
CREATE OR REPLACE FUNCTION public.cancel_booking_v2(
  p_booking_id UUID,
  p_user_id UUID,
  p_involuntary BOOLEAN DEFAULT FALSE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_flight public.flights%ROWTYPE;
  v_fare public.fare_classes%ROWTYPE;
  v_payment public.payments%ROWTYPE;
  v_existing_refund public.refund_requests%ROWTYPE;
  v_released_count INTEGER := 0;
  v_total_paid NUMERIC := 0;
  v_total_previous_refund NUMERIC := 0;
  v_total_new_refund NUMERIC := 0;
  v_previous_refund NUMERIC := 0;
  v_balance NUMERIC := 0;
  v_payment_refund NUMERIC := 0;
  v_fee_remaining NUMERIC := 0;
  v_refund_id UUID;
  v_status TEXT := 'cancelled';
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id=p_booking_id AND user_id=p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'BOOKING_NOT_FOUND' USING ERRCODE='P0001'; END IF;

  SELECT * INTO v_flight FROM public.flights WHERE id=v_booking.flight_id FOR UPDATE;
  IF NOT p_involuntary AND (
    v_flight.departure_time<=NOW() OR v_flight.status IN ('boarding','departed','arrived','cancelled')
  ) THEN
    RAISE EXCEPTION 'BOOKING_NOT_CANCELLABLE' USING ERRCODE='P0001';
  END IF;
  IF v_booking.status NOT IN ('pending','confirmed') THEN
    RAISE EXCEPTION 'BOOKING_INVALID_STATE' USING ERRCODE='P0001';
  END IF;

  SELECT * INTO v_fare FROM public.fare_classes WHERE id=v_booking.fare_id;
  v_fee_remaining := CASE
    WHEN p_involuntary THEN 0
    WHEN COALESCE(v_fare.refundable, FALSE) THEN COALESCE(v_fare.cancellation_fee, 0)
    ELSE 0
  END;

  WITH released AS (
    UPDATE public.seats
    SET status='available', booking_id=NULL, hold_expires_at=NULL, updated_at=NOW()
    WHERE booking_id=v_booking.id AND status IN ('held','booked')
    RETURNING id
  )
  SELECT COUNT(*) INTO v_released_count FROM released;

  UPDATE public.flights
  SET available_seats=available_seats+v_released_count, updated_at=NOW()
  WHERE id=v_flight.id;
  UPDATE public.payments
  SET status='expired', updated_at=NOW()
  WHERE booking_id=v_booking.id AND status='pending';
  UPDATE public.tickets
  SET status='void', updated_at=NOW()
  WHERE booking_id=v_booking.id AND status IN ('issued','reissued');
  UPDATE public.check_ins
  SET status='offloaded', updated_at=NOW()
  WHERE booking_id=v_booking.id AND status='checked_in';

  FOR v_payment IN
    SELECT *
    FROM public.payments
    WHERE booking_id=v_booking.id AND status='success'
      AND purpose IN ('booking','flight_change')
    ORDER BY CASE WHEN purpose='booking' THEN 0 ELSE 1 END, paid_at, id
    FOR UPDATE
  LOOP
    v_total_paid := v_total_paid + v_payment.amount_snapshot;
    SELECT COALESCE(SUM(COALESCE(approved_amount, requested_amount)), 0)
    INTO v_previous_refund
    FROM public.refund_requests
    WHERE payment_id=v_payment.id AND status NOT IN ('rejected','failed');
    v_total_previous_refund := v_total_previous_refund + v_previous_refund;
    v_balance := GREATEST(0, v_payment.amount_snapshot-v_previous_refund);

    IF p_involuntary THEN
      v_payment_refund := v_balance;
    ELSIF COALESCE(v_fare.refundable, FALSE) THEN
      v_payment_refund := GREATEST(0, v_balance-v_fee_remaining);
      v_fee_remaining := GREATEST(0, v_fee_remaining-v_balance);
    ELSE
      v_payment_refund := 0;
    END IF;

    IF v_payment_refund>0 THEN
      v_total_new_refund := v_total_new_refund+v_payment_refund;
      UPDATE public.payments SET status='refund_pending', updated_at=NOW()
      WHERE id=v_payment.id;
      SELECT * INTO v_existing_refund
      FROM public.refund_requests
      WHERE payment_id=v_payment.id
        AND status IN ('pending','approved')
      ORDER BY created_at
      LIMIT 1
      FOR UPDATE;
      IF FOUND THEN
        UPDATE public.refund_requests
        SET requested_amount=requested_amount+v_payment_refund,
            approved_amount=NULL,
            status='pending',
            reason=CASE WHEN p_involuntary THEN 'Involuntary cancellation' ELSE 'Voluntary cancellation' END,
            metadata=metadata||jsonb_build_object(
              'involuntary', p_involuntary,
              'paymentPurpose', v_payment.purpose,
              'mergedCancellationRefund', TRUE
            ),
            failure_reason=NULL,
            updated_at=NOW()
        WHERE id=v_existing_refund.id;
      ELSE
        v_refund_id := gen_random_uuid();
        INSERT INTO public.refund_requests(
          id, booking_id, payment_id, user_id, reason, requested_amount, idempotency_key, metadata
        ) VALUES (
          v_refund_id,
          v_booking.id,
          v_payment.id,
          v_booking.user_id,
          CASE WHEN p_involuntary THEN 'Involuntary cancellation' ELSE 'Voluntary cancellation' END,
          v_payment_refund,
          'refund:'||v_refund_id::TEXT,
          jsonb_build_object('involuntary', p_involuntary, 'paymentPurpose', v_payment.purpose)
        );
      END IF;
    END IF;
  END LOOP;

  IF v_total_new_refund>0 THEN v_status := 'refund_pending'; END IF;
  UPDATE public.bookings
  SET status=v_status, hold_expires_at=NULL, price_locked_at=NULL,
      payment_started_at=NULL, updated_at=NOW()
  WHERE id=v_booking.id;

  RETURN jsonb_build_object(
    'booking_id', v_booking.id,
    'status', v_status,
    'released_seats', v_released_count,
    'paid_amount', v_total_paid,
    'previous_refund_amount', v_total_previous_refund,
    'refund_amount', v_total_new_refund,
    'retained_amount', GREATEST(0, v_total_paid-v_total_previous_refund-v_total_new_refund)
  );
END;
$$;

-- Seats are the inventory source of truth. Normalize legacy denormalized
-- counters once so later incremental updates start from a correct value.
WITH inventory AS (
  SELECT
    flight.id,
    (COUNT(seat.id) FILTER (WHERE seat.status='available'))::INTEGER AS available_count
  FROM public.flights flight
  LEFT JOIN public.seats seat ON seat.flight_id=flight.id
  GROUP BY flight.id
)
UPDATE public.flights flight
SET available_seats=inventory.available_count, updated_at=NOW()
FROM inventory
WHERE flight.id=inventory.id AND flight.available_seats<>inventory.available_count;

REVOKE ALL ON FUNCTION public.check_in_booking_v2(UUID,UUID[],UUID,BOOLEAN,JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_flight_change_quote_v2(UUID,UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_stale_flight_change_quotes_v2() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.review_refund_request_v2(UUID,UUID,TEXT,NUMERIC,TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_booking_v2(UUID,UUID,BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_refund_v2(UUID,TEXT,JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_in_booking_v2(UUID,UUID[],UUID,BOOLEAN,JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_flight_change_quote_v2(UUID,UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_stale_flight_change_quotes_v2() TO service_role;
GRANT EXECUTE ON FUNCTION public.review_refund_request_v2(UUID,UUID,TEXT,NUMERIC,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_booking_v2(UUID,UUID,BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_refund_v2(UUID,TEXT,JSONB) TO service_role;

COMMIT;
