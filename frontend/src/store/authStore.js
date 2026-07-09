import { useSyncExternalStore } from "react";

const storageKey = "vietfly-auth";

const initialState = {
  isAuthenticated: false,
  token: null,
  user: null,
};

const readState = () => {
  if (typeof window === "undefined") {
    return initialState;
  }

  const storedValue = window.localStorage.getItem(storageKey);
  if (!storedValue) {
    return initialState;
  }

  try {
    const parsedValue = JSON.parse(storedValue);
    return {
      ...initialState,
      ...parsedValue,
      isAuthenticated: Boolean(parsedValue.token),
    };
  } catch {
    return initialState;
  }
};

let state = readState();
const listeners = new Set();

const writeState = (nextState) => {
  state = nextState;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey, JSON.stringify(nextState));
  }

  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const authStore = {
  clearAuth: () => {
    writeState(initialState);
  },
  getState: () => state,
  setAuth: (user, token) => {
    writeState({
      isAuthenticated: Boolean(token),
      token,
      user,
    });
  },
  updateUser: (user) => {
    writeState({
      ...state,
      user,
    });
  },
};

export const useAuthStore = (selector = (currentState) => currentState) => {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initialState),
  );
};
