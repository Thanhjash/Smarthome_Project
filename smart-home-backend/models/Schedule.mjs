// models/Schedule.mjs
import mongoose from 'mongoose';

/**
 * Schedule Schema for automated device control
 * Supports one-time, daily, weekly, and custom schedules
 */
const scheduleSchema = new mongoose.Schema({
  // Device to control
  deviceId: { 
    type: String, 
    required: true
    // Removed index: true to fix duplicate index warning
  },
  
  // User who created the schedule
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Schedule name/description
  name: { 
    type: String, 
    required: true,
    default: 'New Schedule'
  },
  
  // Schedule enabled flag
  enabled: { 
    type: Boolean, 
    default: true
    // Removed index: true to fix duplicate index warning
  },
  
  // Schedule type (once, daily, weekly, custom)
  scheduleType: {
    type: String,
    enum: ['once', 'daily', 'weekly', 'custom'],
    required: true
    // Removed index: true to fix duplicate index warning
  },
  
  // === Schedule timing information ===
  
  // For once: specific date and time
  dateTime: { 
    type: Date,
    default: null
  },
  
  // For daily: time in 24-hour format (HH:MM)
  timeOfDay: { 
    type: String,
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:MM)!`
    },
    default: null
  },
  
  // For weekly: days of week (array of 0-6, where 0 is Sunday)
  daysOfWeek: {
    type: [Number],
    validate: {
      validator: function(v) {
        return v.every(day => day >= 0 && day <= 6);
      },
      message: props => `Days of week must be between 0 and 6!`
    },
    default: []
  },
  
  // For custom: cron expression
  cronExpression: {
    type: String,
    default: null
  },
  
  // === Action to perform ===
  
  // Target device component to control
  targetComponent: { 
    type: String,
    enum: ['led', 'buzzer', 'motorA', 'motorB', 'autoMode'],
    required: true
  },
  
  // Value to set (could be boolean or number)
  targetValue: { 
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // === Optional conditions ===
  
  // Sensor conditions that must be met for schedule to execute
  conditions: [{
    sensorType: {
      type: String,
      enum: ['temperature', 'humidity', 'lightLevel', 'co2Level', 'coLevel', 'lpgLevel', 'smokeLevel', 'nh3Level', 'flameDetected'],
      required: true
    },
    operator: {
      type: String,
      enum: ['>', '>=', '=', '<=', '<', '!='],
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  }],
  
  // === Tracking information ===
  
  // Last execution time
  lastExecuted: {
    type: Date,
    default: null
  },
  
  // Next scheduled execution time
  nextExecution: {
    type: Date,
    default: null
    // Removed index: true to fix duplicate index warning
  },
  
  // Last execution result
  lastResult: {
    success: { type: Boolean, default: null },
    message: { type: String, default: null },
    timestamp: { type: Date, default: null }
  },
  
  // Creation and modification timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Define individual indexes explicitly
scheduleSchema.index({ deviceId: 1 });
scheduleSchema.index({ enabled: 1 });
scheduleSchema.index({ scheduleType: 1 });
scheduleSchema.index({ nextExecution: 1 });
scheduleSchema.index({ userId: 1 });

// Compound indexes for query optimization
scheduleSchema.index({ deviceId: 1, enabled: 1 });
scheduleSchema.index({ deviceId: 1, scheduleType: 1 });
scheduleSchema.index({ nextExecution: 1, enabled: 1 });
scheduleSchema.index({ userId: 1, deviceId: 1 });

// Static methods
scheduleSchema.statics.findActiveSchedules = function() {
  return this.find({ 
    enabled: true,
    nextExecution: { $ne: null }
  }).sort({ nextExecution: 1 });
};

scheduleSchema.statics.findByDeviceId = function(deviceId) {
  return this.find({ deviceId });
};

scheduleSchema.statics.findPendingExecution = function() {
  const now = new Date();
  return this.find({
    enabled: true,
    nextExecution: { $lte: now }
  }).sort({ nextExecution: 1 });
};

// Instance methods
scheduleSchema.methods.updateNextExecution = function() {
  const now = new Date();
  
  switch (this.scheduleType) {
    case 'once':
      // For one-time schedules, next execution is the dateTime
      this.nextExecution = this.dateTime;
      break;
      
    case 'daily':
      // For daily schedules, set next execution to today at the specified time
      if (this.timeOfDay) {
        const [hours, minutes] = this.timeOfDay.split(':').map(Number);
        const next = new Date();
        next.setHours(hours, minutes, 0, 0);
        
        // If the time has already passed today, set it for tomorrow
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        
        this.nextExecution = next;
      }
      break;
      
    case 'weekly':
      // For weekly schedules, find the next occurrence of the specified days
      if (this.daysOfWeek && this.daysOfWeek.length > 0 && this.timeOfDay) {
        const [hours, minutes] = this.timeOfDay.split(':').map(Number);
        const currentDay = now.getDay();
        
        // Sort days of week in ascending order
        const sortedDays = [...this.daysOfWeek].sort((a, b) => a - b);
        
        // Find the next day of week
        let nextDay = sortedDays.find(day => day > currentDay);
        
        // If no day found, wrap around to the first day in the list
        if (nextDay === undefined) {
          nextDay = sortedDays[0];
          // Calculate days until next occurrence
          const daysUntilNext = (nextDay + 7 - currentDay) % 7;
          
          const next = new Date();
          next.setDate(now.getDate() + daysUntilNext);
          next.setHours(hours, minutes, 0, 0);
          
          this.nextExecution = next;
        } else {
          // Calculate days until next occurrence
          const daysUntilNext = nextDay - currentDay;
          
          const next = new Date();
          next.setDate(now.getDate() + daysUntilNext);
          next.setHours(hours, minutes, 0, 0);
          
          // If this would result in a time in the past, add 7 days
          if (next <= now) {
            next.setDate(next.getDate() + 7);
          }
          
          this.nextExecution = next;
        }
      }
      break;
      
    // For custom schedules, nextExecution is calculated by the scheduler service
    case 'custom':
      // Schedule service will handle this
      break;
  }
  
  return this.save();
};

scheduleSchema.methods.recordExecution = function(success, message = '') {
  this.lastExecuted = new Date();
  this.lastResult = {
    success,
    message,
    timestamp: new Date()
  };
  
  // Update the next execution time
  this.updateNextExecution();
  
  return this.save();
};

// Middleware
scheduleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Ensure nextExecution is set correctly
  if (this.isModified('enabled') || 
      this.isModified('scheduleType') || 
      this.isModified('dateTime') || 
      this.isModified('timeOfDay') || 
      this.isModified('daysOfWeek')) {
    if (this.enabled) {
      // Only update next execution if schedule is enabled
      this.updateNextExecution();
    } else {
      // If disabled, clear next execution
      this.nextExecution = null;
    }
  }
  
  next();
});

// Create model - Use existing model if already defined
const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);

export default Schedule;
