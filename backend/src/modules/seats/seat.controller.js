import * as service from './seat.service.js';

export const getSeats = async (req, res, next) => {
  try {
    const { flight_id } = req.query;
    const seats = await service.getSeatsByFlightId(flight_id);
    return res.status(200).json({
      message: 'Seats retrieved successfully',
      data: seats
    });
  } catch (error) {
    next(error);
  }
};

export const holdSeat = async (req, res, next) => {
  try {
    const { seat_id, booking_id } = req.body;
    await service.holdSeat(seat_id, booking_id);
    return res.status(200).json({
      message: 'Seat held successfully'
    });
  } catch (error) {
    next(error);
  }
};
