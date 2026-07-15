import * as adminService from './admin.service.js';

const sendList = (service) => async (req, res, next) => {
  try {
    const result = await service(req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const getDashboard = async (req, res, next) => {
  try {
    const data = await adminService.getDashboard();
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

export const getFlights = sendList(adminService.getFlights);
export const getBookings = sendList(adminService.getBookings);
export const getPayments = sendList(adminService.getPayments);
export const getReviews = sendList(adminService.getReviews);
export const getUsers = sendList(adminService.getUsers);

export const createFlight = async (req, res, next) => {
  try {
    const data = await adminService.createFlight(req.user.id, req.body);
    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
};

export const updateFlight = async (req, res, next) => {
  try {
    const data = await adminService.updateFlight(req.user.id, req.params.flightId, req.body);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
