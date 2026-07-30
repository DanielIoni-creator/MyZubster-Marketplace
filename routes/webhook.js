const express = require('express');
const router = express.Router();

// POST /api/webhook/order-update - Riceve aggiornamenti da webhook
router.post('/order-update', async (req, res) => {
  try {
    const { Order, WebhookLog } = req.models;
    const { orderId, status, event, payload } = req.body;

    // Verifica che l'ordine esista
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }

    // Aggiorna lo stato dell'ordine se fornito
    if (status) {
      await order.update({ status });
    }

    // Registra il webhook nel log
    await WebhookLog.create({
      order_id: orderId,
      event: event || 'order-update',
      payload: JSON.stringify(payload || req.body),
      status: 'received'
    });

    res.json({ message: 'Webhook ricevuto', order });
  } catch (error) {
    console.error('❌ Errore webhook:', error.message);
    res.status(500).json({ error: 'Errore elaborazione webhook' });
  }
});

// GET /api/webhook/logs - Recupera i log dei webhook (admin)
router.get('/logs', async (req, res) => {
  try {
    const { WebhookLog, Order } = req.models;
    const logs = await WebhookLog.findAll({
      include: [{ model: Order, attributes: ['id', 'status'] }],
      limit: 100,
      order: [['createdAt', 'DESC']]
    });
    res.json(logs);
  } catch (error) {
    console.error('❌ Errore recupero log webhook:', error.message);
    res.status(500).json({ error: 'Errore recupero log webhook' });
  }
});

// GET /api/webhook/logs/:orderId - Recupera i log per un ordine specifico
router.get('/logs/:orderId', async (req, res) => {
  try {
    const { WebhookLog } = req.models;
    const logs = await WebhookLog.findAll({
      where: { order_id: req.params.orderId },
      order: [['createdAt', 'DESC']]
    });
    res.json(logs);
  } catch (error) {
    console.error('❌ Errore recupero log per ordine:', error.message);
    res.status(500).json({ error: 'Errore recupero log per ordine' });
  }
});

module.exports = router;
