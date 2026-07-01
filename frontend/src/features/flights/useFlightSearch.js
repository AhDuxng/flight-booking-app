import { useState } from "react";
import { DOMESTIC_LOCATIONS, ALL_LOCATIONS } from "./locationData";

export const useFlightSearch = () => {
  const [flightScope, setFlightScope] = useState("domestic");
  const [flightType, setFlightType] = useState("round-trip");

  const locations = flightScope === "domestic" ? DOMESTIC_LOCATIONS : ALL_LOCATIONS;

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
    handleScopeChange,
    handleTypeChange,
  };
};
