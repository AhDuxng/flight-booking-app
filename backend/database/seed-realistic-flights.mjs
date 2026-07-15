import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const existingAirlines = {
  VNA: 'a1000000-0000-0000-0000-000000000001',
  VJC: 'a1000000-0000-0000-0000-000000000002',
  BAV: 'a1000000-0000-0000-0000-000000000003',
  VKE: 'a1000000-0000-0000-0000-000000000004',
  PIC: 'a1000000-0000-0000-0000-000000000005',
};

const existingAirports = {
  SGN: 'b1000000-0000-0000-0000-000000000001',
  HAN: 'b1000000-0000-0000-0000-000000000002',
  DAD: 'b1000000-0000-0000-0000-000000000003',
  PQC: 'b1000000-0000-0000-0000-000000000004',
  HUI: 'b1000000-0000-0000-0000-000000000005',
  CXR: 'b1000000-0000-0000-0000-000000000006',
  VCS: 'b1000000-0000-0000-0000-000000000007',
  SIN: 'b2000000-0000-0000-0000-000000000001',
  BKK: 'b2000000-0000-0000-0000-000000000002',
  ICN: 'b2000000-0000-0000-0000-000000000003',
  NRT: 'b2000000-0000-0000-0000-000000000004',
  TPE: 'b2000000-0000-0000-0000-000000000005',
  KUL: 'b2000000-0000-0000-0000-000000000006',
  CDG: 'b2000000-0000-0000-0000-000000000007',
  LHR: 'b2000000-0000-0000-0000-000000000008',
  SYD: 'b2000000-0000-0000-0000-000000000009',
  LAX: 'b2000000-0000-0000-0000-000000000010',
};

