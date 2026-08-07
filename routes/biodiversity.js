const express = require('express');
const router = express.Router();
const Biodiversity = require('../models/Biodiversity');
const MLService = require('../services/mlService');

// GET /api/biodiversity/garden/:gardenId
router.get('/garden/:gardenId', async (req, res) => {
    try {
        const { gardenId } = req.params;
        const { period = 'last_30_days' } = req.query;
        
        const data = await Biodiversity.find({ gardenId })
            .sort({ date: -1 })
            .limit(50);
        
        res.json({ success: true, data, count: data.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/biodiversity/observe
router.post('/observe', async (req, res) => {
    try {
        const { gardenId, species, observations } = req.body;
        
        const biodiversity = new Biodiversity({
            gardenId,
            species,
            observations,
            date: new Date(),
            metrics: {
                biodiversityIndex: Math.random() * 0.5 + 0.5,
                pollinatorActivity: Math.random() * 100,
                speciesCount: species.length,
                ecosystemHealth: Math.random() * 0.3 + 0.7
            }
        });
        
        await biodiversity.save();
        res.status(201).json({ success: true, data: biodiversity });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/biodiversity/stats/:gardenId
router.get('/stats/:gardenId', async (req, res) => {
    try {
        const { gardenId } = req.params;
        const data = await Biodiversity.find({ gardenId });
        
        if (data.length === 0) {
            return res.json({ success: true, data: null });
        }
        
        const stats = {
            totalObservations: data.length,
            avgBiodiversityIndex: 0,
            avgEcosystemHealth: 0,
            topSpecies: {},
            recommendations: []
        };
        
        data.forEach(d => {
            stats.avgBiodiversityIndex += d.metrics.biodiversityIndex || 0;
            stats.avgEcosystemHealth += d.metrics.ecosystemHealth || 0;
            d.species.forEach(s => {
                stats.topSpecies[s.name] = (stats.topSpecies[s.name] || 0) + 1;
            });
        });
        
        const count = data.length;
        stats.avgBiodiversityIndex = parseFloat((stats.avgBiodiversityIndex / count).toFixed(2));
        stats.avgEcosystemHealth = parseFloat((stats.avgEcosystemHealth / count).toFixed(2));
        
        // Genera raccomandazioni
        if (stats.avgBiodiversityIndex < 0.5) {
            stats.recommendations.push('🌱 Plant more native species to increase biodiversity');
        }
        if (stats.avgEcosystemHealth < 0.6) {
            stats.recommendations.push('🔄 Improve soil health with compost and organic matter');
        }
        
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
