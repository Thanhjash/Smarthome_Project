// models/sensor.mjs
import mongoose from 'mongoose';

/**
 * Enhanced Sensor Schema with improved flexibility and validation
 * Designed to support multiple device types and sensor types
 */
const sensorSchema = new mongoose.Schema({
  // === Device Identification ===
  
  // Device identifier
  deviceId: {
    type: String,
    required: true
    // Removed index: true to fix duplicate index warning
  },
  
  // Device type
  deviceType: {
    type: String,
    default: 'main'
    // Removed index: true to fix duplicate index warning
  },
  
  // Device location
  location: {
    type: String,
    default: null
    // Removed index: true to fix duplicate index warning
  },
  
  // === Sensor Readings ===
  
  // Temperature in Celsius
  temperature: { 
    type: Number, 
    default: null,
    min: -50,
    max: 100
  },
  
  // Humidity percentage
  humidity: { 
    type: Number, 
    default: null,
    min: 0,
    max: 100
  },
  
  // Light level in lux
  lightLevel: { 
    type: Number, 
    default: null,
    min: 0
  },
  
  // CO2 level in ppm
  co2Level: { 
    type: Number, 
    default: null,
    min: 0
  },
  
  // CO level in ppm
  coLevel: { 
    type: Number, 
    default: null,
    min: 0
  },
  
  // LPG level in ppm
  lpgLevel: { 
    type: Number, 
    default: null,
    min: 0
  },
  
  // Smoke level in ppm
  smokeLevel: { 
    type: Number, 
    default: null,
    min: 0
  },
  
  // NH3 level in ppm
  nh3Level: { 
    type: Number, 
    default: null,
    min: 0
  },
  
  // Flame detected (boolean)
  flameDetected: { 
    type: Boolean, 
    default: false
  },
  
  // === Metadata ===
  
  // Reading timestamp
  timestamp: { 
    type: Date, 
    default: Date.now
    // Removed index: true to fix duplicate index warning
  },
  
  // Data source (raw, filtered, aggregated)
  dataSource: {
    type: String,
    enum: ['raw', 'filtered', 'aggregated'],
    default: 'raw'
  },
  
  // Reading quality (0-100%)
  quality: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  
  // Aggregation period (for aggregated data)
  aggregationPeriod: {
    type: String,
    enum: [null, 'minute', 'hour', 'day', 'week', 'month'],
    default: null
  }
}, 
// Schema options
{
  // Allow storing fields not defined in schema
  strict: false,
  
  // Add timestamps for record-keeping
  timestamps: true
});

// === Indexes for performance optimization ===

// Individual indexes - consolidated from schema definition
sensorSchema.index({ deviceId: 1 });
sensorSchema.index({ deviceType: 1 });
sensorSchema.index({ location: 1 });

// Time-based indexes for queries by time range
sensorSchema.index({ timestamp: -1 });
sensorSchema.index({ deviceId: 1, timestamp: -1 });

// Compound indexes for filtered queries
sensorSchema.index({ deviceId: 1, dataSource: 1 });
sensorSchema.index({ deviceId: 1, aggregationPeriod: 1 });
sensorSchema.index({ deviceId: 1, temperature: 1 });
sensorSchema.index({ deviceId: 1, co2Level: 1 });
sensorSchema.index({ deviceId: 1, flameDetected: 1 });

// TTL index for automatic data cleanup - this creates a timestamp:1 index
// This was creating a duplicate with the timestamp:1 in the schema definition
sensorSchema.index({ timestamp: 1 }, { 
  expireAfterSeconds: 30 * 24 * 60 * 60 
});

// === Static methods ===

// Get latest readings for a specific device
sensorSchema.statics.getLatestByDevice = function(deviceId) {
  return this.findOne({ deviceId })
    .sort({ timestamp: -1 });
};

// Get readings for the last N hours
sensorSchema.statics.getLastNHours = function(deviceId, hours = 24) {
  const since = new Date();
  since.setHours(since.getHours() - hours);
  
  return this.find({
    deviceId,
    timestamp: { $gte: since }
  }).sort({ timestamp: -1 });
};

// Get historic data with aggregation
sensorSchema.statics.getHistoricData = async function(deviceId, sensorType, startTime, endTime, interval = 'hour') {
  // Convert to proper format if string dates provided
  startTime = typeof startTime === 'string' ? new Date(startTime) : startTime;
  endTime = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  // Map interval to MongoDB date truncation unit
  const timeUnit = {
    minute: { minute: 1 },
    hour: { hour: 1 },
    day: { day: 1 },
    week: { week: 1 },
    month: { month: 1 }
  }[interval] || { hour: 1 };
  
  // Build pipeline for aggregation
  const pipeline = [
    {
      $match: {
        deviceId,
        timestamp: { $gte: startTime, $lte: endTime }
      }
    },
    {
      $group: {
        _id: {
          $dateTrunc: {
            date: "$timestamp",
            unit: Object.keys(timeUnit)[0],
            binSize: Object.values(timeUnit)[0]
          }
        },
        avgValue: { $avg: `$${sensorType}` },
        minValue: { $min: `$${sensorType}` },
        maxValue: { $max: `$${sensorType}` },
        count: { $sum: 1 }
      }
    },
    { 
      $sort: { "_id": 1 } 
    },
    {
      $project: {
        timestamp: "$_id",
        avg: "$avgValue",
        min: "$minValue",
        max: "$maxValue",
        count: 1,
        _id: 0
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Create model
// Use existing model if already defined (prevents model overwrite warning)
const Sensor = mongoose.models.Sensor || mongoose.model('Sensor', sensorSchema);

export default Sensor;