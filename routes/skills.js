// routes/skills.js
const express = require('express');
const { Skill, User } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// ---- PUBBLICA UNA COMPETENZA (solo seller) ----
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, price, currency = 'USD' } = req.body;

    console.log('📝 Creazione skill:', { title, description, category, price, currency });

    if (!title || !description || !category || !price) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti' });
    }

    // Verifica che l'utente sia un seller
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo i seller possono pubblicare competenze' });
    }

    // Crea la competenza (usa "name" come richiesto dal modello)
    const skill = await Skill.create({
      name: title,          // Mappa "title" a "name"
      description,
      category,
      price,
      currency,
      sellerId: req.user.id,
      isActive: true
    });

    console.log('✅ Skill creata:', skill.id);

    res.status(201).json(skill);

  } catch (error) {
    console.error('❌ ERRORE CREAZIONE COMPETENZA:', error.message);
    console.error('❌ STACK:', error.stack);
    if (error.errors) {
      console.error('❌ DETTAGLI:', error.errors.map(e => e.message));
    }
    res.status(500).json({ error: 'Errore creazione competenza' });
  }
});

// ---- LISTA COMPETENZE (pubblica) ----
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.findAll({
      where: { isActive: true },
      include: [{ model: User, as: 'seller', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(skills);
  } catch (error) {
    console.error('❌ ERRORE RECUPERO COMPETENZE:', error.message);
    res.status(500).json({ error: 'Errore recupero competenze' });
  }
});

// ---- DETTAGLIO COMPETENZA ----
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findByPk(req.params.id, {
      include: [{ model: User, as: 'seller', attributes: ['id', 'name', 'email'] }]
    });
    if (!skill) {
      return res.status(404).json({ error: 'Competenza non trovata' });
    }
    res.json(skill);
  } catch (error) {
    console.error('❌ ERRORE RECUPERO COMPETENZA:', error.message);
    res.status(500).json({ error: 'Errore recupero competenza' });
  }
});

module.exports = router;