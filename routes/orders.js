// routes/orders.js
const express = require('express');
const axios = require('axios');
const { Order, Skill, User } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// ===== RECUPERA TOKEN IN MODO ROBUSTO =====
const MYZUBSTER_API_URL =
  global.MYZUBSTER_API_URL ||
  process.env.MYZUBSTER_API_URL ||
  'http://localhost:3000/api';

const MYZUBSTER_API_TOKEN =
  global.MYZUBSTER_API_TOKEN ||
  process.env.MYZUBSTER_API_TOKEN ||
  null;

console.log('🔍 [ORDERS.JS] Token:', MYZUBSTER_API_TOKEN ? '✅ PRESENTE' : '❌ MANCANTE');
console.log('🔍 [ORDERS.JS] URL:', MYZUBSTER_API_URL);

// ===== CREA ORDINE =====
router.post('/', auth, async (req, res) => {
  try {
    const { skillId, amount, currency, customerEmail } = req.body;

    if (!skillId) {
      return res.status(400).json({ error: 'SkillId obbligatorio' });
    }

    const skill = await Skill.findByPk(skillId, {
      include: [{ model: User, as: 'seller', attributes: ['id', 'name', 'email'] }]
    });

    if (!skill) {
      return res.status(404).json({ error: 'Competenza non trovata' });
    }

    if (skill.sellerId === req.user.id) {
      return res.status(400).json({ error: 'Non puoi acquistare la tua stessa competenza' });
    }

    const orderAmount = amount || skill.price;
    const orderCurrency = currency || skill.currency || 'USD';

    if (!MYZUBSTER_API_TOKEN) {
      console.error('❌ Token mancante in routes/orders.js');
      return res.status(500).json({
        error: 'MYZUBSTER_API_TOKEN non configurato nel file .env o global'
      });
    }

    console.log('🔗 Chiamata al core gateway:', MYZUBSTER_API_URL);
    console.log('🔑 Token usato:', MYZUBSTER_API_TOKEN.substring(0, 20) + '...');

    const paymentResponse = await axios.post(
      `${MYZUBSTER_API_URL}/orders`,
      {
        amount: orderAmount,
        currency: orderCurrency,
        customerEmail: customerEmail || req.user.email
      },
      {
        headers: {
          'Authorization': `Bearer ${MYZUBSTER_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const paymentData = paymentResponse.data;

    const order = await Order.create({
      buyerId: req.user.id,
      skillId: skill.id,
      amount: orderAmount,
      currency: orderCurrency,
      moneroAddress: paymentData.moneroAddress,
      moneroAmount: paymentData.moneroAmount,
      addressIndex: paymentData.addressIndex,
      status: 'pending',
      network: paymentData.network || 'testnet'
    });

    res.status(201).json({
      id: order.id,
      buyerId: order.buyerId,
      skillId: order.skillId,
      amount: order.amount,
      currency: order.currency,
      moneroAddress: order.moneroAddress,
      moneroAmount: order.moneroAmount,
      addressIndex: order.addressIndex,
      status: order.status,
      network: order.network
    });

  } catch (error) {
    console.error('❌ Errore creazione ordine:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Errore creazione pagamento',
      details: error.response?.data?.error || error.message
    });
  }
});

// ===== LISTA ORDINI UTENTE =====
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { buyerId: req.user.id },
      include: [
        { model: Skill, attributes: ['id', 'name'] },
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error('❌ Errore recupero ordini:', error);
    res.status(500).json({ error: 'Errore recupero ordini' });
  }
});

// ===== VERIFICA STATO PAGAMENTO =====
router.get('/:id/payment-status', auth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }

    if (order.buyerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accesso negato' });
    }

    res.json({
      id: order.id,
      status: order.status,
      confirmations: order.confirmations,
      amountReceived: order.amountReceived
    });
  } catch (error) {
    console.error('❌ Errore verifica stato:', error);
    res.status(500).json({ error: 'Errore recupero stato' });
  }
});

module.exports = router;