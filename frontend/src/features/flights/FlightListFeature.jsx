import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import FlightFilter from "./FlightFilter";
import FlightSort from "./FlightSort";
import FlightList from "./FlightList";
import { FLIGHT_MOCK_DATA } from "./flightMockData";
import heroBg from "@/assets/images/home/hero-bg.jpg";

export default function FlightListFeature() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    airlines: ["Vietnam Airlines", "Vietjet Air", "Bamboo Airways"],
    maxPrice: 5000000,
    times: [],
  });

  const [currentSort, setCurrentSort] = useState("price-asc");

  const filteredFlights = useMemo(() => {
    return FLIGHT_MOCK_DATA.filter((flight) => {
      if (!filters.airlines.includes(flight.airline.name)) {
        return false;
      }
      if (flight.price > filters.maxPrice) {
        return false;
      }
      
      if (filters.times.length > 0) {
        const hour = parseInt(flight.departureTime.split(":")[0], 10);
        let timeMatched = false;
        if (filters.times.includes("early-morning") && hour >= 0 && hour < 6) {
          timeMatched = true;
        }
        if (filters.times.includes("morning") && hour >= 6 && hour < 12) {
          timeMatched = true;
        }
        if (filters.times.includes("afternoon") && hour >= 12 && hour < 18) {
          timeMatched = true;
        }
        if (filters.times.includes("evening") && hour >= 18 && hour < 24) {
          timeMatched = true;
        }
        if (!timeMatched) {
          return false;
        }
      }
      
      return true;
    });
  }, [filters]);

  const sortedFlights = useMemo(() => {
    return [...filteredFlights].sort((a, b) => {
      switch (currentSort) {
        case "price-asc":
          return a.price - b.price;
        case "duration-asc":
          return a.duration.localeCompare(b.duration);
        case "time-asc":
          return a.departureTime.localeCompare(b.departureTime);
        default:
          return 0;
      }
    });
  }, [filteredFlights, currentSort]);

  const handleSelectFlight = (flight) => {
    navigate(`/booking/${flight.id}`);
  };

  return (
    <div className="flex flex-col bg-surface-container">
      <section className="relative overflow-hidden bg-primary pb-24 pt-8">
        <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" height="900" src={heroBg} width="1600" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary" />
        <div className="relative z-10 mx-auto mt-8 max-w-7xl px-container-padding text-center">
          <h1 className="mb-stack-sm text-display-lg-mobile font-display-lg-mobile text-on-primary md:text-display-lg md:font-display-lg">
            Kết quả tìm kiếm
          </h1>
          <p className="text-body-lg font-body-lg text-secondary-fixed">Hàng ngàn chuyến bay đang chờ đón bạn</p>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl flex-grow grid-cols-1 gap-stack-lg px-container-padding py-stack-lg lg:grid-cols-12">
        <FlightFilter filters={filters} onFilterChange={setFilters} />
        <div className="flex flex-col gap-stack-md lg:col-span-9">
          <FlightSort currentSort={currentSort} onSortChange={setCurrentSort} />
          <FlightList flights={sortedFlights} onSelectFlight={handleSelectFlight} />
        </div>
      </div>
    </div>
  );
}
