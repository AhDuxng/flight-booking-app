import * as authService from './auth.service.js';

export const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.accessToken);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
