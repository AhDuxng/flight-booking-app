import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Banknote,
  CalendarDays,
  CircleHelp,
  Clock3,
  CreditCard,
  Landmark,
  Lock,
  PlaneTakeoff,
  QrCode,
  ShieldCheck,
  Timer,
  Wallet,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const paymentMethods = [
  {
    id: "card",
    title: "Thẻ Tín dụng / Ghi nợ",
    description: "Visa, Mastercard, JCB",
    icon: CreditCard,
    iconClassName: "text-primary",
  },
  {
    id: "vnpay",
    title: "VNPAY-QR",
    description: "Quét mã qua ứng dụng ngân hàng",
    icon: QrCode,
    iconClassName: "text-status-info",
  },
  {
    id: "momo",
    title: "Ví MoMo",
    description: "Thanh toán qua ví điện tử",
    icon: Wallet,
    iconClassName: "text-secondary",
  },
  {
    id: "bank",
    title: "Chuyển khoản ngân hàng",
    description: "Internet Banking",
    icon: Landmark,
    iconClassName: "text-slate-gray",
  },
];

const bookingSummary = {
  pnr: "VF-8X2K9",
  route: {
    origin: {
      code: "SGN",
      city: "Hồ Chí Minh",
    },
    destination: {
      code: "HAN",
      city: "Hà Nội",
    },
    duration: "2h 10m",
    date: "T2, 15 Thg 11, 2024",
    time: "08:30 - 10:40",
  },
  price: [
    { label: "Giá vé (1 Người lớn)", value: "3.200.000 VND" },
    { label: "Thuế & Phí sân bay", value: "850.000 VND" },
    { label: "Dịch vụ bổ sung (Hành lý)", value: "450.000 VND" },
  ],
  total: "4.500.000",
};

