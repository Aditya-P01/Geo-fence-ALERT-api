'use strict';

const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const redis = require('../config/redis');
const logger = require('../utils/logger');

const FENCE_CACHE_KEY = 'fences:active';
const FENCE_CACHE_TTL = parseInt(process.env.FENCE_CACHE_TTL || '300', 10);

/** Remove cached fence list so next request reloads from DB */
async function invalidateCache() {
  await redis.del(FENCE_CACHE_KEY);
  logger.debug('Fence cache invalidated');
}

// ── CREATE ────────────────────────────────────────────────────
const createFence = async (req, res, next) => {
  try {
    const {
      name, description, type,
      center, radius_meters,
      coordinates, events, metadata,
    } = req.body;

    const id = uuidv4();

    // Map request fields to DB columns
    const centerLat    = center ? center.lat : null;
    const centerLng    = center ? center.lng : null;
    const radiusM      = radius_meters || null;
    const polygonJson  = coordinates ? JSON.stringify(coordinates) : null;

    const result = await db.query(
      `INSERT INTO geo_fences
         (id, name, description, type, center_lat, center_lng, radius_m,
          polygon_json, events, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, name, description || null, type, centerLat, centerLng, radiusM,
       polygonJson, events, JSON.stringify(metadata || {})]
    );

    await invalidateCache();

    logger.info(`Fence created: ${id} (${name}, ${type})`);
    res.status(201).json(formatFence(result.rows[0]));
  } catch (err) {
    next(err);
  }
};

// ── READ ALL ──────────────────────────────────────────────────
const getAllFences = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || '1', 10));
    const limit  = Math.min(100, parseInt(req.query.limit || '20', 10));
    const offset = (page - 1) * limit;

    // Optional filters
    const activeOnly = req.query.active !== 'false';   // default: only active
    const typeFilter = req.query.type;                  // 'circle' | 'polygon'

    let whereClause = activeOnly ? 'WHERE is_active = TRUE' : '';
    const params = [];

    if (typeFilter) {
      whereClause += activeOnly ? ' AND' : ' WHERE';
      params.push(typeFilter);
      whereClause += ` type = $${params.length}`;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) FROM geo_fences ${whereClause}`,
      params
    );

    params.push(limit, offset);
    const dataResult = await db.query(
      `SELECT * FROM geo_fences ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      fences: dataResult.rows.map(formatFence),
      total:  parseInt(countResult.rows[0].count, 10),
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

// ── READ ONE ──────────────────────────────────────────────────
const getFenceById = async (req, res, next) => {
  try {
    const { fenceId } = req.params;
    const result = await db.query(
      'SELECT * FROM geo_fences WHERE id = $1',
      [fenceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'FENCE_NOT_FOUND', message: `No fence found with id: ${fenceId}`, status: 404 }
      });
    }

    res.json(formatFence(result.rows[0]));
  } catch (err) {
    next(err);
  }
};

// ── UPDATE ────────────────────────────────────────────────────
const updateFence = async (req, res, next) => {
  try {
    const { fenceId } = req.params;
    const { name, description, events, metadata, is_active } = req.body;

    const result = await db.query(
      `UPDATE geo_fences
       SET name        = COALESCE($1, name),
           description = COALESCE($2, description),
           events      = COALESCE($3, events),
           metadata    = COALESCE($4, metadata),
           is_active   = COALESCE($5, is_active),
           updated_at  = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        name || null,
        description !== undefined ? description : null,
        events || null,
        metadata ? JSON.stringify(metadata) : null,
        is_active !== undefined ? is_active : null,
        fenceId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'FENCE_NOT_FOUND', message: `No fence found with id: ${fenceId}`, status: 404 }
      });
    }

    await invalidateCache();

    logger.info(`Fence updated: ${fenceId}`);
    res.json(formatFence(result.rows[0]));
  } catch (err) {
    next(err);
  }
};

// ── DELETE (soft) ─────────────────────────────────────────────
const deleteFence = async (req, res, next) => {
  try {
    const { fenceId } = req.params;

    const result = await db.query(
      `UPDATE geo_fences
       SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1 AND is_active = TRUE
       RETURNING id`,
      [fenceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'FENCE_NOT_FOUND', message: `No active fence found with id: ${fenceId}`, status: 404 }
      });
    }

    await invalidateCache();

    logger.info(`Fence soft-deleted: ${fenceId}`);
    res.json({ message: 'Fence deleted successfully', id: fenceId });
  } catch (err) {
    next(err);
  }
};

// ── Helper: format DB row → API response ──────────────────────
function formatFence(row) {
  const fence = {
    id:          row.id,
    name:        row.name,
    description: row.description,
    type:        row.type,
    events:      row.events,
    is_active:   row.is_active,
    metadata:    row.metadata || {},
    created_at:  row.created_at,
    updated_at:  row.updated_at,
  };

  if (row.type === 'circle') {
    fence.center       = { lat: row.center_lat, lng: row.center_lng };
    fence.radius_meters = row.radius_m;
  } else {
    fence.coordinates = typeof row.polygon_json === 'string'
      ? JSON.parse(row.polygon_json)
      : row.polygon_json;
  }

  return fence;
}

module.exports = {
  createFence,
  getAllFences,
  getFenceById,
  updateFence,
  deleteFence,
};
