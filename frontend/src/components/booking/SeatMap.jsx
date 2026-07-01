import { cn } from "@/lib/utils";

const columns = ["A", "B", "C", "D", "E", "F"];
const rowNumbers = Array.from({ length: 20 }, (_, index) => index + 1);
const occupiedSeats = ["1A", "1C", "2D", "2E", "2F", "5B", "11A", "11F", "15C", "16D", "18E", "19A", "19B", "19C"];

const zoneConfig = {
  front: {
    label: "Hàng ghế đầu",
    price: 80000,
    rows: [1, 2, 3],
  },
  exit: {
    label: "Cửa thoát hiểm",
    price: 150000,
    rows: [11, 12],
  },
  standard: {
    label: "Tiêu chuẩn",
    price: 0,
    rows: [],
  },
};

const seatBaseClass =
  "relative mx-auto flex h-12 w-full max-w-11 items-center justify-center overflow-hidden rounded-b-sm rounded-t-lg border font-data-mono text-[13px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20";

export function buildSeatRows() {
  return rowNumbers.map((row) => {
    return columns.map((column) => {
      const code = `${row}${column}`;
      const zone = getSeatZone(row);

      return {
        code,
        column,
        row,
        price: zone.price,
        zone: zone.label,
        status: occupiedSeats.includes(code) ? "occupied" : "available",
      };
    });
  });
}

export default function SeatMap({ selectedSeat, onSelectSeat }) {
  const seatRows = buildSeatRows();

  return (
    <section className="flex w-full justify-center overflow-x-auto rounded-[40px] border border-surface-variant bg-surface-container-low p-2 shadow-[inset_0_4px_10px_rgba(0,0,0,0.03)] md:p-8">
      <div className="relative w-full max-w-[400px] rounded-t-[120px] border border-outline-variant bg-surface-container-lowest px-4 py-12 shadow-sm">
        <div className="absolute left-1/2 top-4 h-8 w-16 -translate-x-1/2 rounded-b-[40px] border-b-2 border-outline-variant opacity-30" />
        <div className="mb-6 grid grid-cols-[repeat(3,minmax(0,1fr))_40px_repeat(3,minmax(0,1fr))] gap-2 text-center text-label-md font-label-md text-outline-variant">
          <div>A</div>
          <div>B</div>
          <div>C</div>
          <div />
          <div>D</div>
          <div>E</div>
          <div>F</div>
        </div>
        <div className="flex flex-col gap-4">
          {seatRows.map((rowSeats) => (
            <div className="contents" key={rowSeats[0].row}>
              <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_40px_repeat(3,minmax(0,1fr))] items-center gap-2">
                {rowSeats.map((seat, index) => (
                  <SeatCell
                    index={index}
                    isSelected={selectedSeat?.code === seat.code}
                    key={seat.code}
                    onSelectSeat={onSelectSeat}
                    seat={seat}
                  />
                ))}
              </div>
              {rowSeats[0].row === 10 || rowSeats[0].row === 12 ? (
                <div className="flex h-6 items-center justify-between px-2 text-status-error">
                  <span className="text-xs font-bold">EXIT</span>
                  <div className="mx-4 flex-grow border-b-2 border-dashed border-outline-variant" />
                  <span className="text-xs font-bold">EXIT</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SeatCell({ seat, index, isSelected, onSelectSeat }) {
  const isOccupied = seat.status === "occupied";

  return (
    <>
      {index === 3 ? (
        <div className="text-center text-label-md font-label-md text-outline-variant">{seat.row}</div>
      ) : null}
      <button
        className={cn(
          seatBaseClass,
          seat.zone === "Tiêu chuẩn" && !isSelected && !isOccupied && "border-outline-variant bg-white text-on-surface hover:border-primary hover:text-primary",
          seat.zone === "Hàng ghế đầu" && !isSelected && !isOccupied && "border-2 border-primary bg-sky-blue text-primary hover:bg-primary-fixed",
          seat.zone === "Cửa thoát hiểm" && !isSelected && !isOccupied && "border-tertiary bg-surface-container text-tertiary hover:bg-tertiary-fixed",
          isSelected && "z-10 scale-105 border-2 border-status-warning bg-status-warning text-primary shadow-[0_4px_12px_rgba(251,191,36,0.4)]",
          isOccupied && "cursor-not-allowed border-surface-variant bg-surface-variant text-outline",
        )}
        disabled={isOccupied}
        onClick={() => onSelectSeat(seat)}
        type="button"
      >
        {isOccupied ? <span className="absolute h-px w-16 rotate-45 bg-outline-variant" /> : null}
        <span className="relative">{seat.column}</span>
      </button>
    </>
  );
}

function getSeatZone(row) {
  if (zoneConfig.front.rows.includes(row)) {
    return zoneConfig.front;
  }

  if (zoneConfig.exit.rows.includes(row)) {
    return zoneConfig.exit;
  }

  return zoneConfig.standard;
}
