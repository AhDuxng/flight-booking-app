import { useSyncExternalStore } from "react";

const initialState = {
  isOpen: false,
  unreadCount: 0,
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

export const notificationStore = {
  close: () => {
    setState({ ...state, isOpen: false });
  },
  getState: () => state,
  markAllRead: () => {
    setState({ ...state, unreadCount: 0 });
  },
  open: () => {
    setState({ ...state, isOpen: true });
  },
  setUnreadCount: (unreadCount) => {
    setState({ ...state, unreadCount });
  },
  toggle: () => {
    setState({ ...state, isOpen: !state.isOpen });
  },
};

export const useNotificationStore = (selector = (currentState) => currentState) => {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initialState),
  );
};
