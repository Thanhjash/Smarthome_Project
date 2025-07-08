// models/ManualControl.mjs
import mongoose from 'mongoose';

const manualControlSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  led: {
    type: Boolean,
    default: false
  },
  motorA: {
    type: Boolean,
    default: false
  },
  motorB: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Removed duplicate index: manualControlSchema.index({ deviceId: 1 });

const ManualControl = mongoose.models.ManualControl || mongoose.model('ManualControl', manualControlSchema);

export default ManualControl;