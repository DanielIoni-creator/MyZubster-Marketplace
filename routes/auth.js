const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/auth/register - Registrazione utente
router.post('/register', async (req, res) => {
  try {
    const { User } = req.models;
    const { email, password, name } = req.body;

    // Verifica se l'utente esiste già
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email già registrata' });
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crea l'utente
    const newUser = await User.create({
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      role: 'user'
    });

    // Genera token JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('❌ ERRORE REGISTRAZIONE:', error.message);
    res.status(500).json({ error: 'Errore registrazione' });
  }
});

// POST /api/auth/login - Login utente
router.post('/login', async (req, res) => {
  try {
    const { User } = req.models;
    const { email, password } = req.body;

    // Cerca l'utente
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Verifica la password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Genera token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ ERRORE LOGIN:', error.message);
    res.status(500).json({ error: 'Errore login' });
  }
});

// GET /api/auth/me - Recupera il profilo dell'utente autenticato
router.get('/me', async (req, res) => {
  try {
    // In una implementazione reale, qui dovresti estrarre l'ID dal token JWT
    // e usarlo per trovare l'utente
    const { User } = req.models;
    const userId = req.userId; // da middleware di autenticazione

    if (!userId) {
      return res.status(401).json({ error: 'Non autenticato' });
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    res.json(user);
  } catch (error) {
    console.error('❌ Errore profilo utente:', error.message);
    res.status(500).json({ error: 'Errore profilo utente' });
  }
});

module.exports = router;
