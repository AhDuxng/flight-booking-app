INSERT INTO airports (id, code, name, city, country, timezone) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'SIN', 'Singapore Changi Airport', 'Singapore', 'Singapore', 'Asia/Singapore'),
  ('b2000000-0000-0000-0000-000000000002', 'BKK', 'Suvarnabhumi Airport', 'Bangkok', 'Thailand', 'Asia/Bangkok'),
  ('b2000000-0000-0000-0000-000000000003', 'ICN', 'Incheon International Airport', 'Seoul', 'South Korea', 'Asia/Seoul'),
  ('b2000000-0000-0000-0000-000000000004', 'NRT', 'Narita International Airport', 'Tokyo', 'Japan', 'Asia/Tokyo'),
  ('b2000000-0000-0000-0000-000000000005', 'TPE', 'Taiwan Taoyuan International Airport', 'Taipei', 'Taiwan', 'Asia/Taipei'),
  ('b2000000-0000-0000-0000-000000000006', 'KUL', 'Kuala Lumpur International Airport', 'Kuala Lumpur', 'Malaysia', 'Asia/Kuala_Lumpur'),
  ('b2000000-0000-0000-0000-000000000007', 'CDG', 'Paris Charles de Gaulle Airport', 'Paris', 'France', 'Europe/Paris'),
  ('b2000000-0000-0000-0000-000000000008', 'LHR', 'London Heathrow Airport', 'London', 'United Kingdom', 'Europe/London'),
  ('b2000000-0000-0000-0000-000000000009', 'SYD', 'Sydney Kingsford Smith Airport', 'Sydney', 'Australia', 'Australia/Sydney'),
  ('b2000000-0000-0000-0000-000000000010', 'LAX', 'Los Angeles International Airport', 'Los Angeles', 'United States', 'America/Los_Angeles')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  timezone = EXCLUDED.timezone,
  updated_at = NOW();

