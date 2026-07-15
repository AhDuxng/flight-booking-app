import { CircleCheck, Clock3, Home, ReceiptText } from "lucide-react";
import { Link } from "react-router-dom";

export default function PaymentResultFeature() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-container-padding text-on-surface">
      <section className="w-full max-w-xl rounded-xl border border-outline-variant bg-surface-container-lowest p-section-gap text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-primary"><CircleCheck className="h-9 w-9" /></div>
        <h1 className="mt-stack-md text-headline-lg text-primary">Kiểm tra trạng thái thanh toán</h1>
        <p className="mt-3 text-body-md text-on-surface-variant">Trạng thái thanh toán chỉ được xác nhận sau khi backend nhận webhook từ cổng thanh toán. Vui lòng xem booking của bạn để biết kết quả mới nhất.</p>
        <div className="mt-stack-lg rounded-lg bg-surface-container-low p-4 text-left"><p className="flex items-center gap-2 text-body-md text-on-surface"><Clock3 className="h-5 w-5 text-primary" />Nếu giao dịch đang chờ, trang thanh toán sẽ tự làm mới trạng thái.</p></div>
        <div className="mt-stack-lg flex flex-col justify-center gap-3 sm:flex-row"><Link className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-label-md text-on-primary" to="/my-bookings"><ReceiptText className="h-4 w-4" />Xem đặt chỗ</Link><Link className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-primary px-5 text-label-md text-primary" to="/"><Home className="h-4 w-4" />Về trang chủ</Link></div>
      </section>
    </main>
  );
}
