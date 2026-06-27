const REQUEST_LOCATIONS = ['body', 'query', 'params'];

const isRequestSchema = (schema) => {
  return REQUEST_LOCATIONS.some((location) => schema?.[location]);
};

const formatZodError = (error) => {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
};

const parseWithSchema = (schema, value) => {
  if (typeof schema?.safeParse !== 'function') {
    throw Object.assign(new Error('Invalid Zod validation schema'), { status: 500 });
  }

  const result = schema.safeParse(value);

  if (!result.success) {
    return { error: formatZodError(result.error) };
  }

  return { value: result.data };
};

export const validate = (schema) => (req, res, next) => {
  const schemasByLocation = isRequestSchema(schema) ? schema : { body: schema };

  for (const location of REQUEST_LOCATIONS) {
    if (!schemasByLocation[location]) {
      continue;
    }

    const { error, value } = parseWithSchema(schemasByLocation[location], req[location]);

    if (error) {
      return res.status(400).json({ error });
    }

    req[location] = value;
  }

  return next();
};