const steps = ["Tìm chuyến bay", "Hành khách", "Chỗ ngồi & Dịch vụ", "Thanh toán"];

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function MinimalHeader() {
  return (
    <header className="fixed top-0 z-50 w-full bg-surface shadow-sm">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-container-padding">
        <Link className="font-headline-md text-headline-md font-bold text-primary" to="/">
          VietFly
        </Link>
        <div className="flex items-center gap-4 text-on-surface-variant">
          <button className="rounded-full p-2 transition-colors hover:bg-surface-variant hover:text-primary">
            <BadgeCheck className="h-5 w-5" />
          </button>
          <Link className="h-8 w-8 overflow-hidden rounded-full border border-outline-variant bg-surface-variant" to="/profile">
            <img alt="User profile avatar" className="h-full w-full object-cover" src="/src/assets/images/avatar.jpg" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function CheckoutStepper() {
  return (
    <div className="mb-stack-lg flex w-full items-center justify-between font-body-sm text-body-sm md:justify-center md:gap-4">
      {steps.map((step, index) => {
        const isActive = index === steps.length - 1;
        const isLast = index === steps.length - 1;

        return (
          <div className="flex items-center gap-2" key={step}>
            <div className={isActive ? "flex items-center gap-2 font-bold text-primary" : "flex items-center gap-2 text-on-surface-variant"}>
              <span
                className={
                  isActive
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary"
                    : "flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-high text-xs font-bold"
                }
              >
                {index + 1}
              </span>
              <span className={isActive ? "" : "hidden md:inline"}>{step}</span>
            </div>
            {!isLast ? <div className={index === steps.length - 2 ? "h-px w-8 bg-primary md:w-16" : "h-px w-8 bg-outline-variant md:w-16"} /> : null}
          </div>
        );
      })}
    </div>
  );
}

function PaymentMethodCard({ method, isSelected, onSelect }) {
  const Icon = method.icon;

  return (
    <label className="relative cursor-pointer">
      <input checked={isSelected} className="sr-only" name="payment_method" type="radio" onChange={onSelect} />
      <div
        className={
          isSelected
            ? "flex min-w-0 items-center gap-4 rounded-lg border border-primary bg-sky-blue p-4 transition-colors"
            : "flex min-w-0 items-center gap-4 rounded-lg border border-surface-variant p-4 transition-colors hover:border-primary-fixed-dim"
        }
      >
        <div
          className={
            isSelected
              ? "flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 border-primary bg-primary"
              : "h-5 w-5 flex-none rounded-full border-2 border-outline-variant"
          }
        >
          {isSelected ? <span className="h-2 w-2 rounded-full bg-on-primary" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-label-md text-label-md font-bold text-on-surface">{method.title}</p>
          <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{method.description}</p>
        </div>
        <Icon className={`h-5 w-5 flex-none ${method.iconClassName}`} />
      </div>
    </label>
  );
}

function CardPaymentForm() {
  const inputClass =
    "w-full min-w-0 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-md text-body-md text-on-surface outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="mt-stack-md rounded-lg border border-surface-variant bg-surface-bright p-stack-md">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="min-w-0 md:col-span-2">
          <span className="mb-2 block font-label-md text-label-md text-on-surface">Số thẻ</span>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
            <input className={`${inputClass} pl-10 font-data-mono`} placeholder="0000 0000 0000 0000" type="text" />
          </div>
        </label>
        <label className="min-w-0">
          <span className="mb-2 block font-label-md text-label-md text-on-surface">Tên chủ thẻ</span>
          <input className={`${inputClass} uppercase`} placeholder="NGUYEN VAN A" type="text" />
        </label>
        <div className="grid min-w-0 grid-cols-2 gap-4">
          <label className="min-w-0">
            <span className="mb-2 block font-label-md text-label-md text-on-surface">Ngày hết hạn</span>
            <input className={`${inputClass} font-data-mono`} placeholder="MM/YY" type="text" />
          </label>
          <label className="min-w-0">
            <span className="mb-2 block font-label-md text-label-md text-on-surface">CVV</span>
            <div className="relative">
              <input className={`${inputClass} pr-10 font-data-mono`} maxLength={4} placeholder="123" type="password" />
              <CircleHelp className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

function PaymentMethods() {
  const [selectedMethod, setSelectedMethod] = useState("card");

  return (
    <section className="overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest shadow-[0_4px_12px_rgba(26,54,93,0.05)]">
      <div className="flex items-center justify-between border-b border-surface-variant bg-surface-bright px-stack-md py-4">
        <h2 className="font-title-lg text-title-lg text-primary">Phương thức thanh toán</h2>
        <Banknote className="h-5 w-5 text-outline" />
      </div>
      <div className="p-stack-md">
        <div className="mb-stack-md grid grid-cols-1 gap-4 md:grid-cols-2">
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              isSelected={selectedMethod === method.id}
              key={method.id}
              method={method}
              onSelect={() => setSelectedMethod(method.id)}
            />
          ))}
        </div>

        {selectedMethod === "card" ? <CardPaymentForm /> : null}

        <div className="mt-stack-md flex items-center justify-center gap-2 rounded-md border border-status-success/20 bg-status-success/5 p-3 text-status-success">
          <ShieldCheck className="h-5 w-5 flex-none" />
          <p className="font-body-sm text-body-sm font-medium">
            Thông tin của bạn được bảo mật tuyệt đối. Dữ liệu được mã hóa SSL 256-bit.
          </p>
        </div>
      </div>
    </section>
  );
}

function PnrPreview({ bookingId }) {
  const pnr = bookingId || bookingSummary.pnr;

  return (
    <section className="flex min-w-0 flex-col items-start justify-between gap-4 rounded-xl border border-surface-variant bg-surface-container-lowest p-stack-md shadow-[0_4px_12px_rgba(26,54,93,0.05)] md:flex-row md:items-center">
      <div className="min-w-0">
        <p className="mb-1 font-label-md text-label-md text-on-surface-variant">Mã đặt chỗ (PNR)</p>
        <p className="truncate font-data-mono text-xl font-bold text-primary">{pnr}</p>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-status-success/10 px-3 py-1.5 font-label-md text-xs font-bold uppercase text-status-success">
        <BadgeCheck className="h-[18px] w-[18px] flex-none" />
        Đang giữ chỗ
      </div>
    </section>
  );
}

function BookingSummaryCard({ onPay }) {
  return (
    <aside className="lg:sticky lg:top-24 lg:col-span-4">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest shadow-[0_10px_24px_rgba(26,54,93,0.1)]">
        <div className="bg-primary p-4 text-on-primary">
          <h3 className="mb-1 font-title-lg text-title-lg">Tóm tắt chuyến bay</h3>
          <p className="font-body-sm text-body-sm text-primary-fixed-dim">Một chiều • 1 Người lớn</p>
        </div>

        <div className="border-b border-surface-variant p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-center">
              <p className="text-[32px] font-bold leading-none text-primary">{bookingSummary.route.origin.code}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{bookingSummary.route.origin.city}</p>
            </div>
            <div className="relative flex flex-1 flex-col items-center px-4">
              <span className="mb-1 font-label-md text-xs text-on-surface-variant">{bookingSummary.route.duration}</span>
              <div className="relative h-px w-full border-t border-dashed border-outline-variant">
                <PlaneTakeoff className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 bg-surface-container-lowest px-1 text-primary" />
              </div>
              <span className="mt-1 text-xs font-medium text-primary">Bay thẳng</span>
            </div>
            <div className="text-center">
              <p className="text-[32px] font-bold leading-none text-primary">{bookingSummary.route.destination.code}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{bookingSummary.route.destination.city}</p>
            </div>
          </div>
          <div className="mb-2 flex items-center gap-2 font-body-sm text-body-sm text-on-surface">
            <CalendarDays className="h-[18px] w-[18px] text-outline" />
            <span>{bookingSummary.route.date}</span>
          </div>
          <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface">
            <Clock3 className="h-[18px] w-[18px] text-outline" />
            <span>{bookingSummary.route.time}</span>
          </div>
        </div>

        <div className="flex-1 bg-surface-bright p-4">
          <div className="mb-4 space-y-3 border-b border-surface-variant pb-4">
            {bookingSummary.price.map((item) => (
              <div className="flex justify-between gap-4 font-body-sm text-body-sm" key={item.label}>
                <span className="text-on-surface-variant">{item.label}</span>
                <span className="text-right font-data-mono font-medium text-on-surface">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant">Tổng cộng</p>
              <p className="text-[10px] text-outline">Đã bao gồm VAT</p>
            </div>
            <p className="text-right font-data-mono text-headline-md font-bold text-primary">
              {bookingSummary.total} <span className="font-body-md text-body-md font-normal">VND</span>
            </p>
          </div>
        </div>

        <div className="border-t border-surface-variant bg-surface-container-lowest p-4">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F6AD55] px-6 py-3 font-title-lg text-title-lg text-deep-navy shadow-sm transition-colors hover:bg-[#ED8936]"
            onClick={onPay}
          >
            <Lock className="h-5 w-5" />
            Thanh toán ngay
          </button>
          <p className="mt-3 text-center text-xs text-on-surface-variant">
            Bằng việc nhấp vào "Thanh toán ngay", bạn đồng ý với{" "}
            <Link className="text-status-info hover:underline" to="/support">
              Điều khoản & Điều kiện
            </Link>{" "}
            của chúng tôi.
          </p>
        </div>
      </div>
    </aside>
  );
}

function MinimalFooter() {
  return (
    <footer className="mt-section-gap w-full border-t border-outline-variant bg-primary text-on-primary">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-stack-lg px-container-padding py-stack-lg md:grid-cols-4">
        <div>
          <span className="font-headline-md text-headline-md font-black text-on-primary">VietFly</span>
          <p className="mt-2 font-body-sm text-body-sm text-on-primary-container">© 2024 VietFly Aviation. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap gap-6 font-label-md text-label-md md:col-span-3 md:justify-end">
          <Link className="text-on-primary-container transition-colors hover:text-secondary-fixed-dim" to="/support">
            Privacy Policy
          </Link>
          <Link className="text-on-primary-container transition-colors hover:text-secondary-fixed-dim" to="/support">
            Contact Us
          </Link>
          <Link className="text-on-primary-container transition-colors hover:text-secondary-fixed-dim" to="/support">
            FAQ
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function PaymentCheckoutFeature({ bookingId }) {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(9 * 60 + 55);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 0) {
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  const timerText = useMemo(() => formatTime(secondsLeft), [secondsLeft]);

  const handlePay = () => {
    navigate("/payment/result");
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
      <MinimalHeader />
      <main className="px-container-padding pb-section-gap pt-[88px]">
        <div className="mx-auto max-w-7xl">
          <CheckoutStepper />

          <div className="mb-stack-lg flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="mb-2 font-headline-lg text-headline-lg text-primary">Thanh toán an toàn</h1>
              <p className="text-on-surface-variant">Vui lòng chọn phương thức thanh toán để hoàn tất đặt chỗ.</p>
            </div>
            <div
              className={
                secondsLeft > 0
                  ? "flex items-center gap-2 rounded-lg bg-error-container px-4 py-2 text-on-error-container shadow-sm"
                  : "flex items-center gap-2 rounded-lg bg-surface-variant px-4 py-2 text-on-surface-variant shadow-sm"
              }
            >
              <Timer className="h-5 w-5 flex-none" />
              <span className="font-label-md text-label-md font-bold">
                {secondsLeft > 0 ? `Vui lòng hoàn tất thanh toán trong ${timerText}` : "Phiên giữ chỗ đã hết hạn"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-stack-lg lg:grid-cols-12">
            <div className="flex min-w-0 flex-col gap-stack-lg lg:col-span-8">
              <PnrPreview bookingId={bookingId} />
              <PaymentMethods />
            </div>
            <BookingSummaryCard onPay={handlePay} />
          </div>
        </div>
      </main>
      <MinimalFooter />
    </div>
  );
}
