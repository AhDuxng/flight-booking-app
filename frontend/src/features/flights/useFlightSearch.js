import { useEffect, useMemo, useState } from "react";
import airportService from "../airports/airportService";

export const useFlightSearch = () => {
  const [flightScope, setFlightScope] = useState("domestic");
  const [flightType, setFlightType] = useState("round-trip");
  const [allLocations, setAllLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  useEffect(() => {
    const loadAirports = async () => {
      try {
        const response = await airportService.getAll();
        setAllLocations(response.data ?? []);
      } finally {
        setIsLoadingLocations(false);
      }
    };

    loadAirports();
  }, []);

  const locations = useMemo(() => {
    if (flightScope === "international") {
      return allLocations;
    }

    return allLocations.filter((location) => location.country === "Vietnam");
  }, [allLocations, flightScope]);

  const handleScopeChange = (scope) => {
    setFlightScope(scope);
  };

  const handleTypeChange = (type) => {
    setFlightType(type);
  };

  return {
    flightScope,
    flightType,
    locations,
    isLoadingLocations,
    handleScopeChange,
    handleTypeChange,
  };
};
