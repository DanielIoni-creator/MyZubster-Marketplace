const mongoose = require('mongoose');

const GardenSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    comune: { type: String, required: true, index: true }, // Nome del comune
    comuneId: { type: String, index: true }, // ID univoco del comune
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [lng, lat]
    },
    size: { type: Number, default: 0 },
    beds: { type: Number, default: 0 },
    crops: [String],
    type: { 
        type: String, 
        enum: ['urban', 'comune', 'community', 'school', 'rooftop', 'park', 'social'],
        default: 'urban'
    },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'planning', 'inactive'],
        default: 'active'
    },
    isPublic: { type: Boolean, default: true },
    // Dati amministrativi
    office: String,
    manager: String,
    email: String,
    services: [String],
    notes: String,
    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Indici per query veloci
GardenSchema.index({ comune: 1, status: 1 });
GardenSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Garden', GardenSchema);
