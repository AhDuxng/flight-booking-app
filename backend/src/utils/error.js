export const createHttpError = (status, message, details = {}) => {
  return Object.assign(new Error(message, { cause: details.cause }), { status, ...details });
};

const databaseErrorDetails = (error) => ({
  cause: error,
  databaseCode: error.code,
  databaseDetails: error.details,
  databaseHint: error.hint,
});

const mentions = (error, value) =>
  [error?.message, error?.details, error?.hint].some((part) =>
    String(part ?? '')
      .toLowerCase()
      .includes(value.toLowerCase()),
  );

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

  if (
    (error.code === '42883' && mentions(error, 'gen_random_bytes')) ||
    (error.code === 'PGRST202' && mentions(error, 'create_booking_v2'))
  ) {
    throw createHttpError(503, 'Database checkout migration is required', {
      code: 'DATABASE_MIGRATION_REQUIRED',
      ...databaseErrorDetails(error),
    });
  }

  if (['40001', '40P01', '55P03'].includes(error.code)) {
    throw createHttpError(409, 'Database transaction must be retried', {
      code: 'DATABASE_RETRY_REQUIRED',
      ...databaseErrorDetails(error),
    });
  }

  if (error.code === '23514') {
    const inventoryConflict = mentions(error, 'seats_hold_state_check');
    throw createHttpError(inventoryConflict ? 409 : 422, 'Database constraint was violated', {
      code: inventoryConflict ? 'INVENTORY_STATE_CONFLICT' : 'DATA_CONSTRAINT_VIOLATION',
      ...databaseErrorDetails(error),
    });
  }

  if (error.code === '23502') {
    throw createHttpError(422, 'Required data is missing', {
      code: 'REQUIRED_DATA_MISSING',
      ...databaseErrorDetails(error),
    });
  }

  if (['22003', '22007', '22P02'].includes(error.code)) {
    throw createHttpError(422, 'Database input is invalid', {
      code: 'INVALID_DATABASE_INPUT',
      ...databaseErrorDetails(error),
    });
  }

  const businessCode = String(error.message ?? '').match(/\b[A-Z][A-Z0-9_]{2,}\b/)?.[0];
  if (error.code === 'P0001' && businessCode) {
    const conflictCodes = new Set([
      'BOOKING_PRICE_LOCKED',
      'CHANGE_QUOTE_EXPIRED',
      'IDEMPOTENCY_CONFLICT',
      'INSUFFICIENT_SEATS',
      'PAYMENT_ALREADY_EXISTS',
      'PAYMENT_AMOUNT_MISMATCH',
      'PAYMENT_CURRENCY_MISMATCH',
      'PAYMENT_PROVIDER_MISMATCH',
      'PAYMENT_PRICE_VERSION_MISMATCH',
      'REFUND_ALREADY_PROCESSING',
      'MANDATORY_REFUND_CANNOT_BE_REJECTED',
      'SEAT_CHANGE_AFTER_CHECK_IN_NOT_ALLOWED',
      'SEAT_NOT_AVAILABLE',
    ]);
    const notFoundCodes = new Set([
      'BOOKING_NOT_FOUND',
      'FLIGHT_NOT_FOUND',
      'PASSENGER_NOT_OWNED',
      'PAYMENT_NOT_FOUND',
      'REFUND_NOT_FOUND',
      'CHANGE_QUOTE_NOT_FOUND',
    ]);
    const status =
      businessCode === 'FORBIDDEN'
        ? 403
        : notFoundCodes.has(businessCode)
          ? 404
          : conflictCodes.has(businessCode)
            ? 409
            : 422;
    throw createHttpError(status, businessCode.replaceAll('_', ' ').toLowerCase(), {
      code: businessCode,
      cause: error,
    });
  }

  if (error.code === 'P0002') {
    throw createHttpError(422, fallbackMessage, { cause: error, code: 'BUSINESS_RULE_VIOLATION' });
  }

  throw createHttpError(500, fallbackMessage, {
    ...databaseErrorDetails(error),
  });
};
