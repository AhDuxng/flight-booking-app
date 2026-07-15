export const createHttpError = (status, message) => {
  return Object.assign(new Error(message), { status });
};

export const throwDatabaseError = (error, fallbackMessage = 'Database request failed') => {
  if (!error) {
    return;
  }

  if (error.code === '23505') {
    throw createHttpError(409, 'This record already exists');
  }

  if (error.code === '23503') {
    throw createHttpError(409, 'This record is still in use');
  }

  if (error.code === 'PGRST116') {
    throw createHttpError(404, 'Record not found');
  }

  throw createHttpError(500, fallbackMessage);
};
