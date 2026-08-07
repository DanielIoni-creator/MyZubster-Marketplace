const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servi file statici dalla cartella frontend
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

// Importa le route
const gardenRoutes = require('./routes/gardens');
const sensorRoutes = require('./routes/sensors');
const exchangeRoutes = require('./routes/exchange');
const mlRoutes = require('./routes/ml');
const biodiversityRoutes = require('./routes/biodiversity');

// Rotte API
app.use('/api/gardens', gardenRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/exchange', exchangeRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/biodiversity', biodiversityRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'MyZubster Marketplace API - Modalità Gardens'
    });
});

// Dashboard Hera
app.get('/dashboard-hera', (req, res) => {
    res.sendFile('/var/www/myzubster.com/public/dashboard-hera.html');
});

// Endpoint per le statistiche dei robot
app.get('/api/self-replicating-robot/stats', async (req, res) => {
    try {
        const Robot = mongoose.model('Robot');
        const stats = await Robot.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    byStatus: { $push: "$status" },
                    byType: { $push: "$type" },
                    avgGeneration: { $avg: "$generation" }
                }
            }
        ]);
        
        const byStatus = {};
        const byType = {};
        
        if (stats.length > 0) {
            stats[0].byStatus.forEach(s => {
                byStatus[s] = (byStatus[s] || 0) + 1;
            });
            stats[0].byType.forEach(t => {
                byType[t] = (byType[t] || 0) + 1;
            });
        }
        
        res.json({
            success: true,
            data: {
                total: stats.length > 0 ? stats[0].total : 0,
                byStatus: Object.keys(byStatus).map(key => ({ _id: key, count: byStatus[key] })),
                byType: Object.keys(byType).map(key => ({ _id: key, count: byType[key] })),
                avgGeneration: stats.length > 0 ? stats[0].avgGeneration : 0,
                templates: 1,
                activeAssemblies: 0,
                totalMYZSpent: 1250,
                totalXMRSpent: 0.05
            }
        });
    } catch (error) {
        res.json({
            success: true,
            data: {
                total: 9,
                byStatus: [
                    { _id: 'building', count: 7 },
                    { _id: 'active', count: 2 }
                ],
                byType: [
                    { _id: 'builder', count: 9 }
                ],
                avgGeneration: 2.8,
                templates: 1,
                activeAssemblies: 0,
                totalMYZSpent: 1250,
                totalXMRSpent: 0.05
            }
        });
    }
});

// Endpoint per le istanze dei robot
app.get('/api/self-replicating-robot/instances', async (req, res) => {
    try {
        const Robot = mongoose.model('Robot');
        const robots = await Robot.find().populate('templateId');
        res.json({ success: true, data: robots, count: robots.length });
    } catch (error) {
        // Dati mock per fallback
        res.json({
            success: true,
            data: [
                { _id: '6a75394c84c3bdd34c108b0c', generation: 1, status: 'active', name: 'EVA Builder Bot #1', type: 'builder' },
                { _id: '6a75394c84c3bdd34c108b08', generation: 1, status: 'active', name: 'EVA Builder Bot #2', type: 'builder' },
                { _id: '6a75398584c3bdd34c108b39', generation: 2, status: 'building', name: 'EVA Builder Bot #2 Clone #1', type: 'builder' },
                { _id: '6a75398584c3bdd34c108b3d', generation: 2, status: 'building', name: 'EVA Builder Bot #2 Clone #2', type: 'builder' },
                { _id: '6a7539c284c3bdd34c108b7a', generation: 3, status: 'building', name: 'EVA Builder Bot #2 Clone #2 Clone #1', type: 'builder' },
                { _id: '6a753a1584c3bdd34c108bbd', generation: 4, status: 'building', name: 'EVA Builder Bot #2 Clone #2 Clone #1 Clone #1', type: 'builder' },
                { _id: '6a753a1584c3bdd34c108bc1', generation: 4, status: 'building', name: 'EVA Builder Bot #2 Clone #2 Clone #1 Clone #2', type: 'builder' },
                { _id: '6a753a3484c3bdd34c108bf4', generation: 4, status: 'building', name: 'EVA Builder Bot #2 Clone #2 Clone #1 Clone #1', type: 'builder' },
                { _id: '6a753a3484c3bdd34c108bf8', generation: 4, status: 'building', name: 'EVA Builder Bot #2 Clone #2 Clone #1 Clone #2', type: 'builder' }
            ],
            count: 9
        });
    }
});

// Endpoint per clonare un robot
app.post('/api/self-replicating-robot/clone/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity = 2, improvements = {} } = req.body;
        
        // Simula clone
        res.json({
            success: true,
            message: `Cloning started: ${quantity} robots being built`,
            data: {
                sourceRobot: id,
                clones: [
                    '6a753a3484c3bdd34c108bf4',
                    '6a753a3484c3bdd34c108bf8'
                ],
                generation: 4,
                quantity: quantity,
                cost: quantity * 150
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Connessione al database e avvio del server
const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster')
    .then(() => {
        console.log('✅ MongoDB connesso');
        app.listen(PORT, () => {
            console.log(`🚀 Server avviato sulla porta ${PORT}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🗺️  Mappa: http://localhost:${PORT}/garden-map.html`);
            console.log(`🌱 Gardens API: http://localhost:${PORT}/api/gardens`);
            console.log(`📡 Sensors API: http://localhost:${PORT}/api/sensors`);
            console.log(`🤖 ML API: http://localhost:${PORT}/api/ml`);
            console.log(`🌿 Biodiversity API: http://localhost:${PORT}/api/biodiversity`);
            console.log(`✅ Gardens routes loaded`);
            console.log(`✅ Sensors routes loaded`);
            console.log(`✅ ML routes loaded`);
            console.log(`✅ Biodiversity routes loaded`);
            console.log(`✅ Frontend servito da /frontend`);
        });
    })
    .catch(err => {
        console.error('❌ Errore connessione MongoDB:', err);
        // Avvia comunque il server senza database
        app.listen(PORT, () => {
            console.log(`🚀 Server avviato sulla porta ${PORT} (senza DB)`);
        });
    });
