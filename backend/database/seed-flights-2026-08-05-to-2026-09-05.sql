-- ============================================================================
-- DEMO FLIGHT NETWORK: 2026-08-05 through 2026-09-05 (inclusive)
-- Run after every migration, especially 20260725000000 and 20260802000000.
-- Safe to run repeatedly: natural keys and schedule instances are upserted.
-- ============================================================================

BEGIN;
SELECT pg_advisory_xact_lock(hashtext('vietfly-seed-2026-08-05-2026-09-05'));

-- Airlines -------------------------------------------------------------------
-- The original seed accidentally used the airport code SGN for Pacific
-- Airlines. Repair that legacy row when PIC is not already present.
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.airlines WHERE code='SGN' AND name ILIKE '%Pacific%')
     AND NOT EXISTS(SELECT 1 FROM public.airlines WHERE code='PIC') THEN
    UPDATE public.airlines SET code='PIC',updated_at=NOW()
    WHERE code='SGN' AND name ILIKE '%Pacific%';
  END IF;
END;
$$;

INSERT INTO public.airlines(code,name,country,logo_url,is_active) VALUES
  ('VNA','Vietnam Airlines','Vietnam','https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Vietnam_Airlines_logo.svg/200px-Vietnam_Airlines_logo.svg.png',TRUE),
  ('VJC','Vietjet Air','Vietnam','https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/VietJet_Air_logo.svg/200px-VietJet_Air_logo.svg.png',TRUE),
  ('BAV','Bamboo Airways','Vietnam','https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Bamboo_Airways_Logo.svg/200px-Bamboo_Airways_Logo.svg.png',TRUE),
  ('VKE','Vietravel Airlines','Vietnam',NULL,TRUE),
  ('PIC','Pacific Airlines','Vietnam',NULL,TRUE),
  ('VFC','VASCO','Vietnam',NULL,TRUE),
  ('SIA','Singapore Airlines','Singapore',NULL,TRUE),
  ('THA','Thai Airways','Thailand',NULL,TRUE),
  ('AXM','AirAsia','Malaysia',NULL,TRUE),
  ('KAL','Korean Air','South Korea',NULL,TRUE),
  ('JAL','Japan Airlines','Japan',NULL,TRUE),
  ('CAL','China Airlines','Taiwan',NULL,TRUE),
  ('UAE','Emirates','United Arab Emirates',NULL,TRUE),
  ('QTR','Qatar Airways','Qatar',NULL,TRUE),
  ('CPA','Cathay Pacific','Hong Kong',NULL,TRUE)
ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,country=EXCLUDED.country,
  logo_url=COALESCE(EXCLUDED.logo_url,public.airlines.logo_url),is_active=TRUE,updated_at=NOW();

