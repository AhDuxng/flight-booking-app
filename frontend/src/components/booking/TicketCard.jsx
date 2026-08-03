import { Plane } from "lucide-react";

export default function TicketCard({ arrival, departure, passenger, reference }) {
  return (
    <article className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm">
      <div className="mb-stack-md flex items-center justify-between gap-4 border-b border-outline-variant pb-3">
        <div>
          <p className="text-body-sm font-body-sm text-on-surface-variant">Mã đặt chỗ</p>
          <h2 className="font-data-mono text-title-lg font-title-lg text-primary">{reference}</h2>
        </div>
        <Plane className="h-6 w-6 rotate-90 text-primary" />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <AirportSummary airport={departure} />
        <div className="h-px w-16 border-t border-dashed border-outline-variant" />
        <AirportSummary align="right" airport={arrival} />
      </div>
      {passenger ? (
        <div className="mt-stack-md rounded-lg bg-surface-container-low p-3 text-body-sm font-body-sm text-on-surface-variant">
          Hành khách: <span className="font-semibold text-on-surface">{passenger}</span>
        </div>
      ) : null}
    </article>
  );
}

function AirportSummary({ align = "left", airport }) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <p className="text-headline-md font-headline-md text-primary">{airport?.code ?? "--"}</p>
      <p className="text-body-sm font-body-sm text-on-surface-variant">
        {airport?.time ?? "--:--"}
      </p>
    </div>
  );
}
