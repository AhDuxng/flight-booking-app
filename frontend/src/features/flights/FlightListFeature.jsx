import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import FlightFilter from "./FlightFilter";
import FlightSort from "./FlightSort";
import FlightList from "./FlightList";
import { FLIGHT_MOCK_DATA } from "./flightMockData";

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
    <div className="flex-grow max-w-7xl mx-auto w-full px-container-padding py-stack-lg grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
      <FlightFilter filters={filters} onFilterChange={setFilters} />
      <div className="lg:col-span-9 flex flex-col gap-stack-md">
        <FlightSort currentSort={currentSort} onSortChange={setCurrentSort} />
        <FlightList flights={sortedFlights} onSelectFlight={handleSelectFlight} />
      </div>
    </div>
  );
}
