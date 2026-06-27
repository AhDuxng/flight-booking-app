export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate req.body, req.query, or req.params depending on how schema is structured
      // Usually, schema is a Zod object or we validate parts specifically.
      // To keep it simple and clean, if schema is a ZodObject containing body/query/params:
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Mutate requests to have parsed/typed values
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;
      
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

export default validate;
