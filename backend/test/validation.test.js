import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerSchema } from '../src/modules/auth/auth.schema.js';
import {
  calculatePassengerAge,
  createBookingSchema,
} from '../src/modules/bookings/booking.schema.js';
import { createFlightSchema, flightSearchSchema } from '../src/modules/flights/flight.schema.js';
import { createPagination, getPagination } from '../src/utils/pagination.js';
import {
  detectAirports,
  detectDepartureDate,
  detectDepartureWindow,
  detectFlightNumber,
  detectPassengerCount,
  normalizeVietnameseText,
} from '../src/modules/chatbot/chatbot.flight-context.js';
import { isPromotionQuestion } from '../src/modules/chatbot/chatbot.promotion-context.js';
import {
  checkInSchema,
  flightStatusQuerySchema,
  refundDecisionSchema,
  supportTicketSchema,
} from '../src/modules/operations/operation.schema.js';
import {
  createBoardingPassPdf,
  createETicketPdf,
} from '../src/modules/operations/document.service.js';
import { adminListQuerySchema } from '../src/modules/admin/admin.schema.js';
import { calculateDiscountAmount } from '../src/modules/discounts/discount.calculator.js';
import {
  buildChatbotFallback,
  isGeminiCredentialFailure,
} from '../src/modules/chatbot/chatbot.fallback.js';

const FIRST_UUID = '11111111-1111-4111-8111-111111111111';
const SECOND_UUID = '22222222-2222-4222-8222-222222222222';
const THIRD_UUID = '33333333-3333-4333-8333-333333333333';
const FOURTH_UUID = '44444444-4444-4444-8444-444444444444';
const FIFTH_UUID = '55555555-5555-4555-8555-555555555555';
const AIRPORTS = [
  {
    id: FIRST_UUID,
    code: 'HAN',
    city: 'Hà Nội',
    name: 'Sân bay Quốc tế Nội Bài',
    timezone: 'Asia/Ho_Chi_Minh',
  },
  {
    id: SECOND_UUID,
    code: 'DAD',
    city: 'Đà Nẵng',
    name: 'Sân bay Quốc tế Đà Nẵng',
    timezone: 'Asia/Ho_Chi_Minh',
  },
  {
    id: THIRD_UUID,
    code: 'DLI',
    city: 'Đà Lạt',
    name: 'Sân bay Liên Khương',
    timezone: 'Asia/Ho_Chi_Minh',
  },
  {
    id: FOURTH_UUID,
    code: 'PQC',
    city: 'Phú Quốc',
    name: 'Sân bay Quốc tế Phú Quốc',
    timezone: 'Asia/Ho_Chi_Minh',
  },
  {
    id: FIFTH_UUID,
    code: 'SGN',
    city: 'Sài Gòn',
    name: 'Sân bay Quốc tế Tân Sơn Nhất',
    timezone: 'Asia/Ho_Chi_Minh',
  },
];

test('flight search normalizes numeric fields and accepts an IANA timezone', () => {
  const result = flightSearchSchema.parse({
    originAirportId: FIRST_UUID,
    destinationAirportId: SECOND_UUID,
    departureDate: '2026-07-22',
    departureTimezone: 'Asia/Ho_Chi_Minh',
    passengerCount: '3',
  });

  assert.equal(result.passengerCount, 3);
  assert.equal(result.page, 1);
});

test('flight search rejects an identical origin and destination', () => {
  assert.equal(
    flightSearchSchema.safeParse({
      originAirportId: FIRST_UUID,
      destinationAirportId: FIRST_UUID,
    }).success,
    false,
  );
});

test('flight search accepts an inclusive date range', () => {
  const result = flightSearchSchema.parse({
    departureDate: '2026-08-10',
    departureDateTo: '2026-08-16',
  });
  assert.equal(result.departureDateTo, '2026-08-16');
  assert.equal(
    flightSearchSchema.safeParse({
      departureDate: '2026-08-16',
      departureDateTo: '2026-08-10',
    }).success,
    false,
  );
});

test('flight search normalizes an optional flight number', () => {
  const result = flightSearchSchema.parse({ flightNumber: 'vn 123' });
  assert.equal(result.flightNumber, 'VN123');
  assert.equal(flightSearchSchema.safeParse({ flightNumber: 'VN%' }).success, false);
});

test('flight creation stores the same canonical flight number used by public search', () => {
  const result = createFlightSchema.parse({
    airlineId: FIRST_UUID,
    aircraftId: SECOND_UUID,
    originAirportId: FIRST_UUID,
    destinationAirportId: SECOND_UUID,
    flightNumber: 'vn 123',
    departureTime: '2999-01-01T01:00:00.000Z',
    arrivalTime: '2999-01-01T03:00:00.000Z',
    basePrice: 1_000_000,
  });
  assert.equal(result.flightNumber, 'VN123');
});

