CREATE EXTENSION IF NOT EXISTS "pgcrypto";


CREATE TABLE airlines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  logo_url    TEXT,
  country     TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE airports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  city        TEXT NOT NULL,
  country     TEXT NOT NULL,
  timezone    TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE aircrafts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airline_id    UUID NOT NULL REFERENCES airlines(id) ON DELETE RESTRICT,
  code          TEXT NOT NULL UNIQUE,
  model         TEXT NOT NULL,
  total_seats   INTEGER NOT NULL CHECK (total_seats > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE flights (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airline_id             UUID NOT NULL REFERENCES airlines(id) ON DELETE RESTRICT,
  aircraft_id            UUID NOT NULL REFERENCES aircrafts(id) ON DELETE RESTRICT,
  origin_airport_id      UUID NOT NULL REFERENCES airports(id) ON DELETE RESTRICT,
  destination_airport_id UUID NOT NULL REFERENCES airports(id) ON DELETE RESTRICT,
  flight_number          TEXT NOT NULL,
  departure_time         TIMESTAMPTZ NOT NULL,
  arrival_time           TIMESTAMPTZ NOT NULL,
  base_price             NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
  available_seats        INTEGER NOT NULL CHECK (available_seats >= 0),
  status                 TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_flight_times CHECK (arrival_time > departure_time),
  CONSTRAINT chk_different_airports CHECK (origin_airport_id <> destination_airport_id)
);


CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  phone           TEXT,
  avatar_url      TEXT,
  date_of_birth   DATE,
  gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
  nationality     TEXT,
  passport_number TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  flight_id       UUID NOT NULL REFERENCES flights(id) ON DELETE RESTRICT,
  price_snapshot  NUMERIC(12,2) NOT NULL,
  total_price     NUMERIC(12,2) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'confirmed', 'cancelled', 'refund_pending', 'refunded')),
  contact_email   TEXT NOT NULL,
  contact_phone   TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE passengers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  date_of_birth   DATE NOT NULL,
  gender          TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  nationality     TEXT NOT NULL,
  passport_number TEXT,
  passenger_type  TEXT NOT NULL DEFAULT 'adult'
    CHECK (passenger_type IN ('adult', 'child', 'infant')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE seats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id   UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  booking_id  UUID REFERENCES bookings(id) ON DELETE SET NULL,
  seat_number TEXT NOT NULL,
  seat_class  TEXT NOT NULL DEFAULT 'economy'
    CHECK (seat_class IN ('economy', 'business', 'first')),
  status      TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'held', 'booked', 'cancelled')),
  price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_seat_flight UNIQUE (flight_id, seat_number)
);


CREATE TABLE booking_seats (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
  seat_id      UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_booking_seat UNIQUE (seat_id),
  CONSTRAINT uq_passenger_booking UNIQUE (passenger_id, booking_id)
);


CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency        TEXT NOT NULL DEFAULT 'VND',
  provider        TEXT NOT NULL
    CHECK (provider IN ('vnpay', 'momo', 'stripe', 'cash')),
  transaction_ref TEXT UNIQUE,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  raw_payload     JSONB,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE baggage_options (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id    UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  weight_kg    INTEGER NOT NULL CHECK (weight_kg > 0),
  price        NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  description  TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_baggage_option_flight_weight UNIQUE (flight_id, weight_kg)
);


CREATE TABLE booking_baggage (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  passenger_id      UUID NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
  baggage_option_id UUID NOT NULL REFERENCES baggage_options(id) ON DELETE RESTRICT,
  quantity          INTEGER NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 5),
  price_snapshot    NUMERIC(12,2) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE meal_options (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id    UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  price        NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  meal_type    TEXT NOT NULL DEFAULT 'standard'
    CHECK (meal_type IN ('standard', 'vegetarian', 'halal', 'kosher', 'child', 'diabetic')),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  image_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE booking_meals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id     UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  passenger_id   UUID NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
  meal_option_id UUID NOT NULL REFERENCES meal_options(id) ON DELETE RESTRICT,
  quantity       INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  price_snapshot NUMERIC(12,2) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE discounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  description     TEXT,
  discount_type   TEXT NOT NULL
    CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value  NUMERIC(12,2) NOT NULL CHECK (discount_value > 0),
  min_order_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_discount    NUMERIC(12,2),
  max_uses        INTEGER,
  used_count      INTEGER NOT NULL DEFAULT 0,
  start_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  applicable_to   TEXT NOT NULL DEFAULT 'all'
    CHECK (applicable_to IN ('all', 'flight', 'baggage', 'meal')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_discount_dates CHECK (end_date > start_date),
  CONSTRAINT chk_discount_percentage CHECK (
    discount_type <> 'percentage' OR discount_value <= 100
  )
);


CREATE TABLE booking_discounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  discount_id     UUID NOT NULL REFERENCES discounts(id) ON DELETE RESTRICT,
  discount_amount NUMERIC(12,2) NOT NULL CHECK (discount_amount >= 0),
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_booking_discount UNIQUE (booking_id, discount_id)
);


CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL
    CHECK (type IN (
      'booking_confirmed', 'booking_cancelled', 'payment_success',
      'payment_failed', 'flight_delayed', 'flight_cancelled',
      'refund_processed', 'check_in_reminder', 'general'
    )),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  payload    JSONB,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  flight_id  UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_review_booking UNIQUE (user_id, booking_id)
);


CREATE TABLE admin_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action      TEXT NOT NULL,
  target_id   UUID,
  target_type TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX idx_flights_departure_time     ON flights(departure_time);
CREATE INDEX idx_flights_origin_destination ON flights(origin_airport_id, destination_airport_id);
CREATE INDEX idx_flights_status             ON flights(status);
CREATE INDEX idx_flights_airline            ON flights(airline_id);

CREATE INDEX idx_seats_flight_status        ON seats(flight_id, status);
CREATE INDEX idx_seats_booking              ON seats(booking_id) WHERE booking_id IS NOT NULL;

CREATE INDEX idx_bookings_user_id           ON bookings(user_id);
CREATE INDEX idx_bookings_flight_id         ON bookings(flight_id);
CREATE INDEX idx_bookings_status            ON bookings(status);

CREATE INDEX idx_passengers_booking         ON passengers(booking_id);

CREATE UNIQUE INDEX idx_payments_transaction_ref ON payments(transaction_ref) WHERE transaction_ref IS NOT NULL;
CREATE INDEX idx_payments_booking           ON payments(booking_id);
CREATE INDEX idx_payments_status            ON payments(status);

CREATE INDEX idx_baggage_options_flight     ON baggage_options(flight_id);
CREATE INDEX idx_booking_baggage_booking    ON booking_baggage(booking_id);
CREATE INDEX idx_booking_baggage_passenger  ON booking_baggage(passenger_id);

CREATE INDEX idx_meal_options_flight        ON meal_options(flight_id);
CREATE INDEX idx_booking_meals_booking      ON booking_meals(booking_id);
CREATE INDEX idx_booking_meals_passenger    ON booking_meals(passenger_id);

CREATE INDEX idx_discounts_code             ON discounts(code);
CREATE INDEX idx_discounts_active_dates     ON discounts(is_active, start_date, end_date);
CREATE INDEX idx_booking_discounts_booking  ON booking_discounts(booking_id);

CREATE INDEX idx_notifications_user_unread  ON notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

CREATE INDEX idx_reviews_flight             ON reviews(flight_id);
CREATE INDEX idx_reviews_user               ON reviews(user_id);

CREATE INDEX idx_admin_logs_admin           ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_target          ON admin_logs(target_id) WHERE target_id IS NOT NULL;


ALTER TABLE airlines          ENABLE ROW LEVEL SECURITY;
ALTER TABLE airports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE aircrafts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights           ENABLE ROW LEVEL SECURITY;
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats             ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_seats     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE baggage_options   ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_baggage   ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_options      ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_meals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs        ENABLE ROW LEVEL SECURITY;

CREATE POLICY airlines_public_read ON airlines
  FOR SELECT USING (true);
CREATE POLICY airlines_admin_write ON airlines
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY airports_public_read ON airports
  FOR SELECT USING (true);
CREATE POLICY airports_admin_write ON airports
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY aircrafts_public_read ON aircrafts
  FOR SELECT USING (true);
CREATE POLICY aircrafts_admin_write ON aircrafts
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY flights_public_read ON flights
  FOR SELECT USING (true);
