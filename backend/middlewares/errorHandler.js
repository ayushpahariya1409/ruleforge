const ApiError = require('../utils/ApiError');
const { nodeEnv } = require('../config/env');

/**
 * Global error handler middleware.
 * Catches all errors and returns a consistent JSON response.
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = ApiError.badRequest(`Duplicate value for '${field}'. This ${field} already exists.`);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = ApiError.badRequest('Validation failed', details);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  const response = {
    success: false,
    error: message,
  };

  if (error.details) {
    response.details = error.details;
  }

  // Include stack trace in development
  if (nodeEnv === 'development' && statusCode === 500) {
    response.stack = err.stack;
  }

  if (statusCode === 500) {
    console.error('💥 Internal Error:', err);
  }

  res.status(statusCode).json(response);
};

module.exports = { errorHandler };