test('admin list search normalizes a flight number before querying the database', () => {
  const result = adminListQuerySchema.parse({ search: '  vn 123  ' });
  assert.equal(result.search, 'VN123');
});

test('booking validation requires one unique seat per passenger', () => {
  const passenger = {
    firstName: 'An',
    lastName: 'Nguyen',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    nationality: 'Vietnam',
    passengerType: 'adult',
  };
  const result = createBookingSchema.safeParse({
    flightId: FIRST_UUID,
    contactEmail: 'an@example.com',
    passengers: [passenger, passenger],
    seatIds: [SECOND_UUID, SECOND_UUID],
    baggage: [],
    meals: [],
  });

  assert.equal(result.success, false);
});

test('booking validation rejects a future passenger date of birth', () => {
  const result = createBookingSchema.safeParse({
    flightId: FIRST_UUID,
    contactEmail: 'an@example.com',
    passengers: [
      {
        firstName: 'An',
        lastName: 'Nguyen',
        dateOfBirth: '2999-01-01',
        gender: 'male',
        nationality: 'Vietnam',
        passengerType: 'adult',
      },
    ],
    seatIds: [SECOND_UUID],
    baggage: [],
    meals: [],
  });

  assert.equal(result.success, false);
});

test('adult passengers must be at least 18 years old', () => {
  const today = new Date('2026-08-06T12:00:00.000Z');
  assert.equal(calculatePassengerAge('2008-08-06', today), 18);
  assert.equal(calculatePassengerAge('2008-08-07', today), 17);
});

test('eligible discount endpoint is separate from free-form validation', async () => {
  const routes = await readFile(
    new URL('../src/modules/discounts/discount.routes.js', import.meta.url),
    'utf8',
  );
  assert.match(routes, /\/eligible/);
  assert.match(routes, /eligibleDiscountsSchema/);
});

test('registration rejects weak passwords', () => {
  assert.equal(
    registerSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
      fullName: 'User Name',
    }).success,
    false,
  );
});

test('pagination produces stable database and response ranges', () => {
  assert.deepEqual(getPagination({ page: 3, limit: 20 }), {
    page: 3,
    limit: 20,
    from: 40,
    to: 59,
  });
  assert.deepEqual(createPagination(3, 20, 45), {
    page: 3,
    limit: 20,
    total: 45,
    totalPages: 3,
  });
});

test('chatbot normalizes Vietnamese text and detects a flight route', () => {
  assert.equal(normalizeVietnameseText('Hà Nội đến Đà Nẵng'), 'ha noi den da nang');

  const route = detectAirports('Tìm chuyến bay từ Hà Nội đến Đà Nẵng', AIRPORTS);
  assert.equal(route.origin?.code, 'HAN');
  assert.equal(route.destination?.code, 'DAD');
});

test('chatbot understands relative dates, passengers and flight numbers', () => {
  const now = new Date('2026-07-23T02:00:00.000Z');

  assert.equal(detectDepartureDate('Tìm vé ngày mai', now), '2026-07-24');
  assert.equal(detectDepartureDate('Bay ngày 25/07/2026', now), '2026-07-25');
  assert.equal(detectPassengerCount('Tôi cần 3 vé'), 3);
  assert.equal(detectFlightNumber('Thông tin chuyến VN 215'), 'VN215');
  assert.equal(detectFlightNumber('Bay ngày 25/07/2026'), null);
  assert.equal(detectFlightNumber('Tìm vé cho 2 người'), null);
});

test('chatbot treats "đi Đà Lạt" as a destination and resolves next week', () => {
  const route = detectAirports('Tìm chuyến bay đi Đà Lạt', AIRPORTS);
  assert.equal(route.origin, null);
  assert.equal(route.destination?.code, 'DLI');

  const window = detectDepartureWindow(
    'Tìm chuyến bay đến Đà Lạt bất kỳ ngày nào trong tuần sau',
    new Date('2026-08-06T03:00:00.000Z'),
  );
  assert.deepEqual(
    { endDate: window.endDate, startDate: window.startDate },
    { endDate: '2026-08-16', startDate: '2026-08-10' },
  );
});

test('chatbot parses each new route without retaining the previous destination', () => {
  const previous = detectAirports('Tìm chuyến bay từ Hà Nội đến Phú Quốc vào tuần sau', AIRPORTS);
  const current = detectAirports('Tìm chuyến bay từ Hà Nội đến Sài Gòn vào tuần sau', AIRPORTS);

  assert.equal(previous.destination?.code, 'PQC');
  assert.equal(current.origin?.code, 'HAN');
  assert.equal(current.destination?.code, 'SGN');
});

