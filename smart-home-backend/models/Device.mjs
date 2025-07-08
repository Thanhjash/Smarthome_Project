// models/Device.mjs
import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    default: 'main'
  },
  location: {
    type: String,
    default: null
  },
  state: {
    ledState: {
      type: Boolean,
      default: false
    },
    buzzerState: {
      type: Boolean,
      default: false
    },
    ventilationSpeed: {
      type: Number,
      default: 0,
      min: 0,
      max: 255
    },
    fanSpeed: {
      type: Number,
      default: 0,
      min: 0,
      max: 255
    },
    autoModeEnabled: {
      type: Boolean,
      default: true
    },
    emergencyMode: {
      type: Boolean,
      default: false
    }
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Removed duplicate index: deviceSchema.index({ deviceId: 1 });
deviceSchema.index({ type: 1 });
deviceSchema.index({ location: 1 });
deviceSchema.index({ isOnline: 1 });
deviceSchema.index({ lastSeen: 1 });

// Methods
deviceSchema.methods.getState = function() {
  return this.state;
};

deviceSchema.methods.updateState = function(newState) {
  this.state = { ...this.state, ...newState };
  this.lastUpdated = new Date();
  return this.save();
};

deviceSchema.methods.setOnlineStatus = function(isOnline) {
  this.isOnline = isOnline;
  if (isOnline) {
    this.lastSeen = new Date();
  }
  return this.save();
};

// Statics
deviceSchema.statics.findByDeviceId = function(deviceId) {
  return this.findOne({ deviceId });
};

deviceSchema.statics.getOnlineDevices = function() {
  return this.find({ isOnline: true });
};

deviceSchema.statics.getInactiveDevices = function(minutes = 5) {
  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);
  
  return this.find({
    isOnline: true,
    lastSeen: { $lt: cutoffTime }
  });
};

const Device = mongoose.models.Device || mongoose.model('Device', deviceSchema);

export default Device;