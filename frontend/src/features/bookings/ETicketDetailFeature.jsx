import {
  Backpack,
  CheckCircle2,
  CreditCard,
  Download,
  Luggage,
  Mail,
  Phone,
  Plane,
  Utensils,
} from "lucide-react";

const ticket = {
  bookingReference: "VF-8X2M9P",
  airline: "VietFly Airlines",
  flightNumber: "VF204",
  aircraft: "Airbus A321neo",
  date: "24 Oct, 2024",
  duration: "2h 15m",
  routeType: "Bay thẳng",
  departure: {
    code: "HAN",
    city: "Hà Nội",
    airport: "Nội Bài",
    terminal: "Nhà ga T1",
    time: "08:30",
  },
  arrival: {
    code: "SGN",
    city: "TP. Hồ Chí Minh",
    airport: "Tân Sơn Nhất",
    terminal: "Nhà ga T1",
    time: "10:45",
  },
  passenger: {
    name: "NGUYEN VAN A",
    ticketNumber: "984 1234567890",
    seat: "12A",
    cabin: "Phổ thông (Y)",
  },
  services: [
    { title: "Hành lý ký gửi", value: "1 kiện 20kg", icon: Luggage },
    { title: "Hành lý xách tay", value: "1 kiện 7kg", icon: Backpack },
    { title: "Suất ăn trên chuyến bay", value: "Bữa nóng tiêu chuẩn", icon: Utensils },
  ],
  payment: {
    fare: "1.850.000 VND",
    taxes: "450.000 VND",
    seat: "50.000 VND",
    total: "2.350.000",
    method: "Đã thanh toán qua VNPay",
    time: "15 Oct, 2024 - 14:32",
  },
};

const qrCells = [
  0, 1, 2, 3, 5, 6, 7, 9, 12, 13, 15, 16, 18, 19, 20, 24, 27, 30, 31, 33, 35, 36, 39, 40, 43, 45, 48, 50, 51,
  52, 54, 56, 57, 60, 63, 64, 66, 69, 70, 72, 74, 75, 78, 81, 84, 86, 87, 88, 90, 93, 96, 97, 99, 100, 102,
  105, 108, 110, 111, 114, 116, 117, 120, 123, 124, 126, 127, 129, 132, 135, 138, 139, 141, 144,
];

function ActionButton({ children, icon: Icon, variant = "primary" }) {
  const className =
    variant === "outline"
      ? "border border-primary text-primary hover:bg-primary-fixed"
      : "bg-primary text-on-primary shadow-sm hover:bg-primary-container";

  return (
    <button
      className={`${className} inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 font-label-md text-label-md transition-colors sm:w-auto`}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </button>
  );
}

function TicketCutout() {
  return (
    <div className="relative h-8 w-full">
      <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-outline-variant" />
      <div className="absolute left-0 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-container shadow-[inset_-1px_0_2px_rgba(0,0,0,0.05)]" />
      <div className="absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2 translate-x-1/2 rounded-full bg-surface-container shadow-[inset_1px_0_2px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function BoardingCode() {
  return (
    <div className="grid h-32 w-32 grid-cols-12 grid-rows-12 gap-0.5 rounded bg-surface-container-lowest p-2">
      {Array.from({ length: 144 }).map((_, index) => (
        <span
          className={qrCells.includes(index) ? "rounded-[1px] bg-deep-navy" : "rounded-[1px] bg-transparent"}
          key={index}
        />
      ))}
    </div>
  );
}

function AirportBlock({ align = "left", airport }) {
  return (
    <div className={align === "right" ? "min-w-0 text-right" : "min-w-0 text-left"}>
      <h2 className="text-[36px] font-bold leading-[1.1] text-primary">{airport.code}</h2>
      <p className="truncate font-body-md text-body-md font-medium text-on-surface">{airport.city}</p>
      <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
        {airport.airport} ({airport.terminal})
      </p>
      <p className="mt-2 font-headline-md text-headline-md text-primary">{airport.time}</p>
    </div>
  );
}

function FlightTimeline() {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center px-2 sm:px-4">
      <p className="mb-1 font-label-md text-label-md text-on-surface-variant">{ticket.duration}</p>
      <div className="flex w-full min-w-0 items-center">
        <div className="z-10 h-2 w-2 flex-none rounded-full border-2 border-primary bg-surface-container-lowest" />
        <div className="-mx-1 min-w-0 flex-1 border-t-2 border-dashed border-outline-variant" />
        <Plane className="mx-2 h-5 w-5 flex-none rotate-90 text-primary" />
        <div className="-mx-1 min-w-0 flex-1 border-t-2 border-dashed border-outline-variant" />
        <div className="z-10 h-2 w-2 flex-none rounded-full border-2 border-primary bg-surface-container-lowest" />
      </div>
      <p className="mt-1 font-label-md text-label-md text-status-info">{ticket.routeType}</p>
    </div>
  );
}

