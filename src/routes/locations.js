'use strict';

/**
 * Location routes — implemented in Part 2 (Core Detection Engine)
 * Placeholder to prevent server startup errors.
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.use(auth);

router.post('/:deviceId', (req, res) => {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Location processing is implemented in Part 2. Stay tuned!',
      status: 501,
    },
  });
});

module.exports = router;
