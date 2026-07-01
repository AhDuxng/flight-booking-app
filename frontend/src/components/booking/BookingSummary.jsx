import { Clock3, Plane, ShieldCheck } from "lucide-react";

const formatCurrency = (value) => new Intl.NumberFormat("vi-VN").format(value);

export default function BookingSummary({ flight, selectedSeat, baggage, meal, discount }) {
  const subtotal = flight.price + selectedSeat.price + baggage.price + meal.price;
  const discountAmount = discount.applied ? 150000 : 0;
  const taxes = 450000;
  const total = subtotal + taxes - discountAmount;

  return (
    <aside className="sticky top-24 overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-lowest shadow-[0_4px_12px_rgba(26,54,93,0.05)]">
      <div className="bg-primary p-stack-md text-on-primary">
        <h2 className="text-title-lg font-title-lg">Tóm tắt chuyến bay</h2>
        <p className="mt-1 text-body-sm font-body-sm text-primary-fixed">Mã giữ chỗ tạm: VF2401</p>
      </div>

      <div className="border-b border-surface-container-high p-stack-md">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded bg-surface-container px-2 py-1 text-label-md font-label-md text-on-surface-variant">
            Chuyến đi
          </span>
          <span className="text-label-md font-label-md text-primary">Thứ 5, 24 Th10</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-center">
            <div className="text-headline-md font-headline-md text-on-surface">{flight.origin}</div>
            <div className="text-body-sm font-body-sm text-on-surface-variant">{flight.departureTime}</div>
          </div>
          <div className="flex flex-1 flex-col items-center">
            <div className="mb-1 flex items-center gap-1 text-body-sm font-body-sm text-outline">
              <Clock3 className="h-3.5 w-3.5" />
              {flight.duration}
            </div>
            <div className="flex w-full items-center">
              <div className="h-2 w-2 rounded-full border border-outline-variant bg-surface" />
              <div className="h-px flex-1 border-b border-dashed border-outline-variant" />
              <Plane className="mx-1 h-4 w-4 text-primary" />
              <div className="h-px flex-1 border-b border-dashed border-outline-variant" />
              <div className="h-2 w-2 rounded-full border border-outline-variant bg-surface" />
            </div>
            <div className="mt-1 text-body-sm font-body-sm text-outline">{flight.type}</div>
          </div>
          <div className="text-center">
            <div className="text-headline-md font-headline-md text-on-surface">{flight.destination}</div>
            <div className="text-body-sm font-body-sm text-on-surface-variant">{flight.arrivalTime}</div>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-b border-surface-container-high bg-surface p-stack-md">
        <LineItem label="Hành khách (1 người lớn)" value={flight.price} />
        <LineItem label={`Ghế ${selectedSeat.code}`} value={selectedSeat.price} />
        <LineItem label={baggage.label} value={baggage.price} />
        <LineItem label={meal.label} value={meal.price} />
        <LineItem label="Thuế & phí" value={taxes} />
        {discount.applied ? <LineItem isDiscount label="Mã VIFLY150" value={discountAmount} /> : null}
      </div>

      <div className="space-y-4 p-stack-md">
        <div className="flex items-start gap-2 rounded-lg bg-primary-fixed p-3 text-on-primary-fixed">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-body-sm font-body-sm">Ghế được giữ trong 09:42 sau khi xác nhận thông tin.</p>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="block text-label-md font-label-md text-on-surface-variant">Tổng tiền</span>
            <span className="text-body-sm font-body-sm text-outline">Bao gồm VAT</span>
          </div>
          <div className="text-right text-primary">
            <span className="text-headline-lg font-headline-lg">{formatCurrency(total)}</span>
            <span className="ml-1 text-label-md font-label-md">VND</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function LineItem({ label, value, isDiscount = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-body-md font-body-md text-on-surface-variant">{label}</span>
      <span className={isDiscount ? "font-data-mono text-data-mono text-status-success" : "font-data-mono text-data-mono text-on-surface"}>
        {isDiscount ? "-" : ""}
        {formatCurrency(value)}
      </span>
    </div>
  );
}
