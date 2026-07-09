import { useSyncExternalStore } from "react";

const initialState = {
  recentSearches: [],
  searchDraft: {
    cabin: "economy",
    destination: "HAN",
    flightType: "round-trip",
    origin: "SGN",
    passengers: 1,
  },
};

let state = initialState;
const listeners = new Set();

const setState = (nextState) => {
  state = nextState;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const flightStore = {
  addRecentSearch: (search) => {
    setState({
      ...state,
      recentSearches: [search, ...state.recentSearches.filter((item) => item.id !== search.id)].slice(0, 5),
    });
  },
  getState: () => state,
  resetSearchDraft: () => {
    setState({
      ...state,
      searchDraft: initialState.searchDraft,
    });
  },
  setSearchDraft: (searchDraft) => {
    setState({
      ...state,
      searchDraft: {
        ...state.searchDraft,
        ...searchDraft,
      },
    });
  },
};

export const useFlightStore = (selector = (currentState) => currentState) => {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initialState),
  );
};
