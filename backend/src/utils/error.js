export const createHttpError = (status, message, details = {}) => {
  return Object.assign(new Error(message, { cause: details.cause }), { status, ...details });
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
    cause: error,
    databaseCode: error.code,
    databaseDetails: error.details,
    databaseHint: error.hint,
  });
};
