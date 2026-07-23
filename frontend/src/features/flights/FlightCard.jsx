import { Plane } from "lucide-react";
import Button from "@/components/common/Button";
import { formatCurrency, formatTime } from "./flightView";

export default function FlightCard({ flight, onSelect }) {
  return (
    <div className="bg-surface-container-lowest rounded-lg p-container-padding flight-card-shadow flight-card-hover border border-surface-container-highest flex flex-col md:flex-row gap-stack-lg items-center justify-between">
      <div className="flex flex-1 items-center gap-stack-lg w-full">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-fixed text-label-md font-bold text-primary">
          {flight.airlineCode || flight.airline.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 grid grid-cols-3 items-center text-center">
          <div>
            <div className="font-headline-md text-headline-md text-on-surface">
              {formatTime(flight.departureTime)}
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant">{flight.origin}</div>
          </div>
          <div className="flex flex-col items-center px-4">
            <div className="font-body-sm text-body-sm text-on-surface-variant mb-1">
              {flight.duration ? `${flight.duration} phút` : "Đang cập nhật"}
            </div>
            <div className="w-full relative flex items-center justify-center">
              <div className="w-full h-px bg-outline-variant absolute"></div>
              <Plane className="relative h-4 w-4 rotate-90 bg-surface-container-lowest px-1 text-outline" />
            </div>
            <div className="font-body-sm text-body-sm text-primary mt-1">{flight.flightNumber}</div>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-on-surface">
              {formatTime(flight.arrivalTime)}
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant">
              {flight.destination}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:items-end justify-center w-full md:w-auto md:min-w-[200px] border-t md:border-t-0 md:border-l border-outline-variant pt-stack-md md:pt-0 md:pl-stack-lg mt-stack-md md:mt-0">
        <div className="font-title-lg text-title-lg text-primary font-bold">
          {formatCurrency(flight.price)}
        </div>
        {flight.availableSeats < 10 ? (
          <div className="inline-block mt-1 mb-stack-md px-2 py-1 rounded bg-status-warning/10 text-status-warning font-label-md text-xs uppercase tracking-wider self-start md:self-end">
            Còn {flight.availableSeats} ghế
          </div>
        ) : (
          <div className="mb-stack-md h-6"></div>
        )}
        <Button
          onClick={() => onSelect && onSelect(flight)}
          className="w-full"
          type="button"
          variant="warning"
        >
          Chọn chuyến bay
        </Button>
      </div>
    </div>
  );
}
