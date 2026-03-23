-- ============================================================
-- Migration 001: Initial Schema
-- Creates: geo_fences, alert_events, webhooks
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── geo_fences ────────────────────────────────────────────────
-- Stores fence definitions (circles and polygons)
CREATE TABLE IF NOT EXISTS geo_fences (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  description   TEXT,

  -- Fence type: 'circle' or 'polygon'
  type          VARCHAR(20) NOT NULL CHECK (type IN ('circle', 'polygon')),

  -- Circle fence fields (required when type = 'circle')
  center_lat    DOUBLE PRECISION,
  center_lng    DOUBLE PRECISION,
  radius_m      DOUBLE PRECISION,           -- radius in metres

  -- Polygon fence fields (required when type = 'polygon')
  polygon_json  JSONB,                       -- GeoJSON coordinate array

  -- Which events to monitor
  events        TEXT[] NOT NULL DEFAULT ARRAY['ENTER', 'EXIT'],

  -- Soft-delete flag
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,

  -- Arbitrary extra data
  metadata      JSONB DEFAULT '{}',

  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT circle_fields_required CHECK (
    type <> 'circle' OR (center_lat IS NOT NULL AND center_lng IS NOT NULL AND radius_m IS NOT NULL)
  ),
  CONSTRAINT polygon_fields_required CHECK (
    type <> 'polygon' OR polygon_json IS NOT NULL
  )
);

-- ── alert_events ──────────────────────────────────────────────
-- Permanent log of every ENTER / EXIT event
CREATE TABLE IF NOT EXISTS alert_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fence_id        UUID NOT NULL REFERENCES geo_fences(id) ON DELETE CASCADE,
  device_id       VARCHAR(255) NOT NULL,
  event_type      VARCHAR(10) NOT NULL CHECK (event_type IN ('ENTER', 'EXIT')),
  device_lat      DOUBLE PRECISION NOT NULL,
  device_lng      DOUBLE PRECISION NOT NULL,
  delivery_status VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (delivery_status IN ('pending', 'delivered', 'failed')),
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── webhooks ──────────────────────────────────────────────────
-- Registered HTTP endpoints that receive alert payloads
CREATE TABLE IF NOT EXISTS webhooks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url         TEXT NOT NULL,
  description TEXT,
  fence_ids   UUID[],                        -- NULL = all fences
  event_types TEXT[] DEFAULT ARRAY['ENTER', 'EXIT'],
  secret      TEXT,                          -- optional HMAC signing secret
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
