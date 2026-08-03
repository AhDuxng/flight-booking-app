import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowRight, Clock3, Luggage, Plane, Star, Utensils, UsersRound } from "lucide-react";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loading from "@/components/common/Loading";
import { getErrorMessage } from "@/lib/apiError";
import { flightService } from "@/features/flights/flightService";
import { baggageService } from "@/features/baggage/baggageService";
import { mealService } from "@/features/meals/mealService";
import { reviewService } from "@/features/reviews/reviewService";
import {
  formatCurrency,
  formatDateTime,
  formatTime,
  toFlightView,
} from "@/features/flights/flightView";

export default function FlightDetailPage() {
  const { flightId } = useParams();
  const location = useLocation();
  const [flight, setFlight] = useState(null);
  const [details, setDetails] = useState({ seats: [], baggage: [], meals: [], reviews: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFlight = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [flightResponse, seatsResponse, baggageResponse, mealsResponse, reviewsResponse] =
          await Promise.all([
            flightService.getById(flightId),
            flightService.getSeats(flightId),
            baggageService.getOptions({ flightId }),
            mealService.getOptions({ flightId }),
            reviewService.getByFlight(flightId, { limit: 6 }),
          ]);
        setFlight(toFlightView(flightResponse.data));
        setDetails({
          seats: seatsResponse.data ?? [],
          baggage: baggageResponse.data ?? [],
          meals: mealsResponse.data ?? [],
          reviews: reviewsResponse.data ?? [],
        });
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Không thể tải thông tin chuyến bay."));
      } finally {
        setIsLoading(false);
      }
    };

    loadFlight();
  }, [flightId]);

  if (isLoading) {
    return <Loading label="Đang tải chuyến bay" />;
  }

  if (error || !flight) {
    return (
      <div className="mx-auto max-w-4xl px-container-padding py-section-gap">
        {error ? (
          <ErrorMessage message={error} />
        ) : (
          <EmptyState
            actionLabel="Quay lại danh sách chuyến bay"
            actionTo="/flights"
            description="Chuyến bay bạn đang tìm không tồn tại hoặc đã ngừng mở bán."
            icon={Plane}
            title="Không tìm thấy chuyến bay"
          />
        )}
      </div>
    );
  }

  return (
    <main className="bg-surface-container">
      <section className="bg-primary px-container-padding py-section-gap text-on-primary">
        <div className="mx-auto max-w-7xl">
          <p className="text-label-md font-label-md text-secondary-fixed">
            {flight.airline} · {flight.flightNumber}
          </p>
          <h1 className="mt-2 text-display-lg-mobile font-display-lg-mobile md:text-display-lg md:font-display-lg">
            {flight.origin} đến {flight.destination}
          </h1>
          <p className="mt-3 text-body-lg font-body-lg text-primary-fixed">
            {flight.aircraft} · {flight.duration ? `${flight.duration} phút` : "Đang cập nhật"}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-stack-lg px-container-padding py-stack-lg lg:grid-cols-3">
        <article className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-lg shadow-sm lg:col-span-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-stack-md text-center">
            <FlightTime
              airport={`${flight.origin} ${flight.originCity}`}
              label={formatDateTime(flight.departureTime)}
              time={formatTime(flight.departureTime)}
            />
            <div className="flex min-w-0 flex-col items-center gap-2">
              <Clock3 className="h-5 w-5 text-outline" />
              <div className="h-px w-full min-w-24 border-t border-dashed border-outline-variant" />
              <span className="text-body-sm font-body-sm text-on-surface-variant">
                {flight.duration ? `${flight.duration} phút` : "Đang cập nhật"}
              </span>
            </div>
            <FlightTime
              airport={`${flight.destination} ${flight.destinationCity}`}
              label={formatDateTime(flight.arrivalTime)}
              time={formatTime(flight.arrivalTime)}
            />
          </div>
        </article>

        <aside className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-lg shadow-sm">
          <div className="mb-stack-md">
            <p className="text-body-sm font-body-sm text-on-surface-variant">Giá từ</p>
            <p className="text-headline-lg font-headline-lg text-primary">
              {formatCurrency(flight.price)}
            </p>
          </div>
          <div className="mb-stack-md flex items-center gap-2 rounded-lg bg-primary-fixed p-3 text-on-primary-fixed">
            <UsersRound className="h-5 w-5" />
            <span className="text-body-sm font-body-sm">
              Còn {flight.availableSeats} ghế ở mức giá này
            </span>
          </div>
          <Button
            as={Link}
            className="w-full bg-primary text-white hover:bg-primary/90 [&_svg]:text-white"
            icon={ArrowRight}
            to={`/booking/${flight.id}${location.search}`}
          >
            Đặt chuyến bay
          </Button>
        </aside>
        <div className="grid gap-stack-lg lg:col-span-3 lg:grid-cols-3">
          <DetailPanel icon={UsersRound} title="Hạng ghế và giá">
            <div className="space-y-2">
              {summarizeSeats(details.seats).map((item) => (
                <DetailRow
                  key={item.seatClass}
                  label={`${seatClassLabels[item.seatClass] ?? item.seatClass} · ${item.count} ghế trống`}
                  value={formatCurrency(item.price)}
                />
              ))}
            </div>
          </DetailPanel>
          <DetailPanel icon={Luggage} title="Hành lý ký gửi">
            <div className="space-y-2">
              {details.baggage.length ? (
                details.baggage.map((item) => (
                  <DetailRow
                    key={item.id}
                    label={`${item.weight_kg}kg${item.description ? ` · ${item.description}` : ""}`}
                    value={formatCurrency(item.price)}
                  />
                ))
              ) : (
                <p className="text-body-sm text-on-surface-variant">
                  Chuyến bay chưa mở bán hành lý bổ sung.
                </p>
              )}
            </div>
          </DetailPanel>
          <DetailPanel icon={Utensils} title="Suất ăn">
            <div className="space-y-2">
              {details.meals.length ? (
                details.meals.map((item) => (
                  <DetailRow key={item.id} label={item.name} value={formatCurrency(item.price)} />
                ))
              ) : (
                <p className="text-body-sm text-on-surface-variant">
                  Chuyến bay chưa mở bán suất ăn.
                </p>
              )}
            </div>
          </DetailPanel>
        </div>
        <DetailPanel className="lg:col-span-3" icon={Star} title="Đánh giá từ hành khách">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {details.reviews.length ? (
              details.reviews.map((review) => (
                <article className="rounded-lg bg-surface-container-low p-4" key={review.id}>
                  <p className="text-label-md text-primary">
                    {review.rating}/5 · {review.user?.full_name ?? "Hành khách VietFly"}
                  </p>
                  <p className="mt-2 text-body-sm text-on-surface-variant">
                    {review.comment || "Không có nhận xét."}
                  </p>
                  <p className="mt-2 text-xs text-outline">{formatDateTime(review.created_at)}</p>
                </article>
              ))
            ) : (
              <p className="text-body-sm text-on-surface-variant">
                Chuyến bay chưa có đánh giá công khai.
              </p>
            )}
          </div>
        </DetailPanel>
      </section>
    </main>
  );
}

const seatClassLabels = { economy: "Phổ thông", business: "Thương gia", first: "Hạng nhất" };

function summarizeSeats(seats) {
  const summary = new Map();
  seats
    .filter((seat) => seat.status === "available")
    .forEach((seat) => {
      const current = summary.get(seat.seat_class) ?? {
        seatClass: seat.seat_class,
        count: 0,
        price: Number(seat.price),
      };
      current.count += 1;
      current.price = Math.min(current.price, Number(seat.price));
      summary.set(seat.seat_class, current);
    });
  return [...summary.values()];
}

function DetailPanel({ className = "", icon: Icon, title, children }) {
  return (
    <section
      className={`rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-sm ${className}`}
    >
      <h2 className="mb-4 flex items-center gap-2 text-title-lg text-primary">
        <Icon className="h-5 w-5" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low p-3 text-body-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-data-mono text-on-surface">{value}</span>
    </div>
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