-- Airports -------------------------------------------------------------------
INSERT INTO public.airports(code,name,city,country,timezone) VALUES
  ('SGN','Tan Son Nhat International Airport','Ho Chi Minh City','Vietnam','Asia/Ho_Chi_Minh'),
  ('HAN','Noi Bai International Airport','Hanoi','Vietnam','Asia/Ho_Chi_Minh'),
  ('DAD','Da Nang International Airport','Da Nang','Vietnam','Asia/Ho_Chi_Minh'),
  ('PQC','Phu Quoc International Airport','Phu Quoc','Vietnam','Asia/Ho_Chi_Minh'),
  ('CXR','Cam Ranh International Airport','Nha Trang','Vietnam','Asia/Ho_Chi_Minh'),
  ('HUI','Phu Bai International Airport','Hue','Vietnam','Asia/Ho_Chi_Minh'),
  ('DLI','Lien Khuong Airport','Da Lat','Vietnam','Asia/Ho_Chi_Minh'),
  ('VCA','Can Tho International Airport','Can Tho','Vietnam','Asia/Ho_Chi_Minh'),
  ('HPH','Cat Bi International Airport','Hai Phong','Vietnam','Asia/Ho_Chi_Minh'),
  ('VII','Vinh International Airport','Vinh','Vietnam','Asia/Ho_Chi_Minh'),
  ('VCS','Con Dao Airport','Con Dao','Vietnam','Asia/Ho_Chi_Minh'),
  ('BMV','Buon Ma Thuot Airport','Buon Ma Thuot','Vietnam','Asia/Ho_Chi_Minh'),
  ('UIH','Phu Cat Airport','Quy Nhon','Vietnam','Asia/Ho_Chi_Minh'),
  ('SIN','Singapore Changi Airport','Singapore','Singapore','Asia/Singapore'),
  ('BKK','Suvarnabhumi Airport','Bangkok','Thailand','Asia/Bangkok'),
  ('KUL','Kuala Lumpur International Airport','Kuala Lumpur','Malaysia','Asia/Kuala_Lumpur'),
  ('ICN','Incheon International Airport','Seoul','South Korea','Asia/Seoul'),
  ('NRT','Narita International Airport','Tokyo','Japan','Asia/Tokyo'),
  ('TPE','Taiwan Taoyuan International Airport','Taipei','Taiwan','Asia/Taipei'),
  ('HKG','Hong Kong International Airport','Hong Kong','Hong Kong','Asia/Hong_Kong'),
  ('DXB','Dubai International Airport','Dubai','United Arab Emirates','Asia/Dubai'),
  ('DOH','Hamad International Airport','Doha','Qatar','Asia/Qatar')
ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,city=EXCLUDED.city,country=EXCLUDED.country,
  timezone=EXCLUDED.timezone,updated_at=NOW();

-- Aircraft: seed-specific codes avoid colliding with an existing fleet. -------
WITH fleet(airline_code,code,model,total_seats) AS (VALUES
  ('VNA','SEED26-VN-A321','Airbus A321',180),
  ('VNA','SEED26-VN-B789','Boeing 787-9',247),
  ('VJC','SEED26-VJ-A321','Airbus A321neo',230),
  ('BAV','SEED26-QH-A320','Airbus A320',180),
  ('VKE','SEED26-VU-A321','Airbus A321',220),
  ('PIC','SEED26-BL-A320','Airbus A320',180),
  ('VFC','SEED26-0V-ATR72','ATR 72-500',68),
  ('SIA','SEED26-SQ-B78X','Boeing 787-10',337),
  ('THA','SEED26-TG-A359','Airbus A350-900',321),
  ('AXM','SEED26-AK-A320','Airbus A320',180),
  ('KAL','SEED26-KE-B789','Boeing 787-9',269),
  ('JAL','SEED26-JL-B788','Boeing 787-8',206),
  ('CAL','SEED26-CI-A321','Airbus A321neo',180),
  ('UAE','SEED26-EK-B77W','Boeing 777-300ER',354),
  ('QTR','SEED26-QR-B788','Boeing 787-8',254),
  ('CPA','SEED26-CX-A333','Airbus A330-300',293)
)
INSERT INTO public.aircrafts(airline_id,code,model,total_seats)
SELECT a.id,f.code,f.model,f.total_seats FROM fleet f JOIN public.airlines a ON a.code=f.airline_code
ON CONFLICT(code) DO UPDATE SET airline_id=EXCLUDED.airline_id,model=EXCLUDED.model,
  total_seats=EXCLUDED.total_seats,updated_at=NOW();

