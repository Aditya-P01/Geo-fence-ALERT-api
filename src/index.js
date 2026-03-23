'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

const healthRouter = require('./routes/health');
const fencesRouter = require('./routes/fences');

const app = express();

// ── Security & Utility Middleware ──────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', {
  stream: { write: msg => logger.info(msg.trim()) }
}));

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/fences', fencesRouter);

// Placeholder routes (implemented in Part 2 & 3)
app.use('/api/v1/locations', require('./routes/locations'));
app.use('/api/v1/alerts', require('./routes/alerts'));
app.use('/api/v1/webhooks', require('./routes/webhooks'));

// ── 404 Handler ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found`, status: 404 }
  });
});

// ── Global Error Handler ───────────────────────────────────────
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 Geo-Fence Alert API running on port ${PORT}`);
});

// ── Graceful Shutdown ──────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    try {
      const db = require('./config/db');
      const redis = require('./config/redis');
      await db.pool.end();
      await redis.quit();
      logger.info('Connections closed. Bye!');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app; // for testing