CREATE POLICY flights_admin_write ON flights
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY users_select_own ON users
  FOR SELECT USING (id = auth.uid());
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY users_insert_own ON users
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY users_admin_all ON users
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY bookings_select_own ON bookings
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY bookings_insert_own ON bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY bookings_update_own ON bookings
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY bookings_admin_all ON bookings
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY passengers_select_own ON passengers
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );
CREATE POLICY passengers_insert_own ON passengers
  FOR INSERT WITH CHECK (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );
CREATE POLICY passengers_admin_all ON passengers
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY seats_public_read ON seats
  FOR SELECT USING (true);
CREATE POLICY seats_admin_write ON seats
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY booking_seats_select_own ON booking_seats
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );
CREATE POLICY booking_seats_admin_all ON booking_seats
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY payments_select_own ON payments
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );
CREATE POLICY payments_admin_all ON payments
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY baggage_options_public_read ON baggage_options
  FOR SELECT USING (true);
CREATE POLICY baggage_options_admin_write ON baggage_options
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY booking_baggage_select_own ON booking_baggage
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );
CREATE POLICY booking_baggage_insert_own ON booking_baggage
  FOR INSERT WITH CHECK (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );
CREATE POLICY booking_baggage_admin_all ON booking_baggage
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY meal_options_public_read ON meal_options
  FOR SELECT USING (true);
CREATE POLICY meal_options_admin_write ON meal_options
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY booking_meals_select_own ON booking_meals
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );
CREATE POLICY booking_meals_insert_own ON booking_meals
  FOR INSERT WITH CHECK (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );
CREATE POLICY booking_meals_admin_all ON booking_meals
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY discounts_public_read ON discounts
  FOR SELECT USING (is_active = true AND NOW() BETWEEN start_date AND end_date);
CREATE POLICY discounts_admin_all ON discounts
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY booking_discounts_select_own ON booking_discounts
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );
CREATE POLICY booking_discounts_admin_all ON booking_discounts
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY notifications_own ON notifications
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY reviews_public_read ON reviews
  FOR SELECT USING (is_visible = true);
CREATE POLICY reviews_insert_own ON reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY reviews_update_own ON reviews
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY reviews_admin_all ON reviews
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY admin_logs_admin_read ON admin_logs
  FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');


ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;


CREATE OR REPLACE FUNCTION hold_seat(p_seat_id UUID, p_booking_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM id FROM seats
  WHERE id = p_seat_id AND status = 'available'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seat not available' USING ERRCODE = 'P0001';
  END IF;

  UPDATE seats
  SET status = 'held', booking_id = p_booking_id, updated_at = NOW()
  WHERE id = p_seat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION confirm_seats(p_booking_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE seats
  SET status = 'booked', updated_at = NOW()
  WHERE booking_id = p_booking_id AND status = 'held';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION release_expired_held_seats()
RETURNS integer AS $$
DECLARE
  released_count integer;
BEGIN
  UPDATE seats
  SET status = 'available', booking_id = NULL, updated_at = NOW()
  WHERE status = 'held'
    AND updated_at < NOW() - INTERVAL '10 minutes';

  GET DIAGNOSTICS released_count = ROW_COUNT;
  RETURN released_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION apply_discount(p_code TEXT, p_order_value NUMERIC)
RETURNS TABLE(discount_id UUID, discount_amount NUMERIC) AS $$
DECLARE
  v_discount discounts%ROWTYPE;
  v_amount   NUMERIC;
BEGIN
  SELECT * INTO v_discount
  FROM discounts
  WHERE code = p_code
    AND is_active = true
    AND NOW() BETWEEN start_date AND end_date
    AND (max_uses IS NULL OR used_count < max_uses);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired discount code' USING ERRCODE = 'P0002';
  END IF;

  IF p_order_value < v_discount.min_order_value THEN
    RAISE EXCEPTION 'Order value does not meet minimum requirement' USING ERRCODE = 'P0003';
  END IF;

  IF v_discount.discount_type = 'percentage' THEN
    v_amount := p_order_value * v_discount.discount_value / 100;
    IF v_discount.max_discount IS NOT NULL THEN
      v_amount := LEAST(v_amount, v_discount.max_discount);
    END IF;
  ELSE
    v_amount := LEAST(v_discount.discount_value, p_order_value);
  END IF;

  RETURN QUERY SELECT v_discount.id, v_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
