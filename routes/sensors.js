const express = require('express');
const router = express.Router();
const sensorService = require('../services/sensorService');

// POST /api/sensors/data - Invia dati da Arduino
router.post('/data', async (req, res) => {
  try {
    const { gardenId, ph, ec, temperature, humidity, timestamp } = req.body;
    
    if (!gardenId) {
      return res.status(400).json({ error: 'gardenId is required' });
    }

    const data = await sensorService.saveSensorData(gardenId, {
      ph,
      ec,
      temperature,
      humidity,
      timestamp: timestamp || new Date()
    });

    res.status(201).json({
      success: true,
      data,
      message: 'Sensor data saved successfully'
    });
  } catch (error) {
    console.error('Error saving sensor data:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sensors/garden/:gardenId - Storico dati
router.get('/garden/:gardenId', async (req, res) => {
  try {
    const { gardenId } = req.params;
    const { limit = 100 } = req.query;
    
    const history = await sensorService.getGardenHistory(gardenId, parseInt(limit));
    
    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sensors/garden/:gardenId/latest - Ultima lettura
router.get('/garden/:gardenId/latest', async (req, res) => {
  try {
    const { gardenId } = req.params;
    const latest = await sensorService.getLatestReading(gardenId);
    
    if (!latest) {
      return res.status(404).json({ error: 'No readings found for this garden' });
    }
    
    res.json({
      success: true,
      data: latest
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sensors/garden/:gardenId/stats - Statistiche
router.get('/garden/:gardenId/stats', async (req, res) => {
  try {
    const { gardenId } = req.params;
    const stats = await sensorService.calculateStats(gardenId);
    
    if (!stats) {
      return res.status(404).json({ error: 'No data found for this garden' });
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/sensors/data/:id - Elimina lettura (admin)
router.delete('/data/:id', async (req, res) => {
  try {
    const result = await sensorService.deleteReading(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Reading not found' });
    }
    res.json({
      success: true,
      message: 'Reading deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
