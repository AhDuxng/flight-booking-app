import baggageService from './baggage.service.js';

export const getByFlightId = async (req, res, next) => {
  try {
    const data = await baggageService.getBaggageByFlightService(req.params.flightId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await baggageService.getBaggageByIdService(req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await baggageService.createBaggageService(req.body);
    return res.status(201).json({ success: true, message: 'Thêm gói hành lý thành công!', data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await baggageService.updateBaggageService(req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Cập nhật gói hành lý thành công!', data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await baggageService.deleteBaggageService(req.params.id);
    return res.status(200).json({ success: true, message: 'Xóa gói hành lý thành công!' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export default {
  getByFlightId,
  getById,
  create,
  update,
  remove,
};
