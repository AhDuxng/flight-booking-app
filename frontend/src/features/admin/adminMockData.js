export const adminStats = [
  { label: "Doanh thu tháng", value: "4.82 tỷ", trend: "+12.4%" },
  { label: "Đơn đặt vé", value: "1,248", trend: "+8.1%" },
  { label: "Chuyến bay hoạt động", value: "186", trend: "+5.6%" },
  { label: "Tỷ lệ lấp đầy", value: "82%", trend: "+3.2%" },
];

export const adminFlights = [
  {
    id: "VF204",
    airline: "VietFly Airlines",
    aircraft: "Airbus A321neo",
    arrival: "10:45",
    date: "2026-08-12",
    departure: "08:30",
    destination: "SGN",
    origin: "HAN",
    price: "1.850.000 VND",
    seats: "162/210",
    status: "scheduled",
    statusLabel: "Đã lên lịch",
  },
  {
    id: "VF118",
    airline: "VietFly Airlines",
    aircraft: "Boeing 787-9",
    arrival: "15:20",
    date: "2026-08-12",
    departure: "13:15",
    destination: "HAN",
    origin: "DAD",
    price: "1.420.000 VND",
    seats: "118/180",
    status: "published",
    statusLabel: "Đang bán",
  },
  {
    id: "VF901",
    airline: "VietFly Airlines",
    aircraft: "Airbus A320",
    arrival: "19:30",
    date: "2026-08-13",
    departure: "17:45",
    destination: "PQC",
    origin: "SGN",
    price: "1.250.000 VND",
    seats: "96/168",
    status: "pending",
    statusLabel: "Chờ duyệt",
  },
];

export const adminBookings = [
  {
    id: "VJA8X9",
    customer: "Nguyễn Văn A",
    flight: "VF204",
    route: "HAN - SGN",
    status: "confirmed",
    statusLabel: "Đã xác nhận",
    total: "3.280.000 VND",
  },
  {
    id: "VJB2Y4",
    customer: "Trần Minh Anh",
    flight: "VF118",
    route: "DAD - HAN",
    status: "pending",
    statusLabel: "Chờ thanh toán",
    total: "2.450.000 VND",
  },
  {
    id: "VJC7K2",
    customer: "Lê Hoàng Nam",
    flight: "VF901",
    route: "SGN - PQC",
    status: "cancelled",
    statusLabel: "Đã hủy",
    total: "5.760.000 VND",
  },
];

export const adminUsers = [
  { id: "USR-1001", email: "nguyenvana@example.com", name: "Nguyễn Văn A", role: "Khách hàng", status: "confirmed" },
  { id: "USR-1002", email: "minhanh@example.com", name: "Trần Minh Anh", role: "Khách hàng", status: "confirmed" },
  { id: "USR-1003", email: "ops@vietfly.vn", name: "VietFly Ops", role: "Điều phối", status: "pending" },
];

export const adminPayments = [
  { id: "PAY-8001", booking: "VJA8X9", method: "VNPAY", status: "paid", statusLabel: "Đã thanh toán", total: "3.280.000 VND" },
  { id: "PAY-8002", booking: "VJB2Y4", method: "Thẻ quốc tế", status: "pending", statusLabel: "Đang xử lý", total: "2.450.000 VND" },
  { id: "PAY-8003", booking: "VJC7K2", method: "MoMo", status: "failed", statusLabel: "Thất bại", total: "5.760.000 VND" },
];

export const adminReviews = [
  { id: "REV-01", customer: "Nguyễn Văn A", flight: "VF204", rating: "5/5", status: "published", statusLabel: "Đã hiển thị" },
  { id: "REV-02", customer: "Trần Minh Anh", flight: "VF118", rating: "4/5", status: "pending", statusLabel: "Chờ duyệt" },
  { id: "REV-03", customer: "Lê Hoàng Nam", flight: "VF901", rating: "3/5", status: "published", statusLabel: "Đã hiển thị" },
];

export const adminAirports = [
  { id: "HAN", city: "Hà Nội", name: "Nội Bài", status: "published", terminal: "T1, T2" },
  { id: "SGN", city: "TP. Hồ Chí Minh", name: "Tân Sơn Nhất", status: "published", terminal: "T1, T2" },
  { id: "DAD", city: "Đà Nẵng", name: "Đà Nẵng", status: "published", terminal: "T1" },
];

export const adminAirlines = [
  { id: "VFA", code: "VF", name: "VietFly Airlines", status: "published", type: "Full-service" },
  { id: "VJA", code: "VJ", name: "Vietjet Air", status: "published", type: "Low-cost" },
  { id: "HVN", code: "VN", name: "Vietnam Airlines", status: "published", type: "Full-service" },
];

export const adminAircrafts = [
  { id: "A321-01", model: "Airbus A321neo", registration: "VN-A321", seats: "210", status: "published" },
  { id: "B789-02", model: "Boeing 787-9", registration: "VN-B789", seats: "294", status: "published" },
  { id: "A320-03", model: "Airbus A320", registration: "VN-A320", seats: "168", status: "scheduled" },
];
