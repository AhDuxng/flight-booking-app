import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BadgePercent, Briefcase, Check, CircleDollarSign, Plane, Utensils } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import BookingSteps from "@/components/booking/BookingSteps";
import BookingSummary from "@/components/booking/BookingSummary";
import PassengerForm from "@/features/bookings/PassengerForm";
import { FLIGHT_MOCK_DATA } from "@/features/flights/flightMockData";
import { cn } from "@/lib/utils";

const seats = [
  { code: "12A", label: "Cửa sổ", price: 120000, status: "available" },
  { code: "12B", label: "Tiêu chuẩn", price: 80000, status: "available" },
  { code: "12C", label: "Lối đi", price: 120000, status: "available" },
  { code: "14A", label: "Đã đặt", price: 0, status: "booked" },
  { code: "14B", label: "Tiêu chuẩn", price: 80000, status: "available" },
  { code: "14C", label: "Đang giữ", price: 0, status: "held" },
];

const baggageOptions = [
  { id: "bag-0", label: "Hành lý xách tay 7kg", price: 0 },
  { id: "bag-20", label: "Thêm hành lý ký gửi 20kg", price: 250000 },
  { id: "bag-30", label: "Thêm hành lý ký gửi 30kg", price: 360000 },
];

const mealOptions = [
  { id: "meal-none", label: "Không chọn suất ăn", price: 0 },
  { id: "meal-vn", label: "Cơm gà kiểu Việt", price: 95000 },
  { id: "meal-veg", label: "Suất chay thanh nhẹ", price: 90000 },
];

const formatCurrency = (value) => new Intl.NumberFormat("vi-VN").format(value);

