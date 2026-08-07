const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servi file statici dalla cartella frontend
app.use(express.static('frontend'));

// Connessione MongoDB
mongoose.connect('mongodb://localhost:27017/myzubster')
  .then(() => console.log('✅ MongoDB connesso'))
  .catch(err => console.error('❌ MongoDB errore:', err));

// ============================================================
// ROUTE GARDENS - Bounty #743
// ============================================================
const gardenRoutes = require('./routes/gardens');
const nfcRoutes = require("./routes/nfc");
app.use('/api/gardens', gardenRoutes);
app.use("/api/nfc", nfcRoutes);

// ============================================================
// ROUTE SENSORS - Bounty #742
// ============================================================
const sensorRoutes = require('./routes/sensors');
app.use('/api/sensors', sensorRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'MyZubster Marketplace API - Modalità Gardens'
  });
});

// Root
app.get('/', (req, res) => {
  res.json({ 
    message: 'MyZubster Marketplace API', 
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      gardens: '/api/gardens',
      sensors: '/api/sensors',
      garden_map: '/garden-map.html'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Errore:', err.message);
  res.status(500).json({ error: err.message });
});

// Avvia server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗺️  Mappa: http://localhost:${PORT}/garden-map.html`);
  console.log(`🌱 Gardens API: http://localhost:${PORT}/api/gardens`);
  console.log(`📡 Sensors API: http://localhost:${PORT}/api/sensors`);
  console.log('✅ Gardens routes loaded');
  console.log('✅ Sensors routes loaded');
  console.log('✅ Frontend servito da /frontend');
});

module.exports = app;

// Endpoint per robot - riceve job dai robot
app.post('/api/robot/assign', (req, res) => {
  const { robotId, jobId, clientId, amount, currency, description, location } = req.body;
  
  if (!robotId || !jobId || !clientId || !amount) {
    return res.status(400).json({ error: 'robotId, jobId, clientId and amount are required' });
  }

  // Crea un job nel sistema
  const job = {
    id: jobId,
    robotId,
    clientId,
    amount,
    currency: currency || 'MYZ',
    description: description || 'Pulizia urbana',
    location: location || 'Rimini',
    status: 'assigned',
    createdAt: new Date().toISOString()
  };

  // Qui si potrebbe salvare nel database

  res.json({
    success: true,
    message: 'Job assegnato con successo',
    job
  });
});

// Root route - redirect al frontend o mostra stato
app.get('/', (req, res) => {
  res.json({
    message: 'MyZubster Marketplace API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health',
      gardens: '/api/gardens',
      sensors: '/api/sensors',
      map: '/garden-map.html'
    },
    onion: 'http://auxfvwqi6zzerjmhmqqzbdppemwqpv7z4pe5fwcrlovnlr6pzt7ggjyd.onion'
  });
});
