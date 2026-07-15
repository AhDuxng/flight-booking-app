import { cn } from "@/lib/utils";

const seatBaseClass = "relative flex h-12 items-center justify-center overflow-hidden rounded-b-sm rounded-t-lg border font-data-mono text-[13px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20";

const getSeatParts = (seatNumber) => {
  const match = String(seatNumber).match(/^(\d+)(.*)$/);
  return { row: Number(match?.[1] ?? 0), column: match?.[2] ?? seatNumber };
};

export default function SeatMap({ seats, selectedSeat, onSelectSeat }) {
  const rows = new Map();

  for (const seat of seats) {
    const { row, column } = getSeatParts(seat.seat_number);
    const currentRow = rows.get(row) ?? new Map();
    currentRow.set(column, seat);
    rows.set(row, currentRow);
  }

  const sortedRows = [...rows.entries()].sort(([firstRow], [secondRow]) => firstRow - secondRow);
  const hasSixSeatsPerRow = seats.some((seat) => ["E", "F"].includes(getSeatParts(seat.seat_number).column));
  const columns = hasSixSeatsPerRow
    ? { left: ["A", "B", "C"], right: ["D", "E", "F"] }
    : { left: ["A", "B", null], right: ["C", "D", null] };

  if (sortedRows.length === 0) {
    return <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg text-center text-body-md text-on-surface-variant">Chưa có sơ đồ ghế cho chuyến bay này.</section>;
  }

  return (
    <section className="rounded-[32px] border border-surface-variant bg-surface-container-low p-4 shadow-[inset_0_4px_10px_rgba(0,0,0,0.03)] md:p-8">
      <div className="mx-auto max-w-xl rounded-t-[72px] border border-outline-variant bg-surface-container-lowest p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between px-2 text-label-md font-label-md text-on-surface-variant"><span>Đầu máy bay</span><span>Lối đi ở giữa</span></div>
        <div className="space-y-3">
          {sortedRows.map(([rowNumber, rowSeats]) => (
            <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_2rem_repeat(3,minmax(0,1fr))] gap-2" key={rowNumber}>
              {columns.left.map((column, index) => <SeatCell isSelected={selectedSeat?.id === rowSeats.get(column)?.id} key={`${rowNumber}-left-${index}`} onSelectSeat={onSelectSeat} seat={rowSeats.get(column)} />)}
              <div className="flex items-center justify-center font-data-mono text-xs text-outline">{rowNumber}</div>
              {columns.right.map((column, index) => <SeatCell isSelected={selectedSeat?.id === rowSeats.get(column)?.id} key={`${rowNumber}-right-${index}`} onSelectSeat={onSelectSeat} seat={rowSeats.get(column)} />)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SeatCell({ seat, isSelected, onSelectSeat }) {
  if (!seat) {
    return <div aria-hidden="true" className="h-12" />;
  }

  const isUnavailable = seat.status !== "available";
  const selectedSeat = {
    id: seat.id,
    code: seat.seat_number,
    price: Number(seat.price ?? 0),
    zone: seat.seat_class ?? "Phổ thông",
  };

  return (
    <button
      aria-label={`Ghế ${seat.seat_number}${isUnavailable ? ", không còn trống" : ""}`}
      className={cn(
        seatBaseClass,
        !isSelected && !isUnavailable && "border-outline-variant bg-white text-on-surface hover:border-primary hover:text-primary",
        isSelected && "z-10 scale-105 border-2 border-status-warning bg-status-warning text-primary shadow-[0_4px_12px_rgba(251,191,36,0.4)]",
        isUnavailable && "cursor-not-allowed border-surface-variant bg-surface-variant text-outline",
      )}
      disabled={isUnavailable}
      onClick={() => onSelectSeat(selectedSeat)}
      type="button"
    >
      {isUnavailable ? <span className="absolute h-px w-16 rotate-45 bg-outline-variant" /> : null}
      <span className="relative">{seat.seat_number}</span>
    </button>
  );
}
