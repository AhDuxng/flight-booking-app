import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, CircleAlert, CreditCard, Landmark, Loader2, QrCode, ShieldCheck, Wallet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loading from "@/components/common/Loading";
import { bookingService } from "@/features/bookings/bookingService";
import { formatCurrency, formatDateTime, formatTime } from "@/features/flights/flightView";
import { paymentService } from "@/features/payments/paymentService";
import { getErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";

const paymentMethods = [
  { id: "vnpay", title: "VNPAY", description: "Thanh toán qua ứng dụng ngân hàng", icon: QrCode },
  { id: "momo", title: "Ví MoMo", description: "Thanh toán qua ví điện tử", icon: Wallet },
  { id: "stripe", title: "Thẻ quốc tế", description: "Được xử lý bởi cổng thanh toán", icon: CreditCard },
  { id: "cash", title: "Thanh toán tiền mặt", description: "Theo chính sách hãng bay", icon: Landmark },
];

export default function PaymentCheckoutFeature({ bookingId }) {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("vnpay");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  const loadPaymentData = useCallback(async () => {
    try {
      const [bookingResponse, paymentsResponse] = await Promise.all([
        bookingService.getById(bookingId),
        paymentService.getByBooking(bookingId),
      ]);
      setBooking(bookingResponse.data);
      const payments = paymentsResponse.data ?? [];
      setPayment(payments.find((item) => item.status === "pending") ?? payments[0] ?? null);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Không thể tải thông tin thanh toán."));
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  useEffect(() => {
    if (payment?.status !== "pending") {
      return undefined;
    }

    const intervalId = window.setInterval(loadPaymentData, 10000);
    return () => window.clearInterval(intervalId);
  }, [loadPaymentData, payment?.status]);

  useEffect(() => {
    if (payment?.status === "success") {
      navigate(`/bookings/${bookingId}`, { replace: true });
    }
  }, [bookingId, navigate, payment?.status]);

  useEffect(() => {
    if (booking?.status !== "pending" || !booking.hold_expires_at) {
      return undefined;
    }

    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [booking?.hold_expires_at, booking?.status]);

  const handleCreateIntent = async () => {
    setIsSubmitting(true);

    try {
      const response = await paymentService.createIntent({ bookingId, provider: selectedMethod });
      setPayment(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Không thể tạo yêu cầu thanh toán."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading label="Đang tải thanh toán" />;
  }

  if (error || !booking) {
    return <div className="mx-auto max-w-4xl px-container-padding py-section-gap"><ErrorMessage message={error} onRetry={loadPaymentData} /></div>;
  }

  const flight = booking.flight;
  const isPaymentFailed = payment?.status === "failed";
  const holdSeconds = booking.hold_expires_at ? Math.max(0, Math.ceil((new Date(booking.hold_expires_at).getTime() - now) / 1000)) : 0;
  const holdTime = `${String(Math.floor(holdSeconds / 60)).padStart(2, "0")}:${String(holdSeconds % 60).padStart(2, "0")}`;
  const holdExpired = booking.status === "pending" && holdSeconds === 0;

  return (
    <main className="min-h-screen bg-background px-container-padding py-section-gap text-on-background">
      <div className="mx-auto max-w-6xl">
        <header className="mb-stack-lg flex flex-col justify-between gap-4 border-b border-outline-variant pb-stack-md sm:flex-row sm:items-center"><Link className="font-headline-md text-headline-md font-bold text-primary" to="/">VietFly</Link><Link className="text-label-md text-primary hover:underline" to={`/bookings/${bookingId}`}>Xem thông tin đặt chỗ</Link></header>
        <div className="mb-stack-lg"><h1 className="text-headline-lg font-headline-lg text-primary">Thanh toán an toàn</h1><p className="mt-2 text-body-md text-on-surface-variant">Tạo yêu cầu thanh toán cho mã đặt chỗ <span className="font-data-mono text-on-surface">{bookingId}</span>.</p></div>
        {error ? <div className="mb-stack-lg"><ErrorMessage message={error} onRetry={loadPaymentData} /></div> : null}
        <div className="grid grid-cols-1 items-start gap-stack-lg lg:grid-cols-12">
          <section className="rounded-xl border border-surface-variant bg-surface-container-lowest p-stack-lg shadow-sm lg:col-span-7"><h2 className="text-title-lg font-title-lg text-primary">Phương thức thanh toán</h2>{booking.status === "pending" ? <p className={cn("mt-3 rounded-lg p-3 text-body-sm font-semibold", holdExpired ? "bg-status-error/10 text-status-error" : "bg-status-warning/10 text-status-warning")}>{holdExpired ? "Đã hết thời gian giữ ghế. Vui lòng tạo booking mới." : `Ghế được giữ thêm ${holdTime}.`}</p> : null}<div className="mt-stack-md grid gap-3 sm:grid-cols-2">{paymentMethods.map((method) => <button className={cn("flex items-center gap-3 rounded-lg border p-4 text-left transition-colors", selectedMethod === method.id ? "border-primary bg-primary-fixed" : "border-outline-variant hover:border-primary")} disabled={Boolean(payment) || holdExpired} key={method.id} onClick={() => setSelectedMethod(method.id)} type="button"><method.icon className="h-5 w-5 text-primary" /><span><span className="block text-label-md font-label-md text-on-surface">{method.title}</span><span className="block text-body-sm text-on-surface-variant">{method.description}</span></span></button>)}</div><div className="mt-stack-md flex items-start gap-2 rounded-lg bg-primary-fixed p-3 text-body-sm text-on-primary-fixed"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Số tiền và trạng thái thanh toán được xác nhận ở máy chủ. Website không lưu dữ liệu thẻ.</div>{payment ? <PaymentStatus payment={payment} onRefresh={loadPaymentData} /> : <button className="mt-stack-lg inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-status-warning px-5 text-label-md font-label-md font-bold text-primary disabled:opacity-50" disabled={isSubmitting || booking.status !== "pending" || holdExpired} onClick={handleCreateIntent} type="button">{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}{isSubmitting ? "Đang tạo yêu cầu" : "Tạo yêu cầu thanh toán"}</button>}{isPaymentFailed ? <div className="mt-4 flex items-center gap-2 text-status-error"><CircleAlert className="h-4 w-4" />Thanh toán chưa thành công. Liên hệ hỗ trợ hoặc tạo booking mới.</div> : null}</section>
          <BookingSummary booking={booking} flight={flight} />
        </div>
      </div>
    </main>
  );
}

function PaymentStatus({ payment, onRefresh }) {
  return <div className="mt-stack-lg rounded-lg border border-outline-variant bg-surface p-stack-md"><div className="flex items-start justify-between gap-4"><div><p className="text-label-md text-on-surface-variant">Mã giao dịch</p><p className="mt-1 break-all font-data-mono text-body-md text-on-surface">{payment.transaction_ref}</p></div><span className={cn("rounded-full px-3 py-1 text-label-md", payment.status === "success" ? "bg-status-success/10 text-status-success" : payment.status === "failed" ? "bg-status-error/10 text-status-error" : "bg-status-warning/10 text-status-warning")}>{payment.status === "pending" ? "Đang chờ thanh toán" : payment.status === "success" ? "Đã thanh toán" : "Không thành công"}</span></div><p className="mt-3 text-body-sm text-on-surface-variant">Hãy hoàn tất ở cổng thanh toán của nhà cung cấp. Trạng thái sẽ tự cập nhật.</p><button className="mt-3 text-label-md text-primary hover:underline" onClick={onRefresh} type="button">Kiểm tra lại trạng thái</button></div>;
}

function BookingSummary({ booking, flight }) {
  return <aside className="rounded-xl border border-surface-variant bg-surface-container-lowest p-stack-lg shadow-sm lg:col-span-5 lg:sticky lg:top-8"><h2 className="text-title-lg font-title-lg text-primary">Tóm tắt chuyến bay</h2><div className="mt-stack-md border-y border-outline-variant py-stack-md"><div className="flex items-center justify-between"><div className="text-center"><p className="text-headline-lg text-on-surface">{flight?.origin_airport?.code}</p><p className="text-body-sm text-on-surface-variant">{formatTime(flight?.departure_time)}</p></div><div className="px-4 text-center text-body-sm text-on-surface-variant">{flight?.flight_number}<br />{formatDateTime(flight?.departure_time)}</div><div className="text-center"><p className="text-headline-lg text-on-surface">{flight?.destination_airport?.code}</p><p className="text-body-sm text-on-surface-variant">{formatTime(flight?.arrival_time)}</p></div></div></div><div className="mt-stack-md flex items-end justify-between"><span className="text-title-lg text-primary">Tổng thanh toán</span><span className="text-headline-md font-headline-md text-primary">{formatCurrency(booking.total_price)}</span></div><div className="mt-4 flex items-center gap-2 text-body-sm text-on-surface-variant"><BadgeCheck className="h-4 w-4" />Trạng thái booking: {booking.status}</div></aside>;
}
