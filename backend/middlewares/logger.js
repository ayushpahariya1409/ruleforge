const morgan = require('morgan');

/**
 * Request logging middleware using morgan.
 * Uses 'dev' format in development, 'combined' in production.
 */
const logger = (nodeEnv) => {
  if (nodeEnv === 'production') {
    return morgan('combined');
  }
  return morgan('dev');
};

module.exports = { logger };
