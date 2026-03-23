'use strict';

const Redis = require('ioredis');
const logger = require('../utils/logger');

const redis = new Redis(process.env.REDIS_URL || {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
}, {
  // Reconnect with exponential backoff (max 30s)
  retryStrategy(times) {
    const delay = Math.min(times * 200, 30000);
    logger.warn(`Redis: reconnecting in ${delay}ms (attempt ${times})`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on('connect', () => logger.info('Redis: connected'));
redis.on('ready',   () => logger.info('Redis: ready'));
redis.on('error',   (err) => logger.error('Redis error:', err.message));
redis.on('close',   () => logger.warn('Redis: connection closed'));

module.exports = redis;
