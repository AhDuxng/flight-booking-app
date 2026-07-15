import * as seatService from './seat.service.js';

export const getSeatsByFlight = async (req, res, next) => {
  try {
    const data = await seatService.getSeatsByFlight(req.query.flightId);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

export const holdSeat = async (req, res, next) => {
  try {
    await seatService.holdSeat(req.user.id, req.body);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const releaseSeat = async (req, res, next) => {
  try {
    await seatService.releaseSeat(req.user.id, req.params.seatId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
