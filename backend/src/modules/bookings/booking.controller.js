import * as service from './booking.service.js';

export const createBooking = async (req, res, next) => {
  try {
    const result = await service.createBooking(req.user.id, req.body);
    return res.status(201).json({
      message: 'Booking created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const bookings = await service.getBookingsByUserId(req.user.id);
    return res.status(200).json({
      message: 'Bookings retrieved successfully',
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingDetails = async (req, res, next) => {
  try {
    const booking = await service.getBookingDetailsById(req.user.id, req.user.role, req.params.id);
    return res.status(200).json({
      message: 'Booking details retrieved successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const result = await service.cancelBooking(req.user.id, req.user.role, req.params.id);
    return res.status(200).json({
      message: 'Booking cancelled successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
