import * as queries from './user.queries.js';

export const getProfile = async (id) => {
  return await queries.getProfile(id);
};

export const updateProfile = async (id, profileData) => {
  return await queries.updateProfile(id, profileData);
};
