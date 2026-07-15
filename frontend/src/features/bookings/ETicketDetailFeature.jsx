import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, CreditCard, Luggage, Mail, Plane, Utensils, UserRound, XCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loading from "@/components/common/Loading";
import { bookingService } from "@/features/bookings/bookingService";
import { formatCurrency, formatDateTime, formatTime } from "@/features/flights/flightView";
import { getErrorMessage } from "@/lib/apiError";

const statusLabels = { confirmed: "Đặt chỗ đã xác nhận", paid: "Đã thanh toán", pending: "Chờ thanh toán", cancelled: "Đã hủy", refunded: "Đã hoàn tiền", refund_pending: "Chờ hoàn tiền" };

export default function ETicketDetailFeature({ bookingId }) {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState("");

  const loadBooking = async () => {
    setIsLoading(true);
    try {
      const response = await bookingService.getById(bookingId);
      setBooking(response.data);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Không thể tải thông tin đặt chỗ."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const handleCancel = async () => {
    if (!window.confirm("Bạn có chắc muốn hủy đặt chỗ này?")) {
      return;
    }

    setIsCancelling(true);
    try {
      const response = await bookingService.cancel(bookingId);
      setBooking(response.data);
      toast.success("Đã hủy đặt chỗ.");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Không thể hủy đặt chỗ."));
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return <Loading label="Đang tải vé điện tử" />;
  }

  if (error || !booking) {
    return <div className="mx-auto max-w-4xl px-container-padding py-section-gap"><ErrorMessage message={error} onRetry={loadBooking} /></div>;
  }

  const flight = booking.flight;
  const passenger = booking.passengers?.[0];
  const seat = booking.booking_seats?.find((item) => item.passenger_id === passenger?.id)?.seat ?? booking.booking_seats?.[0]?.seat;
  const payment = booking.payments?.[0];
  const canCancel = ["pending", "paid", "confirmed"].includes(booking.status);

  return (
    <div className="flex-grow bg-surface-container">
      <div className="mx-auto w-full max-w-7xl px-container-padding py-stack-lg">
        <header className="mb-stack-lg flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="mb-stack-sm flex items-center gap-2"><StatusIcon status={booking.status} /><span className="text-label-md uppercase tracking-wider text-on-surface-variant">{statusLabels[booking.status] ?? booking.status}</span></div><h1 className="text-headline-lg text-primary">Chi tiết đặt chỗ</h1><p className="mt-2 text-body-md text-on-surface-variant">Mã đặt chỗ: <span className="font-data-mono font-bold text-primary">{booking.id}</span></p></div><div className="flex flex-col gap-3 sm:flex-row">{booking.status === "pending" ? <Link className="inline-flex h-10 items-center justify-center rounded bg-status-warning px-4 text-label-md font-bold text-primary" to={`/payment/${booking.id}`}>Thanh toán</Link> : null}{canCancel ? <button className="inline-flex h-10 items-center justify-center rounded border border-status-error px-4 text-label-md text-status-error disabled:opacity-50" disabled={isCancelling} onClick={handleCancel} type="button">{isCancelling ? "Đang hủy..." : "Hủy đặt chỗ"}</button> : null}</div></header>
        <div className="grid grid-cols-1 gap-stack-lg lg:grid-cols-3"><section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm lg:col-span-2"><div className="flex flex-col gap-3 border-b border-outline-variant bg-surface-container-low p-stack-md sm:flex-row sm:items-center sm:justify-between"><div><p className="text-headline-md text-primary">{flight?.airline?.name ?? "Hãng bay"}</p><p className="text-body-sm text-on-surface-variant">Chuyến bay {flight?.flight_number}</p></div><p className="text-body-sm text-on-surface-variant">Khởi hành {formatDateTime(flight?.departure_time)}</p></div><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-stack-md p-container-padding text-center"><AirportPoint code={flight?.origin_airport?.code} city={flight?.origin_airport?.city} time={formatTime(flight?.departure_time)} /><div className="flex min-w-20 flex-col items-center"><span className="text-body-sm text-on-surface-variant">{flight?.flight_number}</span><div className="relative mt-2 w-full border-t border-dashed border-outline-variant"><Plane className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rotate-90 bg-surface-container-lowest text-primary" /></div></div><AirportPoint code={flight?.destination_airport?.code} city={flight?.destination_airport?.city} time={formatTime(flight?.arrival_time)} /></div><div className="grid grid-cols-1 gap-4 border-t border-outline-variant p-container-padding sm:grid-cols-3"><Info label="Hành khách" value={passenger ? `${passenger.last_name} ${passenger.first_name}` : "-"} /><Info label="Ghế" value={seat ? `${seat.seat_number} · ${seat.seat_class}` : "Chưa xếp ghế"} /><Info label="Liên hệ" value={booking.contact_email} /></div></section><aside className="rounded-xl border border-outline-variant bg-surface-container-lowest p-container-padding shadow-sm"><h2 className="text-title-lg text-primary">Tóm tắt thanh toán</h2><div className="mt-stack-md border-y border-outline-variant py-stack-md"><PriceLine label="Tổng booking" value={booking.total_price} /><PriceLine label="Trạng thái" value={payment?.status === "success" ? "Đã thanh toán" : payment?.status === "pending" ? "Đang chờ thanh toán" : "Chưa có giao dịch"} /></div><div className="mt-4 flex items-center gap-2 text-body-sm text-on-surface-variant"><CreditCard className="h-4 w-4" />{payment?.provider ?? "Chưa chọn phương thức"}</div></aside></div>
        <section className="mt-stack-lg grid grid-cols-1 gap-stack-lg md:grid-cols-2"><ServiceList booking={booking} /><section className="rounded-xl bg-primary p-container-padding text-on-primary"><h2 className="text-title-lg">Cần hỗ trợ?</h2><p className="mt-2 text-body-sm text-primary-fixed">Liên hệ bộ phận hỗ trợ nếu bạn cần thay đổi hoặc có câu hỏi về đặt chỗ.</p><Link className="mt-4 inline-flex h-10 items-center justify-center rounded bg-secondary-container px-4 text-label-md text-on-secondary-container" to="/support">Liên hệ hỗ trợ</Link></section></section>
      </div>
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === "cancelled") {
    return <XCircle className="h-5 w-5 text-status-error" />;
  }
  if (status === "pending") {
    return <CircleAlert className="h-5 w-5 text-status-warning" />;
  }
  return <CheckCircle2 className="h-5 w-5 text-status-success" />;
}

function AirportPoint({ code, city, time }) {
  return <div><p className="text-display-lg-mobile text-primary">{code ?? "-"}</p><p className="text-body-sm text-on-surface-variant">{city ?? ""}</p><p className="mt-2 text-headline-md text-on-surface">{time}</p></div>;
}

function Info({ label, value }) {
  return <div><p className="text-label-md uppercase text-on-surface-variant">{label}</p><p className="mt-1 truncate text-body-md text-on-surface">{value}</p></div>;
}

function PriceLine({ label, value }) {
  return <div className="mb-3 flex items-center justify-between gap-4 text-body-sm last:mb-0"><span className="text-on-surface-variant">{label}</span><span className="text-right font-data-mono text-on-surface">{typeof value === "number" || /^\d/.test(String(value ?? "")) ? formatCurrency(value) : value}</span></div>;
}

function ServiceList({ booking }) {
  const baggageCount = booking.booking_baggage?.length ?? 0;
  const mealCount = booking.booking_meals?.length ?? 0;
  return <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-container-padding shadow-sm"><h2 className="text-title-lg text-primary">Dịch vụ đã chọn</h2><div className="mt-stack-md grid gap-4 sm:grid-cols-3"><Service icon={UserRound} label="Hành khách" value={`${booking.passengers?.length ?? 0} người`} /><Service icon={Luggage} label="Hành lý ký gửi" value={baggageCount ? `${baggageCount} lựa chọn` : "Không chọn"} /><Service icon={Utensils} label="Suất ăn" value={mealCount ? `${mealCount} lựa chọn` : "Không chọn"} /></div><div className="mt-4 flex items-center gap-2 text-body-sm text-on-surface-variant"><Mail className="h-4 w-4" />Vé và thay đổi đặt chỗ sẽ được gửi tới {booking.contact_email}.</div></section>;
}

function Service({ icon: Icon, label, value }) {
  return <div className="flex items-center gap-3"><Icon className="h-5 w-5 text-primary" /><div><p className="text-body-sm text-on-surface-variant">{label}</p><p className="text-body-md text-on-surface">{value}</p></div></div>;
}
