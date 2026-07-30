const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GET (pubblico)
router.get('/', async (req, res) => {
  try {
    const { Skill, User } = req.models;
    const skills = await Skill.findAll({
      include: [{ model: User, as: 'seller', attributes: ['id', 'email'] }]
    });
    res.json(skills);
  } catch (error) {
    console.error('❌ Errore recupero competenze:', error.message);
    res.status(500).json({ error: 'Errore recupero competenze' });
  }
});

// GET /:id (pubblico)
router.get('/:id', async (req, res) => {
  try {
    const { Skill, User } = req.models;
    const skill = await Skill.findByPk(req.params.id, {
      include: [{ model: User, as: 'seller', attributes: ['id', 'email'] }]
    });
    if (!skill) return res.status(404).json({ error: 'Competenza non trovata' });
    res.json(skill);
  } catch (error) {
    console.error('❌ Errore dettaglio competenza:', error.message);
    res.status(500).json({ error: 'Errore dettaglio competenza' });
  }
});

// POST (protetto)
router.post('/', auth, async (req, res) => {
  try {
    const { Skill } = req.models;
    const { title, description, price, category } = req.body;
    const seller_id = req.user.id;
    const newSkill = await Skill.create({ seller_id, title, description, price, category, status: 'active' });
    res.status(201).json(newSkill);
  } catch (error) {
    console.error('❌ Errore creazione competenza:', error.message);
    res.status(500).json({ error: 'Errore creazione competenza' });
  }
});

// PUT (protetto, proprietario)
router.put('/:id', auth, async (req, res) => {
  try {
    const { Skill } = req.models;
    const skill = await Skill.findByPk(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Competenza non trovata' });
    if (skill.seller_id !== req.user.id) return res.status(403).json({ error: 'Non autorizzato' });
    const { title, description, price, category, status } = req.body;
    await skill.update({ title, description, price, category, status });
    res.json(skill);
  } catch (error) {
    console.error('❌ Errore aggiornamento competenza:', error.message);
    res.status(500).json({ error: 'Errore aggiornamento competenza' });
  }
});

// DELETE (protetto, proprietario)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { Skill } = req.models;
    const skill = await Skill.findByPk(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Competenza non trovata' });
    if (skill.seller_id !== req.user.id) return res.status(403).json({ error: 'Non autorizzato' });
    await skill.destroy();
    res.json({ message: 'Competenza eliminata' });
  } catch (error) {
    console.error('❌ Errore eliminazione competenza:', error.message);
    res.status(500).json({ error: 'Errore eliminazione competenza' });
  }
});

module.exports = router;
