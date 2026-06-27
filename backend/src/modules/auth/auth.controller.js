import * as service from './auth.service.js';
import * as queries from './auth.queries.js';

export const signup = async (req, res, next) => {
  try {
    const result = await service.signup(req.body);
    return res.status(201).json({
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await service.login(email, password);
    return res.status(200).json({
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const profile = await queries.getUserProfileById(req.user.id);
    return res.status(200).json({
      message: 'User profile retrieved successfully',
      data: {
        user: req.user,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};
