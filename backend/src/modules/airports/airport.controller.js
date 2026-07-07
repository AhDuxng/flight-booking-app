import airportService from './airport.service.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await airportService.getAirportsService();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await airportService.getAirportByIdService(req.params.id);
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
    const data = await airportService.createAirportService(req.body);
    return res.status(201).json({ success: true, message: 'Thêm sân bay thành công!', data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await airportService.updateAirportService(req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Cập nhật sân bay thành công!', data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await airportService.deleteAirportService(req.params.id);
    return res.status(200).json({ success: true, message: 'Xóa sân bay thành công!' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export default {
  getAll,
  getById,
  create,
  update,
  remove,
};