const airlines = [
  { id: existingAirlines.VNA, code: 'VNA', name: 'Vietnam Airlines', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Vietnam_Airlines_logo.svg/200px-Vietnam_Airlines_logo.svg.png', country: 'Vietnam' },
  { id: existingAirlines.VJC, code: 'VJC', name: 'Vietjet Air', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/VietJet_Air_logo.svg/200px-VietJet_Air_logo.svg.png', country: 'Vietnam' },
  { id: existingAirlines.BAV, code: 'BAV', name: 'Bamboo Airways', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Bamboo_Airways_Logo.svg/200px-Bamboo_Airways_Logo.svg.png', country: 'Vietnam' },
  { id: existingAirlines.VKE, code: 'VKE', name: 'Vietravel Airlines', logo_url: null, country: 'Vietnam' },
  { id: existingAirlines.PIC, code: 'PIC', name: 'Pacific Airlines', logo_url: null, country: 'Vietnam' },
  { id: 'a3000000-0000-0000-0000-000000000001', code: 'VFC', name: 'VASCO', logo_url: null, country: 'Vietnam' },
  { id: 'a3000000-0000-0000-0000-000000000002', code: 'SIA', name: 'Singapore Airlines', logo_url: null, country: 'Singapore' },
  { id: 'a3000000-0000-0000-0000-000000000003', code: 'THA', name: 'Thai Airways', logo_url: null, country: 'Thailand' },
  { id: 'a3000000-0000-0000-0000-000000000004', code: 'AXM', name: 'AirAsia', logo_url: null, country: 'Malaysia' },
  { id: 'a3000000-0000-0000-0000-000000000005', code: 'MAS', name: 'Malaysia Airlines', logo_url: null, country: 'Malaysia' },
  { id: 'a3000000-0000-0000-0000-000000000006', code: 'KAL', name: 'Korean Air', logo_url: null, country: 'South Korea' },
  { id: 'a3000000-0000-0000-0000-000000000007', code: 'AAR', name: 'Asiana Airlines', logo_url: null, country: 'South Korea' },
  { id: 'a3000000-0000-0000-0000-000000000008', code: 'JAL', name: 'Japan Airlines', logo_url: null, country: 'Japan' },
  { id: 'a3000000-0000-0000-0000-000000000009', code: 'ANA', name: 'All Nippon Airways', logo_url: null, country: 'Japan' },
  { id: 'a3000000-0000-0000-0000-000000000010', code: 'CAL', name: 'China Airlines', logo_url: null, country: 'Taiwan' },
  { id: 'a3000000-0000-0000-0000-000000000011', code: 'EVA', name: 'EVA Air', logo_url: null, country: 'Taiwan' },
  { id: 'a3000000-0000-0000-0000-000000000012', code: 'CPA', name: 'Cathay Pacific', logo_url: null, country: 'Hong Kong' },
  { id: 'a3000000-0000-0000-0000-000000000013', code: 'UAE', name: 'Emirates', logo_url: null, country: 'United Arab Emirates' },
  { id: 'a3000000-0000-0000-0000-000000000014', code: 'QTR', name: 'Qatar Airways', logo_url: null, country: 'Qatar' },
  { id: 'a3000000-0000-0000-0000-000000000015', code: 'THY', name: 'Turkish Airlines', logo_url: null, country: 'Turkey' },
  { id: 'a3000000-0000-0000-0000-000000000016', code: 'AFR', name: 'Air France', logo_url: null, country: 'France' },
  { id: 'a3000000-0000-0000-0000-000000000017', code: 'DLH', name: 'Lufthansa', logo_url: null, country: 'Germany' },
  { id: 'a3000000-0000-0000-0000-000000000018', code: 'QFA', name: 'Qantas', logo_url: null, country: 'Australia' },
];

const airportNames = {
  SGN: { name: 'Tan Son Nhat International Airport', city: 'Ho Chi Minh City', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  HAN: { name: 'Noi Bai International Airport', city: 'Hanoi', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  DAD: { name: 'Da Nang International Airport', city: 'Da Nang', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  PQC: { name: 'Phu Quoc International Airport', city: 'Phu Quoc', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  HUI: { name: 'Phu Bai International Airport', city: 'Hue', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  CXR: { name: 'Cam Ranh International Airport', city: 'Nha Trang', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  VCS: { name: 'Con Dao Airport', city: 'Con Dao', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  SIN: { name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore' },
  BKK: { name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', timezone: 'Asia/Bangkok' },
  ICN: { name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', timezone: 'Asia/Seoul' },
  NRT: { name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
  TPE: { name: 'Taiwan Taoyuan International Airport', city: 'Taipei', country: 'Taiwan', timezone: 'Asia/Taipei' },
  KUL: { name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
  CDG: { name: 'Paris Charles de Gaulle Airport', city: 'Paris', country: 'France', timezone: 'Europe/Paris' },
  LHR: { name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
  SYD: { name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney' },
  LAX: { name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', timezone: 'America/Los_Angeles' },
};

const airports = [
  ...Object.entries(existingAirports).map(([code, id]) => ({ id, code })),
  { id: 'b3000000-0000-0000-0000-000000000001', code: 'BMV', name: 'Buon Ma Thuot Airport', city: 'Buon Ma Thuot', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'b3000000-0000-0000-0000-000000000002', code: 'DLI', name: 'Lien Khuong Airport', city: 'Da Lat', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'b3000000-0000-0000-0000-000000000003', code: 'UIH', name: 'Phu Cat Airport', city: 'Quy Nhon', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'b3000000-0000-0000-0000-000000000004', code: 'VCA', name: 'Can Tho International Airport', city: 'Can Tho', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'b3000000-0000-0000-0000-000000000005', code: 'VDH', name: 'Dong Hoi Airport', city: 'Dong Hoi', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'b3000000-0000-0000-0000-000000000006', code: 'HPH', name: 'Cat Bi International Airport', city: 'Hai Phong', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'b3000000-0000-0000-0000-000000000007', code: 'VDO', name: 'Van Don International Airport', city: 'Ha Long', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'b3000000-0000-0000-0000-000000000008', code: 'THD', name: 'Tho Xuan Airport', city: 'Thanh Hoa', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'b3000000-0000-0000-0000-000000000009', code: 'VII', name: 'Vinh International Airport', city: 'Vinh', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'b3000000-0000-0000-0000-000000000010', code: 'DIN', name: 'Dien Bien Airport', city: 'Dien Bien Phu', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'b3000000-0000-0000-0000-000000000011', code: 'CAH', name: 'Ca Mau Airport', city: 'Ca Mau', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'b3000000-0000-0000-0000-000000000012', code: 'PXU', name: 'Pleiku Airport', city: 'Pleiku', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'b4000000-0000-0000-0000-000000000001', code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
  { id: 'b4000000-0000-0000-0000-000000000002', code: 'PVG', name: 'Shanghai Pudong International Airport', city: 'Shanghai', country: 'China', timezone: 'Asia/Shanghai' },
  { id: 'b4000000-0000-0000-0000-000000000003', code: 'PEK', name: 'Beijing Capital International Airport', city: 'Beijing', country: 'China', timezone: 'Asia/Shanghai' },
  { id: 'b4000000-0000-0000-0000-000000000004', code: 'CAN', name: 'Guangzhou Baiyun International Airport', city: 'Guangzhou', country: 'China', timezone: 'Asia/Shanghai' },
  { id: 'b4000000-0000-0000-0000-000000000005', code: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
  { id: 'b4000000-0000-0000-0000-000000000006', code: 'KIX', name: 'Kansai International Airport', city: 'Osaka', country: 'Japan', timezone: 'Asia/Tokyo' },
  { id: 'b4000000-0000-0000-0000-000000000007', code: 'FUK', name: 'Fukuoka Airport', city: 'Fukuoka', country: 'Japan', timezone: 'Asia/Tokyo' },
  { id: 'b4000000-0000-0000-0000-000000000008', code: 'PUS', name: 'Gimhae International Airport', city: 'Busan', country: 'South Korea', timezone: 'Asia/Seoul' },
  { id: 'b4000000-0000-0000-0000-000000000009', code: 'DPS', name: 'Ngurah Rai International Airport', city: 'Bali', country: 'Indonesia', timezone: 'Asia/Makassar' },
  { id: 'b4000000-0000-0000-0000-000000000010', code: 'CGK', name: 'Soekarno-Hatta International Airport', city: 'Jakarta', country: 'Indonesia', timezone: 'Asia/Jakarta' },
  { id: 'b4000000-0000-0000-0000-000000000011', code: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', country: 'India', timezone: 'Asia/Kolkata' },
  { id: 'b4000000-0000-0000-0000-000000000012', code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata' },
  { id: 'b4000000-0000-0000-0000-000000000013', code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', timezone: 'Australia/Melbourne' },
  { id: 'b4000000-0000-0000-0000-000000000014', code: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia', timezone: 'Australia/Perth' },
  { id: 'b4000000-0000-0000-0000-000000000015', code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States', timezone: 'America/Los_Angeles' },
  { id: 'b4000000-0000-0000-0000-000000000016', code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', timezone: 'Europe/Berlin' },
  { id: 'b4000000-0000-0000-0000-000000000017', code: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', timezone: 'Europe/Berlin' },
  { id: 'b4000000-0000-0000-0000-000000000018', code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', timezone: 'Europe/Istanbul' },
  { id: 'b4000000-0000-0000-0000-000000000019', code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', timezone: 'Asia/Qatar' },
  { id: 'b4000000-0000-0000-0000-000000000020', code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', timezone: 'Asia/Dubai' },
  { id: 'b4000000-0000-0000-0000-000000000021', code: 'PNH', name: 'Phnom Penh International Airport', city: 'Phnom Penh', country: 'Cambodia', timezone: 'Asia/Phnom_Penh' },
  { id: 'b4000000-0000-0000-0000-000000000022', code: 'SAI', name: 'Siem Reap-Angkor International Airport', city: 'Siem Reap', country: 'Cambodia', timezone: 'Asia/Phnom_Penh' },
  { id: 'b4000000-0000-0000-0000-000000000023', code: 'VTE', name: 'Wattay International Airport', city: 'Vientiane', country: 'Laos', timezone: 'Asia/Vientiane' },
  { id: 'b4000000-0000-0000-0000-000000000024', code: 'MFM', name: 'Macau International Airport', city: 'Macau', country: 'Macau', timezone: 'Asia/Macau' },
  { id: 'b4000000-0000-0000-0000-000000000025', code: 'KHH', name: 'Kaohsiung International Airport', city: 'Kaohsiung', country: 'Taiwan', timezone: 'Asia/Taipei' },
  { id: 'b4000000-0000-0000-0000-000000000026', code: 'HKT', name: 'Phuket International Airport', city: 'Phuket', country: 'Thailand', timezone: 'Asia/Bangkok' },
].map((airport) => ({
  ...airport,
  name: airport.name ?? airportNames[airport.code].name,
  city: airport.city ?? airportNames[airport.code].city,
  country: airport.country ?? airportNames[airport.code].country,
  timezone: airport.timezone ?? airportNames[airport.code].timezone,
}));

const aircrafts = [
  ['c1000000-0000-0000-0000-000000000001', 'VNA', 'VN-A321-01', 'Airbus A321', 180],
  ['c1000000-0000-0000-0000-000000000002', 'VNA', 'VN-B787-01', 'Boeing 787-9', 247],
  ['c1000000-0000-0000-0000-000000000003', 'VJC', 'VJ-A320-01', 'Airbus A320', 180],
  ['c1000000-0000-0000-0000-000000000004', 'VJC', 'VJ-A321-01', 'Airbus A321', 230],
  ['c1000000-0000-0000-0000-000000000005', 'BAV', 'QH-A320-01', 'Airbus A320', 180],
  ['c1000000-0000-0000-0000-000000000006', 'VKE', 'VU-A321-01', 'Airbus A321', 220],
  ['c3000000-0000-0000-0000-000000000001', 'VFC', '0V-ATR72-01', 'ATR 72-500', 68],
  ['c3000000-0000-0000-0000-000000000002', 'PIC', 'BL-A320-01', 'Airbus A320', 180],
  ['c3000000-0000-0000-0000-000000000003', 'SIA', 'SQ-B787-01', 'Boeing 787-10', 337],
  ['c3000000-0000-0000-0000-000000000004', 'THA', 'TG-A359-01', 'Airbus A350-900', 321],
  ['c3000000-0000-0000-0000-000000000005', 'AXM', 'AK-A320-01', 'Airbus A320', 180],
  ['c3000000-0000-0000-0000-000000000006', 'MAS', 'MH-B738-01', 'Boeing 737-800', 160],
  ['c3000000-0000-0000-0000-000000000007', 'KAL', 'KE-B787-01', 'Boeing 787-9', 269],
  ['c3000000-0000-0000-0000-000000000008', 'AAR', 'OZ-A321-01', 'Airbus A321', 188],
  ['c3000000-0000-0000-0000-000000000009', 'JAL', 'JL-B788-01', 'Boeing 787-8', 206],
  ['c3000000-0000-0000-0000-000000000010', 'ANA', 'NH-B789-01', 'Boeing 787-9', 246],
  ['c3000000-0000-0000-0000-000000000011', 'CAL', 'CI-A321-01', 'Airbus A321neo', 180],
  ['c3000000-0000-0000-0000-000000000012', 'EVA', 'BR-B789-01', 'Boeing 787-9', 304],
  ['c3000000-0000-0000-0000-000000000013', 'CPA', 'CX-A333-01', 'Airbus A330-300', 293],
  ['c3000000-0000-0000-0000-000000000014', 'UAE', 'EK-B77W-01', 'Boeing 777-300ER', 354],
  ['c3000000-0000-0000-0000-000000000015', 'QTR', 'QR-B788-01', 'Boeing 787-8', 254],
  ['c3000000-0000-0000-0000-000000000016', 'THY', 'TK-B789-01', 'Boeing 787-9', 300],
  ['c3000000-0000-0000-0000-000000000017', 'AFR', 'AF-A359-01', 'Airbus A350-900', 324],
  ['c3000000-0000-0000-0000-000000000018', 'DLH', 'LH-A359-01', 'Airbus A350-900', 293],
  ['c3000000-0000-0000-0000-000000000019', 'QFA', 'QF-A333-01', 'Airbus A330-300', 297],
].map(([id, airlineCode, code, model, totalSeats]) => ({
  id,
  airline_id: airlineId(airlineCode),
  code,
  model,
  total_seats: totalSeats,
}));

const routeRows = [
  ['VNA', 'VN215', 'HAN', 'SGN', 2, '08:00', 130, 1250000, 'c1000000-0000-0000-0000-000000000001'],
  ['VNA', 'VN117', 'DAD', 'SGN', 2, '10:15', 85, 890000, 'c1000000-0000-0000-0000-000000000001'],
  ['VNA', 'VN1541', 'HAN', 'HUI', 3, '07:20', 75, 790000, 'c1000000-0000-0000-0000-000000000001'],
  ['VNA', 'VN1805', 'SGN', 'PQC', 3, '13:10', 65, 980000, 'c1000000-0000-0000-0000-000000000001'],
  ['VNA', 'VN1559', 'HAN', 'CXR', 4, '09:35', 115, 1350000, 'c1000000-0000-0000-0000-000000000001'],
  ['VNA', 'VN1603', 'SGN', 'BMV', 4, '15:00', 55, 720000, 'c1000000-0000-0000-0000-000000000001'],
  ['VNA', 'VN1265', 'SGN', 'VCA', 5, '06:40', 45, 620000, 'c1000000-0000-0000-0000-000000000001'],
  ['VNA', 'VN651', 'SGN', 'SIN', 5, '09:00', 125, 3200000, 'c1000000-0000-0000-0000-000000000002'],
  ['VNA', 'VN611', 'HAN', 'BKK', 6, '08:50', 115, 2800000, 'c1000000-0000-0000-0000-000000000002'],
  ['VNA', 'VN408', 'SGN', 'ICN', 6, '23:45', 330, 7500000, 'c1000000-0000-0000-0000-000000000002'],
  ['VNA', 'VN310', 'HAN', 'NRT', 7, '00:25', 310, 11800000, 'c1000000-0000-0000-0000-000000000002'],
  ['VNA', 'VN570', 'SGN', 'TPE', 7, '16:30', 210, 5200000, 'c1000000-0000-0000-0000-000000000002'],
  ['VNA', 'VN98', 'SGN', 'SFO', 8, '20:45', 840, 18500000, 'c1000000-0000-0000-0000-000000000002'],
  ['VNA', 'VN11', 'HAN', 'CDG', 8, '23:30', 765, 17200000, 'c1000000-0000-0000-0000-000000000002'],
  ['VNA', 'VN781', 'SGN', 'MEL', 9, '21:05', 505, 14200000, 'c1000000-0000-0000-0000-000000000002'],
  ['VJC', 'VJ120', 'SGN', 'HAN', 2, '06:15', 130, 780000, 'c1000000-0000-0000-0000-000000000003'],
  ['VJC', 'VJ622', 'SGN', 'DAD', 3, '11:20', 85, 590000, 'c1000000-0000-0000-0000-000000000004'],
  ['VJC', 'VJ455', 'HAN', 'PQC', 4, '12:40', 130, 960000, 'c1000000-0000-0000-0000-000000000004'],
  ['VJC', 'VJ802', 'SGN', 'BKK', 5, '09:40', 95, 2100000, 'c1000000-0000-0000-0000-000000000004'],
  ['VJC', 'VJ862', 'SGN', 'ICN', 6, '02:35', 315, 6300000, 'c1000000-0000-0000-0000-000000000004'],
  ['VJC', 'VJ820', 'SGN', 'HND', 7, '17:20', 350, 9600000, 'c1000000-0000-0000-0000-000000000004'],
  ['VJC', 'VJ910', 'SGN', 'BOM', 8, '19:10', 320, 7200000, 'c1000000-0000-0000-0000-000000000004'],
  ['BAV', 'QH141', 'HAN', 'DLI', 3, '08:45', 115, 940000, 'c1000000-0000-0000-0000-000000000005'],
  ['BAV', 'QH1121', 'SGN', 'UIH', 4, '14:15', 75, 780000, 'c1000000-0000-0000-0000-000000000005'],
  ['BAV', 'QH1521', 'HAN', 'VCA', 5, '10:25', 125, 1250000, 'c1000000-0000-0000-0000-000000000005'],
  ['BAV', 'QH325', 'SGN', 'BKK', 6, '12:00', 100, 2200000, 'c1000000-0000-0000-0000-000000000005'],
  ['VKE', 'VU302', 'SGN', 'PQC', 2, '09:20', 65, 760000, 'c1000000-0000-0000-0000-000000000006'],
  ['VKE', 'VU132', 'HAN', 'CXR', 4, '07:55', 115, 1050000, 'c1000000-0000-0000-0000-000000000006'],
  ['VKE', 'VU1182', 'PQC', 'TPE', 6, '18:30', 210, 5100000, 'c1000000-0000-0000-0000-000000000006'],
  ['VKE', 'VU984', 'DAD', 'MFM', 7, '16:45', 105, 3900000, 'c1000000-0000-0000-0000-000000000006'],
  ['PIC', 'BL602', 'SGN', 'DLI', 3, '16:10', 55, 650000, 'c3000000-0000-0000-0000-000000000002'],
  ['VFC', '0V8051', 'SGN', 'VCS', 3, '08:10', 55, 1450000, 'c3000000-0000-0000-0000-000000000001'],
  ['VFC', '0V8075', 'SGN', 'CAH', 5, '10:40', 60, 1150000, 'c3000000-0000-0000-0000-000000000001'],
  ['SIA', 'SQ178', 'SIN', 'SGN', 2, '09:50', 125, 3600000, 'c3000000-0000-0000-0000-000000000003'],
  ['SIA', 'SQ192', 'SIN', 'HAN', 4, '10:20', 195, 4300000, 'c3000000-0000-0000-0000-000000000003'],
  ['THA', 'TG550', 'BKK', 'SGN', 2, '07:35', 95, 2900000, 'c3000000-0000-0000-0000-000000000004'],
  ['MAS', 'MH750', 'KUL', 'SGN', 3, '09:00', 120, 2800000, 'c3000000-0000-0000-0000-000000000006'],
  ['AXM', 'AK520', 'KUL', 'SGN', 4, '06:55', 120, 1900000, 'c3000000-0000-0000-0000-000000000005'],
  ['KAL', 'KE469', 'ICN', 'SGN', 2, '09:05', 325, 7800000, 'c3000000-0000-0000-0000-000000000007'],
  ['KAL', 'KE441', 'ICN', 'HAN', 5, '08:10', 285, 7600000, 'c3000000-0000-0000-0000-000000000007'],
  ['AAR', 'OZ731', 'ICN', 'SGN', 6, '19:30', 320, 7300000, 'c3000000-0000-0000-0000-000000000008'],
  ['JAL', 'JL751', 'NRT', 'HAN', 3, '18:00', 340, 11500000, 'c3000000-0000-0000-0000-000000000009'],
  ['ANA', 'NH833', 'HND', 'SGN', 4, '19:20', 365, 11800000, 'c3000000-0000-0000-0000-000000000010'],
  ['CAL', 'CI783', 'TPE', 'SGN', 3, '14:20', 210, 5300000, 'c3000000-0000-0000-0000-000000000011'],
  ['EVA', 'BR391', 'TPE', 'SGN', 5, '09:10', 210, 5600000, 'c3000000-0000-0000-0000-000000000012'],
  ['CPA', 'CX799', 'HKG', 'SGN', 4, '16:45', 170, 4700000, 'c3000000-0000-0000-0000-000000000013'],
  ['UAE', 'EK392', 'DXB', 'SGN', 6, '09:35', 435, 14500000, 'c3000000-0000-0000-0000-000000000014'],
  ['QTR', 'QR970', 'DOH', 'SGN', 7, '02:00', 445, 13800000, 'c3000000-0000-0000-0000-000000000015'],
  ['THY', 'TK162', 'IST', 'SGN', 8, '02:05', 600, 15600000, 'c3000000-0000-0000-0000-000000000016'],
  ['AFR', 'AF258', 'CDG', 'SGN', 9, '13:10', 720, 16600000, 'c3000000-0000-0000-0000-000000000017'],
  ['DLH', 'LH772', 'MUC', 'SGN', 10, '22:20', 690, 16400000, 'c3000000-0000-0000-0000-000000000018'],
  ['QFA', 'QF5571', 'SYD', 'SGN', 11, '10:15', 525, 13200000, 'c3000000-0000-0000-0000-000000000019'],
];

const flights = routeRows.map((row, index) => {
  const [airlineCode, flightNumber, originCode, destinationCode, dayOffset, localTime, durationMinutes, basePrice, aircraftId] = row;
  return {
    id: `d3000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
    airline_id: airlineId(airlineCode),
    aircraft_id: aircraftId,
    origin_airport_id: airportId(originCode),
    destination_airport_id: airportId(destinationCode),
    flight_number: flightNumber,
    departure_time: futureIso(dayOffset + Math.floor(index / 8) * 7, localTime),
    arrival_time: futureIso(dayOffset + Math.floor(index / 8) * 7, localTime, durationMinutes),
    base_price: basePrice,
    available_seats: 24,
    status: 'scheduled',
  };
});

function airlineId(code) {
  const airline = airlines.find((item) => item.code === code);
  if (!airline) throw new Error(`Unknown airline ${code}`);
  return airline.id;
}

function airportId(code) {
  const airport = airports.find((item) => item.code === code);
  if (!airport) throw new Error(`Unknown airport ${code}`);
  return airport.id;
}

function futureIso(dayOffset, hhmm, durationMinutes = 0) {
  const [hour, minute] = hhmm.split(':').map(Number);
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour - 7, minute, 0, 0);
  date.setUTCMinutes(date.getUTCMinutes() + durationMinutes);
  return date.toISOString();
}

function seatsForFlight(flight) {
  const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
  const seats = [];

  for (let row = 1; row <= 4; row += 1) {
    for (const column of columns) {
      seats.push({
        flight_id: flight.id,
        seat_number: `${row}${column}`,
        seat_class: row === 1 ? 'business' : 'economy',
        status: 'available',
        price: row === 1 ? Math.round(flight.base_price * 1.9) : flight.base_price,
      });
    }
  }

  return seats;
}

function fullSeatMapForFlight(flight) {
  const capacity = Number(flight.aircraft?.total_seats ?? flight.available_seats ?? 24);
  const availableSeats = Math.min(Math.max(Number(flight.available_seats ?? 0), 0), capacity);
  const unavailableSeats = capacity - availableSeats;
  const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
  const seats = [];

  for (let index = 0; index < capacity; index += 1) {
    const row = Math.floor(index / columns.length) + 1;
    const seatClass = row <= 2 ? 'business' : 'economy';
    seats.push({
      flight_id: flight.id,
      seat_number: `${row}${columns[index % columns.length]}`,
      seat_class: seatClass,
      status: index < unavailableSeats ? 'booked' : 'available',
      price: seatClass === 'business' ? Math.round(Number(flight.base_price) * 1.9) : flight.base_price,
    });
  }

  return seats;
}

function baggageForFlight(flight) {
  const international = flight.base_price >= 1_800_000;
  return [
    { flight_id: flight.id, weight_kg: international ? 23 : 15, price: international ? 450000 : 120000, description: international ? 'Checked baggage 23kg' : 'Checked baggage 15kg' },
    { flight_id: flight.id, weight_kg: international ? 32 : 20, price: international ? 750000 : 180000, description: international ? 'Checked baggage 32kg' : 'Checked baggage 20kg' },
  ];
}

function mealsForFlight(flight, index) {
  const international = flight.base_price >= 1_800_000;
  return [
    {
      id: `f4000000-0000-0000-0000-${String(index * 2 + 1).padStart(12, '0')}`,
      flight_id: flight.id,
      name: international ? 'International meal set' : 'Com ga nuong',
      description: international ? 'Main dish, dessert and drink' : 'Rice with grilled chicken and vegetables',
      price: international ? 180000 : 85000,
      meal_type: 'standard',
    },
    {
      id: `f4000000-0000-0000-0000-${String(index * 2 + 2).padStart(12, '0')}`,
      flight_id: flight.id,
      name: international ? 'Vegetarian international meal' : 'Com chay',
      description: international ? 'Vegetarian main dish, dessert and drink' : 'Rice with tofu and vegetables',
      price: international ? 160000 : 75000,
      meal_type: 'vegetarian',
    },
  ];
}

async function upsert(table, rows, options = {}) {
  if (!rows.length) return;

  const { error } = await supabase.from(table).upsert(rows, options);
  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
}

async function ensureSeatMaps() {
  const [{ data: databaseFlights, error: flightsError }, { data: currentSeats, error: seatsError }] = await Promise.all([
    supabase.from('flights').select('id, base_price, available_seats, aircraft:aircrafts(total_seats)'),
    supabase.from('seats').select('flight_id'),
  ]);

  if (flightsError || seatsError) {
    throw new Error(`Unable to inspect seat maps: ${flightsError?.message ?? seatsError?.message}`);
  }

  const flightIdsWithSeats = new Set(currentSeats.map((seat) => seat.flight_id));
  const seatRows = databaseFlights
    .filter((flight) => !flightIdsWithSeats.has(flight.id))
    .flatMap(fullSeatMapForFlight);

  for (let index = 0; index < seatRows.length; index += 500) {
    await upsert('seats', seatRows.slice(index, index + 500), { onConflict: 'flight_id,seat_number' });
  }

  console.log(`seat maps repaired: ${seatRows.length} seats across ${new Set(seatRows.map((seat) => seat.flight_id)).size} flights`);
}

await upsert('airlines', airlines, { onConflict: 'id' });
await upsert('airports', airports, { onConflict: 'id' });
await upsert('aircrafts', aircrafts, { onConflict: 'id' });
await upsert('flights', flights, { onConflict: 'id' });
await upsert('seats', flights.flatMap(seatsForFlight), { onConflict: 'flight_id,seat_number' });
await ensureSeatMaps();
await upsert('baggage_options', flights.flatMap(baggageForFlight), { onConflict: 'flight_id,weight_kg' });
await upsert('meal_options', flights.flatMap(mealsForFlight), { onConflict: 'id' });

for (const table of ['airlines', 'airports', 'aircrafts', 'flights']) {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
  if (error) throw error;
  console.log(`${table}: ${count}`);
}
