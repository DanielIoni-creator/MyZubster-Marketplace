const mongoose = require('mongoose');

const gardenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    }
  },
  address: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    min: 0
  },
  crops: [{
    type: String,
    trim: true
  }],
  sensors: [{
    type: String
  }],
  description: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

gardenSchema.index({ location: '2dsphere' });

gardenSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Garden', gardenSchema);
