const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servi file statici dalla cartella frontend
app.use(express.static('frontend'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api', limiter);

// Connessione MongoDB (SENZA opzioni deprecate)
mongoose.connect('mongodb://localhost:27017/myzubster')
  .then(() => console.log('✅ MongoDB connesso'))
  .catch(err => console.error('❌ MongoDB errore:', err));

// Import delle route
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const skillRoutes = require('./routes/skills');
const orderRoutes = require('./routes/orders');
const pgpRoutes = require('./routes/pgp');
const nftRoutes = require('./routes/nft');
const webhookRoutes = require('./routes/webhook');
const adminRoutes = require('./routes/admin');
const gardenRoutes = require('./routes/gardens');

// Uso delle route
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pgp', pgpRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gardens', gardenRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (req, res) => {
  res.json({ message: 'MyZubster Marketplace API', version: '1.0.0' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Errore:', err.stack);
  res.status(500).json({ error: err.message });
});

// Avvia server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗺️  Mappa: http://localhost:${PORT}/garden-map.html`);
  console.log('✅ Garden routes loaded');
  console.log('✅ Frontend servito da /frontend');
});

module.exports = app;