INSERT INTO flights (
  id, airline_id, aircraft_id, origin_airport_id, destination_airport_id,
  flight_number, departure_time, arrival_time, base_price, available_seats, status
) VALUES
  ('d2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'VN651', NOW() + INTERVAL '2 days 8 hours', NOW() + INTERVAL '2 days 11 hours 15 minutes', 3200000, 24, 'scheduled'),
  ('d2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'VN652', NOW() + INTERVAL '3 days 13 hours', NOW() + INTERVAL '3 days 15 hours 10 minutes', 3100000, 24, 'scheduled'),
  ('d2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 'VN611', NOW() + INTERVAL '4 days 7 hours', NOW() + INTERVAL '4 days 9 hours 5 minutes', 2800000, 24, 'scheduled'),
  ('d2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'VN612', NOW() + INTERVAL '5 days 11 hours', NOW() + INTERVAL '5 days 12 hours 55 minutes', 2750000, 24, 'scheduled'),
  ('d2000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000003', 'VN408', NOW() + INTERVAL '6 days 9 hours', NOW() + INTERVAL '6 days 14 hours 20 minutes', 7500000, 24, 'scheduled'),
  ('d2000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000004', 'VN310', NOW() + INTERVAL '7 days 8 hours', NOW() + INTERVAL '7 days 14 hours 40 minutes', 11800000, 24, 'scheduled'),
  ('d2000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000006', 'VN680', NOW() + INTERVAL '8 days 10 hours', NOW() + INTERVAL '8 days 12 hours 5 minutes', 2500000, 24, 'scheduled'),
  ('d2000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000005', 'VN570', NOW() + INTERVAL '9 days 9 hours', NOW() + INTERVAL '9 days 12 hours 20 minutes', 5200000, 24, 'scheduled')
ON CONFLICT (id) DO UPDATE SET
  airline_id = EXCLUDED.airline_id,
  aircraft_id = EXCLUDED.aircraft_id,
  origin_airport_id = EXCLUDED.origin_airport_id,
  destination_airport_id = EXCLUDED.destination_airport_id,
  flight_number = EXCLUDED.flight_number,
  departure_time = EXCLUDED.departure_time,
  arrival_time = EXCLUDED.arrival_time,
  base_price = EXCLUDED.base_price,
  status = EXCLUDED.status,
  updated_at = NOW();

WITH flight_prices (flight_id, economy_price, business_price) AS (
  VALUES
    ('d2000000-0000-0000-0000-000000000001'::UUID, 3200000::NUMERIC, 6500000::NUMERIC),
    ('d2000000-0000-0000-0000-000000000002'::UUID, 3100000::NUMERIC, 6300000::NUMERIC),
    ('d2000000-0000-0000-0000-000000000003'::UUID, 2800000::NUMERIC, 5600000::NUMERIC),
    ('d2000000-0000-0000-0000-000000000004'::UUID, 2750000::NUMERIC, 5500000::NUMERIC),
    ('d2000000-0000-0000-0000-000000000005'::UUID, 7500000::NUMERIC, 14500000::NUMERIC),
    ('d2000000-0000-0000-0000-000000000006'::UUID, 11800000::NUMERIC, 22000000::NUMERIC),
    ('d2000000-0000-0000-0000-000000000007'::UUID, 2500000::NUMERIC, 4900000::NUMERIC),
    ('d2000000-0000-0000-0000-000000000008'::UUID, 5200000::NUMERIC, 10200000::NUMERIC)
)
INSERT INTO seats (flight_id, seat_number, seat_class, status, price)
SELECT
  flight_prices.flight_id,
  row_number::TEXT || seat_column,
  CASE WHEN row_number = 1 THEN 'business' ELSE 'economy' END,
  'available',
  CASE WHEN row_number = 1 THEN business_price ELSE economy_price END
FROM flight_prices
CROSS JOIN generate_series(1, 4) AS row_number
CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F')) AS columns(seat_column)
ON CONFLICT (flight_id, seat_number) DO UPDATE SET
  seat_class = EXCLUDED.seat_class,
  price = EXCLUDED.price,
  updated_at = NOW();

INSERT INTO baggage_options (id, flight_id, weight_kg, price, description) VALUES
  ('f2000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 20, 450000, 'Hành lý ký gửi 20kg'),
  ('f2000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000002', 20, 450000, 'Hành lý ký gửi 20kg'),
  ('f2000000-0000-0000-0000-000000000003', 'd2000000-0000-0000-0000-000000000003', 20, 400000, 'Hành lý ký gửi 20kg'),
  ('f2000000-0000-0000-0000-000000000004', 'd2000000-0000-0000-0000-000000000004', 20, 400000, 'Hành lý ký gửi 20kg'),
  ('f2000000-0000-0000-0000-000000000005', 'd2000000-0000-0000-0000-000000000005', 23, 650000, 'Hành lý ký gửi 23kg'),
  ('f2000000-0000-0000-0000-000000000006', 'd2000000-0000-0000-0000-000000000006', 23, 800000, 'Hành lý ký gửi 23kg'),
  ('f2000000-0000-0000-0000-000000000007', 'd2000000-0000-0000-0000-000000000007', 20, 350000, 'Hành lý ký gửi 20kg'),
  ('f2000000-0000-0000-0000-000000000008', 'd2000000-0000-0000-0000-000000000008', 20, 500000, 'Hành lý ký gửi 20kg')
ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  updated_at = NOW();

INSERT INTO meal_options (id, flight_id, name, description, price, meal_type) VALUES
  ('f3000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 'Suất ăn quốc tế', 'Cơm gà, rau củ và đồ uống', 180000, 'standard'),
  ('f3000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000002', 'Suất ăn quốc tế', 'Cơm gà, rau củ và đồ uống', 180000, 'standard'),
  ('f3000000-0000-0000-0000-000000000003', 'd2000000-0000-0000-0000-000000000003', 'Suất ăn Halal', 'Suất ăn theo tiêu chuẩn Halal', 170000, 'halal'),
  ('f3000000-0000-0000-0000-000000000004', 'd2000000-0000-0000-0000-000000000004', 'Suất ăn Halal', 'Suất ăn theo tiêu chuẩn Halal', 170000, 'halal'),
  ('f3000000-0000-0000-0000-000000000005', 'd2000000-0000-0000-0000-000000000005', 'Bibimbap chay', 'Cơm trộn rau củ kiểu Hàn', 220000, 'vegetarian'),
  ('f3000000-0000-0000-0000-000000000006', 'd2000000-0000-0000-0000-000000000006', 'Suất ăn Nhật', 'Cơm cá hồi và rau củ', 250000, 'standard'),
  ('f3000000-0000-0000-0000-000000000007', 'd2000000-0000-0000-0000-000000000007', 'Nasi Lemak', 'Cơm dừa kiểu Malaysia', 150000, 'halal'),
  ('f3000000-0000-0000-0000-000000000008', 'd2000000-0000-0000-0000-000000000008', 'Suất ăn Đài Loan', 'Cơm gà và rau củ', 190000, 'standard')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  meal_type = EXCLUDED.meal_type,
  updated_at = NOW();
