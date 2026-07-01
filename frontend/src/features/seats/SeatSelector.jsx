import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight, Plane, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import BookingSteps from "@/components/booking/BookingSteps";
import SeatMap from "@/components/booking/SeatMap";
import { FLIGHT_MOCK_DATA } from "@/features/flights/flightMockData";
import { cn } from "@/lib/utils";

const baseTax = 350000;
const bookingCode = "VF241";

const formatCurrency = (value) => `${new Intl.NumberFormat("vi-VN").format(value)} VND`;

export default function SeatSelector() {
  const { flightId } = useParams();
  const navigate = useNavigate();
  const [selectedSeat, setSelectedSeat] = useState(null);

  const flight = useMemo(() => {
    return FLIGHT_MOCK_DATA.find((item) => item.id === flightId) ?? FLIGHT_MOCK_DATA[0];
  }, [flightId]);

  const totalPrice = flight.price + baseTax + (selectedSeat?.price ?? 0);

  const handleSelectSeat = (seat) => {
    setSelectedSeat((currentSeat) => {
      if (currentSeat?.code === seat.code) {
        return null;
      }

      return seat;
    });
  };

  const handleContinue = () => {
    if (!selectedSeat) {
      return;
    }

    navigate(`/payment/${bookingCode}`);
  };

  return (
    <div className="bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-stack-lg px-container-padding py-stack-lg">
        <BookingSteps currentStep={3} />
        <StepTrail />

        <div className="grid grid-cols-1 items-start gap-stack-lg lg:grid-cols-12">
          <div className="flex flex-col gap-stack-lg lg:col-span-8">
            <FlightHeader flight={flight} />
            <SeatLegend />
            <SeatMap onSelectSeat={handleSelectSeat} selectedSeat={selectedSeat} />
          </div>

          <div className="lg:sticky lg:top-24 lg:col-span-4">
            <SeatSummary flight={flight} onContinue={handleContinue} selectedSeat={selectedSeat} totalPrice={totalPrice} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepTrail() {
  return (
    <div className="hidden items-center gap-3 text-body-sm font-body-sm text-on-surface-variant md:flex">
      <span>1. Thông tin chuyến bay</span>
      <ChevronRight className="h-4 w-4" />
      <span>2. Thông tin hành khách</span>
      <ChevronRight className="h-4 w-4" />
      <span className="font-semibold text-primary">3. Chọn chỗ ngồi</span>
      <ChevronRight className="h-4 w-4" />
      <span>4. Thanh toán</span>
    </div>
  );
}

function FlightHeader({ flight }) {
  return (
    <section className="flex flex-col gap-stack-md rounded-xl border border-outline-variant bg-surface-container-lowest p-container-padding shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="mb-1 text-headline-md font-headline-md text-primary">Chọn chỗ ngồi</h1>
        <p className="flex flex-wrap items-center gap-2 text-body-md font-body-md text-on-surface-variant">
          <span className="font-bold">{flight.origin}</span>
          <Plane className="h-4 w-4 text-primary" />
          <span className="font-bold">{flight.destination}</span>
          <span className="mx-2 text-outline">|</span>
          Chuyến bay {bookingCode}
        </p>
      </div>
      <div className="flex w-fit items-center gap-2 rounded-lg bg-sky-blue px-4 py-2 text-label-md font-label-md text-primary">
        <UserRound className="h-5 w-5" />
        Hành khách 1
      </div>
    </section>
  );
}

function SeatLegend() {
  const items = [
    { label: "Tiêu chuẩn", className: "border-outline-variant bg-white" },
    { label: "Hàng ghế đầu (+80,000 VND)", className: "border-2 border-primary bg-sky-blue" },
    { label: "Cửa thoát hiểm (+150,000 VND)", className: "border-tertiary bg-surface-container" },
    { label: "Đang chọn", className: "border-2 border-status-warning bg-status-warning shadow-sm" },
    { label: "Đã đặt", className: "border-surface-variant bg-surface-variant", occupied: true },
  ];

  return (
    <section className="flex flex-wrap justify-center gap-x-6 gap-y-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md text-label-md font-label-md text-on-surface shadow-sm">
      {items.map((item) => (
        <div className="flex items-center gap-2" key={item.label}>
          <div className={cn("relative h-6 w-6 overflow-hidden rounded-b-sm rounded-t-md border", item.className)}>
            {item.occupied ? <span className="absolute left-1/2 top-1/2 h-px w-9 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-outline-variant" /> : null}
          </div>
          <span>{item.label}</span>
        </div>
      ))}
    </section>
  );
}

function SeatSummary({ flight, selectedSeat, totalPrice, onContinue }) {
  return (
    <aside className="relative flex flex-col gap-stack-md overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest p-container-padding shadow-md">
      <div className="absolute left-0 top-0 h-1 w-full bg-primary" />
      <h2 className="text-title-lg font-title-lg text-primary">Chi tiết đặt chỗ</h2>

      <div className="flex items-center justify-between border-b border-outline-variant py-3">
        <div className="flex flex-col">
          <span className="text-label-md font-label-md text-on-surface-variant">Chuyến bay</span>
          <span className="font-data-mono text-data-mono font-bold text-on-surface">
            {flight.origin} - {flight.destination}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-label-md font-label-md text-on-surface-variant">Ngày</span>
          <span className="text-body-md font-body-md text-on-surface">15 Thg 10, 2024</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-outline-variant py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-4 w-4" />
            </div>
            <span className="text-label-md font-label-md font-bold text-primary">Người lớn 1</span>
          </div>
        </div>
        <SelectedSeatPanel selectedSeat={selectedSeat} />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <PriceLine label="Giá vé cơ bản" value={flight.price} />
        <PriceLine label="Thuế & phí" value={baseTax} />
        <PriceLine highlight={!!selectedSeat} label="Phí chọn ghế" value={selectedSeat?.price ?? 0} />
      </div>

      <div className="mt-2 flex items-end justify-between border-t border-outline-variant pt-4">
        <span className="text-title-lg font-title-lg text-primary">Tổng tiền</span>
        <div className="text-right">
          <span className="mb-1 block text-xs text-label-md font-label-md text-status-warning">Giá đã bao gồm VAT</span>
          <span className="text-headline-md font-headline-md font-bold text-primary">{formatCurrency(totalPrice)}</span>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-primary-fixed p-3 text-on-primary-fixed">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-body-sm font-body-sm">Ghế đã chọn sẽ được giữ trong 10 phút sau khi tiếp tục.</p>
      </div>

      <button
        className={cn(
          "mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-status-warning py-4 text-label-md font-label-md font-bold text-primary transition-all duration-200 hover:bg-secondary-container",
          !selectedSeat && "cursor-not-allowed opacity-50",
          selectedSeat && "shadow-md hover:-translate-y-0.5",
        )}
        disabled={!selectedSeat}
        onClick={onContinue}
        type="button"
      >
        Tiếp tục thanh toán
        <ArrowRight className="h-4 w-4" />
      </button>
    </aside>
  );
}

function SelectedSeatPanel({ selectedSeat }) {
  if (!selectedSeat) {
    return (
      <div className="flex min-h-14 items-center justify-between rounded-lg bg-surface-container p-3">
        <span className="text-body-md font-body-md italic text-on-surface-variant">Chưa chọn ghế</span>
        <span className="text-label-md font-label-md text-outline">--</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-14 items-center justify-between rounded-lg bg-primary p-3 text-on-primary shadow-md">
      <div className="flex flex-col">
        <span className="font-data-mono text-lg font-bold">Ghế {selectedSeat.code}</span>
        <span className="text-xs font-label-md opacity-80">{selectedSeat.zone}</span>
      </div>
      <Plane className="h-5 w-5 text-status-warning" />
    </div>
  );
}

function PriceLine({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
      <span>{label}</span>
      <span className={cn("font-data-mono text-data-mono", highlight && "font-bold text-primary")}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