-- Routes are inserted independently so the seed never relies on a staging
-- relation (temporary or persistent).
WITH route_seed(origin_code,destination_code,duration_minutes) AS(VALUES
  ('HAN','SGN',130),('SGN','HAN',130),('SGN','DAD',85),('DAD','SGN',85),
  ('HAN','DAD',80),('DAD','HAN',80),('SGN','PQC',65),('PQC','SGN',65),
  ('HAN','PQC',130),('PQC','HAN',130),('SGN','CXR',60),('CXR','SGN',60),
  ('SGN','DLI',55),('DLI','SGN',55),('HAN','HUI',75),('HUI','HAN',75),
  ('SGN','VCA',45),('VCA','SGN',45),('SGN','VCS',55),('VCS','SGN',55),
  ('HAN','CXR',115),('CXR','HAN',115),('HAN','VII',55),('VII','HAN',55),
  ('SGN','BMV',60),('BMV','SGN',60),('HAN','UIH',95),('UIH','HAN',95),
  ('SGN','SIN',125),('SIN','SGN',125),('HAN','SIN',195),('SIN','HAN',195),
  ('SGN','BKK',95),('BKK','SGN',95),('HAN','BKK',115),('BKK','HAN',115),
  ('SGN','KUL',120),('KUL','SGN',120),('SGN','ICN',330),('ICN','SGN',325),
  ('HAN','ICN',285),('ICN','HAN',285),('HAN','NRT',310),('NRT','HAN',340),
  ('SGN','NRT',350),('NRT','SGN',370),('SGN','TPE',210),('TPE','SGN',210),
  ('SGN','HKG',170),('HKG','SGN',170),('SGN','DXB',435),('DXB','SGN',435),
  ('SGN','DOH',445),('DOH','SGN',445)
)
INSERT INTO public.routes(origin_airport_id,destination_airport_id,code,default_duration_minutes,is_active)
SELECT o.id,d.id,r.origin_code||'-'||r.destination_code,r.duration_minutes,TRUE
FROM route_seed r JOIN public.airports o ON o.code=r.origin_code
JOIN public.airports d ON d.code=r.destination_code
ON CONFLICT(origin_airport_id,destination_airport_id) DO UPDATE SET
  default_duration_minutes=EXCLUDED.default_duration_minutes,is_active=TRUE,updated_at=NOW();

