-- Supabase installs pgcrypto in the extensions schema. The previous trigger
-- used gen_random_bytes() with search_path=public, so booking inserts failed
-- with SQLSTATE 42883. A sequence is simpler, collision-free and portable.
CREATE SEQUENCE IF NOT EXISTS public.booking_reference_seq START WITH 1;

-- Checkout accepts one code and the database enforces the same invariant.
CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_single_discount
  ON public.booking_discounts(booking_id);

CREATE OR REPLACE FUNCTION public.assign_booking_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_reference IS NULL THEN
    NEW.booking_reference :=
      'VF' ||
      TO_CHAR(CURRENT_DATE, 'YYMMDD') ||
      LPAD(NEXTVAL('public.booking_reference_seq')::TEXT, 8, '0');
  END IF;

  IF NEW.fare_id IS NULL THEN
    SELECT id INTO NEW.fare_id
    FROM public.fare_classes
    WHERE code = 'ECO-LITE'
      AND airline_id IS NULL
      AND route_id IS NULL
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_assign_defaults ON public.bookings;
CREATE TRIGGER bookings_assign_defaults
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.assign_booking_defaults();

REVOKE ALL ON FUNCTION public.assign_booking_defaults() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_booking_defaults() TO service_role;

COMMENT ON FUNCTION public.assign_booking_defaults()
  IS 'Assigns a collision-free booking reference without pgcrypto search-path dependencies.';
