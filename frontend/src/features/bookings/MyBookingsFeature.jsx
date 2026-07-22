import { useEffect, useMemo, useState } from "react";
import { ChevronDown, CreditCard, Plane, ReceiptText, Search, User, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loading from "@/components/common/Loading";
import { bookingService } from "@/features/bookings/bookingService";
import { formatCurrency, formatDateTime, formatTime } from "@/features/flights/flightView";
import { getErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "pending", label: "Chờ thanh toán" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "refund_pending", label: "Chờ hoàn tiền" },
  { value: "refunded", label: "Đã hoàn tiền" },
];

const statusLabels = { confirmed: "Đã xác nhận", paid: "Đã thanh toán", pending: "Chờ thanh toán", cancelled: "Đã hủy", refunded: "Đã hoàn tiền", refund_pending: "Chờ hoàn tiền" };
const statusStyles = { confirmed: "bg-status-success/10 text-status-success border-status-success/20", paid: "bg-status-success/10 text-status-success border-status-success/20", pending: "bg-status-warning/10 text-[#B45309] border-status-warning/30", cancelled: "bg-status-error/10 text-status-error border-status-error/20", refunded: "bg-surface-variant text-on-surface-variant border-outline-variant", refund_pending: "bg-status-warning/10 text-[#B45309] border-status-warning/30" };

export default function MyBookingsFeature() {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const response = await bookingService.getMine({ limit: 100 });
      setBookings(response.data ?? []);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Không thể tải danh sách đặt chỗ."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (statusFilter !== "all" && booking.status !== statusFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [booking.id, booking.flight?.flight_number, booking.flight?.origin_airport?.code, booking.flight?.destination_airport?.code]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [bookings, searchTerm, statusFilter]);

  if (isLoading) {
    return <Loading label="Đang tải đơn hàng" />;
  }

  if (error) {
    return <div className="mx-auto max-w-4xl px-container-padding py-section-gap"><ErrorMessage message={error} onRetry={loadBookings} /></div>;
  }

  return (
    <div className="flex-grow bg-surface-container">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-stack-lg px-container-padding py-stack-lg lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-stack-md lg:col-span-9">
          <section className="rounded-lg border border-surface-container-highest bg-surface-container-lowest p-stack-md flight-card-shadow">
            <div className="flex flex-col gap-stack-md md:flex-row md:items-end md:justify-between"><div><h1 className="mb-stack-sm font-headline-lg text-headline-lg text-primary">Đơn hàng của tôi</h1><p className="font-body-md text-body-md text-on-surface-variant">Theo dõi trạng thái đặt chỗ và thanh toán cho các chuyến bay của bạn.</p></div><SelectField label="Trạng thái" options={statusOptions} value={statusFilter} onChange={setStatusFilter} /></div>
          </section>
          <label className="relative block"><span className="sr-only">Tìm kiếm đơn hàng</span><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" /><input className="h-12 w-full rounded-lg border border-surface-container-highest bg-surface-container-lowest pl-12 pr-4 font-body-md text-body-md text-on-surface outline-none transition focus:ring-2 focus:ring-primary/20" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm theo mã đặt chỗ hoặc chuyến bay" value={searchTerm} /></label>
          {filteredBookings.length > 0 ? <div className="flex flex-col gap-stack-md">{filteredBookings.map((booking) => <BookingCard booking={booking} key={booking.id} />)}</div> : <EmptyBookings />}
        </div>
        <SummaryPanel bookings={bookings} />
      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return <label className="relative block w-full sm:w-auto"><span className="sr-only">{label}</span><select className="h-10 w-full min-w-[180px] appearance-none rounded border border-outline-variant bg-surface-container-lowest px-4 pr-10 text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20" onChange={(event) => onChange(event.target.value)} value={value}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></label>;
}

function BookingCard({ booking }) {
  const flight = booking.flight;
  const isPending = booking.status === "pending";
  const isCancelled = booking.status === "cancelled";
  const actionTarget = isPending ? `/payment/${booking.id}` : `/bookings/${booking.id}`;
  const actionLabel = isPending ? "Thanh toán" : "Xem chi tiết";

  return <article className={cn("overflow-hidden rounded-lg border border-surface-container-highest bg-surface-container-lowest p-stack-md flight-card-shadow", isCancelled && "opacity-75")}><div className="flex flex-col gap-stack-md md:flex-row md:items-center md:justify-between"><div className="flex flex-1 flex-col gap-stack-md md:flex-row md:items-center"><div className="md:w-44"><span className="block text-body-sm text-on-surface-variant">{formatDateTime(flight?.departure_time)}</span><span className="mt-1 inline-flex rounded bg-primary/5 px-2 py-1 font-data-mono text-data-mono text-primary">{booking.id}</span></div><div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(50px,1fr)_auto] items-center gap-stack-sm"><div className="text-center"><p className="text-title-lg text-primary">{flight?.origin_airport?.code ?? "-"}</p><p className="text-body-sm text-on-surface-variant">{formatTime(flight?.departure_time)}</p></div><div className="relative"><div className="border-t border-dashed border-outline-variant" /><Plane className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rotate-90 bg-surface-container-lowest text-outline" /></div><div className="text-center"><p className="text-title-lg text-primary">{flight?.destination_airport?.code ?? "-"}</p><p className="text-body-sm text-on-surface-variant">{formatTime(flight?.arrival_time)}</p></div></div><div className="flex gap-4 text-body-sm md:w-48 md:flex-col md:gap-1"><span className="flex items-center gap-1 text-on-surface"><User className="h-4 w-4" />{booking.passengers?.length ?? 0} hành khách</span><span className="font-semibold text-primary">{formatCurrency(booking.total_price)}</span></div></div><div className="flex items-center gap-3 md:w-40 md:flex-col"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-label-md", statusStyles[booking.status] ?? statusStyles.pending)}>{statusLabels[booking.status] ?? booking.status}</span><Link className={cn("w-full rounded px-4 py-2 text-center text-label-md transition-colors", isPending ? "bg-status-warning font-bold text-primary hover:bg-secondary-container" : "bg-primary text-on-primary hover:bg-primary-container")} to={actionTarget}>{actionLabel}</Link></div></div></article>;
}

