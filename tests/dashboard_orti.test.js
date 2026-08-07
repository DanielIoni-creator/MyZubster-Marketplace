const assert = require('assert');
const express = require('express');
const http = require('http');
const ortiRoutes = require('../routes/dashboard_orti');

const app = express();
app.use(express.json());
app.use('/api/dashboard/orti', ortiRoutes);

const server = app.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/dashboard/orti`;

  try {
    // Test 1: GET /api/dashboard/orti/telemetry
    const telemetryRes = await fetchJson(`${baseUrl}/telemetry`, { method: 'GET' });
    assert.strictEqual(telemetryRes.status, 200);
    assert.strictEqual(telemetryRes.body.success, true);
    assert.ok(telemetryRes.body.overview.totalSectors > 0);
    assert.ok(Array.isArray(telemetryRes.body.sectors));
    console.log('✓ GET /api/dashboard/orti/telemetry passed');

    // Test 2: POST /api/dashboard/orti/irrigate
    const irrigateRes = await fetchJson(`${baseUrl}/irrigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectorId: 'sec_1', durationMinutes: 10 })
    });
    assert.strictEqual(irrigateRes.status, 200);
    assert.strictEqual(irrigateRes.body.success, true);
    assert.strictEqual(irrigateRes.body.action.status, 'IRRIGATING');
    console.log('✓ POST /api/dashboard/orti/irrigate passed');

    console.log('✅ ALL DASHBOARD ORTI TESTS PASSED CLEANLY');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    server.close();
    process.exit(1);
  }
});

function fetchJson(url, options) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}
