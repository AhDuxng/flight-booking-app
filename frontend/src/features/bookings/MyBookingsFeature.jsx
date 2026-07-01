import { useMemo, useState } from "react";
import {
  ChevronDown,
  Clock3,
  CreditCard,
  Download,
  Plane,
  ReceiptText,
  Search,
  User,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const bookings = [
  {
    id: "VJA8X9",
    status: "confirmed",
    statusLabel: "Đã xác nhận",
    timeGroup: "upcoming",
    date: "Thứ 6, 24 Th11",
    route: "TP. Hồ Chí Minh đến Hà Nội",
    departureAirport: "SGN",
    arrivalAirport: "HAN",
    departureTime: "08:30",
    arrivalTime: "10:45",
    passengers: 2,
    cabin: "Phổ thông",
    total: "3.280.000 đ",
    actionLabel: "Xem chi tiết",
  },
  {
    id: "VJB2Y4",
    status: "pending",
    statusLabel: "Chờ thanh toán",
    timeGroup: "upcoming",
    date: "Chủ nhật, 03 Th12",
    route: "Đà Nẵng đến TP. Hồ Chí Minh",
    departureAirport: "DAD",
    arrivalAirport: "SGN",
    departureTime: "14:00",
    arrivalTime: "15:25",
    passengers: 1,
    cabin: "Thương gia",
    total: "2.450.000 đ",
    actionLabel: "Thanh toán ngay",
    paymentDeadline: "Vui lòng thanh toán trước 22:00, 20 Th11 để giữ chỗ.",
  },
  {
    id: "VJC7K2",
    status: "cancelled",
    statusLabel: "Đã hủy",
    timeGroup: "past",
    date: "Thứ 4, 08 Th10",
    route: "Hà Nội đến Phú Quốc",
    departureAirport: "HAN",
    arrivalAirport: "PQC",
    departureTime: "11:15",
    arrivalTime: "13:25",
    passengers: 3,
    cabin: "Phổ thông",
    total: "5.760.000 đ",
    actionLabel: "Đặt lại",
  },
];

const statusStyles = {
  confirmed: "bg-status-success/10 text-status-success border-status-success/20",
  pending: "bg-status-warning/10 text-[#B45309] border-status-warning/30",
  cancelled: "bg-status-error/10 text-status-error border-status-error/20",
};

const actionStyles = {
  confirmed: "bg-primary text-on-primary hover:bg-primary-container",
  pending: "bg-[#F97316] text-deep-navy font-bold hover:bg-[#EA580C]",
  cancelled: "border border-primary text-primary hover:bg-primary/5",
};

const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "pending", label: "Chờ thanh toán" },
  { value: "cancelled", label: "Đã hủy" },
];

const timeOptions = [
  { value: "upcoming", label: "Sắp tới" },
  { value: "past", label: "Đã bay" },
  { value: "all", label: "Tất cả thời gian" },
];

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="relative block w-full sm:w-auto">
      <span className="sr-only">{label}</span>
      <select
        className="h-10 w-full min-w-0 appearance-none rounded border border-outline-variant bg-surface-container-lowest px-4 pr-10 font-body-sm text-body-sm text-on-surface outline-none transition focus:ring-2 focus:ring-primary/20 sm:min-w-[160px]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
    </label>
  );
}

