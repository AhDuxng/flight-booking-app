import * as userService from './user.service.js';

export const getMe = async (req, res, next) => {
  try {
    const data = await userService.getMyProfile(req.user);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const data = await userService.updateMyProfile(req.user, req.body);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    const data = await userService.uploadMyAvatar(req.user, req.file);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
