'use strict';

/**
 * Seed script — creates sample fences and a test webhook for demo purposes.
 * Run: npm run seed
 */
require('dotenv').config();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Seeding sample data...\n');

    // Circle fence — School Zone
    const schoolId = uuidv4();
    await client.query(
      `INSERT INTO geo_fences (id, name, description, type, center_lat, center_lng, radius_m, events)
       VALUES ($1, $2, $3, 'circle', $4, $5, $6, ARRAY['ENTER','EXIT'])
       ON CONFLICT DO NOTHING`,
      [schoolId, 'School Zone', 'Alert when students enter or leave', 28.6139, 77.2090, 200]
    );
    console.log('✓ Circle fence: School Zone (200m radius, New Delhi)');

    // Polygon fence — Market Area
    const marketId = uuidv4();
    const marketCoords = [
      { lat: 28.6100, lng: 77.2000 },
      { lat: 28.6150, lng: 77.2000 },
      { lat: 28.6150, lng: 77.2100 },
      { lat: 28.6100, lng: 77.2100 },
      { lat: 28.6100, lng: 77.2000 },
    ];
    await client.query(
      `INSERT INTO geo_fences (id, name, description, type, polygon_json, events)
       VALUES ($1, $2, $3, 'polygon', $4, ARRAY['ENTER','EXIT'])
       ON CONFLICT DO NOTHING`,
      [marketId, 'Market Area', 'Track delivery bikes in the market zone', JSON.stringify(marketCoords)]
    );
    console.log('✓ Polygon fence: Market Area (Connaught Place area)');

    // Sample webhook
    await client.query(
      `INSERT INTO webhooks (id, url, description, event_types)
       VALUES ($1, $2, $3, ARRAY['ENTER','EXIT'])
       ON CONFLICT DO NOTHING`,
      [uuidv4(), 'https://webhook.site/your-unique-id', 'Test webhook receiver']
    );
    console.log('✓ Webhook: https://webhook.site/your-unique-id');

    console.log('\n✅ Seed complete!');
    console.log(`\n   School Zone fence ID:  ${schoolId}`);
    console.log(`   Market Area fence ID:  ${marketId}`);
    console.log('\n   Use these IDs to test the location endpoint:\n');
    console.log(`   curl -X POST http://localhost:3000/api/v1/locations/device-1 \\`);
    console.log(`     -H "Authorization: Bearer your-secret-api-key-change-this" \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"lat":28.6139,"lng":77.2090}'`);

  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
