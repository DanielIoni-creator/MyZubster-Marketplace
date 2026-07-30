// routes/webhook.js
const express = require('express');
const { Order } = require('../models');
const router = express.Router();

const ESCROW_TO_MARKETPLACE = {
  created: 'pending',
  funded: 'paid',
  in_progress: 'in_progress',
  released: 'completed',
  cancelled: 'cancelled',
  disputed: 'disputed'
};

// Webhook per ricevere notifiche dal core gateway
router.post('/order-update', async (req, res) => {
  try {
    console.log('📨 Webhook ricevuto:', req.body);

    const { orderId, status, txHash, confirmations, amountReceived } = req.body;

    if (!orderId) {
      console.error('❌ orderId mancante');
      return res.status(400).json({ error: 'orderId è obbligatorio' });
    }

    if (!status) {
      console.error('❌ status mancante');
      return res.status(400).json({ error: 'status è obbligatorio' });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      console.error(`❌ Ordine ${orderId} non trovato`);
      return res.status(404).json({ error: 'Ordine non trovato' });
    }

    const marketplaceStatus = ESCROW_TO_MARKETPLACE[status] || status;
    order.status = marketplaceStatus;
    if (txHash) order.txHash = txHash;
    if (confirmations !== undefined) order.confirmations = confirmations;
    if (amountReceived !== undefined) order.amountReceived = amountReceived;
    if (order.paymentMethod === 'escrow') {
      order.escrowStatus = status;
    }
    await order.save();

    console.log(`✅ Ordine ${orderId} aggiornato a ${marketplaceStatus} (escrow: ${status})`);

    res.json({
      success: true,
      message: `Ordine ${orderId} aggiornato a ${marketplaceStatus}`,
      order: {
        id: order.id,
        status: order.status,
        escrowStatus: order.escrowStatus,
        confirmations: order.confirmations,
        amountReceived: order.amountReceived
      }
    });

  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;