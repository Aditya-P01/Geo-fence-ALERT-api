'use strict';

/**
 * Joi Validation Middleware Factory
 *
 * Usage: router.post('/route', validate(mySchema), controller)
 *
 * @param {Joi.Schema} schema - Joi schema to validate req.body against
 * @returns {Function} Express middleware
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,    // report ALL errors, not just the first
    stripUnknown: true,   // remove extra fields not in schema
    convert: true,        // coerce types where safe (e.g. string "true" → true)
  });

  if (error) {
    const details = error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message.replace(/"/g, ''),
    }));

    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body validation failed',
        details,
        status: 400,
      },
    });
  }

  // Replace req.body with the validated (and stripped) value
  req.body = value;
  next();
};

module.exports = validate;
