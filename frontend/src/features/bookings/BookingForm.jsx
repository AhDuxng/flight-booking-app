import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BadgePercent, Briefcase, Check, Plane, Utensils } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import BookingSteps from "@/components/booking/BookingSteps";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loading from "@/components/common/Loading";
import PassengerForm from "@/features/bookings/PassengerForm";
import { baggageService } from "@/features/baggage/baggageService";
import { discountService } from "@/features/discounts/discountService";
import { flightService } from "@/features/flights/flightService";
import { formatCurrency, formatTime, toFlightView } from "@/features/flights/flightView";
import { mealService } from "@/features/meals/mealService";
import { getErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";
import { bookingStore } from "@/store/bookingStore";

export default function BookingForm() {
  const { flightId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const passengerTypes = useMemo(() => {
    const adultCount = Math.min(9, Math.max(1, Number(searchParams.get("adultCount")) || 1));
    const childCount = Math.min(9 - adultCount, Math.max(0, Number(searchParams.get("childCount")) || 0));
    return [...Array(adultCount).fill("adult"), ...Array(childCount).fill("child")];
  }, [searchParams]);
  const [flight, setFlight] = useState(null);
  const [baggageOptions, setBaggageOptions] = useState([]);
  const [mealOptions, setMealOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [contact, setContact] = useState({ email: "", countryCode: "+84", phone: "" });
  const [passengers, setPassengers] = useState(() => passengerTypes.map((passengerType) => createPassenger(passengerType)));
  const [baggage, setBaggage] = useState(() => passengerTypes.map(() => null));
  const [meal, setMeal] = useState(() => passengerTypes.map(() => null));
  const [discountCode, setDiscountCode] = useState("");
  const [isDiscountApplied, setIsDiscountApplied] = useState(false);

  useEffect(() => {
    const loadBookingData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [flightResponse, baggageResponse, mealResponse] = await Promise.all([
          flightService.getById(flightId),
          baggageService.getOptions({ flightId }),
          mealService.getOptions({ flightId }),
        ]);
        setFlight(toFlightView(flightResponse.data));
        setBaggageOptions(baggageResponse.data ?? []);
        setMealOptions(mealResponse.data ?? []);
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Không thể tải dữ liệu đặt vé."));
      } finally {
        setIsLoading(false);
      }
    };

    loadBookingData();
  }, [flightId]);

  const estimatedTotal = useMemo(() => {
    const baggageTotal = baggage.reduce((total, item) => total + Number(item?.price ?? 0), 0);
    const mealTotal = meal.reduce((total, item) => total + Number(item?.price ?? 0), 0);
    return (flight?.price ?? 0) * passengers.length + baggageTotal + mealTotal;
  }, [baggage, flight, meal, passengers.length]);

  const handleContinue = () => {
    const hasIncompletePassenger = passengers.some((passenger) => !passenger.firstName || !passenger.lastName || !passenger.birthDate || !passenger.documentNumber);
    if (!contact.email || !contact.phone || hasIncompletePassenger) {
      toast.error("Vui lòng điền đầy đủ thông tin liên hệ và hành khách.");
      return;
    }

    bookingStore.setSelectedFlight(flight);
    bookingStore.setPassengerInfo({
      contactEmail: contact.email,
      contactPhone: `${contact.countryCode}${contact.phone}`.replaceAll(" ", ""),
      passengers: passengers.map((passenger) => ({
        firstName: passenger.firstName,
        lastName: passenger.lastName,
        dateOfBirth: passenger.birthDate,
        gender: passenger.title === "Bà" || passenger.title === "Cô" ? "female" : "male",
        nationality: passenger.nationality,
        passportNumber: passenger.documentNumber,
        passengerType: passenger.passengerType,
      })),
      baggage,
      meal,
      discountCode: isDiscountApplied ? discountCode.trim().toUpperCase() : null,
    });
    navigate(`/booking/${flight.id}/seats${window.location.search}`);
  };

  const handleApplyDiscount = async () => {
    const code = discountCode.trim().toUpperCase();

    if (!code) {
      toast.error("Hãy nhập mã giảm giá.");
      return;
    }

    try {
      const response = await discountService.validate({ code, orderValue: estimatedTotal });
      if (!response.data) {
        throw new Error("Mã giảm giá không hợp lệ.");
      }
      setDiscountCode(code);
      setIsDiscountApplied(true);
      toast.success("Mã giảm giá hợp lệ. Giá cuối cùng sẽ do hệ thống xác nhận.");
    } catch (requestError) {
      setIsDiscountApplied(false);
      toast.error(getErrorMessage(requestError, "Mã giảm giá không hợp lệ."));
    }
  };

  if (isLoading) {
    return <Loading label="Đang tải thông tin đặt vé" />;
  }

  if (error || !flight) {
    return <div className="mx-auto max-w-4xl px-container-padding py-section-gap"><ErrorMessage message={error} /></div>;
  }

  return (
    <div className="bg-background">
      <section className="border-b border-surface-container-high bg-primary">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-container-padding py-stack-lg text-on-primary md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-label-md font-label-md text-secondary-fixed">Đặt vé</p>
            <h1 className="mt-2 text-headline-lg font-headline-lg">Hoàn tất thông tin chuyến bay</h1>
            <p className="mt-2 max-w-2xl text-body-md font-body-md text-primary-fixed">Kiểm tra hành khách và dịch vụ đi kèm trước khi chọn ghế.</p>
          </div>
          <button className="inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-primary-fixed/40 px-4 text-label-md font-label-md text-primary-fixed transition-colors hover:bg-primary-container" onClick={() => navigate("/flights")} type="button">
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
            <PassengerForm contact={contact} onContactChange={(event) => setContact((current) => ({ ...current, [event.target.name]: event.target.value }))} onPassengerChange={(index, event) => setPassengers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [event.target.name]: event.target.value } : item))} passengers={passengers} />
            <BookingOptions baggage={baggage} baggageOptions={baggageOptions} discountCode={discountCode} isDiscountApplied={isDiscountApplied} meal={meal} mealOptions={mealOptions} onApplyDiscount={handleApplyDiscount} onBaggageChange={(index, value) => setBaggage((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))} onDiscountCodeChange={(value) => { setDiscountCode(value); setIsDiscountApplied(false); }} onMealChange={(index, value) => setMeal((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))} passengerCount={passengers.length} />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-outline-variant px-5 text-label-md font-label-md text-on-surface-variant transition-colors hover:bg-surface-container" onClick={() => navigate(`/flights/${flight.id}`)} type="button">
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </button>
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-secondary-container px-6 text-label-md font-label-md text-on-secondary-container shadow-sm transition-all hover:-translate-y-0.5 hover:bg-secondary-fixed-dim active:translate-y-0" onClick={handleContinue} type="button">
                Tiếp tục chọn ghế
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <BookingEstimate baggage={baggage} flight={flight} meal={meal} total={estimatedTotal} />
        </div>
      </div>
    </div>
  );
}

