// routes/webhook.js
const express = require('express');
const { Order } = require('../models');
const router = express.Router();

// Webhook SENZA autenticazione per test
router.post('/order-update', async (req, res) => {
  try {
    console.log('📨 Webhook ricevuto:', req.body);

    const { orderId, status, txHash, confirmations, amountReceived } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ error: 'orderId e status sono obbligatori' });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }

    order.status = status;
    if (txHash) order.txHash = txHash;
    if (confirmations !== undefined) order.confirmations = confirmations;
    if (amountReceived !== undefined) order.amountReceived = amountReceived;
    await order.save();

    console.log(`✅ Ordine ${orderId} aggiornato a ${status}`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    res.status(500).json({ error: 'Errore interno' });
  }
});

module.exports = router;