test('chatbot classifies hot promotions separately from flight search', () => {
  assert.equal(isPromotionQuestion('Khuyến mãi hot'), true);
  assert.equal(isPromotionQuestion('Tìm chuyến bay đến Phú Quốc'), false);

  const response = buildChatbotFallback('Khuyến mãi hot', {
    metadata: {
      intent: 'promotion',
      discounts: [
        {
          code: 'FLAT50K',
          endDate: '2026-09-01T00:00:00.000Z',
          minimumOrder: 500_000,
          value: '50.000đ',
        },
      ],
    },
  });
  assert.match(response, /FLAT50K/);
  assert.doesNotMatch(response, /chuyến bay phù hợp/);
});

test('chatbot degraded mode returns real flight details instead of a generic outage', () => {
  const response = buildChatbotFallback('Tìm chuyến bay đi Đà Lạt', {
    metadata: {
      departureLabel: 'tuần sau (10/08–16/08/2026)',
      flightCount: 1,
      flights: [
        {
          availableSeats: 20,
          departureTime: '2026-08-10T01:00:00.000Z',
          destination: 'DLI',
          flightNumber: 'VN123',
          id: FIRST_UUID,
          origin: 'HAN',
          price: 1_200_000,
        },
      ],
      intent: 'flight',
    },
  });
  assert.match(response, /VN123/);
  assert.match(response, /HAN → DLI/);
  assert.doesNotMatch(response, /tạm gián đoạn/);
});

test('discount preview applies percentage caps and never exceeds the order total', () => {
  assert.equal(
    calculateDiscountAmount(
      { discount_type: 'percentage', discount_value: 20, max_discount: 150_000 },
      1_000_000,
    ),
    150_000,
  );
  assert.equal(
    calculateDiscountAmount(
      { discount_type: 'fixed', discount_value: 800_000, max_discount: null },
      500_000,
    ),
    500_000,
  );
});

test('chatbot retries invalid credentials and returns a safe Vietnamese fallback', () => {
  assert.equal(
    isGeminiCredentialFailure(400, {
      error: { status: 'INVALID_ARGUMENT', message: 'API key not valid' },
    }),
    true,
  );
  const response = buildChatbotFallback('Tôi muốn hoàn vé', null);
  assert.match(response, /Đặt chỗ của tôi/);
  assert.doesNotMatch(response, /API key|Gemini/i);
});

test('operations validation enforces document confirmation and refund decisions', () => {
  assert.equal(
    checkInSchema.safeParse({ passengerIds: [FIRST_UUID], documentConfirmed: false }).success,
    false,
  );
  assert.equal(
    refundDecisionSchema.parse({ action: 'approve', approvedAmount: '250000' }).approvedAmount,
    250000,
  );
  assert.equal(flightStatusQuerySchema.parse({ flightNumber: 'vn 123' }).flightNumber, 'VN123');
  assert.equal(
    checkInSchema.safeParse({
      passengerIds: [FIRST_UUID, FIRST_UUID],
      documentConfirmed: true,
    }).success,
    false,
  );
  assert.equal(
    checkInSchema.safeParse({
      passengerIds: [FIRST_UUID],
      documentConfirmed: true,
      seatAssignments: [{ passengerId: SECOND_UUID, seatId: FIRST_UUID }],
    }).success,
    false,
  );
});

test('support requests require actionable details', () => {
  assert.equal(
    supportTicketSchema.safeParse({
      category: 'booking',
      subject: 'Help',
      description: 'too short',
    }).success,
    false,
  );
});

test('e-ticket and boarding pass generators produce PDF documents with unicode data', async () => {
  const flight = {
    flight_number: 'VN123',
    departure_time: '2026-07-26T01:00:00.000Z',
    arrival_time: '2026-07-26T03:00:00.000Z',
    airline: { name: 'Hãng Hàng Không Việt' },
    origin_airport: { code: 'HAN' },
    destination_airport: { code: 'SGN' },
  };
  const booking = {
    id: FIRST_UUID,
    booking_reference: 'ABC123',
    status: 'confirmed',
    flight,
    fare: { name: 'Phổ thông linh hoạt' },
    passengers: [{ id: SECOND_UUID, first_name: 'Dũng', last_name: 'Phạm' }],
    tickets: [{ passenger_id: SECOND_UUID, ticket_number: '7380000000001', status: 'issued' }],
    booking_seats: [
      { passenger_id: SECOND_UUID, seat: { seat_number: '10A', seat_class: 'economy' } },
    ],
  };
  const ticket = await createETicketPdf(booking);
  const boardingPass = await createBoardingPassPdf({
    boarding_pass_number: 'BP123456',
    qr_payload: '{"boardingPass":"BP123456"}',
    boarding_sequence: 1,
    passenger: booking.passengers[0],
    ticket: booking.tickets[0],
    seat: booking.booking_seats[0].seat,
    flight,
  });
  assert.equal(ticket.subarray(0, 4).toString(), '%PDF');
  assert.equal(boardingPass.subarray(0, 4).toString(), '%PDF');
});
