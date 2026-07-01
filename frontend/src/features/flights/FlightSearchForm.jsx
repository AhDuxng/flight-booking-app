import { Button } from "@/components/ui/button";
import LocationDropdown from "./LocationDropdown";
import DateDropdown from "./DateDropdown";
import { useFlightSearch } from "./useFlightSearch";
import { useNavigate } from "react-router-dom";

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
    <div className="bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant p-stack-lg max-w-5xl mx-auto transform translate-y-8 md:translate-y-16">
      <div className="flex flex-col sm:flex-row justify-between border-b border-outline-variant mb-stack-md gap-2 sm:gap-0">
        <div className="flex">
          <button 
            className={`px-6 py-3 text-label-md font-label-md transition-colors ${flightScope === "domestic" ? "text-primary border-b-2 border-primary font-bold" : "text-on-surface-variant hover:text-primary"}`}
            onClick={() => handleScopeChange("domestic")}
            type="button"
          >
            Trong nước
          </button>
          <button 
            className={`px-6 py-3 text-label-md font-label-md transition-colors ${flightScope === "international" ? "text-primary border-b-2 border-primary font-bold" : "text-on-surface-variant hover:text-primary"}`}
            onClick={() => handleScopeChange("international")}
            type="button"
          >
            Ngoài nước
          </button>
        </div>
        <div className="flex">
          <button 
            className={`px-6 py-3 text-label-md font-label-md transition-colors ${flightType === "round-trip" ? "text-primary border-b-2 border-primary font-bold" : "text-on-surface-variant hover:text-primary"}`}
            onClick={() => handleTypeChange("round-trip")}
            type="button"
          >
            Khứ hồi
          </button>
          <button 
            className={`px-6 py-3 text-label-md font-label-md transition-colors ${flightType === "one-way" ? "text-primary border-b-2 border-primary font-bold" : "text-on-surface-variant hover:text-primary"}`}
            onClick={() => handleTypeChange("one-way")}
            type="button"
          >
            Một chiều
          </button>
        </div>
      </div>
      
      <form 
        className="grid grid-cols-1 md:grid-cols-12 gap-gutter-md"
        onSubmit={(e) => {
          e.preventDefault();
          navigate("/flights");
        }}
      >
        <div className="md:col-span-3">
          <LocationDropdown 
            label="Từ" 
            icon="flight_takeoff" 
            locations={locations}
            defaultValue={{ code: "SGN", name: "TP. Hồ Chí Minh (Tân Sơn Nhất)" }} 
          />
        </div>
        
        <div className="hidden md:flex md:col-span-1 items-center justify-center mt-6">
          <button
            className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              swap_horiz
            </span>
          </button>
        </div>
        
        <div className="md:col-span-3">
          <LocationDropdown 
            label="Đến" 
            icon="flight_land" 
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
          <div>
            <label className="block text-label-md font-label-md text-on-surface-variant mb-base">
              Hành khách
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline z-10 pointer-events-none">
                group
              </span>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 pr-8 text-body-md font-body-md text-on-surface focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer">
                <option>1 Người lớn, 0 Trẻ em</option>
                <option>2 Người lớn, 0 Trẻ em</option>
                <option>2 Người lớn, 1 Trẻ em</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                arrow_drop_down
              </span>
            </div>
          </div>
          <div>
            <label className="block text-label-md font-label-md text-on-surface-variant mb-base">
              Hạng ghế
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline z-10 pointer-events-none">
                airline_seat_recline_normal
              </span>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 pr-8 text-body-md font-body-md text-on-surface focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer">
                <option>Phổ thông</option>
                <option>Thương gia</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                arrow_drop_down
              </span>
            </div>
          </div>
        </div>
        <div className="md:col-span-4 mt-stack-sm md:mt-0 flex items-end">
          <Button
            type="submit"
            className="w-full bg-secondary-container hover:bg-secondary-fixed-dim text-on-surface font-bold text-title-lg font-title-lg py-3 px-6 h-auto shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 mt-auto"
          >
            <span className="material-symbols-outlined font-bold">search</span>
            Tìm Chuyến Bay
          </Button>
        </div>
      </form>
    </div>
  );
}
