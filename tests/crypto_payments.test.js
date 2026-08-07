const assert = require('assert');
const express = require('express');
const http = require('http');
const cryptoRoutes = require('../routes/crypto_payments');

const app = express();
app.use(express.json());
app.use('/api/crypto', cryptoRoutes);

const server = app.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/crypto`;

  try {
    // Test 1: GET /api/crypto/rates
    const ratesRes = await fetchJson(`${baseUrl}/rates`, { method: 'GET' });
    assert.strictEqual(ratesRes.status, 200);
    assert.strictEqual(ratesRes.body.success, true);
    assert.ok(ratesRes.body.supportedAssets.BTC);
    assert.ok(ratesRes.body.supportedAssets.ETH);
    assert.ok(ratesRes.body.supportedAssets.ADA);
    console.log('✓ GET /api/crypto/rates passed');

    // Test 2: POST /api/crypto/convert
    const convertRes = await fetchJson(`${baseUrl}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user123', amountMYZ: 1000, targetAsset: 'ETH' })
    });
    assert.strictEqual(convertRes.status, 200);
    assert.strictEqual(convertRes.body.success, true);
    assert.strictEqual(convertRes.body.conversion.convertedAmount, 0.35);
    console.log('✓ POST /api/crypto/convert passed');

    // Test 3: POST /api/crypto/payout
    const payoutRes = await fetchJson(`${baseUrl}/payout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user123',
        walletAddress: '0x19A58A880a6e76d78eB1A56fe5B15708E9F0073D',
        amountMYZ: 500,
        assetType: 'ADA'
      })
    });
    assert.strictEqual(payoutRes.status, 200);
    assert.strictEqual(payoutRes.body.success, true);
    assert.strictEqual(payoutRes.body.payout.status, 'settled');
    console.log('✓ POST /api/crypto/payout passed');

    console.log('✅ ALL CRYPTO PAYMENT TESTS PASSED CLEANLY');
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
