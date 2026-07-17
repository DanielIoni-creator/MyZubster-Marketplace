// =============================================
// MYZUBSTER MARKETPLACE - SERVER
// =============================================
require('dotenv').config();

// ===== GESTIONE ERRORI NON CATTURATI =====
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
});

process.on('exit', (code) => {
  console.log(`⚠️ Processo terminato con codice: ${code}`);
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

// ---- /api/auth ATTIVA ----
app.use('/api/auth', require('./routes/auth'));

// ---- /api/users ATTIVA ----
app.use('/api/users', require('./routes/users'));

// ---- /api/skills ATTIVA ----
app.use('/api/skills', require('./routes/skills'));

// ---- /api/orders ATTIVA ----
app.use('/api/orders', require('./routes/orders'));

// ---- /api/admin COMMENTATA (da attivare dopo) ----
// app.use('/api/admin', require('./routes/admin'));

console.log('✅ Route caricate (auth + users + skills + orders attive)');

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Marketplace API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ===== DEBUG ENDPOINT =====
if (process.env.NODE_ENV === 'development') {
  app.get('/api/debug/env', (req, res) => {
    res.json({
      MYZUBSTER_API_URL: process.env.MYZUBSTER_API_URL || 'NON CONFIGURATO',
      MYZUBSTER_API_TOKEN: process.env.MYZUBSTER_API_TOKEN ? '✅ CONFIGURATO' : '❌ NON CONFIGURATO',
      NODE_ENV: process.env.NODE_ENV || 'NON CONFIGURATO',
      PORT: process.env.PORT || '4000 (default)'
    });
  });
}

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
    console.log('✅ Connessione PostgreSQL stabilita');

    // FORCE: true ricrea le tabelle da zero (utile in sviluppo)
    // ATTENZIONE: cancella tutti i dati! Non usare in produzione.
    await sequelize.sync({ force: true });
    console.log('📦 Database sincronizzato (force: true) - tabelle ricreate');

    app.listen(PORT, () => {
      console.log(`🚀 Marketplace avviato su http://localhost:${PORT}`);
      console.log(`📦 Modalità: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 MyZubster API: ${process.env.MYZUBSTER_API_URL || 'NON CONFIGURATO'}`);
      console.log(`🔑 MyZubster Token: ${process.env.MYZUBSTER_API_TOKEN ? '✅ CONFIGURATO' : '❌ NON CONFIGURATO'}`);
      console.log('✅ Server in ascolto, in attesa di richieste...');
    });
  } catch (error) {
    console.error('❌ Errore avvio server:', error);
    setTimeout(() => process.exit(1), 2000);
  }
};

startServer();