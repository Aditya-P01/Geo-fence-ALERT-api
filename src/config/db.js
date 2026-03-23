'use strict';

const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: parseInt(process.env.DB_POOL_MIN || '2', 10),
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  logger.debug('PostgreSQL: new client connected');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error:', err.message);
});

/**
 * Execute a parameterized SQL query.
 * @param {string} text - SQL statement
 * @param {Array}  params - Query parameters
 * @returns {Promise<QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
