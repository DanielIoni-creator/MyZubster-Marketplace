const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (app) => {
  // POST /api/users/register - Registrazione utente
  app.post('/api/users/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;
      const { User } = req.models;

      // Verifica se l'email esiste già
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email già registrata' });
      }

      // Hash della password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Crea l'utente
      const newUser = await User.create({
        email,
        password: hashedPassword,
        name,
        role: 'user'
      });

      // Genera JWT
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        process.env.JWT_SECRET || 'secret',
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

  // POST /api/users/login - Login utente
  app.post('/api/users/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const { User } = req.models;

      // Trova l'utente
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Credenziali non valide' });
      }

      // Verifica password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Credenziali non valide' });
      }

      // Genera JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret',
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

  // GET /api/users/me - Profilo utente autenticato
  app.get('/api/users/me', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Token mancante' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const { User } = req.models;
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });
    } catch (error) {
      console.error('❌ ERRORE PROFILO:', error.message);
      res.status(401).json({ error: 'Token non valido' });
    }
  });
};
