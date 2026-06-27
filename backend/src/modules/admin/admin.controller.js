import * as service from './admin.service.js';

export const getStats = async (req, res, next) => {
  try {
    const stats = await service.getDashboardStats();
    return res.status(200).json({
      message: 'Dashboard statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

export const getLogs = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;
    const logs = await service.getAdminLogs(limit, offset);
    return res.status(200).json({
      message: 'Admin logs retrieved successfully',
      data: logs
    });
  } catch (error) {
    next(error);
  }
};
