import * as service from './passenger.service.js';

export const getPassengerById = async (req, res, next) => {
  try {
    const passenger = await service.getPassengerById(req.user.id, req.user.role, req.params.id);
    return res.status(200).json({
      message: 'Passenger retrieved successfully',
      data: passenger
    });
  } catch (error) {
    next(error);
  }
};
