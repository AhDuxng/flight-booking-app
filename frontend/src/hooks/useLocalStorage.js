import { useEffect, useState } from "react";

const readStorageValue = (key, initialValue) => {
  if (typeof window === "undefined") {
    return initialValue;
  }

  const storedValue = window.localStorage.getItem(key);
  if (!storedValue) {
    return initialValue;
  }

  try {
    return JSON.parse(storedValue);
  } catch {
    return initialValue;
  }
};

export const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => readStorageValue(key, initialValue));

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};
