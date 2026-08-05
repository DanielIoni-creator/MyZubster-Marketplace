const mongoose = require('mongoose');

const PlantSchema = new mongoose.Schema({
  species: { type: String, required: true },
  place: { type: String, required: true },
  description: { type: String },
  registeredBy: { type: String, required: true },
  registeredAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

// ✅ Nessun indice 2dsphere

module.exports = mongoose.model('Plant', PlantSchema);
