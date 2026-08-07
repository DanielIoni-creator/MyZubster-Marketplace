const express = require('express');
const router = express.Router();

// Mock Garden Sensor & Harvest Telemetry Data Store
const GARDEN_SECTORS = [
  { id: 'sec_1', name: 'Ortaggi a Foglia', moisture: 78, tempC: 22.4, status: 'OPTIMAL' },
  { id: 'sec_2', name: 'Pomodori & Peperoni', moisture: 64, tempC: 24.1, status: 'OPTIMAL' },
  { id: 'sec_3', name: 'Erbe Aromatiche', moisture: 52, tempC: 23.0, status: 'ATTENTION_NEEDED' }
];

// GET /api/dashboard/orti/telemetry — Fetch live garden visualization data
router.get('/telemetry', (req, res) => {
  return res.status(200).json({
    success: true,
    overview: {
      totalSectors: GARDEN_SECTORS.length,
      averageMoisture: 64.6,
      averageTempC: 23.1,
      activeRobots: 4,
      lastIrrigation: new Date(Date.now() - 3600000).toISOString()
    },
    sectors: GARDEN_SECTORS,
    timestamp: new Date().toISOString()
  });
});

// POST /api/dashboard/orti/irrigate — Trigger targeted sector irrigation
router.post('/irrigate', (req, res) => {
  const { sectorId, durationMinutes } = req.body;

  if (!sectorId || !durationMinutes) {
    return res.status(400).json({ success: false, error: 'sectorId and durationMinutes required' });
  }

  const sector = GARDEN_SECTORS.find(s => s.id === sectorId);
  if (!sector) {
    return res.status(404).json({ success: false, error: 'Garden sector not found' });
  }

  sector.moisture = Math.min(100, sector.moisture + 15);
  sector.status = 'OPTIMAL';

  return res.status(200).json({
    success: true,
    action: {
      sectorId,
      durationMinutes,
      newMoisture: sector.moisture,
      status: 'IRRIGATING',
      triggeredAt: new Date().toISOString()
    }
  });
});

module.exports = router;
