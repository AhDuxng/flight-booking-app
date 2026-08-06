import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { toFlightView } from "../src/features/flights/flightView.js";
import { formatCurrencyInput, normalizeCurrencyInput } from "../src/lib/currencyInput.js";
import {
  isValidFlightNumber,
  normalizeFlightNumber,
} from "../src/features/flights/flightConstants.js";
import {
  calculateAge,
  isPassengerAgeValid,
  latestAdultBirthDate,
} from "../src/lib/passengerAge.js";

test("flight API data is normalized for the UI", () => {
  const result = toFlightView({
    id: "flight-1",
    flight_number: "VN123",
    departure_time: "2026-07-22T01:00:00.000Z",
    arrival_time: "2026-07-22T03:30:00.000Z",
    base_price: "1200000",
    dynamic_price: "1320000",
    available_seats: "8",
    status: "scheduled",
    airline: { code: "VNA", name: "Vietnam Airlines" },
    aircraft: { model: "Airbus A321" },
    origin_airport: { code: "SGN", city: "Ho Chi Minh City" },
    destination_airport: { code: "HAN", city: "Hanoi" },
  });

  assert.equal(result.duration, 150);
  assert.equal(result.price, 1320000);
  assert.equal(result.availableSeats, 8);
  assert.equal(result.origin, "SGN");
  assert.equal(result.destination, "HAN");
});

test("invalid flight duration is represented as unavailable", () => {
  const result = toFlightView({
    departure_time: "2026-07-22T03:00:00.000Z",
    arrival_time: "2026-07-22T02:00:00.000Z",
  });
  assert.equal(result.duration, null);
});

test("currency input uses Vietnamese thousands separators and preserves a raw numeric value", () => {
  assert.equal(formatCurrencyInput("1000000"), "1.000.000");
  assert.equal(formatCurrencyInput(134000000), "134.000.000");
  assert.equal(normalizeCurrencyInput("1.000.000 đ"), "1000000");
  assert.equal(normalizeCurrencyInput("0001250000"), "1250000");
  assert.equal(formatCurrencyInput(""), "");
});

test("public flight-number search normalizes and validates user input", () => {
  assert.equal(normalizeFlightNumber("  vn 123 "), "VN123");
  assert.equal(isValidFlightNumber("VN123"), true);
  assert.equal(isValidFlightNumber("VN%"), false);
  assert.equal(isValidFlightNumber("V"), false);
});

test("operations admin uses business forms instead of a raw JSON editor", async () => {
  const [page, form] = await Promise.all([
    readFile(
      new URL("../src/features/operations/AdminOperationsFeature.jsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../src/features/operations/AdminOperationForm.jsx", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(page, /JSON\.stringify/);
  assert.match(form, /Điểm đi \*/);
  assert.match(form, /Hãng bay \*/);
  assert.match(form, /CurrencyInput/);
  assert.match(form, /Thông báo cho hành khách/);
});

test("booking flow persists drafts, displays discounts and enforces fare-compatible seats", async () => {
  const [form, seats, store] = await Promise.all([
    readFile(new URL("../src/features/bookings/BookingForm.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/features/seats/SeatSelector.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/store/bookingStore.js", import.meta.url), "utf8"),
  ]);
  assert.match(store, /bookingDraft/);
  assert.match(form, /setBookingDraft/);
  assert.match(form, /discountAmount/);
  assert.match(seats, /seat\.seat_class === fareCabinClass/);
  assert.match(seats, /Quay lại sửa thông tin/);
});

test("adult age validation handles the exact eighteenth birthday", () => {
  const today = new Date("2026-08-06T12:00:00.000Z");
  assert.equal(calculateAge("2008-08-06", today), 18);
  assert.equal(calculateAge("2008-08-07", today), 17);
  assert.equal(isPassengerAgeValid("2008-08-06", "adult", today), true);
  assert.equal(isPassengerAgeValid("2008-08-07", "adult", today), false);
  assert.equal(latestAdultBirthDate(today), "2008-08-06");
});

test("booking discount UI is a single eligible-code selector", async () => {
  const form = await readFile(
    new URL("../src/features/bookings/BookingForm.jsx", import.meta.url),
    "utf8",
  );
  assert.match(form, /getEligible/);
  assert.match(form, /Không áp dụng mã giảm giá/);
  assert.doesNotMatch(form, /placeholder="Nhập mã giảm giá"/);
});
