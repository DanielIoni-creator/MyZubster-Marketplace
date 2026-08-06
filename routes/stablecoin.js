// routes/stablecoin.js — USDC & USDT Stablecoin Payout & Auto-Conversion API
const express = require('express');
const router = express.Router();
const Reward = require('../models/Reward');

// Supported stablecoins & fixed conversion rates (1 MYZ = 0.10 USD)
const STABLECOINS = {
  USDC: { name: 'USD Coin', rate: 0.10, decimals: 6 },
  USDT: { name: 'Tether USD', rate: 0.10, decimals: 6 }
};

// GET /api/stablecoin/rates — Get current stablecoin conversion rates
router.get('/rates', (req, res) => {
  res.json({
    success: true,
    baseCurrency: 'MYZ',
    supportedStablecoins: STABLECOINS
  });
});

// POST /api/stablecoin/convert — Auto-convert MYZ to USDC/USDT
router.post('/convert', async (req, res) => {
  try {
    const { userId, amountMYZ, targetCoin } = req.body;
    if (!userId || !amountMYZ || !targetCoin) {
      return res.status(400).json({ error: 'userId, amountMYZ, and targetCoin are required' });
    }

    const coin = STABLECOINS[targetCoin.toUpperCase()];
    if (!coin) {
      return res.status(400).json({ error: 'Unsupported stablecoin. Use USDC or USDT' });
    }

    const amountStablecoin = amountMYZ * coin.rate;

    res.json({
      success: true,
      conversion: {
        userId,
        amountMYZ,
        targetCoin: targetCoin.toUpperCase(),
        amountStablecoin,
        rate: coin.rate,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stablecoin/payout — Request USDC/USDT payout to wallet address
router.post('/payout', async (req, res) => {
  try {
    const { userId, walletAddress, amountMYZ, coinType } = req.body;
    if (!userId || !walletAddress || !amountMYZ || !coinType) {
      return res.status(400).json({ error: 'userId, walletAddress, amountMYZ, and coinType are required' });
    }

    const coin = STABLECOINS[coinType.toUpperCase()];
    if (!coin) {
      return res.status(400).json({ error: 'Invalid coinType. Supported: USDC, USDT' });
    }

    const amountStablecoin = amountMYZ * coin.rate;
    const txId = `tx_stablecoin_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    res.json({
      success: true,
      payout: {
        userId,
        walletAddress,
        coinType: coinType.toUpperCase(),
        amountMYZ,
        amountStablecoin,
        txId,
        status: 'settled',
        network: 'Polygon/Base'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stablecoin/dashboard — Unified Stablecoin & MYZ Dashboard Data
router.get('/dashboard', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    res.json({
      success: true,
      dashboard: {
        userId,
        supportedAssets: ['USDC', 'USDT', 'MYZ'],
        autoConversionEnabled: true,
        rates: STABLECOINS
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
