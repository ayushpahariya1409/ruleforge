/**
 * Wraps an async route handler to catch errors and pass them to next().
 * Eliminates try-catch boilerplate in controllers.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
