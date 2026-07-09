import { Link, useParams } from "react-router-dom";
import { ArrowRight, Clock3, Plane, UsersRound } from "lucide-react";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import { FLIGHT_MOCK_DATA } from "@/features/flights/flightMockData";

const formatCurrency = (value) => new Intl.NumberFormat("vi-VN").format(value);

export default function FlightDetailPage() {
  const { flightId } = useParams();
  const flight = FLIGHT_MOCK_DATA.find((item) => item.id === flightId);

  if (!flight) {
    return (
      <div className="mx-auto max-w-4xl px-container-padding py-section-gap">
        <EmptyState
          actionLabel="Quay lại danh sách chuyến bay"
          actionTo="/flights"
          description="Chuyến bay bạn đang tìm không tồn tại hoặc đã ngừng mở bán."
          icon={Plane}
          title="Không tìm thấy chuyến bay"
        />
      </div>
    );
  }

  return (
    <main className="bg-surface-container">
      <section className="bg-primary px-container-padding py-section-gap text-on-primary">
        <div className="mx-auto max-w-7xl">
          <p className="text-label-md font-label-md text-secondary-fixed">{flight.airline.name}</p>
          <h1 className="mt-2 text-display-lg-mobile font-display-lg-mobile md:text-display-lg md:font-display-lg">
            {flight.origin} đến {flight.destination}
          </h1>
          <p className="mt-3 text-body-lg font-body-lg text-primary-fixed">{flight.type} • {flight.duration}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-stack-lg px-container-padding py-stack-lg lg:grid-cols-3">
        <article className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-lg shadow-sm lg:col-span-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-stack-md text-center">
            <FlightTime airport={flight.origin} label="Khởi hành" time={flight.departureTime} />
            <div className="flex min-w-0 flex-col items-center gap-2">
              <Clock3 className="h-5 w-5 text-outline" />
              <div className="h-px w-full min-w-24 border-t border-dashed border-outline-variant" />
              <span className="text-body-sm font-body-sm text-on-surface-variant">{flight.duration}</span>
            </div>
            <FlightTime airport={flight.destination} label="Đến nơi" time={flight.arrivalTime} />
          </div>
        </article>

        <aside className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-lg shadow-sm">
          <div className="mb-stack-md">
            <p className="text-body-sm font-body-sm text-on-surface-variant">Giá từ</p>
            <p className="text-headline-lg font-headline-lg text-primary">{formatCurrency(flight.price)} VND</p>
          </div>
          <div className="mb-stack-md flex items-center gap-2 rounded-lg bg-primary-fixed p-3 text-on-primary-fixed">
            <UsersRound className="h-5 w-5" />
            <span className="text-body-sm font-body-sm">Còn {flight.availableSeats} ghế ở mức giá này</span>
          </div>
          <Button as={Link} className="w-full" icon={ArrowRight} to={`/booking/${flight.id}`}>
            Đặt chuyến bay
          </Button>
        </aside>
      </section>
    </main>
  );
}

function FlightTime({ airport, label, time }) {
  return (
    <div>
      <p className="text-body-sm font-body-sm text-on-surface-variant">{label}</p>
      <p className="mt-1 text-headline-lg font-headline-lg text-primary">{time}</p>
      <p className="text-title-lg font-title-lg text-on-surface">{airport}</p>
    </div>
  );
}
