-- =============================================================
-- FLIGHT BOOKING APP — SEED DATA
-- Chạy sau schema.sql
-- auth.users phải được tạo qua Supabase Auth trước
-- =============================================================


-- =============================================================
-- AIRLINES
-- =============================================================

INSERT INTO airlines (id, code, name, logo_url, country) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'VNA', 'Vietnam Airlines',        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Vietnam_Airlines_logo.svg/200px-Vietnam_Airlines_logo.svg.png', 'Vietnam'),
  ('a1000000-0000-0000-0000-000000000002', 'VJC', 'Vietjet Air',             'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/VietJet_Air_logo.svg/200px-VietJet_Air_logo.svg.png',           'Vietnam'),
  ('a1000000-0000-0000-0000-000000000003', 'BAV', 'Bamboo Airways',          'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Bamboo_Airways_Logo.svg/200px-Bamboo_Airways_Logo.svg.png',       'Vietnam'),
  ('a1000000-0000-0000-0000-000000000004', 'VKE', 'Vietravel Airlines',      NULL,                                                                                                                          'Vietnam'),
  ('a1000000-0000-0000-0000-000000000005', 'SGN', 'Pacific Airlines',        NULL,                                                                                                                          'Vietnam');


-- =============================================================
-- AIRPORTS
-- =============================================================

INSERT INTO airports (id, code, name, city, country, timezone) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'SGN', 'Sân bay Quốc tế Tân Sơn Nhất',   'Hồ Chí Minh', 'Vietnam', 'Asia/Ho_Chi_Minh'),
  ('b1000000-0000-0000-0000-000000000002', 'HAN', 'Sân bay Quốc tế Nội Bài',         'Hà Nội',       'Vietnam', 'Asia/Ho_Chi_Minh'),
  ('b1000000-0000-0000-0000-000000000003', 'DAD', 'Sân bay Quốc tế Đà Nẵng',         'Đà Nẵng',      'Vietnam', 'Asia/Ho_Chi_Minh'),
  ('b1000000-0000-0000-0000-000000000004', 'PQC', 'Sân bay Quốc tế Phú Quốc',        'Phú Quốc',     'Vietnam', 'Asia/Ho_Chi_Minh'),
  ('b1000000-0000-0000-0000-000000000005', 'HUI', 'Sân bay Quốc tế Phú Bài (Huế)',   'Huế',          'Vietnam', 'Asia/Ho_Chi_Minh'),
  ('b1000000-0000-0000-0000-000000000006', 'CXR', 'Sân bay Quốc tế Cam Ranh (Nha Trang)', 'Nha Trang', 'Vietnam', 'Asia/Ho_Chi_Minh'),
  ('b1000000-0000-0000-0000-000000000007', 'VCS', 'Sân bay Côn Đảo',                 'Côn Đảo',      'Vietnam', 'Asia/Ho_Chi_Minh');


-- =============================================================
-- AIRCRAFTS
-- =============================================================

