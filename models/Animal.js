const mongoose = require('mongoose');

const AnimalSchema = new mongoose.Schema({
  species: { type: String, required: true },
  location: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true,
    validate: {
      validator: function(v) {
        return typeof v === 'string' || 
               (typeof v === 'object' && v.type === 'Point' && Array.isArray(v.coordinates));
      },
      message: 'location must be a string or GeoJSON Point'
    }
  },
  description: { type: String },
  registeredBy: { type: String, required: true },
  registeredAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

module.exports = mongoose.model('Animal', AnimalSchema);
