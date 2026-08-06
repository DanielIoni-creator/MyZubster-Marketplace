const express = require('express');
const router = express.Router();
const gardenService = require('../services/gardenService');

// GET /api/gardens/nearby - Orti vicini (geolocalizzazione) - DEVE ESSERE PRIMA DI :id
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }
    
    const gardens = await gardenService.findNearbyGardens(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : 5000
    );
    
    res.json({
      success: true,
      data: gardens,
      count: gardens.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/gardens - Lista tutti gli orti
router.get('/', async (req, res) => {
  try {
    const gardens = await gardenService.getAllGardens();
    res.json({
      success: true,
      data: gardens,
      count: gardens.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/gardens/:id - Dettaglio orto (DEVE ESSERE DOPO /nearby)
router.get('/:id', async (req, res) => {
  try {
    const garden = await gardenService.getGardenById(req.params.id);
    if (!garden) {
      return res.status(404).json({ error: 'Garden not found' });
    }
    res.json({
      success: true,
      data: garden
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/gardens - Crea nuovo orto
router.post('/', async (req, res) => {
  try {
    const garden = await gardenService.createGarden(req.body);
    res.status(201).json({
      success: true,
      data: garden,
      message: 'Garden created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/gardens/:id - Aggiorna orto
router.put('/:id', async (req, res) => {
  try {
    const garden = await gardenService.updateGarden(req.params.id, req.body);
    if (!garden) {
      return res.status(404).json({ error: 'Garden not found' });
    }
    res.json({
      success: true,
      data: garden,
      message: 'Garden updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/gardens/:id - Elimina orto
router.delete('/:id', async (req, res) => {
  try {
    const garden = await gardenService.deleteGarden(req.params.id);
    if (!garden) {
      return res.status(404).json({ error: 'Garden not found' });
    }
    res.json({
      success: true,
      message: 'Garden deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
