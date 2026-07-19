// =============================================
// MYZUBSTER MARKETPLACE - SERVER (FULL)
// =============================================
require('dotenv').config();

// ===== GESTIONE ERRORI =====
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
});

// ===== VARIABILI GLOBALI =====
global.MYZUBSTER_API_URL = process.env.MYZUBSTER_API_URL || 'http://localhost:3000/api';
global.MYZUBSTER_API_TOKEN = process.env.MYZUBSTER_API_TOKEN || null;

// ===== DEBUG =====
console.log('🔑 MYZUBSTER_API_TOKEN:', process.env.MYZUBSTER_API_TOKEN ? '✅ PRESENTE' : '❌ MANCANTE');
console.log('🔗 MYZUBSTER_API_URL:', process.env.MYZUBSTER_API_URL || '❌ MANCANTE');
console.log('📦 NODE_ENV:', process.env.NODE_ENV || '❌ MANCANTE');
console.log('🚪 PORT:', process.env.PORT || '4000 (default)');

// ===== EXPRESS =====
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 4000;

// ===== MIDDLEWARE =====
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== ROUTE =====
console.log('🔍 Caricamento route...');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/webhook', require('./routes/webhook'));
app.use('/api/pgp', require('./routes/pgp'));   // 👈 PGP per firma/cifratura
// app.use('/api/admin', require('./routes/admin'));

console.log('✅ Tutte le route caricate');

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Marketplace API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('❌ Errore server:', err.stack);
  res.status(500).json({
    error: 'Errore interno del server',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ===== AVVIA SERVER =====
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connessione database stabilita');

    await sequelize.sync({ alter: true });
    console.log('📦 Database sincronizzato');

    // Avvia il server solo se NON siamo in modalità test
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`🚀 Marketplace avviato su http://localhost:${PORT}`);
        console.log(`📦 Modalità: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 MyZubster API: ${process.env.MYZUBSTER_API_URL || 'NON CONFIGURATO'}`);
        console.log(`🔑 MyZubster Token: ${process.env.MYZUBSTER_API_TOKEN ? '✅ CONFIGURATO' : '❌ NON CONFIGURATO'}`);
        console.log(`🔐 Webhook Secret: ${process.env.WEBHOOK_SECRET ? '✅ CONFIGURATO' : '❌ NON CONFIGURATO'}`);
        console.log(`🔐 PGP Key ID: ${process.env.PGP_KEY_ID ? '✅ CONFIGURATO' : '❌ NON CONFIGURATO'}`);
        console.log('✅ Server in ascolto, in attesa di richieste...');
      });
    } else {
      console.log('🧪 Modalità test – server non avviato');
    }
  } catch (error) {
    console.error('❌ Errore avvio server:', error);
    process.exit(1);
  }
};

// Avvia il server solo se NON siamo in modalità test
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;