function FlightNotice({ flight }) {
  return (
    <section className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-[0_4px_12px_rgba(26,54,93,0.05)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-fixed text-primary"><Plane className="h-5 w-5" /></div><div><p className="text-label-md font-label-md text-on-surface-variant">{flight.airline} · {flight.flightNumber}</p><h2 className="text-title-lg font-title-lg text-primary">{flight.origin} đến {flight.destination}</h2></div></div>
        <div className="grid grid-cols-3 gap-3 rounded-lg bg-surface p-3 text-center"><Metric label="Khởi hành" value={formatTime(flight.departureTime)} /><Metric label="Thời lượng" value={flight.duration ? `${flight.duration} phút` : "-"} /><Metric label="Còn ghế" value={flight.availableSeats} /></div>
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return <div><div className="text-body-sm font-body-sm text-on-surface-variant">{label}</div><div className="text-label-md font-label-md text-on-surface">{value}</div></div>;
}

function BookingOptions({ baggage, baggageOptions, meal, mealOptions, passengerCount, discountCode, isDiscountApplied, onBaggageChange, onMealChange, onDiscountCodeChange, onApplyDiscount }) {
  return (
    <div className="grid grid-cols-1 gap-stack-lg xl:grid-cols-2">
      {Array.from({ length: passengerCount }, (_, index) => <OptionPanel icon={Briefcase} key={`baggage-${index}`} title={`Hành lý · Hành khách ${index + 1}`}><RadioList emptyLabel="Không chọn hành lý ký gửi" items={baggageOptions} itemLabel={(item) => `${item.weight_kg}kg${item.description ? ` · ${item.description}` : ""}`} onChange={(value) => onBaggageChange(index, value)} selectedItem={baggage[index]} /></OptionPanel>)}
      {Array.from({ length: passengerCount }, (_, index) => <OptionPanel icon={Utensils} key={`meal-${index}`} title={`Suất ăn · Hành khách ${index + 1}`}><RadioList emptyLabel="Không chọn suất ăn" items={mealOptions} itemLabel={(item) => item.name} onChange={(value) => onMealChange(index, value)} selectedItem={meal[index]} /></OptionPanel>)}
      <OptionPanel icon={BadgePercent} title="Mã giảm giá"><div className="flex gap-2"><input className="h-11 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md font-body-md uppercase text-on-surface placeholder:normal-case placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" onChange={(event) => onDiscountCodeChange(event.target.value)} placeholder="Nhập mã giảm giá" type="text" value={discountCode} /><button className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-label-md font-label-md text-on-primary transition-colors hover:bg-primary-container" onClick={onApplyDiscount} type="button">Áp dụng</button></div><div className={cn("mt-3 flex items-center gap-2 text-body-sm font-body-sm", isDiscountApplied ? "text-status-success" : "text-on-surface-variant")}>{isDiscountApplied ? <Check className="h-4 w-4" /> : <BadgePercent className="h-4 w-4" />}{isDiscountApplied ? "Mã đã được kiểm tra. Giá cuối cùng do máy chủ xác nhận." : "Mã được kiểm tra trước khi tạo booking."}</div></OptionPanel>
    </div>
  );
}

function OptionPanel({ icon: Icon, title, children }) {
  return <section className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-[0_4px_12px_rgba(26,54,93,0.05)]"><div className="mb-stack-md flex items-center gap-2 border-b border-surface-container-high pb-4 text-primary"><Icon className="h-5 w-5" /><h2 className="text-title-lg font-title-lg">{title}</h2></div>{children}</section>;
}

function RadioList({ items, selectedItem, onChange, itemLabel, emptyLabel }) {
  return <div className="space-y-3"><button className={cn("flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors", !selectedItem ? "border-primary bg-primary-fixed text-on-primary-fixed" : "border-outline-variant bg-surface-container-lowest hover:border-primary")} onClick={() => onChange(null)} type="button"><span className="text-body-sm font-body-sm">{emptyLabel}</span><span className="font-data-mono text-data-mono">0 VND</span></button>{items.map((item) => <button className={cn("flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors", selectedItem?.id === item.id ? "border-primary bg-primary-fixed text-on-primary-fixed" : "border-outline-variant bg-surface-container-lowest hover:border-primary")} key={item.id} onClick={() => onChange(item)} type="button"><span className="text-body-sm font-body-sm">{itemLabel(item)}</span><span className="font-data-mono text-data-mono">{formatCurrency(item.price)}</span></button>)}</div>;
}

function BookingEstimate({ flight, baggage, meal, total }) {
  const passengerCount = baggage.length;
  const baggageTotal = baggage.reduce((sum, item) => sum + Number(item?.price ?? 0), 0);
  const mealTotal = meal.reduce((sum, item) => sum + Number(item?.price ?? 0), 0);
  return <aside className="h-fit rounded-xl border border-surface-container-high bg-surface-container-lowest p-stack-lg shadow-sm lg:col-span-4 lg:sticky lg:top-24"><h2 className="text-title-lg font-title-lg text-primary">Tóm tắt dự kiến</h2><div className="mt-4 space-y-3 border-y border-surface-container-high py-4 text-body-sm"><PriceLine label={`Vé ${flight.origin} - ${flight.destination} · ${passengerCount} người`} value={flight.price * passengerCount} /><PriceLine label="Hành lý" value={baggageTotal} /><PriceLine label="Suất ăn" value={mealTotal} /></div><div className="mt-4 flex items-end justify-between"><span className="text-title-lg font-title-lg text-primary">Tạm tính</span><span className="text-headline-md font-headline-md text-primary">{formatCurrency(total)}</span></div><p className="mt-3 text-body-sm text-on-surface-variant">Tổng tiền cuối cùng sẽ được tính an toàn trên máy chủ sau khi chọn ghế.</p></aside>;
}

function createPassenger(passengerType) {
  return { title: passengerType === "child" ? "Cô" : "Ông", lastName: "", firstName: "", birthDate: "", nationality: "Việt Nam", documentNumber: "", passengerType };
}

function PriceLine({ label, value }) {
  return <div className="flex items-center justify-between gap-4"><span className="text-on-surface-variant">{label}</span><span className="font-data-mono text-on-surface">{formatCurrency(value)}</span></div>;
}
