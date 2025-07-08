// models/Threshold.mjs
import mongoose from 'mongoose';

const thresholdSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  temperature: {
    type: Number,
    default: 30,
    min: 0,
    max: 100
  },
  humidity: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  light: {
    type: Number,
    default: 300,
    min: 0
  },
  co2: {
    type: Number,
    default: 1000,
    min: 0
  },
  co: {
    type: Number,
    default: 50,
    min: 0
  },
  lpg: {
    type: Number,
    default: 500,
    min: 0
  },
  smoke: {
    type: Number,
    default: 100,
    min: 0
  },
  nh3: {
    type: Number,
    default: 10,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Removed duplicate index: thresholdSchema.index({ deviceId: 1 });

const Threshold = mongoose.models.Threshold || mongoose.model('Threshold', thresholdSchema);

export default Threshold;