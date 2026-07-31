const express = require('express');
const router = express.Router();

/**
 * POST /api/webhook/order-update — Receive order updates from Gateway/escrow
 */
router.post('/order-update', async (req, res) => {
  try {
    const { Order, WebhookLog } = req.models;
    const { orderId, status, escrowStatus, event, payload } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (escrowStatus) updateData.escrowStatus = escrowStatus;
    if (Object.keys(updateData).length > 0) {
      await order.update(updateData);
    }

    await WebhookLog.create({
      order_id: orderId,
      event: event || 'order-update',
      payload: JSON.stringify(payload || req.body),
      status: 'received',
    });

    res.json({ message: 'Webhook ricevuto', order });
  } catch (error) {
    console.error('❌ Errore webhook:', error.message);
    res.status(500).json({ error: 'Errore webhook' });
  }
});

/**
 * POST /api/webhook/escrow-update — Receive escrow status changes from Gateway
 */
router.post('/escrow-update', async (req, res) => {
  try {
    const { Order, WebhookLog } = req.models;
    const { escrowId, status, txHash, confirmations, amountReceived, event } = req.body;

    if (!escrowId) {
      return res.status(400).json({ error: 'escrowId is required' });
    }

    const order = await Order.findOne({ where: { escrowId } });
    if (!order) {
      return res.status(404).json({ error: 'No order found with this escrowId' });
    }

    const updateData = { escrowStatus: status };
    const statusMap = {
      'pending': 'escrow_pending',
      'confirmed': 'paid',
      'released': 'completed',
      'refunded': 'cancelled',
      'disputed': 'disputed',
    };
    if (statusMap[status]) updateData.status = statusMap[status];
    if (txHash) updateData.txHash = txHash;
    if (confirmations !== undefined) updateData.confirmations = confirmations;
    if (amountReceived !== undefined) updateData.amountReceived = amountReceived;

    await order.update(updateData);

    await WebhookLog.create({
      order_id: order.id,
      event: event || 'escrow-update',
      payload: JSON.stringify(req.body),
      status: 'received',
    });

    res.json({ message: 'Escrow webhook processed', orderId: order.id, escrowStatus: status });
  } catch (error) {
    console.error('❌ Errore webhook escrow:', error.message);
    res.status(500).json({ error: 'Errore webhook escrow' });
  }
});

module.exports = router;
