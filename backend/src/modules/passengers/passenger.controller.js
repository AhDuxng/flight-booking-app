import * as passengerService from './passenger.service.js';

export const getPassengersByBooking = async (req, res, next) => {
  try {
    const data = await passengerService.getPassengersByBooking(req.params.bookingId, req.user.id);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