-- The complete catalogue exists only inside this single INSERT statement.
WITH schedule_catalog(
  airline_code,aircraft_code,flight_number,origin_code,destination_code,
  departure_local_time,duration_minutes,days_of_week,base_price
) AS(VALUES
  -- Hanoi <-> Ho Chi Minh City
  ('VNA','SEED26-VN-A321','VN201','HAN','SGN','06:00',130,'{1,2,3,4,5,6,7}',1250000),
  ('VNA','SEED26-VN-A321','VN219','HAN','SGN','14:00',130,'{1,2,3,4,5,6,7}',1350000),
  ('VNA','SEED26-VN-A321','VN220','SGN','HAN','07:00',130,'{1,2,3,4,5,6,7}',1290000),
  ('VNA','SEED26-VN-A321','VN236','SGN','HAN','16:00',130,'{1,2,3,4,5,6,7}',1390000),
  ('VJC','SEED26-VJ-A321','VJ121','SGN','HAN','05:30',130,'{1,2,3,4,5,6,7}',790000),
  ('VJC','SEED26-VJ-A321','VJ128','HAN','SGN','18:10',130,'{1,2,3,4,5,6,7}',850000),
  ('BAV','SEED26-QH-A320','QH203','HAN','SGN','09:00',130,'{1,2,3,4,5,6,7}',990000),
  ('BAV','SEED26-QH-A320','QH204','SGN','HAN','11:45',130,'{1,2,3,4,5,6,7}',990000),
  -- Da Nang network
  ('VNA','SEED26-VN-A321','VN105','SGN','DAD','07:30',85,'{1,2,3,4,5,6,7}',820000),
  ('VNA','SEED26-VN-A321','VN106','DAD','SGN','10:00',85,'{1,2,3,4,5,6,7}',820000),
  ('VJC','SEED26-VJ-A321','VJ625','SGN','DAD','12:00',85,'{1,2,3,4,5,6,7}',560000),
  ('VJC','SEED26-VJ-A321','VJ626','DAD','SGN','15:00',85,'{1,2,3,4,5,6,7}',590000),
  ('VNA','SEED26-VN-A321','VN171','HAN','DAD','08:20',80,'{1,2,3,4,5,6,7}',790000),
  ('VNA','SEED26-VN-A321','VN172','DAD','HAN','10:30',80,'{1,2,3,4,5,6,7}',790000),
  ('BAV','SEED26-QH-A320','QH101','HAN','DAD','13:20',80,'{1,2,3,4,5,6,7}',650000),
  ('BAV','SEED26-QH-A320','QH102','DAD','HAN','15:30',80,'{1,2,3,4,5,6,7}',650000),
  -- Islands and leisure destinations
  ('VJC','SEED26-VJ-A321','VJ331','SGN','PQC','06:20',65,'{1,2,3,4,5,6,7}',620000),
  ('VJC','SEED26-VJ-A321','VJ332','PQC','SGN','08:25',65,'{1,2,3,4,5,6,7}',620000),
  ('BAV','SEED26-QH-A320','QH152','SGN','PQC','13:10',65,'{1,2,3,4,5,6,7}',760000),
  ('BAV','SEED26-QH-A320','QH153','PQC','SGN','15:15',65,'{1,2,3,4,5,6,7}',760000),
  ('VNA','SEED26-VN-A321','VN1231','HAN','PQC','09:10',130,'{1,2,3,4,5,6,7}',1290000),
  ('VNA','SEED26-VN-A321','VN1232','PQC','HAN','12:20',130,'{1,2,3,4,5,6,7}',1290000),
  ('VKE','SEED26-VU-A321','VU451','SGN','CXR','07:15',60,'{1,2,3,4,5,6,7}',590000),
  ('VKE','SEED26-VU-A321','VU452','CXR','SGN','09:10',60,'{1,2,3,4,5,6,7}',590000),
  ('PIC','SEED26-BL-A320','BL601','SGN','DLI','08:00',55,'{1,2,3,4,5,6,7}',650000),
  ('PIC','SEED26-BL-A320','BL602','DLI','SGN','10:00',55,'{1,2,3,4,5,6,7}',650000),
  ('VNA','SEED26-VN-A321','VN1541','HAN','HUI','07:20',75,'{1,2,3,4,5,6,7}',780000),
  ('VNA','SEED26-VN-A321','VN1542','HUI','HAN','09:30',75,'{1,2,3,4,5,6,7}',780000),
  ('PIC','SEED26-BL-A320','BL1265','SGN','VCA','06:40',45,'{1,2,3,4,5,6,7}',520000),
  ('PIC','SEED26-BL-A320','BL1266','VCA','SGN','08:20',45,'{1,2,3,4,5,6,7}',520000),
  ('VFC','SEED26-0V-ATR72','0V8051','SGN','VCS','08:10',55,'{1,2,3,4,5,6,7}',1350000),
  ('VFC','SEED26-0V-ATR72','0V8052','VCS','SGN','10:20',55,'{1,2,3,4,5,6,7}',1350000),
  ('VJC','SEED26-VJ-A321','VJ701','HAN','CXR','07:40',115,'{1,2,3,4,5,6,7}',980000),
  ('VJC','SEED26-VJ-A321','VJ702','CXR','HAN','10:45',115,'{1,2,3,4,5,6,7}',980000),
  ('VNA','SEED26-VN-A321','VN1601','HAN','VII','12:30',55,'{1,2,3,4,5,6,7}',590000),
  ('VNA','SEED26-VN-A321','VN1602','VII','HAN','14:25',55,'{1,2,3,4,5,6,7}',590000),
  ('VJC','SEED26-VJ-A321','VJ355','SGN','BMV','09:20',60,'{1,2,3,4,5,6,7}',570000),
  ('VJC','SEED26-VJ-A321','VJ356','BMV','SGN','11:20',60,'{1,2,3,4,5,6,7}',570000),
  ('BAV','SEED26-QH-A320','QH1101','HAN','UIH','10:25',95,'{1,2,3,4,5,6,7}',850000),
  ('BAV','SEED26-QH-A320','QH1102','UIH','HAN','13:00',95,'{1,2,3,4,5,6,7}',850000),
  -- Southeast Asia
  ('VNA','SEED26-VN-B789','VN651','SGN','SIN','09:00',125,'{1,3,5,7}',3100000),
  ('SIA','SEED26-SQ-B78X','SQ178','SIN','SGN','09:50',125,'{2,4,6}',3600000),
  ('VNA','SEED26-VN-B789','VN661','HAN','SIN','10:20',195,'{1,4,6}',3900000),
  ('SIA','SEED26-SQ-B78X','SQ192','SIN','HAN','13:05',195,'{2,5,7}',4300000),
  ('VJC','SEED26-VJ-A321','VJ801','SGN','BKK','09:40',95,'{1,2,3,4,5,6,7}',2100000),
  ('THA','SEED26-TG-A359','TG550','BKK','SGN','07:35',95,'{1,2,3,4,5,6,7}',2900000),
  ('VNA','SEED26-VN-B789','VN611','HAN','BKK','08:50',115,'{1,3,5,7}',2800000),
  ('THA','SEED26-TG-A359','TG560','BKK','HAN','13:20',115,'{2,4,6}',3100000),
  ('AXM','SEED26-AK-A320','AK521','SGN','KUL','08:35',120,'{1,2,3,4,5,6,7}',1900000),
  ('AXM','SEED26-AK-A320','AK520','KUL','SGN','06:55',120,'{1,2,3,4,5,6,7}',1900000),
  -- Northeast Asia
  ('VNA','SEED26-VN-B789','VN408','SGN','ICN','23:45',330,'{1,3,5,7}',7400000),
  ('KAL','SEED26-KE-B789','KE469','ICN','SGN','09:05',325,'{2,4,6}',7800000),
  ('VNA','SEED26-VN-B789','VN414','HAN','ICN','10:15',285,'{2,4,6}',7200000),
  ('KAL','SEED26-KE-B789','KE441','ICN','HAN','08:10',285,'{1,3,5,7}',7600000),
  ('VNA','SEED26-VN-B789','VN310','HAN','NRT','00:25',310,'{1,3,5}',11200000),
  ('JAL','SEED26-JL-B788','JL751','NRT','HAN','18:00',340,'{2,4,6}',11500000),
  ('VNA','SEED26-VN-B789','VN300','SGN','NRT','00:10',350,'{2,4,6}',10900000),
  ('JAL','SEED26-JL-B788','JL750','NRT','SGN','17:35',370,'{1,3,5}',11900000),
  ('CAL','SEED26-CI-A321','CI782','SGN','TPE','10:50',210,'{1,2,3,4,5,6,7}',5100000),
  ('CAL','SEED26-CI-A321','CI783','TPE','SGN','14:20',210,'{1,2,3,4,5,6,7}',5300000),
  ('VNA','SEED26-VN-B789','VN655','SGN','HKG','11:15',170,'{1,3,5,7}',4500000),
  ('CPA','SEED26-CX-A333','CX799','HKG','SGN','16:45',170,'{2,4,6}',4700000),
  -- Middle East
  ('UAE','SEED26-EK-B77W','EK393','SGN','DXB','23:55',435,'{1,3,5}',14200000),
  ('UAE','SEED26-EK-B77W','EK392','DXB','SGN','09:35',435,'{2,4,6}',14500000),
  ('QTR','SEED26-QR-B788','QR971','SGN','DOH','19:40',445,'{2,4,6}',13600000),
  ('QTR','SEED26-QR-B788','QR970','DOH','SGN','02:00',445,'{1,3,5}',13800000)
)
INSERT INTO public.flight_schedules(
  route_id,airline_id,aircraft_id,flight_number,departure_local_time,arrival_day_offset,
  duration_minutes,days_of_week,start_date,end_date,base_price,seat_template,is_active
)
SELECT r.id,a.id,ac.id,s.flight_number,s.departure_local_time::TIME,
  CASE WHEN EXTRACT(EPOCH FROM s.departure_local_time::TIME)/60+s.duration_minutes>=1440 THEN 1 ELSE 0 END,
  s.duration_minutes,s.days_of_week::SMALLINT[],DATE '2026-08-05',DATE '2026-09-05',s.base_price,'[]'::JSONB,TRUE
