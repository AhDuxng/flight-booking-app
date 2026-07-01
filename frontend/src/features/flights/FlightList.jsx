import FlightCard from "./FlightCard";

export default function FlightList({ flights, onSelectFlight }) {
  if (flights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-stack-xl bg-surface-container-lowest rounded-lg border border-surface-container-highest text-center h-64 mt-stack-sm">
        <span className="material-symbols-outlined text-display-lg text-outline mb-4">
          flight_off
        </span>
        <h3 className="font-title-lg text-title-lg text-on-surface mb-2">
          Không tìm thấy chuyến bay
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Vui lòng thử thay đổi bộ lọc hoặc tiêu chí tìm kiếm.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-stack-md mt-stack-sm">
      {flights.map((flight) => (
        <FlightCard
          key={flight.id}
          flight={flight}
          onSelect={onSelectFlight}
        />
      ))}
    </div>
  );
}
