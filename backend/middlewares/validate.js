const ApiError = require('../utils/ApiError');

/**
 * Joi validation middleware factory.
 * Validates req.body against the provided Joi schema.
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }

    req.body = value; // Use sanitized values
    next();
  };
};

module.exports = { validate };