FROM schedule_catalog s
JOIN public.airports o ON o.code=s.origin_code
JOIN public.airports d ON d.code=s.destination_code
JOIN public.routes r ON r.origin_airport_id=o.id AND r.destination_airport_id=d.id
JOIN public.airlines a ON a.code=s.airline_code
JOIN public.aircrafts ac ON ac.code=s.aircraft_code AND ac.airline_id=a.id
ON CONFLICT(flight_number,route_id,departure_local_time,start_date) DO UPDATE SET
  airline_id=EXCLUDED.airline_id,aircraft_id=EXCLUDED.aircraft_id,duration_minutes=EXCLUDED.duration_minutes,
  days_of_week=EXCLUDED.days_of_week,end_date=EXCLUDED.end_date,base_price=EXCLUDED.base_price,
  is_active=TRUE,updated_at=NOW();

-- The core migration already provides economy/business fares; add a global
-- first-class fare so every generated cabin can be booked from the UI.
INSERT INTO public.fare_classes(
  airline_id,route_id,code,name,cabin_class,price_multiplier,change_allowed,change_fee,
  refundable,cancellation_fee,checked_baggage_kg,cabin_baggage_kg,priority_boarding,is_active
)
SELECT NULL,NULL,'FIRST-FLEX','First Flex','first',1.000,TRUE,0,TRUE,0,40,15,TRUE,TRUE
WHERE NOT EXISTS(
  SELECT 1 FROM public.fare_classes
  WHERE airline_id IS NULL AND route_id IS NULL AND code='FIRST-FLEX'
);