export default function BookingForm() {
  const { flightId } = useParams();
  const navigate = useNavigate();
  const flight = useMemo(() => {
    return FLIGHT_MOCK_DATA.find((item) => item.id === flightId) ?? FLIGHT_MOCK_DATA[0];
  }, [flightId]);

  const [contact, setContact] = useState({
    email: "",
    countryCode: "+84",
    phone: "",
  });
  const [passenger, setPassenger] = useState({
    title: "Ông",
    lastName: "",
    firstName: "",
    birthDate: "",
    nationality: "Việt Nam",
    documentNumber: "",
  });
  const [selectedSeat, setSelectedSeat] = useState(seats[0]);
  const [baggage, setBaggage] = useState(baggageOptions[0]);
  const [meal, setMeal] = useState(mealOptions[0]);
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState({ applied: false });

  const handleContactChange = (event) => {
    const { name, value } = event.target;
    setContact((current) => ({ ...current, [name]: value }));
  };

  const handlePassengerChange = (event) => {
    const { name, value } = event.target;
    setPassenger((current) => ({ ...current, [name]: value }));
  };

  const handleApplyDiscount = () => {
    setDiscount({ applied: discountCode.trim().toUpperCase() === "VIFLY150" });
  };

  const handleContinue = () => {
    navigate(`/booking/${flight.id}/seats`);
  };

  return (
    <div className="bg-background">
      <section className="border-b border-surface-container-high bg-primary">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-container-padding py-stack-lg text-on-primary md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-label-md font-label-md text-secondary-fixed">Đặt vé</p>
            <h1 className="mt-2 text-headline-lg font-headline-lg">Hoàn tất thông tin chuyến bay</h1>
            <p className="mt-2 max-w-2xl text-body-md font-body-md text-primary-fixed">
              Kiểm tra hành khách, chọn ghế và dịch vụ đi kèm trước khi thanh toán.
            </p>
          </div>
          <button
            className="inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-primary-fixed/40 px-4 text-label-md font-label-md text-primary-fixed transition-colors hover:bg-primary-container"
            onClick={() => navigate("/flights")}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Đổi chuyến bay
          </button>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-stack-lg px-container-padding py-stack-lg">
        <BookingSteps currentStep={2} />

        <div className="grid grid-cols-1 gap-stack-lg lg:grid-cols-12">
          <div className="flex flex-col gap-stack-lg lg:col-span-8">
            <FlightNotice flight={flight} />
            <PassengerForm
              contact={contact}
              onContactChange={handleContactChange}
              onPassengerChange={handlePassengerChange}
              passenger={passenger}
            />
            <BookingOptions
              baggage={baggage}
              discount={discount}
              discountCode={discountCode}
              meal={meal}
              onApplyDiscount={handleApplyDiscount}
              onBaggageChange={setBaggage}
              onDiscountCodeChange={setDiscountCode}
              onMealChange={setMeal}
              onSeatChange={setSelectedSeat}
              selectedSeat={selectedSeat}
            />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-outline-variant px-5 text-label-md font-label-md text-on-surface-variant transition-colors hover:bg-surface-container"
                onClick={() => navigate("/flights")}
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </button>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-secondary-container px-6 text-label-md font-label-md text-on-secondary-container shadow-sm transition-all hover:-translate-y-0.5 hover:bg-secondary-fixed-dim active:translate-y-0"
                onClick={handleContinue}
                type="button"
              >
                Tiếp tục chọn ghế
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-4">
            <BookingSummary baggage={baggage} discount={discount} flight={flight} meal={meal} selectedSeat={selectedSeat} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FlightNotice({ flight }) {
  return (
    <section className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-[0_4px_12px_rgba(26,54,93,0.05)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-fixed text-primary">
            <Plane className="h-5 w-5" />
          </div>
          <div>
            <p className="text-label-md font-label-md text-on-surface-variant">{flight.airline.name}</p>
            <h2 className="text-title-lg font-title-lg text-primary">
              {flight.origin} đến {flight.destination}
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 rounded-lg bg-surface p-3 text-center">
          <Metric label="Khởi hành" value={flight.departureTime} />
          <Metric label="Thời lượng" value={flight.duration} />
          <Metric label="Còn ghế" value={flight.availableSeats} />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <div className="text-body-sm font-body-sm text-on-surface-variant">{label}</div>
      <div className="text-label-md font-label-md text-on-surface">{value}</div>
    </div>
  );
}

function BookingOptions({
  selectedSeat,
  onSeatChange,
  baggage,
  onBaggageChange,
  meal,
  onMealChange,
  discountCode,
  onDiscountCodeChange,
  discount,
  onApplyDiscount,
}) {
  return (
    <div className="grid grid-cols-1 gap-stack-lg xl:grid-cols-2">
      <OptionPanel icon={Plane} title="Chọn ghế">
        <div className="grid grid-cols-3 gap-3">
          {seats.map((seat) => {
            const isSelected = selectedSeat.code === seat.code;
            const isDisabled = seat.status !== "available";

            return (
              <button
                className={cn(
                  "flex min-h-20 flex-col items-center justify-center rounded-lg border px-2 text-center transition-all",
                  isSelected && "border-primary bg-primary text-on-primary shadow-sm",
                  !isSelected && !isDisabled && "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary",
                  isDisabled && "cursor-not-allowed border-surface-container-high bg-surface-container text-outline",
                )}
                disabled={isDisabled}
                key={seat.code}
                onClick={() => onSeatChange(seat)}
                type="button"
              >
                <span className="text-label-md font-label-md">{seat.code}</span>
                <span className="text-xs">{seat.label}</span>
                {seat.price > 0 ? <span className="mt-1 text-xs">{formatCurrency(seat.price)}</span> : null}
              </button>
            );
          })}
        </div>
      </OptionPanel>

      <OptionPanel icon={Briefcase} title="Hành lý">
        <RadioList items={baggageOptions} onChange={onBaggageChange} selectedItem={baggage} />
      </OptionPanel>

      <OptionPanel icon={Utensils} title="Suất ăn">
        <RadioList items={mealOptions} onChange={onMealChange} selectedItem={meal} />
      </OptionPanel>

      <OptionPanel icon={BadgePercent} title="Mã giảm giá">
        <div className="flex gap-2">
          <input
            className="h-11 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md font-body-md uppercase text-on-surface placeholder:normal-case placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            onChange={(event) => onDiscountCodeChange(event.target.value)}
            placeholder="Nhập VIFLY150"
            type="text"
            value={discountCode}
          />
          <button
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-label-md font-label-md text-on-primary transition-colors hover:bg-primary-container"
            onClick={onApplyDiscount}
            type="button"
          >
            Áp dụng
          </button>
        </div>
        <div className={cn("mt-3 flex items-center gap-2 text-body-sm font-body-sm", discount.applied ? "text-status-success" : "text-on-surface-variant")}>
          {discount.applied ? <Check className="h-4 w-4" /> : <CircleDollarSign className="h-4 w-4" />}
          {discount.applied ? "Đã giảm 150,000 VND" : "Mã mẫu hợp lệ: VIFLY150"}
        </div>
      </OptionPanel>
    </div>
  );
}

function OptionPanel({ icon: Icon, title, children }) {
  return (
    <section className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-[0_4px_12px_rgba(26,54,93,0.05)]">
      <div className="mb-stack-md flex items-center gap-2 border-b border-surface-container-high pb-4 text-primary">
        <Icon className="h-5 w-5" />
        <h2 className="text-title-lg font-title-lg">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function RadioList({ items, selectedItem, onChange }) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isSelected = selectedItem.id === item.id;

        return (
          <button
            className={cn(
              "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors",
              isSelected ? "border-primary bg-primary-fixed text-on-primary-fixed" : "border-outline-variant bg-surface-container-lowest hover:border-primary",
            )}
            key={item.id}
            onClick={() => onChange(item)}
            type="button"
          >
            <span className="text-body-sm font-body-sm">{item.label}</span>
            <span className="font-data-mono text-data-mono">{item.price > 0 ? formatCurrency(item.price) : "0"}</span>
          </button>
        );
      })}
    </div>
  );
}
