/**
 * AgricoloBot - MyZubster Robot Software per Orti Urbani
 * 
 * Questo robot:
 * 1. Monitora i dati dei sensori Arduino (pH, EC, temperatura, umidità)
 * 2. Analizza lo stato del suolo e suggerisce azioni
 * 3. Genera report automatici per gli agricoltori
 * 4. Si integra con il sistema di escrow per i pagamenti
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.ROBOT_PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connessione MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster')
  .then(() => console.log('✅ MongoDB connesso (AgricoloBot)'))
  .catch(err => console.error('❌ MongoDB errore:', err));

// Import moduli
const agricoloBot = require('./src/agricoloBot');
const escrowIntegration = require('./src/escrowIntegration');
const sensorReader = require('./src/sensorReader');
const reportGenerator = require('./src/reportGenerator');

// ============================================================
// API ENDPOINTS PER IL ROBOT
// ============================================================

// 1. Assegna un lavoro di monitoraggio
app.post('/api/robot/agricolo/assign', async (req, res) => {
  try {
    const { gardenId, duration, wallet } = req.body;
    if (!gardenId || !duration || !wallet) {
      return res.status(400).json({ error: 'gardenId, duration and wallet are required' });
    }

    // Crea il lavoro
    const job = await agricoloBot.createJob({
      gardenId,
      duration,
      wallet,
      status: 'assigned'
    });

    // Inizia l'escrow
    const escrowResult = await escrowIntegration.initEscrow({
      jobId: job._id,
      wallet,
      amount: 100 // 100 MYZ
    });

    res.json({
      success: true,
      data: {
        job,
        escrow: escrowResult
      },
      message: 'Lavoro assegnato con successo'
    });
  } catch (error) {
    console.error('Error assigning job:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Esegui il monitoraggio
app.post('/api/robot/agricolo/execute', async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' });
    }

    // Leggi i dati dai sensori
    const sensorData = await sensorReader.readData(jobId);

    // Analizza i dati
    const analysis = await agricoloBot.analyzeData(sensorData);

    // Aggiorna il job
    await agricoloBot.updateJob(jobId, {
      sensorData,
      analysis,
      status: 'in_progress'
    });

    res.json({
      success: true,
      data: {
        jobId,
        sensorData,
        analysis
      },
      message: 'Monitoraggio in esecuzione'
    });
  } catch (error) {
    console.error('Error executing monitoring:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Consegna il report
app.post('/api/robot/agricolo/deliver', async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' });
    }

    // Genera il report
    const report = await reportGenerator.generate(jobId);

    // Consegna il report
    const result = await agricoloBot.deliverReport(jobId, report);

    // Rilascia l'escrow (98 MYZ al robot, 2 MYZ alla piattaforma)
    await escrowIntegration.releaseEscrow({
      jobId,
      robotWallet: process.env.ROBOT_WALLET,
      platformWallet: process.env.PLATFORM_WALLET,
      amount: 98,
      fee: 2
    });

    res.json({
      success: true,
      data: {
        jobId,
        report,
        payment: {
          robot: 98,
          platform: 2
        }
      },
      message: 'Report consegnato con successo'
    });
  } catch (error) {
    console.error('Error delivering report:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Stato del lavoro
app.get('/api/robot/agricolo/status/:id', async (req, res) => {
  try {
    const job = await agricoloBot.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/robot/agricolo/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    robot: 'AgricoloBot'
  });
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`🤖 AgricoloBot avviato sulla porta ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📡 Endpoint: /api/robot/agricolo`);
});

module.exports = app;
