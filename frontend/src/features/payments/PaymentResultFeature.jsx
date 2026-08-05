import { useEffect, useState } from "react";
import { CircleCheck, CircleX, Clock3, Home, Loader2, ReceiptText } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { paymentService } from "@/features/payments/paymentService";

const terminalStatuses = new Set(["success", "failed", "expired", "refund_pending", "refunded"]);

export default function PaymentResultFeature() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const transactionRef = searchParams.get("transactionRef");
  const returnResult = searchParams.get("result");
  const [status, setStatus] = useState(
    returnResult === "invalid" || returnResult === "not_found" ? "invalid" : "pending",
  );

  useEffect(() => {
    if (!bookingId || !transactionRef || status === "invalid") return undefined;

    let cancelled = false;
    let timerId;
    const verify = async () => {
      try {
        const response = await paymentService.verify({ bookingId, transactionRef });
        if (cancelled) return;
        const nextStatus = response.data?.status ?? "pending";
        setStatus(nextStatus);
        if (!terminalStatuses.has(nextStatus)) timerId = window.setTimeout(verify, 3000);
      } catch {
        if (!cancelled) timerId = window.setTimeout(verify, 5000);
      }
    };

    verify();
    return () => {
      cancelled = true;
      if (timerId) window.clearTimeout(timerId);
    };
  }, [bookingId, status, transactionRef]);

  const isSuccess = status === "success";
  const isFailure = ["failed", "expired", "invalid"].includes(status);
  const Icon = isSuccess ? CircleCheck : isFailure ? CircleX : Loader2;
  const title = isSuccess
    ? "Thanh toán thành công"
    : isFailure
      ? "Thanh toán chưa thành công"
      : "Đang xác nhận thanh toán";
  const message = isSuccess
    ? "VNPAY đã xác nhận giao dịch và đặt chỗ của bạn đã được cập nhật."
    : status === "invalid"
      ? "Thông tin trả về từ cổng thanh toán không hợp lệ. Trạng thái đặt chỗ không bị thay đổi."
      : isFailure
        ? "Giao dịch không thành công hoặc đã hết hạn. Bạn có thể quay lại đặt chỗ để thử lại."
        : "Backend đang chờ IPN xác nhận trực tiếp từ VNPAY. Vui lòng giữ trang này mở.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-container-padding text-on-surface">
      <section className="w-full max-w-xl rounded-xl border border-outline-variant bg-surface-container-lowest p-section-gap text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <Icon className={`h-9 w-9 ${status === "pending" ? "animate-spin" : ""}`} />
        </div>
        <h1 className="mt-stack-md text-headline-lg text-primary">{title}</h1>
        <p className="mt-3 text-body-md text-on-surface-variant">{message}</p>
        {status === "pending" ? (
          <div className="mt-stack-lg rounded-lg bg-surface-container-low p-4 text-left">
            <p className="flex items-center gap-2 text-body-md text-on-surface">
              <Clock3 className="h-5 w-5 text-primary" />
              Trang tự kiểm tra lại trạng thái mỗi 3 giây.
            </p>
          </div>
        ) : null}
        <div className="mt-stack-lg flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-label-md text-on-primary"
            to={bookingId ? `/bookings/${bookingId}` : "/my-bookings"}
          >
            <ReceiptText className="h-4 w-4" />
            Xem đặt chỗ
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-primary px-5 text-label-md text-primary"
            to="/"
          >
            <Home className="h-4 w-4" />
            Về trang chủ
          </Link>
        </div>
      </section>
    </main>
  );
}