function EmptyBookings() {
  return <div className="rounded-lg border border-surface-container-highest bg-surface-container-lowest p-stack-lg text-center flight-card-shadow"><ReceiptText className="mx-auto mb-4 h-10 w-10 text-outline" /><h2 className="mb-2 text-title-lg text-primary">Chưa có đơn hàng phù hợp</h2><p className="mb-5 text-body-md text-on-surface-variant">Tìm chuyến bay mới để bắt đầu hành trình tiếp theo.</p><Link className="inline-flex h-10 items-center justify-center rounded bg-primary px-4 text-label-md text-on-primary" to="/">Tìm chuyến bay</Link></div>;
}

function SummaryPanel({ bookings }) {
  const pendingCount = bookings.filter((booking) => booking.status === "pending").length;
  const cancelledCount = bookings.filter((booking) => booking.status === "cancelled").length;
  return <aside className="flex flex-col gap-stack-md lg:col-span-3"><section className="rounded-lg border border-surface-container-highest bg-surface-container-lowest p-stack-md flight-card-shadow"><h2 className="mb-stack-md text-title-lg text-on-surface">Tổng quan</h2><SummaryRow icon={ReceiptText} label="Tổng đơn" value={bookings.length} /><SummaryRow icon={CreditCard} label="Chờ thanh toán" value={pendingCount} /><SummaryRow icon={XCircle} label="Đã hủy" value={cancelledCount} /></section></aside>;
}

function SummaryRow({ icon: Icon, label, value }) {
  return <div className="mb-2 flex items-center justify-between rounded bg-surface-container-low px-3 py-2 last:mb-0"><span className="flex items-center gap-2 text-body-sm text-on-surface-variant"><Icon className="h-4 w-4" />{label}</span><span className="font-semibold text-primary">{value}</span></div>;
}
