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

export const refreshSession = async (req, res, next) => {
  try {
    const data = await authService.refreshSession(req.body.refreshToken);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

export const requestPasswordReset = async (req, res, next) => {
  try {
    await authService.requestPasswordReset(req.body.email);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const getOAuthUrl = async (req, res, next) => {
  try {
    const url = await authService.getOAuthUrl(req.params.provider);
    return res.json({ data: { url } });
  } catch (error) {
    return next(error);
  }
};

export const getSession = async (req, res, next) => {
  try {
    const data = await authService.getSession(req.user, req.accessToken);
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
