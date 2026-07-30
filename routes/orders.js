// routes/orders.js
const express = require('express');
const { Order, Skill, User } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

const ESCROW_STATUS_MAP = {
  pending: 'created',
  paid: 'funded',
  in_progress: 'in_progress',
  completed: 'released',
  cancelled: 'cancelled',
  disputed: 'disputed'
};

const MARKETPLACE_STATUS_MAP = {
  created: 'pending',
  funded: 'paid',
  in_progress: 'in_progress',
  released: 'completed',
  cancelled: 'cancelled',
  disputed: 'disputed'
};

function mapToEscrowStatus(marketplaceStatus) {
  return ESCROW_STATUS_MAP[marketplaceStatus] || marketplaceStatus;
}

function mapToMarketplaceStatus(escrowStatus) {
  return MARKETPLACE_STATUS_MAP[escrowStatus] || escrowStatus;
}

// ===== CREA ORDINE =====
router.post('/', auth, async (req, res) => {
  try {
    const { skillId, paymentMethod = 'direct' } = req.body;

    if (!skillId) {
      return res.status(400).json({ error: 'SkillId obbligatorio' });
    }

    const skill = await Skill.findByPk(skillId);
    if (!skill) {
      return res.status(404).json({ error: 'Competenza non trovata' });
    }

    if (skill.sellerId === req.user.id) {
      return res.status(400).json({ error: 'Non puoi acquistare la tua stessa competenza' });
    }

    const orderAmount = skill.price;
    const orderCurrency = skill.currency || 'USD';

    const mockAddress = '8A1B2C3D4E5F6G7H8I9J0K' + Math.random().toString(36).substring(2, 8);

    const order = await Order.create({
      buyerId: req.user.id,
      sellerId: skill.sellerId,
      skillId: skill.id,
      amount: orderAmount,
      currency: orderCurrency,
      moneroAddress: mockAddress,
      moneroAmount: orderAmount / 150,
      addressIndex: Math.floor(Math.random() * 1000),
      status: 'pending',
      network: 'testnet',
      paymentMethod: paymentMethod === 'escrow' ? 'escrow' : 'direct',
      escrowStatus: paymentMethod === 'escrow' ? mapToEscrowStatus('pending') : null
    });

    const response = {
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
      escrowStatus: order.escrowStatus
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('❌ Errore creazione ordine:', error);
    res.status(500).json({
      error: 'Errore creazione ordine',
      details: error.message
    });
  }
});

// ===== DETTAGLIO ORDINE (senza include) =====
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }

    if (order.buyerId !== req.user.id && order.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accesso negato' });
    }

    // Recupera i dettagli associati con query separate
    const buyer = await User.findByPk(order.buyerId, { attributes: ['id', 'username', 'name'] });
    const seller = await User.findByPk(order.sellerId, { attributes: ['id', 'username', 'name'] });
    const skill = await Skill.findByPk(order.skillId);

    res.json({
      ...order.toJSON(),
      buyer,
      seller,
      skill
    });
  } catch (error) {
    console.error('❌ Errore recupero ordine:', error);
    res.status(500).json({ error: 'Errore recupero ordine' });
  }
});

// ===== AGGIORNA STATO ORDINE =====
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'paid', 'in_progress', 'completed', 'cancelled', 'disputed'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Stato non valido' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }

    if (order.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accesso negato' });
    }

    order.status = status;
    if (status === 'paid') order.paidAt = new Date();
    if (status === 'completed') order.completedAt = new Date();
    if (order.paymentMethod === 'escrow') {
      order.escrowStatus = mapToEscrowStatus(status);
    }
    await order.save();

    res.json(order);
  } catch (error) {
    console.error('❌ Errore aggiornamento stato:', error);
    res.status(500).json({ error: 'Errore aggiornamento stato' });
  }
});

// ===== LISTA ORDINI UTENTE =====
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { buyerId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error('❌ Errore recupero ordini:', error.message);
    res.status(500).json({ error: 'Errore recupero ordini' });
  }
});

// ===== STATO ESCROW ORDINE =====
router.get('/:id/escrow', auth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }

    if (order.buyerId !== req.user.id && order.sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accesso negato' });
    }

    if (order.paymentMethod !== 'escrow') {
      return res.status(400).json({ error: 'Questo ordine non usa escrow' });
    }

    res.json({
      orderId: order.id,
      paymentMethod: order.paymentMethod,
      escrowStatus: order.escrowStatus,
      escrowId: order.escrowId,
      marketplaceStatus: order.status,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('❌ Errore recupero escrow:', error.message);
    res.status(500).json({ error: 'Errore recupero escrow' });
  }
});

module.exports = router;
