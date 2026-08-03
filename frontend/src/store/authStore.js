import { useSyncExternalStore } from "react";

const storageKey = "vietfly-auth";

const initialState = {
  isAuthenticated: false,
  expiresAt: null,
  rememberMe: false,
  refreshToken: null,
  token: null,
  user: null,
};

const readState = () => {
  if (typeof window === "undefined") {
    return initialState;
  }

  const localValue = window.localStorage.getItem(storageKey);
  const sessionValue = window.sessionStorage.getItem(storageKey);
  const storedValue = localValue ?? sessionValue;
  if (!storedValue) {
    return initialState;
  }

  try {
    const parsedValue = JSON.parse(storedValue);
    return {
      ...initialState,
      ...parsedValue,
      isAuthenticated: Boolean(parsedValue.token),
      rememberMe: localValue ? true : Boolean(parsedValue.rememberMe),
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
    window.localStorage.removeItem(storageKey);
    window.sessionStorage.removeItem(storageKey);
    const storage = nextState.rememberMe ? window.localStorage : window.sessionStorage;
    storage.setItem(storageKey, JSON.stringify(nextState));
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
    state = initialState;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
      window.sessionStorage.removeItem(storageKey);
    }
    listeners.forEach((listener) => listener());
  },
  getState: () => state,
  setAuth: (user, token, refreshToken = null, expiresAt = null, rememberMe = state.rememberMe) => {
    writeState({
      expiresAt,
      isAuthenticated: Boolean(token),
      rememberMe,
      refreshToken,
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
