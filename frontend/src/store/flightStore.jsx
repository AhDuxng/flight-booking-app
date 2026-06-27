import React, { createContext, useContext, useState } from 'react';
import api from '../services/api.js';

export const FlightContext = createContext(null);

export const FlightProvider = ({ children }) => {
  const [flights, setFlights] = useState([]);
  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: '',
    departure_date: '',
    passengers: '',
    seat_class: ''
  });
  const [loading, setLoading] = useState(false);

  const searchFlights = async (params) => {
    setLoading(true);
    setSearchParams(params);
    try {
      const response = await api.get('/flights', { params });
      setFlights(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to search flights:', error);
      setFlights([]);
      throw error.response?.data || error;
    } finally {
      setLoading(false);
    }
  };

  const getFlightById = async (id) => {
    try {
      const response = await api.get(`/flights/${id}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const getSeats = async (flightId) => {
    try {
      const response = await api.get('/seats', { params: { flight_id: flightId } });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const value = {
    flights,
    searchParams,
    loading,
    searchFlights,
    getFlightById,
    getSeats
  };

  return <FlightContext.Provider value={value}>{children}</FlightContext.Provider>;
};

export const useFlights = () => {
  const context = useContext(FlightContext);
  if (!context) {
    throw new Error('useFlights must be used within a FlightProvider');
  }
  return context;
};
export default FlightProvider;
