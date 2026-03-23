'use strict';

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const redis = require('../config/redis');

/**
 * GET /api/v1/health
 * No auth required — tests DB and Redis connectivity.
 */
router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  // Test PostgreSQL
  try {
    await db.query('SELECT 1');
    health.services.database = 'connected';
  } catch {
    health.services.database = 'error';
    health.status = 'degraded';
  }

  // Test Redis
  try {
    const pong = await redis.ping();
    health.services.redis = pong === 'PONG' ? 'connected' : 'error';
  } catch {
    health.services.redis = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
