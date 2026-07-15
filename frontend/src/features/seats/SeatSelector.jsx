import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronRight, Plane, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import BookingSteps from "@/components/booking/BookingSteps";
import SeatMap from "@/components/booking/SeatMap";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loading from "@/components/common/Loading";
import { bookingService } from "@/features/bookings/bookingService";
import { flightService } from "@/features/flights/flightService";
import { formatCurrency, formatDateTime, toFlightView } from "@/features/flights/flightView";
import { seatService } from "@/features/seats/seatService";
import { getErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";
import { bookingStore, useBookingStore } from "@/store/bookingStore";

export default function SeatSelector() {
  const { flightId } = useParams();
  const navigate = useNavigate();
  const passengerInfo = useBookingStore((state) => state.passengerInfo);
  const [flight, setFlight] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!passengerInfo) {
      navigate(`/booking/${flightId}`, { replace: true });
      return;
    }

    const loadSeatData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [flightResponse, seatsResponse] = await Promise.all([
          flightService.getById(flightId),
          seatService.getByFlight(flightId),
        ]);
        setFlight(toFlightView(flightResponse.data));
        setSeats(seatsResponse.data ?? []);
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Không thể tải sơ đồ ghế."));
      } finally {
        setIsLoading(false);
      }
    };

    loadSeatData();
  }, [flightId, navigate, passengerInfo]);

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      try {
        const response = await seatService.getByFlight(flightId);
        const nextSeats = response.data ?? [];
        setSeats(nextSeats);
        setSelectedSeat((currentSeat) => nextSeats.some((seat) => seat.id === currentSeat?.id && seat.status === "available") ? currentSeat : null);
      } catch {
        return;
      }
    }, 15_000);

    return () => window.clearInterval(intervalId);
  }, [flightId]);

  const totalPrice = useMemo(() => {
    return Number(selectedSeat?.price ?? 0) + Number(passengerInfo?.baggage?.price ?? 0) + Number(passengerInfo?.meal?.price ?? 0);
  }, [passengerInfo, selectedSeat]);

  const handleSelectSeat = (seat) => {
    setSelectedSeat((currentSeat) => currentSeat?.id === seat.id ? null : seat);
  };

  const handleContinue = async () => {
    if (!selectedSeat || !passengerInfo) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await bookingService.create({
        flightId,
        contactEmail: passengerInfo.contactEmail,
        contactPhone: passengerInfo.contactPhone,
        passengers: [passengerInfo.passenger],
        seatIds: [selectedSeat.id],
        baggage: passengerInfo.baggage ? [{ passengerIndex: 0, baggageOptionId: passengerInfo.baggage.id, quantity: 1 }] : [],
        meals: passengerInfo.meal ? [{ passengerIndex: 0, mealOptionId: passengerInfo.meal.id, quantity: 1 }] : [],
        discountCode: passengerInfo.discountCode,
      });
      bookingStore.addSeat(selectedSeat);
      toast.success("Đã giữ chỗ. Hãy hoàn tất thanh toán trước khi hết hạn.");
      navigate(`/payment/${response.data.id}`);
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Không thể tạo đặt chỗ. Vui lòng chọn ghế khác."));
      const seatsResponse = await seatService.getByFlight(flightId).catch(() => null);
      if (seatsResponse?.data) {
        setSeats(seatsResponse.data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading label="Đang tải sơ đồ ghế" />;
  }

  if (error || !flight) {
    return <div className="mx-auto max-w-4xl px-container-padding py-section-gap"><ErrorMessage message={error} /></div>;
  }

  return (
    <div className="bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-stack-lg px-container-padding py-stack-lg">
        <BookingSteps currentStep={3} />
        <StepTrail />
        <div className="grid grid-cols-1 items-start gap-stack-lg lg:grid-cols-12">
          <div className="flex flex-col gap-stack-lg lg:col-span-8">
            <FlightHeader flight={flight} />
            <SeatLegend />
            <SeatMap seats={seats} onSelectSeat={handleSelectSeat} selectedSeat={selectedSeat} />
          </div>
          <div className="lg:sticky lg:top-24 lg:col-span-4"><SeatSummary flight={flight} isSubmitting={isSubmitting} onContinue={handleContinue} selectedSeat={selectedSeat} totalPrice={totalPrice} /></div>
        </div>
      </div>
    </div>
  );
}

function StepTrail() {
  return <div className="hidden items-center gap-3 text-body-sm font-body-sm text-on-surface-variant md:flex"><span>1. Thông tin chuyến bay</span><ChevronRight className="h-4 w-4" /><span>2. Thông tin hành khách</span><ChevronRight className="h-4 w-4" /><span className="font-semibold text-primary">3. Chọn chỗ ngồi</span><ChevronRight className="h-4 w-4" /><span>4. Thanh toán</span></div>;
}

function FlightHeader({ flight }) {
  return <section className="flex flex-col gap-stack-md rounded-xl border border-outline-variant bg-surface-container-lowest p-container-padding shadow-sm md:flex-row md:items-center md:justify-between"><div><h1 className="mb-1 text-headline-md font-headline-md text-primary">Chọn chỗ ngồi</h1><p className="flex flex-wrap items-center gap-2 text-body-md font-body-md text-on-surface-variant"><span className="font-bold">{flight.origin}</span><Plane className="h-4 w-4 text-primary" /><span className="font-bold">{flight.destination}</span><span className="mx-2 text-outline">|</span>{flight.flightNumber}</p></div><div className="flex w-fit items-center gap-2 rounded-lg bg-sky-blue px-4 py-2 text-label-md font-label-md text-primary"><UserRound className="h-5 w-5" />Hành khách 1</div></section>;
}

function SeatLegend() {
  return <section className="flex flex-wrap justify-center gap-x-6 gap-y-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md text-label-md font-label-md text-on-surface shadow-sm"><LegendItem className="border-outline-variant bg-white" label="Còn trống" /><LegendItem className="border-2 border-status-warning bg-status-warning" label="Đang chọn" /><LegendItem className="border-surface-variant bg-surface-variant" label="Đã được giữ hoặc đặt" /></section>;
}

function LegendItem({ className, label }) {
  return <div className="flex items-center gap-2"><div className={cn("h-6 w-6 rounded-b-sm rounded-t-md border", className)} /><span>{label}</span></div>;
}

function SeatSummary({ flight, selectedSeat, totalPrice, onContinue, isSubmitting }) {
  return <aside className="relative flex flex-col gap-stack-md overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest p-container-padding shadow-md"><div className="absolute left-0 top-0 h-1 w-full bg-primary" /><h2 className="text-title-lg font-title-lg text-primary">Chi tiết đặt chỗ</h2><div className="flex items-center justify-between border-b border-outline-variant py-3"><div><span className="block text-label-md font-label-md text-on-surface-variant">Chuyến bay</span><span className="font-data-mono text-data-mono font-bold text-on-surface">{flight.origin} - {flight.destination}</span></div><div className="max-w-36 text-right text-body-sm text-on-surface">{formatDateTime(flight.departureTime)}</div></div><SelectedSeatPanel selectedSeat={selectedSeat} /><div className="flex flex-col gap-2 border-t border-outline-variant pt-4"><PriceLine label="Ghế đã chọn" value={selectedSeat?.price ?? 0} /><PriceLine label="Dịch vụ bổ sung" value={totalPrice - Number(selectedSeat?.price ?? 0)} /></div><div className="flex items-end justify-between border-t border-outline-variant pt-4"><span className="text-title-lg font-title-lg text-primary">Tạm tính</span><span className="text-headline-md font-headline-md font-bold text-primary">{formatCurrency(totalPrice)}</span></div><div className="flex items-start gap-2 rounded-lg bg-primary-fixed p-3 text-on-primary-fixed"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><p className="text-body-sm font-body-sm">Ghế sẽ được giữ sau khi hệ thống tạo booking thành công.</p></div><button className={cn("mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-status-warning py-4 text-label-md font-label-md font-bold text-primary transition-all hover:bg-secondary-container", (!selectedSeat || isSubmitting) && "cursor-not-allowed opacity-50")} disabled={!selectedSeat || isSubmitting} onClick={onContinue} type="button">{isSubmitting ? "Đang tạo đặt chỗ..." : "Tiếp tục thanh toán"}<ArrowRight className="h-4 w-4" /></button></aside>;
}

function SelectedSeatPanel({ selectedSeat }) {
  if (!selectedSeat) {
    return <div className="flex min-h-14 items-center justify-between rounded-lg bg-surface-container p-3"><span className="text-body-md italic text-on-surface-variant">Chưa chọn ghế</span><span className="text-label-md text-outline">--</span></div>;
  }
  return <div className="flex min-h-14 items-center justify-between rounded-lg bg-primary p-3 text-on-primary shadow-md"><div><span className="block font-data-mono text-lg font-bold">Ghế {selectedSeat.code}</span><span className="text-xs opacity-80">{selectedSeat.zone}</span></div><Plane className="h-5 w-5 text-status-warning" /></div>;
}

function PriceLine({ label, value }) {
  return <div className="flex items-center justify-between text-body-sm text-on-surface-variant"><span>{label}</span><span className="font-data-mono text-on-surface">{formatCurrency(value)}</span></div>;
}
