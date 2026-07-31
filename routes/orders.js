const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const escrowClient = require('../services/escrowClient');

/**
 * GET /api/orders — List all orders (authenticated)
 */
router.get('/', auth, async (req, res) => {
  try {
    const { Order, User, Skill } = req.models;
    const orders = await Order.findAll({
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'email'] },
        { model: User, as: 'seller', attributes: ['id', 'email'] },
        { model: Skill, as: 'skill' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (error) {
    console.error('❌ Errore recupero ordini:', error.message);
    res.status(500).json({ error: 'Errore recupero ordini' });
  }
});

/**
 * POST /api/orders — Create a new order with optional escrow payment
 */
router.post('/', auth, async (req, res) => {
  try {
    const { Order, Skill } = req.models;
    const { skill_id, buyer_id, amount, paymentMethod, moneroAddress } = req.body;

    // Validate skill exists and is active
    const skill = await Skill.findByPk(skill_id);
    if (!skill || skill.status !== 'active') {
      return res.status(400).json({ error: 'Competenza non disponibile' });
    }

    // Buyer must match authenticated user (or be admin)
    const effectiveBuyerId = buyer_id || req.user.id;
    if (effectiveBuyerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot create order for another user' });
    }

    const method = paymentMethod || 'direct';
    const orderData = {
      buyer_id: effectiveBuyerId,
      seller_id: skill.seller_id,
      skill_id,
      amount: amount || skill.price,
      status: 'pending',
      paymentMethod: method,
    };
    if (moneroAddress) orderData.moneroAddress = moneroAddress;

    const newOrder = await Order.create(orderData);

    // If escrow, create escrow immediately via Gateway
    if (method === 'escrow') {
      try {
        const result = await escrowClient.createEscrow({
          orderId: newOrder.id,
          buyerId: effectiveBuyerId,
          sellerId: skill.seller_id,
          amount: orderData.amount,
        });
        await newOrder.update({
          escrowId: result.escrowId,
          escrowStatus: result.status,
          status: 'escrow_pending',
        });
        return res.status(201).json({
          ...newOrder.toJSON(),
          escrowId: result.escrowId,
          escrowStatus: result.status,
          status: 'escrow_pending',
        });
      } catch (err) {
        console.warn('⚠️ Escrow deferred:', err.message);
      }
    }

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('❌ Errore creazione ordine:', error.message);
    res.status(500).json({ error: 'Errore creazione ordine' });
  }
});

/**
 * GET /api/orders/:id — Get single order (authenticated)
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { Order, User, Skill } = req.models;
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'email'] },
        { model: User, as: 'seller', attributes: ['id', 'email'] },
        { model: Skill, as: 'skill' },
      ],
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(order);
  } catch (error) {
    console.error('❌ Errore recupero ordine:', error.message);
    res.status(500).json({ error: 'Errore recupero ordine' });
  }
});

/**
 * PATCH /api/orders/:id/status — Update order status
 */
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { Order } = req.models;
    const { status } = req.body;
    const valid = ['pending', 'escrow_pending', 'paid', 'in_progress', 'completed', 'cancelled', 'disputed'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${valid.join(', ')}` });
    }
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const updateData = { status };
    if (status === 'paid') updateData.paidAt = new Date();
    if (status === 'completed') updateData.completedAt = new Date();
    await order.update(updateData);
    res.json(order);
  } catch (error) {
    console.error('❌ Errore aggiornamento ordine:', error.message);
    res.status(500).json({ error: 'Errore aggiornamento ordine' });
  }
});

module.exports = router;
