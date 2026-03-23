'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { fenceSchema, fenceUpdateSchema } = require('../utils/validators');
const {
  createFence,
  getAllFences,
  getFenceById,
  updateFence,
  deleteFence,
} = require('../controllers/fenceController');

// All fence routes require API key authentication
router.use(auth);

router.get('/',           getAllFences);
router.post('/',          validate(fenceSchema),       createFence);
router.get('/:fenceId',   getFenceById);
router.put('/:fenceId',   validate(fenceUpdateSchema), updateFence);
router.delete('/:fenceId', deleteFence);

module.exports = router;
