import React, { createContext, useContext, useState } from 'react';
import api from '../services/api.js';

export const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
  const [currentBooking, setCurrentBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  const createBooking = async (bookingData) => {
    setLoading(true);
    try {
      const response = await api.post('/bookings', bookingData);
      setCurrentBooking(response.data.data);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    } finally {
      setLoading(false);
    }
  };

  const getMyBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bookings');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    } finally {
      setLoading(false);
    }
  };

  const getBookingDetails = async (id) => {
    setLoading(true);
    try {
      const response = await api.get(`/bookings/${id}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id) => {
    setLoading(true);
    try {
      const response = await api.post(`/bookings/${id}/cancel`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    } finally {
      setLoading(false);
    }
  };

  const validateDiscount = async (code, orderValue) => {
    try {
      const response = await api.post('/discounts/validate', { code, order_value: orderValue });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const processPayment = async (paymentData) => {
    setLoading(true);
    try {
      const response = await api.post('/payments/process', paymentData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentBooking,
    loading,
    setCurrentBooking,
    createBooking,
    getMyBookings,
    getBookingDetails,
    cancelBooking,
    validateDiscount,
    processPayment
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
};
export default BookingProvider;
