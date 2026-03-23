'use strict';

const logger = require('../utils/logger');

/**
 * Global Express Error Handler
 * Must be registered LAST with app.use()
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log the full error internally
  logger.error(`${err.name || 'Error'}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Determine status code
  const status = err.status || err.statusCode || 500;
  const code   = err.code   || 'INTERNAL_ERROR';

  res.status(status).json({
    error: {
      code,
      message: status === 500
        ? 'An unexpected error occurred. Please try again later.'
        : err.message,
      status,
    },
  });
};

module.exports = errorHandler;
