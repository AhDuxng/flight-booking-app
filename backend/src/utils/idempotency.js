import { createHash } from 'node:crypto';

export const stableStringify = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
};

export const hashRequest = (value) =>
  createHash('sha256').update(stableStringify(value)).digest('hex');

export const normalizeIdempotencyKey = (value, { required = false } = {}) => {
  const key = typeof value === 'string' ? value.trim() : '';
  if (!key && !required) return null;
  if (key.length < 8 || key.length > 200 || !/^[A-Za-z0-9._:-]+$/.test(key)) {
    const error = new Error(required ? 'A valid Idempotency-Key header is required' : 'Invalid Idempotency-Key header');
    error.status = 400;
    error.code = 'INVALID_IDEMPOTENCY_KEY';
    throw error;
  }
  return key;
};