function BookingCard({ booking }) {
  const isCancelled = booking.status === "cancelled";

  return (
    <article
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-lg border border-surface-container-highest bg-surface-container-lowest flight-card-shadow transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(26,54,93,0.1)]",
        isCancelled && "opacity-75",
      )}
    >
      <div className="flex min-w-0 flex-col gap-stack-md p-stack-md md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-stack-md md:flex-row md:items-center">
          <div className="flex min-w-0 items-start justify-between gap-stack-sm md:w-[132px] md:flex-none md:flex-col md:justify-start">
            <div className="min-w-0">
              <span className="block truncate font-label-md text-label-md text-on-surface-variant">{booking.date}</span>
              <span
                className={cn(
                  "mt-1 inline-flex max-w-full rounded px-2 py-1 font-data-mono text-data-mono",
                  isCancelled
                    ? "bg-surface-variant/50 text-on-surface-variant line-through"
                    : "bg-primary/5 text-primary",
                )}
              >
                {booking.id}
              </span>
            </div>
            <span
              className={cn(
                "inline-flex flex-none items-center rounded-full border px-2.5 py-0.5 font-label-md text-label-md uppercase",
                statusStyles[booking.status],
              )}
            >
              {booking.statusLabel}
            </span>
          </div>

          <div className={cn("grid min-w-0 flex-1 gap-stack-sm", isCancelled && "grayscale opacity-60")}>
            <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{booking.route}</p>
            <div className="grid min-w-0 grid-cols-[auto_minmax(48px,1fr)_auto] items-center gap-stack-sm">
              <div className="w-14 text-center">
                <span className={cn("block font-title-lg text-title-lg", isCancelled ? "text-on-surface-variant" : "text-primary")}>
                  {booking.departureAirport}
                </span>
                <span className="block font-body-sm text-body-sm text-on-surface-variant">{booking.departureTime}</span>
              </div>
              <div className="relative flex min-w-0 items-center justify-center px-2">
                <div className="h-px w-full border-b border-dashed border-outline-variant" />
                <span className="absolute bg-surface-container-lowest px-1 text-outline-variant">
                  <Plane className="h-5 w-5 rotate-90" />
                </span>
              </div>
              <div className="w-14 text-center">
                <span className={cn("block font-title-lg text-title-lg", isCancelled ? "text-on-surface-variant" : "text-primary")}>
                  {booking.arrivalAirport}
                </span>
                <span className="block font-body-sm text-body-sm text-on-surface-variant">{booking.arrivalTime}</span>
              </div>
            </div>
          </div>

          <div className="grid min-w-0 gap-1 font-body-sm text-body-sm md:w-[132px] md:flex-none">
            <span className={cn("flex min-w-0 items-center gap-1", isCancelled ? "text-on-surface-variant" : "text-on-surface")}>
              <User className="h-4 w-4 flex-none" />
              <span className="truncate">{booking.passengers} hành khách</span>
            </span>
            <span className="truncate text-on-surface-variant">{booking.cabin}</span>
            <span className={cn("truncate font-semibold", isCancelled ? "text-on-surface-variant" : "text-primary")}>{booking.total}</span>
          </div>
        </div>

        <div className="flex min-w-0 gap-3 border-t border-outline-variant pt-stack-md md:w-[160px] md:flex-none md:flex-col md:border-l md:border-t-0 md:pl-stack-md md:pt-0">
          {booking.status === "confirmed" ? (
            <Link
              className={cn(
                "w-full rounded px-4 py-2 text-center font-label-md text-label-md transition-colors",
                actionStyles[booking.status],
              )}
              to={`/bookings/${booking.id}`}
            >
              {booking.actionLabel}
            </Link>
          ) : booking.status === "pending" ? (
            <Link
              className={cn(
                "w-full rounded px-4 py-2 text-center font-label-md text-label-md transition-colors",
                actionStyles[booking.status],
              )}
              to={`/payment/${booking.id}`}
            >
              {booking.actionLabel}
            </Link>
          ) : (
            <button
              className={cn(
                "w-full rounded px-4 py-2 text-center font-label-md text-label-md transition-colors",
                actionStyles[booking.status],
              )}
            >
              {booking.actionLabel}
            </button>
          )}
        </div>
      </div>

      {booking.paymentDeadline ? (
        <div className="flex min-w-0 items-start gap-2 border-t border-status-warning/20 bg-status-warning/10 px-stack-md py-2">
          <Clock3 className="mt-0.5 h-[18px] w-[18px] flex-none text-[#B45309]" />
          <span className="min-w-0 font-body-sm text-body-sm text-[#B45309]">{booking.paymentDeadline}</span>
        </div>
      ) : null}
    </article>
  );
}

