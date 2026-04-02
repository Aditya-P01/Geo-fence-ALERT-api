'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', (req, res) => {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Alert history is implemented in Part 3.',
      status: 501,
    },
  });
});

module.exports = router;