-- Exact dated flight instances. A small deterministic percentage is delayed
-- or cancelled so status pages/admin filters have realistic data.
WITH instances AS(
  SELECT fs.*,r.origin_airport_id,r.destination_airport_id,o.timezone AS origin_timezone,
    service_date,
    (service_date+fs.departure_local_time) AT TIME ZONE o.timezone AS departure_at,
    MOD(ABS(hashtext(fs.flight_number||service_date::TEXT)::BIGINT),50) AS status_roll
  FROM public.flight_schedules fs
  JOIN public.routes r ON r.id=fs.route_id
  JOIN public.airports o ON o.id=r.origin_airport_id
  JOIN public.aircrafts ac ON ac.id=fs.aircraft_id AND ac.code LIKE 'SEED26-%'
  CROSS JOIN LATERAL generate_series(DATE '2026-08-05',DATE '2026-09-05',INTERVAL '1 day') AS days(service_timestamp)
  CROSS JOIN LATERAL (SELECT service_timestamp::DATE AS service_date) dates
  WHERE fs.start_date=DATE '2026-08-05' AND fs.end_date=DATE '2026-09-05'
    AND EXTRACT(ISODOW FROM service_date)::SMALLINT=ANY(fs.days_of_week)
)
INSERT INTO public.flights(
  airline_id,aircraft_id,origin_airport_id,destination_airport_id,route_id,schedule_id,
  flight_number,departure_time,arrival_time,scheduled_departure_time,scheduled_arrival_time,
  base_price,available_seats,status,gate,terminal,delay_reason
)
SELECT airline_id,aircraft_id,origin_airport_id,destination_airport_id,route_id,id,
  flight_number,departure_at,departure_at+make_interval(mins=>duration_minutes),
  departure_at,departure_at+make_interval(mins=>duration_minutes),base_price,0,
  CASE WHEN status_roll=0 THEN 'cancelled' WHEN status_roll BETWEEN 1 AND 3 THEN 'delayed' ELSE 'scheduled' END,
  'G'||LPAD((1+MOD(ABS(hashtext(flight_number)::BIGINT),24))::TEXT,2,'0'),
  CASE WHEN origin_airport_id IN(SELECT id FROM public.airports WHERE code IN('SGN','HAN')) THEN 'T1' ELSE 'MAIN' END,
  CASE WHEN status_roll BETWEEN 1 AND 3 THEN 'Operational delay (seed data)' ELSE NULL END