function TicketCard() {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-[0_4px_12px_rgba(26,54,93,0.05)]">
      <div className="flex min-w-0 flex-col gap-stack-md border-b border-outline-variant bg-surface-container-low p-container-padding sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded bg-primary font-bold text-on-primary">VF</div>
          <div className="min-w-0">
            <p className="truncate font-headline-md text-headline-md text-primary">{ticket.airline}</p>
            <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
              Chuyến bay {ticket.flightNumber} • {ticket.aircraft}
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="font-label-md text-label-md uppercase text-on-surface-variant">Ngày bay</p>
          <p className="font-title-lg text-title-lg text-primary">{ticket.date}</p>
        </div>
      </div>

      <div className="p-container-padding">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(72px,0.9fr)_minmax(0,1fr)] items-center gap-stack-sm">
          <AirportBlock airport={ticket.departure} />
          <FlightTimeline />
          <AirportBlock align="right" airport={ticket.arrival} />
        </div>
      </div>

      <TicketCutout />

      <div className="flex min-w-0 flex-col gap-6 bg-surface-container-lowest p-container-padding md:flex-row md:items-center md:justify-between">
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="mb-1 font-label-md text-label-md uppercase text-on-surface-variant">Tên hành khách</p>
            <p className="truncate font-title-lg text-title-lg text-primary">{ticket.passenger.name}</p>
          </div>
          <div className="min-w-0">
            <p className="mb-1 font-label-md text-label-md uppercase text-on-surface-variant">Số vé điện tử</p>
            <p className="truncate font-data-mono text-data-mono font-bold text-primary">{ticket.passenger.ticketNumber}</p>
          </div>
          <div className="min-w-0">
            <p className="mb-1 font-label-md text-label-md uppercase text-on-surface-variant">Ghế</p>
            <p className="font-title-lg text-title-lg text-secondary-container">{ticket.passenger.seat}</p>
          </div>
          <div className="min-w-0">
            <p className="mb-1 font-label-md text-label-md uppercase text-on-surface-variant">Hạng vé</p>
            <p className="truncate font-title-lg text-title-lg text-primary">{ticket.passenger.cabin}</p>
          </div>
        </div>
        <div className="flex w-full flex-col items-center border-t border-outline-variant pt-4 md:w-48 md:flex-none md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <div className="mb-2 rounded-lg bg-surface-container-high p-2">
            <BoardingCode />
          </div>
          <p className="text-center font-label-md text-label-md text-on-surface-variant">Quét tại kiosk hoặc cửa ra máy bay</p>
        </div>
      </div>
    </section>
  );
}

function IncludedServices() {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-container-padding shadow-[0_4px_12px_rgba(26,54,93,0.05)]">
      <h3 className="mb-stack-md border-b border-outline-variant pb-2 font-title-lg text-title-lg text-primary">
        Dịch vụ bao gồm
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ticket.services.map((service) => {
          const Icon = service.icon;
          return (
            <div className="flex min-w-0 items-start gap-3" key={service.title}>
              <Icon className="mt-1 h-5 w-5 flex-none text-primary" />
              <div className="min-w-0">
                <p className="font-body-md text-body-md font-medium text-on-surface">{service.title}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{service.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PaymentSummary() {
  const rows = [
    ["Giá vé (1 người lớn)", ticket.payment.fare],
    ["Thuế & phí", ticket.payment.taxes],
    [`Chọn ghế (${ticket.passenger.seat})`, ticket.payment.seat],
  ];

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-container-padding shadow-[0_4px_12px_rgba(26,54,93,0.05)] lg:sticky lg:top-24">
      <h3 className="mb-stack-md border-b border-outline-variant pb-2 font-title-lg text-title-lg text-primary">
        Tóm tắt thanh toán
      </h3>
      <div className="grid gap-2">
        {rows.map(([label, value]) => (
          <div className="flex items-center justify-between gap-stack-md" key={label}>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{label}</p>
            <p className="text-right font-body-sm text-body-sm text-on-surface">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-stack-md border-t border-outline-variant pt-4">
        <p className="font-body-md text-body-md font-bold text-primary">Đã thanh toán</p>
        <p className="text-right font-title-lg text-title-lg text-primary">
          {ticket.payment.total} <span className="text-sm font-normal">VND</span>
        </p>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-lg bg-surface-container-low p-3">
        <CreditCard className="h-5 w-5 flex-none text-primary" />
        <div className="min-w-0">
          <p className="truncate font-label-md text-label-md font-medium text-on-surface">{ticket.payment.method}</p>
          <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{ticket.payment.time}</p>
        </div>
      </div>
    </section>
  );
}

function HelpPanel() {
  return (
    <section className="rounded-xl bg-primary-container p-container-padding text-on-primary-container">
      <h3 className="mb-2 font-title-lg text-title-lg text-on-primary-container">Cần hỗ trợ?</h3>
      <p className="mb-4 font-body-sm text-body-sm text-on-primary-container opacity-90">
        Đội ngũ hỗ trợ VietFly luôn sẵn sàng đồng hành cùng chuyến đi của bạn.
      </p>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 flex-none" />
          <p className="font-body-md text-body-md">1900 1234</p>
        </div>
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 flex-none" />
          <p className="min-w-0 truncate font-body-md text-body-md">support@vietfly.vn</p>
        </div>
      </div>
    </section>
  );
}

export default function ETicketDetailFeature({ bookingId }) {
  const reference = bookingId || ticket.bookingReference;

  return (
    <div className="flex-grow bg-surface">
      <div className="mx-auto w-full max-w-7xl px-container-padding py-stack-lg">
        <div className="mb-stack-lg flex min-w-0 flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="mb-stack-sm flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 fill-status-success text-status-success" />
              <span className="font-label-md text-label-md uppercase tracking-wider text-status-success">
                Đặt chỗ đã xác nhận
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary">Chi tiết vé điện tử</h1>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              Mã đặt chỗ: <span className="font-data-mono text-data-mono font-bold text-primary">{reference}</span>
            </p>
          </div>
          <div className="flex w-full flex-col gap-stack-sm sm:w-auto sm:flex-row">
            <ActionButton icon={Mail} variant="outline">
              Gửi vé qua email
            </ActionButton>
            <ActionButton icon={Download}>Tải PDF</ActionButton>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-stack-lg lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-stack-lg lg:col-span-2">
            <TicketCard />
            <IncludedServices />
          </div>
          <aside className="flex min-w-0 flex-col gap-stack-lg">
            <PaymentSummary />
            <HelpPanel />
          </aside>
        </div>
      </div>
    </div>
  );
}