function SummaryPanel({ bookingsCount, pendingCount, cancelledCount }) {
  return (
    <aside className="flex min-w-0 flex-col gap-stack-md lg:col-span-3">
      <div className="rounded-lg border border-surface-container-highest bg-surface-container-lowest p-stack-md flight-card-shadow">
        <h2 className="mb-stack-md font-title-lg text-title-lg text-on-surface">Tổng quan</h2>
        <div className="grid gap-stack-sm">
          <div className="flex min-w-0 items-center justify-between gap-stack-sm rounded bg-surface-container-low px-3 py-2">
            <span className="flex min-w-0 items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
              <ReceiptText className="h-4 w-4 flex-none" />
              <span className="truncate">Tổng đơn</span>
            </span>
            <span className="flex-none font-semibold text-primary">{bookingsCount}</span>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-stack-sm rounded bg-surface-container-low px-3 py-2">
            <span className="flex min-w-0 items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
              <CreditCard className="h-4 w-4 flex-none" />
              <span className="truncate">Chờ thanh toán</span>
            </span>
            <span className="flex-none font-semibold text-[#B45309]">{pendingCount}</span>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-stack-sm rounded bg-surface-container-low px-3 py-2">
            <span className="flex min-w-0 items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
              <XCircle className="h-4 w-4 flex-none" />
              <span className="truncate">Đã hủy</span>
            </span>
            <span className="flex-none font-semibold text-status-error">{cancelledCount}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-primary-container bg-primary p-stack-md text-on-primary">
        <h2 className="mb-2 font-title-lg text-title-lg">Cần chứng từ?</h2>
        <p className="mb-stack-md font-body-sm text-body-sm text-primary-fixed">
          Tải hóa đơn, vé điện tử và phiếu hành trình từ đơn đã xác nhận.
        </p>
        <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-secondary-container px-4 font-label-md text-label-md text-on-secondary-container transition-colors hover:bg-secondary-fixed-dim">
          <Download className="h-4 w-4" />
          <span className="truncate">Tải chứng từ</span>
        </button>
      </div>
    </aside>
  );
}

export default function MyBookingsFeature() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("upcoming");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      const matchesTime = timeFilter === "all" || booking.timeGroup === timeFilter;
      const normalizedSearch = searchTerm.trim().toLowerCase();

      if (!matchesStatus || !matchesTime) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [booking.id, booking.route, booking.departureAirport, booking.arrivalAirport]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [searchTerm, statusFilter, timeFilter]);

  const pendingCount = bookings.filter((booking) => booking.status === "pending").length;
  const cancelledCount = bookings.filter((booking) => booking.status === "cancelled").length;

  return (
    <div className="flex-grow bg-surface-container">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-stack-lg px-container-padding py-stack-lg lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-stack-md lg:col-span-9">
          <div className="rounded-lg border border-surface-container-highest bg-surface-container-lowest p-stack-md flight-card-shadow">
            <div className="flex min-w-0 flex-col gap-stack-md md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <h1 className="mb-stack-sm font-headline-lg text-headline-lg text-primary">Đơn hàng của tôi</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Xem trạng thái đặt chỗ, thanh toán và tải chứng từ cho các chuyến bay của bạn.
                </p>
              </div>

              <div className="flex min-w-0 flex-col gap-stack-sm sm:flex-row">
                <SelectField
                  label="Trạng thái"
                  options={statusOptions}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
                <SelectField label="Thời gian" options={timeOptions} value={timeFilter} onChange={setTimeFilter} />
              </div>
            </div>
          </div>

          <label className="relative block min-w-0">
            <span className="sr-only">Tìm kiếm đơn hàng</span>
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
            <input
              className="h-12 w-full rounded-lg border border-surface-container-highest bg-surface-container-lowest pl-12 pr-4 font-body-md text-body-md text-on-surface outline-none transition placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/20"
              placeholder="Tìm theo mã đặt chỗ, tuyến bay hoặc sân bay"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          {filteredBookings.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-stack-md">
              {filteredBookings.map((booking) => (
                <BookingCard booking={booking} key={booking.id} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-surface-container-highest bg-surface-container-lowest p-stack-lg text-center flight-card-shadow">
              <ReceiptText className="mx-auto mb-4 h-10 w-10 text-outline" />
              <h2 className="mb-2 font-title-lg text-title-lg text-primary">Chưa có đơn hàng phù hợp</h2>
              <p className="mx-auto mb-5 max-w-md font-body-md text-body-md text-on-surface-variant">
                Thử đổi bộ lọc hoặc tìm chuyến bay mới để bắt đầu đơn hàng tiếp theo.
              </p>
              <Link
                className="inline-flex h-10 items-center justify-center rounded bg-primary px-4 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary-container"
                to="/"
              >
                Tìm chuyến bay
              </Link>
            </div>
          )}
        </div>

        <SummaryPanel bookingsCount={bookings.length} cancelledCount={cancelledCount} pendingCount={pendingCount} />
      </div>
    </div>
  );
}