FROM instances
ON CONFLICT(schedule_id,scheduled_departure_time) WHERE schedule_id IS NOT NULL DO NOTHING;

-- Seat maps. Cap each demo flight at 72 seat rows to keep this large seed
-- practical in hosted SQL editors while retaining first/business/economy cabins.
WITH target_flights AS(
  SELECT f.id,f.base_price,LEAST(ac.total_seats,72) AS seat_count
  FROM public.flights f
  JOIN public.aircrafts ac ON ac.id=f.aircraft_id
  JOIN public.flight_schedules fs ON fs.id=f.schedule_id
  WHERE fs.start_date=DATE '2026-08-05' AND fs.end_date=DATE '2026-09-05'
    AND ac.code LIKE 'SEED26-%'
)
INSERT INTO public.seats(flight_id,seat_number,seat_class,status,price)
SELECT f.id,CEIL(n/6.0)::INTEGER::TEXT||CHR(65+((n-1)%6)),
  CASE WHEN n<=6 AND f.seat_count>=60 THEN 'first' WHEN n<=18 THEN 'business' ELSE 'economy' END,
  'available',ROUND(f.base_price*CASE WHEN n<=6 AND f.seat_count>=60 THEN 3.8 WHEN n<=18 THEN 2.1 ELSE 1 END,0)
FROM target_flights f CROSS JOIN LATERAL generate_series(1,f.seat_count) n
ON CONFLICT(flight_id,seat_number) DO NOTHING;

-- Recalculate inventory from the source-of-truth seat rows.
UPDATE public.flights f SET available_seats=inventory.available_count,updated_at=NOW()
FROM(
  SELECT s.flight_id,COUNT(*) FILTER(WHERE s.status='available')::INTEGER AS available_count
  FROM public.seats s GROUP BY s.flight_id
) inventory
WHERE f.id=inventory.flight_id AND f.schedule_id IN(
  SELECT fs.id FROM public.flight_schedules fs JOIN public.aircrafts ac ON ac.id=fs.aircraft_id
  WHERE fs.start_date=DATE '2026-08-05' AND fs.end_date=DATE '2026-09-05'
    AND ac.code LIKE 'SEED26-%'
);

-- Baggage options for every seeded flight. -----------------------------------
WITH target_flights AS(
  SELECT f.id FROM public.flights f JOIN public.flight_schedules fs ON fs.id=f.schedule_id
  JOIN public.aircrafts ac ON ac.id=fs.aircraft_id
  WHERE fs.start_date=DATE '2026-08-05' AND fs.end_date=DATE '2026-09-05'
    AND ac.code LIKE 'SEED26-%'
), options(weight_kg,price,description) AS(VALUES
  (15,150000::NUMERIC,'Checked baggage 15kg'),
  (20,210000::NUMERIC,'Checked baggage 20kg'),
  (30,330000::NUMERIC,'Checked baggage 30kg')
)
INSERT INTO public.baggage_options(flight_id,weight_kg,price,description,is_available)
SELECT f.id,o.weight_kg,o.price,o.description,TRUE FROM target_flights f CROSS JOIN options o
ON CONFLICT(flight_id,weight_kg) DO UPDATE SET price=EXCLUDED.price,
  description=EXCLUDED.description,is_available=TRUE,updated_at=NOW();

