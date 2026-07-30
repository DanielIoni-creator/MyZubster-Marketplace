const express = require('express');
const router = express.Router();

// GET /api/skills - Lista tutte le competenze
router.get('/', async (req, res) => {
  try {
    const { Skill, User } = req.models;
    const skills = await Skill.findAll({
      include: [{ model: User, as: 'seller', attributes: ['id', 'email', 'name'] }]
    });
    res.json(skills);
  } catch (error) {
    console.error('❌ Errore recupero competenze:', error.message);
    res.status(500).json({ error: 'Errore recupero competenze' });
  }
});

// GET /api/skills/:id - Dettaglio competenza
router.get('/:id', async (req, res) => {
  try {
    const { Skill, User } = req.models;
    const skill = await Skill.findByPk(req.params.id, {
      include: [{ model: User, as: 'seller', attributes: ['id', 'email', 'name'] }]
    });
    if (!skill) {
      return res.status(404).json({ error: 'Competenza non trovata' });
    }
    res.json(skill);
  } catch (error) {
    console.error('❌ Errore dettaglio competenza:', error.message);
    res.status(500).json({ error: 'Errore dettaglio competenza' });
  }
});

// POST /api/skills - Crea una nuova competenza (richiede autenticazione)
router.post('/', async (req, res) => {
  try {
    // Verifica che l'utente sia autenticato (JWT)
    // In una implementazione reale, qui dovresti verificare il token
    // e impostare req.userId
    const { Skill } = req.models;
    const { title, description, price, category } = req.body;
    
    // Per semplicità, assumiamo che l'ID del seller venga dal token
    // In una versione reale, dovresti estrarre l'ID dal JWT
    const sellerId = req.userId || 1; // temporaneo, solo per test

    const newSkill = await Skill.create({
      seller_id: sellerId,
      title,
      description,
      price,
      category,
      status: 'active'
    });

    res.status(201).json(newSkill);
  } catch (error) {
    console.error('❌ Errore creazione competenza:', error.message);
    res.status(500).json({ error: 'Errore creazione competenza' });
  }
});

// PUT /api/skills/:id - Aggiorna una competenza
router.put('/:id', async (req, res) => {
  try {
    const { Skill } = req.models;
    const skill = await Skill.findByPk(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Competenza non trovata' });
    }

    const { title, description, price, category, status } = req.body;
    await skill.update({ title, description, price, category, status });
    res.json(skill);
  } catch (error) {
    console.error('❌ Errore aggiornamento competenza:', error.message);
    res.status(500).json({ error: 'Errore aggiornamento competenza' });
  }
});

// DELETE /api/skills/:id - Elimina una competenza
router.delete('/:id', async (req, res) => {
  try {
    const { Skill } = req.models;
    const skill = await Skill.findByPk(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Competenza non trovata' });
    }

    await skill.destroy();
    res.json({ message: 'Competenza eliminata' });
  } catch (error) {
    console.error('❌ Errore eliminazione competenza:', error.message);
    res.status(500).json({ error: 'Errore eliminazione competenza' });
  }
});

module.exports = router;
