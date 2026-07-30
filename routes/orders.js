const express = require('express');
const router = express.Router();

// GET /api/orders - Lista tutti gli ordini
router.get('/', async (req, res) => {
  try {
    const { Order, User, Skill } = req.models;
    const orders = await Order.findAll({
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'email', 'name'] },
        { model: User, as: 'seller', attributes: ['id', 'email', 'name'] },
        { model: Skill, as: 'skill' }
      ]
    });
    res.json(orders);
  } catch (error) {
    console.error('❌ Errore recupero ordini:', error.message);
    res.status(500).json({ error: 'Errore recupero ordini' });
  }
});

// GET /api/orders/:id - Dettaglio ordine
router.get('/:id', async (req, res) => {
  try {
    const { Order, User, Skill } = req.models;
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'email', 'name'] },
        { model: User, as: 'seller', attributes: ['id', 'email', 'name'] },
        { model: Skill, as: 'skill' }
      ]
    });
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    res.json(order);
  } catch (error) {
    console.error('❌ Errore dettaglio ordine:', error.message);
    res.status(500).json({ error: 'Errore dettaglio ordine' });
  }
});

// POST /api/orders - Crea un nuovo ordine
router.post('/', async (req, res) => {
  try {
    const { Order, Skill } = req.models;
    const { skill_id, buyer_id, amount } = req.body;

    // Verifica che la skill esista e sia attiva
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

// PUT /api/orders/:id/status - Aggiorna lo stato di un ordine
router.put('/:id/status', async (req, res) => {
  try {
    const { Order } = req.models;
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Stato non valido' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }

    await order.update({ status });
    res.json(order);
  } catch (error) {
    console.error('❌ Errore aggiornamento stato ordine:', error.message);
    res.status(500).json({ error: 'Errore aggiornamento stato ordine' });
  }
});

// DELETE /api/orders/:id - Elimina un ordine
router.delete('/:id', async (req, res) => {
  try {
    const { Order } = req.models;
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }

    await order.destroy();
    res.json({ message: 'Ordine eliminato' });
  } catch (error) {
    console.error('❌ Errore eliminazione ordine:', error.message);
    res.status(500).json({ error: 'Errore eliminazione ordine' });
  }
});

module.exports = router;
