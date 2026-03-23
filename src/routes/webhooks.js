'use strict';

/**
 * Webhook routes — implemented in Part 3
 * Placeholder to prevent server startup errors.
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', (req, res) => {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Webhook management is implemented in Part 3.',
      status: 501,
    },
  });
});

module.exports = router;
