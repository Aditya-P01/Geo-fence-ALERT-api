-- ============================================================
-- Migration 002: Performance Indexes
-- ============================================================

-- Alert queries by device (most common filter)
CREATE INDEX IF NOT EXISTS idx_alert_events_device_id
  ON alert_events (device_id);

-- Alert queries by fence
CREATE INDEX IF NOT EXISTS idx_alert_events_fence_id
  ON alert_events (fence_id);

-- Alert queries by time range
CREATE INDEX IF NOT EXISTS idx_alert_events_created_at
  ON alert_events (created_at DESC);

-- Alert queries by delivery status (for retry jobs)
CREATE INDEX IF NOT EXISTS idx_alert_events_delivery_status
  ON alert_events (delivery_status);

-- Fast lookup of active fences (used on every location update)
CREATE INDEX IF NOT EXISTS idx_geo_fences_active
  ON geo_fences (is_active);

-- Webhook lookups by active status
CREATE INDEX IF NOT EXISTS idx_webhooks_active
  ON webhooks (is_active);
