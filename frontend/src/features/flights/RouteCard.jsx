import { ArrowLeftRight, ArrowRight } from "lucide-react";

export default function RouteCard({ route }) {
  return (
    <div className="group cursor-pointer overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="h-48 relative overflow-hidden">
        <img
          alt={route.destination}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          height="360"
          src={route.image}
          width="640"
        />
        <div className="absolute top-4 left-4 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1 rounded-full text-label-md font-label-md text-primary font-bold shadow-sm">
          {route.destination}
        </div>
      </div>
      <div className="p-stack-md">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="text-body-sm font-body-sm">Từ {route.origin}</span>
            <ArrowLeftRight className="h-4 w-4" />
          </div>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-label-md font-label-md text-on-surface-variant mb-1">
              Giá chỉ từ
            </p>
            <p className="text-title-lg font-title-lg text-primary font-bold">
              {route.price} <span className="text-body-sm font-body-sm font-normal">VND</span>
            </p>
          </div>
          <button
            aria-label={`Xem chuyến bay đến ${route.destination}`}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-secondary-container transition-colors hover:bg-primary"
            type="button"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
