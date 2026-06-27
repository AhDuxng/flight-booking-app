import * as service from './user.service.js';

export const getProfile = async (req, res, next) => {
  try {
    const profile = await service.getProfile(req.user.id);
    return res.status(200).json({
      message: 'Profile retrieved successfully',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const updated = await service.updateProfile(req.user.id, req.body);
    return res.status(200).json({
      message: 'Profile updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
