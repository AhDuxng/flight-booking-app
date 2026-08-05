import test from 'node:test';
import assert from 'node:assert/strict';
import { registerSchema } from '../src/modules/auth/auth.schema.js';
import { createBookingSchema } from '../src/modules/bookings/booking.schema.js';
import { flightSearchSchema } from '../src/modules/flights/flight.schema.js';
import { createPagination, getPagination } from '../src/utils/pagination.js';
import {
  detectAirports,
  detectDepartureDate,
  detectFlightNumber,
  detectPassengerCount,
  normalizeVietnameseText,
} from '../src/modules/chatbot/chatbot.flight-context.js';
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

const FIRST_UUID = '11111111-1111-4111-8111-111111111111';
const SECOND_UUID = '22222222-2222-4222-8222-222222222222';
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

test('flight search normalizes an optional flight number', () => {
  const result = flightSearchSchema.parse({ flightNumber: 'vn 123' });
  assert.equal(result.flightNumber, 'VN123');
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
