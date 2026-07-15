import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    handleScopeChange,
    handleTypeChange,
  } = useFlightSearch();
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

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
    const params = new URLSearchParams();

    if (origin?.id) {
      params.set("originAirportId", origin.id);
    }
    if (destination?.id) {
      params.set("destinationAirportId", destination.id);
    }
    if (departureDate) {
      params.set("departureDate", departureDate);
    }

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
        <SegmentedControl options={FLIGHT_TYPES} value={flightType} onChange={handleTypeChange} />
      </div>

      <form className="grid grid-cols-1 gap-gutter-md md:grid-cols-12" onSubmit={handleSubmit}>
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

        <div className="grid grid-cols-2 gap-gutter-md md:col-span-5">
          <DateDropdown label="Ngày đi" value={departureDate} onChange={setDepartureDate} />
          <DateDropdown label="Ngày về" value={returnDate} onChange={setReturnDate} disabled={flightType === "one-way"} />
        </div>

        <div className="mt-stack-sm grid grid-cols-2 gap-gutter-md md:col-span-8 md:mt-0">
          <IconSelect icon={UsersRound} label="Hành khách" options={PASSENGER_OPTIONS} />
          <IconSelect icon={Armchair} label="Hạng ghế" options={CABIN_OPTIONS} />
        </div>
        <div className="mt-stack-sm flex items-end md:col-span-4 md:mt-0">
          <Button type="submit" className="mt-auto w-full" disabled={isLoadingLocations} icon={Search} size="lg" variant="warning">
            {isLoadingLocations ? "Đang tải sân bay" : "Tìm chuyến bay"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function IconSelect({ icon: Icon, label, options }) {
  const [value, setValue] = useState(options[0].value);

  return (
    <div>
      <label className="mb-base block text-label-md font-label-md text-on-surface-variant">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-outline" />
        <Select className="h-11 w-full pl-10 sm:min-w-0" label={label} options={options} value={value} onChange={setValue} />
      </div>
    </div>
  );
}
