import { CheckCircle2, CreditCard, Download, Home, PlaneTakeoff, QrCode, ReceiptText } from "lucide-react";
import { Link } from "react-router-dom";

const paymentResult = {
  bookingReference: "VF89XK",
  amount: "4.500.000",
  currency: "VND",
  method: "Visa •••• 4242",
  paidAt: "24 Oct 2024, 14:32",
  transactionId: "TXN-99827361A",
  flight: {
    code: "VN204",
    date: "15 Nov 2024",
    departure: {
      airport: "SGN",
      time: "08:00",
      city: "TP. Hồ Chí Minh",
      terminal: "Tân Sơn Nhất",
    },
    arrival: {
      airport: "HAN",
      time: "10:10",
      city: "Hà Nội",
      terminal: "Nội Bài",
    },
  },
};

function DetailRow({ label, children, hasBorder = true }) {
  return (
    <div className={`flex items-center justify-between gap-stack-md py-2 ${hasBorder ? "border-b border-surface-container-highest/50" : ""}`}>
      <span className="font-body-sm text-body-sm text-on-surface-variant">{label}</span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  );
}

function TransactionDetails() {
  return (
    <section className="flex min-w-0 flex-col gap-stack-sm">
      <h2 className="mb-base flex items-center gap-2 font-title-lg text-title-lg text-on-surface">
        <ReceiptText className="h-5 w-5 text-outline" />
        Chi tiết giao dịch
      </h2>
      <DetailRow label="Số tiền đã thanh toán">
        <span className="font-headline-md text-headline-md font-semibold text-primary">{paymentResult.amount}</span>
        <span className="ml-1 font-label-md text-label-md text-primary/70">{paymentResult.currency}</span>
      </DetailRow>
      <DetailRow label="Phương thức">
        <span className="inline-flex min-w-0 items-center gap-2 font-data-mono text-data-mono font-medium text-on-surface">
          <CreditCard className="h-4 w-4 flex-none" />
          <span className="truncate">{paymentResult.method}</span>
        </span>
      </DetailRow>
      <DetailRow label="Thời gian">
        <span className="font-data-mono text-data-mono font-medium text-on-surface">{paymentResult.paidAt}</span>
      </DetailRow>
      <DetailRow hasBorder={false} label="Mã giao dịch">
        <span className="font-data-mono text-data-mono font-medium text-outline">{paymentResult.transactionId}</span>
      </DetailRow>
    </section>
  );
}

function FlightPoint({ point, type }) {
  const isDeparture = type === "departure";

  return (
    <div className="relative z-10 flex items-start gap-stack-sm">
      <div
        className={
          isDeparture
            ? "mt-1 h-3 w-3 flex-none rounded-full bg-primary ring-4 ring-surface-container-low"
            : "mt-1 h-3 w-3 flex-none rounded-full border-2 border-primary bg-surface ring-4 ring-surface-container-low"
        }
      />
      <div className="min-w-0">
        <div className="font-data-mono text-data-mono font-bold text-on-surface">
          {point.airport} <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">{point.time}</span>
        </div>
        <div className="font-body-sm text-body-sm text-on-surface-variant">
          {point.city} ({point.terminal})
        </div>
      </div>
    </div>
  );
}

function FlightSummary() {
  return (
    <section className="mt-stack-md flex min-w-0 flex-col gap-stack-sm md:mt-0 md:border-l md:border-surface-container-highest md:pl-stack-lg">
      <h2 className="mb-base flex items-center gap-2 font-title-lg text-title-lg text-on-surface">
        <PlaneTakeoff className="h-5 w-5 text-outline" />
        Tóm tắt chuyến bay
      </h2>
      <div className="relative rounded-lg border border-outline-variant/30 bg-surface-container-low p-stack-md">
        <div className="absolute bottom-10 left-[23px] top-10 w-px border-l border-dashed border-outline-variant" />
        <div className="mb-stack-md">
          <FlightPoint point={paymentResult.flight.departure} type="departure" />
        </div>
        <FlightPoint point={paymentResult.flight.arrival} type="arrival" />
        <div className="mt-stack-md flex items-center justify-between gap-stack-md border-t border-outline-variant/30 pt-stack-sm">
          <span className="font-label-md text-label-md uppercase text-on-surface-variant">{paymentResult.flight.date}</span>
          <span className="font-data-mono text-data-mono font-semibold text-primary">{paymentResult.flight.code}</span>
        </div>
      </div>
    </section>
  );
}

function ActionLinks() {
  return (
    <div className="mt-section-gap flex w-full flex-col justify-center gap-gutter-md border-t border-surface-container-highest pt-stack-lg sm:flex-row">
      <Link
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container sm:w-auto"
        to={`/bookings/${paymentResult.bookingReference}`}
      >
        <QrCode className="h-5 w-5" />
        Xem vé điện tử
      </Link>
      <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-surface px-6 py-3 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low sm:w-auto">
        <Download className="h-5 w-5" />
        Tải hóa đơn
      </button>
      <Link
        className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary sm:w-auto"
        to="/"
      >
        <Home className="h-5 w-5" />
        Về trang chủ
      </Link>
    </div>
  );
}

export default function PaymentResultFeature() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-container-padding text-on-surface antialiased">
      <div className="w-full max-w-3xl">
        <div className="mb-stack-lg text-center">
          <span className="font-headline-md text-headline-md font-bold text-primary">VietFly</span>
        </div>

        <section className="relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-[0_4px_12px_rgba(26,54,93,0.05)]">
          <div className="absolute left-0 top-0 h-2 w-full bg-status-success" />
          <div className="flex flex-col items-center p-stack-lg md:p-section-gap">
            <div className="mb-stack-md flex h-24 w-24 items-center justify-center rounded-full bg-status-success/10">
              <CheckCircle2 className="h-16 w-16 fill-status-success text-status-success" />
            </div>

            <h1 className="mb-base text-center font-headline-lg text-headline-lg text-on-surface">Thanh toán thành công!</h1>
            <p className="mb-stack-lg max-w-md text-center font-body-md text-body-md text-on-surface-variant">
              Đặt chỗ của bạn đã được xác nhận và vé điện tử đã sẵn sàng. Một bản sao đã được gửi đến email của bạn.
            </p>

            <div className="mb-section-gap flex w-full max-w-md flex-col items-center rounded-lg border border-outline-variant/50 bg-surface px-section-gap py-stack-md">
              <span className="mb-base font-label-md text-label-md uppercase text-on-surface-variant">Mã đặt chỗ (PNR)</span>
              <span className="font-data-mono text-[32px] font-bold leading-[1.2] text-primary md:text-[40px]">
                {paymentResult.bookingReference}
              </span>
            </div>

            <div className="grid w-full grid-cols-1 gap-stack-lg border-t border-surface-container-highest pt-stack-lg md:grid-cols-2">
              <TransactionDetails />
              <FlightSummary />
            </div>

            <ActionLinks />
          </div>
        </section>
      </div>
    </main>
  );
}
