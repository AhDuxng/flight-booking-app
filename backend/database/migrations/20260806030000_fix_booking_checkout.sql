-- Make checkout pricing consistent with the selected fare and apply a discount
-- exactly once, after fare pricing and before optional ancillary services.
CREATE OR REPLACE FUNCTION public.create_booking_v2(
  p_user_id UUID, p_flight_id UUID, p_contact_email TEXT, p_contact_phone TEXT,
  p_notes TEXT, p_passengers JSONB, p_seat_ids UUID[], p_fare_id UUID,
  p_baggage JSONB DEFAULT '[]'::JSONB, p_meals JSONB DEFAULT '[]'::JSONB,
  p_ancillaries JSONB DEFAULT '[]'::JSONB, p_discount_code TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL, p_request_hash TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id UUID;
  v_record public.idempotency_records%ROWTYPE;
  v_fare public.fare_classes%ROWTYPE;
  v_flight public.flights%ROWTYPE;
  v_booking public.bookings%ROWTYPE;
  v_discount public.discounts%ROWTYPE;
  v_discount_amount NUMERIC(12,2) := 0;
  v_item JSONB;
  v_passenger_ids UUID[];
  v_index INTEGER;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO public.idempotency_records(user_id, endpoint, idempotency_key, request_hash)
    VALUES (p_user_id, 'POST:/api/bookings', p_idempotency_key, p_request_hash)
    ON CONFLICT DO NOTHING;

    SELECT * INTO v_record
    FROM public.idempotency_records
    WHERE user_id = p_user_id
      AND endpoint = 'POST:/api/bookings'
      AND idempotency_key = p_idempotency_key
    FOR UPDATE;

    IF v_record.request_hash <> p_request_hash THEN
      RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT' USING ERRCODE = 'P0001';
    END IF;
    IF v_record.status = 'completed' THEN
      RETURN (v_record.response_payload->>'bookingId')::UUID;
    END IF;
  END IF;

  SELECT * INTO v_flight FROM public.flights WHERE id = p_flight_id FOR UPDATE;
  IF NOT FOUND OR NOT public.is_flight_sellable(p_flight_id, cardinality(p_seat_ids), NULL) THEN
    RAISE EXCEPTION 'FLIGHT_NOT_SELLABLE' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_fare
  FROM public.fare_classes
  WHERE id = p_fare_id
    AND is_active = TRUE
    AND cabin_class = ALL(
      SELECT seat_class FROM public.seats WHERE id = ANY(p_seat_ids)
    )
    AND (airline_id IS NULL OR airline_id = v_flight.airline_id)
    AND (route_id IS NULL OR route_id = v_flight.route_id)
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FARE_NOT_AVAILABLE' USING ERRCODE = 'P0001';
  END IF;

  BEGIN
    -- The legacy primitive handles passengers, seats, baggage and meals. The
    -- discount is deliberately NULL here so it cannot be consumed twice.
    v_booking_id := public.create_booking(
      p_user_id, p_flight_id, p_contact_email, p_contact_phone, p_notes,
      p_passengers, p_seat_ids, p_baggage, p_meals, NULL
    );
  EXCEPTION
    WHEN SQLSTATE 'P0001' THEN
      RAISE EXCEPTION 'SEAT_NOT_AVAILABLE' USING ERRCODE = 'P0001';
    WHEN SQLSTATE 'P0002' THEN
      RAISE EXCEPTION 'BOOKING_INPUT_INVALID' USING ERRCODE = 'P0001';
  END;

  PERFORM public.set_booking_fare(v_booking_id, p_user_id, p_fare_id);

  IF p_discount_code IS NOT NULL THEN
    SELECT * INTO v_booking FROM public.bookings WHERE id = v_booking_id FOR UPDATE;
    SELECT * INTO v_discount
    FROM public.discounts
    WHERE code = UPPER(TRIM(p_discount_code))
      AND is_active = TRUE
      AND NOW() BETWEEN start_date AND end_date
      AND (max_uses IS NULL OR used_count < max_uses)
      AND applicable_to IN ('all', 'flight')
    FOR UPDATE;

    IF NOT FOUND OR v_booking.total_price < v_discount.min_order_value THEN
      RAISE EXCEPTION 'DISCOUNT_NOT_ELIGIBLE' USING ERRCODE = 'P0001';
    END IF;

    IF v_discount.discount_type = 'percentage' THEN
      v_discount_amount := ROUND(v_booking.total_price * v_discount.discount_value / 100, 2);
      IF v_discount.max_discount IS NOT NULL THEN
        v_discount_amount := LEAST(v_discount_amount, v_discount.max_discount);
      END IF;
    ELSE
      v_discount_amount := LEAST(v_discount.discount_value, v_booking.total_price);
    END IF;

    INSERT INTO public.booking_discounts(booking_id, discount_id, discount_amount)
    VALUES (v_booking_id, v_discount.id, v_discount_amount);
    UPDATE public.discounts
    SET used_count = used_count + 1, updated_at = NOW()
    WHERE id = v_discount.id;
    UPDATE public.bookings
    SET total_price = total_price - v_discount_amount,
        price_version = price_version + 1,
        updated_at = NOW()
    WHERE id = v_booking_id;
  END IF;

  SELECT ARRAY_AGG(bs.passenger_id ORDER BY array_position(p_seat_ids, bs.seat_id))
  INTO v_passenger_ids
  FROM public.booking_seats bs
  WHERE bs.booking_id = v_booking_id;

  FOR v_item IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_ancillaries, '[]'::JSONB))
  LOOP
    v_index := NULLIF(v_item->>'passengerIndex', '')::INTEGER;
    IF v_index IS NOT NULL AND (v_index < 0 OR v_index >= cardinality(v_passenger_ids)) THEN
      RAISE EXCEPTION 'PASSENGER_NOT_OWNED' USING ERRCODE = 'P0001';
    END IF;
    PERFORM public.add_booking_ancillary(
      v_booking_id,
      p_user_id,
      (v_item->>'ancillaryServiceId')::UUID,
      CASE WHEN v_index IS NULL THEN NULL ELSE v_passenger_ids[v_index + 1] END,
      COALESCE((v_item->>'quantity')::INTEGER, 1),
      COALESCE(v_item->'details', '{}'::JSONB)
    );
  END LOOP;

  IF p_idempotency_key IS NOT NULL THEN
    UPDATE public.idempotency_records
    SET status = 'completed',
        response_payload = jsonb_build_object('bookingId', v_booking_id),
        updated_at = NOW()
    WHERE id = v_record.id;
  END IF;

  RETURN v_booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_v2(
  UUID,UUID,TEXT,TEXT,TEXT,JSONB,UUID[],UUID,JSONB,JSONB,JSONB,TEXT,TEXT,TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_v2(
  UUID,UUID,TEXT,TEXT,TEXT,JSONB,UUID[],UUID,JSONB,JSONB,JSONB,TEXT,TEXT,TEXT
) TO service_role;

COMMENT ON FUNCTION public.create_booking_v2(
  UUID,UUID,TEXT,TEXT,TEXT,JSONB,UUID[],UUID,JSONB,JSONB,JSONB,TEXT,TEXT,TEXT
) IS 'Atomic checkout with fare-compatible seats and one post-fare discount application.';
