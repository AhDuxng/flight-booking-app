export const toFlightView = (flight) => {
  const departureTime = flight.departure_time;
  const arrivalTime = flight.arrival_time;
  const duration = Math.round(
    (new Date(arrivalTime).getTime() - new Date(departureTime).getTime()) / 60000,
  );

  return {
    id: flight.id,
    flightNumber: flight.flight_number,
    airline: flight.airline?.name ?? "Hãng bay",
    airlineCode: flight.airline?.code ?? "",
    aircraft: flight.aircraft?.model ?? "Đang cập nhật",
    origin: flight.origin_airport?.code ?? "",
    originCity: flight.origin_airport?.city ?? "",
    destination: flight.destination_airport?.code ?? "",
    destinationCity: flight.destination_airport?.city ?? "",
    departureTime,
    arrivalTime,
    duration: Number.isFinite(duration) && duration > 0 ? duration : null,
    price: Number(flight.dynamic_price ?? flight.base_price ?? 0),
    availableSeats: Number(flight.available_seats ?? 0),
    status: flight.status,
    raw: flight,
  };
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

export const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Đang cập nhật";

export const formatTime = (value) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(value))
    : "--:--";
