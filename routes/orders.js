const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { Order, User, Skill } = req.models;
    const orders = await Order.findAll({
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'email'] },
        { model: User, as: 'seller', attributes: ['id', 'email'] },
        { model: Skill, as: 'skill' }
      ]
    });
    res.json(orders);
  } catch (error) {
    console.error('❌ Errore recupero ordini:', error.message);
    res.status(500).json({ error: 'Errore recupero ordini' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { Order, Skill } = req.models;
    const { skill_id, buyer_id, amount, paymentMethod } = req.body;
    const skill = await Skill.findByPk(skill_id);
    if (!skill || skill.status !== 'active') {
      return res.status(400).json({ error: 'Competenza non disponibile' });
    }
    const newOrder = await Order.create({
      buyer_id,
      seller_id: skill.seller_id,
      skill_id,
      amount: amount || skill.price,
      status: 'pending',
      paymentMethod: paymentMethod || 'direct',
      escrowStatus: paymentMethod === 'escrow' ? 'awaiting_deposit' : null
    });
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('❌ Errore creazione ordine:', error.message);
    res.status(500).json({ error: 'Errore creazione ordine' });
  }
});

// ESGROW STATUS MAPPING
const ESCROW_STATUS_MAP = {
  'awaiting_deposit': 'pending',
  'deposited': 'paid',
  'in_dispute': 'disputed',
  'released': 'completed',
  'refunded': 'cancelled'
};

// Update escrow status
router.patch('/:id/escrow', async (req, res) => {
  try {
    const { Order } = req.models;
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Ordine non trovato' });
    const { escrowId, escrowStatus } = req.body;
    const updates = {};
    if (escrowId) updates.escrowId = escrowId;
    if (escrowStatus) {
      updates.escrowStatus = escrowStatus;
      // Map escrow status to marketplace order status
      const mappedStatus = ESCROW_STATUS_MAP[escrowStatus];
      if (mappedStatus) updates.status = mappedStatus;
    }
    await order.update(updates);
    res.json(order);
  } catch (error) {
    console.error('❌ Errore aggiornamento escrow:', error.message);
    res.status(500).json({ error: 'Errore aggiornamento escrow' });
  }
});

module.exports = router;
