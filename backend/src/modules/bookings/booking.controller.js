import * as bookingService from './booking.service.js';

export const getMyBookings = async (req, res, next) => {
  try {
    const result = await bookingService.getMyBookings(req.user.id, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const getMyBookingById = async (req, res, next) => {
  try {
    const data = await bookingService.getMyBookingById(req.params.bookingId, req.user.id);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const data = await bookingService.createBooking(req.user.id, req.body);
    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const data = await bookingService.cancelBooking(req.params.bookingId, req.user.id);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
