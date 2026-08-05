export const FLIGHT_SCOPES = [
  { label: "Trong nước", value: "domestic" },
  { label: "Ngoài nước", value: "international" },
];

export const FLIGHT_SEARCH_MODES = [
  { label: "Theo hành trình", value: "route" },
  { label: "Theo mã chuyến", value: "flight-number" },
];

export const normalizeFlightNumber = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

export const isValidFlightNumber = (value) => /^[A-Z0-9-]{2,12}$/.test(value);

export const FLIGHT_TYPES = [{ label: "Một chiều", value: "one-way" }];

export const PASSENGER_OPTIONS = [
  { label: "1 Người lớn, 0 Trẻ em", value: "1-0" },
  { label: "2 Người lớn, 0 Trẻ em", value: "2-0" },
  { label: "2 Người lớn, 1 Trẻ em", value: "2-1" },
];

export const CABIN_OPTIONS = [
  { label: "Phổ thông", value: "economy" },
  { label: "Thương gia", value: "business" },
];
