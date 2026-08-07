const express = require('express');
const router = express.Router();
const Garden = require('../models/Garden');

// === REGISTRAZIONE ORTO (CON COMUNE) ===
router.post('/register', async (req, res) => {
    try {
        const { name, address, comune, location, size, crops, type, isPublic } = req.body;
        
        if (!name || !address || !comune || !location) {
            return res.status(400).json({ 
                error: 'name, address, comune and location are required' 
            });
        }
        
        const garden = new Garden({
            name,
            address,
            comune,
            comuneId: comune.toLowerCase().replace(/\s/g, '_'),
            location,
            size: size || 0,
            crops: crops || [],
            type: type || 'urban',
            isPublic: isPublic !== undefined ? isPublic : true,
            status: 'active'
        });
        
        await garden.save();
        res.status(201).json({ success: true, data: garden });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === LISTA ORTI PER COMUNE ===
router.get('/comune/:comuneId', async (req, res) => {
    try {
        const { comuneId } = req.params;
        const gardens = await Garden.find({ 
            comuneId: comuneId.toLowerCase().replace(/\s/g, '_'),
            status: 'active' 
        });
        res.json({ success: true, data: gardens, count: gardens.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === LISTA ORTI PUBBLICI PER COMUNE ===
router.get('/comune/:comuneId/public', async (req, res) => {
    try {
        const { comuneId } = req.params;
        const gardens = await Garden.find({ 
            comuneId: comuneId.toLowerCase().replace(/\s/g, '_'),
            isPublic: true,
            status: 'active' 
        });
        res.json({ success: true, data: gardens, count: gardens.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === STATISTICHE PER COMUNE ===
router.get('/comune/:comuneId/stats', async (req, res) => {
    try {
        const { comuneId } = req.params;
        const id = comuneId.toLowerCase().replace(/\s/g, '_');
        
        const stats = await Garden.aggregate([
            { $match: { comuneId: id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    avgSize: { $avg: '$size' }
                }
            }
        ]);
        
        const total = await Garden.countDocuments({ comuneId: id });
        
        res.json({ 
            success: true, 
            data: { 
                total,
                byStatus: stats,
                comune: comuneId
            } 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === LISTA TUTTI I COMUNI ===
router.get('/comuni', async (req, res) => {
    try {
        const comuni = await Garden.distinct('comune', { status: 'active' });
        res.json({ success: true, data: comuni, count: comuni.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === REGISTRAZIONE ORTO COMUNALE ===
router.post('/comune/register', async (req, res) => {
    try {
        const { 
            name, address, comune, location, size, beds, 
            status, office, manager, email, services 
        } = req.body;
        
        if (!name || !address || !comune || !location) {
            return res.status(400).json({ 
                error: 'name, address, comune and location are required' 
            });
        }
        
        const garden = new Garden({
            name,
            address,
            comune,
            comuneId: comune.toLowerCase().replace(/\s/g, '_'),
            location,
            size: size || 0,
            beds: beds || 0,
            status: status || 'active',
            type: 'comune',
            office,
            manager,
            email,
            services: services || [],
            isPublic: true
        });
        
        await garden.save();
        res.status(201).json({ success: true, data: garden });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === ESPORTA DATI PER COMUNE ===
router.get('/comune/:comuneId/export', async (req, res) => {
    try {
        const { comuneId } = req.params;
        const id = comuneId.toLowerCase().replace(/\s/g, '_');
        const gardens = await Garden.find({ comuneId: id });
        
        const csv = 'Nome,Indirizzo,Comune,Dimensioni,Tipo,Stato\n' + 
            gardens.map(g => `${g.name},"${g.address}",${g.comune},${g.size},${g.type},${g.status}`).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=orti_${comuneId}.csv`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === ROUTE GENERICHE (ID) ===
router.get('/:id', async (req, res) => {
    try {
        const garden = await Garden.findById(req.params.id);
        if (!garden) return res.status(404).json({ error: 'Garden not found' });
        res.json({ success: true, data: garden });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const garden = await Garden.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!garden) return res.status(404).json({ error: 'Garden not found' });
        res.json({ success: true, data: garden });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const garden = await Garden.findByIdAndDelete(req.params.id);
        if (!garden) return res.status(404).json({ error: 'Garden not found' });
        res.json({ success: true, message: 'Garden deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

// GET /api/gardens/comuni - Lista tutti i comuni con orti attivi
router.get('/comuni', async (req, res) => {
    try {
        const comuni = await Garden.distinct('comune', { status: 'active' });
        res.json({ success: true, data: comuni, count: comuni.length });
    } catch (error) {
        console.error('Errore lista comuni:', error);
        res.status(500).json({ error: error.message });
    }
});
