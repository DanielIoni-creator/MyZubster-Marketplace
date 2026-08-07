const express = require('express');
const router = express.Router();

// Supported Crypto Assets & Fixed Rates for MyZubster Gateway
const SUPPORTED_ASSETS = {
  BTC: { name: 'Bitcoin', rateMYZ: 0.000015, minPayout: 0.001 },
  ETH: { name: 'Ethereum', rateMYZ: 0.00035, minPayout: 0.01 },
  ADA: { name: 'Cardano', rateMYZ: 0.85, minPayout: 10 }
};

// GET /api/crypto/rates — Fetch rates for BTC, ETH, ADA
router.get('/rates', (req, res) => {
  return res.status(200).json({
    success: true,
    supportedAssets: SUPPORTED_ASSETS,
    timestamp: new Date().toISOString()
  });
});

// POST /api/crypto/convert — Convert MYZ to BTC/ETH/ADA
router.post('/convert', (req, res) => {
  const { userId, amountMYZ, targetAsset } = req.body;

  if (!userId || !amountMYZ || !targetAsset) {
    return res.status(400).json({ success: false, error: 'userId, amountMYZ, and targetAsset required' });
  }

  const asset = SUPPORTED_ASSETS[targetAsset.toUpperCase()];
  if (!asset) {
    return res.status(400).json({ success: false, error: 'Unsupported target asset' });
  }

  const convertedAmount = amountMYZ * asset.rateMYZ;
  return res.status(200).json({
    success: true,
    conversion: {
      userId,
      amountMYZ,
      targetAsset: targetAsset.toUpperCase(),
      convertedAmount,
      rateMYZ: asset.rateMYZ
    }
  });
});

// POST /api/crypto/payout — Process crypto settlement
router.post('/payout', (req, res) => {
  const { userId, walletAddress, amountMYZ, assetType } = req.body;

  if (!userId || !walletAddress || !amountMYZ || !assetType) {
    return res.status(400).json({ success: false, error: 'Missing required payout fields' });
  }

  const asset = SUPPORTED_ASSETS[assetType.toUpperCase()];
  if (!asset) {
    return res.status(400).json({ success: false, error: 'Unsupported asset type' });
  }

  const payoutAmount = amountMYZ * asset.rateMYZ;

  return res.status(200).json({
    success: true,
    payout: {
      transactionId: `tx_crypto_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId,
      walletAddress,
      assetType: assetType.toUpperCase(),
      amountMYZ,
      payoutAmount,
      status: 'settled',
      settledAt: new Date().toISOString()
    }
  });
});

module.exports = router;
