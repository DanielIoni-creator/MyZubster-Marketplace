const express = require('express');
const { Order, Skill, User } = require('../models');
const auth = require('../middleware/auth');
const escrowClient = require('../services/escrowClient');

const router = express.Router();

const ESCROW_STATUS_MAP = {
  pending: 'created',
  paid: 'funded',
  in_progress: 'in_progress',
  completed: 'released',
  cancelled: 'cancelled',
  disputed: 'disputed',
};

const MARKETPLACE_STATUS_MAP = {
  created: 'pending',
  funded: 'paid',
  in_progress: 'in_progress',
  released: 'completed',
  cancelled: 'cancelled',
  disputed: 'disputed',
};

function mapToEscrowStatus(marketplaceStatus) {
  return ESCROW_STATUS_MAP[marketplaceStatus] || marketplaceStatus;
}

function mapToMarketplaceStatus(escrowStatus) {
  return MARKETPLACE_STATUS_MAP[escrowStatus] || escrowStatus;
}

function buildOrderResponse(order) {
  return {
    id: order.id,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    skillId: order.skillId,
    amount: order.amount,
    currency: order.currency,
    moneroAddress: order.moneroAddress,
    moneroAmount: order.moneroAmount,
    addressIndex: order.addressIndex,
    status: order.status,
    network: order.network,
    paymentMethod: order.paymentMethod,
    escrowStatus: order.escrowStatus,
    escrowId: order.escrowId,
  };
}

// POST /api/orders — Create an order (supports escrow)
router.post('/', auth, async (req, res) => {
  try {
    const { skillId, paymentMethod = 'direct' } = req.body;

    if (!skillId) {
      return res.status(400).json({ error: 'skillId is required' });
    }

    const skill = await Skill.findByPk(skillId);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    if (skill.sellerId === req.user.id) {
      return res.status(400).json({ error: 'Cannot purchase your own skill' });
    }

    const orderAmount = skill.price;
    const orderCurrency = skill.currency || 'USD';

    const order = await Order.create({
      buyerId: req.user.id,
      sellerId: skill.sellerId,
      skillId: skill.id,
      amount: orderAmount,
      currency: orderCurrency,
      moneroAddress:
        '8A1B2C3D4E5F6G7H8I9J0K' + Math.random().toString(36).substring(2, 8),
      moneroAmount: orderAmount / 150,
      addressIndex: Math.floor(Math.random() * 1000),
      status: 'pending',
      network: 'testnet',
      paymentMethod: paymentMethod === 'escrow' ? 'escrow' : 'direct',
      escrowStatus:
        paymentMethod === 'escrow' ? mapToEscrowStatus('pending') : null,
    });

    if (paymentMethod === 'escrow') {
      try {
        const escrowResult = await escrowClient.createEscrow(
          req.user.id,
          skill.sellerId,
          orderAmount,
        );
        order.escrowId = escrowResult.id || escrowResult.escrowId;
        order.escrowStatus = 'pending';
        await order.save();
      } catch (escrowError) {
        console.error('Escrow creation failed:', escrowError.message);
        await order.destroy();
        return res
          .status(502)
          .json({ error: 'Escrow creation failed', details: escrowError.message });
      }
    }

    res.status(201).json(buildOrderResponse(order));
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// GET /api/orders/:id — Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (
      order.buyerId !== req.user.id &&
      order.sellerId !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const buyer = await User.findByPk(order.buyerId, {
      attributes: ['id', 'username', 'name'],
    });
    const seller = await User.findByPk(order.sellerId, {
      attributes: ['id', 'username', 'name'],
    });
    const skill = await Skill.findByPk(order.skillId);

    res.json({ ...order.toJSON(), buyer, seller, skill });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PATCH /api/orders/:id/status — Update order status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      'pending',
      'paid',
      'in_progress',
      'completed',
      'cancelled',
      'disputed',
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (
      order.sellerId !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    order.status = status;
    if (status === 'paid') order.paidAt = new Date();
    if (status === 'completed') order.completedAt = new Date();
    if (order.paymentMethod === 'escrow') {
      order.escrowStatus = mapToEscrowStatus(status);
    }
    await order.save();

    res.json(buildOrderResponse(order));
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// GET /api/orders/my-orders — Get current user's orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { buyerId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(orders.map(buildOrderResponse));
  } catch (error) {
    console.error('Error fetching user orders:', error.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id/escrow — Get escrow status for an order
router.get('/:id/escrow', auth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (
      order.buyerId !== req.user.id &&
      order.sellerId !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.paymentMethod !== 'escrow') {
      return res.status(400).json({ error: 'Order does not use escrow' });
    }

    let gatewayStatus = null;
    if (order.escrowId) {
      try {
        gatewayStatus = await escrowClient.getEscrowStatus(order.escrowId);
      } catch (gatewayError) {
        console.error('Escrow gateway error:', gatewayError.message);
      }
    }

    res.json({
      orderId: order.id,
      paymentMethod: order.paymentMethod,
      escrowStatus: order.escrowStatus,
      gatewayStatus,
      escrowId: order.escrowId,
      marketplaceStatus: order.status,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error fetching escrow status:', error.message);
    res.status(500).json({ error: 'Failed to fetch escrow status' });
  }
});

// POST /api/orders/:id/escrow/complete — Complete escrow payment
router.post('/:id/escrow/complete', auth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (
      order.buyerId !== req.user.id &&
      order.sellerId !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.paymentMethod !== 'escrow') {
      return res.status(400).json({ error: 'Order does not use escrow' });
    }

    if (order.escrowId) {
      await escrowClient.completeEscrow(order.escrowId);
    }

    order.status = 'completed';
    order.escrowStatus = 'completed';
    order.completedAt = new Date();
    await order.save();

    res.json({ message: 'Escrow completed', order: buildOrderResponse(order) });
  } catch (error) {
    console.error('Error completing escrow:', error.message);
    res.status(500).json({ error: 'Failed to complete escrow' });
  }
});

// POST /api/orders/:id/escrow/dispute — Dispute escrow payment
router.post('/:id/escrow/dispute', auth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (
      order.buyerId !== req.user.id &&
      order.sellerId !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.paymentMethod !== 'escrow') {
      return res.status(400).json({ error: 'Order does not use escrow' });
    }

    const { reason } = req.body;

    if (order.escrowId) {
      await escrowClient.disputeEscrow(
        order.escrowId,
        reason || 'Buyer initiated dispute',
      );
    }

    order.status = 'disputed';
    order.escrowStatus = 'disputed';
    await order.save();

    res.json({
      message: 'Escrow disputed',
      order: buildOrderResponse(order),
    });
  } catch (error) {
    console.error('Error disputing escrow:', error.message);
    res.status(500).json({ error: 'Failed to dispute escrow' });
  }
});

module.exports = router;
