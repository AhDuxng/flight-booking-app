import { useNavigate } from "react-router-dom";
import { useState } from "react";
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
    handleScopeChange,
    handleTypeChange,
  } = useFlightSearch();

  return (
    <div className="mx-auto max-w-5xl translate-y-8 rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-lg shadow-lg md:translate-y-16">
      <div className="mb-stack-md flex flex-col justify-between gap-3 border-b border-outline-variant pb-stack-md sm:flex-row">
        <SegmentedControl options={FLIGHT_SCOPES} value={flightScope} onChange={handleScopeChange} />
        <SegmentedControl options={FLIGHT_TYPES} value={flightType} onChange={handleTypeChange} />
      </div>
      
      <form 
        className="grid grid-cols-1 md:grid-cols-12 gap-gutter-md"
        onSubmit={(event) => {
          event.preventDefault();
          navigate("/flights");
        }}
      >
        <div className="md:col-span-3">
          <LocationDropdown 
            label="Từ" 
            icon={PlaneTakeoff}
            locations={locations}
            defaultValue={{ code: "SGN", name: "TP. Hồ Chí Minh (Tân Sơn Nhất)" }} 
          />
        </div>
        
        <div className="hidden md:flex md:col-span-1 items-center justify-center mt-6">
          <button
            aria-label="Đổi điểm đi và điểm đến"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-variant text-primary transition-colors hover:bg-surface-container-high"
            type="button"
          >
            <ArrowLeftRight className="h-5 w-5" />
          </button>
        </div>
        
        <div className="md:col-span-3">
          <LocationDropdown 
            label="Đến" 
            icon={PlaneLanding}
            locations={locations}
            defaultValue={{ code: "HAN", name: "Hà Nội (Nội Bài)" }} 
          />
        </div>
        
        <div className="md:col-span-5 grid grid-cols-2 gap-gutter-md">
          <DateDropdown label="Ngày đi" defaultValue="2024-11-15" />
          <DateDropdown 
            label="Ngày về" 
            defaultValue="2024-11-20" 
            disabled={flightType === "one-way"}
          />
        </div>
        
        <div className="md:col-span-8 grid grid-cols-2 gap-gutter-md mt-stack-sm md:mt-0">
          <IconSelect icon={UsersRound} label="Hành khách" options={PASSENGER_OPTIONS} />
          <IconSelect icon={Armchair} label="Hạng ghế" options={CABIN_OPTIONS} />
        </div>
        <div className="md:col-span-4 mt-stack-sm md:mt-0 flex items-end">
          <Button
            type="submit"
            className="mt-auto w-full"
            icon={Search}
            size="lg"
            variant="warning"
          >
            Tìm chuyến bay
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
