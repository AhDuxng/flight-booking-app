import test from "node:test";
import assert from "node:assert/strict";
import { toFlightView } from "../src/features/flights/flightView.js";

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
