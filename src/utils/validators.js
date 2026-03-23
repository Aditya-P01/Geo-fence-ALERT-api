'use strict';

const Joi = require('joi');

// ── Coordinate helpers ────────────────────────────────────────
const lat = Joi.number().min(-90).max(90).required();
const lng = Joi.number().min(-180).max(180).required();

const coordinatePair = Joi.object({ lat, lng });

// ── Fence Schema ──────────────────────────────────────────────
const fenceSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  description: Joi.string().trim().max(1000).optional().allow(''),
  type: Joi.string().valid('circle', 'polygon').required(),

  // Circle-specific fields
  center: Joi.when('type', {
    is: 'circle',
    then: coordinatePair.required(),
    otherwise: Joi.forbidden(),
  }),
  radius_meters: Joi.when('type', {
    is: 'circle',
    then: Joi.number().positive().max(50000).required(), // max 50km
    otherwise: Joi.forbidden(),
  }),

  // Polygon-specific fields
  coordinates: Joi.when('type', {
    is: 'polygon',
    then: Joi.array()
      .items(coordinatePair)
      .min(4)              // need at least 3 vertices + closing point
      .required(),
    otherwise: Joi.forbidden(),
  }),

  events: Joi.array()
    .items(Joi.string().valid('ENTER', 'EXIT'))
    .default(['ENTER', 'EXIT']),

  metadata: Joi.object().default({}),
});

// ── Fence Update Schema (all fields optional) ─────────────────
const fenceUpdateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255),
  description: Joi.string().trim().max(1000).allow(''),
  events: Joi.array().items(Joi.string().valid('ENTER', 'EXIT')),
  metadata: Joi.object(),
  is_active: Joi.boolean(),
});

// ── Location Schema ───────────────────────────────────────────
const locationSchema = Joi.object({
  lat: lat,
  lng: lng,
  timestamp: Joi.date().iso().optional().default(() => new Date()),
  metadata: Joi.object().default({}),
});

// ── Webhook Schema ────────────────────────────────────────────
const webhookSchema = Joi.object({
  url: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
  description: Joi.string().trim().max(500).optional().allow(''),
  fence_ids: Joi.array().items(Joi.string().uuid()).optional().allow(null),
  event_types: Joi.array()
    .items(Joi.string().valid('ENTER', 'EXIT'))
    .default(['ENTER', 'EXIT']),
  secret: Joi.string().min(8).max(255).optional().allow(''),
});

module.exports = {
  fenceSchema,
  fenceUpdateSchema,
  locationSchema,
  webhookSchema,
};