-- Meal options use deterministic UUIDs, making reruns idempotent. -------------
WITH target_flights AS(
  SELECT f.id FROM public.flights f JOIN public.flight_schedules fs ON fs.id=f.schedule_id
  JOIN public.aircrafts ac ON ac.id=fs.aircraft_id
  WHERE fs.start_date=DATE '2026-08-05' AND fs.end_date=DATE '2026-09-05'
    AND ac.code LIKE 'SEED26-%'
), meals(code,name,description,price,meal_type) AS(VALUES
  ('STANDARD','Vietnamese chicken rice','Rice, grilled chicken and seasonal vegetables',95000::NUMERIC,'standard'),
  ('VEGETARIAN','Vegetarian meal','Rice, tofu and mixed vegetables',85000::NUMERIC,'vegetarian'),
  ('HALAL','Halal chicken meal','Certified halal chicken with rice',110000::NUMERIC,'halal'),
  ('CHILD','Child meal','Pasta, fruit and juice',75000::NUMERIC,'child')
)
INSERT INTO public.meal_options(id,flight_id,name,description,price,meal_type,is_available)
SELECT md5(f.id::TEXT||':'||m.code)::UUID,f.id,m.name,m.description,m.price,m.meal_type,TRUE
FROM target_flights f CROSS JOIN meals m
ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,
  price=EXCLUDED.price,meal_type=EXCLUDED.meal_type,is_available=TRUE,updated_at=NOW();

-- Promotions valid for the same sales/travel period. -------------------------
INSERT INTO public.discounts(
  code,description,discount_type,discount_value,min_order_value,max_discount,max_uses,
  used_count,start_date,end_date,is_active,applicable_to
) VALUES
  ('AUG2026','August 2026 flight promotion','percentage',10,700000,300000,5000,0,
   '2026-08-01 00:00:00+07','2026-09-05 23:59:59+07',TRUE,'flight'),
  ('DOMESTIC80K','Domestic booking discount','fixed',80000,500000,NULL,5000,0,
   '2026-08-01 00:00:00+07','2026-09-05 23:59:59+07',TRUE,'flight'),
  ('BAG20AUG','August baggage discount','percentage',20,0,100000,3000,0,
   '2026-08-01 00:00:00+07','2026-09-05 23:59:59+07',TRUE,'baggage')
ON CONFLICT(code) DO UPDATE SET description=EXCLUDED.description,discount_type=EXCLUDED.discount_type,
  discount_value=EXCLUDED.discount_value,min_order_value=EXCLUDED.min_order_value,
  max_discount=EXCLUDED.max_discount,max_uses=EXCLUDED.max_uses,start_date=EXCLUDED.start_date,
  end_date=EXCLUDED.end_date,is_active=TRUE,applicable_to=EXCLUDED.applicable_to,updated_at=NOW();

COMMIT;

-- Result summary --------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM public.airlines WHERE code IN('VNA','VJC','BAV','VKE','PIC','VFC','SIA','THA','AXM','KAL','JAL','CAL','UAE','QTR','CPA')) AS airlines,
  (SELECT COUNT(*) FROM public.flight_schedules fs JOIN public.aircrafts ac ON ac.id=fs.aircraft_id
    WHERE fs.start_date=DATE '2026-08-05' AND fs.end_date=DATE '2026-09-05' AND ac.code LIKE 'SEED26-%') AS schedules,
  (SELECT COUNT(*) FROM public.flights f JOIN public.flight_schedules fs ON fs.id=f.schedule_id
    JOIN public.aircrafts ac ON ac.id=fs.aircraft_id
    WHERE fs.start_date=DATE '2026-08-05' AND fs.end_date=DATE '2026-09-05' AND ac.code LIKE 'SEED26-%') AS flights_in_range,
  (SELECT COUNT(*) FROM public.seats s JOIN public.flights f ON f.id=s.flight_id
    JOIN public.flight_schedules fs ON fs.id=f.schedule_id JOIN public.aircrafts ac ON ac.id=fs.aircraft_id
    WHERE fs.start_date=DATE '2026-08-05' AND fs.end_date=DATE '2026-09-05' AND ac.code LIKE 'SEED26-%') AS seats_in_range;
