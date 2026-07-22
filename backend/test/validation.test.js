import test from 'node:test';
import assert from 'node:assert/strict';
import { registerSchema } from '../src/modules/auth/auth.schema.js';
import { createBookingSchema } from '../src/modules/bookings/booking.schema.js';
import { flightSearchSchema } from '../src/modules/flights/flight.schema.js';
import { createPagination, getPagination } from '../src/utils/pagination.js';

const FIRST_UUID = '11111111-1111-4111-8111-111111111111';
const SECOND_UUID = '22222222-2222-4222-8222-222222222222';

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
  assert.equal(flightSearchSchema.safeParse({ originAirportId: FIRST_UUID, destinationAirportId: FIRST_UUID }).success, false);
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
    passengers: [{
      firstName: 'An',
      lastName: 'Nguyen',
      dateOfBirth: '2999-01-01',
      gender: 'male',
      nationality: 'Vietnam',
      passengerType: 'adult',
    }],
    seatIds: [SECOND_UUID],
    baggage: [],
    meals: [],
  });

  assert.equal(result.success, false);
});

test('registration rejects weak passwords', () => {
  assert.equal(registerSchema.safeParse({ email: 'user@example.com', password: 'short', fullName: 'User Name' }).success, false);
});

test('pagination produces stable database and response ranges', () => {
  assert.deepEqual(getPagination({ page: 3, limit: 20 }), { page: 3, limit: 20, from: 40, to: 59 });
  assert.deepEqual(createPagination(3, 20, 45), { page: 3, limit: 20, total: 45, totalPages: 3 });
});