INSERT INTO aircrafts (id, airline_id, code, model, total_seats) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'VN-A321-01', 'Airbus A321',   180),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'VN-B787-01', 'Boeing 787',    247),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'VJ-A320-01', 'Airbus A320',   180),
  ('c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'VJ-A321-01', 'Airbus A321',   230),
  ('c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', 'BB-A319-01', 'Airbus A319',   150),
  ('c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000004', 'VT-ATR-01',  'ATR 72-500',     68);


-- =============================================================
-- FLIGHTS
-- =============================================================

INSERT INTO flights (
  id, airline_id, aircraft_id,
  origin_airport_id, destination_airport_id,
  flight_number, departure_time, arrival_time,
  base_price, available_seats, status
) VALUES
  -- HAN → SGN
  ('d1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001',
   'VN123', NOW() + INTERVAL '2 days 6 hours', NOW() + INTERVAL '2 days 8 hours 10 minutes',
   850000, 120, 'scheduled'),

  -- SGN → HAN
  ('d1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003',
   'b1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002',
   'VJ456', NOW() + INTERVAL '3 days 8 hours', NOW() + INTERVAL '3 days 10 hours 15 minutes',
   680000, 145, 'scheduled'),

  -- SGN → DAD
  ('d1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000005',
   'b1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003',
   'QH789', NOW() + INTERVAL '1 day 7 hours', NOW() + INTERVAL '1 day 8 hours 20 minutes',
   620000, 90, 'scheduled'),

  -- HAN → PQC
  ('d1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002',
   'b1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004',
   'VN101', NOW() + INTERVAL '5 days 10 hours', NOW() + INTERVAL '5 days 12 hours 30 minutes',
   1200000, 200, 'scheduled'),

  -- SGN → CXR
  ('d1000000-0000-0000-0000-000000000005',
   'a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000004',
   'b1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006',
   'VJ202', NOW() + INTERVAL '4 days 9 hours', NOW() + INTERVAL '4 days 10 hours 5 minutes',
   550000, 180, 'scheduled');


-- =============================================================
-- SEATS — Chỉ seed cho flight đầu tiên làm ví dụ
-- Trong thực tế, seats nên được tạo tự động khi flight được tạo
-- =============================================================

-- Economy seats cho VN123 (HAN → SGN): 12 ghế mẫu
INSERT INTO seats (id, flight_id, seat_number, seat_class, status, price) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', '1A', 'business', 'available', 2500000),
  ('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', '1B', 'business', 'available', 2500000),
  ('e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', '1C', 'business', 'available', 2500000),
  ('e1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000001', '10A', 'economy', 'available', 850000),
  ('e1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000001', '10B', 'economy', 'available', 850000),
  ('e1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000001', '10C', 'economy', 'available', 850000),
  ('e1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000001', '11A', 'economy', 'available', 850000),
  ('e1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000001', '11B', 'economy', 'booked',    850000),
  ('e1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000001', '11C', 'economy', 'available', 850000),
  ('e1000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000001', '12A', 'economy', 'available', 800000),
  ('e1000000-0000-0000-0000-000000000011', 'd1000000-0000-0000-0000-000000000001', '12B', 'economy', 'available', 800000),
  ('e1000000-0000-0000-0000-000000000012', 'd1000000-0000-0000-0000-000000000001', '12C', 'economy', 'available', 800000);


-- =============================================================
-- BAGGAGE OPTIONS
-- =============================================================

INSERT INTO baggage_options (flight_id, weight_kg, price, description) VALUES
  -- VN123
  ('d1000000-0000-0000-0000-000000000001', 15, 150000, 'Hành lý 15kg'),
  ('d1000000-0000-0000-0000-000000000001', 20, 200000, 'Hành lý 20kg'),
  ('d1000000-0000-0000-0000-000000000001', 23, 250000, 'Hành lý 23kg'),
  ('d1000000-0000-0000-0000-000000000001', 30, 350000, 'Hành lý 30kg'),
  -- VJ456
  ('d1000000-0000-0000-0000-000000000002', 15, 120000, 'Hành lý 15kg'),
  ('d1000000-0000-0000-0000-000000000002', 20, 180000, 'Hành lý 20kg'),
  ('d1000000-0000-0000-0000-000000000002', 30, 300000, 'Hành lý 30kg'),
  -- QH789
  ('d1000000-0000-0000-0000-000000000003', 15, 130000, 'Hành lý 15kg'),
  ('d1000000-0000-0000-0000-000000000003', 20, 190000, 'Hành lý 20kg'),
  -- VN101
  ('d1000000-0000-0000-0000-000000000004', 20, 200000, 'Hành lý 20kg'),
  ('d1000000-0000-0000-0000-000000000004', 30, 360000, 'Hành lý 30kg'),
  -- VJ202
  ('d1000000-0000-0000-0000-000000000005', 15, 110000, 'Hành lý 15kg'),
  ('d1000000-0000-0000-0000-000000000005', 20, 160000, 'Hành lý 20kg');


-- =============================================================
-- MEAL OPTIONS
-- =============================================================

INSERT INTO meal_options (flight_id, name, description, price, meal_type) VALUES
  -- VN123
  ('d1000000-0000-0000-0000-000000000001', 'Cơm gà nướng',     'Cơm trắng, gà nướng sả ớt, rau cải luộc',  85000, 'standard'),
  ('d1000000-0000-0000-0000-000000000001', 'Mì xào hải sản',   'Mì egg noodle xào tôm, mực và rau củ',     85000, 'standard'),
  ('d1000000-0000-0000-0000-000000000001', 'Cơm chay',         'Cơm trắng, đậu hũ sốt cà chua, rau xào',  75000, 'vegetarian'),
  ('d1000000-0000-0000-0000-000000000001', 'Suất ăn Halal',    'Cơm gà halal, rau củ theo tiêu chuẩn Halal', 90000, 'halal'),
  ('d1000000-0000-0000-0000-000000000001', 'Suất ăn trẻ em',   'Cơm trắng, gà chiên giòn, ngô luộc',       70000, 'child'),
  -- VJ456
  ('d1000000-0000-0000-0000-000000000002', 'Sandwich gà',      'Bánh mì sandwich kẹp gà nướng, rau xà lách', 55000, 'standard'),
  ('d1000000-0000-0000-0000-000000000002', 'Sandwich chay',    'Bánh mì sandwich trứng, rau củ và phô mai',  50000, 'vegetarian'),
  -- QH789
  ('d1000000-0000-0000-0000-000000000003', 'Cơm bò hầm',      'Cơm trắng, bò hầm khoai tây, cà rốt',      90000, 'standard'),
  ('d1000000-0000-0000-0000-000000000003', 'Cơm chay',        'Cơm trắng với các món chay đa dạng',        75000, 'vegetarian'),
  -- VN101
  ('d1000000-0000-0000-0000-000000000004', 'Cơm cá hồi',      'Cơm trắng, cá hồi áp chảo, rau củ hấp',   110000, 'standard'),
  ('d1000000-0000-0000-0000-000000000004', 'Mì phở bò',       'Phở bò truyền thống với rau thơm',         100000, 'standard'),
  ('d1000000-0000-0000-0000-000000000004', 'Chay cao cấp',    'Các món chay đặc biệt theo mùa',            95000, 'vegetarian'),
  -- VJ202
  ('d1000000-0000-0000-0000-000000000005', 'Snack set',        'Bánh quy, hoa quả khô và nước ngọt',        35000, 'standard');


-- =============================================================
-- DISCOUNTS — Mã giảm giá mẫu
-- =============================================================

INSERT INTO discounts (
  code, description, discount_type, discount_value,
  min_order_value, max_discount, max_uses,
  start_date, end_date, applicable_to
) VALUES
  ('WELCOME10',  'Giảm 10% cho khách hàng mới',          'percentage', 10,  500000,  200000, 500,  NOW(),                      NOW() + INTERVAL '90 days',  'all'),
  ('SUMMER2025', 'Khuyến mãi hè 2025 giảm 15%',          'percentage', 15,  800000,  300000, 1000, NOW(),                      NOW() + INTERVAL '60 days',  'flight'),
  ('FLAT50K',    'Giảm ngay 50.000đ mọi đơn hàng',       'fixed',      50000, 300000, NULL,  NULL, NOW(),                      NOW() + INTERVAL '30 days',  'all'),
  ('MEAL20',     'Giảm 20% khi đặt suất ăn',             'percentage', 20,      0,   50000, 200,  NOW(),                      NOW() + INTERVAL '45 days',  'meal'),
  ('BAGGAGE15K', 'Giảm 15.000đ phí hành lý',             'fixed',      15000,   0,   NULL,  NULL, NOW(),                      NOW() + INTERVAL '60 days',  'baggage'),
  ('XMAS2025',   'Khuyến mãi Giáng sinh giảm 20%',       'percentage', 20, 1000000,  500000, 300, '2025-12-20 00:00:00+07',   '2025-12-26 23:59:59+07',    'all'),
  ('EXPIRED',    'Mã đã hết hạn (test)',                  'fixed',      100000,  0,   NULL,  NULL, NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day',    'all');
