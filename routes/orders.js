// routes/orders.js
const express = require('express');
const axios = require('axios');
const { Order, Skill, User } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// ===== CONFIGURAZIONE =====
const MYZUBSTER_API_URL =
  global.MYZUBSTER_API_URL ||
  process.env.MYZUBSTER_API_URL ||
  'http://localhost:3000/api';

const MYZUBSTER_API_TOKEN =
  global.MYZUBSTER_API_TOKEN ||
  process.env.MYZUBSTER_API_TOKEN ||
  null;

// ===== CREA ORDINE =====
router.post('/', auth, async (req, res) => {
  try {
    const { skillId, amount, currency, customerEmail } = req.body;

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

    const orderAmount = amount || skill.price;
    const orderCurrency = currency || skill.currency || 'USD';

    if (!MYZUBSTER_API_TOKEN) {
      return res.status(500).json({
        error: 'MYZUBSTER_API_TOKEN non configurato'
      });
    }

    // Chiamata al core gateway
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

    // Salva nel database del marketplace
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

// ===== LISTA ORDINI UTENTE (semplificata, SENZA include) =====
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
    console.error('❌ Errore verifica stato:', error.message);
    res.status(500).json({ error: 'Errore recupero stato' });
  }
});

module.exports = router;