import airlineService from './airline.service.js';

export const getAll = async (req, res, next) => {
  try {
    const activeOnly = req.query.active === 'true';
    const data = await airlineService.getAirlinesService(activeOnly);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await airlineService.getAirlineByIdService(req.params.id);
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
    const data = await airlineService.createAirlineService(req.body);
    return res.status(201).json({ success: true, message: 'Thêm hãng hàng không thành công!', data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await airlineService.updateAirlineService(req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Cập nhật hãng hàng không thành công!', data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await airlineService.deleteAirlineService(req.params.id);
    return res.status(200).json({ success: true, message: 'Xóa hãng hàng không thành công!' });
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
