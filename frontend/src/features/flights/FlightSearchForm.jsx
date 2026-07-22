import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeftRight, Armchair, PlaneLanding, PlaneTakeoff, Search, UsersRound } from "lucide-react";
import Button from "@/components/common/Button";
import SegmentedControl from "@/components/common/SegmentedControl";
import Select from "@/components/common/Select";
import DateDropdown from "./DateDropdown";
import LocationDropdown from "./LocationDropdown";
import { useFlightSearch } from "./useFlightSearch";
import { CABIN_OPTIONS, FLIGHT_SCOPES, FLIGHT_TYPES, PASSENGER_OPTIONS } from "./flightConstants";

export default function FlightSearchForm() {
  const navigate = useNavigate();
  const {
    flightScope,
    flightType,
    locations,
    isLoadingLocations,
    locationError,
    handleScopeChange,
    handleTypeChange,
    retryLocations,
  } = useFlightSearch();
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [departureDate, setDepartureDate] = useState("");
  const [passengerSelection, setPassengerSelection] = useState(PASSENGER_OPTIONS[0].value);
  const [cabinClass, setCabinClass] = useState(CABIN_OPTIONS[0].value);

  useEffect(() => {
    if (locations.length === 0) {
      return;
    }

    const defaultOrigin = locations.find((item) => item.code === "SGN") ?? locations[0];
    const defaultDestinationCode = flightScope === "international" ? "SIN" : "HAN";
    const defaultDestination = locations.find((item) => item.code === defaultDestinationCode) ?? locations[1] ?? locations[0];
    setOrigin(defaultOrigin);
    setDestination(defaultDestination);
  }, [flightScope, locations]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!origin?.id || !destination?.id) {
      toast.error("Vui lòng chọn điểm đi và điểm đến.");
      return;
    }
    if (origin.id === destination.id) {
      toast.error("Điểm đi và điểm đến phải khác nhau.");
      return;
    }
    if (!departureDate) {
      toast.error("Vui lòng chọn ngày đi.");
      return;
    }
    const params = new URLSearchParams();
    const [adultCount, childCount] = passengerSelection.split("-").map(Number);

    if (origin?.id) {
      params.set("originAirportId", origin.id);
    }
    if (destination?.id) {
      params.set("destinationAirportId", destination.id);
    }
    if (departureDate) {
      params.set("departureDate", departureDate);
    }
    params.set("departureTimezone", origin.timezone || "Asia/Ho_Chi_Minh");
    params.set("adultCount", String(adultCount));
    params.set("childCount", String(childCount));
    params.set("passengerCount", String(adultCount + childCount));
    params.set("cabinClass", cabinClass);

    navigate(`/flights${params.size ? `?${params.toString()}` : ""}`);
  };

  const swapLocations = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  return (
    <div className="mx-auto max-w-5xl translate-y-8 rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg shadow-lg md:translate-y-16">
      <div className="mb-stack-md flex flex-col justify-between gap-3 border-b border-outline-variant pb-stack-md sm:flex-row">
        <SegmentedControl options={FLIGHT_SCOPES} value={flightScope} onChange={handleScopeChange} />
        {FLIGHT_TYPES.length > 1 ? <SegmentedControl options={FLIGHT_TYPES} value={flightType} onChange={handleTypeChange} /> : <span className="self-center text-label-md text-on-surface-variant">Hành trình một chiều</span>}
      </div>

      <form className="grid grid-cols-1 gap-gutter-md md:grid-cols-12" onSubmit={handleSubmit}>
        {locationError ? <div className="flex items-center justify-between gap-3 rounded-lg bg-status-error/10 p-3 text-body-sm text-status-error md:col-span-12"><span>{locationError}</span><button className="font-semibold underline" onClick={retryLocations} type="button">Thử lại</button></div> : null}
        <div className="md:col-span-3">
          <LocationDropdown label="Từ" icon={PlaneTakeoff} locations={locations} value={origin} onChange={setOrigin} />
        </div>

        <div className="mt-6 hidden items-center justify-center md:col-span-1 md:flex">
          <button
            aria-label="Đổi điểm đi và điểm đến"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-variant text-primary transition-colors hover:bg-surface-container-high"
            type="button"
            onClick={swapLocations}
          >
            <ArrowLeftRight className="h-5 w-5" />
          </button>
        </div>

        <div className="md:col-span-3">
          <LocationDropdown label="Đến" icon={PlaneLanding} locations={locations} value={destination} onChange={setDestination} />
        </div>

        <div className="md:col-span-5">
          <DateDropdown label="Ngày đi" value={departureDate} onChange={setDepartureDate} />
        </div>

        <div className="mt-stack-sm grid grid-cols-2 gap-gutter-md md:col-span-8 md:mt-0">
          <IconSelect icon={UsersRound} label="Hành khách" onChange={setPassengerSelection} options={PASSENGER_OPTIONS} value={passengerSelection} />
          <IconSelect icon={Armchair} label="Hạng ghế" onChange={setCabinClass} options={CABIN_OPTIONS} value={cabinClass} />
        </div>
        <div className="mt-stack-sm flex items-end md:col-span-4 md:mt-0">
          <Button type="submit" className="mt-auto w-full" disabled={isLoadingLocations || Boolean(locationError)} icon={Search} size="lg" variant="warning">
            {isLoadingLocations ? "Đang tải sân bay" : "Tìm chuyến bay"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function IconSelect({ icon: Icon, label, options, value, onChange }) {
  return (
    <div>
      <label className="mb-base block text-label-md font-label-md text-on-surface-variant">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-outline" />
        <Select className="h-11 w-full pl-10 sm:min-w-0" label={label} options={options} value={value} onChange={onChange} />
      </div>
    </div>
  );
}
