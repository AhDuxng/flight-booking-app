import aircraftService from './aircraft.service.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await aircraftService.getAircraftsService();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await aircraftService.getAircraftByIdService(req.params.id);
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
    const data = await aircraftService.createAircraftService(req.body);
    return res.status(201).json({ success: true, message: 'Thêm máy bay thành công!', data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await aircraftService.updateAircraftService(req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Cập nhật máy bay thành công!', data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await aircraftService.deleteAircraftService(req.params.id);
    return res.status(200).json({ success: true, message: 'Xóa máy bay thành công!' });
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
