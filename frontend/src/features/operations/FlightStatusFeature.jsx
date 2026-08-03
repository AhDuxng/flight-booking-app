import { useState } from "react";
import { Clock3, MapPin, PlaneTakeoff, Search } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/common/EmptyState";
import Loading from "@/components/common/Loading";
import { formatDateTime } from "@/features/flights/flightView";
import { getErrorMessage } from "@/lib/apiError";
import { operationService } from "./operationService";

export default function FlightStatusFeature() {
  const [flightNumber, setFlightNumber] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (flightNumber.trim().length < 2) return toast.error("Nhập mã chuyến bay.");
    setLoading(true);
    try {
      const response = await operationService.getFlightStatus({ flightNumber, departureDate: departureDate || undefined });
      setFlights(response.data ?? []);
      setSearched(true);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể tra cứu trạng thái chuyến bay."));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[70vh] bg-surface-container">
      <section className="bg-primary px-container-padding py-section-gap text-on-primary">
        <div className="mx-auto max-w-4xl text-center">
          <PlaneTakeoff className="mx-auto h-10 w-10 text-secondary-container" />
          <h1 className="mt-4 text-headline-lg">Trạng thái chuyến bay</h1>
          <p className="mt-2 text-primary-fixed">Giờ dự kiến/thực tế, cửa ra máy bay và băng chuyền hành lý được cập nhật tại đây.</p>
          <form className="mx-auto mt-6 grid max-w-2xl gap-3 rounded-xl bg-surface-container-lowest p-4 text-on-surface shadow-lg sm:grid-cols-[1fr_1fr_auto]" onSubmit={submit}>
            <input className="h-11 rounded-lg border border-outline-variant px-3 uppercase" onChange={(e) => setFlightNumber(e.target.value)} placeholder="VN123" value={flightNumber} />
            <input className="h-11 rounded-lg border border-outline-variant px-3" onChange={(e) => setDepartureDate(e.target.value)} type="date" value={departureDate} />
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-secondary-container px-5 font-semibold text-on-secondary-container" type="submit"><Search className="h-4 w-4" />Tra cứu</button>
          </form>
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-container-padding py-stack-lg">
        {loading ? <Loading label="Đang tra cứu" /> : flights.length ? flights.map((flight) => <FlightStatusCard flight={flight} key={flight.id} />) : searched ? <EmptyState icon={PlaneTakeoff} title="Không tìm thấy chuyến bay" description="Kiểm tra lại mã chuyến hoặc ngày khởi hành." /> : null}
      </div>
    </div>
  );
}

function FlightStatusCard({ flight }) {
  const latest = [...(flight.flight_status_events ?? [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  return (
    <article className="mb-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-container-padding shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant pb-4">
        <div><p className="text-title-lg text-primary">{flight.airline?.name} · {flight.flight_number}</p><p className="text-body-sm text-on-surface-variant">{flight.origin_airport?.code} → {flight.destination_airport?.code}</p></div>
        <span className="rounded-full bg-primary-fixed px-3 py-1 text-label-md font-semibold uppercase text-primary">{flight.status}</span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Info icon={Clock3} label="Khởi hành" value={formatDateTime(flight.actual_departure_time || latest?.estimated_departure_time || flight.departure_time)} />
        <Info icon={MapPin} label="Cửa / Nhà ga" value={`${latest?.gate || flight.gate || "-"} / ${latest?.terminal || flight.terminal || "-"}`} />
        <Info icon={MapPin} label="Băng chuyền" value={latest?.baggage_carousel || flight.baggage_carousel || "Chưa cập nhật"} />
      </div>
      {latest?.message || flight.delay_reason ? <p className="mt-4 rounded-lg bg-surface-container p-3 text-body-sm text-on-surface-variant">{latest?.message || flight.delay_reason}</p> : null}
    </article>
  );
}

function Info({ icon: Icon, label, value }) { return <div className="flex gap-3"><Icon className="mt-0.5 h-4 w-4 text-primary" /><div><p className="text-xs uppercase text-on-surface-variant">{label}</p><p className="mt-1 text-body-md">{value}</p></div></div>; }
