const sanitize = (fields) =>
  Object.fromEntries(
    Object.entries(fields).filter(
      ([key, value]) =>
        value !== undefined &&
        value !== null &&
        !/password|token|secret|authorization|passport|card|cvv/i.test(key),
    ),
  );

const write = (level, event, fields = {}) => {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...sanitize(fields),
  });
  (level === 'error' ? console.error : console.log)(entry);
};

export const logger = {
  error: (event, fields) => write('error', event, fields),
  info: (event, fields) => write('info', event, fields),
  warn: (event, fields) => write('warn', event, fields),
};
