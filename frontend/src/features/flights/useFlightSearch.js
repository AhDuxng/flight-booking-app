import { useEffect, useMemo, useState } from "react";
import airportService from "../airports/airportService";

export const useFlightSearch = () => {
  const [flightScope, setFlightScope] = useState("domestic");
  const [flightType, setFlightType] = useState("one-way");
  const [allLocations, setAllLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [locationError, setLocationError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const loadAirports = async () => {
      setIsLoadingLocations(true);
      try {
        const response = await airportService.getAll();
        setAllLocations(response.data ?? []);
        setLocationError("");
      } catch {
        setLocationError("Không thể tải danh sách sân bay.");
      } finally {
        setIsLoadingLocations(false);
      }
    };

    loadAirports();
  }, [reloadToken]);

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
    locationError,
    handleScopeChange,
    handleTypeChange,
    retryLocations: () => setReloadToken((current) => current + 1),
  };
};
