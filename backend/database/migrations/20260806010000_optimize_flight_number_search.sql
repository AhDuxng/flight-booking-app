-- Exact public flight-number searches use this partial B-tree index together
-- with the sellable status and departure-time predicates in search_flights_v2.
CREATE INDEX IF NOT EXISTS idx_flights_sellable_number_departure
  ON public.flights (flight_number, departure_time)
  WHERE status IN ('scheduled', 'delayed');
