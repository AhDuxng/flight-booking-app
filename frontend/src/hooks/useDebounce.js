import { useEffect, useState } from "react";

export const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [delay, value]);

  return debouncedValue;
};
