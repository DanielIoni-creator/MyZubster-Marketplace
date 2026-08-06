require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = process.env.PORT || 10000;

// ---- GIN GUARDIAN SECURITY ----
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // massimo 100 richieste per IP
  message: '⚠️ Troppe richieste, riprova più tardi.',
  standardHeaders: true,
  legacyHeaders: false
});

// CORS
app.use(cors({
  origin: ['https://myzubster.com', 'https://www.myzubster.com'],
  credentials: true
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json());
app.use(limiter); // Applica rate limiting a TUTTE le route

// Import routes
const swapRoutes = require('./routes/swap');
const animalRoutes = require('./routes/animals');
const plantRoutes = require('./routes/plants');
const rewardRoutes = require('./routes/rewards');
const contributorsRoutes = require('./routes/contributors');
const sensorRoutes = require('./routes/sensors');
const securityRoutes = require('./routes/security');
const securityRoutes = require('./routes/security');

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    rateLimit: '100 requests per 15 minutes'
  });
});

// Routes API
app.use('/api/swap', swapRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/contributors', contributorsRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/security', securityRoutes);

// Robot routes
try {
  const robotRoutes = require('./routes/robot');
  app.use('/api/robot', robotRoutes);
  console.log('✅ Caricamento routes robot...');
} catch (err) {
  console.error('❌ Errore caricamento robot:', err.message);
}

// Logo routes
try {
  const logoRoutes = require('./routes/robotLogo');
  app.use('/api/robot/logo', logoRoutes);
  console.log('✅ Caricamento routes logo...');
} catch (err) {
  console.error('❌ Errore caricamento logo:', err.message);
}

// ---- BOUNTY PAGE ----
app.get('/bounty', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/bounty.html'));
});

// Urban Garden Dashboard
app.get('/garden', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/garden.html'));
});

// Static frontend
const frontendPath = path.join(__dirname, 'frontend/dist');
app.use(express.static(frontendPath));

// SPA fallback
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handler per 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path 
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const server = app.listen(PORT, () => {
  console.log(`🚀 Gateway running on http://localhost:${PORT}`);
  console.log(`🔒 Security: Rate limiting (100 req/15min), Headers active`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM ricevuto, chiusura graceful...');
  server.close(() => {
    mongoose.connection.close()
      .then(() => {
        console.log('✅ Server chiuso');
        process.exit(0);
      })
      .catch(err => {
        console.error('❌ Errore chiusura MongoDB:', err);
        process.exit(1);
      });
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT ricevuto, chiusura graceful...');
  server.close(() => {
    mongoose.connection.close()
      .then(() => {
        console.log('✅ Server chiuso');
        process.exit(0);
      })
      .catch(err => {
        console.error('❌ Errore chiusura MongoDB:', err);
        process.exit(1);
      });
  });
});
