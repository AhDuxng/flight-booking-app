import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loading from "@/components/common/Loading";
import { getErrorMessage } from "@/lib/apiError";
import heroBg from "@/assets/images/home/hero-bg.jpg";
import FlightFilter from "./FlightFilter";
import FlightList from "./FlightList";
import FlightSort from "./FlightSort";
import { flightService } from "./flightService";
import { toFlightView } from "./flightView";

export default function FlightListFeature() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [flights, setFlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    airlines: [],
    maxPrice: 10000000,
    times: [],
  });
  const [currentSort, setCurrentSort] = useState("price-asc");

  useEffect(() => {
    const loadFlights = async () => {
      setIsLoading(true);
      setError("");

      try {
        const params = Object.fromEntries(searchParams.entries());
        const response = await flightService.search(params);
        setFlights((response.data ?? []).map(toFlightView));
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Không thể tải danh sách chuyến bay."));
      } finally {
        setIsLoading(false);
      }
    };

    loadFlights();
  }, [searchParams]);

  const filteredFlights = useMemo(() => {
    return flights.filter((flight) => {
      if (filters.airlines.length > 0 && !filters.airlines.includes(flight.airline)) {
        return false;
      }
      if (flight.price > filters.maxPrice) {
        return false;
      }
      if (filters.times.length === 0) {
        return true;
      }

      const hour = new Date(flight.departureTime).getHours();
      return (
        (filters.times.includes("early-morning") && hour < 6) ||
        (filters.times.includes("morning") && hour >= 6 && hour < 12) ||
        (filters.times.includes("afternoon") && hour >= 12 && hour < 18) ||
        (filters.times.includes("evening") && hour >= 18)
      );
    });
  }, [filters, flights]);

  const sortedFlights = useMemo(() => {
    return [...filteredFlights].sort((first, second) => {
      if (currentSort === "duration-asc") {
        return Number(first.duration ?? 0) - Number(second.duration ?? 0);
      }
      if (currentSort === "time-asc") {
        return new Date(first.departureTime) - new Date(second.departureTime);
      }
      return first.price - second.price;
    });
  }, [currentSort, filteredFlights]);

  return (
    <div className="flex flex-col bg-surface-container">
      <section className="relative overflow-hidden bg-primary pb-24 pt-8">
        <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" height="900" src={heroBg} width="1600" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary" />
        <div className="relative z-10 mx-auto mt-8 max-w-7xl px-container-padding text-center">
          <h1 className="mb-stack-sm text-display-lg-mobile font-display-lg-mobile text-on-primary md:text-display-lg md:font-display-lg">
            Kết quả tìm kiếm
          </h1>
          <p className="text-body-lg font-body-lg text-secondary-fixed">Chuyến bay phù hợp với hành trình của bạn</p>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl flex-grow grid-cols-1 gap-stack-lg px-container-padding py-stack-lg lg:grid-cols-12">
        <FlightFilter airlines={[...new Set(flights.map((flight) => flight.airline))]} filters={filters} onFilterChange={setFilters} />
        <div className="flex flex-col gap-stack-md lg:col-span-9">
          <FlightSort currentSort={currentSort} onSortChange={setCurrentSort} />
          {isLoading && <Loading label="Đang tìm chuyến bay" />}
          {!isLoading && error && <ErrorMessage message={error} />}
          {!isLoading && !error && <FlightList flights={sortedFlights} onSelectFlight={(flight) => navigate(`/flights/${flight.id}?${searchParams.toString()}`)} />}
        </div>
      </div>
    </div>
  );
}
