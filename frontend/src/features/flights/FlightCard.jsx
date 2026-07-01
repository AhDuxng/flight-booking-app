export default function FlightCard({ flight, onSelect }) {
  const formattedPrice = new Intl.NumberFormat("vi-VN").format(flight.price);

  return (
    <div className="bg-surface-container-lowest rounded-lg p-container-padding flight-card-shadow flight-card-hover border border-surface-container-highest flex flex-col md:flex-row gap-stack-lg items-center justify-between">
      <div className="flex flex-1 items-center gap-stack-lg w-full">
        <div className="w-12 h-12 flex-shrink-0">
          <img
            alt={flight.airline.name}
            className="w-full h-full object-contain"
            src={flight.airline.logo}
          />
        </div>
        <div className="flex-1 grid grid-cols-3 items-center text-center">
          <div>
            <div className="font-headline-md text-headline-md text-on-surface">
              {flight.departureTime}
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant">
              {flight.origin}
            </div>
          </div>
          <div className="flex flex-col items-center px-4">
            <div className="font-body-sm text-body-sm text-on-surface-variant mb-1">
              {flight.duration}
            </div>
            <div className="w-full relative flex items-center justify-center">
              <div className="w-full h-px bg-outline-variant absolute"></div>
              <span className="material-symbols-outlined text-outline relative bg-surface-container-lowest px-1 transform rotate-90 text-sm">
                flight
              </span>
            </div>
            <div className="font-body-sm text-body-sm text-primary mt-1">
              {flight.type}
            </div>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-on-surface">
              {flight.arrivalTime}
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant">
              {flight.destination}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:items-end justify-center w-full md:w-auto md:min-w-[200px] border-t md:border-t-0 md:border-l border-outline-variant pt-stack-md md:pt-0 md:pl-stack-lg mt-stack-md md:mt-0">
        <div className="font-title-lg text-title-lg text-primary font-bold">
          {formattedPrice}{" "}
          <span className="font-body-md text-body-md font-normal">VND</span>
        </div>
        {flight.availableSeats < 10 ? (
          <div className="inline-block mt-1 mb-stack-md px-2 py-1 rounded bg-status-warning/10 text-status-warning font-label-md text-xs uppercase tracking-wider self-start md:self-end">
            Còn {flight.availableSeats} ghế
          </div>
        ) : (
          <div className="mb-stack-md h-6"></div>
        )}
        <button
          onClick={() => onSelect && onSelect(flight)}
          className="w-full bg-[#f97316] hover:bg-[#ea580c] text-deep-navy font-label-md text-label-md font-bold py-3 px-6 rounded transition-colors shadow-sm"
        >
          Chọn chuyến bay
        </button>
      </div>
    </div>
  );
}
