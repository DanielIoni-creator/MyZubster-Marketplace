const request = require('supertest');
const express = require('express');
const stablecoinRoutes = require('../routes/stablecoin');

const app = express();
app.use(express.json());
app.use('/api/stablecoin', stablecoinRoutes);

describe('Stablecoin API Routes (#737)', () => {
  it('GET /api/stablecoin/rates — returns supported USDC and USDT stablecoins', async () => {
    const res = await request(app).get('/api/stablecoin/rates');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.supportedStablecoins).toHaveProperty('USDC');
    expect(res.body.supportedStablecoins).toHaveProperty('USDT');
  });

  it('POST /api/stablecoin/convert — auto-converts MYZ to USDC', async () => {
    const res = await request(app)
      .post('/api/stablecoin/convert')
      .send({ userId: 'user123', amountMYZ: 100, targetCoin: 'USDC' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.conversion.amountStablecoin).toEqual(10);
  });

  it('POST /api/stablecoin/payout — processes stablecoin payout to wallet', async () => {
    const res = await request(app)
      .post('/api/stablecoin/payout')
      .send({
        userId: 'user123',
        walletAddress: '0x19A58A880a6e76d78eB1A56fe5B15708E9F0073D',
        amountMYZ: 50,
        coinType: 'USDT'
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.payout.status).toEqual('settled');
  });
});
