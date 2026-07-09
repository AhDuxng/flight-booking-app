import { Moon, Sunrise, Sun, Sunset } from "lucide-react";
import { cn } from "@/lib/utils";

const timeOptions = [
  { id: "early-morning", label: "Sáng sớm", time: "00:00 - 06:00", icon: Sunrise },
  { id: "morning", label: "Sáng", time: "06:00 - 12:00", icon: Sun },
  { id: "afternoon", label: "Chiều", time: "12:00 - 18:00", icon: Sunset },
  { id: "evening", label: "Tối", time: "18:00 - 24:00", icon: Moon },
];

export default function FlightFilter({ filters, onFilterChange }) {
  const handleAirlineChange = (airline) => {
    const newAirlines = filters.airlines.includes(airline)
      ? filters.airlines.filter((a) => a !== airline)
      : [...filters.airlines, airline];
    onFilterChange({ ...filters, airlines: newAirlines });
  };

  const handlePriceChange = (e) => {
    onFilterChange({ ...filters, maxPrice: Number(e.target.value) });
  };

  const handleTimeChange = (timeId) => {
    const newTimes = filters.times.includes(timeId)
      ? filters.times.filter((t) => t !== timeId)
      : [...filters.times, timeId];
    onFilterChange({ ...filters, times: newTimes });
  };

  return (
    <aside className="lg:col-span-3 flex flex-col gap-stack-lg">
      <div className="bg-surface-container-lowest rounded-lg p-stack-md flight-card-shadow border border-surface-container-highest">
        <h2 className="font-title-lg text-title-lg text-on-surface mb-stack-md">
          Bộ lọc
        </h2>
        
        <div className="mb-stack-lg border-b border-outline-variant pb-stack-md">
          <h3 className="font-label-md text-label-md text-on-surface-variant mb-stack-sm uppercase tracking-wider">
            Hãng hàng không
          </h3>
          <div className="flex flex-col gap-stack-sm mt-stack-sm">
            {["Vietnam Airlines", "Vietjet Air", "Bamboo Airways"].map((airline) => (
              <label key={airline} className="flex items-center gap-base cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox text-primary rounded border-outline focus:ring-primary"
                  checked={filters.airlines.includes(airline)}
                  onChange={() => handleAirlineChange(airline)}
                />
                <span className="font-body-md text-body-md">{airline}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="mb-stack-lg border-b border-outline-variant pb-stack-md">
          <h3 className="font-label-md text-label-md text-on-surface-variant mb-stack-sm uppercase tracking-wider">
            Mức giá
          </h3>
          <div className="mt-stack-sm">
            <input
              type="range"
              min="0"
              max="5000000"
              step="100000"
              value={filters.maxPrice}
              onChange={handlePriceChange}
              className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between mt-base font-body-sm text-body-sm text-on-surface-variant">
              <span>0đ</span>
              <span>{new Intl.NumberFormat("vi-VN").format(filters.maxPrice)}đ+</span>
            </div>
          </div>
        </div>
        
        <div className="mb-stack-lg border-b border-outline-variant pb-stack-md">
          <h3 className="font-label-md text-label-md text-on-surface-variant mb-stack-sm uppercase tracking-wider">
            Giờ khởi hành
          </h3>
          <div className="grid grid-cols-2 gap-stack-sm mt-stack-sm">
            {timeOptions.map((timeOption) => {
              const isActive = filters.times.includes(timeOption.id);
              const Icon = timeOption.icon;

              return (
                <button
                  key={timeOption.id}
                  onClick={() => handleTimeChange(timeOption.id)}
                  className={cn(
                    "rounded border p-stack-sm text-center transition-colors",
                    isActive ? "border-primary bg-primary-fixed" : "border-outline-variant hover:border-primary hover:bg-primary-fixed",
                  )}
                  type="button"
                >
                  <Icon className={cn("mx-auto h-5 w-5", isActive ? "text-primary" : "text-outline")} />
                  <span className="block font-body-sm text-body-sm mt-1">
                    {timeOption.label}
                  </span>
                  <span className="block font-body-sm text-body-sm text-on-surface-variant text-xs">
                    {timeOption.time}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
