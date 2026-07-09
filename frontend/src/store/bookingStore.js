import { useSyncExternalStore } from "react";

const initialState = {
  passengerInfo: null,
  selectedFlight: null,
  selectedSeats: [],
};

let state = initialState;
const listeners = new Set();

const emit = () => {
  listeners.forEach((listener) => listener());
};

const setState = (nextState) => {
  state = nextState;
  emit();
};

const subscribe = (listener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const bookingStore = {
  addSeat: (seat) => {
    const seatExists = state.selectedSeats.some((selectedSeat) => selectedSeat.code === seat.code || selectedSeat.id === seat.id);
    if (seatExists) {
      return;
    }

    setState({
      ...state,
      selectedSeats: [...state.selectedSeats, seat],
    });
  },
  getState: () => state,
  removeSeat: (seatId) => {
    setState({
      ...state,
      selectedSeats: state.selectedSeats.filter((seat) => seat.id !== seatId && seat.code !== seatId),
    });
  },
  reset: () => {
    setState(initialState);
  },
  setPassengerInfo: (passengerInfo) => {
    setState({
      ...state,
      passengerInfo,
    });
  },
  setSelectedFlight: (selectedFlight) => {
    setState({
      ...state,
      selectedFlight,
      selectedSeats: [],
    });
  },
};

export const useBookingStore = (selector = (currentState) => currentState) => {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initialState),
  );
};
