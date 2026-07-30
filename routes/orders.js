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
    const { skill_id, buyer_id, amount } = req.body;
    const skill = await Skill.findByPk(skill_id);
    if (!skill || skill.status !== 'active') {
      return res.status(400).json({ error: 'Competenza non disponibile' });
    }
    const newOrder = await Order.create({
      buyer_id,
      seller_id: skill.seller_id,
      skill_id,
      amount: amount || skill.price,
      status: 'pending'
    });
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('❌ Errore creazione ordine:', error.message);
    res.status(500).json({ error: 'Errore creazione ordine' });
  }
});

module.exports = router;
