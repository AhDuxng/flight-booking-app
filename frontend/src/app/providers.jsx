import React from 'react';
import { AuthProvider } from '../store/authStore.jsx';
import { FlightProvider } from '../store/flightStore.jsx';
import { BookingProvider } from '../store/bookingStore.jsx';
import { NotificationProvider } from '../store/notificationStore.jsx';

export const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <FlightProvider>
        <BookingProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </BookingProvider>
      </FlightProvider>
    </AuthProvider>
  );
};

export default AppProviders;
